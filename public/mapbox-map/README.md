# Mapbox Location Monitoring MVP

## Overview

This is a production-ready implementation of location monitoring using **Mapbox Map Matching API** to snap GPS coordinates to actual road networks.

## Problem Solved

**GPS points now follow actual roads** instead of drawing straight lines between coordinates. This makes it possible to see exactly which route an employee took.

## Quick Start

### 1. Get Mapbox Token (FREE - No Credit Card)

Visit: https://account.mapbox.com/access-tokens/

Copy your default public token.

### 2. Configure Token

Edit `app.js` line 18:

```javascript
mapboxgl.accessToken = 'pk.your_actual_token_here';
```

### 3. Start Server

From project root:
```bash
npm start
```

### 4. Open App

```
http://localhost:3000/mapbox-map/
```

### 5. Load Data

Click "🔄 Load Data" button to see the map in action!

## Features

- ✅ **Road-Snapped Routes**: GPS points follow actual roads using Map Matching API
- ✅ **Playback Controls**: Play, pause, reset with speed control (0.5x-5x)
- ✅ **Timeline Scrubbing**: Jump to any point in the route
- ✅ **Multi-Route Support**: View different employees via route selector
- ✅ **Check-in/Check-out**: 📍🏁🏢📌 markers for different location types
- ✅ **Statistics**: Total points, distance, visits, check-ins, check-outs
- ✅ **Progressive Enhancement**: Instant display + background road-snapping

## Free Tier

- 50,000 Map Matching API requests/month
- 50,000 map loads/month
- No credit card required

**Example**: 50 employees × 200 points/day = 1,500 requests/month = **FREE**

## Files

- `index.html` - UI layout with Mapbox GL JS
- `app.js` - Complete implementation (~800 lines)
  - Map initialization
  - Map Matching API integration
  - Playback system
  - Route management
  - Marker system

## How It Works

1. **Load Data**: Fetches location data from `/api/locations`
2. **Filter Points**: Removes GPS noise (points < 10m apart)
3. **Batch Processing**: Groups points into batches of 100
4. **Map Matching**: Calls Mapbox API to snap to roads
5. **Display**: Shows road-following route with markers
6. **Playback**: Animates vehicle movement along matched route

## API Usage

```javascript
// Map Matching API call
const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}
  ?geometries=geojson
  &overview=full
  &radiuses=25
  &access_token=${token}`;
```

## Configuration

### Change Map Style

Line 64 in `app.js`:
```javascript
style: 'mapbox://styles/mapbox/streets-v12'
```

Options: `streets-v12`, `outdoors-v12`, `light-v11`, `dark-v11`, `satellite-v9`

### Adjust Noise Filter

Line 16 in `app.js`:
```javascript
const MIN_POINT_DISTANCE = 10; // meters
```

### Change Batch Size

Line 15 in `app.js`:
```javascript
const MAP_MATCHING_BATCH_SIZE = 100; // max allowed by Mapbox
```

## Documentation

- **Setup Guide**: `/MAPBOX_SETUP.md`
- **Quick Start**: `/QUICKSTART_MAPBOX.md`
- **Comparison**: `/COMPARISON.md`
- **Implementation**: `/IMPLEMENTATION_SUMMARY.md`

## Troubleshooting

### "API Key Required" banner

**Fix**: Set your token in `app.js` line 18

### Straight lines instead of roads

**Check**: 
1. Browser console for errors (F12)
2. Token is valid
3. Points are not too far apart (< 500m)

### No data showing

**Fix**: Ensure backend is running and has data in `location_data.json`

## Support

- Mapbox Docs: https://docs.mapbox.com/
- Map Matching API: https://docs.mapbox.com/api/navigation/map-matching/
- Pricing: https://www.mapbox.com/pricing/

---

**Status**: ✅ Production-Ready

**Version**: 1.0.0 MVP

**Author**: Rupesh Bisen
