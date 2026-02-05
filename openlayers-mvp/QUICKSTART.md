# 🚀 Quick Start Guide - OpenLayers MVP

## Get Started in 3 Minutes

### Step 1: Start the Server
```bash
cd openlayers-mvp
npm start
```

You should see:
```
🗺️  OpenLayers Location Monitoring Server
Server running at http://localhost:3000/
```

### Step 2: Open the Application
Open your browser and navigate to:
```
http://localhost:3000
```

### Step 3: Load Sample Data
1. Click the **"Load Sample Data"** button
2. Click **"Load Data"** to display the routes on the map
3. Click **"Play"** to start the animated playback

That's it! 🎉

## Basic Controls

### Loading Data
- **Load Sample Data**: Loads demo tracking data with 2 routes
- **Load Data**: Fetches and displays locations on the map
- **Route Selector**: Filter by specific route

### Playback
- **Play ▶️**: Start animated route playback
- **Pause ⏸️**: Pause the animation
- **Reset ⏮️**: Go back to the beginning
- **Speed Slider**: Adjust playback speed (0.5x - 5x)
- **Timeline Slider**: Jump to any point in time

### Map Interaction
- **Click Markers**: View detailed location information
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Pan the map
- **Statistics Panel**: View route metrics

## Next Steps

### Send Real Location Data
Use the API to send location data from your mobile app:

```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "myroute",
    "flag": "check_in",
    "address": "My Location"
  }'
```

### Filter by Route
1. Select a route from the dropdown
2. Click "Load Data"
3. Only that route will be displayed

### View Different Flag Types
The system supports 4 types of location flags:
- 🏁 **Check-in**: Green markers
- 🚩 **Check-out**: Red markers
- 🏢 **Visit**: Yellow markers
- 📍 **Normal**: Blue markers

## Keyboard Shortcuts
- None currently - all controls are button/slider based

## Tips
- Load sample data first to see how it works
- Adjust playback speed for longer routes
- Click markers to see detailed information
- Use timeline slider to jump to specific points

## Need Help?
- Check the main README.md for detailed documentation
- Check browser console for error messages
- Ensure server is running on port 3000
