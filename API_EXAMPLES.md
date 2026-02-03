# API Usage Examples

This document provides detailed examples of how to use the Location Monitoring API.

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Mobile App Integration](#mobile-app-integration)
3. [Testing with cURL](#testing-with-curl)
4. [Response Examples](#response-examples)

## Basic Usage

### 1. Start the Server
```bash
npm start
```

The server will start on port 3000 by default.

### 2. Load Sample Data (For Testing)
```bash
curl -X POST http://localhost:3000/api/sample-data
```

Response:
```json
{
  "success": true,
  "message": "Sample data added",
  "count": 12
}
```

### 3. Retrieve All Locations
```bash
curl http://localhost:3000/api/locations
```

### 4. Filter by Route
```bash
curl "http://localhost:3000/api/locations?routeId=route1"
```

### 5. Get Available Routes
```bash
curl http://localhost:3000/api/routes
```

Response:
```json
{
  "success": true,
  "data": ["route1", "route2"]
}
```

## Mobile App Integration

### Android (Java)

```java
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class LocationTracker {
    
    private static final String API_URL = "http://your-server:3000/api/location";
    
    public void sendLocation(double lat, double lng, String flag, String routeId) {
        try {
            URL url = new URL(API_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            JSONObject location = new JSONObject();
            location.put("lat", lat);
            location.put("lng", lng);
            location.put("flag", flag);
            location.put("routeId", routeId);
            location.put("address", "Current Location");
            location.put("timestamp", System.currentTimeMillis());
            
            OutputStream os = conn.getOutputStream();
            os.write(location.toString().getBytes());
            os.flush();
            os.close();
            
            int responseCode = conn.getResponseCode();
            System.out.println("Response Code: " + responseCode);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Android (Kotlin)

```kotlin
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

class LocationTracker {
    
    private val client = OkHttpClient()
    private val apiUrl = "http://your-server:3000/api/location"
    
    fun sendLocation(lat: Double, lng: Double, flag: String, routeId: String) {
        val json = JSONObject().apply {
            put("lat", lat)
            put("lng", lng)
            put("flag", flag)
            put("routeId", routeId)
            put("address", "Current Location")
            put("timestamp", System.currentTimeMillis())
        }
        
        val body = RequestBody.create(
            MediaType.parse("application/json"),
            json.toString()
        )
        
        val request = Request.Builder()
            .url(apiUrl)
            .post(body)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
            }
            
            override fun onResponse(call: Call, response: Response) {
                println("Response: ${response.body()?.string()}")
            }
        })
    }
}
```

### React Native

```javascript
const API_URL = 'http://your-server:3000/api/location';

export const sendLocation = async (lat, lng, flag, routeId) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        flag: flag,
        routeId: routeId,
        address: 'Current Location',
        timestamp: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    console.log('Location sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending location:', error);
    throw error;
  }
};

// Usage example
import * as Location from 'expo-location';

const trackLocation = async () => {
  const { coords } = await Location.getCurrentPositionAsync();
  await sendLocation(
    coords.latitude,
    coords.longitude,
    'normal',
    'route1'
  );
};
```

### Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class LocationTracker {
  static const String apiUrl = 'http://your-server:3000/api/location';
  
  Future<void> sendLocation(
    double lat,
    double lng,
    String flag,
    String routeId
  ) async {
    final response = await http.post(
      Uri.parse(apiUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'lat': lat,
        'lng': lng,
        'flag': flag,
        'routeId': routeId,
        'address': 'Current Location',
        'timestamp': DateTime.now().toIso8601String(),
      }),
    );
    
    if (response.statusCode == 201) {
      print('Location sent successfully');
      print(response.body);
    } else {
      print('Failed to send location: ${response.statusCode}');
    }
  }
}
```

## Testing with cURL

### Submit a Check-in Location
```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "route1",
    "flag": "check_in",
    "address": "Office - Start of Day"
  }'
```

### Submit a Visit Location
```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6159,
    "lng": 77.2110,
    "routeId": "route1",
    "flag": "visit",
    "address": "Client Site - ABC Company"
  }'
```

### Submit a Check-out Location
```bash
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6199,
    "lng": 77.2150,
    "routeId": "route1",
    "flag": "check_out",
    "address": "Office - End of Day"
  }'
```

### Get Locations for a Specific Route
```bash
curl "http://localhost:3000/api/locations?routeId=route1"
```

### Get Locations Within Date Range
```bash
curl "http://localhost:3000/api/locations?startDate=2024-02-01&endDate=2024-02-28"
```

### Clear All Data
```bash
curl -X POST http://localhost:3000/api/clear
```

## Response Examples

### Successful Location Submission
```json
{
  "success": true,
  "message": "Location saved",
  "data": {
    "lat": 28.6139,
    "lng": 77.2090,
    "routeId": "route1",
    "flag": "check_in",
    "address": "Office - Start of Day",
    "timestamp": "2024-02-03T08:00:00.000Z",
    "id": 1707123456789.123
  }
}
```

### Get Locations Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lat": 28.6139,
      "lng": 77.2090,
      "timestamp": "2024-02-03T08:00:00Z",
      "routeId": "route1",
      "flag": "check_in",
      "address": "Start Point - Delhi"
    },
    {
      "id": 2,
      "lat": 28.6149,
      "lng": 77.2100,
      "timestamp": "2024-02-03T08:05:00Z",
      "routeId": "route1",
      "flag": "normal",
      "address": "Moving through Delhi"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid data format"
}
```

## Location Flags

The system supports the following flag types:

- **check_in**: User checked in at the start of a route/shift
- **check_out**: User checked out at the end of a route/shift
- **visit**: User visited a client location or site
- **normal**: Regular tracking point during movement

## Best Practices

1. **Use Meaningful Route IDs**: Use date-based or session-based route IDs
   ```
   routeId: "2024-02-03-morning"
   routeId: "user123-2024-02-03"
   ```

2. **Include Addresses**: When possible, include human-readable addresses
   ```json
   "address": "123 Main St, Delhi"
   ```

3. **Send Timestamps**: Always include timestamps with location data
   ```json
   "timestamp": "2024-02-03T08:00:00Z"
   ```

4. **Handle Errors**: Implement proper error handling in your mobile app
   ```javascript
   try {
     await sendLocation(lat, lng, flag, routeId);
   } catch (error) {
     // Store locally and retry later
     storeOffline(locationData);
   }
   ```

5. **Batch Updates**: For offline scenarios, store locations locally and send in batches when online

## Next Steps

1. Implement authentication for production use
2. Add user management
3. Integrate with a database (MongoDB, PostgreSQL)
4. Add real-time updates using WebSockets
5. Implement offline support in mobile apps
