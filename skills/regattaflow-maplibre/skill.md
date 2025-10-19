# RegattaFlow MapLibre GL JS Skill

## Overview

This skill teaches AI agents the RegattaFlow MapLibre GL JS patterns for 3D race course visualization and marine mapping. It covers sailing-specific visualization patterns, GeoJSON generation, 3D rendering techniques, and performance optimization for web and mobile platforms.

## What This Skill Covers

1. **Map Initialization** - Marine-optimized MapLibre setup with nautical styles
2. **3D Race Course Visualization** - Rendering race marks, course lines, and start/finish lines
3. **GeoJSON Generation** - Creating FeatureCollections for marks, courses, and tactical layers
4. **Environmental Layers** - Wind vectors, current flow, wave patterns, tide visualization
5. **Tactical Layers** - Laylines, start strategy, racing lines, wind shifts
6. **Camera Control** - 3D perspective, animations, and viewport management
7. **Performance Optimization** - Device detection, layer management, rendering optimization

## Core Patterns

### Pattern 1: Map Initialization (Web-Only)

MapLibre GL JS is web-only. For universal React Native apps, use dynamic imports and platform detection.

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export function RaceMapComponent() {
  const mapRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (isWeb) {
      initializeMap();
    }
  }, []);

  const initializeMap = async () => {
    // Dynamic import for web-only
    const maplibregl = await import('maplibre-gl');

    const map = new maplibregl.Map({
      container: mapRef.current!,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles'
          }
        ]
      },
      center: [lng, lat],  // Venue coordinates
      zoom: 12,
      pitch: 45,  // 3D perspective (0-85 degrees)
      bearing: 0  // Map rotation (0-360 degrees)
    });

    map.on('load', () => {
      setIsMapLoaded(true);
      addRaceCourse(map);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {isWeb ? (
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <MobileFallback />  // Native placeholder or react-native-maplibre
      )}
    </View>
  );
}
```

**Key Points:**
- Use `Platform.OS === 'web'` to detect web platform
- Dynamic import prevents bundling MapLibre in mobile builds
- pitch: 45° creates 3D perspective for race courses
- bearing controls map rotation (useful for wind-oriented courses)

### Pattern 2: Race Marks as 3D Extrusions

Render race marks as 3D cylinders/extrusions for professional OnX Maps-style visualization.

```typescript
async function addRaceMarks(map: any, marks: RaceMark[]) {
  // Create GeoJSON FeatureCollection
  const markFeatures = marks.map(mark => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [mark.lng, mark.lat, mark.elevation || 0]
    },
    properties: {
      id: mark.id,
      name: mark.name,
      type: mark.type,  // 'start' | 'windward' | 'leeward' | 'gate' | 'finish'
      description: mark.description
    }
  }));

  // Add source
  map.addSource('race-marks', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: markFeatures
    }
  });

  // Add 3D extrusion layer
  map.addLayer({
    id: 'race-marks-3d',
    type: 'fill-extrusion',  // 3D cylinders
    source: 'race-marks',
    paint: {
      // Color by mark type
      'fill-extrusion-color': [
        'case',
        ['==', ['get', 'type'], 'start'], '#22c55e',      // Green
        ['==', ['get', 'type'], 'finish'], '#ef4444',     // Red
        ['==', ['get', 'type'], 'windward'], '#0ea5e9',   // Blue
        ['==', ['get', 'type'], 'leeward'], '#f59e0b',    // Orange
        '#8b5cf6'  // Purple for gates
      ],
      'fill-extrusion-height': 50,  // 50 meters tall
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.8
    }
  });

  // Add mark labels
  map.addLayer({
    id: 'race-marks-labels',
    type: 'symbol',
    source: 'race-marks',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 14,
      'text-offset': [0, -3],  // Position above mark
      'text-anchor': 'bottom'
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 2  // Outline for readability
    }
  });
}
```

**Key Points:**
- Use `fill-extrusion` type for 3D visualization
- `['case', ...]` expressions for conditional styling
- `'text-halo-*'` properties ensure labels are readable over any background
- Height in meters (50m is good visibility without being too tall)

### Pattern 3: Course Lines (Dashed Lines Between Marks)

```typescript
async function addCourseLines(map: any, marks: RaceMark[]) {
  const coordinates = marks.map(mark => [mark.lng, mark.lat]);

  map.addSource('course-lines', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      },
      properties: {}
    }
  });

  map.addLayer({
    id: 'course-lines',
    type: 'line',
    source: 'course-lines',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#0ea5e9',
      'line-width': 3,
      'line-opacity': 0.8,
      'line-dasharray': [2, 2]  // Dashed line (2px dash, 2px gap)
    }
  });
}
```

**Key Points:**
- LineString geometry connects marks in order
- `line-dasharray` creates dashed lines for course outline
- `line-join: 'round'` smooths corners at marks

### Pattern 4: Start/Finish Lines

```typescript
async function addStartFinishLines(map: any, marks: RaceMark[]) {
  const startMark = marks.find(m => m.type === 'start');
  if (!startMark) return;

  // Create perpendicular line (100m wide)
  const offsetDegrees = 100 / 111320;  // Convert meters to degrees
  const startLineCoords = [
    [startMark.lng - offsetDegrees, startMark.lat],
    [startMark.lng + offsetDegrees, startMark.lat]
  ];

  map.addSource('start-line', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: startLineCoords
      },
      properties: { type: 'start' }
    }
  });

  map.addLayer({
    id: 'start-line',
    type: 'line',
    source: 'start-line',
    paint: {
      'line-color': '#22c55e',  // Green for start
      'line-width': 5,
      'line-opacity': 0.9
    }
  });

  // Repeat for finish line in red
}
```

**Key Points:**
- 1 degree ≈ 111.32 km at equator, use for quick conversions
- Start lines should be perpendicular to wind direction (simplified here)
- Bright, solid lines for high visibility

### Pattern 5: Wind Vectors (Environmental Layer)

```typescript
async function addWindVectors(map: any, windData: { speed: number; direction: number }) {
  const center = map.getCenter();

  // Create grid of wind vectors
  const vectors = [];
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      vectors.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [center.lng + i * 0.005, center.lat + j * 0.005]
        },
        properties: {
          speed: windData.speed,
          direction: windData.direction  // Degrees from north
        }
      });
    }
  }

  map.addSource('wind-vectors', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: vectors
    }
  });

  map.addLayer({
    id: 'wind-arrows',
    type: 'symbol',
    source: 'wind-vectors',
    layout: {
      'icon-image': 'wind-arrow',  // Load custom arrow icon first
      'icon-size': 0.8,
      'icon-rotate': ['get', 'direction'],  // Rotate based on wind direction
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': 0.7
    }
  });
}
```

**Key Points:**
- Create evenly-spaced grid of points for wind field
- Use `icon-rotate` to point arrows in wind direction
- `icon-allow-overlap` ensures all arrows render (even when dense)

### Pattern 6: Camera Control and Animations

```typescript
// Fit map to course bounds
function fitToCourse(map: any, marks: RaceMark[]) {
  const maplibregl = require('maplibre-gl');
  const bounds = new maplibregl.LngLatBounds();

  marks.forEach(mark => bounds.extend([mark.lng, mark.lat]));

  map.fitBounds(bounds, {
    padding: 100,     // 100px padding around course
    duration: 1000,   // 1 second animation
    pitch: 45,        // Maintain 3D perspective
    bearing: 0
  });
}

