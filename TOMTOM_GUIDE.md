# TomTom Location Monitoring - Complete Guide

A comprehensive guide to set up and use the TomTom Location Monitoring MVP for tracking employee routes with professional road-accurate routing.

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [What You Get](#what-you-get)
3. [Why TomTom?](#why-tomtom)
4. [Detailed Setup](#detailed-setup)
5. [Features & Usage](#features--usage)
6. [API Usage & Limits](#api-usage--limits)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Comparison with Alternatives](#comparison-with-alternatives)
11. [Additional Resources](#additional-resources)

---

## Quick Start (5 Minutes)

Get up and running quickly with these simple steps:

### Prerequisites

- Node.js (v12 or higher)
- A TomTom API key (free, no credit card required)

### Step 1: Get Your TomTom API Key (2 minutes)

1. Go to https://developer.tomtom.com/user/register
2. Sign up for a free account (no credit card needed)
3. After login, you'll see your API key immediately on the dashboard
4. Copy the API key (looks like: `abcd1234efgh5678ijkl9012mnop3456`)

### Step 2: Add API Key (1 minute)

1. Open `public/tomtom-map/app.js` in any text editor
2. Find line 23:
   ```javascript
   const TOMTOM_API_KEY = 'YOUR_TOMTOM_API_KEY';
   ```
3. Replace `YOUR_TOMTOM_API_KEY` with your actual key:
   ```javascript
   const TOMTOM_API_KEY = 'abcd1234efgh5678ijkl9012mnop3456';
   ```
4. Save the file

### Step 3: Start the Server (1 minute)

```bash
# From the project root directory
npm start
```

The server will start on http://localhost:3000

### Step 4: Open the Application (30 seconds)

Open your browser and go to:
```
http://localhost:3000/tomtom-map/
```

### Step 5: Load and View Data (30 seconds)

1. Click the "🔄 Load Data" button
2. The map will:
   - Load sample location data (2 employee routes)
   - Show markers for check-ins, check-outs, and visits
   - Draw straight lines immediately
   - Calculate and display road-accurate routes
3. Use the playback controls:
   - Click ▶️ Play to animate the route
   - Adjust speed with the slider (0.5x to 5x)
   - Use timeline to jump to any point
4. View route statistics below the controls

---

## What You Get

A professional location monitoring system with:

- 🗺️ **TomTom Maps** - Automotive-grade road data
- 🛣️ **Road-Following Routes** - Actual roads, not straight lines
- 📍 **Check-in/Check-out/Visit Tracking** - Clear location markers
- ▶️ **Playback Controls** - Review employee movement
- ⚡ **Speed Control** - Adjustable playback speed (0.5x to 5x)
- 🎯 **Timeline Scrubbing** - Jump to any point in the route
- 📊 **Route Statistics** - Distance, duration, visits
- 🚗 **Animated Vehicle** - Smooth playback animation
- 👥 **Multi-Route Support** - Handle multiple employees

### Included Sample Data

The repository comes with sample data for 2 employee routes:

**Route 1: Sandeep (10 points)**
- Duration: 2 hours (09:00 - 11:00)
- Check-in: 09:00 at Start Location
- Visits: 2 client sites
- Check-out: 11:00 at End Location

**Route 2: Priya (10 points)**
- Duration: 2 hours 15 minutes (08:30 - 10:45)
- Check-in: 08:30 at Office
- Visits: 2 locations (Meeting Point, Client Office)
- Check-out: 10:45 at Return to Office

---

## Why TomTom?

TomTom is a professional mapping and navigation provider trusted by major automotive companies:

- **🎯 Highly Accurate Road Data** - Professional-grade road network and routing
- **🚗 Multiple Routing Profiles** - Car, pedestrian, bicycle, taxi, bus, van, motorcycle, truck
- **🌍 Global Coverage** - Comprehensive worldwide map coverage
- **⚡ Fast Performance** - Optimized APIs for quick responses
- **💰 Generous Free Tier** - 2,500 free requests per day (no credit card required)
- **🔒 Enterprise Ready** - Trusted by major automotive and logistics companies
- **📊 Up to 150 Waypoints** - Handle long routes efficiently (vs Google's 25)
- **🚦 Traffic-Aware** - Real-time traffic data integration

---

## Detailed Setup

### Creating a TomTom Developer Account

1. Visit [TomTom Developer Portal](https://developer.tomtom.com/user/register)
2. Click "Register" to create a free account
3. Fill in your details (email, name, password)
4. No credit card required for free tier
5. Verify your email address

### Getting Your API Key

1. Log in to [TomTom Developer Portal](https://developer.tomtom.com/user/login)
2. Navigate to your [Dashboard](https://developer.tomtom.com/user/me/apps)
3. You'll see a default API key already created, or
4. Click "Create a new app" to create a custom API key
5. Copy your API key (format: `abcd1234efgh5678ijkl9012mnop3456`)

### Configuring the Application

1. Locate the file: `public/tomtom-map/app.js`
2. Open it in your preferred text editor
3. Find the configuration section at the top:
   ```javascript
   const TOMTOM_API_KEY = 'YOUR_TOMTOM_API_KEY';
   ```
4. Replace the placeholder with your actual API key
5. Save the file

### Running the Application

1. Ensure Node.js is installed:
   ```bash
   node --version  # Should show v12 or higher
   ```

2. Start the backend server:
   ```bash
   npm start
   ```

3. Verify the server is running (you should see):
   ```
   Server running on port 3000
   ```

4. Access the application:
   ```
   http://localhost:3000/tomtom-map/
   ```

---

## Features & Usage

### Understanding the Map Interface

#### Marker Legend
- 📍 **Check-in** - Employee started work/shift
- 🏁 **Check-out** - Employee ended work/shift
- 🏢 **Visit** - Client visit or site visit
- 📌 **Normal Point** - Regular tracking point
- 🚗 **Vehicle** - Current position during playback (animated)

#### Route Lines
- **Gray dashed line** - Appears first (straight line between points for instant feedback)
- **Blue solid line** - Road-accurate route (appears after TomTom API calculation)

### Key Features to Try

#### 1. Switch Between Routes
- Use the "Select Route" dropdown to view different employee routes
- Routes are automatically organized by employee/route ID
- Statistics update when switching routes

#### 2. Playback Animation
- Click ▶️ **Play** to start animated playback
- Click ⏸️ **Pause** to stop at current position
- Click ⏮️ **Reset** to return to the beginning
- The animated vehicle (🚗) follows the route smoothly
- Camera automatically pans to follow the vehicle

#### 3. Speed Control
- Adjust the speed slider (0.5x to 5x)
- 0.5x = Slow motion (half speed)
- 1x = Normal speed
- 5x = Fast forward (5 times speed)
- Speed changes take effect immediately

#### 4. Timeline Scrubbing
- Drag the timeline slider to jump to any point
- See timestamp updates in real-time
- Perfect for reviewing specific moments

#### 5. View Marker Details
Click any marker (📍🏁🏢📌) to see popup with:
- Point number in sequence
- Exact timestamp
- GPS coordinates (latitude, longitude)
- Address (if available)
- Route ID/Employee name
- Location type (check-in, check-out, visit, normal)

#### 6. Check Statistics
Real-time statistics panel shows:
- **Total Points** - Number of GPS coordinates tracked
- **Distance** - Road-accurate distance (km) after routing
- **Check-ins** - Count of check-in points
- **Check-outs** - Count of check-out points
- **Visits** - Count of client/site visits
- **Duration** - Time from first to last point

#### 7. Route Information Panel
View current route details:
- Route ID/Employee name
- Date of route
- Total duration
- Current status

---

## API Usage & Limits

### Free Tier Limits

TomTom provides a generous free tier:

- **2,500 requests per day** for Routing API
- **2,500 requests per day** for Maps SDK
- **No credit card required**
- **Automatically resets daily** at midnight UTC

### What Counts as a Request?

| Action | Request Count |
|--------|---------------|
| Loading the map | Free (unlimited) |
| Placing markers | Free (unlimited) |
| Route calculation | 1 request per route |
| Re-viewing calculated route | 0 (cached in session) |

### Typical Usage Examples

- Testing with 2 sample routes = **2 requests**
- Loading same routes again = **0 additional requests** (cached)
- Viewing 10 different employee routes = **10 requests**
- With 2,500 requests/day, you can view **~2,500 different routes** daily

### API Features Used

This MVP uses two TomTom services:

1. **Maps SDK for Web** - Interactive map display (unlimited usage)
2. **Routing API** - Road-accurate route calculation (2,500 requests/day)

### Request Optimization

The application is optimized to minimize API requests:

- **Batching** - Routes with up to 150 waypoints in a single request
- **Intelligent Sampling** - Routes with 150+ points are sampled intelligently:
  - Always includes first and last points
  - Always includes check-in, check-out, and visit points
  - Samples remaining points evenly
- **Progressive Enhancement** - Shows straight-line routes immediately
- **Session Caching** - Calculated routes cached for the session
- **Fallback** - Falls back to straight lines if API fails

---

## Customization

### Routing Profile

Change the mode of transportation in `app.js`:

```javascript
const ROUTING_PROFILE = 'car'; // Default
```

Available options:
- `car` - Optimized for cars (default)
- `pedestrian` - Walking routes
- `bicycle` - Cycling routes
- `taxi` - Taxi routes
- `bus` - Bus routes
- `van` - Van routes
- `motorcycle` - Motorcycle routes
- `truck` - Truck routes with size/weight restrictions

### Map Style

Change the visual style in `app.js`:

```javascript
map = tt.map({
    key: TOMTOM_API_KEY,
    container: 'map',
    style: 'tomtom://vector/1/basic-main', // Change this line
});
```

Available styles:
- `tomtom://vector/1/basic-main` - Standard map (default)
- `tomtom://vector/1/basic-light` - Light theme
- `tomtom://vector/1/basic-dark` - Dark theme
- `tomtom://vector/1/satellite` - Satellite imagery
- `tomtom://vector/1/hybrid` - Satellite + labels

### Waypoint Limit

Adjust maximum waypoints per API request:

```javascript
const MAX_WAYPOINTS_PER_REQUEST = 150; // TomTom allows up to 150
```

Lower values = more requests but faster responses
Higher values = fewer requests but might be slower

### Adding Your Own Data

Edit `backend/location_data.json` with your GPS data:

```json
{
  "status": "success",
  "data": [
    [
      latitude,           // e.g., 21.090064
      longitude,          // e.g., 79.091735
      "address",          // optional description
      "-",                // reserved
      "-",                // reserved
      null,               // reserved
      "EmployeeName",     // route identifier
      "2026-01-12T09:00:00.000Z",  // ISO 8601 timestamp
      ".",                // reserved
      "check_in"          // flag: check_in, check_out, visit, normal
    ]
  ]
}
```

Location flags:
- `check_in` - Employee started shift/route
- `check_out` - Employee ended shift/route
- `visit` - Client or site visit
- `normal` - Regular tracking point

---

## Troubleshooting

### "Please set your TomTom API key"

**Problem**: API key banner appears on the page.

**Solutions**:
1. Verify you've edited `public/tomtom-map/app.js`
2. Check that the API key is on line 23
3. Ensure you saved the file after editing
4. Try hard-refreshing the browser (Ctrl+F5 or Cmd+Shift+R)

### Map Not Loading

**Problem**: The map container is empty or shows an error.

**Solutions**:
1. Check that your API key is correct in `app.js`
2. Verify API key is active in [TomTom Dashboard](https://developer.tomtom.com/user/me/apps)
3. Check browser console (F12) for specific error messages
4. Ensure internet connectivity (TomTom SDK loads from CDN)
5. Try a different browser to rule out browser-specific issues

### "Error loading data"

**Problem**: Data doesn't load when clicking "Load Data" button.

**Solutions**:
1. Verify backend server is running: `npm start`
2. Check server is on port 3000: `http://localhost:3000/api/locations`
3. Verify `backend/location_data.json` exists
4. Check JSON file has valid data format
5. Look for errors in server console

### Routes Show Straight Lines Only (No Blue Lines)

**Problem**: Gray straight lines appear but no blue road-accurate routes.

**Solutions**:
1. Open browser console (F12) and check for API errors
2. Verify API key is correct
3. Check if you've exceeded daily limit (2,500 requests):
   - Visit [TomTom Dashboard](https://developer.tomtom.com/user/me/apps)
   - Check usage statistics
4. Ensure location data has at least 2 points
5. Verify coordinates are valid:
   - Latitude: -90 to 90
   - Longitude: -180 to 180

### API Rate Limit Exceeded

**Problem**: Routes stop being calculated after several tests.

**Solutions**:
1. Check usage in [TomTom Dashboard](https://developer.tomtom.com/user/me/apps)
2. Wait for daily reset (midnight UTC)
3. Optimize testing:
   - Use the same routes multiple times (cached)
   - Reduce number of different routes tested
4. Consider paid plan for higher limits if needed

### Playback Not Working

**Problem**: Play button doesn't start animation.

**Solutions**:
1. Ensure data is loaded (click "Load Data" first)
2. Check that route has been calculated (blue line visible)
3. Try clicking "Reset" then "Play"
4. Check browser console for JavaScript errors

### Map Doesn't Follow Vehicle

**Problem**: Vehicle marker moves but map doesn't pan.

**Solutions**:
1. This is expected behavior - map pans smoothly but not instantly
2. Manually pan the map if needed
3. The animation uses smooth transitions to avoid jarring movements

---

## Best Practices

### For Development

1. **Use Test Data**
   - Start with small datasets (10-20 points)
   - Avoid unnecessary API calls during development
   - Use the provided sample data for testing

2. **Cache Results**
   - The app automatically caches routes in the session
   - Reloading the same route uses cache, not API
   - Clear browser cache to force new API calls

3. **Monitor Usage**
   - Regularly check [TomTom Dashboard](https://developer.tomtom.com/user/me/apps)
   - Track daily request usage
   - Set up alerts if approaching limits

4. **Development Tools**
   - Use browser DevTools (F12) for debugging
   - Check Network tab for API requests
   - Monitor Console for errors

### For Production

1. **API Key Security**
   - **Never commit API keys** to public repositories
   - Use environment variables:
     ```javascript
     const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
     ```
   - Add `.env` to `.gitignore`
   - Use API key restrictions in TomTom portal:
     - Domain whitelist
     - IP address whitelist
     - Referrer restrictions

2. **Error Handling**
   - The MVP includes fallback to straight-line routes
   - Implement retry logic for transient failures
   - Show user-friendly error messages
   - Log errors for debugging

3. **Performance Optimization**
   - The app already samples large routes intelligently
   - Consider backend caching for frequently accessed routes
   - Use CDN for static assets
   - Minimize bundle size

4. **Database Integration**
   - Replace JSON file with proper database:
     - MongoDB for document storage
     - PostgreSQL for relational data
   - Add indexes for fast queries
   - Implement data validation

5. **Authentication**
   - Add user authentication system
   - Restrict access to authorized users
   - Implement role-based access control
   - Secure API endpoints

6. **Monitoring**
   - Set up application monitoring
   - Track API usage and costs
   - Monitor performance metrics
   - Set up alerts for errors

---

## Comparison with Alternatives

### TomTom vs Google Maps

| Feature | TomTom | Google Maps |
|---------|--------|-------------|
| Free tier | 2,500 requests/day | $200 credit (~40,000 requests) |
| Credit card | Not required | Required |
| Waypoints per request | Up to 150 | Limited to 25 |
| Data quality | Automotive-grade | General purpose |
| Pricing model | Simple per-request | Complex, multiple SKUs |
| Best for | Vehicle routing | General mapping |

**Verdict**: ✅ TomTom is better for employee tracking with no credit card requirement

### TomTom vs MapBox

| Feature | TomTom | MapBox |
|---------|--------|---------|
| Free tier | 2,500 requests/day (Routing) | 50,000 requests/month (Map Matching) |
| Routing focus | Excellent for vehicles | Excellent for map matching |
| API simplicity | Simple routing API | More complex but flexible |
| Use case | Vehicle routing | Map matching/visualization |
| Community | Automotive industry | Developer community |

**Verdict**: ✅ TomTom for simpler vehicle routing, MapBox for advanced map matching

### TomTom vs Leaflet (OSRM)

| Feature | TomTom | Leaflet + OSRM |
|---------|--------|----------------|
| Cost | 2,500 free/day, then paid | Completely free |
| Data accuracy | Professional, up-to-date | Community-maintained |
| Reliability | Enterprise SLA | Variable (public servers) |
| Support | Professional support | Community forums |
| Traffic data | Yes | No |
| Best for | Production apps | Personal projects |

**Verdict**: ✅ TomTom for production, Leaflet for personal/experimental projects

---

## Additional Resources

### Official Documentation

- [TomTom Maps SDK for Web](https://developer.tomtom.com/maps-sdk-web-js) - Complete SDK documentation
- [TomTom Routing API](https://developer.tomtom.com/routing-api/documentation) - Routing API reference
- [TomTom Code Examples](https://developer.tomtom.com/maps-sdk-web-js/functional-examples) - Sample implementations
- [API Reference](https://developer.tomtom.com/maps-sdk-web-js/documentation) - Detailed API docs

### Support Channels

- [TomTom Developer Support](https://developer.tomtom.com/support) - Official support
- [TomTom Community Forum](https://developer.tomtom.com/community) - Community help
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tomtom) - Technical Q&A

### Useful Links

- [TomTom Developer Portal](https://developer.tomtom.com/) - Main portal
- [Dashboard](https://developer.tomtom.com/user/me/apps) - Manage API keys
- [Terms of Service](https://developer.tomtom.com/terms-and-conditions) - Legal terms
- [Pricing](https://developer.tomtom.com/store/maps-api) - Pricing details

### Learning Resources

- [Getting Started Guide](https://developer.tomtom.com/maps-sdk-web-js/tutorials) - Official tutorials
- [Video Tutorials](https://www.youtube.com/c/TomTomDeveloper) - YouTube channel
- [Blog](https://developer.tomtom.com/blog) - Latest updates and articles

---

## Support

If you encounter issues:

1. **Check this guide** - Most common issues are covered in the Troubleshooting section
2. **Browser console** - Press F12 and check for error messages
3. **Server logs** - Check terminal where you ran `npm start`
4. **TomTom support** - Visit [TomTom Developer Support](https://developer.tomtom.com/support)
5. **Community** - Ask on [TomTom Community Forum](https://developer.tomtom.com/community)

### Getting Help

When asking for help, provide:
- Error message from browser console
- Server logs if applicable
- Steps to reproduce the issue
- Browser and OS version
- API key status (active/inactive, usage)

---

## License

TomTom Maps SDK is licensed under TomTom's terms of service. Review the [TomTom Terms](https://developer.tomtom.com/terms-and-conditions) for complete details.

This application code is licensed under MIT License.

---

**Ready to start tracking?** Follow the [Quick Start](#quick-start-5-minutes) section above and you'll be viewing employee routes in 5 minutes! 🚀
