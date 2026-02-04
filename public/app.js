// Global variables
let map;
let markers = [];
let polyline;
let polylineSegments = []; // Multiple polyline segments for road-snapped paths
let gapPolylines = []; // Dashed red lines for gaps (OFF segments)
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
const API_BASE_URL = '/api';

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
    
    // Clear polyline segments
    polylineSegments.forEach(segment => {
        if (segment && segment.setMap) {
            segment.setMap(null);
        }
    });
    polylineSegments = [];
    
    // Clear gap polylines
    gapPolylines.forEach(gap => {
        if (gap && gap.setMap) {
            gap.setMap(null);
        }
    });
    gapPolylines = [];
    
    // Clear traveled polyline
    if (traveledPolyline) {
        traveledPolyline.setMap(null);
        traveledPolyline = null;
    }
    
    // Clear vehicle marker
    if (vehicleMarker) {
        vehicleMarker.setMap(null);
        vehicleMarker = null;
    }
    
    // Clear route path
    routePath = [];
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
    
    // Show ALL markers with numbers (no downsampling)
    // Note: For very large datasets (1000+), this may impact performance
    const total = locationData.length;
    const markerStep = 1; // Show every marker
    
    // Separate locations into segments based on provider (similar to Android OFF detection)
    const segments = processLocationSegments(locationData);
    
    locationData.forEach((location, index) => {
        const position = { lat: location.lat, lng: location.lng };
        
        // Always add to path for polyline
        path.push(position);
        bounds.extend(position);
        
        // Only create markers based on downsampling step or for important flags
        const isImportantFlag = location.flag === 'check_in' || 
                               location.flag === 'check_out' || 
                               location.flag === 'visit';
        const isStartOrEnd = index === 0 || index === locationData.length - 1;
        const shouldShowMarker = (index % markerStep === 0) || isImportantFlag || isStartOrEnd;
        
        if (shouldShowMarker) {
            // Determine marker icon - use numbered markers for better tracking
            let markerIcon;
            if (index === 0) {
                // Start marker - Green with "S"
                markerIcon = createStartEndMarkerIcon('S', '#00C853');
            } else if (index === locationData.length - 1) {
                // End marker - Red with "E"
                markerIcon = createStartEndMarkerIcon('E', '#FF1744');
            } else {
                // Numbered marker
                markerIcon = createNumberedMarkerIcon(index + 1, isImportantFlag);
            }
            
            // Create marker with numbered icon
            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: `Point ${index + 1}: ${location.address || 'No address'}`,
                icon: markerIcon,
                label: null, // Using custom icon instead
                animation: null,
                zIndex: isStartOrEnd ? 1000 : (isImportantFlag ? 500 : 100)
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
    });
    
    // Store waypoints for playback
    waypoints = locationData.map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        timestamp: loc.timestamp,
        address: loc.address,
        flag: loc.flag
    }));
    
    // Draw road-snapped polylines for each segment
    console.log(`Processing ${segments.activeSegments.length} active segments and ${segments.gapSegments.length} gap segments`);
    
    // Draw gap segments first (dashed red lines)
    segments.gapSegments.forEach(gap => {
        const gapPolyline = new google.maps.Polyline({
            path: gap,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 6,
            map: map,
            zIndex: 50,
            icons: [{
                icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3
                },
                offset: '0',
                repeat: '15px'
            }]
        });
        gapPolylines.push(gapPolyline);
    });
    
    // Draw active segments with road-snapped paths
    for (const segment of segments.activeSegments) {
        if (segment.length >= 2) {
            await fetchDirectionsPath(segment, '#1565C0'); // Blue color like Android
        }
    }
    
    // Create vehicle marker for playback
    if (path.length > 0) {
        createVehicleMarker(path[0]);
    }
    
    // Fit map to show all markers
    map.fitBounds(bounds);
    
    console.log(`Displayed ${markers.length} markers out of ${total} points (step: ${markerStep})`);
}

// Process location data into segments (active tracking vs gaps)
function processLocationSegments(locations) {
    const activeSegments = [];
    const gapSegments = [];
    let currentSegment = [];
    
    for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];
        const position = { lat: loc.lat, lng: loc.lng };
        
        // Check if this is a gap (locationProvider === 'OFF' or significant time gap)
        const isGap = loc.locationProvider === 'OFF';
        
        if (!isGap) {
            currentSegment.push(position);
        } else {
            // End current segment if it has enough points
            if (currentSegment.length >= 2) {
                activeSegments.push([...currentSegment]);
            }
            
            // Add gap line from previous point to current
            if (i > 0) {
                const prevLoc = locations[i - 1];
                gapSegments.push([
                    { lat: prevLoc.lat, lng: prevLoc.lng },
                    position
                ]);
            }
            
            currentSegment = [];
        }
    }
    
    // Don't forget the last segment
    if (currentSegment.length >= 2) {
        activeSegments.push(currentSegment);
    }
    
    // If no gaps detected, treat entire path as one segment
    if (activeSegments.length === 0 && locations.length >= 2) {
        activeSegments.push(locations.map(loc => ({ lat: loc.lat, lng: loc.lng })));
    }
    
    return { activeSegments, gapSegments };
}

