# 🚀 Mapbox MVP - Quick Start Example

## 5-Minute Setup

### Step 1: Get Your Free Mapbox Token (2 minutes)

1. Go to **https://account.mapbox.com/**
2. Click "Sign up" (or "Sign in" if you have an account)
3. After login, you'll see your **default public token**
4. Copy this token - it looks like: `pk.eyJ1IjoieW91cm5hbWUiLCJhIjoiY...`

**Note**: Free tier includes:
- ✅ 50,000 Map Matching requests/month
- ✅ 50,000 map loads/month
- ✅ No credit card required

### Step 2: Configure the Token (30 seconds)

Open the file: `/public/mapbox-map/app.js`

Find line 18 and replace the placeholder:

```javascript
// BEFORE
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

// AFTER
mapboxgl.accessToken = 'pk.eyJ1IjoieW91cm5hbWUiLCJhIjoiY...'; // Your actual token
```

### Step 3: Start the Server (30 seconds)

```bash
cd location-monitoring
npm start
```

Expected output:
```
Server running at http://localhost:3000/
API endpoints:
  GET  /api/locations - Get all locations (with optional filters)
```

### Step 4: Open the App (30 seconds)

Open your browser and go to:
```
http://localhost:3000/mapbox-map/
```

You should see:
- ✅ Map loads successfully
- ✅ Controls panel on the left
- ✅ No API key warning (yellow banner should disappear)

### Step 5: Load Sample Data (1 minute)

Click the **"🔄 Load Data"** button.

You'll see:
1. **Loading spinner**: "Snapping route to roads..."
2. **Map updates**: Shows route following actual roads
3. **Markers appear**: Different icons for check-in, check-out, visit
4. **Statistics update**: Shows total points, distance, etc.
5. **Route selector**: (if multiple routes) Choose between John, Sarah, Mike

### Step 6: Test Playback (1 minute)

1. Click **▶️ Play** button
2. Watch the 🚗 vehicle marker move along the route
3. Try **⏸️ Pause** to stop
4. Drag the **Speed** slider to change playback speed (0.5x to 5x)
5. Drag the **Timeline** slider to jump to any point
6. Click **⏮️ Reset** to start over

## Using Your Own Data

### Data Format

Your backend should return data in this format:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lat": 21.090064,
      "lng": 79.091735,
      "routeId": "EmployeeName_Date",
      "timestamp": "2026-01-12T09:00:00.000Z",
      "flag": "check_in",
      "address": "Office Location"
    },
    {
      "id": 2,
      "lat": 21.095890,
      "lng": 79.097890,
      "routeId": "EmployeeName_Date",
      "timestamp": "2026-01-12T09:30:00.000Z",
      "flag": "visit",
      "address": "Client Site"
    }
  ],
  "routes": {
    "EmployeeName_Date": {
      "totalDistance": "12.5",
      "totalPoints": 10,
      "duration": "2h 30m"
    }
  }
}
```

### Flag Types

- `check_in`: 📍 Employee checked in (start of shift)
- `check_out`: 🏁 Employee checked out (end of shift)
- `visit`: 🏢 Employee visited a client/location
- `normal`: 📌 Regular tracking point

### Backend Implementation

The sample backend is already set up. Edit `/backend/location_data.json`:

```json
{
  "status": "success",
  "data": [
    [
      21.090064,        // latitude
      79.091735,        // longitude
      "Address",        // address (optional)
      "-",              // reserved
      "-",              // reserved
      null,             // reserved
      "RouteID",        // route identifier (employee_name or employee_date)
      "2026-01-12T09:00:00.000Z",  // ISO timestamp
      ".",              // reserved
      "check_in"        // flag: check_in, check_out, visit, normal
    ]
  ]
}
```

## Testing Different Scenarios

### Scenario 1: Single Employee, One Day

```json
{
  "routeId": "John_2026-01-12",
  "points": 50,
  "duration": "8 hours",
  "visits": 5
}
```

**What you'll see:**
- Single route displayed
- Route follows roads between all points
- Clear check-in/check-out markers
- Visit markers at client locations

### Scenario 2: Multiple Employees

```json
{
  "routes": [
    "John_2026-01-12",
    "Sarah_2026-01-12",
    "Mike_2026-01-12"
  ]
}
```

**What you'll see:**
- Route selector dropdown appears
- Can switch between employee routes
- Each route has independent playback
- Statistics update per route

### Scenario 3: Many Points (500+)

```json
{
  "routeId": "John_2026-01-12",
  "points": 500,
  "duration": "12 hours"
}
```

**What happens:**
- Automatic point filtering (noise reduction)
- Batching into groups of 100
- Progress indicator during processing
- Smooth road-snapped route result

## Common Use Cases

### Use Case 1: Verify Employee Was On-Site

**Business Requirement:**
> "Did John visit Client A between 10am-11am yesterday?"

**Steps:**
1. Open app: `http://localhost:3000/mapbox-map/`
2. Click "Load Data"
3. Select route: "John_2026-01-12"
4. Look for 🏢 visit marker at Client A location
5. Click marker to see timestamp
6. Verify time: 10:30 AM ✅

