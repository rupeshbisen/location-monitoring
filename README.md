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
│   ├── location_data.json  # JSON file database for location data
│   └── API_EXAMPLES.md     # API usage examples
├── public/
│   ├── index.html          # Main HTML file (Google Maps)
│   ├── app.js              # JavaScript logic and Google Maps integration
│   ├── style.css           # CSS styling (shared)
│   ├── google-map/         # Google Maps implementation
│   │   ├── index.html
│   │   ├── app.js
│   │   └── README.md       # Google Maps setup guide
│   ├── uber-mvp/           # 🚗 Uber MVP (NEW - Complete feature replication)
│   │   ├── index.html
│   │   └── app.js
│   ├── tomtom-map/         # 🌟 TomTom MVP (Professional routing)
│   │   ├── index.html
│   │   ├── app.js
│   │   └── README.md       # TomTom complete guide
│   ├── mapbox-map/         # Mapbox MVP (Alternative - Best road matching)
│   │   ├── index.html
│   │   ├── app.js
│   │   └── README.md       # Mapbox setup guide
│   ├── leaflet-map/        # Leaflet MVP (alternative, no API key needed)
│   │   ├── index.html
│   │   └── app.js
│   ├── openlayers-map/     # OpenLayers MVP (alternative, no API key needed)
│   │   ├── index.html
│   │   └── app.js
│   ├── here-map/           # HERE Maps MVP (professional automotive-grade)
│   │   ├── index.html
│   │   ├── app.js
│   │   └── README.md       # HERE Maps setup guide
│   └── azure-map/          # Azure Maps MVP (enterprise-grade Microsoft)
│       ├── index.html
│       └── app.js
├── package.json
├── README.md
└── QUICKSTART.md
```

## 🗺️ Map Alternatives

This project includes **eight** map implementations:

### 🚗 **NEW: Uber MVP** (`public/uber-mvp/`)
   - **✅ Complete Feature Replication** - Implements all core functionality
   - **✅ No API Key Required** - Uses OpenStreetMap with optional OSRM routing
   - **✅ Full Playback Controls** - Play, pause, reset, speed control, timeline scrubbing
   - **✅ Route Statistics** - Total points, distance, check-ins, check-outs, visits, duration
   - **✅ Multi-Route Support** - Handle multiple routes with route selector
   - **✅ Uber-Style Branding** - Clean black and white design
   - **✅ Marker Icons** - Emoji-based markers (📍 check-in, 🏁 check-out, 🏢 visit, 📌 normal)
   - **✅ Animated Vehicle** - 🚗 vehicle marker with smooth animation
   - 🔗 Access: `http://localhost:3000/uber-mvp/`

### 🌟 **TomTom MVP** (`public/tomtom-map/`)
   - **✅ Professional Automotive-Grade Routing** - Used by major car manufacturers
   - **✅ Accurate Road Data** - Best-in-class road network accuracy
   - **✅ 2,500 free requests/day** - No credit card required
   - **✅ Multiple Routing Profiles** - Car, pedestrian, bicycle, taxi, bus, van, motorcycle, truck
   - **✅ Up to 150 waypoints** - Handles long routes efficiently
   - **✅ Traffic-Aware Routing** - Real-time traffic data integration
   - 📖 Setup: See [README.md](public/tomtom-map/README.md)
   - 🔗 Access: `http://localhost:3000/tomtom-map/`

### 🌟 **Mapbox MVP** (`public/mapbox-map/`)
   - **✅ Professional Map Matching API** - GPS points follow actual roads perfectly
   - **✅ Best for Production** - Reliable, accurate, fast
   - **✅ 50,000 free requests/month** - No credit card required
   - **✅ Batch processing** - Handles 100 points per request
   - **✅ Progressive enhancement** - Shows results immediately, enhances with road-snapping
   - 📖 Setup: See [README.md](public/mapbox-map/README.md)
   - 🔗 Access: `http://localhost:3000/mapbox-map/`

### 🌟 **HERE Maps MVP** (`public/here-map/`)
   - **✅ Professional Automotive-Grade** - Used by Audi, BMW, Mercedes-Benz
   - **✅ High-Quality Routing** - Industry-standard road network accuracy
   - **✅ 250,000 free requests/month** - Generous free tier, no credit card required
   - **✅ Up to 150 waypoints** - Handles complex routes efficiently
   - **✅ Multiple Transport Modes** - Car, pedestrian, bicycle, truck
   - **✅ Enterprise-Grade** - Trusted by automotive industry
   - 📖 Setup: See [README.md](public/here-map/README.md)
   - 🔗 Access: `http://localhost:3000/here-map/`

### ☁️ **Azure Maps MVP** (`public/azure-map/`)
   - **✅ Enterprise-Grade Microsoft Azure** - Trusted by enterprises worldwide
   - **✅ Accurate Road Routing** - Traffic-aware route directions
   - **✅ Free tier available** - With Azure account
   - **✅ Up to 150 waypoints** - Handles complex routes efficiently
   - **✅ Multiple Travel Modes** - Car, pedestrian, bicycle, truck
   - **✅ Map Style Switching** - Road, satellite, and hybrid views
   - 🔗 Access: `http://localhost:3000/azure-map/`

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

## 🚗 Why Uber MVP?

The Uber MVP represents a complete replication of all existing functionality in a clean, production-ready implementation:

- **Complete Feature Parity**: All features from other implementations
- **Zero Setup**: No API keys required - works out of the box
- **Clean Design**: Uber-inspired black and white aesthetic
- **Production Ready**: Full error handling and user feedback
- **Best Practices**: Follows established patterns from existing MVPs

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
   - See detailed guide: [README.md](public/mapbox-map/README.md)

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
   - See detailed guide: [README.md](public/tomtom-map/README.md)

   **OR For HERE Maps (Professional automotive-grade):**
   - Open `public/here-map/app.js`
   - Replace `YOUR_HERE_API_KEY` with your token
   - See detailed guide: [README.md](public/here-map/README.md)

   **OR For Azure Maps (Enterprise-grade Microsoft):**
   - Open `public/azure-map/app.js`
   - Replace `YOUR_AZURE_MAPS_KEY` with your subscription key
   - Get your key at: [Azure Maps Authentication](https://learn.microsoft.com/en-us/azure/azure-maps/how-to-manage-authentication)

   **OR For Mapbox:**
   - Open `public/mapbox-map/app.js`
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your token
   - See detailed guide: [README.md](public/mapbox-map/README.md)

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
   # Uber MVP (NEW - Complete feature replication, no API key needed)
   http://localhost:3000/uber-mvp/
   
   # OR TomTom MVP (RECOMMENDED - Professional routing)
   http://localhost:3000/tomtom-map/
   
   # OR HERE Maps MVP (Automotive-grade mapping)
   http://localhost:3000/here-map/
   
   # OR Azure Maps MVP (Enterprise-grade Microsoft)
   http://localhost:3000/azure-map/
   
   # OR Mapbox MVP (Best road matching)
   http://localhost:3000/mapbox-map/
   
   # OR Google Maps
   http://localhost:3000
   
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
- **API Reference**: [API_EXAMPLES.md](backend/API_EXAMPLES.md)
- **Google Maps Setup**: [README.md](public/google-map/README.md)
