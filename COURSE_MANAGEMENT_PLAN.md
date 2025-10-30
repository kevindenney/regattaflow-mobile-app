# Course Management Features - Development Plan

## Overview
This document outlines the implementation plan for advanced course management features in RegattaFlow's tactical race map. These features enable sailors to create, customize, and manage race courses with intelligent environmental adaptation.

## Completed Features ✅

### Phase 1: Racing Area Drawing Controls
**Status:** ✅ Complete

- Added racing area polygon drawing functionality to /races page
- Users can click to add points, drag to move them, right-click to delete
- Integrated drawing controls with save functionality
- Racing area data persists to `regattas.racing_area_polygon` (GeoJSON format)

**Files Modified:**
- `app/(tabs)/races.tsx` - Added state and handlers for racing area
- `components/race-detail/RaceDetailMapHero.tsx` - Added drawing mode UI

### Phase 2: Mark Manager Component
**Status:** ✅ Complete

- Created MarkManager component with 8 predefined mark types:
  - Committee Boat (start line)
  - Pin Buoy (start line end)
  - Windward Mark (top mark)
  - Leeward Mark (bottom mark)
  - Gate A (port) / Gate B (starboard)
  - Offset Mark
  - Finish Mark
- Floating action buttons for adding marks and toggling edit mode
- Modal interface for mark type selection

**Files Created:**
- `components/race-detail/MarkManager.tsx`

### Phase 3: Environmental Layer Fix
**Status:** ✅ Complete

- Fixed missing wind, current, and wave arrow overlays
- Added dedicated useEffect to watch for environmental data changes
- Layers now update properly when environmental data arrives

**Files Modified:**
- `components/race-strategy/TacticalRaceMap.tsx` - Added environmental update effect

---

## Pending Features 🚧

### Phase 3: Draggable Marks
**Status:** 🔨 Next Priority

Enable users to place marks by clicking the map and drag them to new positions.

#### Implementation Steps

**Step 3.1: Mark Placement Mode**
File: `components/race-strategy/TacticalRaceMap.tsx`

1. Add mark placement state:
```typescript
const [isAddingMark, setIsAddingMark] = useState(false);
const [pendingMarkType, setPendingMarkType] = useState<string | null>(null);
```

2. Add map click handler for mark placement:
```typescript
const handleMapClickForMark = (e: any) => {
  if (!isAddingMark || !pendingMarkType) return;

  const { lng, lat } = e.lngLat;

  // Create new mark
  const newMark = {
    id: `mark-${Date.now()}`,
    mark_name: pendingMarkType,
    mark_type: pendingMarkType,
    latitude: lat,
    longitude: lng,
    sequence_order: marks.length,
  };

  // Add to marks array
  onMarkAdded?.(newMark);

  // Exit placement mode
  setIsAddingMark(false);
  setPendingMarkType(null);
};
```

3. Update RaceDetailMapHero to pass placement mode:
```typescript
// In RaceDetailMapHero.tsx
const handleAddMark = (markType: string) => {
  setSelectedMarkType(markType);
  setIsAddingMark(true);
};

// Pass to TacticalRaceMap
<TacticalRaceMap
  isAddingMark={isAddingMark}
  pendingMarkType={selectedMarkType}
  onMarkAdded={handleMarkAdded}
  ...
/>
```

**Step 3.2: Draggable Marks Implementation**
File: `components/race-strategy/TacticalRaceMap.tsx`

1. Add drag state:
```typescript
const [isDraggingMark, setIsDraggingMark] = useState(false);
const [draggedMarkId, setDraggedMarkId] = useState<string | null>(null);
```

2. Add mouse event handlers for marks:
```typescript
// On mark layer
map.on('mousedown', 'marks', (e: any) => {
  if (!isEditMode) return;

  e.preventDefault();

  const features = map.queryRenderedFeatures(e.point, {
    layers: ['marks']
  });

  if (!features.length) return;

  const markId = features[0].properties.id;
  setIsDraggingMark(true);
  setDraggedMarkId(markId);

  // Disable map panning during drag
  map.dragPan.disable();
});

map.on('mousemove', (e: any) => {
  if (!isDraggingMark || !draggedMarkId) return;

  const { lng, lat } = e.lngLat;

  // Update mark position in real-time
  updateMarkPosition(draggedMarkId, lat, lng);
});

map.on('mouseup', () => {
  if (isDraggingMark && draggedMarkId) {
    // Save final position
    onMarkMoved?.(draggedMarkId, marks);

    setIsDraggingMark(false);
    setDraggedMarkId(null);
    map.dragPan.enable();
  }
});
```

