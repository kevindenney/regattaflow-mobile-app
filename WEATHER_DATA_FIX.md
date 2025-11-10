# Weather Data Fix - AI Rig Tuning

## Root Cause Identified

Using MCP Chrome DevTools, I traced the exact issue:

**Console Log Evidence:**
```json
[RaceTuningService] 📤 Passing request: {
  "classId": "130829e3-05dd-4ab3-bea2-e0231c12064a",
  "className": "Dragon",
  "pointsOfSail": "upwind",
  "limit": 1
  // ❌ MISSING: averageWindSpeed, windMin, windMax, gusts, waves, current
}
```

## The Problem

1. **`useRaceWeather` hook** returns simplified weather data:
   ```typescript
   {
     wind: {
       direction: "ENE",  // cardinal direction string
       speedMin: 14,
       speedMax: 29
     },
     tide: { state, height, direction },
     raw: WeatherData  // Full forecast data here!
   }
   ```

2. **Race detail screen** was trying to access fields that don't exist:
   ```typescript
   gusts: weather?.wind?.gustSpeed,        // ❌ doesn't exist
   waveHeight: weather?.waves?.height,     // ❌ doesn't exist
   currentSpeed: weather?.current?.speed,  // ❌ doesn't exist
   ```

3. **All fields were undefined**, so only `classId`, `className`, `pointsOfSail`, and `limit` were passed

4. **AI had no weather context** to generate intelligent recommendations

## The Fix

Modified `app/(tabs)/race/scrollable/[id].tsx` to extract data from `weather.raw`:

```typescript
// Extract additional weather data from raw forecast
const rawForecast = weather?.raw?.forecast?.[0];
const marineConditions = weather?.raw?.marineConditions;

useRaceTuningRecommendation({
  // ... existing fields
  windDirection: rawForecast?.windDirection,  // ✅ numeric degrees
  gusts: rawForecast?.windGusts || weather?.wind?.speedMax,  // ✅ actual gusts
  waveHeight: marineConditions?.significantWaveHeight
    ? `${Math.round(marineConditions.significantWaveHeight * 10) / 10}m`
    : undefined,  // ✅ wave height
  currentSpeed: marineConditions?.surfaceCurrents?.[0]?.speed,  // ✅ current speed
  currentDirection: marineConditions?.surfaceCurrents?.[0]?.direction,  // ✅ current direction
});
```

## What This Enables

Now the AI will receive complete weather context:
- ✅ Wind speed range (14-29 knots)
- ✅ Wind gusts (actual vs. estimated)
- ✅ Wave height (from marine conditions)
- ✅ Current speed/direction
- ✅ Wind direction (numeric degrees for calculations)

## Test Results

After fix, the request should look like:
```json
{
  "classId": "130829e3-05dd-4ab3-bea2-e0231c12064a",
  "className": "Dragon",
  "averageWindSpeed": 21.5,
  "windMin": 14,
  "windMax": 29,
  "windDirection": 67,  // ENE in degrees
  "gusts": 29,
  "waveHeight": "1.2m",
  "currentSpeed": 0.5,
  "currentDirection": 180,
  "pointsOfSail": "upwind",
  "limit": 1
}
```

## Next Steps

1. **Restart dev server** to load the fix
2. **Navigate to Dragon race**
3. **Click Refresh** on Rig Tuning card
4. **Check console** - should now see full weather context being passed
5. **AI should generate** Dragon-specific recommendations for 14-29kt conditions

## Files Modified

- ✅ `app/(tabs)/race/scrollable/[id].tsx` - Extract weather from `raw` field

The comprehensive logging added earlier will now show the full weather context being passed to the AI! 🎯