// Fly to specific mark with animation
function flyToMark(map: any, mark: RaceMark) {
  map.flyTo({
    center: [mark.lng, mark.lat],
    zoom: 15,
    pitch: 60,
    bearing: 0,
    duration: 2000,  // 2 second flight
    speed: 1.2,      // Flight speed (0.25-2)
    curve: 1.42,     // Flight curve (1-2.5)
    easing: (t) => t  // Linear easing
  });
}

// Smooth camera transition
function smoothTransition(map: any, camera: CameraState) {
  map.easeTo({
    center: camera.center,
    zoom: camera.zoom,
    pitch: camera.pitch,
    bearing: camera.bearing,
    duration: 1000,
    easing: (t) => t * (2 - t)  // Ease-out quadratic
  });
}
```

**Key Points:**
- `fitBounds()` - Automatic viewport for full course
- `flyTo()` - Cinematic camera movement
- `easeTo()` - Smooth transitions without curves
- Always maintain pitch for 3D effect

### Pattern 7: Layer Visibility Toggle

```typescript
function toggleLayer(map: any, layerId: string, visible: boolean) {
  try {
    map.setLayoutProperty(
      layerId,
      'visibility',
      visible ? 'visible' : 'none'
    );
  } catch (error) {
    console.error(`Layer ${layerId} not found`);
  }
}

