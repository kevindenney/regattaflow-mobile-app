# Real Weather Data - Troubleshooting & Next Steps

## Current Status

### ✅ What's Working
1. **Weather API**: Confirmed working with test script
   - Fetching real Hong Kong data (19 knots)
   - Timestamp-aware forecasting functional

2. **Code Fixes**: Applied coordinate format handling
   - `RegionalWeatherService.ts:385-393` handles both array/object formats

3. **Database**: Port Shelter coordinates added
   - `racing_area_coordinates: {lat: 22.275, lng: 114.15}`

4. **Enrichment Flow**: Attempting to fetch
   - Console logs show: "Fetching weather for Corinthian 3 & 4 at Port Shelter"
   - Venue lookup initiated: "Looking up venue: Port Shelter"
5. **Fallback Provider**: OpenWeatherMap integration added
   - Configure `EXPO_PUBLIC_OPENWEATHERMAP_API_KEY` for low-cost backup weather data
   - Professional services automatically fall back when Storm Glass quota/errors occur

### ❌ Still Broken
**API requests show `q=undefined,undefined`** instead of real coordinates

## Root Cause Analysis

### Issue: Venue Lookup Not Completing

The enrichment flow in `hooks/useEnrichedRaces.ts` calls:
```typescript
RaceWeatherService.fetchWeatherByVenueName('Port Shelter', raceDate)
```

This should:
1. ✅ Query `sailing_venues` table for "Port Shelter"
2. ❓ Return venue with coordinates
3. ❓ Pass to `RegionalWeatherService`
4. ❌ Result: coordinates still `undefined`

### Possible Causes

1. **Venue Lookup Timeout** (5 second timeout in code)
   - Database query taking too long?
   - Network issue?

2. **Venue Not Found**
   - Name mismatch between "Port Shelter" in race vs. sailing_venues table
   - Case sensitivity?

3. **Coordinate Extraction Failing**
   - Venue found but coordinates not properly extracted
   - Column names mismatch (`coordinates_lat` vs `lat`)?

## Diagnostic Steps

### 1. Test Venue Lookup Directly

Run in terminal:
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

supabase
  .from('sailing_venues')
  .select('*, time_zone')
  .ilike('name', '%Port Shelter%')
  .limit(1)
  .then(({ data, error }) => {
    console.log('Query result:', JSON.stringify({ data, error }, null, 2));
  });
"
```

Expected result: Should return venue with `coordinates_lat` and `coordinates_lng`

### 2. Add More Logging

In `services/RaceWeatherService.ts:262`, add after venue query:
```typescript
console.log('[RaceWeatherService] Venue query completed', {
  venues: venues?.length,
  error,
  firstVenue: venues?.[0]
});
```

### 3. Check Venue Object Structure

The code converts DB venue to `SailingVenue` type at line 280-295.
Verify coordinate mapping:
```typescript
coordinates: {
  lat: venue.coordinates_lat,  // ← Column name must match
  lng: venue.coordinates_lng,  // ← Column name must match
}
```

### 4. Bypass Venue Lookup (Quick Test)

To test if the weather API works with direct coordinates, modify `useEnrichedRaces.ts:193`:
```typescript
// TEMPORARY TEST - Replace venue lookup with direct coordinates
const weather = await RaceWeatherService.fetchWeatherByCoordinates(
  22.275,  // Port Shelter lat
  114.15,  // Port Shelter lng
  raceDate,
  'Port Shelter',
  { warningSignalTime: warningSignal }
);
```

## Recommended Fix Path

### Option A: Fix Venue Lookup (Proper Solution)
1. Add detailed logging to `RaceWeatherService.fetchWeatherByVenueName()`
2. Verify sailing_venues table structure matches expectations
3. Fix any column name mismatches
4. Increase timeout if needed

### Option B: Use Direct Coordinates (Quick Win)
Since races already have `racing_area_coordinates` in metadata:
1. Modify enrichment to use `metadata.racing_area_coordinates` directly
2. Skip venue lookup entirely for races with coordinates
3. Fall back to venue lookup only if coordinates missing

```typescript
// In useEnrichedRaces.ts
const coords = regatta.metadata?.racing_area_coordinates;
if (coords?.lat && coords?.lng) {
  // Use direct coordinates
  const weather = await RaceWeatherService.fetchWeatherByCoordinates(
    coords.lat, coords.lng, raceDate, venueName, { warningSignalTime }
  );
} else {
  // Fall back to venue lookup
  const weather = await RaceWeatherService.fetchWeatherByVenueName(
    venueName, raceDate, { warningSignalTime }
  );
}
```

### Option C: Hybrid Approach (Best)
1. Try direct coordinates first (from race metadata)
2. Fall back to venue lookup if not available
3. Cache venue coordinates in race metadata after successful lookup

## Quick Test Commands

```bash
# Verify database has venue
node -e "require('./scripts/check-venue.mjs')"

# Test weather API directly
node test-weather-api.mjs

# Check what's actually in the race
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('regattas').select('metadata').eq('id', '2972ea48-6893-4833-950c-ce8f78d073f0').single()
  .then(({data}) => console.log(JSON.stringify(data?.metadata, null, 2)));
"
```

## Expected Timeline

- **Option B (Quick Win)**: 15 minutes - Use `racing_area_coordinates` directly
- **Option A (Proper Fix)**: 1-2 hours - Debug venue lookup + test thoroughly
- **Option C (Best)**: 2-3 hours - Implement hybrid with fallbacks

##Recommendation

**Start with Option B** to get weather working immediately, then refine with Option C for robustness.

---
**Next Action**: Implement Option B - use direct coordinates from race metadata
