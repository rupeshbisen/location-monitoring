# 📡 API Examples - OpenLayers MVP

Complete examples for integrating with the Location Monitoring API.

## Base URL
```
http://localhost:3000/api
```

## 1. Submit Location Data

### Basic Location Point
```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "route1",
    "flag": "normal",
    "address": "Delhi, India"
  }'
```

### Check-in Location
```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "route1",
    "flag": "check_in",
    "address": "Office - Morning Check-in",
    "timestamp": "2024-02-03T08:00:00Z"
  }'
```

### Visit Location
```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.7041,
    "lng": 77.1025,
    "routeId": "route1",
    "flag": "visit",
    "address": "Client Site - ABC Company",
    "timestamp": "2024-02-03T10:30:00Z"
  }'
```

### Check-out Location
```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "route1",
    "flag": "check_out",
    "address": "Office - Evening Check-out",
    "timestamp": "2024-02-03T18:00:00Z"
  }'
```

## 2. Get All Locations

### Get All Locations
```bash
curl http://localhost:3000/api/locations
```

### Filter by Route
```bash
curl "http://localhost:3000/api/locations?routeId=route1"
```

### Filter by Date Range
```bash
curl "http://localhost:3000/api/locations?startDate=2024-02-01&endDate=2024-02-28"
```

### Combined Filters
```bash
curl "http://localhost:3000/api/locations?routeId=route1&startDate=2024-02-01&endDate=2024-02-28"
```

## 3. Get Routes

### List All Routes
```bash
curl http://localhost:3000/api/routes
```

Response:
```json
{
  "success": true,
  "data": ["route1", "route2", "Sandeep", "Rupesh"]
}
```

## 4. Sample Data

### Load Sample Data
```bash
curl -X POST http://localhost:3000/api/sample-data
```

Response:
```json
{
  "success": true,
  "message": "Sample data added",
  "count": 40
}
```

## 5. Clear Data

### Clear All Location Data
```bash
curl -X POST http://localhost:3000/api/clear
```

Response:
```json
{
  "success": true,
  "message": "All data cleared"
}
```

## JavaScript/Fetch Examples

### Submit Location
```javascript
async function submitLocation(lat, lng, routeId, flag, address) {
  const response = await fetch('http://localhost:3000/api/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lat,
      lng,
      routeId,
      flag,
      address,
      timestamp: new Date().toISOString()
    })
  });
  
  const result = await response.json();
  console.log(result);
  return result;
}

// Usage
submitLocation(28.6139, 77.2090, 'route1', 'check_in', 'Start Point');
```

### Get Locations
```javascript
async function getLocations(routeId = null) {
  let url = 'http://localhost:3000/api/locations';
  if (routeId) {
    url += `?routeId=${routeId}`;
  }
  
  const response = await fetch(url);
  const result = await response.json();
  return result.data;
}

// Usage
const locations = await getLocations('route1');
console.log(locations);
```

### Get Routes
```javascript
async function getRoutes() {
  const response = await fetch('http://localhost:3000/api/routes');
  const result = await response.json();
  return result.data;
}

// Usage
const routes = await getRoutes();
console.log(routes);
```

## Android/Kotlin Example

```kotlin
import okhttp3.*
import org.json.JSONObject

fun submitLocation(lat: Double, lng: Double, routeId: String, flag: String, address: String) {
    val client = OkHttpClient()
    
    val json = JSONObject().apply {
        put("lat", lat)
        put("lng", lng)
        put("routeId", routeId)
        put("flag", flag)
        put("address", address)
        put("timestamp", System.currentTimeMillis())
    }
    
    val body = RequestBody.create(
        MediaType.parse("application/json"),
        json.toString()
    )
    
    val request = Request.Builder()
        .url("http://your-server:3000/api/location")
        .post(body)
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            println("Failed: ${e.message}")
        }
        
        override fun onResponse(call: Call, response: Response) {
            println("Success: ${response.body()?.string()}")
        }
    })
}

// Usage
submitLocation(28.6139, 77.2090, "route1", "check_in", "Office")
```

## React Native Example

```javascript
import React, { useState } from 'react';
import { Button } from 'react-native';

const LocationService = {
  baseUrl: 'http://your-server:3000/api',
  
  async submitLocation(lat, lng, routeId, flag, address) {
    try {
      const response = await fetch(`${this.baseUrl}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat,
          lng,
          routeId,
          flag,
          address,
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting location:', error);
      throw error;
    }
  },
  
  async getLocations(routeId = null) {
    try {
      let url = `${this.baseUrl}/locations`;
      if (routeId) {
        url += `?routeId=${routeId}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }
};

// Usage in Component
function App() {
  const [location, setLocation] = useState(null);
  
  const trackLocation = async () => {
    // Get current position (using react-native-geolocation)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await LocationService.submitLocation(
          position.coords.latitude,
          position.coords.longitude,
          'route1',
          'normal',
          'Current Location'
        );
        console.log('Location tracked:', result);
      },
      (error) => console.error('Error getting location:', error)
    );
  };
  
  return <Button title="Track Location" onPress={trackLocation} />;
}
```

## Python Example

```python
import requests
import json
from datetime import datetime

def submit_location(lat, lng, route_id, flag, address):
    """Submit a location point to the API"""
    url = "http://localhost:3000/api/location"
    
    data = {
        "lat": lat,
        "lng": lng,
        "routeId": route_id,
        "flag": flag,
        "address": address,
        "timestamp": datetime.now().isoformat()
    }
    
    response = requests.post(url, json=data)
    return response.json()

def get_locations(route_id=None):
    """Get locations, optionally filtered by route"""
    url = "http://localhost:3000/api/locations"
    
    params = {}
    if route_id:
        params['routeId'] = route_id
    
    response = requests.get(url, params=params)
    return response.json()

# Usage
result = submit_location(28.6139, 77.2090, "route1", "check_in", "Office")
print(result)

locations = get_locations("route1")
print(f"Found {len(locations['data'])} locations")
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Location saved",
  "data": {
    "id": 1234567890.123,
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "route1",
    "flag": "check_in",
    "address": "Office",
    "timestamp": "2024-02-03T08:00:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid data format"
}
```

## Notes

- All timestamps should be in ISO 8601 format
- Valid flags: `check_in`, `check_out`, `visit`, `normal`
- Latitude range: -90 to 90
- Longitude range: -180 to 180
- RouteId can be any string identifier
