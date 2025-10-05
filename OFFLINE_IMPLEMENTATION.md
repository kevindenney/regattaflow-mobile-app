# Offline-First Architecture Implementation

## Overview

RegattaFlow now features a robust offline-first architecture specifically designed for **race day reliability**. Sailors often experience poor connectivity on the water, so the app must work seamlessly offline while intelligently syncing when connectivity is restored.

## ✅ Offline Capabilities

### 1. Pre-Cache Essential Data

The app automatically caches critical race day data:

- **Next Race Details**: Course, strategy, race entries
- **Venue Intelligence**: Wind patterns, tide data, regional knowledge
- **Tuning Guides**: Boat-specific setup instructions
- **Weather Conditions**: Last known weather snapshot

### 2. Race Day Features (Offline)

✅ **Fully Functional Offline:**
- GPS tracking (device-native, works offline)
- Race timer and countdown
- Course visualization (cached data)
- Tactical laylines (from cached wind)
- Strategy display
- Log tacks/gybes
- View tuning guides

⚠️ **Limited Offline:**
- Weather updates (cached only, 6-hour expiry)

❌ **Online Only:**
- Real-time fleet positions
- Live leaderboard
- Weather forecast updates

### 3. Smart Sync Strategy

**Priority Queue:**
1. **Priority 1** (Highest): Race data, GPS tracks
2. **Priority 2**: Photos
3. **Priority 3**: Analytics

**Sync Triggers:**
- Automatic when app comes back online
- Manual "Force Sync Now" button
- Background sync when app is backgrounded

**Conflict Resolution:**
- Client timestamp wins (race day data is authoritative)
- Retry failed items up to 5 times
- Show failed item count with manual retry option

## 🗂️ Cache Strategy

| Data Type | Duration | Priority |
|-----------|----------|----------|
| Home Venue | Permanent | `permanent` |
| Recent Venues | 30 days | `venue` |
| Next Race | Until race complete | `race` |
| Weather | 6 hours | `temporary` |
| GPS Tracks | Until uploaded | N/A (sync queue) |

## 📦 Implementation

### Core Service

**`src/services/offlineService.ts`**
- Network status monitoring via NetInfo
- AsyncStorage for local caching
- Sync queue with priority ordering
- Automatic retry logic
- Cache expiration management

### React Hook

**`src/hooks/useOffline.ts`**
```typescript
const {
  isOnline,
  isSyncing,
  queueLength,
  failedItems,
  
  // Cache methods
  cacheNextRace,
  cacheVenue,
  setHomeVenue,
  
  // Race day operations
  saveGPSTrack,
  logRaceEvent,
  
  // Sync control
  forceSyncNow,
} = useOffline();
```

### UI Components

**`src/components/ui/OfflineIndicator.tsx`**
- Shows offline/online status
- Displays sync progress
- Shows pending queue count
- Retry button for failed items

**`src/components/ui/CachedBadge.tsx`**
- "📦 Cached" badge on cards when offline
- Indicates data source (cached vs live)

## 🚀 Usage Examples

### 1. Auto-Cache Next Race (Dashboard)

```typescript
import { useOffline } from '@/src/hooks/useOffline';

const { cacheNextRace } = useOffline();

useEffect(() => {
  if (nextRace && user) {
    cacheNextRace(nextRace.id, user.id);
  }
}, [nextRace, user]);
```

### 2. Log Race Events Offline

```typescript
import { useOffline } from '@/src/hooks/useOffline';

const { logRaceEvent } = useOffline();

const handleTack = async () => {
  await logRaceEvent(raceId, {
    type: 'tack',
    timestamp: Date.now(),
    position: { lat, lng },
  });
};
```

### 3. Save GPS Tracks Offline

```typescript
import { useOffline } from '@/src/hooks/useOffline';

const { saveGPSTrack } = useOffline();

const handleGPSUpdate = async (track) => {
  await saveGPSTrack(raceId, track);
};
```

### 4. Show Offline Status

```typescript
import { OfflineIndicator } from '@/src/components/ui/OfflineIndicator';

<View className="header">
  <OfflineIndicator />
  <Text>Dashboard</Text>
</View>
```

### 5. Indicate Cached Data

```typescript
import { CachedBadge } from '@/src/components/ui/OfflineIndicator';

<Card>
  <View className="flex-row justify-between">
    <Text>Race Strategy</Text>
    <CachedBadge />
  </View>
  {/* ... strategy content ... */}
</Card>
```

## 🧪 Testing

### Manual Testing Steps

1. **Enable Offline Mode:**
   ```bash
   # iOS: Enable Airplane Mode
   # Android: Enable Airplane Mode
   ```

2. **Test Offline Features:**
   - Start race timer ✅
   - Log tacks/gybes ✅
   - View cached strategy ✅
   - View cached tuning guides ✅
   - Check GPS tracking still works ✅

