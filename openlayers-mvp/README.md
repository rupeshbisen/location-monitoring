# OpenLayers MVP

A minimal OpenLayers implementation of the Location Monitoring System. This version uses OpenStreetMap tiles instead of Google Maps, requiring no API key.

## Overview

OpenLayers MVP is a frontend-only implementation that replaces Google Maps with OpenLayers (OpenStreetMap tiles).

**Architecture:**
- **Backend**: Shared with Google Maps version at `../backend/server.js`
- **Frontend**: Independent OpenLayers implementation in `public/`
- **Database**: Shared `location_data.json` file

## What's Different from Google Maps

### Key Changes

1. **Map Initialization**: `google.maps.Map` → `ol.Map`
2. **Tiles**: Google Maps → OpenStreetMap (free, no API key)
3. **Markers**: Google markers → OpenLayers vector features
4. **Popups**: InfoWindow → OpenLayers Overlay
5. **Lines**: Google Polyline → OpenLayers LineString

### What's the Same

- All API endpoints (backend is shared)
- Database and data format
- UI layout and controls
- All features and functionality

### Benefits

- No API key required
- No usage limits
- Free to use
- Open source
- Privacy focused (no data sent to Google)

## Quick Start

### 1. Start the Backend

From the root directory:
```bash
cd /home/runner/work/location-monitoring/location-monitoring
npm start
```

### 2. Switch to OpenLayers

Copy the OpenLayers frontend:
```bash
cp -r openlayers-mvp/public/* public/
```

### 3. Open in Browser

Navigate to: `http://localhost:3000`

### 4. Load Data

1. Click "Load Sample Data"
2. Click "Load Data"
3. Click "Play" to see animated playback

That's it!

## Features

- Interactive OpenStreetMap visualization
- Location tracking with custom markers
- Route playback with speed control
- Timeline scrubbing
- Route statistics
- All features from Google Maps version

## Files

```
openlayers-mvp/
├── public/
│   ├── index.html    # OpenLayers HTML
│   ├── app.js        # OpenLayers implementation (~600 lines)
│   └── style.css     # Styling
└── README.md         # This file
```

## Compatibility

100% API compatible with Google Maps version. Mobile apps work with either version without code changes.

## Notes

- Uses the shared backend at `../backend/server.js`
- No backend duplication - only frontend differs
- Frontend-only implementation
