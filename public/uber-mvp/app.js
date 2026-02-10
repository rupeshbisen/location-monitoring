// Uber Location Monitoring MVP - JavaScript

// Global state
let map = null;
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

// Initialize Leaflet map
function initMap() {
    // Default center (Nagpur, India - based on sample data)
    const defaultCenter = [21.1458, 79.0882];
    
    map = L.map('map').setView(defaultCenter, 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Fix for map tiles not loading due to container size issues
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (map) {
            map.invalidateSize();
        }
    });
    
    console.log('Map initialized successfully');
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
    
    // Try to get road-snapped path using OSRM
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
        
        // Create custom HTML icon
        const customIcon = L.divIcon({
            html: `<div style="font-size: 24px; cursor: pointer;">${icon}</div>`,
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
        
        // Create popup content
        const popupContent = `
            <div class="popup-title">${icon} ${loc.flag.replace('_', ' ').toUpperCase()}</div>
            <div class="popup-info"><strong>Time:</strong> ${new Date(loc.timestamp).toLocaleString()}</div>
            <div class="popup-info"><strong>Location:</strong> ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</div>
            ${loc.address ? `<div class="popup-info"><strong>Address:</strong> ${loc.address}</div>` : ''}
            <div class="popup-info"><strong>Route:</strong> ${loc.routeId}</div>
        `;
        
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

// Draw route polyline (straight lines between points)
function drawRoutePolyline(locations) {
    const coordinates = locations.map(loc => [loc.lat, loc.lng]);
    
    routePolyline = L.polyline(coordinates, {
        color: '#667eea',
        weight: 3,
        opacity: 0.7
    }).addTo(map);
}

// Fetch road-snapped route using OSRM
async function fetchRoadSnappedRoute(locations) {
    try {
        // OSRM has a limit, so we'll sample points if too many
        const maxPoints = 100;
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
        
        // Build OSRM API URL
        const coordinates = sampledLocations.map(loc => `${loc.lng},${loc.lat}`).join(';');
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
        
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Remove old polyline
            if (routePolyline) {
                map.removeLayer(routePolyline);
            }
            
            // Draw road-snapped polyline
            routePolyline = L.polyline(routeCoordinates, {
                color: '#667eea',
                weight: 4,
                opacity: 0.8
            }).addTo(map);
            
            // Use road-snapped path for playback
            roadSnappedPath = routeCoordinates;
            
            console.log('Road-snapped route loaded successfully');
        } else {
            // Fallback to straight line path
            roadSnappedPath = locations.map(loc => [loc.lat, loc.lng]);
            console.log('Using straight line path for playback');
        }
    } catch (error) {
        console.error('Error fetching road-snapped route:', error);
        // Fallback to straight line path
        roadSnappedPath = locations.map(loc => [loc.lat, loc.lng]);
    }
}

// Clear all map elements
function clearMap() {
    // Remove markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Remove polylines
    if (routePolyline) {
        map.removeLayer(routePolyline);
        routePolyline = null;
    }
    
    if (traveledPolyline) {
        map.removeLayer(traveledPolyline);
        traveledPolyline = null;
    }
    
    // Remove vehicle marker
    if (vehicleMarker) {
        map.removeLayer(vehicleMarker);
        vehicleMarker = null;
    }
}

// Fit map to show all locations
function fitMapToBounds(locations) {
    if (locations.length === 0) return;
    
    const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
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
        const vehicleIcon = L.divIcon({
            html: '<div class="vehicle-marker">🚗</div>',
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const startPos = roadSnappedPath[currentPlaybackIndex];
        vehicleMarker = L.marker(startPos, { icon: vehicleIcon }).addTo(map);
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
        map.removeLayer(vehicleMarker);
        vehicleMarker = null;
    }
    
    if (traveledPolyline) {
        map.removeLayer(traveledPolyline);
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
        vehicleMarker.setLatLng(currentPos);
    }
    
    // Update traveled polyline
    if (traveledPolyline) {
        map.removeLayer(traveledPolyline);
    }
    
    const traveledPath = roadSnappedPath.slice(0, currentPlaybackIndex + 1);
    traveledPolyline = L.polyline(traveledPath, {
        color: '#000',
        weight: 5,
        opacity: 0.8
    }).addTo(map);
    
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
