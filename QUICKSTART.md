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

## 🗺️ Available Map Implementations

This project includes **six** map implementations. Choose the one that best fits your needs:

| Implementation | URL | API Key Required | Best For |
|---------------|-----|------------------|----------|
| **Uber MVP** | `/uber-mvp/` | ❌ No | Zero-setup, production ready |
| **TomTom** | `/tomtom-map/` | ✅ Free (no credit card) | Professional routing |
| **Mapbox** | `/mapbox-map/` | ✅ Free (no credit card) | Best road matching |
| **Google Maps** | `/google-map/` | ✅ Requires credit card | Traditional, full-featured |
| **Leaflet** | `/leaflet-map/` | ❌ No | Lightweight alternative |
| **OpenLayers** | `/openlayers-map/` | ❌ No | Feature-rich alternative |

### 🚗 Recommended: Uber MVP (No Setup Required)
```
http://localhost:3000/uber-mvp/
```
- Works immediately without any API keys
- Complete feature parity with other implementations
- Clean Uber-inspired design

### 🌟 For Production: TomTom or Mapbox
- **TomTom**: `http://localhost:3000/tomtom-map/` - See [TomTom Guide](public/tomtom-map/README.md)
- **Mapbox**: `http://localhost:3000/mapbox-map/` - See [Mapbox Guide](public/mapbox-map/README.md)

## 🎮 First Time Usage

1. **Choose a Map Implementation**
   - For zero setup: Use **Uber MVP** at `/uber-mvp/` (no API key needed)
   - For production: Use **TomTom** or **Mapbox** (free API key, no credit card)
   - For Google Maps: Requires API key with credit card verification

2. **Set Up API Key** (Only if using Google Maps, TomTom, or Mapbox)
   - **TomTom**: See [TomTom Guide](public/tomtom-map/README.md) - Free, no credit card
   - **Mapbox**: See [Mapbox Guide](public/mapbox-map/README.md) - Free, no credit card
   - **Google Maps**: See [Google Maps Guide](public/google-map/README.md) - Requires credit card

3. **Load Location Data**
   - Click the "Load Data" button
   - The map will display markers and routes from the stored location data
   - Note: The application comes with sample data in `backend/location_data.json`

4. **Use Playback Controls**
   - Click ▶️ **Play** to start animated vehicle playback along the route
   - Use the **Speed** slider (0.5x - 5x) to adjust animation speed
   - Click ⏸️ **Pause** to pause the animation
   - Click ⏮️ **Reset** to return to the start
   - Drag the **Timeline** slider to jump to any point

## 🗺️ API Key Setup (By Implementation)

### Option 1: Uber MVP / Leaflet / OpenLayers (No API Key)
These work out of the box - just open the URL and start using!

### Option 2: TomTom (Free, No Credit Card)
1. Sign up at [TomTom Developer Portal](https://developer.tomtom.com/user/register)
2. Copy your API key from the dashboard
3. Open `public/tomtom-map/app.js`
4. Replace `YOUR_TOMTOM_API_KEY` with your key
5. Access at `http://localhost:3000/tomtom-map/`

**Full guide**: [TomTom README](public/tomtom-map/README.md)

### Option 3: Mapbox (Free, No Credit Card)
1. Sign up at [Mapbox](https://account.mapbox.com/)
2. Get your access token from the dashboard
3. Open `public/mapbox-map/app.js`
4. Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your token
5. Access at `http://localhost:3000/mapbox-map/`

**Full guide**: [Mapbox README](public/mapbox-map/README.md)

### Option 4: Google Maps (Requires Credit Card)
1. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable both "Maps JavaScript API" and "Directions API"
3. Open `public/google-map/index.html`
4. Find the Google Maps script tag near the end of the file
5. Replace `YOUR_API_KEY` with your actual key
6. Access at `http://localhost:3000/google-map/`

**Full guide**: [Google Maps README](public/google-map/README.md)

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
- If using an API-based map (Google, TomTom, Mapbox), verify your API key is correct
- Check browser console (F12) for errors
- Try the **Uber MVP** (`/uber-mvp/`) which requires no API key
- For Google Maps: Ensure Maps JavaScript API AND Directions API are enabled

### No data showing on map
- Verify the server is running
- Check browser console for API errors
- Ensure `backend/location_data.json` contains valid data

## 📖 Full Documentation

- **Full Setup Guide**: [README.md](README.md)
- **API Reference**: [API_EXAMPLES.md](backend/API_EXAMPLES.md)
- **Google Maps Setup**: [Google Maps README](public/google-map/README.md)
- **TomTom Setup**: [TomTom README](public/tomtom-map/README.md)
- **Mapbox Setup**: [Mapbox README](public/mapbox-map/README.md)

## 🎉 You're All Set!

Your location monitoring system is ready to use. Load your location data and visualize routes on the map!

Happy tracking! 🗺️📍