3. Helper function to update mark position:
```typescript
const updateMarkPosition = (markId: string, lat: number, lng: number) => {
  const updatedMarks = marks.map(mark =>
    mark.id === markId
      ? { ...mark, latitude: lat, longitude: lng }
      : mark
  );

  // Update marks in state and re-render
  setMarks(updatedMarks);

  // Re-render mark layer
  const source = map.getSource('marks') as any;
  if (source) {
    source.setData(createMarkGeoJSON(updatedMarks));
  }
};
```

**Step 3.3: Mark Deletion**
Add right-click context menu for mark deletion:
```typescript
map.on('contextmenu', 'marks', (e: any) => {
  if (!isEditMode) return;

  e.preventDefault();

  const markId = e.features[0].properties.id;

  // Show confirmation dialog
  if (confirm('Delete this mark?')) {
    onMarkDeleted?.(markId);
  }
});
```

**Testing Checklist:**
- [ ] Click map after selecting mark type places mark at correct location
- [ ] Drag mark updates position smoothly
- [ ] Release drag saves new position
- [ ] Right-click mark in edit mode shows delete option
- [ ] Map panning disabled during mark drag
- [ ] Cursor changes to indicate drag mode

---

### Phase 4: Wind-Based Course Rotation
**Status:** 🔨 Future Enhancement

Automatically rotate the course when wind direction changes, maintaining relative geometry.

#### Implementation Steps

**Step 4.1: Create CourseRotationService**
File: `services/CourseRotationService.ts`

```typescript
/**
 * Course Rotation Service
 * Intelligently rotates race courses based on wind direction changes
 */

interface CourseMark {
  id: string;
  latitude: number;
  longitude: number;
  mark_type: string;
}

interface RotationConfig {
  windDirection: number; // degrees
  preserveDistances: boolean;
  rotationMode: 'auto' | 'manual';
}

export class CourseRotationService {
  /**
   * Calculate course center point (centroid)
   */
  static calculateCourseCenter(marks: CourseMark[]): { lat: number; lng: number } {
    const lat = marks.reduce((sum, m) => sum + m.latitude, 0) / marks.length;
    const lng = marks.reduce((sum, m) => sum + m.longitude, 0) / marks.length;
    return { lat, lng };
  }

  /**
   * Calculate rotation angle based on wind change
   */
  static calculateRotationAngle(
    oldWindDirection: number,
    newWindDirection: number
  ): number {
    let angle = newWindDirection - oldWindDirection;

    // Normalize to -180 to 180
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;

    return angle;
  }

  /**
   * Rotate a point around a center
   */
  static rotatePoint(
    point: { lat: number; lng: number },
    center: { lat: number; lng: number },
    angleDegrees: number
  ): { lat: number; lng: number } {
    const angleRadians = (angleDegrees * Math.PI) / 180;

    // Translate to origin
    const dx = point.lng - center.lng;
    const dy = point.lat - center.lat;

    // Rotate
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);

    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    // Translate back
    return {
      lat: center.lat + rotatedY,
      lng: center.lng + rotatedX,
    };
  }

  /**
   * Rotate all course marks around center
   */
  static rotateCourse(
    marks: CourseMark[],
    config: RotationConfig
  ): CourseMark[] {
    const center = this.calculateCourseCenter(marks);
    const rotationAngle = config.windDirection; // Relative to current orientation

    return marks.map(mark => ({
      ...mark,
      ...this.rotatePoint(
        { lat: mark.latitude, lng: mark.longitude },
        center,
        rotationAngle
      ),
    }));
  }

  /**
   * Get optimal start line orientation for wind direction
   */
  static calculateOptimalStartLine(windDirection: number): {
    bearing: number;
    description: string;
  } {
    // Start line should be perpendicular to wind (± 90°)
    const bearing = (windDirection + 90) % 360;

    return {
      bearing,
      description: `Start line at ${bearing}° (perpendicular to ${windDirection}° wind)`,
    };
  }
}
```

