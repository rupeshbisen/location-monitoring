/**
 * Mapbox Location Monitoring MVP
 * 
 * This implementation uses Mapbox Map Matching API to snap GPS coordinates
 * to actual road routes, solving the issue of straight-line routes.
 * 
 * Features:
 * - Road-snapped routes using Mapbox Map Matching API
 * - Check-in/check-out/visit markers with distinct icons
 * - Playback controls with speed adjustment
 * - Timeline scrubbing
 * - Multi-route support
 * - Progressive enhancement (shows straight lines immediately, then road-snaps)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// TODO: Add your Mapbox access token here
// Get free token at: https://account.mapbox.com/access-tokens/
// Free tier: 50,000 Map Matching API requests/month
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

const API_URL = '/api/locations';
const MAP_MATCHING_BATCH_SIZE = 100; // Mapbox allows up to 100 coordinates per request
const MIN_POINT_DISTANCE = 10; // meters - filter out points closer than this

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let map;
let allLocationData = [];
let allRoutes = {};
let currentRouteId = null;
let currentLocationData = [];
let roadSnappedPath = [];
let markers = [];
let vehicleMarker = null;

// Playback state
let currentPlaybackIndex = 0;
let playbackInterval = null;
let isPlaying = false;
let playbackSpeed = 1;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    // Check if access token is set
    if (mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
        console.warn('⚠️ Mapbox access token not set. Please update app.js with your token.');
        showLoadingMessage('⚠️ Please set your Mapbox access token in app.js');
        return;
    } else {
        // Hide API key banner if token is set
        document.getElementById('apiKeyBanner').style.display = 'none';
    }
    
    // Initialize map
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12', // Use streets style for better road visibility
        center: [79.09, 21.09], // Default center (India)
        zoom: 12,
        projection: 'mercator'
    });
    
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    // Initialize event listeners
    initEventListeners();
    
    // Wait for map to load before allowing data loading
    map.on('load', function() {
        console.log('✅ Map initialized successfully');
        document.getElementById('loadDataBtn').disabled = false;
    });
    
    console.log('🗺️ Mapbox MVP initialized');
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
        console.error('Error loading location data:', error);
        alert('Error loading data. Please ensure the backend server is running on port 3000.');
    }
}

function populateRouteSelector(routeGroups) {
    const select = document.getElementById('routeSelect');
    select.innerHTML = '';
    
    Object.keys(routeGroups).forEach(routeId => {
        const option = document.createElement('option');
        option.value = routeId;
        option.textContent = `${routeId} (${routeGroups[routeId].length} points)`;
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
    
    // Step 3: Update statistics
    updateStatistics(locations);
    
    // Step 4: Fit map to bounds
    fitMapToBounds(locations);
    
    // Step 5: Try to get road-snapped route (progressive enhancement)
    showLoading('Snapping route to roads...');
    await snapRouteToRoads(locations);
    hideLoading();
    
    // Step 6: Enable playback controls
    enablePlaybackControls();
    resetPlayback();
}

function showStraightLineRoute(locations) {
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);
    
    // Remove old route if exists
    if (map.getSource('route-straight')) {
        map.removeLayer('route-straight');
        map.removeSource('route-straight');
    }
    
    map.addSource('route-straight', {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        }
    });
    
    map.addLayer({
        id: 'route-straight',
        type: 'line',
        source: 'route-straight',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#d3d3d3',
            'line-width': 3,
            'line-opacity': 0.5
        }
    });
    
    // Set initial roadSnappedPath to straight line for playback
    roadSnappedPath = coordinates;
}

function displayMarkers(locations) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    locations.forEach((loc, index) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';
        el.textContent = getMarkerIcon(loc.flag);
        
        const marker = new mapboxgl.Marker(el)
            .setLngLat([loc.lng, loc.lat])
            .setPopup(createPopup(loc))
            .addTo(map);
        
        markers.push(marker);
    });
    
    console.log(`📌 Displayed ${markers.length} markers`);
}

function getMarkerIcon(flag) {
    const icons = {
        'check_in': '📍',
        'check_out': '🏁',
        'visit': '🏢',
        'normal': '📌'
    };
    return icons[flag] || '📌';
}

function createPopup(loc) {
    const date = new Date(loc.timestamp);
    const content = `
        <div class="popup-info">
            <strong>Type:</strong> ${loc.flag || 'normal'}<br>
            <strong>Time:</strong> ${date.toLocaleString()}<br>
            <strong>Coordinates:</strong> ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}<br>
            ${loc.address ? `<strong>Address:</strong> ${loc.address}<br>` : ''}
            <strong>Route:</strong> ${loc.routeId || 'default'}
        </div>
    `;
    
    return new mapboxgl.Popup({ offset: 25 }).setHTML(content);
}

function fitMapToBounds(locations) {
    if (locations.length === 0) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
        bounds.extend([loc.lng, loc.lat]);
    });
    
    map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAPBOX MAP MATCHING API - THE KEY SOLUTION
// ═══════════════════════════════════════════════════════════════════════════

async function snapRouteToRoads(locations) {
    try {
        // Filter points that are too close together (noise reduction)
        const filteredLocations = filterClosePoints(locations);
        
        console.log(`🔧 Filtered ${locations.length} points to ${filteredLocations.length} for Map Matching`);
        
        // Split into batches (Mapbox limit: 100 coordinates per request)
        const batches = chunkArray(filteredLocations, MAP_MATCHING_BATCH_SIZE);
        
        console.log(`📦 Processing ${batches.length} batches for Map Matching API`);
        
        let allMatchedCoordinates = [];
        
        for (let i = 0; i < batches.length; i++) {
            showLoading(`Matching roads... batch ${i + 1}/${batches.length}`);
            
            const batch = batches[i];
            const coordinates = batch.map(loc => [loc.lng, loc.lat]);
            
            // Call Mapbox Map Matching API
            const matchedPath = await callMapMatchingAPI(coordinates);
            
            if (matchedPath && matchedPath.length > 0) {
                allMatchedCoordinates = allMatchedCoordinates.concat(matchedPath);
            } else {
                // Fallback to straight line for this batch
                allMatchedCoordinates = allMatchedCoordinates.concat(coordinates);
            }
            
            // Small delay to avoid rate limiting
            if (i < batches.length - 1) {
                await sleep(100);
            }
        }
        
        if (allMatchedCoordinates.length > 0) {
            roadSnappedPath = allMatchedCoordinates;
            displayRoadSnappedRoute(allMatchedCoordinates);
            console.log(`✅ Successfully matched ${allMatchedCoordinates.length} road coordinates`);
        } else {
            console.warn('⚠️ Map Matching failed, using straight line route');
        }
        
    } catch (error) {
        console.error('❌ Error in road snapping:', error);
        console.log('ℹ️ Using straight line route as fallback');
    }
}

async function callMapMatchingAPI(coordinates) {
    try {
        // Build coordinate string for API
        const coordString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
        
        // Mapbox Map Matching API endpoint
        const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordString}` +
            `?geometries=geojson` +
            `&overview=full` +
            `&radiuses=${coordinates.map(() => '25').join(';')}` + // 25m radius per point
            `&access_token=${mapboxgl.accessToken}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Map Matching API error: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.matchings && data.matchings.length > 0) {
            // Extract matched coordinates from the geometry
            return data.matchings[0].geometry.coordinates;
        }
        
        return null;
        
    } catch (error) {
        console.error('Map Matching API call failed:', error);
        return null;
    }
}

function displayRoadSnappedRoute(coordinates) {
    // Remove straight line route
    if (map.getSource('route-straight')) {
        map.removeLayer('route-straight');
        map.removeSource('route-straight');
    }
    
    // Remove old road route if exists
    if (map.getSource('route-road')) {
        map.removeLayer('route-road');
        map.removeSource('route-road');
    }
    
    // Add new road-snapped route
    map.addSource('route-road', {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        }
    });
    
    map.addLayer({
        id: 'route-road',
        type: 'line',
        source: 'route-road',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#667eea',
            'line-width': 5,
            'line-opacity': 0.8
        }
    });
    
    console.log('🛣️ Road-snapped route displayed');
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBACK CONTROLS
// ═══════════════════════════════════════════════════════════════════════════

function startPlayback() {
    if (roadSnappedPath.length === 0) return;
    
    isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    const baseInterval = 100; // Base interval in ms
    const interval = baseInterval / playbackSpeed;
    
    playbackInterval = setInterval(() => {
        if (currentPlaybackIndex < roadSnappedPath.length - 1) {
            currentPlaybackIndex++;
            updatePlaybackDisplay();
        } else {
            pausePlayback();
        }
    }, interval);
    
    console.log(`▶️ Playback started at ${playbackSpeed}x speed`);
}

function pausePlayback() {
    isPlaying = false;
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    console.log('⏸️ Playback paused');
}

function resetPlayback() {
    pausePlayback();
    currentPlaybackIndex = 0;
    updatePlaybackDisplay();
    console.log('⏮️ Playback reset');
}

function updatePlaybackDisplay() {
    if (roadSnappedPath.length === 0) return;
    
    const currentCoord = roadSnappedPath[currentPlaybackIndex];
    
    // Update vehicle marker
    if (!vehicleMarker) {
        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.fontSize = '20px';
        el.textContent = '🚗';
        
        vehicleMarker = new mapboxgl.Marker(el)
            .setLngLat(currentCoord)
            .addTo(map);
    } else {
        vehicleMarker.setLngLat(currentCoord);
    }
    
    // Update traveled path
    const traveledCoords = roadSnappedPath.slice(0, currentPlaybackIndex + 1);
    
    if (map.getSource('traveled-route')) {
        map.getSource('traveled-route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: traveledCoords
            }
        });
    } else {
        map.addSource('traveled-route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: traveledCoords
                }
            }
        });
        
        map.addLayer({
            id: 'traveled-route',
            type: 'line',
            source: 'traveled-route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#00ff00',
                'line-width': 6,
                'line-opacity': 0.8
            }
        });
    }
    
    // Update timeline
    const progress = (currentPlaybackIndex / roadSnappedPath.length) * 100;
    document.getElementById('timelineSlider').value = progress;
    
    // Update time display
    const currentTime = getCurrentTime();
    document.getElementById('currentTime').textContent = currentTime;
    
    // Pan map to current position
    map.panTo(currentCoord);
}

function getCurrentTime() {
    if (currentLocationData.length === 0) return '00:00:00';
    
    const totalDuration = new Date(currentLocationData[currentLocationData.length - 1].timestamp) - 
                         new Date(currentLocationData[0].timestamp);
    const currentDuration = (currentPlaybackIndex / roadSnappedPath.length) * totalDuration;
    
    return formatDuration(currentDuration);
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

function updateStatistics(locations) {
    // Count flags
    const flags = { check_in: 0, check_out: 0, visit: 0, normal: 0 };
    locations.forEach(loc => {
        flags[loc.flag] = (flags[loc.flag] || 0) + 1;
    });
    
    // Get route info
    const routeInfo = allRoutes[currentRouteId] || {};
    
    // Update UI
    document.getElementById('totalPoints').textContent = locations.length;
    document.getElementById('routeDistance').textContent = (routeInfo.totalDistance || '0') + ' km';
    document.getElementById('checkIns').textContent = flags.check_in;
    document.getElementById('checkOuts').textContent = flags.check_out;
    document.getElementById('visits').textContent = flags.visit;
    
    // Update info panel
    document.getElementById('infoPanel').style.display = 'block';
    document.getElementById('currentRouteId').textContent = currentRouteId;
    document.getElementById('currentEmployee').textContent = currentRouteId;
    
    if (locations.length > 0) {
        const startDate = new Date(locations[0].timestamp);
        document.getElementById('currentDate').textContent = startDate.toLocaleDateString();
        document.getElementById('currentDuration').textContent = routeInfo.duration || '-';
        
        const endDate = new Date(locations[locations.length - 1].timestamp);
        document.getElementById('totalTime').textContent = endDate.toLocaleTimeString();
    }
    
    console.log('📊 Statistics updated');
}

function enablePlaybackControls() {
    document.getElementById('playBtn').disabled = false;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('timelineSlider').disabled = false;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function clearMap() {
    // Remove markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Remove vehicle marker
    if (vehicleMarker) {
        vehicleMarker.remove();
        vehicleMarker = null;
    }
    
    // Remove layers and sources
    const layersToRemove = ['route-straight', 'route-road', 'traveled-route'];
    layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
        if (map.getSource(layerId)) {
            map.removeSource(layerId);
        }
    });
}

function filterClosePoints(locations) {
    if (locations.length <= 2) return locations;
    
    const filtered = [locations[0]];
    
    for (let i = 1; i < locations.length; i++) {
        const lastPoint = filtered[filtered.length - 1];
        const currentPoint = locations[i];
        
        const distance = calculateDistance(
            lastPoint.lat, lastPoint.lng,
            currentPoint.lat, currentPoint.lng
        );
        
        // Keep points that are at least MIN_POINT_DISTANCE apart or special flags
        if (distance >= MIN_POINT_DISTANCE || 
            currentPoint.flag !== 'normal' ||
            i === locations.length - 1) {
            filtered.push(currentPoint);
        }
    }
    
    return filtered;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
}

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    overlay.querySelector('.spinner').style.display = 'none';
}

console.log('🚀 Mapbox Location Monitoring MVP loaded');
