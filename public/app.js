// Global variables
let map;
let markers = [];
let polyline;
let locationData = [];
let waypoints = [];
let routePath = []; // Actual road path from Directions API
let currentPlaybackIndex = 0;
let playbackInterval;
let isPlaying = false;
let playbackSpeed = 1;
let markerIndexMap = new Map(); // Maps location index to marker index
let directionsService;
let traveledPolyline = null;
let vehicleMarker = null;
let infoWindow = null;
const API_BASE_URL = 'http://localhost:3000/api';

// Adaptive marker downsampling thresholds
const SMALL_DATASET_THRESHOLD = 100;
const MEDIUM_DATASET_THRESHOLD = 1000;
const MEDIUM_DATASET_STEP = 10;
const LARGE_DATASET_STEP = 200;

// Initialize Google Map
async function initMap() {
    // Default center (Delhi, India)
    const defaultCenter = { lat: 28.6139, lng: 77.2090 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultCenter,
        mapTypeId: 'roadmap',
        mapId: 'DEMO_MAP_ID', // For advanced markers
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
            {
                featureType: 'poi',
                stylers: [{ visibility: 'on' }]
            }
        ]
    });

    // Initialize Directions Service for road routes
    directionsService = new google.maps.DirectionsService();
    
    // Initialize InfoWindow
    infoWindow = new google.maps.InfoWindow();

    // Initialize UI event listeners
    initEventListeners();
    
    // Load available routes
    loadRoutes();
    
    console.log('Map initialized successfully with Directions API');
}

// Initialize all event listeners
function initEventListeners() {
    document.getElementById('loadDataBtn').addEventListener('click', loadLocationData);
    document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);
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
        if (locationData.length > 0) {
            currentPlaybackIndex = Math.floor((value / 100) * locationData.length);
            updatePlaybackDisplay();
        }
    });
}