**Step 4.2: Integrate Rotation UI**
File: `components/race-detail/RaceDetailMapHero.tsx`

Add rotation controls:
```typescript
// State
const [autoRotation, setAutoRotation] = useState(false);
const [previousWindDirection, setPreviousWindDirection] = useState<number | null>(null);

// Watch for wind direction changes
useEffect(() => {
  if (!autoRotation || !environmental?.current.wind) return;

  const currentWindDir = environmental.current.wind.direction;

  if (previousWindDirection !== null && previousWindDirection !== currentWindDir) {
    const rotationAngle = CourseRotationService.calculateRotationAngle(
      previousWindDirection,
      currentWindDir
    );

    if (Math.abs(rotationAngle) > 10) { // Only rotate if significant change
      handleRotateCourse(rotationAngle);
    }
  }

  setPreviousWindDirection(currentWindDir);
}, [environmental?.current.wind.direction, autoRotation]);

// Rotation handler
const handleRotateCourse = (angleDegrees: number) => {
  const rotatedMarks = CourseRotationService.rotateCourse(marks, {
    windDirection: angleDegrees,
    preserveDistances: true,
    rotationMode: autoRotation ? 'auto' : 'manual',
  });

  onMarksUpdated?.(rotatedMarks);
};
```

Add UI toggle:
```typescript
<TouchableOpacity
  style={styles.rotationToggle}
  onPress={() => setAutoRotation(!autoRotation)}
>
  <MaterialCommunityIcons
    name="rotate-3d-variant"
    size={20}
    color={autoRotation ? '#10B981' : '#64748B'}
  />
  <Text>Auto-Rotate with Wind</Text>
</TouchableOpacity>
```

**Testing Checklist:**
- [ ] Manual rotation rotates course around center
- [ ] Auto-rotation triggers on wind direction change > 10°
- [ ] Mark relative positions preserved
- [ ] Start line remains perpendicular to wind
- [ ] Toggle auto-rotation on/off works correctly

---

### Phase 5: Mark Position Persistence
**Status:** 🔨 Future Enhancement

Save custom mark positions to database and load them when viewing races.

#### Implementation Steps

**Step 5.1: Database Schema Update**
The `race_marks` table already exists. Ensure it has these columns:

```sql
-- Verify schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'race_marks';

-- Should have:
-- id (uuid)
-- race_id (uuid) - references race_events(id)
-- mark_type (text) - 'committee_boat', 'pin', 'windward', etc.
-- name (text) - Display name
-- latitude (numeric)
-- longitude (numeric)
-- sequence_order (integer)
-- is_custom (boolean) - Flag for user-placed marks
-- created_at (timestamp)
-- updated_at (timestamp)
```

Add `is_custom` column if missing:
```sql
ALTER TABLE race_marks
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
```

**Step 5.2: Create Mark Persistence Service**
File: `services/RaceMarkService.ts`

```typescript
import { supabase } from '@/lib/supabase';

export class RaceMarkService {
  /**
   * Save mark position to database
   */
  static async saveMarkPosition(
    raceEventId: string,
    mark: {
      id?: string;
      mark_type: string;
      name: string;
      latitude: number;
      longitude: number;
      sequence_order: number;
      is_custom: boolean;
    }
  ) {
    if (mark.id) {
      // Update existing mark
      const { error } = await supabase
        .from('race_marks')
        .update({
          latitude: mark.latitude,
          longitude: mark.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mark.id);

      if (error) throw error;
    } else {
      // Insert new mark
      const { error } = await supabase
        .from('race_marks')
        .insert({
          race_id: raceEventId,
          mark_type: mark.mark_type,
          name: mark.name,
          latitude: mark.latitude,
          longitude: mark.longitude,
          sequence_order: mark.sequence_order,
          is_custom: mark.is_custom,
        });

      if (error) throw error;
    }
  }

  /**
   * Load marks for a race
   */
  static async loadRaceMarks(raceEventId: string) {
    const { data, error } = await supabase
      .from('race_marks')
      .select('*')
      .eq('race_id', raceEventId)
      .order('sequence_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Delete mark
   */
  static async deleteMark(markId: string) {
    const { error } = await supabase
      .from('race_marks')
      .delete()
      .eq('id', markId);

    if (error) throw error;
  }

  /**
   * Reset marks to default course
   */
  static async resetToDefaultCourse(raceEventId: string) {
    // Delete all custom marks
    const { error } = await supabase
      .from('race_marks')
      .delete()
      .eq('race_id', raceEventId)
      .eq('is_custom', true);

    if (error) throw error;
  }

  /**
   * Batch update mark positions (for course rotation)
   */
  static async batchUpdatePositions(
    marks: Array<{ id: string; latitude: number; longitude: number }>
  ) {
    const updates = marks.map(mark =>
      supabase
        .from('race_marks')
        .update({
          latitude: mark.latitude,
          longitude: mark.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mark.id)
    );

    await Promise.all(updates);
  }
}
```

