const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'location_data.json');

// Create empty data structure
function createEmptyData(message = 'Route data loaded successfully') {
    return {
        status: 'success',
        data: [],
        total: 0,
        showing: 0,
        processing_time: '0ms',
        stats: {
            total_points: 0,
            visit_points: 0,
            start_time: null,
            end_time: null
        },
        message
    };
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(createEmptyData(), null, 2));
}

// Helper function to read raw location data
function readRawLocationData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return createEmptyData();
    }
}

function parseTimestamp(value) {
    if (!value) {
        return new Date().toISOString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'number') {
        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(',', '');
        const parsedDate = new Date(cleaned);
        return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toISOString();
    }
    return new Date().toISOString();
}

function normalizeLocationData(rawData) {
    if (!rawData || !Array.isArray(rawData.data)) {
        return { locations: [], rawData };
    }
    
    const locations = rawData.data.map((row, index) => {
        const flagRaw = row[9] || 'normal';
        const allowedFlags = ['check_in', 'check_out', 'visit', 'normal'];
        
        return {
            id: index + 1,
            lat: Number(row[0]),
            lng: Number(row[1]),
            address: row[2] || '',
            routeId: row[6] || 'default_route',
            timestamp: parseTimestamp(row[7]),
            flag: allowedFlags.includes(flagRaw) ? flagRaw : 'normal'
        };
    });

    return { locations, rawData };
}

// Update stats after data change
function updateStats(rawData, timestamp) {
    const count = rawData.data.length;
    rawData.total = count;
    rawData.showing = count;
    if (rawData.stats) {
        rawData.stats.total_points = count;
        rawData.stats.start_time = rawData.stats.start_time || timestamp;
        rawData.stats.end_time = timestamp;
    }
}

function appendLocationToRaw(rawData, locationPoint) {
    const timestamp = typeof locationPoint.timestamp === 'string'
        ? locationPoint.timestamp
        : parseTimestamp(locationPoint.timestamp);

    const row = [
        locationPoint.lat,
        locationPoint.lng,
        locationPoint.address || '',
        '-',
        '-',
        null,
        locationPoint.routeId || 'default_route',
        timestamp,
        '.',
        locationPoint.flag || 'normal'
    ];

    rawData.data = rawData.data || [];
    rawData.data.push(row);
    updateStats(rawData, timestamp);
    
    return rawData;
}

// Helper function to read normalized location data
function readLocationData() {
    const rawData = readRawLocationData();
    return normalizeLocationData(rawData);
}

// Helper function to write location data
function writeLocationData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate sample tracking data for demo/testing
function generateSampleData() {
    const baseTime = new Date('2026-01-12T09:20:00');
    const baseLat = 21.0894;
    const baseLng = 79.0910;
    const routes = ['Sandeep', 'Rupesh'];
    const data = [];
    
    routes.forEach(routeId => {
        for (let i = 0; i < 20; i++) {
            const time = new Date(baseTime.getTime() + i * 30000); // 30 sec intervals
            const lat = baseLat + (Math.random() - 0.5) * 0.01;
            const lng = baseLng + (Math.random() - 0.5) * 0.01;
            
            data.push([
                lat, lng, '', '-', '-', null, routeId,
                time.toISOString(), '.', 'normal'
            ]);
        }
    });
    
    const result = createEmptyData('Sample data generated');
    result.data = data;
    result.total = data.length;
    result.showing = data.length;
    result.stats.total_points = data.length;
    result.stats.start_time = data[0][7];
    result.stats.end_time = data[data.length - 1][7];
    
    return result;
}

// CORS headers
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate duration between two timestamps
function calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    setCorsHeaders(res);

    // API: Submit location data from mobile APK
    if (pathname === '/api/location' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const locationPoint = JSON.parse(body);
                const rawData = readRawLocationData();
                
                // Add timestamp if not provided
                if (!locationPoint.timestamp) {
                    locationPoint.timestamp = new Date().toISOString();
                } else {
                    locationPoint.timestamp = parseTimestamp(locationPoint.timestamp);
                }
                
                // Add unique ID
                locationPoint.id = Date.now() + Math.random();
                
                const updatedRawData = appendLocationToRaw(rawData, locationPoint);
                writeLocationData(updatedRawData);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Location saved', data: locationPoint }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid data format' }));
            }
        });
    }
    // API: Get all location data with filters and route information
    else if (pathname === '/api/locations' && req.method === 'GET') {
        const data = readLocationData();
        const query = parsedUrl.query;
        
        let locations = data.locations;
        
        // Filter by route ID if provided
        if (query.routeId) {
            locations = locations.filter(loc => loc.routeId === query.routeId);
        }
        
        // Filter by date range if provided
        if (query.startDate) {
            locations = locations.filter(loc => new Date(loc.timestamp) >= new Date(query.startDate));
        }
        if (query.endDate) {
            locations = locations.filter(loc => new Date(loc.timestamp) <= new Date(query.endDate));
        }
        
        // Sort by timestamp
        locations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Group by route and calculate route data
        const routeGroups = {};
        locations.forEach(loc => {
            const routeId = loc.routeId || 'default_route';
            if (!routeGroups[routeId]) {
                routeGroups[routeId] = [];
            }
            routeGroups[routeId].push(loc);
        });
        
        // Calculate route information for each group
        const routeInfo = {};
        Object.keys(routeGroups).forEach(routeId => {
            const routeLocations = routeGroups[routeId];
            const path = routeLocations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
            
            // Calculate total distance (approximate using haversine)
            let totalDistance = 0;
            for (let i = 0; i < path.length - 1; i++) {
                totalDistance += calculateDistance(path[i], path[i + 1]);
            }
            
            routeInfo[routeId] = {
                waypoints: path,
                totalPoints: routeLocations.length,
                totalDistance: totalDistance.toFixed(2), // in km
                startTime: routeLocations[0].timestamp,
                endTime: routeLocations[routeLocations.length - 1].timestamp,
                duration: calculateDuration(routeLocations[0].timestamp, routeLocations[routeLocations.length - 1].timestamp)
            };
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: locations, routes: routeInfo }));
    }
    // API: Get unique routes
    else if (pathname === '/api/routes' && req.method === 'GET') {
        const data = readLocationData();
        const routes = [...new Set(data.locations.map(loc => loc.routeId).filter(Boolean))];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: routes }));
    }
    // API: Clear all data (for testing)
    else if (pathname === '/api/clear' && req.method === 'POST') {
        writeLocationData(createEmptyData('Route data cleared successfully'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'All data cleared' }));
    }
    // API: Add sample data (for testing)
    else if (pathname === '/api/sample-data' && req.method === 'POST') {
        const sampleData = generateSampleData();
        writeLocationData(sampleData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Sample data added', count: sampleData.data.length }));
    }
    // Serve static files from public directory
    else if (req.method === 'GET') {
        let filePath = path.join(__dirname, '..', 'public', pathname === '/' ? 'index.html' : pathname);
        const extname = path.extname(filePath);
        
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        
        const contentType = contentTypes[extname] || 'application/octet-stream';
        
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - Not Found</h1>', 'utf-8');
                } else {
                    res.writeHead(500);
                    res.end('Server Error: ' + error.code);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🗺️  OpenLayers Location Monitoring Server`);
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`API endpoints:`);
    console.log(`  POST /api/location - Submit location data`);
    console.log(`  GET  /api/locations - Get all locations (with optional filters)`);
    console.log(`  GET  /api/routes - Get unique route IDs`);
    console.log(`  POST /api/sample-data - Load sample data for testing`);
    console.log(`  POST /api/clear - Clear all data`);
});