// Fetch directions path using Google Directions API (similar to Android implementation)
async function fetchDirectionsPath(points, lineColor) {
    if (points.length < 2) return;
    
    return new Promise((resolve) => {
        try {
            const origin = points[0];
            const destination = points[points.length - 1];
            
            // Waypoint limit is 25 total (23 intermediate). Downsample if needed.
            let waypointsList = [];
            if (points.length > 2) {
                const intermediates = points.slice(1, points.length - 1);
                const step = intermediates.length > 23 ? Math.ceil(intermediates.length / 23) : 1;
                waypointsList = intermediates
                    .filter((_, index) => index % step === 0)
                    .slice(0, 23)
                    .map(point => ({
                        location: new google.maps.LatLng(point.lat, point.lng),
                        stopover: true  // Must be true to ensure route passes through each waypoint
                    }));
            }
            
            const request = {
                origin: new google.maps.LatLng(origin.lat, origin.lng),
                destination: new google.maps.LatLng(destination.lat, destination.lng),
                waypoints: waypointsList,
                optimizeWaypoints: false,  // Keep original order, don't reorder waypoints
                travelMode: google.maps.TravelMode.WALKING  // DRIVING for proper road following
            };
            
            directionsService.route(request, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    // Extract the path from the directions result
                    const snappedPath = [];
                    const route = result.routes[0];
                    
                    route.legs.forEach(leg => {
                        leg.steps.forEach(step => {
                            step.path.forEach(point => {
                                snappedPath.push({ lat: point.lat(), lng: point.lng() });
                            });
                        });
                    });
                    
                    // Store for playback
                    routePath = routePath.concat(snappedPath);
                    
                    // Draw the road-snapped polyline
                    const roadPolyline = new google.maps.Polyline({
                        path: snappedPath,
                        geodesic: true,
                        strokeColor: lineColor,
                        strokeOpacity: 1.0,
                        strokeWeight: 8,
                        map: map,
                        zIndex: 100
                    });
                    polylineSegments.push(roadPolyline);
                    
                    console.log(`Road-snapped path added with ${snappedPath.length} points`);
                    resolve();
                } else {
                    console.warn(`Directions API failed: ${status}, falling back to straight line`);
                    drawFallbackPolyline(points, lineColor);
                    resolve();
                }
            });
        } catch (error) {
            console.error('Error fetching directions:', error);
            drawFallbackPolyline(points, lineColor);
            resolve();
        }
    });
}

// Fallback polyline when Directions API fails
function drawFallbackPolyline(points, lineColor) {
    const fallbackPolyline = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: lineColor,
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: map,
        zIndex: 100
    });
    polylineSegments.push(fallbackPolyline);
    routePath = routePath.concat(points);
}

// Create vehicle marker for playback
function createVehicleMarker(position) {
    if (vehicleMarker) {
        vehicleMarker.setMap(null);
    }
    
    vehicleMarker = new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 6,
            rotation: 0
        },
        zIndex: 2000,
        title: 'Current Position'
    });
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

// Enhanced marker icon with start/end support (like Android implementation)
function getMarkerIconEnhanced(flag, index, totalPoints) {
    // Start marker - Green like Android
    if (index === 0) {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#00C853', // Green
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 12
        };
    }
    
    // End marker - Red like Android
    if (index === totalPoints - 1) {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#FF1744', // Red
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 12
        };
    }
    
    // Use standard icons for other flags
    return getMarkerIcon(flag);
}

// Create numbered marker icon (like Android createNumberedMarker)
function createNumberedMarkerIcon(number, isImportantFlag = false) {
    const size = 30;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw circle background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
    ctx.fillStyle = isImportantFlag ? '#FFC107' : '#1565C0'; // Yellow for important, Blue for normal
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw number text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), size / 2, size / 2);
    
    return {
        url: canvas.toDataURL(),
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2)
    };
}

// Create start/end marker icon with letter
function createStartEndMarkerIcon(letter, color) {
    const size = 36;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw circle background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw letter text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, size / 2, size / 2);
    
    return {
        url: canvas.toDataURL(),
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2)
    };
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
