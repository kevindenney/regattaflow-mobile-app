# RegattaFlow MapLibre GL JS Skill

## Overview

This skill teaches AI agents the RegattaFlow MapLibre GL JS patterns for 3D marine mapping and race course visualization. It ensures consistent 3D rendering, proper GeoJSON structure, sailing-specific visual conventions, and performance optimization for the "OnX Maps for Sailing" experience.

## What This Skill Covers

1. **3D Race Visualization** - Rendering race marks, courses, and tactical layers with MapLibre GL JS
2. **GeoJSON Best Practices** - Proper coordinate ordering, feature structure, and property naming
3. **Marine Cartography** - Nautical chart styles, bathymetry, and environmental overlays
4. **Camera Control** - 3D perspective, animations, and viewport management
5. **Performance Optimization** - Device detection, layer management, and rendering efficiency
6. **Platform Compatibility** - Web-only MapLibre with React Native universal app patterns

## Token Savings

### Before (Without Skill):
Agent generates MapLibre code from scratch with frequent errors.
- Map initialization: ~800 tokens
- 3D mark rendering: ~600 tokens
- GeoJSON generation: ~500 tokens
- Camera/animation: ~400 tokens
- Environmental layers: ~700 tokens

### After (With Skill):
Agent references skill patterns and uses utilities.
- Map initialization: ~200 tokens (Pattern 1)
- 3D mark rendering: ~150 tokens (Pattern 2, use utilities)
- GeoJSON generation: ~100 tokens (use `generateCourseGeoJSON()`)
- Camera/animation: ~100 tokens (Pattern 6)
- Environmental layers: ~200 tokens (Pattern 5)

**Savings:** 60-75% reduction in generated code tokens

### Cost Impact (Projected)

```bash
Typical development session: 3 map visualizations

Before: 3 × 1,000 tokens avg = 3,000 output tokens
After: 3 × 300 tokens avg = 900 output tokens

Savings per session: 2,100 tokens
Cost savings: 2.1k × $0.005/1k = $0.010 per session

Annual (25 sessions): 25 × $0.010 = $0.25/year
```

**Note:** Primary value is correct 3D visualization, proper GeoJSON structure, and sailing-specific conventions, not just cost savings.

## Resources

### Templates

1. **race-course-geojson-template.json** - Complete GeoJSON FeatureCollection
   - 7 race marks (start, windward, leeward gate, finish)
   - Course legs with distances and bearings
   - Tactical information (laylines, wind shifts, current)
   - Map view configuration (bounds, center, zoom, pitch)
   - Property conventions (colors, sequence, rounding)

2. **3d-race-map-component.tsx** - Complete React component
   - Web-only MapLibre initialization with dynamic import
   - 3D race mark extrusions
   - Course lines and start/finish lines
   - Environmental layers (wind, current)
   - Layer controls and interactivity
   - Camera management and animations
   - Mobile fallback UI

### How to Use Templates

#### Displaying a Race Course

1. Copy the component template:
   ```bash
   cp skills/regattaflow-maplibre/resources/templates/3d-race-map-component.tsx \
      src/components/races/RaceMapVisualization.tsx
   ```

2. Customize for your use case:
   - Update component name
   - Modify props interface
   - Customize layer controls
   - Add venue-specific logic

3. Import and use:
   ```typescript
   import RaceMapVisualization from '@/src/components/races/RaceMapVisualization';

   <RaceMapVisualization
     course={raceCourse}
     venueCenter={[114.1694, 22.2793]}
     showWind={true}
     showCurrent={true}
     onMarkSelected={(mark) => console.log('Selected:', mark)}
   />
   ```

#### Creating GeoJSON Data

1. Reference the GeoJSON template structure:
   ```bash
   cat skills/regattaflow-maplibre/resources/templates/race-course-geojson-template.json
   ```

2. Use utility functions to generate:
   ```typescript
   import { generateCourseGeoJSON } from '@/skills/sailing-document-parser/utils/course-generation';

   const geoJSON = generateCourseGeoJSON(marks, true);
   ```

3. Validate structure matches template:
   - `type: "FeatureCollection"`
   - Each feature has `geometry` and `properties`
   - Coordinates are **[lng, lat]** (not lat, lng!)
   - Properties include `id`, `name`, `type`, `color`

## Integration with Development

### When Agent Uses This Skill

The AI agent automatically references this skill when:
- Creating MapLibre GL JS visualizations
- Rendering 3D race courses
- Generating GeoJSON for marks or courses
- Adding environmental or tactical layers
- Implementing camera controls or animations
- Optimizing map performance

### Example Usage

**User Request:**
"Create a 3D race course visualization with wind overlay"

**Without Skill:**
Agent generates ~2,500 tokens including:
- Map initialization code (may have errors)
- Manual GeoJSON construction (wrong coordinate order)
- Complex 3D layer code from scratch
- Wind vector generation without utilities
- Performance issues on mobile

**With Skill:**
Agent references templates and utilities:
- "Use 3d-race-map-component.tsx as base"
- "Generate GeoJSON with `generateCourseGeoJSON(marks, true)`"
- "Apply Pattern 2 for 3D mark extrusions"
- "Add wind vectors using Pattern 5"
- "Use device detection for optimization (Pattern 9)"

Output: ~750 tokens with references to established patterns

**Result:**
- Correct [lng, lat] coordinate order
- Professional 3D visualization
- Optimized performance
- Sailing-specific color scheme
- Mobile-compatible implementation

## Security and Platform Considerations

### Web-Only MapLibre GL JS

MapLibre GL JS is **web-only**. For universal React Native apps:

```typescript
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Dynamic import to prevent bundling in mobile builds
const initializeMap = async () => {
  if (!isWeb) return;  // Skip on native

  const maplibregl = await import('maplibre-gl');
  // ... map initialization
};
```

