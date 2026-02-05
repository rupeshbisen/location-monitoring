# 📍 Location Monitoring System - OpenLayers MVP

A complete location monitoring application MVP built with OpenLayers that tracks location points from mobile applications and displays them on an interactive web application with playback controls.

## ✨ Features

- 📱 **Mobile APK Integration**: REST API endpoints to receive location data from mobile applications
- 🗺️ **OpenLayers Visualization**: Display location points and routes on interactive OpenStreetMap
- 🏁 **Location Flags**: Support for check-in, check-out, visit, and normal location points
- ▶️ **Playback System**: Animated route playback with play, pause, and reset controls
- ⚡ **Speed Control**: Adjustable playback speed (0.5x to 5x)
- 📊 **Route Statistics**: View total points, distance, check-ins, check-outs, and visits
- 🎯 **Timeline Scrubbing**: Jump to any point in the route using timeline slider
- 🎨 **Visual Markers**: Different colors and icons for different location types
- 📈 **Route Filtering**: Filter by specific routes or view all routes together
- 🆓 **No API Key Required**: Uses free OpenStreetMap tiles

## 🏗️ Project Structure

```
openlayers-mvp/
├── backend/
│   ├── server.js           # Node.js HTTP server with REST API
│   └── location_data.json  # JSON file database (auto-generated)
├── public/
│   ├── index.html          # Main HTML file with OpenLayers integration
│   ├── app.js              # JavaScript logic and OpenLayers integration
│   └── style.css           # CSS styling
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v12 or higher)
- No API key required! OpenLayers uses free OpenStreetMap tiles

### Installation

1. Navigate to the openlayers-mvp directory:
   ```bash
   cd openlayers-mvp
   ```

2. Install dependencies (optional - OpenLayers is loaded via CDN):
   ```bash
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. Click "Load Sample Data" to load test data and see the application in action.

## 📡 API Endpoints

### 1. Submit Location Data (POST /api/location)
Receive location data from mobile APK.

**Request Body:**
```json
{
  "lat": 28.6139,
  "lng": 77.2090,
  "routeId": "route1",
  "flag": "check_in",
  "address": "Start Point - Delhi",
  "timestamp": "2024-02-03T08:00:00Z"
}
```

**Flags:**
- `check_in` - User checked in at a location
- `check_out` - User checked out from a location
- `visit` - User visited a client/site
- `normal` - Regular location point

### 2. Get Locations (GET /api/locations)
Retrieve all location data with optional filters.

**Query Parameters:**
- `routeId` - Filter by specific route ID
- `startDate` - Filter by start date
- `endDate` - Filter by end date

**Example:**
```
GET /api/locations?routeId=route1
```

### 3. Get Routes (GET /api/routes)
Get list of all unique route IDs.

### 4. Load Sample Data (POST /api/sample-data)
Load sample test data for demonstration.

### 5. Clear Data (POST /api/clear)
Clear all location data from database.

## 🎮 Usage Guide

1. **Load Data**:
   - Click "Load Sample Data" to load test data, OR
   - Send location data from your mobile APK using the API
   - Click "Load Data" to fetch and display locations

2. **View Routes**:
   - Select a specific route from the dropdown to filter
   - Click "Load Data" to display the selected route

3. **Playback Controls**:
   - Click **Play** to start animated playback
   - Click **Pause** to pause the animation
   - Click **Reset** to return to the beginning
   - Adjust the **Speed** slider to change playback speed
   - Drag the **Timeline** slider to jump to any point

4. **Map Interaction**:
   - Click on any marker to see detailed information
   - Zoom and pan the map as needed
   - View the legend for marker meanings

## 📱 Mobile APK Integration

To integrate with a mobile application, send POST requests to the `/api/location` endpoint:

### Android Example (Java/Kotlin):
```java
// Create JSON payload
JSONObject locationData = new JSONObject();
locationData.put("lat", 28.6139);
locationData.put("lng", 77.2090);
locationData.put("routeId", "route1");
locationData.put("flag", "check_in");
locationData.put("address", "Current Location");

// Send POST request to http://your-server:3000/api/location
```

### JavaScript/React Native Example:
```javascript
const sendLocation = async (lat, lng, flag) => {
  const response = await fetch('http://your-server:3000/api/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lat: lat,
      lng: lng,
      routeId: 'route1',
      flag: flag,
      address: 'Current Location'
    })
  });
  const result = await response.json();
  console.log(result);
};
```

## 🎨 Customization

### Changing Map Styles
Edit the `initMap()` function in `app.js` to customize map appearance. You can use different tile sources:

```javascript
// Example: Use CartoDB tiles instead
new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
    })
})
```

### Adding New Flags
1. Add new flag types in `backend/server.js`
2. Update `createMarkerIcon()` in `app.js` to define marker appearance
3. Update legend in `index.html`

### Styling
Modify `public/style.css` to change colors, fonts, and layout.

## 🛠️ Technology Stack

- **Backend**: Node.js (Pure HTTP server, no framework)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Maps**: OpenLayers 8.2.0 with OpenStreetMap tiles
- **Storage**: JSON file-based database

## 📝 Key Differences from Google Maps Version

1. **No API Key Required**: Uses free OpenStreetMap tiles instead of Google Maps
2. **OpenLayers Library**: Modern, open-source mapping library
3. **Simplified Road Routing**: Direct line connections instead of Google Directions API
4. **Custom Overlays**: OpenLayers popup system for marker information
5. **Vector Layers**: Uses vector layers for better performance with many markers

## 🎯 MVP Features Implemented

✅ All core functionality from original codebase:
- Location data submission and retrieval API
- Interactive map with OpenStreetMap
- Marker display with custom icons (start, end, flags)
- Route visualization with polylines
- Playback controls (play, pause, reset)
- Speed control (0.5x to 5x)
- Timeline scrubbing
- Route statistics display
- Route filtering
- Vehicle marker with rotation during playback
- Traveled path visualization
- Popup information windows

## 📄 Performance Notes

- OpenLayers handles large datasets efficiently with vector layers
- For very large datasets (1000+ points), markers are shown selectively
- Route lines are drawn using vector geometries for smooth rendering
- No external API calls for map rendering (faster load times)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Rupesh Bisen

## 🐛 Troubleshooting

### Map not loading
- Check browser console for errors
- Ensure CDN links for OpenLayers are accessible
- Verify server is running on port 3000

### Server not starting
- Check if port 3000 is available
- Verify Node.js is installed: `node --version`

### Location data not showing
- Click "Load Sample Data" first
- Check if backend server is running
- Verify API URL in `app.js` matches your server address

## 🔄 Migration from Google Maps

If you're migrating from the Google Maps version:

1. **No API Key Setup**: Skip the Google Maps API key setup
2. **Same Backend**: Use the exact same backend API
3. **Data Compatibility**: All location data format remains the same
4. **Feature Parity**: All features are maintained in this MVP
5. **Free to Use**: No costs for map tiles or API usage

## 📚 Additional Resources

- [OpenLayers Documentation](https://openlayers.org/doc/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [GeoJSON Specification](https://geojson.org/)
