# GPS Tracking Integration Specification

## Overview

RegattaFlow integrates with multiple GPS tracking systems to provide comprehensive race tracking and analysis capabilities.

## Supported Systems

### 1. Velocitek Devices ✅ Implemented

| Device | Accuracy | Features | Use Case |
|--------|----------|----------|----------|
| **SpeedPuck** | ~3m | Speed, heading | Training, club racing |
| **Shift** | ~3m | Speed, heading, timer | Racing, tactics |
| **ProStart** | ~3m | Start line bias, timer | Race starts |
| **RTK Puck** | **1.8cm** | Ultra-precise GPS | Race committee, marks |

#### Integration
```typescript
import { VelocitekParser } from '@/services/tracking';

const parser = new VelocitekParser();
const result = parser.parse(vccFileData);

if (result.success) {
  const track = result.tracks[0];
  console.log(`Imported ${track.points.length} points`);
}
```

#### Supported Formats
- `.vcc` - Velocitek Control Center binary format
- `.csv` - Velocitek CSV export

---

### 2. TracTrac Live Tracking ✅ Implemented

TracTrac provides real-time GPS tracking for spectators and race management at major events.

#### Features
- Real-time boat positions via WebSocket
- Historical track playback
- Multi-race support
- Viewer count analytics

#### Integration
```typescript
import { TracTracService } from '@/services/tracking';

const tracTrac = new TracTracService({
  apiKey: 'your-api-key',
  onUpdate: (update) => {
    console.log(`Boat ${update.boatId} at ${update.position.lat}, ${update.position.lng}`);
  }
});

// Connect to live event
tracTrac.connect('event-123', 'race-1');

// Get current positions
const boats = tracTrac.getBoatPositions();

// Disconnect when done
tracTrac.disconnect();
```

#### Events Using TracTrac
- America's Cup
- Volvo Ocean Race / The Ocean Race
- Dragon Class Championships
- Olympic sailing events
- SailGP

---

### 3. GPX File Import ✅ Implemented

Universal GPS exchange format, supported by virtually all GPS devices and apps.

#### Sources
- Smartphone GPS apps (Navionics, iRegatta, SailGrib)
- Marine chartplotters (Garmin, B&G, Simrad)
- Handheld GPS devices
- Other tracking systems

#### Integration
```typescript
import { GPXParser } from '@/services/tracking';

const parser = new GPXParser();
const result = parser.parse(gpxFileContent);

if (result.success) {
  result.tracks.forEach(track => {
    console.log(`Track: ${track.metadata?.name}`);
    console.log(`Points: ${track.points.length}`);
    console.log(`Duration: ${(track.endTime - track.startTime) / 1000}s`);
  });
}
```

---

### 4. Unified Tracking Service ✅ Implemented

Single interface for all tracking integrations.

```typescript
import TrackingService from '@/services/tracking';

const tracking = new TrackingService();

// Import any file format
const result = await tracking.importFile(file);

// Export to various formats
const gpx = tracking.exportTrack(track, { format: 'gpx' });
const csv = tracking.exportTrack(track, { format: 'csv', includeWind: true });

// Connect to live tracking
const tracTrac = tracking.connectLiveTracking({
  eventId: 'dragon-gold-cup-2024',
  onUpdate: handlePositionUpdate,
});

// Get track statistics
const stats = tracking.calculateStats(track);
console.log(`Max speed: ${stats.maxSpeed} knots`);
console.log(`Distance: ${stats.distance} nm`);
console.log(`Tacks: ${stats.tackCount}`);
```

---

## Additional Systems (Future)

### eStela
App-based tracking using smartphones. No additional hardware required.

**Status**: Planned
**API**: REST + WebSocket
**Website**: estela.co

### KWINDOO
Smartphone-based regatta tracking with real-time course updates.

**Status**: Planned
**API**: REST
**Website**: kwindoo.com

### TackTracker
Track analysis and replay platform, popular for coaching.

**Status**: Planned (import from TackTracker)
**File Format**: GPX with extensions
**Website**: tacktracker.com

### SafeTrx Flotilla
Safety-focused event tracking with SAR integration.

**Status**: Planned
**API**: REST
**Website**: safetrxapp.com

---

## Data Types

### TrackPoint
```typescript
interface TrackPoint {
  lat: number;           // Latitude
  lng: number;           // Longitude
  timestamp: number;     // Unix timestamp (ms)
  speed?: number;        // Speed in knots
  heading?: number;      // Heading (degrees true)
  cog?: number;          // Course over ground
  sog?: number;          // Speed over ground
  twa?: number;          // True wind angle
  tws?: number;          // True wind speed
  altitude?: number;     // Altitude in meters
}
```

### Track Statistics
```typescript
interface TrackStats {
  maxSpeed: number;      // Maximum speed (knots)
  avgSpeed: number;      // Average speed (knots)
  distance: number;      // Total distance (nm)
  duration: number;      // Duration (ms)
  vmgUp?: number;        // VMG upwind (knots)
  vmgDown?: number;      // VMG downwind (knots)
  tackCount?: number;    // Number of tacks
  gybeCount?: number;    // Number of gybes
}
```

---

## Dragon Class Integration

For Dragon Class events, the recommended tracking setup is:

### Club Racing
- **Device**: Velocitek SpeedPuck or Shift
- **Import**: Post-race VCC file import
- **Analysis**: Track overlay with competitors

### Championship Events
- **Live Tracking**: TracTrac (if available)
- **Backup**: eStela or KWINDOO
- **Race Committee**: Velocitek RTK Puck for precision marks

### Integration with Manage2Sail
1. Entries imported from Manage2Sail
2. Race tracked in RegattaFlow
3. Results exported back to Manage2Sail
4. Track data available for post-race analysis

---

## Implementation Status

| System | Parser | Live | Export | Status |
|--------|--------|------|--------|--------|
| Velocitek | ✅ | N/A | ✅ | Ready |
| TracTrac | ✅ | ✅ | N/A | Ready |
| GPX | ✅ | N/A | ✅ | Ready |
| eStela | ⏳ | ⏳ | N/A | Planned |
| KWINDOO | ⏳ | ⏳ | N/A | Planned |
| TackTracker | ⏳ | N/A | N/A | Planned |

---

## API Reference

See `services/tracking/types.ts` for complete type definitions.