// Toggle multiple related layers
function toggleLayerGroup(map: any, layerIds: string[], visible: boolean) {
  layerIds.forEach(id => toggleLayer(map, id, visible));
}

// Example usage: Toggle wind layer
function toggleWindLayer(map: any, enabled: boolean) {
  toggleLayerGroup(map, ['wind-vectors', 'wind-arrows', 'wind-legend'], enabled);
}
```

**Key Points:**
- Use `setLayoutProperty` for visibility (not `setPaintProperty`)
- Group related layers for atomic toggling
- Wrap in try-catch (layer may not exist if not loaded yet)

### Pattern 8: GeoJSON FeatureCollection Structure

Standard structure for all map data in RegattaFlow:

```typescript
interface RaceMarkFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number, number?];  // [lng, lat, elevation?]
  };
  properties: {
    id: string;
    name: string;
    type: 'start' | 'windward' | 'leeward' | 'gate' | 'finish';
    description?: string;
    [key: string]: any;  // Custom properties
  };
}

interface RaceCourseFeatureCollection {
  type: 'FeatureCollection';
  features: RaceMarkFeature[];
}
```

**GeoJSON Best Practices:**
- Coordinates: **Always [longitude, latitude]** (not lat, lng!)
- Include elevation as optional third coordinate for 3D
- Store all mark metadata in `properties`
- Use consistent property names across features

### Pattern 9: Performance Optimization

```typescript
// Device capability detection
function optimizeForDevice(map: any) {
  const isLowEndDevice = detectLowEndDevice();

  if (isLowEndDevice) {
    // Reduce quality settings
    map.setRenderWorldCopies(false);  // Don't duplicate world
    map.setMaxTileCacheSize(50);      // Reduce cache size

    // Disable expensive features
    map.setPitch(0);  // Switch to 2D
    disableLayer(map, 'bathymetry');
    disableLayer(map, 'wave-patterns');
  }
}

function detectLowEndDevice(): boolean {
  // Check GPU
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return true;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (renderer.includes('Intel') && renderer.includes('HD')) {
      return true;  // Integrated GPU = low-end
    }
  }

  // Check memory
  const nav = window.navigator as any;
  if (nav.deviceMemory && nav.deviceMemory < 4) {
    return true;  // Less than 4GB RAM
  }

  return false;
}

// Layer management for performance
function addLayerWithLOD(map: any, layer: any, minZoom: number, maxZoom: number) {
  map.addLayer({
    ...layer,
    minzoom: minZoom,  // Don't render below this zoom
    maxzoom: maxZoom   // Don't render above this zoom
  });
}
```

**Key Points:**
- Detect low-end devices and reduce quality
- Use min/maxzoom to limit layer rendering
- Disable world copies for better performance
- Reduce tile cache on memory-constrained devices

### Pattern 10: Style Switching (Nautical Charts)

```typescript
// Marine-optimized styles
const MAP_STYLES = {
  tactical: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
  nautical: createNauticalStyle(),  // Custom nautical chart
  satellite: 'https://tiles.stadiamaps.com/styles/satellite.json',
  racing: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json'
};

function createNauticalStyle() {
  return {
    version: 8,
    name: 'Nautical Chart',
    sources: {
      'osm-base': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256
      },
      'openseamap': {
        type: 'raster',
        tiles: ['https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#E8F4FD' }  // Water blue
      },
      {
        id: 'osm-base',
        type: 'raster',
        source: 'osm-base',
        paint: { 'raster-opacity': 0.8 }
      },
      {
        id: 'openseamap',
        type: 'raster',
        source: 'openseamap',
        paint: { 'raster-opacity': 1.0 }  // Full opacity for navigation marks
      }
    ]
  };
}

