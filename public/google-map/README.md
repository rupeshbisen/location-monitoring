# Google Maps API Setup Guide

This guide will help you set up a Google Maps API key for the Location Monitoring application.

## Prerequisites
- A Google Cloud Platform account (free tier available)
- A credit card (required for verification, but free tier includes $200 monthly credit)

## Step-by-Step Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Location Monitoring")
5. Click "Create"

### 2. Enable Required APIs

You need to enable **two APIs** for full functionality:

#### Maps JavaScript API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Maps JavaScript API"
3. Click on "Maps JavaScript API"
4. Click "Enable"

#### Directions API (Required for road-following routes)
1. Go back to "APIs & Services" > "Library"
2. Search for "Directions API"
3. Click on "Directions API"
4. Click "Enable"

### 3. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key that appears
4. (Recommended) Click "Restrict Key" to add restrictions

### 4. Configure API Key Restrictions (Recommended)

#### Application Restrictions
For development:
- Select "HTTP referrers (web sites)"
- Add: `http://localhost:3000/*`
- Add: `http://127.0.0.1:3000/*`

For production:
- Add your production domain: `https://yourdomain.com/*`

#### API Restrictions
- Select "Restrict key"
- Check "Maps JavaScript API"
- Check "Directions API"
- Click "Save"

### 5. Update Your Application

Open `public/index.html` and find the Google Maps script tag near the end of the file:

```html
<script async defer
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=geometry">
</script>
```

Replace `YOUR_API_KEY` with your actual API key:
```html
<script async defer
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA...your-key-here&callback=initMap&libraries=geometry">
</script>
```

> **Note**: The `libraries=geometry` parameter is required for route calculations.

### 6. Test Your Setup

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000
   ```

3. Click "Load Data" to fetch and display location data
4. You should see the map with location markers and road-following routes

## Pricing Information

### Free Tier
Google Maps Platform includes:
- $200 monthly credit (covers ~28,000 map loads)
- No charge if you stay within the free tier

### Maps JavaScript API Pricing
- $7 per 1,000 map loads (after free credit)
- First 28,500 map loads are free each month

### Cost Optimization Tips

1. **Enable billing alerts** in Google Cloud Console
2. **Set usage quotas** to prevent unexpected charges
3. **Restrict your API key** to prevent unauthorized use
4. **Use map efficiently**:
   - Don't reload the map unnecessarily
   - Consider caching map tiles
   - Use map clustering for many markers

## Troubleshooting

### Map Not Loading

**Error**: "This page can't load Google Maps correctly"
- **Cause**: Invalid or missing API key
- **Solution**: Verify your API key is correct and Maps JavaScript API is enabled

**Error**: "RefererNotAllowedMapError"
- **Cause**: Your domain is not in the allowed referrers list
- **Solution**: Add your domain to API key restrictions

**Error**: "ApiNotActivatedMapError"
- **Cause**: Required API is not enabled
- **Solution**: Enable both Maps JavaScript API AND Directions API in Google Cloud Console

### Billing Issues

**Error**: Billing account required
- **Cause**: API requires billing to be enabled
- **Solution**: Add a billing account (credit card) to your project

### Testing Without API Key

For development/testing without setting up Google Maps API:

1. You can test the backend API using cURL:
   ```bash
   # Get all locations
   curl http://localhost:3000/api/locations
   
   # Get locations with date filter
   curl "http://localhost:3000/api/locations?startDate=2026-01-01&endDate=2026-01-31"
   ```

2. Test the API endpoints directly without the frontend

3. Use browser developer tools to test API calls

## Alternative: Development Mode

For development purposes, you can use Google Maps without restrictions temporarily:

1. Create an unrestricted API key (not recommended for production)
2. Use it only in development
3. Delete the key when done
4. Create a properly restricted key for production

## Security Best Practices

1. **Never commit API keys to git**
   - Add to `.gitignore`
   - Use environment variables

2. **Use different keys for different environments**
   - Development key: Restricted to localhost
   - Production key: Restricted to your domain

3. **Monitor API usage**
   - Set up alerts in Google Cloud Console
   - Review usage regularly

4. **Rotate keys periodically**
   - Create new keys every few months
   - Delete old unused keys

## Using Environment Variables (Advanced)

To avoid hardcoding the API key in HTML:

1. Create a `.env` file:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Update `backend/server.js` to inject the key:
   ```javascript
   // Serve index.html with API key injected
   if (pathname === '/' || pathname === '/index.html') {
     fs.readFile(filePath, 'utf8', (error, content) => {
       if (!error) {
         const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';
         content = content.replace('YOUR_API_KEY', apiKey);
         res.writeHead(200, { 'Content-Type': 'text/html' });
         res.end(content, 'utf-8');
       }
     });
     return;
   }
   ```

3. Add `.env` to `.gitignore`

## Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Maps JavaScript API Guide](https://developers.google.com/maps/documentation/javascript/tutorial)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify API key restrictions
3. Check Google Cloud Console for API usage
4. Review the [Google Maps Platform Support](https://developers.google.com/maps/support)
