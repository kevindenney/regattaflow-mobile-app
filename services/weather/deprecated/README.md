# Deprecated Weather Services

This folder contains weather services that have been deprecated and replaced with Open-Meteo API integration.

## Migration Date
November 4, 2025

## Why These Services Were Deprecated

These services were consolidated into an Open-Meteo API integration to:
- **Eliminate API costs**: Open-Meteo is completely free
- **Improve data quality**: Open-Meteo aggregates data from multiple authoritative weather models
- **Simplify maintenance**: One API to manage instead of 3+ separate integrations
- **Better reliability**: Built-in multi-model support

## Deprecated Services

### WeatherAPIProService.ts
- **Replaced by**: `OpenMeteoService.ts`
- **Original purpose**: Weather data (wind, waves, temperature, pressure, visibility)
- **Migration status**: Complete

### WorldTidesProService.ts
- **Replaced by**: Tide methods return null (no free tide provider available)
- **Original purpose**: Tide heights and extremes
- **Migration status**: Complete

## Current Implementation

The primary weather implementation is in:
- **Service**: `services/weather/OpenMeteoService.ts`

## Integration Points

All services and components now use Open-Meteo:
- `ProfessionalWeatherService.ts`
- `RegionalWeatherService.ts`
- `TidalIntelService.ts`
- `RaceWeatherService.ts` (via RegionalWeatherService)
- `VenueIntelligenceMapView.tsx`
- `ProfessionalMapScreen.tsx`
- `ProfessionalMap3DView.tsx`
- `app/(tabs)/map.tsx`