// Load available routes from API
async function loadRoutes() {
    try {
        const response = await fetch(`${API_BASE_URL}/routes`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('routeSelect');
            // Clear existing options except "All Routes"
            select.innerHTML = '<option value="">All Routes</option>';
            
            result.data.forEach(routeId => {
                const option = document.createElement('option');
                option.value = routeId;
                option.textContent = routeId;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

// Load sample data for testing
async function loadSampleData() {
    try {
        const response = await fetch(`${API_BASE_URL}/sample-data`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            alert(`Sample data loaded successfully! (${result.count} points)`);
            loadRoutes();
        }
    } catch (error) {
        console.error('Error loading sample data:', error);
        alert('Error loading sample data. Make sure the server is running.');
    }
}

// Load location data from API
async function loadLocationData() {
    const routeId = document.getElementById('routeSelect').value;
    let url = `${API_BASE_URL}/locations`;
    
    if (routeId) {
        url += `?routeId=${routeId}`;
    }
    
    try {
        console.log('Loading location data from:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            // Sort locations by timestamp to ensure correct order
            locationData = result.data.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            if (locationData.length === 0) {
                alert('No location data found. Try loading sample data first.');
                return;
            }
            
            console.log(`Loaded ${locationData.length} location points`);
            
            // Clear existing markers and routes
            clearMap();
            
            // Display all markers with road-following routes
            await displayAllMarkers();
            
            // Update statistics
            updateStatistics();
            
            // Set total time
            if (locationData.length > 0) {
                const totalTime = new Date(locationData[locationData.length - 1].timestamp);
                document.getElementById('totalTime').textContent = formatTime(totalTime);
            }
            
            // Enable playback controls
            enablePlaybackControls();
            
            // Reset playback
            resetPlayback();
            
            alert(`✅ Loaded ${locationData.length} location points with road-following routes!`);
        } else {
            alert(`❌ Error: ${result.message || 'Failed to load location data'}`);
        }
    } catch (error) {
        console.error('Error loading location data:', error);
        alert('❌ Error loading location data. Make sure the server is running on port 3000.');
    }
}

// Clear all markers and polylines from map
function clearMap() {
    // Clear all markers
    markers.forEach(marker => {
        if (marker && marker.setMap) {
            marker.setMap(null);
        }
    });
    markers = [];
    
    if (polyline) {
        polyline.setMap(null);
        polyline = null;
    }
}

// Display all markers on the map with road routes
async function displayAllMarkers() {
    if (locationData.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    const path = [];
    
    // Clear the marker index map
    markerIndexMap.clear();
    
    // Adaptive Marker Downsampling
    // 1-100 pts: Show all
    // 100-1000 pts: Show every 10th
    // 1000+ pts: Show every 200th (handles 10k+ gracefully)
    const total = locationData.length;
    const markerStep = total < SMALL_DATASET_THRESHOLD ? 1 : 
                       total < MEDIUM_DATASET_THRESHOLD ? MEDIUM_DATASET_STEP : 
                       LARGE_DATASET_STEP;
    
    locationData.forEach((location, index) => {
        const position = { lat: location.lat, lng: location.lng };
        
        // Always add to path for polyline
        path.push(position);
        bounds.extend(position);
        
        // Only create markers based on downsampling step or for important flags
        const isImportantFlag = location.flag === 'check_in' || 
                               location.flag === 'check_out' || 
                               location.flag === 'visit';
        const shouldShowMarker = (index % markerStep === 0) || isImportantFlag;
        
        if (shouldShowMarker) {
            // Create marker with custom icon based on flag
            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: location.address || `Point ${index + 1}`,
                icon: getMarkerIcon(location.flag),
                animation: null
            });
            
            // Create info window content
            const infoWindowContent = createInfoWindowContent(location, index);
            
            marker.addListener('click', () => {
                infoWindow.setContent(infoWindowContent);
                infoWindow.open(map, marker);
            });
            
            // Map location index to marker index
            markerIndexMap.set(index, markers.length);
            markers.push(marker);
        }
        // Create info window
        const infoWindowContent = createInfoWindowContent(location, index);
        
        marker.addListener('click', () => {
            infoWindow.setContent(infoWindowContent);
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
    });
    
    // Store waypoints for playback
    waypoints = locationData.map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        timestamp: loc.timestamp,
        address: loc.address,
        flag: loc.flag
    }));
    
    // Draw polyline connecting all points (using full path, not downsampled)
    polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#667eea',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
    });
    
    // Fit map to show all markers
    map.fitBounds(bounds);
    
    console.log(`Displayed ${markers.length} markers out of ${total} points (step: ${markerStep})`);
}

// Get marker icon based on flag
function getMarkerIcon(flag) {
    const icons = {
        'check_in': {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#28a745',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 10
        },
        'check_out': {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#dc3545',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 10
        },
        'visit': {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#ffc107',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
        },
        'normal': {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#667eea',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 5
        }
    };
    
    return icons[flag] || icons['normal'];
}

// Create info window content
function createInfoWindowContent(location, index) {
    const flagLabels = {
        'check_in': '📍 Check-in',
        'check_out': '🏁 Check-out',
        'visit': '🏢 Visit',
        'normal': '📌 Normal Point'
    };
    
    const timestamp = new Date(location.timestamp).toLocaleString();
    const flagLabel = flagLabels[location.flag] || '📌 Normal Point';
    
    return `
        <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${flagLabel}</h3>
            <p style="margin: 5px 0;"><strong>Point:</strong> ${index + 1} / ${locationData.length}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${location.address || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp}</p>
            <p style="margin: 5px 0;"><strong>Coordinates:</strong> ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</p>
        </div>
    `;
}

// Update statistics
function updateStatistics() {
    const checkIns = locationData.filter(loc => loc.flag === 'check_in').length;
    const checkOuts = locationData.filter(loc => loc.flag === 'check_out').length;
    const visits = locationData.filter(loc => loc.flag === 'visit').length;
    
    document.getElementById('totalPoints').textContent = locationData.length;
    document.getElementById('checkIns').textContent = checkIns;
    document.getElementById('checkOuts').textContent = checkOuts;
    document.getElementById('visits').textContent = visits;
}

// Enable playback controls
function enablePlaybackControls() {
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('timelineSlider').disabled = false;
}

// Start playback - follows actual road path
function startPlayback() {
    if (waypoints.length === 0 && routePath.length === 0) {
        alert('Please load location data first');
        return;
    }
    
    isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    // Clear existing interval
    if (playbackInterval) {
        clearInterval(playbackInterval);
    }
    
    // Use routePath if available (road-based), otherwise use waypoints
    const pathToFollow = routePath.length > 0 ? routePath : waypoints;
    
    // Calculate interval based on speed
    const intervalTime = 100 / playbackSpeed; // Base 100ms per point
    
    playbackInterval = setInterval(() => {
        if (currentPlaybackIndex >= pathToFollow.length - 1) {
            pausePlayback();
            currentPlaybackIndex = 0;
            if (traveledPolyline) {
                traveledPolyline.setMap(null);
                traveledPolyline = null;
            }
            if (vehicleMarker) {
                vehicleMarker.setPosition(pathToFollow[0]);
            }
            updatePlaybackDisplay();
            return;
        }
        
        updatePlaybackDisplay();
        currentPlaybackIndex++;
    }, intervalTime);
    
    console.log(`Playback started at ${playbackSpeed}x speed, following ${pathToFollow.length} path points`);
}

// Pause playback
function pausePlayback() {
    isPlaying = false;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
}

// Reset playback
function resetPlayback() {
    pausePlayback();
    currentPlaybackIndex = 0;
    updatePlaybackDisplay();
    
    // Reset all markers to normal state
    markers.forEach(marker => {
        marker.setAnimation(null);
    });
}

// Update playback display - vehicle follows road path
function updatePlaybackDisplay() {
    const pathToFollow = routePath.length > 0 ? routePath : waypoints;
    
    if (pathToFollow.length === 0 || currentPlaybackIndex >= pathToFollow.length) return;
    
    const currentPosition = pathToFollow[currentPlaybackIndex];
    
    // Move vehicle marker to current position on road
    if (vehicleMarker) {
        vehicleMarker.setPosition(currentPosition);
        
        // Calculate rotation angle if we have next point
        if (currentPlaybackIndex < pathToFollow.length - 1) {
            const nextPosition = pathToFollow[currentPlaybackIndex + 1];
            const heading = google.maps.geometry.spherical.computeHeading(
                new google.maps.LatLng(currentPosition.lat, currentPosition.lng),
                new google.maps.LatLng(nextPosition.lat, nextPosition.lng)
            );
            
            // Update vehicle icon with rotation
            const icon = vehicleMarker.getIcon();
            if (icon && typeof icon === 'object') {
                icon.rotation = heading;
                vehicleMarker.setIcon(icon);
            }
        }
    }
    
    // Center map on vehicle
    map.panTo(currentPosition);
    
    // Update traveled path (yellow trail)
    updateTraveledPath();
    
    // Update timeline slider
    const progress = (currentPlaybackIndex / (pathToFollow.length - 1)) * 100;
    document.getElementById('timelineSlider').value = Math.min(100, Math.max(0, progress));
    
    // Find closest waypoint for time display
    if (routePath.length > 0 && waypoints.length > 0) {
        const closestWaypoint = findClosestWaypoint(currentPosition);
        if (closestWaypoint && closestWaypoint.timestamp) {
            const time = new Date(closestWaypoint.timestamp);
            document.getElementById('currentTime').textContent = formatTime(time);
        }
    } else if (waypoints[currentPlaybackIndex] && waypoints[currentPlaybackIndex].timestamp) {
        const time = new Date(waypoints[currentPlaybackIndex].timestamp);
        document.getElementById('currentTime').textContent = formatTime(time);
    }
}

// Update traveled path (yellow trail behind vehicle)
function updateTraveledPath() {
    if (currentPlaybackIndex < 1) return;
    
    const pathToFollow = routePath.length > 0 ? routePath : waypoints;
    const traveledPath = pathToFollow.slice(0, currentPlaybackIndex + 1);
    
    if (traveledPolyline) {
        traveledPolyline.setPath(traveledPath);
    } else {
        traveledPolyline = new google.maps.Polyline({
            path: traveledPath,
            geodesic: true,
            strokeColor: '#FBBC04',
            strokeOpacity: 0.9,
            strokeWeight: 6,
            map: map,
            zIndex: 500
        });
    }
}

// Find closest waypoint to current position
function findClosestWaypoint(position) {
    let closestWaypoint = null;
    let minDistance = Infinity;
    
    waypoints.forEach(wp => {
        const distance = Math.abs(wp.lat - position.lat) + Math.abs(wp.lng - position.lng);
        if (distance < minDistance) {
            minDistance = distance;
            closestWaypoint = wp;
        }
    });
    
    return closestWaypoint;
}

// Format time for display
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Make initMap available globally
window.initMap = initMap;
