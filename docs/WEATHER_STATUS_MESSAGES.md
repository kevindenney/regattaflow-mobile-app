# Weather Status Messages Implementation

## ✅ Complete - No More Fake Weather Data!

Race cards now show **honest, informative messages** instead of misleading placeholder values like "Variable 8-15kts".

## What Changed

### Before
```
WIND: Variable 8-15kts    ← Fake data
TIDE: slack 1m            ← Fake data
```

### After

**Race in 5 days (forecast available):**
```
WIND: NE 12-18kts         ← Real HKO forecast!
TIDE: flooding 1.8m → E   ← Real tidal data!
```

**Race in 15 days (too far in future):**
```
WIND: Forecast not yet available
TIDE: Forecast not yet available
```

**Race with no venue specified:**
```
WIND: No venue specified
TIDE: No venue specified
```

**Forecast fetch error:**
```
WIND: Unable to load forecast
TIDE: Unable to load forecast
```

## All Status Messages

| Status | Displayed Message | Trigger |
|--------|------------------|---------|
| `available` | Real data shown | Weather successfully fetched from provider |
| `loading` | "Loading forecast..." | Fetch in progress |
| `too_far` | "Forecast not yet available" | Race >10 days away |
| `past` | "Race completed" | Race >24 hours ago |
| `no_venue` | "No venue specified" | Missing venue or "Venue TBD" |
| `unavailable` | "Forecast unavailable" | Venue not in `sailing_venues` table |
| `error` | "Unable to load forecast" | Network error, API failure, etc. |

## Files Modified

1. **`hooks/useEnrichedRaces.ts`**
   - Added `weatherStatus` field to race objects
   - Returns `null` for wind/tide when unavailable
   - Sets appropriate status based on conditions

2. **`components/races/RaceCard.tsx`**
   - Updated to accept optional `wind`/`tide` and `weatherStatus`
   - Added `getWeatherStatusMessage()` helper function
   - Displays status messages when data is null
   - Added `detailValueMessage` style for italic, gray messages

3. **`docs/REAL_WEATHER_IMPLEMENTATION.md`**
   - Updated with status message documentation
   - Added before/after examples

## User Experience Benefits

### ✅ Transparency
Users now know exactly why forecast data isn't shown instead of seeing misleading fake numbers.

### ✅ Actionable Feedback
Messages help users understand what they can do:
- "No venue specified" → Add venue to race
- "Forecast not yet available" → Check back closer to race day
- "Unable to load forecast" → Try refresh button

### ✅ Trust
No more fake data eroding user confidence. System is honest about data availability.

## Technical Details

### Status Detection Logic

```typescript
// Race too far in future (>10 days)
if (hoursUntil > 240) {
  return { wind: null, tide: null, weatherStatus: 'too_far' };
}

// Race in past (>24 hours ago)
if (hoursUntil < -24) {
  return { wind: null, tide: null, weatherStatus: 'past' };
}

// No venue specified
if (!venueName || venueName === 'Venue TBD') {
  return { wind: null, tide: null, weatherStatus: 'no_venue' };
}

// Fetch succeeded
if (weather) {
  return { wind: weather.wind, tide: weather.tide, weatherStatus: 'available' };
}

// Fetch failed or no data
return { wind: null, tide: null, weatherStatus: 'unavailable' };
```

### Placeholder Detection

The hook detects and replaces old placeholder values:
```typescript
const isPlaceholderWind =
  wind.direction === 'Variable' &&
  wind.speedMin === 8 &&
  wind.speedMax === 15;

const isPlaceholderTide =
  tide.state === 'slack' &&
  tide.height === 1.0;
```

## Testing

To see the different states:

1. **Real forecast** - Create race 1-10 days out with valid venue
2. **Too far** - Create race >10 days out
3. **No venue** - Create race without venue or with "Venue TBD"
4. **Unavailable** - Create race with venue not in database
5. **Error** - Disconnect network and refresh

## Future Enhancements

Potential improvements:
- Add "Retry" button for error state
- Show last successful fetch timestamp
- Add loading spinner during fetch
- Cache and show stale data with "outdated" indicator
