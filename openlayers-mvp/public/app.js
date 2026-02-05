// Global variables
let map;
let vectorSource;
let vectorLayer;
let locationData = [];
let waypoints = [];
let currentPlaybackIndex = 0;
let playbackInterval;
let isPlaying = false;
let playbackSpeed = 1;
let vehicleFeature = null;
let traveledLineFeature = null;
let overlay = null;
const API_BASE_URL = '/api';

// Initialize OpenLayers Map
function initMap() {
    // Create vector source and layer for markers and lines
    vectorSource = new ol.source.Vector();
    
    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleFunction
    });

    // Create map with OpenStreetMap tiles
    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            }),
            vectorLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([77.2090, 28.6139]), // Delhi, India
            zoom: 13
        })
    });

    // Create popup overlay
    const container = document.createElement('div');
    container.className = 'ol-popup';
    container.id = 'popup';
    container.innerHTML = '<a href="#" id="popup-closer" class="ol-popup-closer"></a><div id="popup-content"></div>';
    document.body.appendChild(container);

    overlay = new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    });
    map.addOverlay(overlay);

    const closer = document.getElementById('popup-closer');
    closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    };

    // Click handler for markers
    map.on('click', function(evt) {
        const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
            return feature;
        });

        if (feature && feature.get('type') === 'marker') {
            const location = feature.get('location');
            const index = feature.get('index');
            const content = createInfoWindowContent(location, index);
            document.getElementById('popup-content').innerHTML = content;
            overlay.setPosition(feature.getGeometry().getCoordinates());
        } else {
            overlay.setPosition(undefined);
        }
    });

    // Change cursor on hover
    map.on('pointermove', function(evt) {
        const hit = map.hasFeatureAtPixel(evt.pixel);
        map.getTarget().style.cursor = hit ? 'pointer' : '';
    });

    // Initialize UI event listeners
    initEventListeners();
    
    // Load available routes
    loadRoutes();
    
    console.log('OpenLayers map initialized successfully');
}

// Style function for features
function styleFunction(feature) {
    const type = feature.get('type');
    
    if (type === 'marker') {
        return new ol.style.Style({
            image: feature.get('icon')
        });
    } else if (type === 'line') {
        const color = feature.get('color') || '#1565C0';
        const isDashed = feature.get('dashed') || false;
        
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: color,
                width: isDashed ? 6 : 8,
                lineDash: isDashed ? [15, 10] : undefined
            })
        });
    } else if (type === 'vehicle') {
        return new ol.style.Style({
            image: new ol.style.Icon({
                src: 'data:image/svg+xml;utf8,' + encodeURIComponent(createVehicleSVG()),
                scale: 1,
                rotation: feature.get('rotation') || 0
            })
        });
    } else if (type === 'traveled') {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#FBBC04',
                width: 6
            })
        });
    }
}

// Create SVG for vehicle marker
function createVehicleSVG() {
    return `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#4285F4" stroke="white" stroke-width="2"/>
        <path d="M12 6 L12 12 L16 16" stroke="white" stroke-width="2" fill="none"/>
    </svg>`;
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
            locationData = result.data.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            if (locationData.length === 0) {
                alert('No location data found. Try loading sample data first.');
                return;
            }
            
            console.log(`Loaded ${locationData.length} location points`);
            
            // Clear existing features
            clearMap();
            
            // Display all markers and routes
            displayAllMarkers();
            
            // Update statistics
            updateStatistics(result.routes);
            
            // Set total time
            if (locationData.length > 0) {
                const totalTime = new Date(locationData[locationData.length - 1].timestamp);
                document.getElementById('totalTime').textContent = formatTime(totalTime);
            }
            
            // Enable playback controls
            enablePlaybackControls();
            
            // Reset playback
            resetPlayback();
            
            alert(`✅ Loaded ${locationData.length} location points!`);
        } else {
            alert(`❌ Error: ${result.message || 'Failed to load location data'}`);
        }
    } catch (error) {
        console.error('Error loading location data:', error);
        alert('❌ Error loading location data. Make sure the server is running on port 3000.');
    }
}

// Clear all features from map
function clearMap() {
    vectorSource.clear();
    vehicleFeature = null;
    traveledLineFeature = null;
    overlay.setPosition(undefined);
}

// Display all markers on the map
function displayAllMarkers() {
    if (locationData.length === 0) return;
    
    const coordinates = [];
    
    // Draw polyline connecting all points
    locationData.forEach((location, index) => {
        const coord = ol.proj.fromLonLat([location.lng, location.lat]);
        coordinates.push(coord);
    });
    
    // Create line feature
    const lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString(coordinates),
        type: 'line',
        color: '#1565C0'
    });
    vectorSource.addFeature(lineFeature);
    
    // Create markers
    locationData.forEach((location, index) => {
        const coord = ol.proj.fromLonLat([location.lng, location.lat]);
        
        const isStart = index === 0;
        const isEnd = index === locationData.length - 1;
        const isImportant = location.flag === 'check_in' || 
                           location.flag === 'check_out' || 
                           location.flag === 'visit';
        
        // Only show markers for start, end, and important flags
        if (isStart || isEnd || isImportant) {
            const markerFeature = new ol.Feature({
                geometry: new ol.geom.Point(coord),
                type: 'marker',
                location: location,
                index: index,
                icon: createMarkerIcon(location.flag, index, locationData.length, isStart, isEnd)
            });
            
            vectorSource.addFeature(markerFeature);
        }
    });
    
    // Store waypoints for playback
    waypoints = locationData.map(loc => ({
        coord: ol.proj.fromLonLat([loc.lng, loc.lat]),
        lat: loc.lat,
        lng: loc.lng,
        timestamp: loc.timestamp,
        address: loc.address,
        flag: loc.flag
    }));
    
    // Create vehicle marker
    if (coordinates.length > 0) {
        createVehicleMarker(coordinates[0]);
    }
    
    // Fit map to show all features
    map.getView().fit(vectorSource.getExtent(), {
        padding: [50, 50, 50, 50],
        maxZoom: 16
    });
    
    console.log(`Displayed ${locationData.length} points with route line`);
}

