# 📍 Location Monitoring System

A location monitoring web application that visualizes location data on an interactive Google Maps interface with playback controls and route tracking.

## ✨ Features

- 🗺️ **Google Maps Visualization**: Display location points and routes on interactive maps with road-following paths
- 🏁 **Location Flags**: Support for check-in, check-out, visit, and normal location points
- ▶️ **Playback System**: Animated route playback with play, pause, and reset controls
- ⚡ **Speed Control**: Adjustable playback speed (0.5x to 5x)
- 📊 **Route Statistics**: View total points, distance, check-ins, check-outs, and visits
- 🎯 **Timeline Scrubbing**: Jump to any point in the route using timeline slider
- 🎨 **Visual Markers**: Different icons for different location types (📍 check-in, 🏁 check-out, 🏢 visit, 📌 normal)
- 🛣️ **Road-Following Routes**: Uses Google Directions API to display actual road paths

## 🏗️ Project Structure

```
location-monitoring/
├── backend/
│   ├── server.js           # Node.js HTTP server with REST API
│   └── location_data.json  # JSON file database for location data
├── public/
│   ├── index.html          # Main HTML file (Google Maps)
│   ├── app.js              # JavaScript logic and Google Maps integration
│   ├── style.css           # CSS styling (shared)
│   ├── tomtom-map/         # 🌟 TomTom MVP (NEW - Professional routing)
│   │   ├── index.html
│   │   └── app.js
│   ├── mapbox-map/         # Mapbox MVP (Alternative - Best road matching)
│   │   ├── index.html
│   │   └── app.js
│   ├── leaflet-map/        # Leaflet MVP (alternative, no API key needed)
│   │   ├── index.html
│   │   └── app.js
│   └── openlayers-map/     # OpenLayers MVP (alternative, no API key needed)
│       ├── index.html
│       └── app.js
├── package.json
├── README.md
├── QUICKSTART.md
├── API_EXAMPLES.md
├── GOOGLE_MAPS_SETUP.md
├── MAPBOX_SETUP.md         # Mapbox MVP setup guide
└── TOMTOM_SETUP.md         # TomTom MVP setup guide
```

## 🗺️ Map Alternatives

This project includes **five** map implementations:

### 🌟 **NEW: TomTom MVP** (`public/tomtom-map/`)
   - **✅ Professional Automotive-Grade Routing** - Used by major car manufacturers
   - **✅ Accurate Road Data** - Best-in-class road network accuracy
   - **✅ 2,500 free requests/day** - No credit card required
   - **✅ Multiple Routing Profiles** - Car, pedestrian, bicycle, taxi, bus, van, motorcycle, truck
   - **✅ Up to 150 waypoints** - Handles long routes efficiently
   - **✅ Traffic-Aware Routing** - Real-time traffic data integration
   - 📖 Setup: See [TOMTOM_SETUP.md](TOMTOM_SETUP.md)
   - 🔗 Access: `http://localhost:3000/tomtom-map/`

### 🌟 **Mapbox MVP** (`public/mapbox-map/`)
   - **✅ Professional Map Matching API** - GPS points follow actual roads perfectly
   - **✅ Best for Production** - Reliable, accurate, fast
   - **✅ 50,000 free requests/month** - No credit card required
   - **✅ Batch processing** - Handles 100 points per request
   - **✅ Progressive enhancement** - Shows results immediately, enhances with road-snapping
   - 📖 Setup: See [MAPBOX_SETUP.md](MAPBOX_SETUP.md)
   - 🔗 Access: `http://localhost:3000/mapbox-map/`

### Other Alternatives:

1. **Google Maps** (`public/index.html`) - Traditional implementation
   - Requires API key and credit card
   - Road-following routes with Directions API
   - Limited to 25 waypoints per request
   
2. **Leaflet** (`public/leaflet-map/`) - Lightweight with OSRM
   - No API key required
   - Free OSRM routing (variable reliability)
   
3. **OpenLayers** (`public/openlayers-map/`) - Feature-rich
   - No API key required
   - More customization options

## 🚀 Getting Started

### Prerequisites

- Node.js (v12 or higher)
- Google Maps API Key (with Maps JavaScript API and Directions API enabled)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rupeshbisen/location-monitoring.git
   cd location-monitoring
   ```

2. **Option A: Mapbox MVP (RECOMMENDED)**
   - Go to [Mapbox Account](https://account.mapbox.com/)
   - Sign up for free (no credit card required)
   - Get your [Access Token](https://account.mapbox.com/access-tokens/)
   - Open `public/mapbox-map/app.js`
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your token
   - See detailed guide: [MAPBOX_SETUP.md](MAPBOX_SETUP.md)

   **OR**

2. **Option B: Google Maps**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable "Maps JavaScript API" and "Directions API"
   - Create credentials (API Key)
   - Copy the API key

3. Update the API key in your chosen implementation:

   **For TomTom (Recommended for accurate routing):**
   - Open `public/tomtom-map/app.js`
   - Replace `YOUR_TOMTOM_API_KEY` with your token
   - See detailed guide: [TOMTOM_SETUP.md](TOMTOM_SETUP.md)

   **OR For Mapbox:**
   - Open `public/mapbox-map/app.js`
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your token
   - See detailed guide: [MAPBOX_SETUP.md](MAPBOX_SETUP.md)

   **OR For Google Maps:**
   - Open `public/index.html`
   - Replace `YOUR_API_KEY` in the script tag
   ```html
   <script async defer
       src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=geometry">
   </script>
   ```

### Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`

