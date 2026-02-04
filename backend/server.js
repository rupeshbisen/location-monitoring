const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'sample_location_data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
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
        message: 'Route data loaded successfully'
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper function to read raw location data
function readRawLocationData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { locations: [] };
    }
}

function getStorageFormat(rawData) {
    if (rawData && Array.isArray(rawData.data)) {
        return 'array';
    }
    if (rawData && Array.isArray(rawData.locations)) {
        return 'locations';
    }
    return 'locations';
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
    const format = getStorageFormat(rawData);
    if (format === 'array') {
        const locations = rawData.data.map((row, index) => {
            const lat = Number(row[0]);
            const lng = Number(row[1]);
            const address = row[2] || '';
            const routeId = row[6] || 'default_route';
            const timestamp = parseTimestamp(row[7]);
            const flagRaw = row[9] || 'normal';
            const allowedFlags = ['check_in', 'check_out', 'visit', 'normal'];
            const flag = allowedFlags.includes(flagRaw) ? flagRaw : 'normal';

            return {
                id: index + 1,
                lat,
                lng,
                timestamp,
                routeId,
                flag,
                address
            };
        });

        return { locations, format, rawData };
    }

    return {
        locations: Array.isArray(rawData.locations) ? rawData.locations : [],
        format,
        rawData
    };
}

function appendLocationToRaw(rawData, locationPoint) {
    const format = getStorageFormat(rawData);
    if (format === 'array') {
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

        rawData.data = Array.isArray(rawData.data) ? rawData.data : [];
        rawData.data.push(row);

        if (typeof rawData.total === 'number') {
            rawData.total = rawData.data.length;
        }
        if (typeof rawData.showing === 'number') {
            rawData.showing = rawData.data.length;
        }
        if (rawData.stats && typeof rawData.stats === 'object') {
            rawData.stats.total_points = rawData.data.length;
            rawData.stats.start_time = rawData.stats.start_time || timestamp;
            rawData.stats.end_time = timestamp;
        }
        return rawData;
    }

    rawData.locations = Array.isArray(rawData.locations) ? rawData.locations : [];
    rawData.locations.push(locationPoint);
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
        const rawData = readRawLocationData();
        const format = getStorageFormat(rawData);

        if (format === 'array') {
            rawData.data = [];
            rawData.total = 0;
            rawData.showing = 0;
            if (rawData.stats && typeof rawData.stats === 'object') {
                rawData.stats.total_points = 0;
                rawData.stats.start_time = null;
                rawData.stats.end_time = null;
            }
            rawData.message = 'Route data cleared successfully';
            rawData.status = rawData.status || 'success';
            writeLocationData(rawData);
        } else {
            writeLocationData({ locations: [] });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'All data cleared' }));
    }
    // API: Add sample data (for testing)
    else if (pathname === '/api/sample-data' && req.method === 'POST') {
        try {
            const SAMPLE_TEMPLATE_FILE = path.join(__dirname, 'sample_data_template.json');
            
            // Read sample data from template file
            const templateData = JSON.parse(fs.readFileSync(SAMPLE_TEMPLATE_FILE, 'utf8'));
            
            // Write the template data to sample_location_data.json
            writeLocationData(templateData);
            
            const count = templateData.data ? templateData.data.length : (templateData.locations ? templateData.locations.length : 0);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Sample data added', count: count }));
        } catch (error) {
            console.error('Error loading sample data:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Error loading sample data template' }));
        }
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
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`API endpoints:`);
    console.log(`  POST /api/location - Submit location data`);
    console.log(`  GET  /api/locations - Get all locations (with optional filters)`);
    console.log(`  GET  /api/routes - Get unique route IDs`);
    console.log(`  POST /api/sample-data - Load sample data for testing`);
    console.log(`  POST /api/clear - Clear all data`);
});
