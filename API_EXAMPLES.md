# API Usage Examples

This document provides detailed examples of how to use the Location Monitoring API.

## Table of Contents
1. [Available Endpoints](#available-endpoints)
2. [Testing with cURL](#testing-with-curl)
3. [Response Examples](#response-examples)
4. [Data Format](#data-format)
5. [JavaScript Integration](#javascript-integration)

## Available Endpoints

The Location Monitoring API currently provides the following endpoint:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | Retrieve all location data with optional date filters |

## API Reference

### GET /api/locations

Retrieve all location data with optional date filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 string | No | Filter locations from this date |
| `endDate` | ISO 8601 string | No | Filter locations until this date |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lat": 21.090064,
      "lng": 79.091735,
      "address": "",
      "routeId": "Sandeep",
      "timestamp": "2026-01-12T09:20:00.000Z",
      "flag": "normal"
    }
  ],
  "routes": {
    "Sandeep": {
      "waypoints": [{"lat": 21.090064, "lng": 79.091735}, ...],
      "totalPoints": 10,
      "totalDistance": "5.23",
      "startTime": "2026-01-12T09:20:00.000Z",
      "endTime": "2026-01-12T10:00:00.000Z",
      "duration": "0h 40m"
    }
  }
}
```

## Testing with cURL

### Get All Locations
```bash
curl http://localhost:3000/api/locations
```

### Get Locations with Pretty Print
```bash
curl http://localhost:3000/api/locations | jq
```

### Get Locations Within Date Range
```bash
curl "http://localhost:3000/api/locations?startDate=2026-01-01&endDate=2026-01-31"
```

### Get Locations Starting From a Date
```bash
curl "http://localhost:3000/api/locations?startDate=2026-01-12"
```

### Get Locations Until a Date
```bash
curl "http://localhost:3000/api/locations?endDate=2026-01-15"
```

## Response Examples

### Successful Response with Data
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lat": 21.090064351563512,
      "lng": 79.09173538332449,
      "address": "",
      "routeId": "Sandeep",
      "timestamp": "2026-01-12T09:20:00.000Z",
      "flag": "normal"
    },
    {
      "id": 2,
      "lat": 21.090941900209458,
      "lng": 79.09418992601712,
      "address": "",
      "routeId": "Sandeep",
      "timestamp": "2026-01-12T09:20:30.000Z",
      "flag": "normal"
    }
  ],
  "routes": {
    "Sandeep": {
      "waypoints": [
        {"lat": 21.090064351563512, "lng": 79.09173538332449},
        {"lat": 21.090941900209458, "lng": 79.09418992601712}
      ],
      "totalPoints": 2,
      "totalDistance": "0.35",
      "startTime": "2026-01-12T09:20:00.000Z",
      "endTime": "2026-01-12T09:20:30.000Z",
      "duration": "0h 0m"
    }
  }
}
```

### Empty Response (No Data)
```json
{
  "success": true,
  "data": [],
  "routes": {}
}
```

## Data Format

### Location Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique identifier (1-indexed) |
| `lat` | number | Latitude coordinate |
| `lng` | number | Longitude coordinate |
| `address` | string | Address description (may be empty) |
| `routeId` | string | Route identifier for grouping |
| `timestamp` | string | ISO 8601 timestamp |
| `flag` | string | Location type flag |

### Location Flags

| Flag | Description | Usage |
|------|-------------|-------|
| `check_in` | Start point | Beginning of a route or shift |
| `check_out` | End point | End of a route or shift |
| `visit` | Visit location | Client site or meeting location |
| `normal` | Regular point | Standard tracking point |

### Route Object Fields (in routes response)

| Field | Type | Description |
|-------|------|-------------|
| `waypoints` | array | Array of {lat, lng} coordinate objects |
| `totalPoints` | number | Number of location points in route |
| `totalDistance` | string | Total distance in kilometers |
| `startTime` | string | ISO 8601 timestamp of first point |
| `endTime` | string | ISO 8601 timestamp of last point |
| `duration` | string | Formatted duration (e.g., "2h 30m") |

## JavaScript Integration

### Fetch Locations from Browser
```javascript
async function loadLocations() {
  try {
    const response = await fetch('/api/locations');
    const result = await response.json();
    
    if (result.success) {
      console.log(`Loaded ${result.data.length} location points`);
      console.log('Routes:', Object.keys(result.routes));
      return result.data;
    } else {
      console.error('Failed to load locations');
      return [];
    }
  } catch (error) {
    console.error('Error loading locations:', error);
    return [];
  }
}
```

### Fetch Locations with Date Filter
```javascript
async function loadLocationsInRange(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const url = `/api/locations?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Example usage
const locations = await loadLocationsInRange('2026-01-01', '2026-01-31');
```

### Node.js Example
```javascript
const http = require('http');

function getLocations() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/locations', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Usage
getLocations()
  .then(result => {
    console.log('Total locations:', result.data.length);
    console.log('Routes:', Object.keys(result.routes));
  })
  .catch(console.error);
```

## Data Storage

Location data is stored in `backend/location_data.json`. The file uses this structure:

```json
{
  "status": "success",
  "data": [
    [21.090064, 79.091735, "", "-", "-", null, "RouteId", "2026-01-12T09:20:00.000Z", ".", "normal"],
    ...
  ],
  "total": 10,
  "showing": 10,
  "processing_time": "0ms",
  "stats": {
    "total_points": 10,
    "visit_points": 0,
    "start_time": "2026-01-12T09:20:00.000Z",
    "end_time": "2026-01-12T10:00:00.000Z"
  }
}
```

### Raw Data Array Format (per row)
| Index | Content | Example |
|-------|---------|---------|
| 0 | Latitude | `21.090064` |
| 1 | Longitude | `79.091735` |
| 2 | Address | `""` |
| 3 | Reserved | `"-"` |
| 4 | Reserved | `"-"` |
| 5 | Reserved | `null` |
| 6 | Route ID | `"Sandeep"` |
| 7 | Timestamp | `"2026-01-12T09:20:00.000Z"` |
| 8 | Reserved | `"."` |
| 9 | Flag | `"normal"` |

## Error Handling

### 404 Not Found
When accessing an unknown endpoint:
```json
{
  "success": false,
  "message": "Not found"
}
```

### CORS Support
The API includes CORS headers allowing cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Tips

1. **Date Format**: Use ISO 8601 format for date filters (e.g., `2026-01-15T00:00:00Z`)
2. **Sorting**: Locations are automatically sorted by timestamp (ascending)
3. **Route Info**: The `routes` object provides pre-calculated statistics per route
4. **Distance**: Distances are calculated using the Haversine formula (straight-line)

## Next Steps

To extend the API functionality, consider implementing:
1. `POST /api/location` - Submit new location data
2. `GET /api/routes` - List all route IDs
3. `DELETE /api/location/:id` - Delete a specific location
4. `POST /api/clear` - Clear all location data
5. Authentication and authorization
6. Database integration (MongoDB, PostgreSQL)
