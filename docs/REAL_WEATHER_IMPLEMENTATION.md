# Real Weather Data Implementation for Race Cards

## Overview

Race cards in the `/races` tab now fetch and display **real weather data** from regional weather providers (NOAA, HKO, etc.) instead of using placeholder values.

## How It Works

### 1. Data Flow

```
useLiveRaces (raw regatta data)
    ↓
useEnrichedRaces (fetches real weather)
    ↓
Race Cards (displays real wind/tide data)
```

### 2. Components

#### `useEnrichedRaces` Hook
- **Location**: `hooks/useEnrichedRaces.ts`
- **Purpose**: Enriches race data with real weather from `RaceWeatherService`
- **Features**:
  - Fetches weather for races that don't have metadata
  - Caches results to avoid redundant API calls
  - Only fetches for races within 24 hours to 10 days
  - Gracefully falls back to default values on error

#### `RaceWeatherService`
- **Location**: `services/RaceWeatherService.ts`
- **Purpose**: Fetches weather data from regional providers
- **Key Method**: `fetchWeatherByVenueName(venueName, raceDate)`
  - Looks up venue in `sailing_venues` table
  - Uses venue coordinates to fetch from appropriate regional provider
  - Returns structured wind/tide metadata

### 3. Integration in `/races` Tab

**File**: `app/(tabs)/races.tsx`

```typescript
// Load raw race data
const { liveRaces } = useLiveRaces(user?.id);

// Enrich with real weather
const { races: enrichedRaces } = useEnrichedRaces(liveRaces || []);

// Use enriched races for display
const safeRecentRaces = useMemo(() => {
  if (enrichedRaces && enrichedRaces.length > 0) {
    return enrichedRaces;
  }
  return Array.isArray(recentRaces) ? recentRaces : [];
}, [enrichedRaces, recentRaces]);
```

## Weather Data Structure

### Wind Data
```typescript
{
  direction: string;    // e.g., "NE", "SW"
  speedMin: number;     // knots
  speedMax: number;     // knots
}
```

### Tide Data
```typescript
{
  state: 'flooding' | 'ebbing' | 'slack' | 'high' | 'low';
  height: number;       // meters
  direction?: string;   // optional current direction
}
```

## Weather Status Messages

Instead of showing fake placeholder data, race cards now display **informative messages** when real weather isn't available:

| Status | Message | When Shown |
|--------|---------|------------|
| `available` | Shows real wind/tide data | Weather successfully fetched |
| `loading` | "Loading forecast..." | Weather fetch in progress |
| `too_far` | "Forecast not yet available" | Race is >10 days away |
| `past` | "Race completed" | Race was >24 hours ago |
| `no_venue` | "No venue specified" | Venue name missing or "Venue TBD" |
| `unavailable` | "Forecast unavailable" | Venue not in database or provider error |
| `error` | "Unable to load forecast" | Network or API error |

### Before vs After

**Before (fake data):**
```
WIND: Variable 8-15kts
TIDE: slack 1m
```

**After (honest status):**
```
WIND: Forecast not yet available
TIDE: Forecast not yet available
```

**After (real data):**
```
WIND: NE 12-18kts
TIDE: flooding 1.8m → E
```

## Caching

The `useEnrichedRaces` hook maintains an in-memory cache keyed by:
```
{venueName}-{raceDate}
```

This prevents:
- Redundant API calls for the same race
- Re-fetching on component re-renders
- Excessive load on weather providers

## Venue Requirements

For weather data to work, the race must have:

1. **Venue name** in `regattas.metadata.venue_name`
2. **Matching entry** in `sailing_venues` table
3. **Valid coordinates** in the venue record

### Example Venue Entry

```sql
INSERT INTO sailing_venues (name, country, region, coordinates_lat, coordinates_lng)
VALUES ('Port Shelter', 'Hong Kong', 'asia-pacific', 22.35, 114.30);
```

## Regional Weather Providers

The system automatically selects the appropriate provider based on venue coordinates:

- **Hong Kong**: HKO (Hong Kong Observatory)
- **USA**: NOAA
- **Other regions**: Appropriate regional services

See `services/weather/RegionalWeatherService.ts` for the full list.

## Testing

To verify real weather is working:

1. **Check logs** for these messages:
   ```
   [useEnrichedRaces] Fetching weather for {race} at {venue}
   [useEnrichedRaces] ✓ Got real weather for {race}: NE 12-18kts
   ```

2. **Inspect race cards** - they should show:
   - Specific wind directions (not "Variable")
   - Variable wind speeds (not always 8-15)
   - Different tide states and heights

3. **Check database** - ensure races have:
   ```sql
   SELECT name, metadata->>'venue_name' as venue
   FROM regattas
   WHERE created_by = '{your-user-id}';
   ```

## Troubleshooting

### Weather not appearing?

1. **Check venue name**:
   ```sql
   SELECT * FROM sailing_venues WHERE name ILIKE '%{venue_name}%';
   ```

2. **Check race date** - must be within 24 hours to 10 days

3. **Check logs** for error messages

4. **Verify venue has coordinates**:
   ```sql
   SELECT name, coordinates_lat, coordinates_lng FROM sailing_venues;
   ```

### Still seeing "Variable 8-15kts"?

This indicates fallback values are being used. Check:
- Race is within valid time window
- Venue exists in database
- Weather provider is accessible

## Performance

- **Initial load**: Fetches weather for all visible races (~100-500ms per race)
- **Cached access**: Instant (no API calls)
- **Re-renders**: No additional fetches (uses memoization)

The hook fetches weather in parallel for all races, so displaying 10 races takes roughly the same time as displaying 1 race.

## Future Enhancements

Potential improvements:
1. Persist weather cache to AsyncStorage
2. Background refresh of weather data
3. Weather alerts/warnings display
4. Historical weather for past races
5. Weather trend graphs
