# Storm Glass Weather API Migration Plan

**Status:** Phase 6 Complete (Deprecation)
**Created:** 2025-11-04
**Last Updated:** 2025-11-04
**Goal:** Consolidate all weather services into a single Storm Glass API integration

## Progress Summary

- ✅ **Phase 1**: Environment Setup (Complete)
- ✅ **Phase 2**: Storm Glass Integration (Complete)
- ✅ **Phase 3**: Service Refactoring (Complete)
- ✅ **Phase 4**: Service Integration (Complete)
- ✅ **Phase 5**: Component Updates (Complete)
- ✅ **Phase 6**: Deprecate Old Services (Complete)
- ⏸️ **Phase 7**: Integration Testing (Pending)
- ⏸️ **Phase 8**: Documentation (Pending)

---

## Executive Summary

We're migrating from multiple weather services (WeatherAPI.com, WorldTides, HKO, NOAA) to a single **Storm Glass API** that provides comprehensive marine data including weather, tides, currents, and waves.

**Benefits:**
- ✅ Single API key instead of 2-3 separate services
- ✅ Simplified codebase and reduced maintenance
- ✅ Cost reduction: €49/month vs €30-80/month for multiple services
- ✅ Better data quality: Multiple sources (NOAA, Météo-France, UK Met Office, etc.) with AI selection
- ✅ Comprehensive marine data: weather + tides + currents + waves in one API
- ✅ 5,000 requests/day (sufficient for our use case)

---

## Current State Analysis

### Services Currently Used

| Service | Purpose | Cost | Status |
|---------|---------|------|--------|
| **WeatherAPI.com** | Primary weather data | ~€19-49/month | Active |
| **WorldTides.info** | Tide predictions | ~€10-30/month | Active |
| **HKO** (Hong Kong Observatory) | Hong Kong regional data | Free | Active |
| **OpenWeatherMap** | Global fallback | Free tier | Active |
| **NOAA** | US weather data | Free | Active |
| **PredictWind** | Referenced but not implemented | N/A | Inactive |
| **Meteomatics** | Referenced but not implemented | N/A | Inactive |

### Services to Implement

| **Storm Glass** | All marine data | €49/month (Medium plan) | Migration Target |

### Files Currently Using Weather Services

```
services/
├── weather/
│   ├── WeatherAPIProService.ts          ← Replace
│   ├── ProfessionalWeatherService.ts    ← Update
│   ├── RegionalWeatherService.ts        ← Update
│   ├── OpenWeatherMapProvider.ts        ← Keep as fallback
│   ├── HKOWeatherProvider.ts            ← Keep for reference
│   └── WeatherAggregationService.ts     ← Update
├── tides/
│   ├── WorldTidesProService.ts          ← Replace
│   └── TidalIntelService.ts             ← Update
├── RaceWeatherService.ts                ← Update
└── RaceWeatherService.ts                ← Verify compatibility

components/
├── venue/VenueIntelligenceMapView.tsx   ← Update API key references
├── map/WeatherOverlay3D.tsx             ← Verify compatibility
├── map/ProfessionalMap3DView.tsx        ← Verify compatibility
└── race-detail/CurrentTideCard.tsx      ← Verify compatibility
```

---

## Storm Glass Capabilities

### Available Data Parameters

**Weather & Atmospheric:**
- ✅ Wind Speed, Direction, Gusts
- ✅ Air Temperature
- ✅ Atmospheric Pressure
- ✅ Humidity
- ✅ Cloud Cover
- ✅ Precipitation
- ✅ Visibility

**Marine Conditions:**
- ✅ Wave Height, Direction, Period
- ✅ Swell Height, Direction, Period (primary + secondary)
- ✅ Wind Waves (separate from swell)
- ✅ Water Temperature
- ✅ Ocean Currents (Speed & Direction)
- ✅ Ice Cover & Thickness

**Tides:**
- ✅ Tide Heights (continuous)
- ✅ Tide Extremes (high/low times)
- ✅ Tidal Station Information

**Data Sources:**
Storm Glass aggregates from: NOAA, Météo-France, UK Met Office, DWD, FCOO, FMI, YR, SMHI
- AI-powered source selection based on location and performance

