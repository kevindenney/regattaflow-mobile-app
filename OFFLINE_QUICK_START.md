# Offline-First Quick Start Guide

## What Was Implemented

✅ **Complete offline-first architecture for race day reliability**

### Core Files Created

1. **`src/services/offlineService.ts`** - Offline service with caching and sync
2. **`src/hooks/useOffline.ts`** - React hook for easy component integration
3. **`src/components/ui/OfflineIndicator.tsx`** - UI components for offline status

### Dashboard Integration

**`src/app/(tabs)/dashboard.tsx`** updated with:
- Offline indicator in header
- Auto-cache next race on load
- Offline status badge

## Key Features

### 1. Smart Caching
```typescript
// Automatically cache next race
const { cacheNextRace } = useOffline();
cacheNextRace(raceId, userId);

// Set permanent home venue cache
const { setHomeVenue } = useOffline();
setHomeVenue(venueId);
```

### 2. Offline Race Operations
```typescript
const { saveGPSTrack, logRaceEvent } = useOffline();

// Save GPS track (works offline)
saveGPSTrack(raceId, trackData);

// Log tacks/gybes (works offline)
logRaceEvent(raceId, { type: 'tack', timestamp: Date.now() });
```

### 3. Automatic Sync
- Syncs when app comes back online
- Priority queue (race data first)
- Retry failed items automatically
- Client timestamp wins conflicts

### 4. Offline UI
```typescript
import { OfflineIndicator, CachedBadge } from '@/src/components/ui/OfflineIndicator';

// Show offline status
<OfflineIndicator />

// Show cached data badge
<CachedBadge />
```

## Testing

### Test Offline Mode

1. **Enable Airplane Mode**
2. **Open Dashboard** - should show cached data
3. **Test Race Features:**
   - View race strategy ✅
   - View tuning guides ✅
   - Check GPS tracking works ✅
4. **Disable Airplane Mode**
5. **Check Sync** - OfflineIndicator shows "⬆️ Syncing..."

## Cache Strategy

| Data | Duration | Priority |
|------|----------|----------|
| Home Venue | Permanent | `permanent` |
| Recent Venues | 30 days | `venue` |
| Next Race | Until complete | `race` |
| Weather | 6 hours | `temporary` |

## Race Day Workflow

**Before Race:**
1. Open dashboard (auto-caches next race)
2. Set home venue (permanent cache)
3. Check OfflineIndicator shows data cached

**During Race (Offline):**
1. GPS tracking works automatically
2. Log tacks/gybes (queued for sync)
3. View cached strategy
4. View cached tuning guides

**After Race:**
1. Reconnect to network
2. Sync happens automatically
3. Check OfflineIndicator shows "✅ Synced"

## Next Steps

1. **Add to Race Timer Screen**
   ```typescript
   const { saveGPSTrack, logRaceEvent } = useOffline();
   ```

2. **Add to Tuning Guides Screen**
   ```typescript
   const { getCachedTuningGuides, isOnline } = useOffline();
   ```

3. **Add to Venue Screen**
   ```typescript
   const { cacheVenue, setHomeVenue } = useOffline();
   ```

## Documentation

See **`OFFLINE_IMPLEMENTATION.md`** for complete details:
- Full API reference
- Testing guide
- Migration notes
- Future enhancements

---

**Status**: ✅ Complete and Ready for Testing
**Dependencies**: Already installed (`@react-native-async-storage/async-storage`, `@react-native-community/netinfo`)
