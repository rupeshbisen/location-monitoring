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
```

### Step 3: Open in Browser
Open your browser and go to:
```
http://localhost:3000
```

## 🎮 First Time Usage

1. **Load Sample Data**
   - Click the "Load Sample Data" button
   - This creates test location data with 2 routes

2. **View the Map** (Requires Google Maps API Key)
   - Click "Load Data" button
   - Map will display with markers and routes
   - Note: You'll see placeholder until you add your API key

3. **Try Playback Controls**
   - Click ▶️ **Play** to start animated route playback
   - Use the **Speed** slider to adjust animation speed
   - Click ⏸️ **Pause** to pause
   - Click ⏮️ **Reset** to start over

## 🗺️ Add Your Google Maps API Key

> **Important**: The map requires a Google Maps API key to function.

**Quick method:**
1. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Open `public/index.html`
3. Find this line (near the end):
   ```html
   src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"
   ```
4. Replace `YOUR_API_KEY` with your actual key
5. Refresh the browser

**Need detailed instructions?** See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)

## 📱 Test Mobile API Integration

Send location data from your mobile app (or test with cURL):

```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "my-route",
    "flag": "check_in",
    "address": "My Location"
  }'
```

Then refresh the web app and click "Load Data" to see your location!

## 🔧 Common Tasks

### View All Routes
```bash
curl http://localhost:3000/api/routes
```

### Get Locations for a Specific Route
```bash
curl "http://localhost:3000/api/locations?routeId=route1"
```

### Clear All Data
```bash
curl -X POST http://localhost:3000/api/clear
```

### Reload Sample Data
```bash
curl -X POST http://localhost:3000/api/sample-data
```

## 📱 Mobile Integration Examples

### Android (Kotlin)
```kotlin
val location = JSONObject().apply {
    put("lat", 28.6139)
    put("lng", 77.2090)
    put("routeId", "route1")
    put("flag", "check_in")
}
// Send POST to http://your-server:3000/api/location
```

### React Native
```javascript
fetch('http://your-server:3000/api/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        lat: 28.6139,
        lng: 77.2090,
        routeId: 'route1',
        flag: 'check_in'
    })
});
```

**More examples:** See [API_EXAMPLES.md](API_EXAMPLES.md)

## 🎯 Location Flags

Use these flags when sending location data:

| Flag | Usage | Example |
|------|-------|---------|
| `check_in` | Start of work/route | Beginning of day |
| `check_out` | End of work/route | End of day |
| `visit` | Client/site visit | Meeting location |
| `normal` | Regular tracking point | Movement tracking |

## 🖥️ UI Features

### Filter by Route
1. Select a route from the dropdown
2. Click "Load Data"
3. Map shows only that route

### Playback Controls
- **Play/Pause**: Start or stop animation
- **Reset**: Return to beginning
- **Speed**: Adjust from 0.5x to 5x
- **Timeline**: Drag to jump to any point

### Route Statistics
View real-time stats:
- Total Points
- Check-ins
- Check-outs
- Visits

## 📚 Next Steps

1. **Production Deployment**
   - Use a proper database (MongoDB, PostgreSQL)
   - Add authentication
   - Set up HTTPS

2. **Mobile App Development**
   - Integrate location tracking
   - Send data to API endpoints
   - Handle offline scenarios

3. **Customization**
   - Modify map styles in `public/app.js`
   - Update UI colors in `public/style.css`
   - Add new features as needed

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
- Check browser console for errors
- Ensure Maps JavaScript API is enabled

### No data showing
- Click "Load Sample Data" first
- Verify server is running
- Check browser console for API errors

## 📖 Full Documentation

- **Setup Guide**: [README.md](README.md)
- **API Reference**: [API_EXAMPLES.md](API_EXAMPLES.md)
- **Google Maps Setup**: [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)

## 💡 Tips

1. **Development**: Use sample data for testing
2. **Production**: Restrict Google Maps API key
3. **Mobile**: Handle offline scenarios
4. **Performance**: Use route filtering for large datasets

## 🎉 You're All Set!

Your location monitoring system is ready to use. Start tracking locations from your mobile app and visualize them on the web interface!

## 📞 Need Help?

- Check the documentation files
- Review API examples
- Test with sample data first
- Verify API key setup

Happy tracking! 🗺️📍
