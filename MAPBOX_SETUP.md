# 🗺️ Mapbox MVP - Complete Setup Guide

## Overview

This Mapbox MVP implementation solves the critical issue of GPS points not following actual roads. Unlike Google Maps, Leaflet, or OpenLayers implementations that draw straight lines between points, this solution uses **Mapbox Map Matching API** to snap GPS coordinates to actual road networks.

## Key Features

### ✅ What This Solves

1. **Road-Following Routes**: GPS points are matched to actual roads, not straight lines
2. **Map Matching API**: Uses Mapbox's professional-grade Map Matching service
3. **Progressive Enhancement**: Shows immediate results, then enhances with road-snapping
4. **Batch Processing**: Handles large datasets by batching API requests
5. **Multi-Route Support**: View multiple employee routes with route selector
6. **Playback Controls**: Animate movement with speed controls (0.5x to 5x)
7. **Check-in/Check-out**: Clear markers for different location types
8. **Timeline Scrubbing**: Jump to any point in the route

### 🎯 Perfect For

- **Field Employee Monitoring**: Track security guards, sales teams, delivery personnel
- **Post-Facto Tracking**: Review past movements (not real-time)
- **Business Compliance**: Verify employees visited required locations
- **Route Analysis**: Understand actual paths taken between locations

## Getting Started

### 1. Get Mapbox Access Token (FREE)

1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Sign up for a free account
3. Navigate to [Access Tokens](https://account.mapbox.com/access-tokens/)
4. Create a new token or use the default public token
5. Copy your access token

**Free Tier Includes:**
- 50,000 Map Matching API requests per month
- 50,000 map loads per month
- No credit card required

### 2. Configure Access Token

Open `/public/mapbox-map/app.js` and replace the placeholder:

```javascript
// Line 18
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
```

Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your actual token.

### 3. Start the Server

```bash
cd location-monitoring
npm start
```

Server starts on `http://localhost:3000`

### 4. Open Mapbox MVP

Navigate to:
```
http://localhost:3000/mapbox-map/
```

### 5. Load Your Data

Click the **"🔄 Load Data"** button to fetch and display location data.

## How It Works

### Technical Architecture

```
GPS Points → Filter Close Points → Batch Processing → Map Matching API → Road-Snapped Route
     ↓              ↓                     ↓                    ↓                ↓
Raw Data    Noise Reduction    100 points/batch    Mapbox Service    Display on Map
```

### Map Matching API Flow

1. **Initial Display**: Straight line route shown immediately for user feedback
2. **Point Filtering**: Removes points closer than 10 meters (noise reduction)
3. **Batching**: Splits data into batches of 100 coordinates (API limit)
4. **API Calls**: Sequential calls to Mapbox Map Matching API
5. **Road Snapping**: Receives road-network-aligned coordinates
6. **Display**: Replaces straight line with road-snapped route
7. **Playback**: Animates vehicle movement along the matched road

### Key Parameters

```javascript
// Configuration in app.js
const MAP_MATCHING_BATCH_SIZE = 100;  // Mapbox limit
const MIN_POINT_DISTANCE = 10;         // meters - noise filter
```

## API Usage & Costs

### Free Tier (No Credit Card)

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Map Matching API | 50,000 requests/month | $5 per 1,000 |
| Map Loads | 50,000 loads/month | $5 per 1,000 |
| Directions API | 50,000 requests/month | $5 per 1,000 |

### Usage Calculation

**Scenario**: 10 employees, 100 GPS points each, tracked daily

- Points per employee per day: 100
- Filtered points (after noise reduction): ~40
- Batches per employee: 1 (under 100 limit)
- API calls per day: 10 employees × 1 batch = 10 requests
- **Monthly usage**: 10 × 30 = 300 requests

**Result**: Well within free tier (50,000/month)

### Large Dataset Scenario

**Scenario**: 50 employees, 500 GPS points each, tracked daily

- Filtered points per employee: ~200
- Batches per employee: 2 (200 ÷ 100)
- API calls per day: 50 × 2 = 100 requests
- **Monthly usage**: 100 × 30 = 3,000 requests

**Cost**: FREE (under 50,000 limit)

## Features Comparison

| Feature | Google Maps | Leaflet + OSRM | OpenLayers | **Mapbox MVP** |
|---------|-------------|----------------|------------|----------------|
| Road Matching | Directions API | Free OSRM | No | ✅ **Map Matching** |
| Batch Support | Limited | Yes | No | ✅ **100 per batch** |
| Accuracy | Good | Variable | N/A | ✅ **Excellent** |
| Free Tier | Limited | Unlimited | Unlimited | ✅ **50k/month** |
| Setup Complexity | Medium | High | Medium | ✅ **Easy** |
| API Reliability | High | Variable | N/A | ✅ **High** |
| Performance | Good | Slow | Fast | ✅ **Excellent** |

## Advanced Configuration

### Adjust Map Matching Radius

In `app.js`, modify the API call parameters:

```javascript
// Line ~300
`&radiuses=${coordinates.map(() => '25').join(';')}` // 25m radius per point
```

**Options:**
- `25`: Default - good for urban areas
- `50`: Better for highways/rural areas
- `10`: Stricter matching for dense city centers

### Change Map Style

```javascript
// Line 64
style: 'mapbox://styles/mapbox/streets-v12'
```

**Available Styles:**
- `streets-v12`: Default streets (recommended)
- `outdoors-v12`: Topographic style
- `light-v11`: Light theme
- `dark-v11`: Dark theme
- `satellite-v9`: Satellite imagery
- `satellite-streets-v12`: Satellite with labels

### Modify Noise Filter

```javascript
// Line 16
const MIN_POINT_DISTANCE = 10; // meters
```

- **Lower values (5m)**: Keep more points, slower processing
- **Higher values (20m)**: Fewer points, faster processing, smoother routes

## Multi-Route Support

### Route Selector

When data contains multiple routes (different employees or days):

1. Route selector automatically appears
2. Each route shows: `RouteID (X points)`
3. Click dropdown to switch between routes
4. Playback resets when switching routes

### Route Data Structure

Backend should provide routes grouped by `routeId`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lat": 21.090064,
      "lng": 79.091735,
      "routeId": "John_2026-01-12",
      "timestamp": "2026-01-12T09:20:00.000Z",
      "flag": "check_in"
    }
  ],
  "routes": {
    "John_2026-01-12": {
      "totalDistance": "12.5",
      "duration": "2h 30m"
    }
  }
}
```

## Playback Controls

### Speed Control
- **Range**: 0.5x to 5x
- **Real-time adjustment**: Change speed during playback
- **Use cases**:
  - 0.5x: Detailed inspection
  - 1x: Normal speed
  - 5x: Quick overview

### Timeline Scrubbing
- **Drag slider**: Jump to any point in the route
- **Time display**: Shows current time / total time
- **Sync with playback**: Automatically updates during playback

## Troubleshooting

### "API Key Required" Banner

**Issue**: Access token not configured  
**Solution**: Set `mapboxgl.accessToken` in `app.js`

### Straight Lines Instead of Roads

**Issue**: Map Matching API failing  
**Possible causes**:
1. Invalid access token
2. API rate limit exceeded
3. Points too far apart
4. Network issues

**Solutions**:
- Check browser console for errors
- Verify token has Map Matching API enabled
- Check API usage at [Mapbox Account](https://account.mapbox.com/)
- Reduce `MIN_POINT_DISTANCE` to keep more points

### "No location data found"

**Issue**: Backend not returning data  
**Solution**: 
```bash
# Verify backend is running
curl http://localhost:3000/api/locations

