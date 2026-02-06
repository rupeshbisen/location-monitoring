// ── State ────────────────────────────────────────────────
const API_URL = '/api/locations';
const OSRM_BASE = 'https://router.project-osrm.org';
const OSRM_BATCH_SIZE = 10; // public OSRM match API limit
const MIN_POINT_GAP_M = 15; // noise filter: skip points closer than this

let map;
let locationData = [];            // flat array of point objects from API
let routePath = [];               // road-snapped [lat, lng] path for playback
let pointMarkers = [];            // L.marker[]
let routePolylines = [];          // L.polyline[] for route segments
let traveledPolyline = null;      // L.polyline for traveled portion
let vehicleMarker = null;         // L.marker (moving dot)

let currentPlaybackIndex = 0;
let playbackInterval = null;
let isPlaying = false;
let playbackSpeed = 1;

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    map = L.map('map', { zoomControl: true }).setView([21.09, 79.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    initEventListeners();
});

// ── Event listeners ──────────────────────────────────────
function initEventListeners() {
    document.getElementById('loadDataBtn').addEventListener('click', loadLocationData);
    document.getElementById('playBtn').addEventListener('click', startPlayback);
    document.getElementById('pauseBtn').addEventListener('click', pausePlayback);
    document.getElementById('resetBtn').addEventListener('click', resetPlayback);

    document.getElementById('speedSlider').addEventListener('input', function (e) {
        playbackSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = playbackSpeed + 'x';
        if (isPlaying) { pausePlayback(); startPlayback(); }
    });

    document.getElementById('timelineSlider').addEventListener('input', function (e) {
        var value = parseInt(e.target.value);
        var path = getPlaybackPath();
        if (path.length > 0) {
            currentPlaybackIndex = Math.floor((value / 100) * (path.length - 1));
            updatePlaybackDisplay();
        }
    });
}

// ── Data loading ─────────────────────────────────────────
async function loadLocationData() {
    try {
        var response = await fetch(API_URL);
        var result = await response.json();

        if (!result.success) { alert('Failed to load location data'); return; }

        // Convert {lat, lng} to [lat, lng] for Leaflet
        locationData = result.data.map(function (loc) {
            return {
                id: loc.id,
                coords: [loc.lat, loc.lng],
                address: loc.address,
                routeId: loc.routeId,
                timestamp: loc.timestamp,
                flag: loc.flag
            };
        });
        if (locationData.length === 0) { alert('No location data found.'); return; }

        // Compute stats from response data
        var flags = { check_in: 0, check_out: 0, visit: 0, normal: 0 };
        locationData.forEach(function (pt) {
            flags[pt.flag] = (flags[pt.flag] || 0) + 1;
        });

        // Use route info from server for distance/duration (pick first route)
        var routeKeys = Object.keys(result.routes || {});
        var routeInfo = routeKeys.length > 0 ? result.routes[routeKeys[0]] : null;

        var stats = {
            totalPoints: locationData.length,
            totalDistance: routeInfo ? routeInfo.totalDistance : '0',
            duration: routeInfo ? routeInfo.duration : '--',
            flags: flags
        };

        // Clear existing
        clearMap();

        // 1) Draw markers
        displayMarkers();

        // 2) Draw straight-line polyline immediately (always visible)
        var rawCoords = locationData.map(function (pt) { return pt.coords; });
        drawRoute([rawCoords]);
        routePath = rawCoords;

        // 3) Try OSRM road-snapping in background — replaces polyline if successful
        tryRoadSnap();

        // 4) Stats & controls
        updateStatistics(stats);
        if (locationData.length > 0) {
            document.getElementById('totalTime').textContent =
                formatTime(new Date(locationData[locationData.length - 1].timestamp));
        }
        enablePlaybackControls();
        resetPlayback();

        console.log('Loaded ' + locationData.length + ' points');
    } catch (error) {
        console.error('Error loading location data:', error);
        alert('Error loading location data. Make sure the server is running.');
    }
}

// ── Route drawing ────────────────────────────────────────
// legs = array of [lat,lng][] segments
function drawRoute(legs) {
    // Remove old polylines
    routePolylines.forEach(function (pl) { map.removeLayer(pl); });
    routePolylines = [];

    var allCoords = [];
    legs.forEach(function (leg) {
        if (leg.length < 2) return;
        var pl = L.polyline(leg, { color: '#667eea', weight: 5, opacity: 0.8 }).addTo(map);
        routePolylines.push(pl);
        allCoords = allCoords.concat(leg);
    });

    if (allCoords.length >= 2) {
        map.fitBounds(L.latLngBounds(allCoords).pad(0.1));
    }
}

