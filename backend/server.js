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
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(',', '');
        const date = new Date(cleaned);
        return Number.isNaN(date.getTime()) ? value : date.toISOString();
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

// Helper function to read normalized location data
function readLocationData() {
    const rawData = readRawLocationData();
    return normalizeLocationData(rawData);
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

    // API: Get all location data with filters and route information
    if (pathname === '/api/locations' && req.method === 'GET') {
        const data = readLocationData();
        const query = parsedUrl.query;
        
        let locations = data.locations;
        
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
    // Serve static files from public directory
    else if (req.method === 'GET') {
        let filePath = path.join(__dirname, '..', 'public', pathname === '/' ? 'index.html' : pathname);
        // Serve index.html for directory paths like /leaflet-map/ or /leaflet-map
        if (filePath.endsWith('/') || filePath.endsWith(path.sep)) {
            filePath = path.join(filePath, 'index.html');
        }
        let extname = path.extname(filePath);
        // If no extension, try as directory with index.html
        if (!extname) {
            filePath = path.join(filePath, 'index.html');
            extname = '.html';
        }
        
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
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`API endpoints:`);
    console.log(`  GET  /api/locations - Get all locations (with optional filters)`);
    console.log(`  Leaflet Map UI: http://localhost:${PORT}/leaflet-map/`);
});
