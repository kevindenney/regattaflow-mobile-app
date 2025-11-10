# GEBCO Bathymetry Verification Guide

## ✅ What's Already Verified

1. **✓ Network Access**: Your machine can reach www.gebco.net (HTTP 404 is expected without WMS parameters)
2. **✓ geotiff Package**: Installed and ready to decode GeoTIFF data
3. **✓ App Running**: http://localhost:8081 is live
4. **✓ Race Data**: Found events in Supabase to navigate to

## 🔍 Manual Verification Steps

Since bathymetry logs appear in the **browser console** (not server logs), follow these steps:

### Step 1: Open the App in Chrome
```bash
open -a "Google Chrome" "http://localhost:8081/races"
```

### Step 2: Open Chrome DevTools
- Press `Cmd+Option+I` (Mac) or `F12` (Windows/Linux)
- Click the **Console** tab

### Step 3: Navigate to a Race with a Map
Click on any race that shows a map with environmental layers

### Step 4: Toggle the Depth Layer
Look for a "Depth" or "Bathymetry" layer toggle and turn it ON

### Step 5: Check Console Output

**✅ SUCCESS - Real GEBCO Data:**
```javascript
Adding bathymetry deck layers {
  sampleCount: 1024,
  minDepth: 5,
  maxDepth: 45,
  synthetic: false    // ← FALSE means real data!
}
```

**⚠️ FALLBACK - Synthetic Data:**
```javascript
Adding bathymetry deck layers {
  sampleCount: 256,
  minDepth: 0,
  maxDepth: 50,
  synthetic: true     // ← TRUE means still using fallback
}
```

### Step 6: Look for Error Messages

If `synthetic: true`, check for these errors:
- `GEBCO WMS request failed` - WMS call failed
- `Network unavailable for GEBCO WMS` - network blocked
- `Failed to decode GEBCO GeoTIFF` - decoding issue
- `geotiff module not available` - package issue

## 📍 Where to Look

- **Log location**: `components/race-strategy/TacticalRaceMap.tsx:675`
- **Data fetch**: `services/BathymetricTidalService.ts:948-1024`
- **GEBCO URL**: https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv

## 🐛 Troubleshooting

### If you see "synthetic: true"

1. Check the Network tab in DevTools for failed GEBCO requests
2. Verify the request URL matches the WMS format
3. Check for CORS errors
4. Verify the response is actually a GeoTIFF (not an error page)

### If you don't see ANY bathymetry logs

1. Make sure you're on a page with a map component
2. Ensure the Depth layer toggle is enabled
3. Check that the map has loaded completely
4. Look for the TacticalRaceMap component being used

## 🎯 Test URLs

Based on Supabase data, try these race events:
- Event ID: `4b061ebc-2b58-4a8c-abd4-ebf1b7598f2c` (Event: "e", Date: 2025-12-24)
- Event ID: `f3d5cae2-4f60-4151-b038-3f62b70a8d55` (Event: "b - Event 1", Date: 2025-12-10)

## 📊 What to Report

Please share:
1. The console log showing the "Adding bathymetry deck layers" message
2. Whether `synthetic` is `true` or `false`
3. Any error messages
4. A screenshot of the Network tab showing GEBCO requests (if any)

---

Once you verify the output, we can:
- ✅ If working: Celebrate and move on to tweaking contour intervals
- ⚠️ If fallback: Debug the specific issue preventing real data fetch