// ── OSRM map-matching (progressive enhancement) ─────────
async function tryRoadSnap() {
    try {
        var raw = locationData.map(function (pt) { return pt.coords; });
        if (raw.length < 2) return;

        // Noise filter — drop points closer than MIN_POINT_GAP_M
        var filtered = [raw[0]];
        for (var i = 1; i < raw.length; i++) {
            if (haversineM(filtered[filtered.length - 1], raw[i]) >= MIN_POINT_GAP_M) {
                filtered.push(raw[i]);
            }
        }
        if (filtered[filtered.length - 1] !== raw[raw.length - 1]) {
            filtered.push(raw[raw.length - 1]);
        }
        if (filtered.length < 2) return;

        console.log('OSRM: ' + filtered.length + ' pts after noise filter (from ' + raw.length + ')');

        // Batch
        var batches = [];
        for (var j = 0; j < filtered.length; j += OSRM_BATCH_SIZE - 1) {
            var batch = filtered.slice(j, j + OSRM_BATCH_SIZE);
            if (batch.length >= 2) batches.push(batch);
        }

        var allLegs = [];
        var anySuccess = false;

        for (var k = 0; k < batches.length; k++) {
            var legs = await osrmMatch(batches[k]);
            if (legs) {
                allLegs = allLegs.concat(legs);
                anySuccess = true;
            } else {
                // fallback: straight line for this batch
                allLegs.push(batches[k]);
            }
        }

        if (!anySuccess) {
            console.warn('OSRM: all batches failed, keeping straight-line polyline');
            return;
        }

        // Replace polyline and playback path with road-snapped version
        var snapped = [];
        allLegs.forEach(function (leg) { snapped = snapped.concat(leg); });

        routePath = snapped;
        drawRoute(allLegs);
        console.log('OSRM: road-snapped ' + snapped.length + ' points across ' + allLegs.length + ' leg(s)');
    } catch (err) {
        console.warn('OSRM road-snap failed, keeping straight-line polyline:', err.message);
    }
}

// Single OSRM match request
async function osrmMatch(latLngs) {
    var coordStr = latLngs.map(function (c) { return c[1] + ',' + c[0]; }).join(';');
    var radiuses = latLngs.map(function () { return '25'; }).join(';');
    var url = OSRM_BASE + '/match/v1/driving/' + coordStr +
        '?overview=full&geometries=geojson&gaps=split&radiuses=' + radiuses;

    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var json = await res.json();

    if (json.code !== 'Ok' || !json.matchings || json.matchings.length === 0) {
        return null;
    }

    return json.matchings.map(function (m) {
        return m.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
    });
}

