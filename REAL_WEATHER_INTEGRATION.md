# Real Weather API Integration

## Overview

RegattaFlow now uses **real weather data** from weatherapi.com instead of mock/simulated data. This eliminates those absurdly precise measurements like `0.9809509007496541m` and provides accurate, professional-grade weather forecasts.

## What Changed

### 1. RegionalWeatherService Integration

**File**: `services/weather/RegionalWeatherService.ts`

- ✅ Now integrates with `WeatherAPIProService`
- ✅ Fetches real weather data from weatherapi.com API
- ✅ Falls back to simulated data if API key is missing
- ✅ Transforms API responses to match your app's data structures

**Key changes**:
- Added `WeatherAPIProService` instance
- Updated `generateVenueSpecificForecast()` to call real API
- Realistic precision: Wave heights like `0.8m` instead of `0.9809509007496541m`

### 2. Environment Configuration

**File**: `app.config.js` (created)

- ✅ Exposes `WEATHER_API_KEY` from `.env` via `Constants.expoConfig.extra`
- ✅ Maintains backward compatibility with existing environment variables
- ✅ Replaces static `app.json` with dynamic configuration

### 3. Debug Screen

**File**: `app/debug/weather-test.tsx` (new)

- ✅ Test real weather API integration
- ✅ Visual verification of data source and precision
- ✅ Displays wind, waves, temperature, pressure
- ✅ Shows raw JSON for debugging

## Setup Instructions

### Step 1: Get Weather API Key

1. Go to https://www.weatherapi.com/
2. Sign up for a **free account**
3. Get your API key from the dashboard
4. Free tier includes:
   - 1 million calls/month
   - 3-day forecast
   - Real-time weather
   - Marine data

### Step 2: Update .env File

Add your API key to `.env`:

```bash
# Weather APIs
WEATHER_API_KEY=your_actual_api_key_here
```

**Important**: The key is `WEATHER_API_KEY` (not `EXPO_PUBLIC_WEATHER_API_KEY`) because it's accessed server-side via `app.config.js`.

### Step 3: Restart Your App

```bash
# Stop the development server
# Then restart:
npm start
# or
npx expo start
```

**Why restart?** Environment variables are only loaded when the app starts. Expo needs to rebuild the app configuration.

### Step 4: Delete app.json (Optional but Recommended)

Since we now use `app.config.js`, you can remove the old `app.json`:

```bash
rm app.json
```

The `app.config.js` file is more flexible and allows dynamic configuration.

## Testing

### Option 1: Debug Screen (Recommended)

1. Navigate to `/debug/weather-test` in your app
2. Tap **"Fetch Weather Data"**
3. Verify:
   - ✅ Data source shows "WeatherAPI Pro" (not simulated)
   - ✅ Wave height has realistic precision (e.g., `0.8m`)
   - ✅ All weather metrics are present

### Option 2: Test with Real Race

1. Create a new race with a venue that has coordinates
2. View the race detail screen (`/race/scrollable/[id]`)
3. Check the "CONDITIONS" section in the Race Overview card
4. Verify realistic measurements

### Option 3: Console Logs

Look for these messages in your console:

```
✅ Success:
[RegionalWeatherService] Real weather API initialized

❌ Missing API key:
[RegionalWeatherService] No API key found - using simulated data. Set WEATHER_API_KEY in .env
```

## How It Works

### Data Flow

```
Race Screen
  ↓
useRaceWeather hook (hooks/useRaceWeather.ts)
  ↓
RegionalWeatherService.getVenueWeather()
  ↓
generateVenueSpecificForecast()
  ↓
WeatherAPIProService.getAdvancedForecast()
  ↓
weatherapi.com API
  ↓
Real weather data! 🎉
```

### Fallback Behavior

The service intelligently handles missing API keys:

1. **If API key exists**: Fetches real weather from weatherapi.com
2. **If API call fails**: Falls back to simulated data (with console warning)
3. **If no API key**: Uses venue-typical conditions (simulated)

This ensures your app always works, even without an API key.

## Verification Checklist

Use this checklist to verify real weather is working:

- [ ] Added `WEATHER_API_KEY` to `.env`
- [ ] Restarted development server
- [ ] See "Real weather API initialized" in console
- [ ] Debug screen shows "WeatherAPI Pro" as source
- [ ] Wave heights have 1 decimal place (e.g., `0.8m`)
- [ ] Wind speeds are whole numbers (e.g., `13 kts`)
- [ ] Temperature values are realistic for the venue

## Real vs. Mock Data Comparison

| Metric | Mock Data | Real Data |
|--------|-----------|-----------|
| Wave Height | `0.9809509007496541m` | `0.8m` |
| Wind Speed | Random ± variation | Actual forecast |
| Wind Direction | Pseudo-random | Real direction |
| Data Source | "Regional Weather Service" | "WeatherAPI Pro" |
| Reliability | Varies randomly | 85%+ from API |
| Precision | Too precise (floating point) | Rounded appropriately |

## Troubleshooting

### "No API key found" Warning

**Problem**: Console shows warning about missing API key

**Solution**:
1. Verify `WEATHER_API_KEY` is in your `.env` file
2. Make sure there are no quotes around the key value
3. Restart your development server
4. Check that `app.config.js` exists (not just `app.json`)

### Still Seeing Mock Data

**Problem**: Wave heights still show many decimal places

**Solution**:
1. Check the data source in debug screen
2. If it says "Regional Weather Service" instead of "WeatherAPI Pro", API isn't working
3. Verify API key is valid on weatherapi.com dashboard
4. Check console for API errors

### API Rate Limit

**Problem**: Getting errors after many requests

**Solution**:
1. Check your usage on weatherapi.com dashboard
2. Free tier: 1 million calls/month
3. RegionalWeatherService caches results for 30 minutes
4. Consider upgrading if needed

## API Coverage

weatherapi.com provides data for:

- ✅ Global coverage (every sailing venue)
- ✅ Wind speed, direction, gusts
- ✅ Wave height, period, direction
- ✅ Temperature (air and water estimate)
- ✅ Barometric pressure
- ✅ Humidity, visibility
- ✅ Cloud cover, precipitation
- ✅ 3-day forecast (free tier)

## Next Steps

Consider these enhancements:

1. **Add tide data**: Integrate with World Tides API for accurate tidal predictions
2. **Marine forecasts**: Use weatherapi.com's marine endpoint for better wave data
3. **Hourly forecasts**: Show conditions changing throughout race day
4. **Weather alerts**: Display gale warnings and small craft advisories
5. **Historical data**: Compare forecast accuracy with actual conditions

## Files Modified

- `services/weather/RegionalWeatherService.ts` - Real API integration
- `app.config.js` - Environment variable configuration (created)
- `app/debug/weather-test.tsx` - Debug screen (created)
- `.env.example` - Already had WEATHER_API_KEY placeholder

## Questions?

Check these resources:

- weatherapi.com documentation: https://www.weatherapi.com/docs/
- Expo Constants: https://docs.expo.dev/versions/latest/sdk/constants/
- RegattaFlow weather architecture: See `services/weather/RegionalWeatherService.ts`

---

**Status**: ✅ Real weather integration complete and ready for testing!