### API Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /v2/weather/point` | Marine weather forecast | Hourly forecast up to 10 days |
| `GET /v2/tide/extremes/point` | Tide predictions | High/low times & heights |
| `GET /v2/tide/sea-level/point` | Continuous tide heights | Tide height at any time |
| `GET /v2/current/point` | Ocean currents | Current speed & direction |

### Pricing & Rate Limits

**Medium Plan (Recommended): €49/month**
- 5,000 requests per day (~166,667/month)
- All marine parameters included
- Multiple data sources
- 10-day forecast range
- Historical data access

**Rate Limiting Strategy:**
- Cache weather: 15-30 minutes
- Cache tides: 60 minutes (changes slowly)
- Estimated usage: ~500-1,000 requests/day
- Plenty of headroom for growth

---

## Implementation Plan

### Phase 1: Create Storm Glass Service

**Goal:** Build comprehensive Storm Glass API integration service

#### Tasks

- [ ] **1.1** Create `services/weather/StormGlassService.ts`
  - [ ] Define TypeScript interfaces matching Storm Glass API response
  - [ ] Implement weather endpoint integration (`/v2/weather/point`)
  - [ ] Implement tide extremes endpoint (`/v2/tide/extremes/point`)
  - [ ] Implement tide sea-level endpoint (`/v2/tide/sea-level/point`)
  - [ ] Implement currents endpoint (`/v2/current/point`) if available
  - [ ] Add caching layer (Map-based, 15-30min for weather, 60min for tides)
  - [ ] Add retry logic with exponential backoff
  - [ ] Add rate limit tracking
  - [ ] Add comprehensive error handling
  - [ ] Transform Storm Glass data to `AdvancedWeatherConditions` type

- [ ] **1.2** Create TypeScript types
  - [ ] Create `lib/types/stormglass.ts` for API response types
  - [ ] Ensure compatibility with existing `AdvancedWeatherConditions`
  - [ ] Add JSDoc comments for all types

- [ ] **1.3** Add utility methods
  - [ ] `getWeatherAtTime(location, timestamp)` - Get weather for specific time
  - [ ] `getTideExtremes(location, days)` - Get high/low tide times
  - [ ] `getCurrents(location, timestamp)` - Get ocean currents
  - [ ] `getMarineForecast(location, hours)` - Get comprehensive marine forecast
  - [ ] Cache management utilities

**Estimated Time:** 3-4 hours

---

### Phase 2: Environment Configuration

**Goal:** Set up Storm Glass API credentials

#### Tasks

- [ ] **2.1** Sign up for Storm Glass
  - [ ] Create account at stormglass.io
  - [ ] Subscribe to Medium plan (€49/month)
  - [ ] Get API key from dashboard

- [ ] **2.2** Update environment files
  - [ ] Add `EXPO_PUBLIC_STORMGLASS_API_KEY` to `.env`
  - [ ] Add `EXPO_PUBLIC_STORMGLASS_API_KEY` to `.env.example`
  - [ ] Add to `.env.local` if used

- [ ] **2.3** Update app configuration
  - [ ] Add Storm Glass key to `app.config.js` extra section
  - [ ] Verify key is accessible in app via Constants

- [ ] **2.4** Update Vercel environment
  - [ ] Add `EXPO_PUBLIC_STORMGLASS_API_KEY` to Vercel project settings
  - [ ] Redeploy to apply new environment variable

**Estimated Time:** 30 minutes

---

### Phase 3: Refactor Existing Services

**Goal:** Replace old weather services with Storm Glass

#### Tasks

- [x] **3.1** Update `ProfessionalWeatherService.ts`
  - [x] Replace WeatherAPIProService import with StormGlassService
  - [x] Replace WorldTidesProService import with StormGlassService
  - [x] Update constructor to use StormGlassService
  - [x] Update `getAdvancedWeatherConditions()` to call Storm Glass
  - [x] Update `getMarineForecast()` to call Storm Glass
  - [x] Update `setupRealTimeUpdates()` to use Storm Glass
  - [ ] Remove references to PredictWind, Meteomatics (still referencing Meteomatics for GRIB downloads)
  - [ ] Test all methods return correct data structure