// ── Map rendering ────────────────────────────────────────
function displayMarkers() {
    if (locationData.length === 0) return;

    locationData.forEach(function (pt, i) {
        var isStart = i === 0;
        var isEnd = i === locationData.length - 1;
        var cssClass = getMarkerClass(pt.flag, isStart, isEnd);
        var label = isStart ? 'S' : isEnd ? 'E' : getFlagLabel(pt.flag, i);
        var size = (isStart || isEnd) ? 30 : (pt.flag !== 'normal' ? 26 : 22);

        var icon = L.divIcon({
            className: '',
            html: '<div class="lm-marker ' + cssClass + '">' + label + '</div>',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
        });

        var marker = L.marker(pt.coords, { icon: icon }).addTo(map);
        marker.bindPopup(createPopupContent(pt, i));
        pointMarkers.push(marker);
    });

    // Vehicle marker for playback
    vehicleMarker = L.marker(locationData[0].coords, {
        icon: L.divIcon({
            className: '',
            html: '<div class="lm-vehicle"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        }),
        zIndexOffset: 1000
    }).addTo(map);
}

function getMarkerClass(flag, isStart, isEnd) {
    if (isStart) return 'lm-marker-start';
    if (isEnd) return 'lm-marker-end';
    var classes = { check_in: 'lm-marker-checkin', check_out: 'lm-marker-checkout', visit: 'lm-marker-visit' };
    return classes[flag] || 'lm-marker-normal';
}

function getFlagLabel(flag, index) {
    var labels = { check_in: 'CI', check_out: 'CO', visit: 'V' };
    return labels[flag] || (index + 1);
}

function createPopupContent(pt, index) {
    var flagNames = { check_in: 'Check-in', check_out: 'Check-out', visit: 'Visit', normal: 'Normal Point' };
    var ts = new Date(pt.timestamp).toLocaleString();
    return '<div style="padding:8px;min-width:180px;">' +
        '<h3 style="margin:0 0 8px 0;color:#333;">' + (flagNames[pt.flag] || 'Normal Point') + '</h3>' +
        '<p style="margin:4px 0;"><strong>Point:</strong> ' + (index + 1) + ' / ' + locationData.length + '</p>' +
        (pt.address ? '<p style="margin:4px 0;"><strong>Address:</strong> ' + pt.address + '</p>' : '') +
        '<p style="margin:4px 0;"><strong>Time:</strong> ' + ts + '</p>' +
        '<p style="margin:4px 0;"><strong>Coords:</strong> ' + pt.coords[0].toFixed(6) + ', ' + pt.coords[1].toFixed(6) + '</p>' +
        '</div>';
}

function clearMap() {
    pointMarkers.forEach(function (m) { map.removeLayer(m); });
    pointMarkers = [];
    routePolylines.forEach(function (pl) { map.removeLayer(pl); });
    routePolylines = [];
    if (traveledPolyline) { map.removeLayer(traveledPolyline); traveledPolyline = null; }
    if (vehicleMarker) { map.removeLayer(vehicleMarker); vehicleMarker = null; }
    routePath = [];
}

// ── Statistics ───────────────────────────────────────────
function updateStatistics(stats) {
    document.getElementById('totalPoints').textContent = stats.totalPoints;
    document.getElementById('routeDistance').textContent = stats.totalDistance + ' km';
    document.getElementById('checkIns').textContent = stats.flags.check_in;
    document.getElementById('checkOuts').textContent = stats.flags.check_out;
    document.getElementById('visits').textContent = stats.flags.visit;
}

function enablePlaybackControls() {
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('timelineSlider').disabled = false;
}

// ── Playback ─────────────────────────────────────────────
function getPlaybackPath() {
    return routePath.length > 0 ? routePath : locationData.map(function (pt) { return pt.coords; });
}

function startPlayback() {
    var path = getPlaybackPath();
    if (path.length === 0) { alert('Please load location data first'); return; }

    isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;

    if (playbackInterval) clearInterval(playbackInterval);
    var intervalTime = Math.max(20, 100 / playbackSpeed);

    playbackInterval = setInterval(function () {
        if (currentPlaybackIndex >= path.length - 1) {
            pausePlayback();
            currentPlaybackIndex = 0;
            if (traveledPolyline) { map.removeLayer(traveledPolyline); traveledPolyline = null; }
            if (vehicleMarker) vehicleMarker.setLatLng(path[0]);
            updatePlaybackDisplay();
            return;
        }
        currentPlaybackIndex++;
        updatePlaybackDisplay();
    }, intervalTime);
}

function pausePlayback() {
    isPlaying = false;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    if (playbackInterval) { clearInterval(playbackInterval); playbackInterval = null; }
}

function resetPlayback() {
    pausePlayback();
    currentPlaybackIndex = 0;
    if (traveledPolyline) { map.removeLayer(traveledPolyline); traveledPolyline = null; }
    var path = getPlaybackPath();
    if (path.length > 0 && vehicleMarker) { vehicleMarker.setLatLng(path[0]); }
    document.getElementById('timelineSlider').value = 0;
    document.getElementById('currentTime').textContent = '00:00:00';
}

function updatePlaybackDisplay() {
    var path = getPlaybackPath();
    if (path.length === 0 || currentPlaybackIndex >= path.length) return;

    var currentCoord = path[currentPlaybackIndex];

    if (vehicleMarker) vehicleMarker.setLatLng(currentCoord);

    // Traveled trail
    var traveled = path.slice(0, currentPlaybackIndex + 1);
    if (traveledPolyline) {
        traveledPolyline.setLatLngs(traveled);
    } else {
        traveledPolyline = L.polyline(traveled, { color: '#ffc107', weight: 6, opacity: 0.9 }).addTo(map);
    }

    map.panTo(currentCoord, { animate: true, duration: 0.15 });

    var progress = (currentPlaybackIndex / (path.length - 1)) * 100;
    document.getElementById('timelineSlider').value = Math.round(progress);

    var closest = findClosestWaypoint(currentCoord);
    if (closest) {
        document.getElementById('currentTime').textContent = formatTime(new Date(closest.timestamp));
    }
}

// ── Helpers ──────────────────────────────────────────────
function findClosestWaypoint(coord) {
    var minDist = Infinity;
    var closest = null;
    for (var i = 0; i < locationData.length; i++) {
        var pt = locationData[i];
        var d = Math.abs(pt.coords[0] - coord[0]) + Math.abs(pt.coords[1] - coord[1]);
        if (d < minDist) { minDist = d; closest = pt; }
    }
    return closest;
}

function haversineM(a, b) {
    var R = 6371000;
    var dLat = (b[0] - a[0]) * Math.PI / 180;
    var dLng = (b[1] - a[1]) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatTime(date) {
    var hh = String(date.getHours()).padStart(2, '0');
    var mm = String(date.getMinutes()).padStart(2, '0');
    var ss = String(date.getSeconds()).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
}
