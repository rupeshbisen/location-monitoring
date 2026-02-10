// HERE Location Monitoring MVP - JavaScript

// Global state
let map = null;
let ui = null;
let markers = [];
let routePolyline = null;
let traveledPolyline = null;
let vehicleMarker = null;
let locationData = [];
let currentRouteData = null;
let allRoutesData = {};
let currentPlaybackIndex = 0;
let playbackInterval = null;
let isPlaying = false;
let playbackSpeed = 1;
let roadSnappedPath = [];

const API_BASE_URL = '/api';

// HERE Maps API credentials
// Get your free API key at: https://developer.here.com
// Free tier: 250,000 requests/month
const HERE_API_KEY = 'YOUR_HERE_API_KEY';

// Marker icons based on flag type
function getMarkerIcon(flag) {
    const icons = {
        'check_in': '📍',
        'check_out': '🏁',
        'visit': '🏢',
        'normal': '📌'
    };
    return icons[flag] || '📌';
}

// Initialize map on page load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initEventListeners();
});

// Initialize HERE Maps
function initMap() {
    // Initialize the platform with your API key
    const platform = new H.service.Platform({
        'apikey': HERE_API_KEY
    });
    
    // Obtain the default map types from the platform
    const defaultLayers = platform.createDefaultLayers();
    
    // Default center (Nagpur, India - based on sample data)
    const defaultCenter = { lat: 21.1458, lng: 79.0882 };
    
    // Initialize map
    map = new H.Map(
        document.getElementById('map'),
        defaultLayers.vector.normal.map,
        {
            zoom: 13,
            center: defaultCenter
        }
    );
    
    // Enable map events (pan, zoom, pinch-zoom, etc.)
    const mapEvents = new H.mapevents.MapEvents(map);
    const behavior = new H.mapevents.Behavior(mapEvents);
    
    // Create the default UI components
    ui = H.ui.UI.createDefault(map, defaultLayers);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (map) {
            map.getViewPort().resize();
        }
    });
    
    console.log('HERE Maps initialized successfully');
    
    // Validate API key
    if (HERE_API_KEY === 'YOUR_HERE_API_KEY') {
        alert('⚠️ Please set your HERE API key in app.js\n\nGet your free key at: https://developer.here.com\nFree tier: 250,000 requests/month');
    }
}

// Initialize event listeners
function initEventListeners() {
    document.getElementById('loadDataBtn').addEventListener('click', loadLocationData);
    document.getElementById('playBtn').addEventListener('click', startPlayback);
    document.getElementById('pauseBtn').addEventListener('click', pausePlayback);
    document.getElementById('resetBtn').addEventListener('click', resetPlayback);
    
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        playbackSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = playbackSpeed + 'x';
        
        // Restart playback with new speed if currently playing
        if (isPlaying) {
            pausePlayback();
            startPlayback();
        }
    });
    
    document.getElementById('timelineSlider').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (roadSnappedPath.length > 0) {
            currentPlaybackIndex = Math.floor((value / 100) * roadSnappedPath.length);
            updatePlaybackDisplay();
        }
    });
    
    document.getElementById('routeSelect').addEventListener('change', (e) => {
        const routeId = e.target.value;
        if (routeId && allRoutesData[routeId]) {
            displayRoute(routeId);
        }
    });
}

// Show loading overlay
function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// Load location data from API
async function loadLocationData() {
    const url = `${API_BASE_URL}/locations`;
    
    try {
        showLoading(true);
        console.log('Loading location data from:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            locationData = result.data;
            allRoutesData = result.routes || {};
            
            console.log(`Loaded ${locationData.length} location points`);
            console.log(`Routes available:`, Object.keys(allRoutesData));
            
            // Group locations by route
            const routeGroups = {};
            locationData.forEach(loc => {
                const routeId = loc.routeId || 'default';
                if (!routeGroups[routeId]) {
                    routeGroups[routeId] = [];
                }
                routeGroups[routeId].push(loc);
            });
            
            // Populate route selector if multiple routes
            const routeIds = Object.keys(routeGroups);
            if (routeIds.length > 1) {
                populateRouteSelector(routeIds);
            }
            
            // Display first route by default
            const firstRouteId = routeIds[0];
            displayRoute(firstRouteId);
            
            showLoading(false);
        } else {
            alert('No location data found or failed to load data');
            showLoading(false);
        }
    } catch (error) {
        console.error('Error loading location data:', error);
        alert('Failed to load location data: ' + error.message);
        showLoading(false);
    }
}

