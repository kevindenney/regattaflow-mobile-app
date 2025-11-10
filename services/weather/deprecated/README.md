# Deprecated Weather Services

This folder contains weather services that have been deprecated and replaced with Storm Glass API integration.

## Migration Date
November 4, 2025

## Why These Services Were Deprecated

These services were consolidated into a single Storm Glass API integration to:
- **Reduce API costs**: From €30-80/month across multiple services to €49/month for Storm Glass
- **Improve data quality**: Storm Glass aggregates data from multiple authoritative sources (NOAA, Météo-France, UK Met Office, DWD, FCOO, FMI, YR, SMHI)
- **Simplify maintenance**: One API to manage instead of 3+ separate integrations
- **Better reliability**: Built-in multi-source redundancy and AI-powered source selection

## Deprecated Services

### WeatherAPIProService.ts
- **Replaced by**: `StormGlassService.ts`
- **Original purpose**: Weather data (wind, waves, temperature, pressure, visibility)
- **Migration status**: ✅ Complete - All components updated to use Storm Glass

### WorldTidesProService.ts
- **Replaced by**: `StormGlassService.ts` (tide methods)
- **Original purpose**: Tide heights and extremes
- **Migration status**: ✅ Complete - TidalIntelService now uses Storm Glass

## Current Storm Glass Implementation

The new unified implementation is in:
- **Service**: `services/weather/StormGlassService.ts` (544 lines)
- **Types**: `lib/types/stormglass.ts` (200+ lines)
- **Test script**: `scripts/test-stormglass.mjs`

## Integration Points

All services and components now use Storm Glass:
- ✅ `ProfessionalWeatherService.ts`
- ✅ `RegionalWeatherService.ts`
- ✅ `TidalIntelService.ts`
- ✅ `RaceWeatherService.ts` (via RegionalWeatherService)
- ✅ `VenueIntelligenceMapView.tsx`
- ✅ `ProfessionalMapScreen.tsx`
- ✅ `ProfessionalMap3DView.tsx`
- ✅ `app/(tabs)/map.tsx`

## Can These Files Be Deleted?

**Not yet.** Keep these files for 30 days as a reference in case:
1. Edge cases emerge that require referencing the old implementation
2. A rollback is needed (though unlikely)
3. Documentation of the old implementation is needed for troubleshooting

**After December 4, 2025**: These files can be safely deleted.

## Rollback Instructions

If you need to rollback to the old services:

1. Restore environment variables in `.env`:
   ```bash
   WEATHER_API_KEY=your_weatherapi_key
   WORLD_TIDES_API_KEY=your_worldtides_key
   ```

2. Move services back:
   ```bash
   git mv services/weather/deprecated/WeatherAPIProService.ts services/weather/
   git mv services/weather/deprecated/WorldTidesProService.ts services/tides/
   ```

3. Revert changes in:
   - `services/weather/ProfessionalWeatherService.ts`
   - `services/weather/RegionalWeatherService.ts`
   - `services/tides/TidalIntelService.ts`

4. Use git to find the commit before Storm Glass migration:
   ```bash
   git log --oneline --grep="Storm Glass"
   git revert <commit-hash>
   ```

## Storm Glass API Details

- **Base URL**: https://api.stormglass.io/v2
- **Documentation**: https://docs.stormglass.io
- **Plan**: Medium tier (€49/month, 5,000 requests/day)
- **Coverage**: Global marine weather data

## Questions?

See the full migration plan: `docs/STORMGLASS_MIGRATION_PLAN.md`
