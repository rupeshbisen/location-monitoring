# OpenLayers MVP

A minimal OpenLayers implementation of the Location Monitoring System. This version uses OpenStreetMap tiles instead of Google Maps, requiring no API key.

## What's Different

- **Map Library**: Uses OpenLayers instead of Google Maps
- **Map Tiles**: Free OpenStreetMap tiles (no API key needed)
- **Backend**: Shares the same backend API from the root directory

## Quick Start

1. Start the backend server from the root directory:
   ```bash
   cd ..
   npm start
   ```

2. The backend serves from the `public/` directory by default (Google Maps version)

3. To use the OpenLayers version, copy the files:
   ```bash
   # From root directory
   cp -r openlayers-mvp/public/* public/
   ```

4. Open your browser to `http://localhost:3000`

5. Click "Load Sample Data" then "Load Data" to see the map

## Features

- Interactive OpenStreetMap visualization
- Location tracking with custom markers
- Route playback with speed control
- Timeline scrubbing
- Route statistics
- All features from Google Maps version

## Files

- `public/index.html` - Main HTML file with OpenLayers integration
- `public/app.js` - OpenLayers implementation
- `public/style.css` - Styling

## Notes

- Uses the shared backend at `../backend/server.js`
- No backend duplication - only frontend differs
- 100% API compatible with Google Maps version
