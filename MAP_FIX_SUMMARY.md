# Racing Tactical Map - Fix Summary

## Problem Identified

The map was failing to load with two key errors:

1. **Incorrect Import Path**: `require('react-map-gl')` - react-map-gl v8 doesn't export from the root path
2. **Dynamic Import Issue**: `mapLib={import('maplibre-gl')}` - Metro bundler can't handle ES6 dynamic import() in JSX props

## Root Cause Analysis

From package.json inspection of react-map-gl:
```json
"exports": {
  "./mapbox": { ... },
  "./maplibre": { ... },
  "./mapbox-legacy": { ... }
}
```

There's NO default `"."` export! The library requires importing from specific subpaths.

## Fixes Implemented

### File: `components/racing-console/PreStartConsole/TacticalMapView.tsx`

**Change 1: Correct Import Path**
```typescript
// OLD (incorrect):
const mapgl = require('react-map-gl');

// NEW (correct):
const mapgl = require('react-map-gl/maplibre');
```

**Change 2: Pre-load MapLibre GL**
```typescript
// Import maplibre-gl first
maplibregl = require('maplibre-gl');

// Then import react-map-gl/maplibre
const mapgl = require('react-map-gl/maplibre');
```

**Change 3: Use Pre-loaded Library**
```typescript
// OLD (incorrect - dynamic import):
<Map mapLib={import('maplibre-gl')} ...>

// NEW (correct - pre-loaded reference):
<Map mapLib={maplibregl} ...>
```

## Full Updated Import Block

```typescript
// Import react-map-gl and maplibre-gl only on web
let Map: any = null;
let Marker: any = null;
let Source: any = null;
let Layer: any = null;
let maplibregl: any = null;

if (Platform.OS === 'web') {
  try {
    // Import maplibre-gl first
    maplibregl = require('maplibre-gl');

    // Import from react-map-gl/maplibre (correct export path for v8)
    const mapgl = require('react-map-gl/maplibre');

    Map = mapgl.Map;
    Marker = mapgl.Marker;
    Source = mapgl.Source;
    Layer = mapgl.Layer;
  } catch (e) {
    console.error('[TacticalMapView] Failed to load map libraries:', e);
  }
}
```

## Testing the Fix

### Steps to Verify:

1. **Clear Metro cache** (already done):
   ```bash
   npx expo start --clear
   ```

2. **Refresh browser** at http://localhost:8081/racing-console-live-demo

3. **Look for**:
   - Map tiles loading (satellite/terrain imagery)
   - Green dashed start line
   - Orange course marks
   - Tactical zone overlays with colors
   - Status cards showing wind/current/depth

### Expected Behavior:

- ✅ No "Cannot find module 'react-map-gl'" errors
- ✅ No "import.meta" syntax errors
- ✅ Map renders with MapLibre GL tiles
- ✅ Tactical zones display with proper colors
- ✅ Start line and course marks visible
- ✅ Wind/current indicators show on map

## Why This Fixes the Problem

1. **Correct Module Resolution**: `react-map-gl/maplibre` is an actual export path defined in the package.json
2. **No Dynamic Imports**: Pre-loading `maplibregl` at module level and passing the reference avoids Metro's limitation with `import()` syntax
3. **SSR Compatible**: The `Platform.OS === 'web'` check prevents server-side rendering from trying to load browser-only libraries

## Additional Notes

- The changes are minimal and focused - only fixing the import mechanism
- All other map features remain intact (layers, markers, overlays)
- The fix is compatible with Expo's web platform requirements
- No new dependencies needed - uses existing installed packages

## Status

✅ **Fixes Implemented**
⏳ **Waiting for Metro Bundle Rebuild**
🔄 **User Action Required**: Refresh browser to see the working map

---

**Last Updated**: 2025-11-03
**File Modified**: `components/racing-console/PreStartConsole/TacticalMapView.tsx`
