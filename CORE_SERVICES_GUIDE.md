# RegattaFlow Core Services Guide

*Complete implementation of differentiating features: Venue Intelligence, AI Strategy, GPS Tracking, and Offline Architecture*

## Overview

Four core services power RegattaFlow's competitive advantages:

1. **Venue Intelligence** - GPS detection & regional adaptation
2. **AI Strategy** - Document processing & strategy generation
3. **GPS Tracking** - 1Hz race recording & VMG analysis
4. **Offline Service** - Smart caching & sync

---

## 1. Venue Intelligence Service

### GPS-Based Venue Detection

```typescript
import { VenueService } from '@/src/services';

// Detect venue from current GPS location
const result = await VenueService.detectVenueFromGPS(userId, 50); // 50km radius

if (result.venue) {
  console.log(`Found: ${result.venue.name}`);
  console.log(`Distance: ${result.distance_km}km`);
  console.log(`Confidence: ${result.confidence}%`);
}
```

### Automatic Venue Switching

```typescript
// Switch to a new venue with full adaptation
const switchResult = await VenueService.switchVenue(venueId, userId, {
  cacheOffline: true,
  loadIntelligence: true
});

// Access adaptations
console.log('Currency:', switchResult.adaptations.currency);
console.log('Timezone:', switchResult.adaptations.timezone);
console.log('Weather sources:', switchResult.adaptations.weather_sources);

// Show cultural briefing to user
switchResult.cultural_briefing.forEach(item => {
  console.log('📋', item);
});
```

### Auto-Detection (Background)

```typescript
// Start automatic venue detection
await VenueService.startAutoDetection(userId, (result) => {
  if (result.venue) {
    Alert.alert(
      'New Venue Detected',
      `${result.venue.name} (${result.distance_km.toFixed(1)}km away)`,
      [
        { text: 'Switch', onPress: () => handleVenueSwitch(result.venue) },
        { text: 'Dismiss' }
      ]
    );
  }
});

// Stop when done
VenueService.stopAutoDetection();
```

### Venue Search & Discovery

```typescript
// Search globally
const venues = await VenueService.searchVenues('Hong Kong', {
  venueType: ['championship', 'premier'],
  limit: 20
});

// Get nearby venues for circuit planning
const nearbyVenues = await VenueService.getNearbyVenues(
  [114.1577, 22.2854], // [lng, lat]
  500, // 500km radius
  10   // top 10 results
);

nearbyVenues.forEach(v => {
  console.log(`${v.name}: ${v.distance_km}km away`);
});
```

---

## 2. AI Strategy Service

### Document Processing (PDF/OCR)

```typescript
import { AIStrategyService } from '@/src/services';

// User selects sailing instructions
const { course, strategy } = await AIStrategyService.selectDocumentAndGenerateStrategy(
  {
    tier: 'championship', // 'basic' | 'pro' | 'championship'
    venueId: currentVenueId,
    userPreferences: {
      risk_tolerance: 'moderate',
      focus_areas: ['speed', 'tactics']
    }
  },
  userId
);

// Course extracted automatically
console.log('Course:', course.course_name);
console.log('Marks:', course.marks.length);
console.log('Confidence:', course.confidence_score);

// Strategy generated automatically
console.log('Strategy confidence:', strategy.confidence_score);
```

### Manual Document Parsing

```typescript
// Parse specific document
const course = await AIStrategyService.parseSailingInstructions(
  documentUri,
  venueId
);

// Examine extracted data
course.marks.forEach(mark => {
  console.log(`${mark.name}: [${mark.coordinates}] (${mark.type})`);
});

console.log('Configurations:', course.course_configurations);
console.log('Wind:', course.wind_conditions);
console.log('Tide:', course.tide_information);
```

### Strategy Generation

```typescript
// Generate strategy from course
const strategy = await AIStrategyService.generateRaceStrategy(
  course,
  {
    tier: 'pro',
    venueId: 'hk-central-waters',
    userPreferences: {
      risk_tolerance: 'aggressive',
      focus_areas: ['tactics', 'positioning']
    }
  },
  userId
);

// Access strategy components
console.log('Pre-start plan:', strategy.pre_start_plan);
console.log('Upwind strategy:', strategy.upwind_strategy);
console.log('Downwind strategy:', strategy.downwind_strategy);
console.log('Mark roundings:', strategy.mark_roundings);
console.log('Contingency plans:', strategy.contingency_plans);

// Championship tier includes Monte Carlo simulation
if (strategy.monte_carlo_simulation) {
  console.log('Win probability:', strategy.monte_carlo_simulation.win_probability);
  console.log('Optimal path:', strategy.monte_carlo_simulation.optimal_path);
  console.log('Risk zones:', strategy.monte_carlo_simulation.risk_zones);
}
```

