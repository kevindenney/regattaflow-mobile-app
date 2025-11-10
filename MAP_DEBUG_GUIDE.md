# Map Debugging Guide - Console Logging

## What I've Added

Comprehensive console logging with emojis to track the map loading process:

### Module-Level Logs (run once when module loads):

```
🗺️ Module init - Platform.OS
📦 Loading maplibre-gl...
✅ maplibre-gl loaded
📦 Loading react-map-gl/maplibre...
✅ react-map-gl/maplibre loaded
🎯 Components assigned
```

OR

```
❌ Failed to load map libraries
```

### Component Render Logs (run every time component renders):

```
🎨 Component render START
📊 Store data
🌍 ViewState
✅ Map component available - preparing to render map
🗺️ About to render Map component with
```

OR

```
❌ Map component is NULL - cannot render map!
⚠️ Not web - showing mobile fallback
```

## Steps to Debug

### 1. **HARD REFRESH** the browser:
   - **Mac**: Cmd + Shift + R
   - **Windows/Linux**: Ctrl + Shift + F5
   - This clears the cached JavaScript bundle

### 2. Open Browser DevTools Console:
   - **Mac**: Cmd + Option + J
   - **Windows/Linux**: Ctrl + Shift + J
   - **Or**: Right-click → Inspect → Console tab

### 3. Filter logs by typing: `TacticalMapView`

## What to Look For

### ✅ **SUCCESS Pattern** (map should load):

```
[TacticalMapView] 🗺️ Module init - Platform.OS: web
[TacticalMapView] 📦 Loading maplibre-gl...
[TacticalMapView] ✅ maplibre-gl loaded: object [...]
[TacticalMapView] 📦 Loading react-map-gl/maplibre...
[TacticalMapView] ✅ react-map-gl/maplibre loaded: object [...]
[TacticalMapView] 🎯 Components assigned: { Map: true, Marker: true, ... }
[TacticalMapView] 🎨 Component render START ...
[TacticalMapView] 📊 Store data: ...
[TacticalMapView] ✅ Map component available - preparing to render map
[TacticalMapView] 🗺️ About to render Map component with: ...
```

### ❌ **FAILURE Patterns**:

**Pattern 1: Module Not Found**
```
[TacticalMapView] 📦 Loading react-map-gl/maplibre...
[TacticalMapView] ❌ Failed to load map libraries: Error: Cannot find module 'react-map-gl/maplibre'
```
→ **Cause**: Metro hasn't rebuilt yet OR incorrect import path
→ **Fix**: Wait for bundle or check import

**Pattern 2: Map Component Null**
```
[TacticalMapView] 🎯 Components assigned: { Map: false, ... }
[TacticalMapView] ❌ Map component is NULL - cannot render map!
```
→ **Cause**: react-map-gl exports are wrong
→ **Fix**: Check export structure

**Pattern 3: import.meta Error**
```
Uncaught SyntaxError: Cannot use 'import.meta' outside a module
```
→ **Cause**: Dynamic import() still in code OR old cached bundle
→ **Fix**: Hard refresh browser

**Pattern 4: Platform Not Web**
```
[TacticalMapView] ⚠️ Not web - showing mobile fallback
```
→ **Cause**: Running on mobile or Platform.OS detection failed
→ **Fix**: Ensure running in web browser

## Next Steps Based on Console Output

### If you see SUCCESS pattern but no map:
- Check CSS/styling
- Check if map is rendering but hidden
- Look for MapLibre GL errors
- Check network tab for tile loading

### If you see FAILURE pattern:
1. Copy the **exact error message**
2. Copy the **full console output** for TacticalMapView logs
3. Share with me so I can fix the specific issue

### If you see NO logs at all:
- Bundle hasn't loaded yet - wait 30 seconds
- Browser cache issue - try incognito mode
- Wrong page - ensure you're at `/racing-console-live-demo`

## Bundle Status

The Metro bundle completed at ~4:08 PM with:
```
Web Bundled 31469ms index.js (5716 modules)
```

This means the NEW code with fixes IS bundled and ready.

**You just need to HARD REFRESH the browser to get it!**

---

## Quick Checklist

- [ ] Metro bundle completed (✅ confirmed above)
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Open DevTools console (Cmd+Option+J)
- [ ] Look for `[TacticalMapView]` logs
- [ ] Share console output with me

The logs will tell us EXACTLY where the problem is!
