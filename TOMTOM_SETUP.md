# TomTom Maps Setup Guide

This guide will help you set up TomTom Maps for the Location Monitoring MVP.

## Why TomTom?

TomTom is a professional mapping and navigation provider with several advantages:

- **🎯 Highly Accurate Road Data** - Professional-grade road network and routing
- **🚗 Multiple Routing Profiles** - Support for car, pedestrian, bicycle, taxi, bus, van, motorcycle, truck
- **🌍 Global Coverage** - Comprehensive worldwide map coverage
- **⚡ Fast Performance** - Optimized APIs for quick responses
- **💰 Generous Free Tier** - 2,500 free requests per day (no credit card required)
- **🔒 Enterprise Ready** - Trusted by major automotive and logistics companies

## Features in This MVP

This TomTom MVP implementation includes:

1. **Road-Accurate Routing** - Routes follow actual roads, not straight lines
2. **Check-in/Check-out Tracking** - Clear markers for employee check-ins and check-outs
3. **Visit Markers** - Track client/site visits
4. **Playback Controls** - Animate employee movement with play/pause/reset
5. **Speed Control** - Adjust playback speed from 0.5x to 5x
6. **Timeline Scrubbing** - Jump to any point in the route
7. **Multi-Route Support** - Handle multiple employees/routes
8. **Route Statistics** - Distance, duration, points, check-ins, check-outs, visits
9. **Progressive Enhancement** - Shows straight lines immediately, then enhances with road routing

## Getting Started

### Step 1: Create a TomTom Developer Account