async function switchMapStyle(map: any, styleName: keyof typeof MAP_STYLES, raceCourse?: RaceCourse) {
  map.setStyle(MAP_STYLES[styleName]);

  // Re-add race course after style loads
  map.once('styledata', () => {
    if (raceCourse) {
      addRaceCourse(map, raceCourse);
    }
  });
}
```

**Key Points:**
- OpenSeaMap provides nautical symbols, depth contours, buoys
- Always re-add custom layers after `setStyle()` (it clears everything)
- Use `styledata` event to wait for new style to load

## Utility Functions Available

RegattaFlow provides these utility functions for MapLibre operations (from `sailing-document-parser` skill):

### Coordinate Utilities (Use These!)

```typescript
import {
  convertDMSToDecimal,
  convertDDMToDecimal,
  parseCoordinatePair,
  validateCoordinates
} from '@/skills/sailing-document-parser/utils/coordinates';

// Don't write parsing code - use utilities
const lat = convertDMSToDecimal("22°16'45.6\"N");  // → 22.279333
const lng = convertDDMToDecimal("114 10.164E");    // → 114.1694

const { latitude, longitude } = parseCoordinatePair("22.2793N, 114.1694E");
```

### Course Generation Utilities (Use These!)

```typescript
import {
  generateCourseGeoJSON,
  detectCourseType,
  calculateCourseBounds,
  calculateDistance,
  calculateBearing
} from '@/skills/sailing-document-parser/utils/course-generation';

// Auto-generate GeoJSON from marks
const geoJSON = generateCourseGeoJSON(marks, true);  // includeCourseLine=true

// Detect course type (windward/leeward, triangle, etc.)
const courseType = detectCourseType(marks);

// Calculate map bounds for fitBounds()
const [west, south, east, north] = calculateCourseBounds(marks, 100);  // 100m padding

// Distance between marks (nautical miles)
const distance = calculateDistance(mark1, mark2, 'nautical miles');

// Bearing from mark1 to mark2 (degrees)
const bearing = calculateBearing(mark1, mark2);
```

**IMPORTANT:** Always use these utilities instead of writing coordinate parsing or GeoJSON generation from scratch. They are pre-tested and handle edge cases.

## Common Workflows

### Workflow 1: Display Race Course from AI Extraction

```typescript
async function displayRaceCourse(map: any, extraction: RaceCourseExtraction) {
  // Step 1: Use utility to generate GeoJSON
  const geoJSON = generateCourseGeoJSON(extraction.marks, true);

  // Step 2: Add race marks as 3D extrusions
  await addRaceMarks(map, extraction.marks);

  // Step 3: Add course lines
  await addCourseLines(map, extraction.marks);

  // Step 4: Add start/finish lines
  await addStartFinishLines(map, extraction.marks);

  // Step 5: Fit map to course
  const bounds = calculateCourseBounds(extraction.marks, 100);
  map.fitBounds(bounds, { padding: 100, pitch: 45 });
}
```

### Workflow 2: Add Environmental Overlays

```typescript
async function addEnvironmentalLayers(map: any, conditions: RaceConditions) {
  if (conditions.wind) {
    await addWindVectors(map, conditions.wind);
  }

  if (conditions.current) {
    await addCurrentFlow(map, conditions.current);
  }

  if (conditions.tide) {
    await addTideVisualization(map, conditions.tide);
  }
}
```

### Workflow 3: Interactive Mark Selection

```typescript
function setupMarkInteraction(map: any, onMarkSelected: (mark: RaceMark) => void) {
  // Click handler
  map.on('click', 'race-marks-3d', (e: any) => {
    const feature = e.features[0];
    const mark = {
      id: feature.properties.id,
      name: feature.properties.name,
      type: feature.properties.type,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0]
    };

    onMarkSelected(mark);

    // Highlight selected mark
    map.setPaintProperty('race-marks-3d', 'fill-extrusion-color', [
      'case',
      ['==', ['get', 'id'], mark.id],
      '#FFFFFF',  // White for selected
      ['get', 'originalColor']  // Original color for others
    ]);
  });

  // Hover cursor
  map.on('mouseenter', 'race-marks-3d', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'race-marks-3d', () => {
    map.getCanvas().style.cursor = '';
  });
}
```

## Token Savings

### Before (Without Skill):
Agent generates MapLibre code from scratch, often with incorrect patterns.
- Map initialization: ~800 tokens
- 3D mark rendering: ~600 tokens
- GeoJSON generation: ~500 tokens
- Camera controls: ~400 tokens

### After (With Skill):
Agent references established patterns and utilities.
- Map initialization: ~200 tokens (reference Pattern 1)
- 3D mark rendering: ~150 tokens (reference Pattern 2, use utilities)
- GeoJSON generation: ~100 tokens (use `generateCourseGeoJSON()`)
- Camera controls: ~100 tokens (reference Pattern 6)

**Savings:** 60-75% reduction in generated code tokens

### Cost Impact (Projected)

```bash
Typical development session: 5 map visualizations created