- [ ] **3.2** Update `RegionalWeatherService.ts`
  - [x] Add StormGlassService as weather provider
  - [x] Update `initializeWeatherAPI()` to use Storm Glass
  - [x] Update `generateVenueSpecificForecast()` to call Storm Glass first
  - [x] Keep fallback to simulated data
  - [ ] Update `mapWeatherCondition()` for Storm Glass data format
  - [ ] Test coordinate handling (array vs object format)

- [ ] **3.3** Update `WeatherAggregationService.ts`
  - [x] Add 'StormGlass' to REGIONAL_PROVIDERS
  - [x] Update `fetchFromProvider()` with Storm Glass case
  - [x] Prioritize Storm Glass over other providers
  - [ ] Update `cacheForecast()` to handle Storm Glass data (current cache logic untouched)
  - [ ] Test multi-provider fallback logic

**Estimated Time:** 3-4 hours

---

### Phase 4: Update Service Integrations

**Goal:** Ensure dependent services work with Storm Glass

#### Tasks

- [ ] **4.1** Update `RaceWeatherService.ts`
  - [ ] Verify `fetchWeatherByCoordinates()` works with new integration
  - [ ] Test race weather fetching for different date ranges
  - [ ] Verify metadata format compatibility
  - [ ] Test with past, present, and future races

- [ ] **4.2** Update `TidalIntelService.ts`
  - [ ] Replace WorldTidesProService with StormGlassService
  - [ ] Update `getCurrentTideData()` to use Storm Glass
  - [ ] Update `getTideExtremes()` to use Storm Glass
  - [ ] Update `getTideHeightAtTime()` to use Storm Glass
  - [ ] Maintain same interface for backward compatibility
  - [ ] Test tide calculations

- [ ] **4.3** Update `BathymetricTidalService.ts` (if exists)
  - [ ] Check if this service uses tide data
  - [ ] Update to use Storm Glass if needed

**Estimated Time:** 2-3 hours

---

### Phase 5: Component Updates

**Goal:** Update UI components using weather services

#### Tasks

- [ ] **5.1** Update `VenueIntelligenceMapView.tsx`
  - [ ] Line 429: Update API key reference from `EXPO_PUBLIC_WEATHER_API_KEY` to `EXPO_PUBLIC_STORMGLASS_API_KEY`
  - [ ] Test map weather overlay rendering
  - [ ] Verify weather data displays correctly

- [ ] **5.2** Update `WeatherOverlay3D.tsx`
  - [x] Verify compatibility with Storm Glass data structure
  - [ ] Test 3D weather visualization
  - [ ] Check wave height rendering

- [ ] **5.3** Update `ProfessionalMap3DView.tsx`
  - [ ] Verify weather integration works
  - [ ] Test performance with Storm Glass caching

- [ ] **5.4** Update `CurrentTideCard.tsx`
  - [ ] Verify tide data displays correctly
  - [ ] Test tide state indicators
  - [ ] Check next high/low tide predictions

- [ ] **5.5** Search for any hardcoded API keys
  - [ ] Run grep for `WEATHERAPI_PRO` references
  - [ ] Run grep for `WORLDTIDES` references
  - [ ] Update or remove as needed

**Estimated Time:** 1-2 hours

---

### Phase 6: Deprecate Old Services

**Goal:** Clean up old weather service code

#### Tasks

- [ ] **6.1** Archive old service files
  - [ ] Create `services/weather/deprecated/` directory
  - [ ] Move `WeatherAPIProService.ts` to deprecated
  - [ ] Move `WorldTidesProService.ts` to deprecated
  - [ ] Keep `OpenWeatherMapProvider.ts` as emergency fallback
  - [ ] Keep `HKOWeatherProvider.ts` for reference/testing
  - [ ] Add README.md in deprecated folder explaining why

- [ ] **6.2** Update environment variables (after successful testing)
  - [ ] Remove `EXPO_PUBLIC_WEATHERAPI_PRO` from `.env`
  - [ ] Remove `WEATHER_API_KEY` from `.env`
  - [ ] Remove `EXPO_PUBLIC_WORLDTIDES_API_KEY` from `.env`
  - [ ] Keep in `.env.example` with "(DEPRECATED)" note
  - [ ] Remove from Vercel environment variables

