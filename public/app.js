// Global variables
let map;
let markers = [];
let polyline;
let locationData = [];
let currentPlaybackIndex = 0;
let playbackInterval;
let isPlaying = false;
let playbackSpeed = 1;
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize Google Map
function initMap() {
    // Default center (Delhi, India)
    const defaultCenter = { lat: 28.6139, lng: 77.2090 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultCenter,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'poi',
                stylers: [{ visibility: 'on' }]
            }
        ]
    });

    // Initialize UI event listeners
    initEventListeners();
    
    // Load available routes
    loadRoutes();
    
    console.log('Map initialized successfully');
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
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            locationData = result.data;
            
            if (locationData.length === 0) {
                alert('No location data found. Try loading sample data first.');
                return;
            }
            
            // Clear existing markers and polyline
            clearMap();
            
            // Display all markers on the map
            displayAllMarkers();
            
            // Update statistics
            updateStatistics();
            
            // Enable playback controls
            enablePlaybackControls();
            
            // Reset playback
            resetPlayback();
            
            alert(`Loaded ${locationData.length} location points!`);
        }
    } catch (error) {
        console.error('Error loading location data:', error);
        alert('Error loading location data. Make sure the server is running on port 3000.');
    }
}

// Clear all markers and polyline from map
function clearMap() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    if (polyline) {
        polyline.setMap(null);
        polyline = null;
    }
}

// Display all markers on the map
function displayAllMarkers() {
    if (locationData.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    const path = [];
    
    locationData.forEach((location, index) => {
        const position = { lat: location.lat, lng: location.lng };
        path.push(position);
        bounds.extend(position);
        
        // Create marker with custom icon based on flag
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: location.address || `Point ${index + 1}`,
            icon: getMarkerIcon(location.flag),
            animation: null
        });
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent(location, index)
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
    });
    
    // Draw polyline connecting all points
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

// Start playback
function startPlayback() {
    if (locationData.length === 0) return;
    
    isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    // Clear existing interval
    if (playbackInterval) {
        clearInterval(playbackInterval);
    }
    
    // Calculate interval based on speed (base is 1 second per point)
    const intervalTime = 1000 / playbackSpeed;
    
    playbackInterval = setInterval(() => {
        if (currentPlaybackIndex >= locationData.length) {
            pausePlayback();
            return;
        }
        
        updatePlaybackDisplay();
        currentPlaybackIndex++;
    }, intervalTime);
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

// Update playback display
function updatePlaybackDisplay() {
    if (locationData.length === 0) return;
    
    // Reset all markers
    markers.forEach(marker => {
        marker.setAnimation(null);
        marker.setOpacity(0.5);
    });
    
    // Highlight markers up to current index
    for (let i = 0; i <= currentPlaybackIndex && i < markers.length; i++) {
        markers[i].setOpacity(1);
        
        // Animate current marker
        if (i === currentPlaybackIndex) {
            markers[i].setAnimation(google.maps.Animation.BOUNCE);
            
            // Center map on current marker
            map.panTo(markers[i].getPosition());
        }
    }
    
    // Update timeline
    const progress = (currentPlaybackIndex / locationData.length) * 100;
    document.getElementById('timelineSlider').value = progress;
    
    // Update time display
    if (locationData[currentPlaybackIndex]) {
        const currentTime = new Date(locationData[currentPlaybackIndex].timestamp);
        const startTime = new Date(locationData[0].timestamp);
        
        document.getElementById('currentTime').textContent = formatTime(currentTime);
        document.getElementById('totalTime').textContent = formatTime(new Date(locationData[locationData.length - 1].timestamp));
    }
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