---

## 3. GPS Tracking Service

### Race Recording (1Hz)

```typescript
import { GPSTrackingService } from '@/src/services';

// Start tracking at race start
await GPSTrackingService.startTracking(userId, raceId);

// Set wind direction for VMG calculations
GPSTrackingService.setWindDirection(90); // degrees true

// Check status
const isRecording = GPSTrackingService.isTracking();
const currentTrack = GPSTrackingService.getCurrentTrack();

// Monitor in real-time
if (currentTrack) {
  console.log(`Points: ${currentTrack.points.length}`);
  console.log(`Distance: ${currentTrack.distance_nm.toFixed(2)}nm`);
  console.log(`Avg speed: ${currentTrack.average_speed.toFixed(1)}kts`);
  console.log(`Max speed: ${currentTrack.max_speed.toFixed(1)}kts`);
}

// Stop tracking at finish
const track = await GPSTrackingService.stopTracking();
```

### Track Analysis

```typescript
// Analyze completed track
const analysis = await GPSTrackingService.analyzeTrack(track);

// Performance metrics
console.log('Total distance:', analysis.total_distance, 'nm');
console.log('Average speed:', analysis.average_speed, 'kts');
console.log('Max speed:', analysis.max_speed, 'kts');

// Maneuvers
console.log('Tacks:', analysis.total_tacks);
console.log('Gybes:', analysis.total_gybes);

// Upwind performance
console.log('Upwind VMG:', analysis.upwind_performance.average_vmg);
console.log('Optimal angle:', analysis.upwind_performance.optimal_angle);
console.log('Consistency:', analysis.upwind_performance.consistency_score);

// Downwind performance
console.log('Downwind VMG:', analysis.downwind_performance.average_vmg);
console.log('Consistency:', analysis.downwind_performance.consistency_score);

// Speed by point of sail
console.log('Close hauled:', analysis.speed_by_point_of_sail.close_hauled);
console.log('Reaching:', analysis.speed_by_point_of_sail.reaching);
console.log('Running:', analysis.speed_by_point_of_sail.running);
```

---

## 4. Offline Service

### Initialization

```typescript
import { OfflineService } from '@/src/services';

// Initialize at app startup
await OfflineService.initialize();

// Service automatically:
// - Monitors network status
// - Syncs when online
// - Caches venues, strategies, tracks
// - Cleans up expired data
```

### Venue Caching

```typescript
// Set home venue (cached permanently)
await OfflineService.setHomeVenue(venue, intelligence, weather);

// Cache visited venue (cached for 30 days, max 10 venues)
await OfflineService.cacheVenue(venue, intelligence, weather, false);

// Retrieve cached venue
const cachedVenue = await OfflineService.getCachedVenue(venueId);

if (cachedVenue) {
  console.log('Venue:', cachedVenue.venue.name);
  console.log('Cached at:', cachedVenue.cached_at);
  console.log('Is home:', cachedVenue.is_home);
  console.log('Priority:', cachedVenue.priority);
}

// Get all cached venues
const venues = await OfflineService.getCachedVenues();
console.log(`${venues.length} venues cached`);

// Get home venue
const homeVenue = await OfflineService.getHomeVenue();
```

### Offline Strategy Management

```typescript
// Save strategy (works offline)
await OfflineService.cacheStrategy(strategy);

// Get all cached strategies
const strategies = await OfflineService.getCachedStrategies();

strategies.forEach(s => {
  console.log('Strategy:', s.strategy.course_id);
  console.log('Synced:', s.synced);
  console.log('Modified offline:', s.modified_offline);
});
```

### Track Caching

```typescript
// Save track (works offline)
await OfflineService.cacheTrack(track);

// Get all cached tracks
const tracks = await OfflineService.getCachedTracks();

tracks.forEach(t => {
  console.log('Track:', t.track.id);
  console.log('Synced:', t.synced);
  console.log('Distance:', t.track.distance_nm, 'nm');
});
```

### Sync Management

```typescript
// Manual sync
const syncStatus = await OfflineService.syncAll();

console.log('Venues:', syncStatus.venues);
console.log('Strategies:', syncStatus.strategies);
console.log('Tracks:', syncStatus.tracks);
console.log('Conflicts:', syncStatus.conflicts);

// Check sync status
const status = await OfflineService.getSyncStatus();

console.log(`Venues cached: ${status.venues.cached}`);
console.log(`Strategies pending: ${status.strategies.pending_sync}`);
console.log(`Tracks pending: ${status.tracks.pending_sync}`);
console.log(`Last sync: ${status.venues.last_sync}`);

// Check online status
const isOnline = OfflineService.isOnlineNow();
```