- [ ] **6.3** Update dependencies
  - [ ] Check package.json for weather-specific libraries
  - [ ] Remove if no longer needed
  - [ ] Run `npm prune` to clean up

**Estimated Time:** 30 minutes

---

### Phase 7: Testing & Validation

**Goal:** Comprehensive testing of Storm Glass integration

#### Tasks

- [ ] **7.1** Create test script
  - [ ] Create `scripts/test-stormglass.mjs`
  - [ ] Test weather data fetching for various locations
  - [ ] Test tide data fetching
  - [ ] Test current data fetching
  - [ ] Test error handling (invalid coords, API errors)
  - [ ] Test rate limiting behavior
  - [ ] Test cache behavior
  - [ ] Test data transformation to AdvancedWeatherConditions

- [ ] **7.2** Test integration points
  - [ ] Create race with weather - verify metadata saved correctly
  - [ ] View race detail - verify weather displays
  - [ ] View map with weather overlay - verify data loads
  - [ ] View tide card - verify tide times/heights
  - [ ] Test with different venues (US, Europe, Asia-Pacific)
  - [ ] Test with races at different times (past, now, future, >10 days)

- [ ] **7.3** Performance testing
  - [ ] Monitor API request count over 24 hours
  - [ ] Verify caching reduces redundant requests
  - [ ] Check response times are acceptable (<2 seconds)
  - [ ] Test concurrent requests handling

- [ ] **7.4** Error handling testing
  - [ ] Test with invalid API key
  - [ ] Test with invalid coordinates
  - [ ] Test with rate limit exceeded
  - [ ] Test with network timeout
  - [ ] Verify graceful fallback to cached/simulated data

**Estimated Time:** 2-3 hours

---

### Phase 8: Documentation

**Goal:** Document the new Storm Glass integration

#### Tasks

- [ ] **8.1** Create Storm Glass integration guide
  - [ ] Create `docs/STORMGLASS_INTEGRATION.md`
  - [ ] Document API setup and configuration
  - [ ] Document pricing tiers and rate limits
  - [ ] Document available data parameters
  - [ ] Add code examples
  - [ ] Add troubleshooting guide
  - [ ] Document migration from old services

- [ ] **8.2** Update existing documentation
  - [ ] Update `WEATHER_IMPLEMENTATION_STATUS.md`
  - [ ] Update `REAL_WEATHER_INTEGRATION.md`
  - [ ] Update `WEATHER_FINAL_STATUS.md`
  - [ ] Update README.md environment variables section

- [ ] **8.3** Add inline code documentation
  - [ ] Add JSDoc comments to StormGlassService
  - [ ] Add usage examples in comments
  - [ ] Document rate limiting strategy

- [ ] **8.4** Create migration checklist
  - [ ] Document steps for other developers
  - [ ] Add rollback instructions
  - [ ] Document known issues/limitations

**Estimated Time:** 1 hour

---

## Task Checklist Summary

### Quick Progress Tracker

**Phase 1: Storm Glass Service** [ 0 / 11 tasks ]
**Phase 2: Environment Setup** [ 0 / 8 tasks ]
**Phase 3: Service Refactoring** [ 0 / 11 tasks ]
**Phase 4: Service Integration** [ 0 / 6 tasks ]
**Phase 5: Component Updates** [ 0 / 7 tasks ]
**Phase 6: Deprecation** [ 0 / 5 tasks ]
**Phase 7: Testing** [ 0 / 13 tasks ]
**Phase 8: Documentation** [ 0 / 7 tasks ]

**TOTAL: 0 / 68 tasks complete**

---

## Success Metrics

### Before Migration
- ❌ 2-3 separate API services
- ❌ €30-80/month combined cost
- ❌ Complex service coordination
- ❌ Multiple points of failure
- ❌ Inconsistent data formats

### After Migration
- ✅ Single API service (Storm Glass)
- ✅ €49/month fixed cost
- ✅ Simplified architecture
- ✅ Single point of integration
- ✅ Consistent data format
- ✅ Better data quality (multi-source aggregation)
- ✅ Comprehensive marine data (weather + tides + currents)

