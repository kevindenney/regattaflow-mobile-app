# Sailing Services System - Complete Guide

## ✅ What's Built

A comprehensive system for all sailing-related services with **direct coordinates** - no joins required!

### New Table: `sailing_services`

Stores ALL sailing services with:
- ✅ Direct coordinates (`coordinates_lat`, `coordinates_lng`)
- ✅ Service type classification
- ✅ Contact info (phone, email, website)
- ✅ Ratings and reviews
- ✅ Google Place IDs & OSM IDs
- ✅ PostGIS geography for proximity queries
- ✅ Business hours (JSONB format)

## 🏪 Service Types

```typescript
type ServiceType =
  | 'sailmaker'          // Sail lofts
  | 'rigger'             // Rigging specialists
  | 'chandlery'          // Marine supply stores
  | 'marina'             // Marina facilities
  | 'clothing'           // Musto, Patagonia, etc.
  | 'repair'             // Boat repair
  | 'coach'              // Sailing instructors
  | 'engines'            // Marine engines
  | 'electronics'        // Marine electronics
  | 'canvas'             // Canvas work
  | 'composite'          // Composite repair
  | 'metal_fabrication'  // Metal work
  | 'paint'              // Paint/refinish
  | 'storage'            // Boat storage
  | 'transport'          // Boat transport
  | 'surveyor'           // Marine surveyors
  | 'insurance'          // Marine insurance
  | 'brokerage'          // Yacht brokers
```

## 📍 Example: Clearwater Bay Marine

Already added to database:

```sql
SELECT * FROM sailing_services
WHERE id = 'clearwater-bay-marine-hk';
```

```json
{
  "name": "Clearwater Bay Marine",
  "service_type": "chandlery",
  "coordinates_lat": 22.2645,
  "coordinates_lng": 114.2569,
  "phone": "+852 2719 8338",
  "website": "https://www.clearwaterbaymarine.com",
  "specialties": ["marine_supplies", "boat_parts", "safety_equipment", "rigging"]
}
```

## 🌍 Bulk Download from OSM

### Query Sailing Services (FREE):

```typescript
import { overpassService } from '@/src/services/location/OverpassService';

// Get all chandleries/sail lofts in Hong Kong
const hkServices = await overpassService.querySailingServices(
  [22.1, 113.8, 22.6, 114.5] // HK bounding box
);

// Worldwide services
const allServices = await overpassService.querySailingServices();
```

### What OSM Has:

OSM tags for sailing services:
- `shop=boat` → Chandlery
- `shop=marine` → Marine store
- `craft=sailmaker` → Sail loft
- `craft=rigger` → Rigging shop
- `craft=boatbuilder` → Boat builder/repair
- `sport=sailing` + `amenity=school` → Sailing school

## 🔍 Query Examples

### Find Services Near a Venue:

```sql
-- Find chandleries within 10km of a venue
SELECT
  s.name,
  s.phone_number,
  s.website,
  ST_Distance(
    s.location,
    ST_SetSRID(ST_MakePoint(114.1822, 22.2845), 4326)::geography
  ) / 1000 AS distance_km
FROM sailing_services s
WHERE
  service_type = 'chandlery'
  AND ST_DWithin(
    s.location,
    ST_SetSRID(ST_MakePoint(114.1822, 22.2845), 4326)::geography,
    10000 -- 10km in meters
  )
ORDER BY distance_km;
```

### Find All Sailmakers in a Country:

```sql
SELECT name, city, phone_number, website
FROM sailing_services
WHERE service_type = 'sailmaker'
  AND country = 'United States'
ORDER BY city;
```

### Find Services at a Specific Venue:

```sql
SELECT s.name, s.service_type, s.phone_number
FROM sailing_services s
WHERE s.venue_id = 'hong-kong-victoria-harbor'
ORDER BY s.service_type;
```

## 💡 Hybrid Data Strategy

### Step 1: OSM Bulk Download (FREE)
```typescript
// Download sailing services from OSM
const osmServices = await overpassService.querySailingServices();

// Convert to our format
const services = osmServices.map(s => ({
  id: `osm-${s.type}-${s.id}`,
  name: s.tags.name || 'Unnamed',
  service_type: determineServiceType(s.tags),
  coordinates_lat: s.lat,
  coordinates_lng: s.lon,
  osm_id: s.id,
  osm_type: s.type,
  website: s.tags.website,
  phone: s.tags.phone,
  data_source: 'osm'
}));

// Import to database
await supabase.from('sailing_services').insert(services);
```