### Conflict Resolution

```typescript
// Get sync status with conflicts
const status = await OfflineService.getSyncStatus();

if (status.conflicts.length > 0) {
  status.conflicts.forEach(conflict => {
    console.log('Type:', conflict.type);
    console.log('ID:', conflict.id);
    console.log('Local version:', conflict.local_version);
    console.log('Remote version:', conflict.remote_version);
    console.log('Resolution:', conflict.resolution_strategy);

    // Default: server wins ('keep_remote')
    // Can implement custom resolution logic here
  });
}
```

---

## Complete User Flow Example

### Sailor Arriving at New Venue

```typescript
import {
  VenueService,
  AIStrategyService,
  GPSTrackingService,
  OfflineService
} from '@/src/services';

async function sailorWorkflow(userId: string) {
  // 1. DETECT VENUE
  const detection = await VenueService.detectVenueFromGPS(userId, 50);

  if (!detection.venue) {
    console.log('No venue detected - searching manually...');
    return;
  }

  // 2. SWITCH VENUE (with regional adaptation)
  const switchResult = await VenueService.switchVenue(
    detection.venue.id,
    userId,
    { cacheOffline: true, loadIntelligence: true }
  );

  // Show cultural briefing
  console.log('📋 Cultural Briefing:');
  switchResult.cultural_briefing.forEach(item => console.log(`  - ${item}`));

  // Apply regional adaptations
  console.log('\n🌍 Regional Adaptations:');
  console.log(`  Currency: ${switchResult.adaptations.currency}`);
  console.log(`  Timezone: ${switchResult.adaptations.timezone}`);
  console.log(`  Weather: ${switchResult.adaptations.weather_sources.join(', ')}`);

  // 3. PROCESS SAILING INSTRUCTIONS
  const { course, strategy } = await AIStrategyService.selectDocumentAndGenerateStrategy(
    {
      tier: 'championship',
      venueId: detection.venue.id,
      userPreferences: {
        risk_tolerance: 'moderate',
        focus_areas: ['speed', 'tactics']
      }
    },
    userId
  );

  console.log('\n📄 Course Extracted:');
  console.log(`  ${course.course_name} (${course.marks.length} marks)`);
  console.log(`  Confidence: ${course.confidence_score}%`);

  console.log('\n🎯 Strategy Generated:');
  console.log(`  Pre-start: ${strategy.pre_start_plan.positioning}`);
  console.log(`  Upwind: ${strategy.upwind_strategy.favored_side} side favored`);
  console.log(`  Confidence: ${strategy.confidence_score}%`);

  if (strategy.monte_carlo_simulation) {
    console.log(`  Win probability: ${(strategy.monte_carlo_simulation.win_probability * 100).toFixed(1)}%`);
  }

  // 4. RACE DAY - START GPS TRACKING
  await GPSTrackingService.startTracking(userId, raceId);
  GPSTrackingService.setWindDirection(course.wind_conditions.expected_direction);

  console.log('\n📍 GPS Tracking started at 1Hz');

  // ... race happens ...

  // 5. FINISH - STOP TRACKING & ANALYZE
  const track = await GPSTrackingService.stopTracking();
  const analysis = await GPSTrackingService.analyzeTrack(track!);

  console.log('\n📊 Race Analysis:');
  console.log(`  Distance: ${analysis.total_distance.toFixed(2)}nm`);
  console.log(`  Avg speed: ${analysis.average_speed.toFixed(1)}kts`);
  console.log(`  Upwind VMG: ${analysis.upwind_performance.average_vmg.toFixed(1)}kts`);
  console.log(`  Tacks: ${analysis.total_tacks}, Gybes: ${analysis.total_gybes}`);

  // 6. SYNC EVERYTHING (works offline)
  const syncStatus = await OfflineService.syncAll();

  console.log('\n🔄 Sync Status:');
  console.log(`  Strategies pending: ${syncStatus.strategies.pending_sync}`);
  console.log(`  Tracks pending: ${syncStatus.tracks.pending_sync}`);
  console.log(`  Conflicts: ${syncStatus.conflicts.length}`);
}
```

---

## Service Architecture

### Data Flow

