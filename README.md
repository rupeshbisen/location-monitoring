# 📍 Location Monitoring System

A complete location monitoring application that tracks location points from mobile APK and displays them on an interactive web application with Google Maps integration and playback controls.

## ✨ Features

- 📱 **Mobile APK Integration**: REST API endpoints to receive location data from mobile applications
- 🗺️ **Google Maps Visualization**: Display location points and routes on interactive maps
- 🏁 **Location Flags**: Support for check-in, check-out, visit, and normal location points
- ▶️ **Playback System**: Animated route playback with play, pause, and reset controls
- ⚡ **Speed Control**: Adjustable playback speed (0.5x to 5x)
- 📊 **Route Statistics**: View total points, check-ins, check-outs, and visits
- 🎯 **Timeline Scrubbing**: Jump to any point in the route using timeline slider
- 🎨 **Visual Markers**: Different colors and icons for different location types
- 📈 **Route Filtering**: Filter by specific routes or view all routes together

## 🏗️ Project Structure

```
location-monitoring/
├── backend/
│   ├── server.js           # Node.js HTTP server with REST API
│   └── location_data.json  # JSON file database (auto-generated)
├── public/
│   ├── index.html          # Main HTML file (Google Maps)
│   ├── app.js              # JavaScript logic and Google Maps integration
│   ├── style.css           # CSS styling (shared)
│   ├── leaflet-map/        # Leaflet MVP (alternative, no API key needed)
│   │   ├── index.html
│   │   └── app.js
│   └── openlayers-map/     # OpenLayers MVP (alternative, no API key needed)
│       ├── index.html
│       └── app.js
├── package.json
└── README.md
```

## 🗺️ Map Alternatives

This project includes three map implementations:

1. **Google Maps** (`public/index.html`) - Main implementation with Google Maps API
   - Requires API key
   - Road-following routes with Directions API
   
2. **Leaflet** (`public/leaflet-map/`) - Lightweight alternative with OpenStreetMap
   - No API key required
   - Free and open source
   
3. **OpenLayers** (`public/openlayers-map/`) - Feature-rich alternative with OpenStreetMap
   - No API key required
   - More features and customization options

## 🚀 Getting Started

### Prerequisites

- Node.js (v12 or higher)
- Google Maps API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rupeshbisen/location-monitoring.git
   cd location-monitoring
   ```

2. Install dependencies (if needed):
   ```bash
   npm install
   ```

3. Get a Google Maps API Key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable "Maps JavaScript API"
   - Create credentials (API Key)
   - Copy the API key

4. Update the Google Maps API key in `public/index.html`:
   ```html
   <script async defer
       src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap">
   </script>
   ```
   Replace `YOUR_API_KEY` with your actual API key.

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
Edit the `initMap()` function in `app.js` to customize map appearance.

### Adding New Flags
1. Add new flag types in `backend/server.js`
2. Update `getMarkerIcon()` in `app.js` to define marker appearance
3. Update legend in `index.html`

### Styling
Modify `public/style.css` to change colors, fonts, and layout.

## 🛠️ Technology Stack

- **Backend**: Node.js (Pure HTTP server, no framework)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Maps**: Google Maps JavaScript API
- **Storage**: JSON file-based database

## 📝 Notes

- The application uses a JSON file (`location_data.json`) for data storage
- For production use, consider using a proper database (MongoDB, PostgreSQL, etc.)
- CORS is enabled for development; adjust for production
- Google Maps API key should be restricted in production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Rupesh Bisen

## 🐛 Troubleshooting

### Map not loading
- Verify your Google Maps API key is correct
- Check browser console for errors
- Ensure Maps JavaScript API is enabled in Google Cloud Console

### Server not starting
- Check if port 3000 is available
- Verify Node.js is installed: `node --version`

### Location data not showing
- Click "Load Sample Data" first
- Check if backend server is running
- Verify API URL in `app.js` matches your server address