3. **Test Sync:**
   - Disable Airplane Mode
   - Check OfflineIndicator shows "⬆️ Syncing..."
   - Verify data appears in Supabase
   - Confirm sync queue clears

4. **Test Failed Sync:**
   - Enable Airplane Mode
   - Log race event
   - Enable WiFi (but disconnect internet)
   - Check "Retry failed" button appears
   - Reconnect internet
   - Click "Retry" button

### Automated Testing

```typescript
import { offlineService } from '@/src/services/offlineService';

describe('Offline Service', () => {
  it('should cache race data', async () => {
    await offlineService.cacheNextRace(raceId, userId);
    const cached = await offlineService.getCachedRace(raceId);
    expect(cached).toBeTruthy();
  });

  it('should queue offline actions', async () => {
    await offlineService.logRaceEvent(raceId, event);
    const status = await offlineService.getOfflineStatus();
    expect(status.queueLength).toBeGreaterThan(0);
  });
});
```

## 📊 Storage Keys

```typescript
const STORAGE_KEYS = {
  CACHED_RACES: '@regattaflow/cached_races',
  CACHED_VENUES: '@regattaflow/cached_venues',
  CACHED_STRATEGIES: '@regattaflow/cached_strategies',
  CACHED_TUNING_GUIDES: '@regattaflow/cached_tuning_guides',
  CACHED_WEATHER: '@regattaflow/cached_weather',
  GPS_TRACKS: '@regattaflow/gps_tracks',
  RACE_LOGS: '@regattaflow/race_logs',
  SYNC_QUEUE: '@regattaflow/sync_queue',
  HOME_VENUE: '@regattaflow/home_venue',
  LAST_SYNC: '@regattaflow/last_sync',
};
```

## 🔧 Configuration

### Cache Durations

```typescript
const CACHE_DURATION = {
  HOME_VENUE: Infinity,              // Permanent
  RECENT_VENUE: 30 * 24 * 60 * 60 * 1000,  // 30 days
  NEXT_RACE: Infinity,               // Until race complete
  WEATHER: 6 * 60 * 60 * 1000,       // 6 hours
  GPS_TRACK: Infinity,               // Until uploaded
};
```

### Sync Priorities

```typescript
const SYNC_PRIORITIES = {
  GPS_TRACK: 1,     // Highest priority
  RACE_LOG: 1,      // Highest priority
  RACE_RESULT: 2,   // High priority
  PHOTO: 3,         // Medium priority
  ANALYTICS: 5,     // Lowest priority
};
```

### Retry Configuration

- **Max Retries**: 5 attempts
- **Retry Delay**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Failed Item Threshold**: Show retry UI after 3 failed attempts

## 🚨 Known Limitations

1. **Photo Upload Size**: Large photos (>10MB) may timeout on slow connections
2. **GPS Precision**: Device GPS accuracy varies (typically ±5-10m)
3. **Storage Limits**: AsyncStorage has ~6MB limit on iOS, ~10MB on Android
4. **Background Sync**: iOS limits background sync to ~30 seconds

## 🔮 Future Enhancements

1. **Predictive Caching**: Use race calendar to pre-cache upcoming events
2. **Peer-to-Peer Sync**: Share data with nearby devices via Bluetooth
3. **Selective Sync**: User chooses what to sync (photos vs data)
4. **Storage Management**: Auto-clear old cache when storage is low
5. **Offline Maps**: Download venue charts for offline use

## 📝 Migration Notes

### Existing Code

If you have existing code that needs offline support:

```typescript
// Before (online only)
const { data } = await supabase.from('regattas').select('*');

// After (offline-first)
const { getCachedRace, isOnline } = useOffline();
const { data } = await supabase.from('regattas').select('*');

// Use cached data as fallback
if (!isOnline) {
  const cached = await getCachedRace(raceId);
  if (cached) return cached;
}
```

### Database Schema

No database changes required. Offline service uses:
- Existing `regattas` table
- Existing `race_strategies` table
- Existing `gps_tracks` table (needs to exist)
- Existing `race_logs` table (needs to exist)

## 🎯 Race Day Checklist

**Before Race Day:**
- [ ] Set home venue (permanent cache)
- [ ] Open dashboard to auto-cache next race
- [ ] Verify venue intelligence loaded
- [ ] Check tuning guides available offline
- [ ] Test offline mode once

**During Race:**
- [ ] GPS tracking automatically saves offline
- [ ] Log tacks/gybes (queued for sync)
- [ ] View cached strategy and tuning guides
- [ ] Check offline indicator for sync status

**After Race:**
- [ ] Reconnect to WiFi/cellular
- [ ] Verify sync complete (check indicator)
- [ ] Review synced data in dashboard
- [ ] Clear expired cache (optional)

---

**Implementation Status**: ✅ Complete (October 3, 2025)

**Dependencies**: 
- `@react-native-async-storage/async-storage` v2.2.0
- `@react-native-community/netinfo` v11.4.1