// Populate route selector dropdown
function populateRouteSelector(routeIds) {
    const container = document.getElementById('routeSelectContainer');
    const select = document.getElementById('routeSelect');
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add options
    routeIds.forEach(routeId => {
        const option = document.createElement('option');
        option.value = routeId;
        option.textContent = routeId;
        select.appendChild(option);
    });
    
    container.style.display = 'block';
}

// Display a specific route
function displayRoute(routeId) {
    console.log('Displaying route:', routeId);
    
    // Filter locations for this route
    const routeLocations = locationData.filter(loc => loc.routeId === routeId);
    
    if (routeLocations.length === 0) {
        console.warn('No locations found for route:', routeId);
        return;
    }
    
    // Sort by timestamp
    routeLocations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    currentRouteData = routeLocations;
    
    // Clear existing map elements
    clearMap();
    
    // Display markers
    displayMarkers(routeLocations);
    
    // Draw route polyline
    drawRoutePolyline(routeLocations);
    
    // Try to get road-snapped path using HERE Routing API
    fetchRoadSnappedRoute(routeLocations);
    
    // Fit map to show all points
    fitMapToBounds(routeLocations);
    
    // Update statistics
    updateStatistics(routeLocations);
    
    // Update route info panel
    updateRouteInfo(routeId, routeLocations);
    
    // Enable playback controls
    enablePlaybackControls();
    
    // Reset playback
    resetPlayback();
}

// Display markers on map
function displayMarkers(locations) {
    locations.forEach((loc, index) => {
        const icon = getMarkerIcon(loc.flag);
        
        // Create DOM icon for marker
        const domIcon = new H.map.DomIcon(`<div style="font-size: 24px; cursor: pointer;">${icon}</div>`);
        
        const marker = new H.map.DomMarker({ lat: loc.lat, lng: loc.lng }, {
            icon: domIcon
        });
        
        // Create info bubble content
        const bubbleContent = `
            <div class="custom-info-bubble">
                <div class="popup-title">${icon} ${loc.flag.replace('_', ' ').toUpperCase()}</div>
                <div class="popup-info"><strong>Time:</strong> ${new Date(loc.timestamp).toLocaleString()}</div>
                <div class="popup-info"><strong>Location:</strong> ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</div>
                ${loc.address ? `<div class="popup-info"><strong>Address:</strong> ${loc.address}</div>` : ''}
                <div class="popup-info"><strong>Route:</strong> ${loc.routeId}</div>
            </div>
        `;
        
        // Add tap event to show info bubble
        marker.addEventListener('tap', function(evt) {
            const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
                content: bubbleContent
            });
            ui.addBubble(bubble);
        });
        
        map.addObject(marker);
        markers.push(marker);
    });
}

// Draw route polyline (straight lines between points)
function drawRoutePolyline(locations) {
    const coordinates = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
    
    const lineString = new H.geo.LineString();
    coordinates.forEach(coord => {
        lineString.pushPoint(coord);
    });
    
    routePolyline = new H.map.Polyline(lineString, {
        style: { strokeColor: '#00AFAA', lineWidth: 3 }
    });
    
    map.addObject(routePolyline);
}

