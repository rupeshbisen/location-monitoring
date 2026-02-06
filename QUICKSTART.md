# Quick Start Guide

Get the Location Monitoring application up and running in minutes!

## 🚀 Quick Setup (3 Steps)

### Step 1: Clone and Navigate
```bash
git clone https://github.com/rupeshbisen/location-monitoring.git
cd location-monitoring
```

### Step 2: Start the Server
```bash
npm start
```

Output should show:
```
Server running at http://localhost:3000/
API endpoints:
  GET  /api/locations - Get all locations (with optional filters)
```

### Step 3: Open in Browser
Open your browser and go to:
```
http://localhost:3000
```

## 🎮 First Time Usage

1. **Set Up Google Maps API Key** (Required for map display)
   - See the section below or [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for detailed instructions
   - Without an API key, the map will not display correctly

2. **Load Location Data**
   - Click the "Load Data" button
   - The map will display markers and routes from the stored location data
   - Note: The application comes with sample data in `backend/location_data.json`

3. **Use Playback Controls**
   - Click ▶️ **Play** to start animated vehicle playback along the route
   - Use the **Speed** slider (0.5x - 5x) to adjust animation speed
   - Click ⏸️ **Pause** to pause the animation
   - Click ⏮️ **Reset** to return to the start
   - Drag the **Timeline** slider to jump to any point

## 🗺️ Add Your Google Maps API Key

> **Important**: The map requires a Google Maps API key to function properly.

**Quick method:**
1. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable both "Maps JavaScript API" and "Directions API"
3. Open `public/index.html`
4. Find this line near the end of the file:
   ```html
   src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=geometry"
   ```
5. Replace `YOUR_API_KEY` with your actual key
6. Refresh the browser

**Need detailed instructions?** See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)

## 📡 Test the API

### Get All Locations
```bash
curl http://localhost:3000/api/locations
```

### Get Locations Within Date Range
```bash
curl "http://localhost:3000/api/locations?startDate=2026-01-01&endDate=2026-01-31"
```

## 📊 Understanding the Data

The application stores location data in `backend/location_data.json`. Each location point includes:

- **lat/lng**: Geographic coordinates
- **routeId**: Identifier for grouping points into routes
- **timestamp**: When the location was recorded
- **flag**: Type of location point:
  - `check_in` - Start of a route/shift
  - `check_out` - End of a route/shift
  - `visit` - Client/site visit
  - `normal` - Regular tracking point

## 🎯 Location Flags

| Flag | Icon | Usage |
|------|------|-------|
| `check_in` | 📍 | Start of work/route |
| `check_out` | 🏁 | End of work/route |
| `visit` | 🏢 | Client/site visit |
| `normal` | 📌 | Regular tracking point |

## 🖥️ UI Features

### Playback Controls
- **Play/Pause**: Start or stop vehicle animation
- **Reset**: Return to beginning of route
- **Speed**: Adjust from 0.5x to 5x
- **Timeline**: Drag slider to jump to any point

### Route Statistics
View real-time stats when data is loaded:
- Total Points
- Total Distance (km)
- Check-ins count
- Check-outs count
- Visits count

### Map Features
- Road-following route lines (using Directions API)
- Click markers to see location details
- Animated vehicle during playback
- Gap indicators for route discontinuities

## 🔧 Common Tasks

### Change the Server Port
```bash
PORT=8080 npm start
```

### Check if Server is Running
```bash
curl http://localhost:3000/api/locations | head -c 100
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Use a different port
PORT=8080 npm start
```

### Map not loading
- Verify Google Maps API key is correct
- Check browser console (F12) for errors
- Ensure Maps JavaScript API AND Directions API are enabled

### No data showing on map
- Verify the server is running
- Check browser console for API errors
- Ensure `backend/location_data.json` contains valid data

## 📖 Full Documentation

- **Full Setup Guide**: [README.md](README.md)
- **API Reference**: [API_EXAMPLES.md](API_EXAMPLES.md)
- **Google Maps Setup**: [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)

## 🎉 You're All Set!

Your location monitoring system is ready to use. Load your location data and visualize routes on the map!

Happy tracking! 🗺️📍