# Check location_data.json exists
ls backend/location_data.json
```

### Map Not Loading

**Issue**: Mapbox GL JS not loading  
**Solutions**:
- Check internet connection
- Verify token is valid
- Check browser console for CORS errors

## Performance Optimization

### For Large Datasets (1000+ points)

1. **Increase noise filter**:
```javascript
const MIN_POINT_DISTANCE = 20; // Reduce points
```

2. **Batch size optimization**:
```javascript
const MAP_MATCHING_BATCH_SIZE = 100; // Keep at max (100)
```

3. **Marker downsampling**: Show fewer markers for display
4. **Progressive loading**: Load routes on-demand

### Network Optimization

- API calls are sequential with 100ms delay
- Prevents rate limiting
- Shows progress feedback

## Self-Hosted Alternative

If you need complete control, consider:

1. **Valhalla** (Open-source routing engine)
   - Self-host map matching service
   - No API limits
   - Requires server infrastructure

2. **GraphHopper** (Open-source)
   - Map matching support
   - Docker deployment available

## Integration with Backend

### Required Backend Endpoints

```javascript
// GET /api/locations
{
  "success": true,
  "data": [/* location points */],
  "routes": {/* route metadata */}
}
```

### Location Point Format

```javascript
{
  "id": 1,
  "lat": 21.090064,
  "lng": 79.091735,
  "routeId": "employee_name_or_id",
  "timestamp": "2026-01-12T09:20:00.000Z",
  "flag": "check_in|check_out|visit|normal",
  "address": "Optional address"
}
```

## Comparison with Other Solutions

### Why Mapbox Map Matching?

1. **Purpose-Built**: Designed specifically for GPS trace matching
2. **Accuracy**: Better than Directions API for noisy GPS data
3. **Batch Support**: 100 coordinates per request (vs 25 for Google Directions)
4. **Cost-Effective**: 50,000 free requests/month
5. **Reliability**: Professional-grade service with 99.9% uptime
6. **Performance**: Fast response times, global CDN

### vs Google Maps Directions API

| Aspect | Google Directions | Mapbox Map Matching |
|--------|-------------------|---------------------|
| Max Waypoints | 25 | 100 |
| GPS Matching | No | ✅ Yes |
| Free Tier | Limited | 50,000/month |
| Accuracy | Good | Better for GPS traces |

### vs OSRM (Free Alternative)

| Aspect | OSRM | Mapbox |
|--------|------|--------|
| Cost | Free | Free tier |
| Reliability | Variable | High |
| Setup | Complex | Easy |
| Performance | Depends on server | Excellent |
| Support | Community | Professional |

## Production Deployment

### Security Best Practices

1. **Token Restrictions**: Restrict token to your domain
   ```
   URL Restrictions: https://yourdomain.com/*
   ```

2. **Environment Variables**: Use env vars in production
   ```javascript
   mapboxgl.accessToken = process.env.MAPBOX_TOKEN;
   ```

3. **Rate Limiting**: Implement backend rate limiting

### Monitoring

Track usage at: [Mapbox Statistics](https://account.mapbox.com/statistics/)

Monitor:
- Map loads
- Map Matching API requests
- Errors and response times

## Support & Resources

- **Mapbox Documentation**: https://docs.mapbox.com/
- **Map Matching API**: https://docs.mapbox.com/api/navigation/map-matching/
- **Mapbox GL JS**: https://docs.mapbox.com/mapbox-gl-js/
- **API Pricing**: https://www.mapbox.com/pricing/

## License

This implementation is part of the location-monitoring project under MIT License.

---

**Created by**: Rupesh Bisen  
**Last Updated**: January 2026  
**Version**: 1.0.0 MVP