// Fetch road-snapped route using HERE Routing API
async function fetchRoadSnappedRoute(locations) {
    try {
        // HERE Routing API has limits, so we'll sample points if too many
        const maxPoints = 50; // HERE allows up to 150 waypoints but we'll be conservative
        let sampledLocations = locations;
        
        if (locations.length > maxPoints) {
            const step = Math.floor(locations.length / maxPoints);
            sampledLocations = locations.filter((_, i) => i % step === 0);
            // Always include last point
            if (sampledLocations.length > 0 && 
                locations.length > 0 &&
                sampledLocations[sampledLocations.length - 1].timestamp !== locations[locations.length - 1].timestamp) {
                sampledLocations.push(locations[locations.length - 1]);
            }
        }
        
        // Build waypoints string
        const waypoints = sampledLocations.map((loc, i) => {
            if (i === 0) {
                return `origin=${loc.lat},${loc.lng}`;
            } else if (i === sampledLocations.length - 1) {
                return `destination=${loc.lat},${loc.lng}`;
            } else {
                return `via=${loc.lat},${loc.lng}`;
            }
        }).join('&');
        
        // HERE Routing API v8
        const routingUrl = `https://router.hereapi.com/v8/routes?${waypoints}&transportMode=car&return=polyline&apiKey=${HERE_API_KEY}`;
        
        const response = await fetch(routingUrl);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const sections = route.sections;
            
            // Decode polyline from all sections
            let allCoordinates = [];
            sections.forEach(section => {
                if (section.polyline) {
                    const decoded = H.geo.LineString.fromFlexiblePolyline(section.polyline);
                    const coords = decoded.getLatLngAltArray();
                    for (let i = 0; i < coords.length; i += 3) {
                        allCoordinates.push({ lat: coords[i], lng: coords[i + 1] });
                    }
                }
            });
            
            if (allCoordinates.length > 0) {
                // Remove old polyline
                if (routePolyline) {
                    map.removeObject(routePolyline);
                }
                
                // Draw road-snapped polyline
                const lineString = new H.geo.LineString();
                allCoordinates.forEach(coord => {
                    lineString.pushPoint(coord);
                });
                
                routePolyline = new H.map.Polyline(lineString, {
                    style: { strokeColor: '#00AFAA', lineWidth: 4 }
                });
                
                map.addObject(routePolyline);
                
                // Use road-snapped path for playback
                roadSnappedPath = allCoordinates;
                
                console.log('Road-snapped route loaded successfully via HERE Routing API');
            } else {
                // Fallback to straight line path
                roadSnappedPath = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
                console.log('Using straight line path for playback');
            }
        } else {
            // Fallback to straight line path
            roadSnappedPath = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
            console.log('Using straight line path for playback');
        }
    } catch (error) {
        console.error('Error fetching road-snapped route:', error);
        // Fallback to straight line path
        roadSnappedPath = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
    }
}

// Clear all map elements
function clearMap() {
    // Remove markers
    markers.forEach(marker => map.removeObject(marker));
    markers = [];
    
    // Remove polylines
    if (routePolyline) {
        map.removeObject(routePolyline);
        routePolyline = null;
    }
    
    if (traveledPolyline) {
        map.removeObject(traveledPolyline);
        traveledPolyline = null;
    }
    
    // Remove vehicle marker
    if (vehicleMarker) {
        map.removeObject(vehicleMarker);
        vehicleMarker = null;
    }
}

// Fit map to show all locations
function fitMapToBounds(locations) {
    if (locations.length === 0) return;
    
    const bounds = new H.geo.Rect(
        Math.max(...locations.map(loc => loc.lat)),
        Math.min(...locations.map(loc => loc.lng)),
        Math.min(...locations.map(loc => loc.lat)),
        Math.max(...locations.map(loc => loc.lng))
    );
    
    map.getViewModel().setLookAtData({ bounds: bounds }, true);
}

// Update statistics display
function updateStatistics(locations) {
    const checkIns = locations.filter(loc => loc.flag === 'check_in').length;
    const checkOuts = locations.filter(loc => loc.flag === 'check_out').length;
    const visits = locations.filter(loc => loc.flag === 'visit').length;
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
        totalDistance += calculateDistance(locations[i], locations[i + 1]);
    }
    
    // Calculate duration
    const startTime = new Date(locations[0].timestamp);
    const endTime = new Date(locations[locations.length - 1].timestamp);
    const duration = calculateDuration(startTime, endTime);
    
    document.getElementById('totalPoints').textContent = locations.length;
    document.getElementById('routeDistance').textContent = totalDistance.toFixed(2) + ' km';
    document.getElementById('checkIns').textContent = checkIns;
    document.getElementById('checkOuts').textContent = checkOuts;
    document.getElementById('visits').textContent = visits;
    document.getElementById('totalDuration').textContent = duration;
}

