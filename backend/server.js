const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'location_data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ locations: [] }, null, 2));
}

// Helper function to read location data
function readLocationData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { locations: [] };
    }
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
                const data = readLocationData();
                
                // Add timestamp if not provided
                if (!locationPoint.timestamp) {
                    locationPoint.timestamp = new Date().toISOString();
                }
                
                // Add unique ID
                locationPoint.id = Date.now() + Math.random();
                
                data.locations.push(locationPoint);
                writeLocationData(data);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Location saved', data: locationPoint }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid data format' }));
            }
        });
    }
    // API: Get all location data with filters
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
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: locations }));
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
        writeLocationData({ locations: [] });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'All data cleared' }));
    }
    // API: Add sample data (for testing)
    else if (pathname === '/api/sample-data' && req.method === 'POST') {
        const sampleData = {
            locations: [
                { id: 1, lat: 28.6139, lng: 77.2090, timestamp: '2024-02-03T08:00:00Z', routeId: 'route1', flag: 'check_in', address: 'Start Point - Delhi' },
                { id: 2, lat: 28.6149, lng: 77.2100, timestamp: '2024-02-03T08:05:00Z', routeId: 'route1', flag: 'normal', address: 'Moving through Delhi' },
                { id: 3, lat: 28.6159, lng: 77.2110, timestamp: '2024-02-03T08:10:00Z', routeId: 'route1', flag: 'visit', address: 'Client Visit 1' },
                { id: 4, lat: 28.6169, lng: 77.2120, timestamp: '2024-02-03T08:15:00Z', routeId: 'route1', flag: 'normal', address: 'Moving' },
                { id: 5, lat: 28.6179, lng: 77.2130, timestamp: '2024-02-03T08:20:00Z', routeId: 'route1', flag: 'visit', address: 'Client Visit 2' },
                { id: 6, lat: 28.6189, lng: 77.2140, timestamp: '2024-02-03T08:25:00Z', routeId: 'route1', flag: 'normal', address: 'Moving' },
                { id: 7, lat: 28.6199, lng: 77.2150, timestamp: '2024-02-03T08:30:00Z', routeId: 'route1', flag: 'check_out', address: 'End Point' },
                
                { id: 8, lat: 28.6200, lng: 77.2160, timestamp: '2024-02-03T10:00:00Z', routeId: 'route2', flag: 'check_in', address: 'Start Point - Route 2' },
                { id: 9, lat: 28.6210, lng: 77.2170, timestamp: '2024-02-03T10:05:00Z', routeId: 'route2', flag: 'normal', address: 'Moving' },
                { id: 10, lat: 28.6220, lng: 77.2180, timestamp: '2024-02-03T10:10:00Z', routeId: 'route2', flag: 'visit', address: 'Client Visit 3' },
                { id: 11, lat: 28.6230, lng: 77.2190, timestamp: '2024-02-03T10:15:00Z', routeId: 'route2', flag: 'normal', address: 'Moving' },
                { id: 12, lat: 28.6240, lng: 77.2200, timestamp: '2024-02-03T10:20:00Z', routeId: 'route2', flag: 'check_out', address: 'End Point - Route 2' }
            ]
        };
        writeLocationData(sampleData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Sample data added', count: sampleData.locations.length }));
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