### Step 2: Enhance Known Brands with Google
```typescript
// Only enhance major brands/chains
const brands = [
  'North Sails',
  'Quantum Sails',
  'Musto',
  'Patagonia',
  'West Marine',
  'Harken'
];

for (const brand of brands) {
  const results = await googlePlaces.searchText(brand, {
    includedType: 'store',
    maxResultCount: 50
  });

  // Add to database with Google data
}
```

**Cost:** ~$1.60 for 50 locations per brand

### Step 3: User Submissions
Users can add missing services:

```typescript
// User submits new service
await supabase.from('sailing_services').insert({
  name: 'Local Sail Loft',
  service_type: 'sailmaker',
  coordinates_lat: userLocation.lat,
  coordinates_lng: userLocation.lng,
  phone: '+1 555 1234',
  data_source: 'user_submitted',
  verified: false // Requires admin approval
});
```

## 🗺️ Map Integration

### Display Services on Map:

```typescript
// Fetch services for map display
const { data: services } = await supabase
  .from('sailing_services')
  .select('*')
  .eq('service_type', selectedType)
  .gte('coordinates_lat', bounds.south)
  .lte('coordinates_lat', bounds.north)
  .gte('coordinates_lng', bounds.west)
  .lte('coordinates_lng', bounds.east);

// Render markers
services.forEach(service => {
  <Marker
    latitude={service.coordinates_lat}
    longitude={service.coordinates_lng}
    icon={getServiceIcon(service.service_type)}
    onClick={() => showServiceDetails(service)}
  />
});
```

### Service Icons:

```typescript
const serviceIcons = {
  sailmaker: '⛵',
  rigger: '🔧',
  chandlery: '🏪',
  marina: '⚓',
  clothing: '👕',
  repair: '🔨',
  coach: '👨‍🏫',
  engines: '🚢',
  electronics: '📡'
};
```

## 📊 Data Sources Priority

1. **Google Places** (for major brands/chains)
   - Most accurate
   - Has ratings, photos, hours
   - Cost: ~$0.032 per location

2. **OpenStreetMap** (bulk data)
   - Free
   - Good global coverage
   - Missing many locations

3. **User Submissions** (fill gaps)
   - Free
   - Requires verification
   - Community-driven

4. **Manual Entry** (high-value locations)
   - Free
   - Verified by team
   - For important partnerships

## 💰 Cost Estimate

### For 1,000 Sailing Services:

| Source | Locations | Cost |
|--------|-----------|------|
| OSM Download | 500 | $0 |
| Google (Major Brands) | 400 | $12.80 |
| User Submissions | 100 | $0 |
| **Total** | **1,000** | **$12.80** |

Compare to **all Google**: $32

## 🚀 Quick Start

### 1. Add a Service Manually:

```sql
INSERT INTO sailing_services (
  id, name, service_type,
  coordinates_lat, coordinates_lng,
  formatted_address, country,
  phone_number, website,
  data_source, verified
) VALUES (
  'north-sails-hong-kong',
  'North Sails Hong Kong',
  'sailmaker',
  22.2845, 114.1822,
  'Kellett Island, Causeway Bay, Hong Kong',
  'Hong Kong SAR',
  '+852 2555 5555',
  'https://www.northsails.com',
  'manual',
  true
);
```

### 2. Download OSM Services for Region:

```bash
# Coming soon:
npm run download:services -- --country HK
```

### 3. Enhance with Google:

```bash
# Coming soon:
npm run geocode:google:services -- --brand "North Sails"
```

## 🔄 Migration from club_services

Old `club_services` table can coexist:

```sql
-- Migrate existing club_services to sailing_services
INSERT INTO sailing_services (
  id, name, service_type,
  coordinates_lat, coordinates_lng,
  venue_id, club_id,
  data_source
)
SELECT
  'club-service-' || cs.id,
  cs.service_name,
  cs.service_type,
  COALESCE(v.coordinates_lat, yc.coordinates_lat),
  COALESCE(v.coordinates_lng, yc.coordinates_lng),
  cs.venue_id,
  cs.club_id,
  'club_services_migration'
FROM club_services cs
LEFT JOIN sailing_venues v ON cs.venue_id = v.id
LEFT JOIN yacht_clubs yc ON cs.club_id = yc.id
WHERE cs.coordinates_lat IS NULL; -- Only if they don't have direct coords
```

## 📝 Next Steps

1. ✅ **Clearwater Bay Marine added** to database
2. ⏳ Download OSM sailing services for Hong Kong
3. ⏳ Add major sailing brands (North, Quantum, Musto, etc.)
4. ⏳ Update map to display service markers by type
5. ⏳ Build service detail cards with contact info

---

**Summary:** You now have a robust services system with direct coordinates, ready for bulk OSM import and selective Google enhancement!