```
GPS Location → VenueService → Detect Venue
                    ↓
              Switch Venue → Regional Adaptation
                    ↓
         Cache Offline (OfflineService)
                    ↓
   Sailing Instructions → AIStrategyService → Parse PDF
                    ↓
              Extract Course → Generate Strategy
                    ↓
         Cache Strategy (OfflineService)
                    ↓
        Race Start → GPSTrackingService → 1Hz Recording
                    ↓
              Calculate VMG → Track Analysis
                    ↓
         Cache Track (OfflineService)
                    ↓
              Sync All → Handle Conflicts
```

### Offline Capabilities

| Feature | Offline Support | Sync Behavior |
|---------|----------------|---------------|
| Venue detection | ✅ (cached venues) | Read-only |
| Venue intelligence | ✅ (home + last 10) | Read-only |
| Document parsing | ❌ (requires AI) | N/A |
| Strategy generation | ❌ (requires AI) | N/A |
| Strategy storage | ✅ | Auto-sync when online |
| GPS tracking | ✅ | Auto-upload when online |
| Track analysis | ✅ | Local processing |

### Cache Retention

- **Home venue**: Permanent (user-selected)
- **Visited venues**: 30 days, max 10 venues
- **Strategies**: Until synced
- **Tracks**: Until synced
- **Auto cleanup**: Every app startup

---

## Configuration

### Venue Cache Settings

Edit `src/services/offlineService.ts`:

```typescript
const CACHE_CONFIG = {
  MAX_VENUES: 10,           // Max cached venues
  VENUE_TTL_DAYS: 30,       // Venue cache lifetime
  HOME_VENUE_PERMANENT: true,
  SYNC_INTERVAL_MS: 60000,  // 1 minute
  BATCH_SIZE: 10
};
```

### GPS Tracking Settings

Edit `src/services/gpsService.ts`:

```typescript
Location.watchPositionAsync({
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000, // 1Hz = 1000ms
  distanceInterval: 0
})
```

### Regional Weather Sources

Edit `src/services/venueService.ts`:

```typescript
const REGIONAL_WEATHER_SOURCES = {
  'north-america': ['NOAA', 'Environment_Canada'],
  'europe': ['ECMWF', 'Met_Office'],
  'asia-pacific': ['JMA', 'Hong_Kong_Observatory', 'BOM']
};
```

---

## Testing

### Test Venue Detection

```typescript
// Test GPS detection
const result = await VenueService.detectVenueFromGPS(userId, 50);
console.assert(result.venue !== null, 'Should detect venue');
console.assert(result.confidence > 50, 'Should have good confidence');
```

### Test Strategy Generation

```typescript
// Test document parsing
const course = await AIStrategyService.parseSailingInstructions(testDocUri);
console.assert(course.marks.length > 0, 'Should extract marks');
console.assert(course.confidence_score > 60, 'Should have good confidence');
```

### Test GPS Tracking

```typescript
// Test tracking
await GPSTrackingService.startTracking(userId);
await new Promise(r => setTimeout(r, 5000)); // Record 5 seconds
const track = await GPSTrackingService.stopTracking();
console.assert(track.points.length >= 5, 'Should record ~5 points at 1Hz');
```

### Test Offline Sync

```typescript
// Test offline caching
await OfflineService.cacheVenue(venue);
const cached = await OfflineService.getCachedVenue(venue.id);
console.assert(cached !== null, 'Should cache venue');

const status = await OfflineService.getSyncStatus();
console.log('Sync status:', status);
```

---

## Performance Considerations

### GPS Tracking
- 1Hz sampling = 3600 points/hour
- Each point ~100 bytes = 360KB/hour
- Race duration: 1-2 hours = 360-720KB per track
- Compression recommended for upload

### Venue Caching
- Full venue data: ~50KB
- 10 cached venues: ~500KB
- Home venue permanent: ~50KB
- Total storage: <1MB

### AI Processing
- Document parsing: 5-10 seconds
- Strategy generation: 10-20 seconds
- Monte Carlo (Championship): +30 seconds
- Total workflow: ~45 seconds end-to-end

### Offline Sync
- Batch size: 10 items
- Sync interval: 1 minute
- Conflict resolution: Automatic (server wins)
- Manual sync: Available in settings

---

## Implementation Status

✅ **Completed**
- Venue intelligence service
- GPS-based venue detection
- Regional adaptation system
- AI strategy service
- Document processing (Gemini)
- Course extraction
- Strategy generation
- Monte Carlo simulation (Championship)
- GPS tracking service
- 1Hz race recording
- VMG calculations
- Track analysis
- Offline service
- Smart venue caching
- Strategy/track sync
- Conflict handling

🚀 **Ready for Integration**

All core services are implemented and ready to use. See integration examples above.

---

*Built with Expo, React Native, Supabase, Google AI (Gemini), and Anthropic Claude*