**Step 5.3: Integrate with Map Components**
File: `components/race-detail/RaceDetailMapHero.tsx`

```typescript
// Save when mark is moved
const handleMarkMoved = async (markId: string, updatedMarks: CourseMark[]) => {
  const movedMark = updatedMarks.find(m => m.id === markId);
  if (!movedMark || !race.id) return;

  try {
    await RaceMarkService.saveMarkPosition(race.id, {
      id: movedMark.id,
      mark_type: movedMark.mark_type,
      name: movedMark.mark_name,
      latitude: movedMark.latitude!,
      longitude: movedMark.longitude!,
      sequence_order: movedMark.sequence_order || 0,
      is_custom: true,
    });

    console.log('✅ Mark position saved');
  } catch (error) {
    console.error('❌ Failed to save mark:', error);
  }
};

// Load marks on mount
useEffect(() => {
  if (!race.id) return;

  RaceMarkService.loadRaceMarks(race.id).then(loadedMarks => {
    setMarks(loadedMarks);
  });
}, [race.id]);
```

**Testing Checklist:**
- [ ] Moved marks save to database
- [ ] Marks load from database on page load
- [ ] Custom marks flagged as `is_custom: true`
- [ ] Delete mark removes from database
- [ ] Reset to default removes custom marks
- [ ] Batch update works for course rotation

---

### Phase 6: Enhanced Laylines
**Status:** 🔨 Future Enhancement

Automatically show laylines when windward mark is present, with proper tack visualization.

#### Implementation Steps

**Step 6.1: Layline Calculation Service**
File: `services/LaylinesService.ts`

```typescript
/**
 * Laylines Service
 * Calculates optimal upwind and downwind laylines
 */

interface LaylinesConfig {
  windDirection: number; // degrees
  boatPointingAngle: number; // typical: 45° for upwind
  windwardMark: { lat: number; lng: number };
  startLine?: {
    committee: { lat: number; lng: number };
    pin: { lat: number; lng: number };
  };
}

export class LaylinesService {
  /**
   * Calculate upwind laylines to windward mark
   */
  static calculateUpwindLaylines(config: LaylinesConfig): {
    port: Array<{ lat: number; lng: number }>;
    starboard: Array<{ lat: number; lng: number }>;
  } {
    const { windDirection, boatPointingAngle, windwardMark, startLine } = config;

    // Layline angles (wind direction ± pointing angle)
    const portLaylineAngle = (windDirection - boatPointingAngle + 360) % 360;
    const starboardLaylineAngle = (windDirection + boatPointingAngle) % 360;

    // Calculate start points (from start line if available)
    const startPoint = startLine
      ? {
          lat: (startLine.committee.lat + startLine.pin.lat) / 2,
          lng: (startLine.committee.lng + startLine.pin.lng) / 2,
        }
      : windwardMark; // Fallback to windward mark

    // Project laylines from windward mark back to start
    const distance = this.calculateDistance(startPoint, windwardMark);

    const portLayline = this.projectLine(
      windwardMark,
      portLaylineAngle + 180, // Reverse direction
      distance
    );

    const starboardLayline = this.projectLine(
      windwardMark,
      starboardLaylineAngle + 180, // Reverse direction
      distance
    );

    return {
      port: [startPoint, ...portLayline, windwardMark],
      starboard: [startPoint, ...starboardLayline, windwardMark],
    };
  }

  /**
   * Calculate distance between two points (haversine)
   */
  static calculateDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Project a line from a point in a given direction
   */
  static projectLine(
    start: { lat: number; lng: number },
    bearingDegrees: number,
    distanceMeters: number,
    steps: number = 10
  ): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];
    const R = 6371e3; // Earth radius

    for (let i = 1; i <= steps; i++) {
      const d = (distanceMeters * i) / steps;
      const brng = (bearingDegrees * Math.PI) / 180;
      const φ1 = (start.lat * Math.PI) / 180;
      const λ1 = (start.lng * Math.PI) / 180;

      const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(d / R) +
        Math.cos(φ1) * Math.sin(d / R) * Math.cos(brng)
      );
      const λ2 =
        λ1 +
        Math.atan2(
          Math.sin(brng) * Math.sin(d / R) * Math.cos(φ1),
          Math.cos(d / R) - Math.sin(φ1) * Math.sin(φ2)
        );

      points.push({
        lat: (φ2 * 180) / Math.PI,
        lng: (λ2 * 180) / Math.PI,
      });
    }

    return points;
  }
}
```

