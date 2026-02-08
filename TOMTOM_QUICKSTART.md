# TomTom MVP Quick Start Guide

This is a quick reference guide to get the TomTom Location Monitoring MVP up and running in 5 minutes.

## What You Get

A professional location monitoring system with:
- 🗺️ TomTom Maps with automotive-grade road data
- 🛣️ Routes that follow actual roads (not straight lines)
- 📍 Check-in/Check-out/Visit tracking
- ▶️ Playback controls to review employee movement
- 📊 Route statistics (distance, duration, visits)
- 🚗 Animated vehicle playback

## Prerequisites

- Node.js (v12 or higher)
- A TomTom API key (free, no credit card required)

## 5-Minute Setup

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

## What's Included

The repository comes with sample data for 2 employee routes:

### Route 1: Sandeep (10 points)
- **Duration**: 2 hours (09:00 - 11:00)
- **Check-in**: 09:00 at Start Location
- **Visits**: 2 client sites
- **Check-out**: 11:00 at End Location

### Route 2: Priya (10 points)
- **Duration**: 2 hours 15 minutes (08:30 - 10:45)
- **Check-in**: 08:30 at Office
- **Visits**: 2 locations (Meeting Point, Client Office)
- **Check-out**: 10:45 at Return to Office

## Key Features to Try

### 1. Switch Between Routes
Use the "Select Route" dropdown to view different employee routes.

### 2. Playback Animation
- Click ▶️ Play to start
- Click ⏸️ Pause to stop
- Click ⏮️ Reset to restart
- Adjust speed for faster/slower playback

### 3. Timeline Scrubbing
Drag the timeline slider to jump to any point in the route instantly.

### 4. View Marker Details
Click any marker (📍🏁🏢📌) to see:
- Location coordinates
- Timestamp
- Address (if available)
- Route ID

### 5. Check Statistics
View real-time statistics:
- Total Points
- Distance (road-accurate after routing)
- Check-ins count
- Check-outs count
- Visits count
- Total Duration

## Understanding the Map

### Marker Legend
- 📍 **Check-in** - Employee started work/shift
- 🏁 **Check-out** - Employee ended work/shift
- 🏢 **Visit** - Client visit or site visit
- 📌 **Normal Point** - Regular tracking point
- 🚗 **Vehicle** - Current position during playback (animated)

### Route Lines
- **Gray dashed line** - Appears first (straight line between points)
- **Blue solid line** - Road-accurate route (appears after API calculation)

## TomTom API Usage

### Free Tier Limits
- **2,500 requests per day**
- Resets daily at midnight UTC
- No credit card required

### What Counts as a Request?
- Each route calculation = 1 request
- Map loading = free (unlimited)
- Marker placement = free (unlimited)

### Typical Usage
- Testing with 2 routes = 2 requests
- Loading same routes again = uses cache (0 additional requests in same session)
- Each new employee route = 1 request

With 2,500 requests/day, you can:
- View ~2,500 different employee routes per day
- Or view the same routes unlimited times (cached)

## Troubleshooting

### "Please set your TomTom API key"
→ Check that you've updated `app.js` with your actual API key

### "Error loading data"
→ Make sure the backend server is running (`npm start`)

### Routes show straight lines only (no blue lines)
→ Check browser console for API errors
→ Verify API key is correct
→ Check if you've exceeded daily limit (2,500 requests)

### Map doesn't load
→ Check internet connection (TomTom SDK loads from CDN)
→ Check browser console for errors

## Next Steps

### Add Your Own Data
Edit `backend/location_data.json` following this format:
```json
[
  latitude,
  longitude,
  "address",
  "-",
  "-",
  null,
  "EmployeeName",
  "2026-01-12T09:00:00.000Z",
  ".",
  "check_in"
]
```

Flags can be: `check_in`, `check_out`, `visit`, or `normal`

### Customize Routing Profile
In `app.js`, change line 26:
```javascript
const ROUTING_PROFILE = 'car'; // car, pedestrian, bicycle, taxi, bus, van, motorcycle, truck
```

### Production Deployment
1. Use environment variables for API key (don't commit it)
2. Add domain restrictions in TomTom Developer Portal
3. Consider using a real database instead of JSON file
4. Add authentication for your application

## Resources

- **Full Setup Guide**: See [TOMTOM_SETUP.md](TOMTOM_SETUP.md)
- **API Documentation**: [TomTom Routing API](https://developer.tomtom.com/routing-api/documentation)
- **Maps SDK Docs**: [TomTom Maps SDK](https://developer.tomtom.com/maps-sdk-web-js)
- **Get Support**: [TomTom Developer Portal](https://developer.tomtom.com/support)

## Why TomTom?

✅ **Automotive-Grade Accuracy** - Used by car manufacturers worldwide
✅ **Road-Following Routes** - Shows how employees actually traveled
✅ **Multiple Transport Modes** - Car, pedestrian, bicycle, etc.
✅ **Traffic Awareness** - Real-time traffic data
✅ **Generous Free Tier** - 2,500 requests/day
✅ **No Credit Card** - Free tier doesn't require payment info
✅ **Up to 150 Waypoints** - Handle long routes efficiently

## Support

If you need help:
1. Check this quick start guide
2. Read [TOMTOM_SETUP.md](TOMTOM_SETUP.md) for detailed setup
3. Visit [TomTom Support](https://developer.tomtom.com/support)
4. Check browser console for error messages

---

**Ready to start?** Follow the 5-minute setup above and you'll be viewing employee routes in no time! 🚀