// Update route info panel
function updateRouteInfo(routeId, locations) {
    const panel = document.getElementById('infoPanel');
    
    document.getElementById('currentRouteId').textContent = routeId;
    document.getElementById('currentEmployee').textContent = routeId;
    
    const startTime = new Date(locations[0].timestamp);
    document.getElementById('currentDate').textContent = startTime.toLocaleDateString();
    
    const endTime = new Date(locations[locations.length - 1].timestamp);
    const duration = calculateDuration(startTime, endTime);
    document.getElementById('currentDuration').textContent = duration;
    
    const hasCheckIn = locations.some(loc => loc.flag === 'check_in');
    const hasCheckOut = locations.some(loc => loc.flag === 'check_out');
    let status = 'In Progress';
    if (hasCheckIn && hasCheckOut) {
        status = 'Completed';
    } else if (hasCheckIn) {
        status = 'Active';
    }
    document.getElementById('currentStatus').textContent = status;
    
    panel.style.display = 'block';
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(loc1, loc2) {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate duration between two timestamps
function calculateDuration(startTime, endTime) {
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
}

// Enable playback controls
function enablePlaybackControls() {
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('timelineSlider').disabled = false;
}

// Start playback
function startPlayback() {
    if (roadSnappedPath.length === 0) return;
    
    isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    // Create vehicle marker if not exists
    if (!vehicleMarker) {
        const vehicleIcon = new H.map.DomIcon('<div style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚗</div>');
        
        const startPos = roadSnappedPath[currentPlaybackIndex];
        vehicleMarker = new H.map.DomMarker(startPos, { icon: vehicleIcon });
        map.addObject(vehicleMarker);
    }
    
    // Calculate interval based on speed
    const baseInterval = 100; // milliseconds
    const interval = baseInterval / playbackSpeed;
    
    playbackInterval = setInterval(() => {
        if (currentPlaybackIndex < roadSnappedPath.length - 1) {
            currentPlaybackIndex++;
            updatePlaybackDisplay();
        } else {
            pausePlayback();
        }
    }, interval);
}

// Pause playback
function pausePlayback() {
    isPlaying = false;
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

// Reset playback
function resetPlayback() {
    pausePlayback();
    currentPlaybackIndex = 0;
    
    if (vehicleMarker) {
        map.removeObject(vehicleMarker);
        vehicleMarker = null;
    }
    
    if (traveledPolyline) {
        map.removeObject(traveledPolyline);
        traveledPolyline = null;
    }
    
    updatePlaybackDisplay();
}

// Update playback display
function updatePlaybackDisplay() {
    if (roadSnappedPath.length === 0) return;
    
    const currentPos = roadSnappedPath[currentPlaybackIndex];
    
    // Update vehicle marker position
    if (vehicleMarker) {
        vehicleMarker.setGeometry(currentPos);
    }
    
    // Update traveled polyline
    if (traveledPolyline) {
        map.removeObject(traveledPolyline);
    }
    
    const traveledPath = roadSnappedPath.slice(0, currentPlaybackIndex + 1);
    const lineString = new H.geo.LineString();
    traveledPath.forEach(coord => {
        lineString.pushPoint(coord);
    });
    
    traveledPolyline = new H.map.Polyline(lineString, {
        style: { strokeColor: '#FF6B6B', lineWidth: 5 }
    });
    
    map.addObject(traveledPolyline);
    
    // Update timeline slider
    const progress = (currentPlaybackIndex / (roadSnappedPath.length - 1)) * 100;
    document.getElementById('timelineSlider').value = progress;
    
    // Update time display
    if (currentRouteData && currentRouteData.length > 0) {
        const dataIndex = Math.floor((currentPlaybackIndex / roadSnappedPath.length) * currentRouteData.length);
        const currentLoc = currentRouteData[Math.min(dataIndex, currentRouteData.length - 1)];
        const startTime = new Date(currentRouteData[0].timestamp);
        const currentTime = new Date(currentLoc.timestamp);
        
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        
        document.getElementById('currentTime').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const endTime = new Date(currentRouteData[currentRouteData.length - 1].timestamp);
        const totalElapsed = Math.floor((endTime - startTime) / 1000);
        const totalHours = Math.floor(totalElapsed / 3600);
        const totalMinutes = Math.floor((totalElapsed % 3600) / 60);
        const totalSeconds = totalElapsed % 60;
        
        document.getElementById('totalTime').textContent = 
            `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`;
    }
}