// Create marker icon
function createMarkerIcon(flag, index, total, isStart, isEnd) {
    let color, text;
    
    if (isStart) {
        color = '#00C853';
        text = 'S';
    } else if (isEnd) {
        color = '#FF1744';
        text = 'E';
    } else {
        switch(flag) {
            case 'check_in':
                color = '#28a745';
                text = '✓';
                break;
            case 'check_out':
                color = '#dc3545';
                text = '✗';
                break;
            case 'visit':
                color = '#ffc107';
                text = 'V';
                break;
            default:
                color = '#667eea';
                text = (index + 1).toString();
        }
    }
    
    const canvas = document.createElement('canvas');
    const size = 30;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);
    
    return new ol.style.Icon({
        img: canvas,
        imgSize: [size, size],
        anchor: [0.5, 0.5]
    });
}

// Create vehicle marker for playback
function createVehicleMarker(coord) {
    if (vehicleFeature) {
        vectorSource.removeFeature(vehicleFeature);
    }
    
    vehicleFeature = new ol.Feature({
        geometry: new ol.geom.Point(coord),
        type: 'vehicle',
        rotation: 0
    });
    
    vectorSource.addFeature(vehicleFeature);
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
function updateStatistics(routes) {
    const checkIns = locationData.filter(loc => loc.flag === 'check_in').length;
    const checkOuts = locationData.filter(loc => loc.flag === 'check_out').length;
    const visits = locationData.filter(loc => loc.flag === 'visit').length;
    
    document.getElementById('totalPoints').textContent = locationData.length;
    document.getElementById('checkIns').textContent = checkIns;
    document.getElementById('checkOuts').textContent = checkOuts;
    document.getElementById('visits').textContent = visits;
    
    // Calculate total distance from routes info
    let totalDistance = 0;
    if (routes) {
        Object.values(routes).forEach(route => {
            totalDistance += parseFloat(route.totalDistance || 0);
        });
    }
    document.getElementById('routeDistance').textContent = totalDistance.toFixed(2) + ' km';
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
    if (waypoints.length === 0) {
        alert('Please load location data first');
        return;
    }
    
    isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    if (playbackInterval) {
        clearInterval(playbackInterval);
    }
    
    const intervalTime = 100 / playbackSpeed;
    
    playbackInterval = setInterval(() => {
        if (currentPlaybackIndex >= waypoints.length - 1) {
            pausePlayback();
            currentPlaybackIndex = 0;
            if (traveledLineFeature) {
                vectorSource.removeFeature(traveledLineFeature);
                traveledLineFeature = null;
            }
            if (vehicleFeature) {
                vehicleFeature.getGeometry().setCoordinates(waypoints[0].coord);
            }
            updatePlaybackDisplay();
            return;
        }
        
        updatePlaybackDisplay();
        currentPlaybackIndex++;
    }, intervalTime);
    
    console.log(`Playback started at ${playbackSpeed}x speed`);
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
}

// Update playback display
function updatePlaybackDisplay() {
    if (waypoints.length === 0 || currentPlaybackIndex >= waypoints.length) return;
    
    const currentPosition = waypoints[currentPlaybackIndex];
    
    // Move vehicle marker
    if (vehicleFeature) {
        vehicleFeature.getGeometry().setCoordinates(currentPosition.coord);
        
        // Calculate rotation if we have next point
        if (currentPlaybackIndex < waypoints.length - 1) {
            const nextPosition = waypoints[currentPlaybackIndex + 1];
            const dx = nextPosition.coord[0] - currentPosition.coord[0];
            const dy = nextPosition.coord[1] - currentPosition.coord[1];
            const rotation = Math.atan2(dy, dx);
            vehicleFeature.set('rotation', rotation);
        }
    }
    
    // Center map on vehicle
    map.getView().animate({
        center: currentPosition.coord,
        duration: 100
    });
    
    // Update traveled path
    updateTraveledPath();
    
    // Update timeline slider
    const progress = (currentPlaybackIndex / (waypoints.length - 1)) * 100;
    document.getElementById('timelineSlider').value = Math.min(100, Math.max(0, progress));
    
    // Update time display
    if (currentPosition.timestamp) {
        const time = new Date(currentPosition.timestamp);
        document.getElementById('currentTime').textContent = formatTime(time);
    }
}

// Update traveled path
function updateTraveledPath() {
    if (currentPlaybackIndex < 1) return;
    
    const traveledCoords = waypoints.slice(0, currentPlaybackIndex + 1).map(wp => wp.coord);
    
    if (traveledLineFeature) {
        traveledLineFeature.getGeometry().setCoordinates(traveledCoords);
    } else {
        traveledLineFeature = new ol.Feature({
            geometry: new ol.geom.LineString(traveledCoords),
            type: 'traveled'
        });
        vectorSource.addFeature(traveledLineFeature);
    }
}

// Format time for display
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Initialize map when page loads
window.addEventListener('DOMContentLoaded', initMap);