2. Open your browser and navigate to:
   ```
   # TomTom MVP (RECOMMENDED - Professional routing)
   http://localhost:3000/tomtom-map/
   
   # OR Mapbox MVP (Best road matching)
   http://localhost:3000/mapbox-map/
   
   # OR Google Maps
   http://localhost:3000
   
   # OR Leaflet (no API key needed)
   http://localhost:3000/leaflet-map/
   
   # OR OpenLayers (no API key needed)
   http://localhost:3000/openlayers-map/
   ```
   
   # OR Leaflet (no API key needed)
   http://localhost:3000/leaflet-map/
   
   # OR OpenLayers (no API key needed)
   http://localhost:3000/openlayers-map/
   ```

3. Click "Load Data" to fetch and display the location data on the map.

## 📡 API Endpoints

### Get Locations (GET /api/locations)
Retrieve all location data with optional date filters.

**Query Parameters:**
- `startDate` - Filter locations from this date (ISO format)
- `endDate` - Filter locations until this date (ISO format)

**Examples:**
```bash
# Get all locations
curl http://localhost:3000/api/locations

# Get locations within date range
curl "http://localhost:3000/api/locations?startDate=2026-01-01&endDate=2026-01-31"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lat": 21.090064,
      "lng": 79.091735,
      "address": "",
      "routeId": "Sandeep",
      "timestamp": "2026-01-12T09:20:00.000Z",
      "flag": "normal"
    }
  ],
  "routes": {
    "Sandeep": {
      "waypoints": [...],
      "totalPoints": 10,
      "totalDistance": "5.23",
      "startTime": "2026-01-12T09:20:00.000Z",
      "endTime": "2026-01-12T10:00:00.000Z",
      "duration": "0h 40m"
    }
  }
}
```

**Location Flags:**
- `check_in` - User checked in at a location
- `check_out` - User checked out from a location
- `visit` - User visited a client/site
- `normal` - Regular location point

## 🎮 Usage Guide

1. **Load Data**:
   - Click "Load Data" to fetch and display locations from the database
   - The map will show markers at each location point
   - Routes are drawn following actual roads using the Directions API

2. **Playback Controls**:
   - Click **Play** to start animated vehicle playback along the route
   - Click **Pause** to pause the animation
   - Click **Reset** to return to the beginning
   - Adjust the **Speed** slider (0.5x to 5x) to change playback speed
   - Drag the **Timeline** slider to jump to any point in the route

3. **Map Interaction**:
   - Click on any marker to see detailed information (address, timestamp, flag)
   - Zoom and pan the map as needed
   - View the legend for marker icon meanings

4. **Route Statistics**:
   - View total points, total distance, check-ins, check-outs, and visits
   - Statistics update automatically when data is loaded

## 📊 Data Format

Location data is stored in `backend/location_data.json`. Each location point contains:

```json
[
  21.090064,          // latitude
  79.091735,          // longitude
  "Address string",   // address (optional)
  "-",                // reserved
  "-",                // reserved
  null,               // reserved
  "RouteId",          // route identifier
  "2026-01-12T09:20:00.000Z",  // timestamp (ISO format)
  ".",                // reserved
  "normal"            // flag: check_in, check_out, visit, or normal
]
```

## 🎨 Customization

### Changing Map Styles
Edit the `initMap()` function in `public/app.js` to customize map appearance.

### Modifying Marker Icons
Update `getMarkerIcon()` function in `public/app.js` to change marker icons for different flag types.

### Styling
Modify `public/style.css` to change colors, fonts, and layout.

## 🛠️ Technology Stack

- **Backend**: Node.js (Pure HTTP server, no external dependencies)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Maps**: Google Maps JavaScript API with Geometry and Directions libraries
- **Storage**: JSON file-based database

## 📝 Notes

- The application uses a JSON file (`location_data.json`) for data storage
- For production use, consider using a proper database (MongoDB, PostgreSQL, etc.)
- CORS is enabled for all origins; adjust for production
- Google Maps API key should be restricted in production
- The Directions API is used for road-following routes (has usage limits)

## 🐛 Troubleshooting

### Map not loading
- Verify your Google Maps API key is correct
- Check browser console for errors
- Ensure Maps JavaScript API and Directions API are enabled in Google Cloud Console

### Server not starting
- Check if port 3000 is available: `lsof -i :3000`
- Use a different port: `PORT=8080 npm start`
- Verify Node.js is installed: `node --version`

### Location data not showing
- Ensure the `location_data.json` file has valid data
- Check if the backend server is running
- Verify API requests in browser developer tools

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Rupesh Bisen

## 📚 Documentation

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **API Reference**: [API_EXAMPLES.md](API_EXAMPLES.md)
- **Google Maps Setup**: [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)
