/**
 * Azure Maps Location Monitoring MVP
 * 
 * This implementation uses Azure Maps SDK and Route Directions API to provide
 * accurate road-following routes for employee location tracking.
 * 
 * Key Features:
 * - Professional Azure Maps with enterprise-grade road data
 * - Road-snapped routes using Azure Maps Route Directions API
 * - Check-in/check-out/visit markers with distinct icons
 * - Playback controls with speed adjustment and timeline scrubbing
 * - Multi-route support for multiple employees
 * - Real-time route statistics
 * - Progressive enhancement (shows direct lines first, then road routes)
 * 
 * Azure Maps Features:
 * - Free tier available with Azure account
 * - Enterprise-grade road network data
 * - Support for multiple travel modes (car, pedestrian, bicycle, truck)
 * - Traffic-aware routing
 * - Up to 150 waypoints per route request
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// TODO: Add your Azure Maps subscription key here
// Get your key at: https://learn.microsoft.com/en-us/azure/azure-maps/how-to-manage-authentication
// Free tier available with Azure account
const AZURE_MAPS_KEY = 'YOUR_AZURE_MAPS_KEY';

const API_URL = '/api/locations';
const MAX_WAYPOINTS_PER_REQUEST = 150; // Azure Maps allows up to 150 waypoints
const TRAVEL_MODE = 'car'; // Options: car, pedestrian, bicycle, truck

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let map;
let datasource;
let allLocationData = [];
let allRoutes = {};
let currentRouteId = null;
let currentLocationData = [];
let roadSnappedPath = [];
let markerLayer = null;
let vehicleMarker = null;
let popup = null;

// Playback state
let currentPlaybackIndex = 0;
let playbackInterval = null;
let isPlaying = false;
let playbackSpeed = 1;
let totalDistance = 0;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    // Check if API key is set
    if (AZURE_MAPS_KEY === 'YOUR_AZURE_MAPS_KEY') {
        console.warn('⚠️ Azure Maps key not set. Please update app.js with your subscription key.');
        showLoadingMessage('⚠️ Please set your Azure Maps subscription key in app.js');
        return;
    } else {
        // Hide API key banner if key is set
        document.getElementById('apiKeyBanner').style.display = 'none';
    }
    
    // Initialize Azure Maps
    try {
        map = new atlas.Map('map', {
            center: [79.09, 21.09], // Default center (Nagpur, India) [lng, lat]
            zoom: 12,
            language: 'en-US',
            authOptions: {
                authType: 'subscriptionKey',
                subscriptionKey: AZURE_MAPS_KEY
            }
        });
        
        // Wait for map to be ready
        map.events.add('ready', function() {
            console.log('✅ Azure Maps initialized successfully');
            
            // Create a data source for route lines and markers
            datasource = new atlas.source.DataSource();
            map.sources.add(datasource);
            
            // Add a line layer for the route
            map.layers.add(new atlas.layer.LineLayer(datasource, 'route-line', {
                strokeColor: '#0078D4',
                strokeWidth: 4,
                strokeOpacity: 0.8,
                filter: ['==', ['get', 'type'], 'route']
            }));
            
            // Add a line layer for the straight-line route (lower opacity)
            map.layers.add(new atlas.layer.LineLayer(datasource, 'straight-line', {
                strokeColor: '#d3d3d3',
                strokeWidth: 3,
                strokeOpacity: 0.5,
                filter: ['==', ['get', 'type'], 'straight']
            }));
            
            // Create a popup (reusable)
            popup = new atlas.Popup({
                pixelOffset: [0, -30],
                closeButton: true
            });
            
            // Add navigation controls
            map.controls.add([
                new atlas.control.ZoomControl(),
                new atlas.control.CompassControl(),
                new atlas.control.StyleControl({ mapStyles: ['road', 'satellite', 'satellite_road_labels'] })
            ], { position: 'top-right' });
            
            document.getElementById('loadDataBtn').disabled = false;
        });
        
        // Initialize event listeners
        initEventListeners();
        
        console.log('🗺️ Azure Maps MVP initialized');
        
    } catch (error) {
        console.error('❌ Error initializing Azure Maps:', error);
        showLoadingMessage('Error: Failed to initialize Azure Maps. Check subscription key.');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function initEventListeners() {
    document.getElementById('loadDataBtn').addEventListener('click', loadLocationData);
    document.getElementById('playBtn').addEventListener('click', startPlayback);
    document.getElementById('pauseBtn').addEventListener('click', pausePlayback);
    document.getElementById('resetBtn').addEventListener('click', resetPlayback);
    
    document.getElementById('speedSlider').addEventListener('input', function(e) {
        playbackSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = playbackSpeed + 'x';
        
        // Restart playback with new speed if currently playing
        if (isPlaying) {
            pausePlayback();
            startPlayback();
        }
    });
    
    document.getElementById('timelineSlider').addEventListener('input', function(e) {
        const value = parseInt(e.target.value);
        if (roadSnappedPath.length > 0) {
            currentPlaybackIndex = Math.floor((value / 100) * roadSnappedPath.length);
            updatePlaybackDisplay();
        }
    });
    
    document.getElementById('routeSelect').addEventListener('change', function(e) {
        const routeId = e.target.value;
        if (routeId) {
            switchToRoute(routeId);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════

async function loadLocationData() {
    showLoading('Loading location data...');
    
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            hideLoading();
            alert('No location data found. Please ensure the backend has data.');
            return;
        }
        
        allLocationData = result.data;
        allRoutes = result.routes || {};
        
        console.log(`📊 Loaded ${allLocationData.length} location points`);
        console.log(`🛣️ Found ${Object.keys(allRoutes).length} routes`);
        
        // Group data by routeId
        const routeGroups = {};
        allLocationData.forEach(loc => {
            const routeId = loc.routeId || 'default';
            if (!routeGroups[routeId]) {
                routeGroups[routeId] = [];
            }
            routeGroups[routeId].push(loc);
        });
        
        // Populate route selector
        populateRouteSelector(routeGroups);
        
        // Load first route
        const firstRouteId = Object.keys(routeGroups)[0];
        if (firstRouteId) {
            currentRouteId = firstRouteId;
            currentLocationData = routeGroups[firstRouteId];
            await displayRoute(currentLocationData);
        }
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        console.error('❌ Error loading location data:', error);
        alert('Error loading data. Please ensure the backend server is running on port 3000.');
    }
}

function populateRouteSelector(routeGroups) {
    const select = document.getElementById('routeSelect');
    select.innerHTML = '';
    
    Object.keys(routeGroups).forEach(routeId => {
        const option = document.createElement('option');
        option.value = routeId;
        const points = routeGroups[routeId].length;
        option.textContent = `${routeId} (${points} points)`;
        select.appendChild(option);
    });
    
    if (Object.keys(routeGroups).length > 1) {
        document.getElementById('routeSelectContainer').style.display = 'block';
    }
}

async function switchToRoute(routeId) {
    showLoading(`Switching to route: ${routeId}...`);
    
    // Stop playback
    pausePlayback();
    
    // Get route data
    const routeData = allLocationData.filter(loc => (loc.routeId || 'default') === routeId);
    
    if (routeData.length > 0) {
        currentRouteId = routeId;
        currentLocationData = routeData;
        await displayRoute(currentLocationData);
    }
    
    hideLoading();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAP DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

async function displayRoute(locations) {
    // Clear existing markers and layers
    clearMap();
    
    // Sort by timestamp
    locations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Step 1: Show immediate straight-line route for instant feedback
    showStraightLineRoute(locations);
    
    // Step 2: Display markers
    displayMarkers(locations);
    
    // Step 3: Update statistics (initial)
    updateStatistics(locations);
    
    // Step 4: Fit map to bounds
    fitMapToBounds(locations);
    
    // Step 5: Update info panel
    updateInfoPanel(locations);
    
    // Step 6: Calculate road-snapped route (progressive enhancement)
    showLoading('Calculating road route with Azure Maps...');
    await calculateRoadRoute(locations);
    hideLoading();
    
    // Step 7: Enable playback controls
    enablePlaybackControls();
    resetPlayback();
}

function showStraightLineRoute(locations) {
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);
    
    // Add straight line as GeoJSON feature
    const straightLine = new atlas.data.Feature(
        new atlas.data.LineString(coordinates),
        { type: 'straight' }
    );
    
    datasource.add(straightLine);
    
    // Set initial roadSnappedPath to straight line for playback
    roadSnappedPath = coordinates;
}

function displayMarkers(locations) {
    locations.forEach((loc, index) => {
        const icon = getMarkerIcon(loc.flag);
        
        // Create an HTML marker for each location
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.textContent = icon;
        markerEl.title = `${loc.flag} - ${new Date(loc.timestamp).toLocaleString()}`;
        
        const htmlMarker = new atlas.HtmlMarker({
            position: [loc.lng, loc.lat],
            htmlContent: `<div class="custom-marker">${icon}</div>`
        });
        
        // Add click event to show popup
        map.events.add('click', htmlMarker, function() {
            popup.setOptions({
                position: [loc.lng, loc.lat],
                content: createPopupHTML(loc, index)
            });
            popup.open(map);
        });
        
        map.markers.add(htmlMarker);
    });
}

function createPopupHTML(loc, index) {
    const timestamp = new Date(loc.timestamp).toLocaleString();
    const flagLabel = getFlagLabel(loc.flag);
    
    return `
        <div class="popup-content">
            <div class="popup-title">${flagLabel}</div>
            <div class="popup-info"><strong>Point #:</strong> ${index + 1}</div>
            <div class="popup-info"><strong>Time:</strong> ${timestamp}</div>
            <div class="popup-info"><strong>Location:</strong> ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</div>
            ${loc.address ? `<div class="popup-info"><strong>Address:</strong> ${loc.address}</div>` : ''}
            <div class="popup-info"><strong>Route:</strong> ${loc.routeId}</div>
        </div>
    `;
}

function getMarkerIcon(flag) {
    const icons = {
        'check_in': '📍',
        'check_out': '🏁',
        'visit': '🏢',
        'normal': '📌'
    };
    return icons[flag] || icons.normal;
}

function getFlagLabel(flag) {
    const labels = {
        'check_in': '📍 Check-in',
        'check_out': '🏁 Check-out',
        'visit': '🏢 Visit',
        'normal': '📌 Location Point'
    };
    return labels[flag] || labels.normal;
}

function fitMapToBounds(locations) {
    if (locations.length === 0) return;
    
    const positions = locations.map(loc => [loc.lng, loc.lat]);
    const bounds = atlas.data.BoundingBox.fromPositions(positions);
    
    map.setCamera({
        bounds: bounds,
        padding: 50
    });
}

function updateInfoPanel(locations) {
    if (locations.length === 0) return;
    
    const startTime = new Date(locations[0].timestamp);
    const endTime = new Date(locations[locations.length - 1].timestamp);
    const duration = calculateDuration(startTime, endTime);
    
    document.getElementById('currentRouteId').textContent = currentRouteId;
    document.getElementById('currentEmployee').textContent = currentRouteId;
    document.getElementById('currentDate').textContent = startTime.toLocaleDateString();
    document.getElementById('currentDuration').textContent = duration;
    document.getElementById('currentStatus').textContent = 'Active';
    
    document.getElementById('infoPanel').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════════════
// AZURE MAPS ROUTING
// ═══════════════════════════════════════════════════════════════════════════

async function calculateRoadRoute(locations) {
    if (locations.length < 2) {
        console.log('Not enough points for routing');
        return;
    }
    
    try {
        // Azure Maps Route Directions API supports up to 150 waypoints per request
        const waypoints = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
        
        // If too many waypoints, sample them intelligently
        let sampledWaypoints;
        if (waypoints.length > MAX_WAYPOINTS_PER_REQUEST) {
            console.log(`⚠️ Route has ${waypoints.length} points. Sampling to ${MAX_WAYPOINTS_PER_REQUEST} waypoints...`);
            sampledWaypoints = sampleWaypoints(locations, MAX_WAYPOINTS_PER_REQUEST);
        } else {
            sampledWaypoints = waypoints.map(wp => `${wp.lat},${wp.lng}`);
        }
        
        console.log(`🛣️ Calculating route with ${sampledWaypoints.length} waypoints...`);
        
        // Build Azure Maps Route Directions API URL
        // Format: /route/directions/json?api-version=1.0&query=lat1,lng1:lat2,lng2:...
        const query = sampledWaypoints.join(':');
        const routingUrl = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${query}&travelMode=${TRAVEL_MODE}&routeRepresentation=polyline`;
        
        const response = await fetch(routingUrl);
        
        if (!response.ok) {
            throw new Error(`Azure Maps API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            
            // Extract route coordinates from legs
            const routeCoordinates = [];
            route.legs.forEach(leg => {
                leg.points.forEach(point => {
                    routeCoordinates.push([point.longitude, point.latitude]);
                });
            });
            
            roadSnappedPath = routeCoordinates;
            totalDistance = route.summary.lengthInMeters / 1000; // Convert to km
            
            console.log(`✅ Road route calculated: ${totalDistance.toFixed(2)} km`);
            
            // Draw the road route on map
            drawRoadRoute(routeCoordinates);
            
            // Update statistics with accurate distance
            updateStatistics(locations, totalDistance);
            
        } else {
            console.warn('⚠️ No route returned from Azure Maps API');
        }
        
    } catch (error) {
        console.error('❌ Error calculating road route:', error);
        console.log('Falling back to straight-line route');
        // Keep the straight-line route we already have
    }
}

function sampleWaypoints(locations, maxPoints) {
    if (locations.length <= maxPoints) {
        return locations.map(loc => `${loc.lat},${loc.lng}`);
    }
    
    // Always include first and last points
    const sampled = [locations[0]];
    
    // Include check-in, check-out, and visit points
    const importantPoints = locations.filter(loc => 
        loc.flag === 'check_in' || loc.flag === 'check_out' || loc.flag === 'visit'
    );
    
    sampled.push(...importantPoints);
    
    // Calculate how many more points we can add
    const remainingSlots = maxPoints - sampled.length - 1; // -1 for last point
    
    if (remainingSlots > 0) {
        // Sample evenly distributed points
        const interval = Math.floor(locations.length / remainingSlots);
        for (let i = interval; i < locations.length - 1; i += interval) {
            if (sampled.length < maxPoints - 1) {
                sampled.push(locations[i]);
            }
        }
    }
    
    // Add last point
    sampled.push(locations[locations.length - 1]);
    
    // Sort by timestamp to maintain order
    sampled.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return sampled.map(loc => `${loc.lat},${loc.lng}`);
}

function drawRoadRoute(coordinates) {
    // Remove existing features from datasource
    datasource.clear();
    
    // Add road-snapped route as GeoJSON feature
    const routeFeature = new atlas.data.Feature(
        new atlas.data.LineString(coordinates),
        { type: 'route' }
    );
    
    datasource.add(routeFeature);
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBACK CONTROLS
// ═══════════════════════════════════════════════════════════════════════════

function startPlayback() {
    if (roadSnappedPath.length === 0) return;
    
    isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    const baseInterval = 50; // Base interval in ms
    const interval = baseInterval / playbackSpeed;
    
    playbackInterval = setInterval(() => {
        if (currentPlaybackIndex >= roadSnappedPath.length - 1) {
            pausePlayback();
            return;
        }
        
        currentPlaybackIndex++;
        updatePlaybackDisplay();
        
    }, interval);
}

function pausePlayback() {
    isPlaying = false;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
}

function resetPlayback() {
    pausePlayback();
    currentPlaybackIndex = 0;
    updatePlaybackDisplay();
}

function updatePlaybackDisplay() {
    if (roadSnappedPath.length === 0) return;
    
    const currentPos = roadSnappedPath[currentPlaybackIndex];
    
    // Update or create vehicle marker
    if (vehicleMarker) {
        vehicleMarker.setOptions({ position: currentPos });
    } else {
        vehicleMarker = new atlas.HtmlMarker({
            position: currentPos,
            htmlContent: '<div class="vehicle-marker">🚗</div>'
        });
        map.markers.add(vehicleMarker);
    }
    
    // Update timeline slider
    const progress = (currentPlaybackIndex / (roadSnappedPath.length - 1)) * 100;
    document.getElementById('timelineSlider').value = progress;
    
    // Update time display
    if (currentLocationData.length > 0) {
        const startTime = new Date(currentLocationData[0].timestamp);
        const endTime = new Date(currentLocationData[currentLocationData.length - 1].timestamp);
        const totalMs = endTime - startTime;
        const currentMs = (currentPlaybackIndex / roadSnappedPath.length) * totalMs;
        
        document.getElementById('currentTime').textContent = formatTime(currentMs);
        document.getElementById('totalTime').textContent = formatTime(totalMs);
    }
    
    // Pan map to follow vehicle (smooth)
    map.setCamera({
        center: currentPos,
        type: 'ease',
        duration: 500
    });
}

function enablePlaybackControls() {
    document.getElementById('playBtn').disabled = false;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('timelineSlider').disabled = false;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

function updateStatistics(locations, distance) {
    const checkIns = locations.filter(loc => loc.flag === 'check_in').length;
    const checkOuts = locations.filter(loc => loc.flag === 'check_out').length;
    const visits = locations.filter(loc => loc.flag === 'visit').length;
    
    document.getElementById('totalPoints').textContent = locations.length;
    document.getElementById('checkIns').textContent = checkIns;
    document.getElementById('checkOuts').textContent = checkOuts;
    document.getElementById('visits').textContent = visits;
    
    if (distance !== undefined && distance !== null) {
        document.getElementById('routeDistance').textContent = distance.toFixed(2) + ' km';
    } else {
        // Calculate straight-line distance if no route distance
        const straightDist = calculateStraightLineDistance(locations);
        document.getElementById('routeDistance').textContent = straightDist.toFixed(2) + ' km (approx)';
    }
    
    if (locations.length >= 2) {
        const startTime = new Date(locations[0].timestamp);
        const endTime = new Date(locations[locations.length - 1].timestamp);
        const duration = calculateDuration(startTime, endTime);
        document.getElementById('totalDuration').textContent = duration;
    }
}

function calculateStraightLineDistance(locations) {
    let totalDistance = 0;
    
    for (let i = 0; i < locations.length - 1; i++) {
        const dist = haversineDistance(
            locations[i].lat, locations[i].lng,
            locations[i + 1].lat, locations[i + 1].lng
        );
        totalDistance += dist;
    }
    
    return totalDistance;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function calculateDuration(startTime, endTime) {
    const ms = endTime - startTime;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function clearMap() {
    // Remove all HTML markers
    map.markers.clear();
    vehicleMarker = null;
    
    // Clear data source (removes route lines)
    if (datasource) {
        datasource.clear();
    }
    
    // Close popup
    if (popup) {
        popup.close();
    }
    
    roadSnappedPath = [];
    currentPlaybackIndex = 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function showLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    text.textContent = message;
    overlay.classList.add('show');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('show');
}

function showLoadingMessage(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    text.textContent = message;
    overlay.classList.add('show');
    
    // Hide spinner for messages
    const spinner = overlay.querySelector('.spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING & DEBUG
// ═══════════════════════════════════════════════════════════════════════════

console.log(`
╔══════════════════════════════════════════════════════════════╗
║        Azure Maps Location Monitoring MVP - Initialized       ║
╚══════════════════════════════════════════════════════════════╝

🗺️  Azure Maps Web SDK v3
🛣️  Enterprise-grade road-accurate routing
📍 Check-in/Check-out/Visit tracking
▶️  Playback controls with speed adjustment
📊 Real-time route statistics

API Key Status: ${AZURE_MAPS_KEY !== 'YOUR_AZURE_MAPS_KEY' ? '✅ Set' : '❌ Not set'}
`);