**Step 6.2: Render Laylines on Map**
File: `components/race-strategy/TacticalRaceMap.tsx`

Add laylines layer:
```typescript
const addLaylinesLayer = async (
  map: any,
  marks: CourseMark[],
  env?: EnvironmentalIntelligence
) => {
  if (!env?.current.wind) return;

  const windwardMark = marks.find(m => m.mark_type === 'windward');
  if (!windwardMark) return;

  const committeeBoat = marks.find(m => m.mark_type === 'committee_boat');
  const pin = marks.find(m => m.mark_type === 'pin');

  const laylines = LaylinesService.calculateUpwindLaylines({
    windDirection: env.current.wind.direction,
    boatPointingAngle: 45, // Standard upwind angle
    windwardMark: {
      lat: windwardMark.latitude!,
      lng: windwardMark.longitude!,
    },
    startLine: committeeBoat && pin ? {
      committee: { lat: committeeBoat.latitude!, lng: committeeBoat.longitude! },
      pin: { lat: pin.latitude!, lng: pin.longitude! },
    } : undefined,
  });

  // Add port layline (red)
  map.addSource('layline-port', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: laylines.port.map(p => [p.lng, p.lat]),
      },
    },
  });

  map.addLayer({
    id: 'layline-port',
    type: 'line',
    source: 'layline-port',
    paint: {
      'line-color': '#EF4444', // Red for port
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 0.7,
    },
  });

  // Add starboard layline (green)
  map.addSource('layline-starboard', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: laylines.starboard.map(p => [p.lng, p.lat]),
      },
    },
  });

  map.addLayer({
    id: 'layline-starboard',
    type: 'line',
    source: 'layline-starboard',
    paint: {
      'line-color': '#10B981', // Green for starboard
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 0.7,
    },
  });

  console.log('✅ Laylines rendered');
};
```

**Step 6.3: Auto-Enable Laylines**
Update layer initialization to auto-enable when windward mark present:

```typescript
const [layers, setLayers] = useState<MapLayer[]>(() => {
  const hasWindwardMark = marks.some(m => m.mark_type === 'windward');

  return [
    { id: 'wind', name: 'Wind', icon: 'flag-outline', enabled: true, category: 'environmental' },
    { id: 'current', name: 'Current', icon: 'water-outline', enabled: true, category: 'environmental' },
    { id: 'waves', name: 'Waves', icon: 'trending-up-outline', enabled: false, category: 'environmental' },
    { id: 'depth', name: 'Depth', icon: 'layers-outline', enabled: false, category: 'environmental' },
    { id: 'laylines', name: 'Laylines', icon: 'git-branch-outline', enabled: hasWindwardMark, category: 'tactical' },
    { id: 'strategy', name: 'Strategy', icon: 'analytics-outline', enabled: false, category: 'tactical' },
  ];
});
```

**Testing Checklist:**
- [ ] Laylines appear when windward mark exists
- [ ] Port layline is red, starboard is green
- [ ] Laylines calculate from start line center
- [ ] Laylines update when wind direction changes
- [ ] Laylines toggle on/off works
- [ ] Correct pointing angle (45° default)

---

## Technical Architecture

### Component Hierarchy
```
RaceDetailMapHero
├── TacticalRaceMap (core map with layers)
│   ├── Wind Layer (arrows)
│   ├── Current Layer (arrows)
│   ├── Wave Layer (gradient)
│   ├── Marks Layer (draggable)
│   ├── Racing Area Layer (polygon)
│   └── Laylines Layer (dashed lines)
└── MarkManager (floating action buttons)
    └── Modal (mark type selection)
```