**Result**: Clear proof John was at Client A at the right time.

### Use Case 2: Calculate Distance Traveled

**Business Requirement:**
> "How far did Sarah travel during her shift?"

**Steps:**
1. Load Sarah's route
2. Look at Statistics panel
3. Check "Distance" value
4. Compare with company mileage policy

**Result**: Accurate distance (e.g., "45.2 km") based on actual roads taken.

### Use Case 3: Audit Daily Activity

**Business Requirement:**
> "Review all security guard activities for the day"

**Steps:**
1. Load data (all routes loaded)
2. Use route selector to switch between guards
3. For each guard:
   - Check check-in time (📍)
   - Verify visits (🏢)
   - Confirm check-out time (🏁)
   - Review route taken

**Result**: Complete audit trail for all employees.

### Use Case 4: Dispute Resolution

**Business Requirement:**
> "Employee claims they visited 5 locations, supervisor says only 3"

**Steps:**
1. Load employee's route
2. Count 🏢 visit markers on map
3. Use playback to see exact path
4. Check Statistics: "Visits: 5"
5. Click each visit marker for details

**Result**: Objective data resolves dispute (employee was correct).

## Advanced Features

### 1. Speed Control

**Use cases:**
- **0.5x**: Detailed inspection of suspicious activity
- **1x**: Normal review speed
- **2x**: Quick overview
- **5x**: Rapid scanning of long routes

### 2. Timeline Scrubbing

**Use cases:**
- Jump to specific time: "What was John doing at 2:30 PM?"
- Skip boring parts: Fast-forward through stationary periods
- Review specific segment: "Show me the route between visits"

### 3. Multi-Route Comparison

**Use cases:**
- Compare two employees: Who took more efficient route?
- Day-over-day: Did route improve with experience?
- Territory analysis: Which areas are covered?

### 4. Route Statistics

**Use cases:**
- **Total Points**: Data quality check (too few = GPS issues)
- **Distance**: Mileage reimbursement calculations
- **Check-ins**: Verify shift start times
- **Check-outs**: Confirm shift end times
- **Visits**: Count customer interactions

## Troubleshooting

### Issue: "API Key Required" banner shows

**Cause**: Access token not set or invalid

**Fix:**
1. Check `app.js` line 18
2. Ensure token starts with `pk.`
3. Copy token again from Mapbox account
4. Clear browser cache
5. Refresh page

### Issue: Straight lines instead of roads

**Cause**: Map Matching API not working

**Check:**
1. Browser console for errors (F12)
2. Network tab for API calls
3. Token permissions (Map Matching enabled?)
4. Points not too far apart (< 500m gaps)

**Fix:**
- Verify token at: https://account.mapbox.com/access-tokens/
- Check API usage statistics
- Ensure points have reasonable spacing

### Issue: No data showing

**Cause**: Backend not returning data

**Fix:**
```bash
# Test API directly
curl http://localhost:3000/api/locations

# Should return JSON with data array
# If empty, check backend/location_data.json
```

### Issue: Playback not working

**Cause**: No road-snapped path generated

**Check:**
1. Map Matching completed successfully?
2. Console shows any errors?
3. Route has at least 2 points?

**Fix:**
- Reload data
- Check console for API errors
- Try with sample data first

## Next Steps

### For Development

1. **Customize styling**: Edit map style in `app.js` line 64
2. **Add filters**: Date range, employee selection
3. **Export data**: Add CSV export for reports
4. **Integration**: Connect to your existing backend

### For Production

1. **Restrict token**: Add URL restrictions in Mapbox account
2. **Add authentication**: Protect dashboard access
3. **Database**: Move from JSON file to proper database
4. **Monitoring**: Set up usage alerts in Mapbox account
5. **Backup**: Regular data backups

### For Scale

1. **Caching**: Cache matched routes to reduce API calls
2. **Batch processing**: Process routes overnight
3. **Database optimization**: Index by routeId and timestamp
4. **CDN**: Serve static assets from CDN
5. **Load balancing**: If many concurrent users

## Resources

- **This MVP**: `/public/mapbox-map/`
- **Documentation**: `/MAPBOX_SETUP.md`
- **Comparison**: `/COMPARISON.md`
- **Mapbox Docs**: https://docs.mapbox.com/
- **Support**: https://support.mapbox.com/

## Success Metrics

After implementing Mapbox MVP, you should achieve:

- ✅ **100% road accuracy**: GPS points follow actual roads
- ✅ **< 5 second load time**: Fast route processing
- ✅ **99.9% reliability**: Consistent API performance
- ✅ **Zero confusion**: Clear visualization of routes
- ✅ **Business confidence**: Owners trust the data
- ✅ **Dispute resolution**: Objective evidence available

---

**You're ready!** 🎉

Start using the Mapbox MVP now and experience accurate, road-following GPS tracking.