1. Go to [TomTom Developer Portal](https://developer.tomtom.com/user/register)
2. Click "Register" to create a free account
3. Fill in your details (no credit card required)
4. Verify your email address

### Step 2: Get Your API Key

1. Log in to [TomTom Developer Portal](https://developer.tomtom.com/user/login)
2. Go to your [Dashboard](https://developer.tomtom.com/user/me/apps)
3. You'll see a default API key already created
4. Or click "Create a new app" to create a custom API key
5. Copy your API key (it looks like: `abcd1234efgh5678ijkl9012mnop3456`)

### Step 3: Add API Key to the Application

1. Open `public/tomtom-map/app.js` in a text editor
2. Find this line near the top:
   ```javascript
   const TOMTOM_API_KEY = 'YOUR_TOMTOM_API_KEY';
   ```
3. Replace `YOUR_TOMTOM_API_KEY` with your actual API key:
   ```javascript
   const TOMTOM_API_KEY = 'abcd1234efgh5678ijkl9012mnop3456';
   ```
4. Save the file

### Step 4: Run the Application

1. Make sure the backend server is running:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/tomtom-map/
   ```

3. Click "Load Data" to fetch and display location data

## API Usage & Limits

### Free Tier Limits

TomTom provides a generous free tier:

- **2,500 requests per day** for Routing API
- **2,500 requests per day** for Maps SDK
- No credit card required
- Automatically resets daily

### API Features Used

This MVP uses:

1. **Maps SDK for Web** - For displaying the interactive map
2. **Routing API** - For calculating road-accurate routes between GPS points

### Request Optimization

The MVP is optimized to minimize API requests:

- **Batching**: Routes with up to 150 waypoints are calculated in a single request
- **Intelligent Sampling**: For routes with more than 150 points, the app intelligently samples key waypoints (check-ins, check-outs, visits) while maintaining route accuracy
- **Progressive Enhancement**: Shows straight-line routes immediately, then enhances with road routing
- **Caching**: Once a route is calculated, it's cached for the session

## Customization Options

### Routing Profile

You can change the routing profile in `app.js`:

```javascript
const ROUTING_PROFILE = 'car'; // Options: car, pedestrian, bicycle, taxi, bus, van, motorcycle, truck
```

This affects how routes are calculated based on the mode of transportation.

### Map Style

Change the map style in the map initialization:

```javascript
map = tt.map({
    key: TOMTOM_API_KEY,
    container: 'map',
    style: 'tomtom://vector/1/basic-main', // Change this
    // Other available styles:
    // 'tomtom://vector/1/basic-light'
    // 'tomtom://vector/1/basic-dark'
    // 'tomtom://vector/1/satellite'
    // 'tomtom://vector/1/hybrid'
});
```

### Waypoint Limit

Adjust the maximum waypoints per request:

```javascript
const MAX_WAYPOINTS_PER_REQUEST = 150; // TomTom allows up to 150
```

## Troubleshooting

### Map Not Loading

**Problem**: The map doesn't appear or shows an error.

**Solutions**:
1. Check that your API key is correct and properly set in `app.js`
2. Verify your API key is active in the [TomTom Dashboard](https://developer.tomtom.com/user/me/apps)
3. Check browser console for specific error messages
4. Ensure you have internet connectivity

### No Route Displayed

**Problem**: Markers appear but no route line is drawn.

**Solutions**:
1. Check browser console for API errors
2. Verify you haven't exceeded your daily API limit (2,500 requests)
3. Ensure location data has at least 2 points
4. Check that coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)

### Backend Server Not Running

**Problem**: "Error loading data" message appears.

**Solutions**:
1. Start the backend server: `npm start`
2. Verify server is running on port 3000
3. Check that `backend/location_data.json` exists and has valid data

### API Rate Limit Exceeded

**Problem**: Routes stop being calculated.

**Solutions**:
1. Check your usage in [TomTom Dashboard](https://developer.tomtom.com/user/me/apps)
2. Wait for the daily reset (midnight UTC)
3. Consider upgrading to a paid plan if needed
4. Optimize by reducing the number of test requests

## Best Practices

### For Development

1. **Use Test Data**: Test with smaller datasets to avoid unnecessary API calls
2. **Cache Results**: The app already caches calculated routes in the session
3. **Monitor Usage**: Keep an eye on your API usage in the dashboard

### For Production

1. **API Key Security**: 
   - Don't commit API keys to public repositories
   - Use environment variables or secure configuration
   - Consider using API key restrictions (domain/IP whitelist)

2. **Error Handling**:
   - The MVP includes fallback to straight-line routes if API fails
   - Implement retry logic for transient failures

3. **Performance**:
   - The app already optimizes by sampling large routes
   - Consider backend caching for frequently accessed routes

## Comparison with Other Solutions

### TomTom vs Google Maps
- ✅ TomTom: 2,500 free requests/day vs Google: $200 credit (~40,000 requests)
- ✅ TomTom: No credit card required vs Google: Credit card required
- ✅ TomTom: Professional automotive-grade data
- ✅ TomTom: Better pricing for commercial use

### TomTom vs MapBox
- ✅ TomTom: Better routing accuracy for road vehicles
- ✅ MapBox: 50,000 Map Matching requests/month (different API)
- ✅ TomTom: Simpler API for routing
- Both: Excellent documentation and support

### TomTom vs Leaflet (OSRM)
- ✅ TomTom: Professional support and SLA
- ✅ TomTom: More accurate and up-to-date road data
- ✅ TomTom: Traffic-aware routing
- ✅ Leaflet/OSRM: Completely free but less reliable

## Additional Resources

- [TomTom Maps SDK Documentation](https://developer.tomtom.com/maps-sdk-web-js)
- [TomTom Routing API Documentation](https://developer.tomtom.com/routing-api/documentation)
- [TomTom Code Examples](https://developer.tomtom.com/maps-sdk-web-js/functional-examples)
- [TomTom Support](https://developer.tomtom.com/support)

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review this documentation
3. Visit [TomTom Developer Support](https://developer.tomtom.com/support)
4. Check the [TomTom Community Forum](https://developer.tomtom.com/community)

## License

TomTom Maps SDK is licensed under TomTom's terms of service. Review the [TomTom Terms](https://developer.tomtom.com/terms-and-conditions) for complete details.