### State Management
```typescript
// RaceDetailMapHero (parent)
- isDrawingMode: boolean
- isAddingMark: boolean
- selectedMarkType: string | null
- isEditMode: boolean
- marks: CourseMark[]
- racingAreaPolygon: LatLng[]
- environmental: EnvironmentalIntelligence

// TacticalRaceMap (child)
- mapLoaded: boolean
- layers: MapLayer[]
- isDraggingMark: boolean
- draggedMarkId: string | null
```

### Data Flow
```
User Action → Component State → Map Layer Update → Database Persistence
              ↓
         Visual Feedback
```

---

## Database Schema Reference

### `race_marks` Table
```sql
CREATE TABLE race_marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID REFERENCES race_events(id) ON DELETE CASCADE,
  mark_type TEXT NOT NULL, -- 'committee_boat', 'pin', 'windward', 'leeward', etc.
  name TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  sequence_order INTEGER DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `regattas` Table (racing_area_polygon)
```sql
-- Existing column
racing_area_polygon JSONB -- GeoJSON Polygon format
```

---

## Testing Strategy

### Unit Tests
- CourseRotationService calculations
- LaylinesService geometry
- Mark position validation
- GeoJSON format correctness

### Integration Tests
- Map interaction flows
- Database persistence
- State synchronization
- Layer rendering

### User Acceptance Tests
1. Add a mark → Place it → Drag it → Save → Reload page → Verify position
2. Draw racing area → Save → Reload → Verify polygon
3. Enable auto-rotation → Change wind → Verify course rotates
4. Add windward mark → Verify laylines appear automatically
5. Toggle layers → Verify visibility changes

---

## Performance Considerations

### Optimization Strategies
1. **Debounce mark drag updates** - Only save to DB on drag end, not during movement
2. **Throttle layer re-renders** - Use requestAnimationFrame for smooth animations
3. **Lazy load map tiles** - Only fetch visible area
4. **Memoize calculations** - Cache rotation matrices and layline geometry
5. **Batch database updates** - Use transactions for multiple mark updates

### Memory Management
- Clean up map event listeners on unmount
- Remove unused layers and sources
- Limit arrow grid density based on zoom level
- Use React.memo for expensive child components

---

## Future Enhancements

### Advanced Features (Post-MVP)
1. **Multi-leg courses** - Support triangle courses with multiple leeward gates
2. **Waypoint navigation** - Show optimal tacking points along course
3. **Tidal gate timing** - Calculate best time to round marks based on current
4. **Historical course replay** - Show boat tracks overlaid on course
5. **Collaborative course editing** - Real-time sync for multiple race officers
6. **3D course visualization** - Show depth contours and underwater features
7. **Course validation** - Alert for mark collisions or unrealistic layouts
8. **Export course as GPX** - Share courses with chartplotters

### API Integrations
- WindGuru for wind forecasts
- NOAA for tide predictions
- Navionics for bathymetry data
- AIS for live boat tracking

---

## Resources

### Documentation
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js-docs/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### Code References
- `components/race-strategy/TacticalRaceMap.tsx` - Main map component
- `components/race-detail/RaceDetailMapHero.tsx` - Map container with controls
- `services/AutoCourseGeneratorService.ts` - Course generation logic
- `types/raceEvents.ts` - Type definitions

---

## Changelog

### 2025-10-28
- ✅ Phase 1: Racing area drawing controls
- ✅ Phase 2: MarkManager component
- ✅ Phase 3: Environmental layer fix
- 📝 Created comprehensive development plan

---

## Summary

This plan provides a complete roadmap for implementing advanced course management features. Each phase builds on the previous one, ensuring a solid foundation before adding complexity. The modular service architecture makes testing and maintenance straightforward.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 3: Draggable Marks implementation
3. Test thoroughly at each phase
4. Iterate based on user feedback

**Estimated Timeline:**
- Phase 3 (Draggable Marks): 2-3 days
- Phase 4 (Course Rotation): 2-3 days
- Phase 5 (Mark Persistence): 1-2 days
- Phase 6 (Enhanced Laylines): 2-3 days

**Total: ~8-11 days** for complete feature set.