Before: 5 × 1,000 tokens avg = 5,000 output tokens
After: 5 × 300 tokens avg = 1,500 output tokens

Savings per session: 3,500 tokens
Cost savings: 3.5k × $0.005/1k = $0.017 per session

Annual (30 sessions): 30 × $0.017 = $0.51/year
```

**Note:** Primary value is correct 3D visualization and GeoJSON structure, not just cost savings.

## Common Mistakes to Avoid

### ❌ MISTAKE 1: Wrong Coordinate Order
```typescript
// ❌ WRONG (lat, lng)
coordinates: [22.2793, 114.1694]

// ✅ CORRECT (lng, lat)
coordinates: [114.1694, 22.2793]
```

### ❌ MISTAKE 2: Not Waiting for Map Load
```typescript
// ❌ WRONG (map not ready)
const map = new maplibregl.Map({ ... });
map.addLayer({ ... });  // Fails!

// ✅ CORRECT (wait for load)
map.on('load', () => {
  map.addLayer({ ... });
});
```

### ❌ MISTAKE 3: Not Re-adding Layers After Style Change
```typescript
// ❌ WRONG (layers disappear)
map.setStyle(newStyle);

// ✅ CORRECT (re-add layers)
map.setStyle(newStyle);
map.once('styledata', () => {
  addRaceCourse(map, course);
});
```

### ❌ MISTAKE 4: Hardcoding Coordinates Instead of Using Utilities
```typescript
// ❌ WRONG (error-prone parsing)
const lat = parseFloat(dms.replace(/[^\d.]/g, ''));

// ✅ CORRECT (use tested utility)
const lat = convertDMSToDecimal(dms);
```

### ❌ MISTAKE 5: Not Optimizing for Mobile/Low-End Devices
```typescript
// ❌ WRONG (same quality for all devices)
map.setPitch(85);
map.addLayer(complexBathymetry);

// ✅ CORRECT (adaptive quality)
if (!isLowEndDevice()) {
  map.setPitch(85);
  map.addLayer(complexBathymetry);
} else {
  map.setPitch(45);
}
```

## Best Practices

1. **Always use utilities** - Don't generate coordinate parsing or GeoJSON from scratch
2. **Platform detection** - Use dynamic imports for web-only MapLibre GL JS
3. **3D perspective** - Default pitch of 45° for race course visualization
4. **Color consistency** - Use RegattaFlow color scheme (green=start, red=finish, blue=windward, orange=leeward)
5. **Performance first** - Detect device capabilities and optimize accordingly
6. **Layer management** - Use min/maxzoom to limit rendering
7. **Error handling** - Wrap layer operations in try-catch
8. **Coordinate order** - **Always [lng, lat]** in GeoJSON

## Related Skills

- **sailing-document-parser** - Coordinate utilities and GeoJSON generation
- **regattaflow-frontend** - React Native component patterns
- **regattaflow-data-models** - Geographic queries with PostGIS

---

**Maintained by:** RegattaFlow Development Team
**Last Updated:** 2025-10-19
**MapLibre GL JS Version:** v4.x