### Key Performance Indicators (KPIs)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API requests/day | < 4,000 | Monitor Storm Glass dashboard |
| Weather data accuracy | > 90% | Compare with local observations |
| Response time | < 2 seconds | Log API call duration |
| Cache hit rate | > 70% | Track cache hits vs misses |
| Failed requests | < 1% | Error logging and monitoring |
| Cost savings | €10-30/month | Compare billing statements |

---

## Rollback Plan

If Storm Glass integration fails or has critical issues:

### Immediate Rollback (< 1 hour)

1. **Restore environment variables**
   ```bash
   # Re-add to .env
   EXPO_PUBLIC_WEATHERAPI_PRO=your_old_key
   EXPO_PUBLIC_WORLDTIDES_API_KEY=your_old_key
   ```

2. **Restore old services**
   ```bash
   # Move files back from deprecated/
   mv services/weather/deprecated/WeatherAPIProService.ts services/weather/
   mv services/weather/deprecated/WorldTidesProService.ts services/tides/
   ```

3. **Revert service changes**
   - `git revert` commits made during migration
   - Or manually restore from `deprecated/` folder

4. **Redeploy**
   ```bash
   npm run build
   vercel --prod
   ```

### Partial Rollback

Keep Storm Glass for some features, revert others:
- Use Storm Glass for weather, keep WorldTides for tides
- Use Storm Glass as primary, old services as fallback
- Add feature flag to switch between services

### When to Rollback

- ❌ API consistently fails (>10% error rate)
- ❌ Data quality is worse than old services
- ❌ Performance is significantly slower (>5 seconds)
- ❌ Rate limits cause service interruptions
- ❌ Cost exceeds budget expectations
- ❌ Critical bugs discovered in production

---

## Timeline Estimates

### Conservative Estimate (With Testing)
- **Phase 1:** 4 hours (Storm Glass service development)
- **Phase 2:** 1 hour (Environment setup + signup)
- **Phase 3:** 4 hours (Service refactoring)
- **Phase 4:** 3 hours (Service integration)
- **Phase 5:** 2 hours (Component updates)
- **Phase 6:** 1 hour (Deprecation)
- **Phase 7:** 3 hours (Testing)
- **Phase 8:** 1 hour (Documentation)

**Total: 19 hours (2-3 work days)**

### Optimistic Estimate (Minimal Testing)
- **Phases 1-5:** 8 hours (core development)
- **Phases 6-8:** 2 hours (cleanup)

**Total: 10 hours (1.5 work days)**

### Realistic Estimate (With Buffer)
- **Development:** 15 hours
- **Testing & Bug Fixes:** 5 hours
- **Documentation:** 2 hours

**Total: 22 hours (3 work days)**

---

## Next Steps

1. **Review this plan** - Ensure all stakeholders agree
2. **Sign up for Storm Glass** - Get API key
3. **Set up environment** - Add API key to .env
4. **Start Phase 1** - Create StormGlassService
5. **Test incrementally** - Don't skip testing phases
6. **Document as you go** - Update docs during development

---

## Questions & Decisions

### Open Questions

- [ ] Do we need historical weather data access?
- [ ] Should we keep HKO as a regional fallback?
- [ ] Do we need ice coverage data?
- [ ] What's our monitoring strategy for API usage?

### Decisions Made

- ✅ Use Storm Glass Medium plan (€49/month, 5,000 requests/day)
- ✅ Keep OpenWeatherMap as emergency fallback
- ✅ Cache weather for 15-30 minutes
- ✅ Cache tide data for 60 minutes
- ✅ Maintain backward compatibility with existing interfaces

---

## Resources

- **Storm Glass API Docs:** https://docs.stormglass.io/
- **Storm Glass Dashboard:** https://stormglass.io/account
- **Pricing:** https://stormglass.io/marine-weather/
- **Support:** support@stormglass.io

---

## Notes

- This is a **low-risk migration** - we can roll back at any time
- Old services stay in codebase until testing is complete
- Incremental testing after each phase prevents major issues
- Storm Glass provides better data quality than our current setup

**Last Updated:** 2025-11-04
