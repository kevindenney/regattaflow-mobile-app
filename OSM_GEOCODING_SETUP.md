# OpenStreetMap Geocoding Integration

*Completed: October 2, 2025*

## Overview

RegattaFlow now uses **OpenStreetMap** (via Nominatim) for accurate, free geocoding of yacht clubs and sailing venues. This provides "harbor-level" accuracy without vendor lock-in or API costs.

## What's Been Implemented

### 1. **NominatimService**
`src/services/location/NominatimService.ts`

Free, open-source geocoding service that:
- ✅ Respects 1 req/sec rate limit automatically
- ✅ Searches by text query with country filtering
- ✅ Reverse geocoding (coordinates → address)
- ✅ Batch processing support
- ✅ Yacht club & venue-optimized queries

### 2. **Database Schema Updates**
Migration: `20251002_add_osm_geocoding_fields`

Added to `sailing_venues` and `yacht_clubs` tables:
- `osm_id` - OpenStreetMap feature ID
- `osm_type` - Feature type (node, way, relation)
- `osm_display_name` - Full formatted address
- `geocoded_at` - Timestamp of geocoding

### 3. **Admin UI Component**
`src/components/admin/LocationGeocoder.tsx`

Interactive geocoding tool with:
- Search OpenStreetMap by name
- View multiple results with distance calculation
- Preview before/after coordinates
- One-click updates

### 4. **CLI Scripts**

#### Fix RHKYC Locations (Immediate)
```bash
npm run geocode:rhkyc
```
Corrects the three RHKYC locations (Kellett Island, Middle Island, Port Shelter)

#### Bulk Enrich All Yacht Clubs
```bash
npm run geocode:all
```
Geocodes all yacht clubs that haven't been processed yet

#### Dry Run (Test Mode)
```bash
npm run geocode:dry-run
```
Shows what would change without updating the database

## Usage Examples

### Basic Search
```typescript
import { nominatimService } from '@/src/services/location/NominatimService';

// Search for a yacht club
const results = await nominatimService.search(
  'Royal Hong Kong Yacht Club Middle Island',
  { countrycodes: 'hk', limit: 3 }
);

console.log(results[0].lat, results[0].lng);
// Output: 22.2436, 114.1956
```

### Geocode Yacht Club
```typescript
// Optimized for yacht clubs with country filter
const result = await nominatimService.geocodeYachtClub(
  'Royal Hong Kong Yacht Club Port Shelter',
  'Hong Kong SAR'
);

if (result) {
  console.log(`📍 ${result.lat}, ${result.lng}`);
  console.log(`🗺️  ${result.displayName}`);
}
```

### Reverse Geocoding
```typescript
// Get address from coordinates
const location = await nominatimService.reverse(22.2845, 114.1822);
console.log(location.displayName);
// Output: "Royal Hong Kong Yacht Club, Kellett Island, Causeway Bay, Hong Kong"
```

### Batch Processing
```typescript
const queries = [
  { name: 'RHKYC Kellett Island', country: 'Hong Kong SAR' },
  { name: 'Aberdeen Boat Club', country: 'Hong Kong SAR' },
  { name: 'Hebe Haven Yacht Club', country: 'Hong Kong SAR' },
];

// Automatically rate-limited to 1 req/sec
const results = await nominatimService.batchGeocode(queries);
```

## Next Steps

### 1. Fix RHKYC Locations (Now)
```bash
npm run geocode:rhkyc
```
This will correct the inaccurate Middle Island and Port Shelter coordinates.

### 2. Test with Dry Run
```bash
npm run geocode:dry-run --limit 10
```
Preview what would happen for first 10 clubs without making changes.

### 3. Bulk Enrichment
```bash
npm run geocode:all
```
Process all yacht clubs that don't have OSM data yet.

### 4. Integrate Admin UI
Add `LocationGeocoder` component to your admin panel:

```tsx
import { LocationGeocoder } from '@/src/components/admin/LocationGeocoder';

<LocationGeocoder
  locationId="rhkyc-middle-island"
  locationType="yacht_club"
  locationName="Royal Hong Kong Yacht Club - Middle Island"
  currentLat={22.2433}
  currentLng={114.1967}
  country="Hong Kong SAR"
  onUpdate={() => refreshData()}
/>
```

## Why OpenStreetMap?

### ✅ Advantages
1. **Zero Cost** - Completely free, no API keys or quotas
2. **No Vendor Lock-in** - Open data, can self-host if needed
3. **Privacy** - No tracking or data sharing
4. **Good Enough Accuracy** - Harbor-level precision for sailing venues
5. **Aligns with MapLibre** - Natural fit with existing stack

### ⚠️ Limitations
1. **Rate Limited** - 1 request/second (handled automatically)
2. **Variable Quality** - Depends on community contributions
3. **No Photos/Reviews** - Just coordinates and addresses

### 🔄 When to Use Google Instead
Only if you need:
- Exact dock/slip numbers
- Photos and reviews
- Commercial marina directory features

## Migration Status

- ✅ Database schema updated
- ✅ NominatimService created
- ✅ Admin UI component built
- ✅ CLI scripts ready
- ⏳ RHKYC locations pending correction
- ⏳ Bulk enrichment pending execution

## Technical Details

### Rate Limiting
Nominatim requires 1 request per second max. The service uses a request queue:

```typescript
private async rateLimitedFetch(url: string) {
  return new Promise((resolve) => {
    this.requestQueue = this.requestQueue
      .then(() => fetch(url))
      .then(resolve);

    // Ensure 1 second delay
    this.requestQueue = this.requestQueue.then(
      () => new Promise(r => setTimeout(r, 1000))
    );
  });
}
```

### Country Code Mapping
For better results, country names are mapped to ISO codes:

```typescript
const countryCodeMap = {
  'Hong Kong SAR': 'hk',
  'United States': 'us',
  'United Kingdom': 'gb',
  // ... etc
};
```

### Result Ranking
Nominatim returns results by relevance score (`place_rank`). Lower = better:
- 0-4: Countries, states
- 5-12: Cities, towns
- 13-16: Suburbs, neighborhoods
- 17-19: Major streets
- 20-25: Buildings (yacht clubs!)

## Support & Documentation

- **Nominatim Usage Policy**: https://operations.osmfoundation.org/policies/nominatim/
- **API Docs**: https://nominatim.org/release-docs/latest/api/Overview/
- **OSM Wiki**: https://wiki.openstreetmap.org/

## Troubleshooting

### No results found
- Try simplifying the query
- Add country filter: `{ countrycodes: 'hk' }`
- Check OSM directly: https://nominatim.openstreetmap.org/

### Rate limit errors
- Service automatically queues requests
- Wait 1 second between manual calls
- Use `batchGeocode()` for bulk processing

### Inaccurate results
- Refine search query with landmarks
- Manually verify on OSM: https://www.openstreetmap.org/
- Use admin UI to select best result from multiple options

---

**Ready to geocode!** Start with `npm run geocode:rhkyc` to fix the RHKYC locations.