**Benefits:**
- Mobile bundle doesn't include web-only code
- Prevents runtime errors on iOS/Android
- Allows graceful fallback UI

### Mobile Alternatives

For native mobile mapping:
- **@maplibre/maplibre-react-native** - Native MapLibre for iOS/Android
- **@rnmapbox/maps** - Alternative with Mapbox SDK
- **Web fallback** - Show placeholder with "View on web" message

## Common Use Cases

### Use Case 1: AI-Extracted Race Course

```typescript
import { RaceMapVisualization } from '@/components';
import { ComprehensiveRaceExtractionAgent } from '@/services/agents';

async function displayExtractedCourse(document: string) {
  // AI extraction
  const agent = new ComprehensiveRaceExtractionAgent();
  const result = await agent.extractRaceDetails(document, 'sailing-instructions.pdf');

  if (result.success && result.result) {
    // Render on map
    return (
      <RaceMapVisualization
        course={{
          id: result.result.id,
          name: result.result.name,
          marks: result.result.marks,
          courseType: result.result.courseType
        }}
        showWind={true}
        showLaylines={true}
      />
    );
  }
}
```

### Use Case 2: Venue Intelligence with Environmental Layers

```typescript
import { VenueIntelligenceAgent } from '@/services/agents';

async function displayVenueMap(venueId: string) {
  // Load venue intelligence
  const agent = new VenueIntelligenceAgent();
  const venue = await agent.getVenueIntelligence(venueId);

  return (
    <RaceMapVisualization
      course={venue.typicalCourse}
      venueCenter={[venue.longitude, venue.latitude]}
      showWind={true}       // Regional weather data
      showCurrent={true}    // Tide/current patterns
      showLaylines={false}
    />
  );
}
```

### Use Case 3: Interactive Race Strategy Planning

```typescript
function RaceStrategyPlanner({ course, conditions }: Props) {
  const [selectedMark, setSelectedMark] = useState<RaceMark | null>(null);
  const [showLaylines, setShowLaylines] = useState(false);

  return (
    <View>
      <RaceMapVisualization
        course={course}
        showWind={true}
        showCurrent={conditions.hasCurrent}
        showLaylines={showLaylines}
        onMarkSelected={(mark) => {
          setSelectedMark(mark);
          setShowLaylines(true);  // Show laylines when mark selected
        }}
      />

      {selectedMark && (
        <MarkStrategyPanel mark={selectedMark} />
      )}
    </View>
  );
}
```

## Best Practices

### For Developers

1. **Use templates** - Start with 3d-race-map-component.tsx
2. **Use utilities** - Never write GeoJSON generation from scratch
3. **Coordinate order** - **Always [lng, lat]** in GeoJSON
4. **Platform detection** - Dynamic import for web-only MapLibre
5. **3D perspective** - Default pitch of 45° for race courses
6. **Color consistency** - Follow RegattaFlow color scheme
7. **Performance first** - Detect device capabilities and optimize

### For AI Agent

1. **Reference patterns** - Use skill.md patterns, not custom code
2. **Use utilities** - Call `generateCourseGeoJSON()` instead of manual construction
3. **Validate templates** - Ensure output matches template structure
4. **Check coordinates** - Verify [lng, lat] order before adding to map
5. **Platform awareness** - Always wrap MapLibre in `Platform.OS === 'web'` check

## Maintenance

### Updating This Skill

When MapLibre patterns change:

1. Update `skill.md` with new patterns
2. Update templates if structure changes
3. Add new visualization patterns as needed
4. Document breaking changes in README
5. Version the skill (see Version History below)

### Version History

- **v1.0** (2025-10-19): Initial creation with 3D visualization patterns and templates

## Quick Reference

### Common Tasks

**Initialize 3D race map:**
```typescript
const maplibregl = await import('maplibre-gl');
const map = new maplibregl.Map({
  container: ref.current,
  style: createNauticalStyle(),
  center: [lng, lat],
  zoom: 13,
  pitch: 45
});
```

**Add race marks:**
```typescript
const geoJSON = generateCourseGeoJSON(marks, true);
map.addSource('race-marks', { type: 'geojson', data: geoJSON });
map.addLayer({
  id: 'race-marks-3d',
  type: 'fill-extrusion',
  source: 'race-marks',
  paint: {
    'fill-extrusion-color': markColorExpression,
    'fill-extrusion-height': 50
  }
});
```

**Fit map to course:**
```typescript
const bounds = calculateCourseBounds(marks, 100);
map.fitBounds(bounds, { padding: 100, pitch: 45 });
```

**Toggle layer visibility:**
```typescript
map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
```

## Related Skills

- **sailing-document-parser** - Coordinate utilities, GeoJSON generation, course analysis
- **regattaflow-frontend** - React Native component patterns
- **regattaflow-data-models** - Geographic queries with PostGIS

## Troubleshooting

### Issue: Map doesn't load on mobile

**Cause:** MapLibre GL JS is web-only
**Solution:** Wrap in `Platform.OS === 'web'` check and provide mobile fallback

### Issue: Marks in wrong locations

**Cause:** Coordinate order is [lat, lng] instead of [lng, lat]
**Solution:** GeoJSON **always** uses [lng, lat] order

### Issue: Performance issues on low-end devices

**Cause:** Too many layers or 3D features
**Solution:** Use device detection (Pattern 9) to reduce quality

### Issue: Layers disappear after style change

**Cause:** `setStyle()` clears all custom layers
**Solution:** Re-add layers in `styledata` event handler

---

**Maintained by:** RegattaFlow Development Team
**Last Updated:** 2025-10-19
**MapLibre GL JS Version:** v4.x
