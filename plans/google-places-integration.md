# Google Places API Integration for Accurate Yacht Club Locations

*Created: October 2, 2025*

## Problem Statement

Manual coordinate entry for yacht clubs and marinas is imprecise. For example, RHKYC's three locations show approximate positions rather than exact coordinates:

- **Middle Island**: Currently 22.2433, 114.1967 (inaccurate)
- **Shelter Cove/Port Shelter**: Currently 22.3598, 114.2836 (inaccurate)

We need an official, accurate source of coordinates for all sailing venues, yacht clubs, and marinas.

## Solution: Google Places API Integration

### Why Google Places API?

1. **Most Accurate POI Database** - Proprietary data for commercial locations
2. **Place IDs** - Stable, unique identifiers that don't change
3. **Already Configured** - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in environment
4. **Rich Metadata** - Photos, reviews, hours, contact info
5. **Confidence Scores** - Know accuracy level of each result

### API Capabilities

#### 1. Text Search (New)
```typescript
// Find yacht clubs by name
GET https://places.googleapis.com/v1/places:searchText
{
  "textQuery": "Royal Hong Kong Yacht Club Middle Island",
  "includedType": "marina"
}
```

#### 2. Place Details (New)
```typescript
// Get exact coordinates from Place ID
GET https://places.googleapis.com/v1/places/{place_id}
{
  "location": {
    "latitude": 22.2456,
    "longitude": 114.1978
  },
  "displayName": "RHKYC Middle Island",
  "formattedAddress": "...",
  "googleMapsUri": "https://maps.google.com/..."
}
```

#### 3. Geocoding API (Fallback)
```typescript
// Convert addresses to coordinates
GET https://maps.googleapis.com/maps/api/geocode/json?address=...
```

## Implementation Phases

### Phase 1: Database Schema Updates (Quick Win)

Add Google Place ID support to existing tables:

```sql
-- Add place_id columns
ALTER TABLE sailing_venues ADD COLUMN place_id TEXT UNIQUE;
ALTER TABLE yacht_clubs ADD COLUMN place_id TEXT UNIQUE;
ALTER TABLE yacht_clubs ADD COLUMN google_maps_uri TEXT;
ALTER TABLE yacht_clubs ADD COLUMN formatted_address TEXT;

-- Index for faster lookups
CREATE INDEX idx_venues_place_id ON sailing_venues(place_id);
CREATE INDEX idx_clubs_place_id ON yacht_clubs(place_id);
```

### Phase 2: Google Places Service (Core Integration)

Create universal service for Google Places API:

```typescript
// src/services/location/GooglePlacesService.ts

import { EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } from '@env';

export interface PlaceSearchResult {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  googleMapsUri: string;
}

export interface PlaceDetails extends PlaceSearchResult {
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  photos?: string[];
  rating?: number;
  userRatingsTotal?: number;
}

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1';

  constructor() {
    this.apiKey = EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  /**
   * Search for places by text query
   * @param query - Search text (e.g., "Royal Hong Kong Yacht Club Middle Island")
   * @param includedType - Optional type filter (marina, establishment, etc.)
   */
  async searchText(
    query: string,
    includedType: string = 'marina'
  ): Promise<PlaceSearchResult[]> {
    const response = await fetch(`${this.baseUrl}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.googleMapsUri'
      },
      body: JSON.stringify({
        textQuery: query,
        includedType,
        maxResultCount: 5
      })
    });

    const data = await response.json();

    return data.places?.map((place: any) => ({
      placeId: place.id,
      displayName: place.displayName?.text,
      formattedAddress: place.formattedAddress,
      location: {
        latitude: place.location.latitude,
        longitude: place.location.longitude
      },
      types: place.types || [],
      googleMapsUri: place.googleMapsUri
    })) || [];
  }

  /**
   * Get detailed information about a specific place
   * @param placeId - Google Place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    const response = await fetch(`${this.baseUrl}/places/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,googleMapsUri,internationalPhoneNumber,websiteUri,currentOpeningHours,photos,rating,userRatingCount'
      }
    });

    if (!response.ok) return null;

    const place = await response.json();

    return {
      placeId: place.id,
      displayName: place.displayName?.text,
      formattedAddress: place.formattedAddress,
      location: {
        latitude: place.location.latitude,
        longitude: place.location.longitude
      },
      types: place.types || [],
      googleMapsUri: place.googleMapsUri,
      phoneNumber: place.internationalPhoneNumber,
      website: place.websiteUri,
      openingHours: place.currentOpeningHours?.weekdayDescriptions,
      photos: place.photos?.map((p: any) => p.name),
      rating: place.rating,
      userRatingsTotal: place.userRatingCount
    };
  }

  /**
   * Geocode an address to coordinates (fallback method)
   */
  async geocodeAddress(address: string): Promise<PlaceSearchResult | null> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]) return null;

    const result = data.results[0];

    return {
      placeId: result.place_id,
      displayName: result.formatted_address,
      formattedAddress: result.formatted_address,
      location: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng
      },
      types: result.types || [],
      googleMapsUri: `https://maps.google.com/?q=${result.geometry.location.lat},${result.geometry.location.lng}`
    };
  }
}
```

### Phase 3: Admin Interface for Place ID Management

Create UI for admins to search and assign Place IDs:

```typescript
// src/components/admin/PlaceIdManager.tsx

import { GooglePlacesService } from '@/src/services/location/GooglePlacesService';

export function PlaceIdManager({ yachtClub }: { yachtClub: YachtClub }) {
  const placesService = new GooglePlacesService();
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchForClub = async () => {
    setLoading(true);
    const results = await placesService.searchText(yachtClub.name, 'marina');
    setSearchResults(results);
    setLoading(false);
  };

  const assignPlaceId = async (placeId: string) => {
    const details = await placesService.getPlaceDetails(placeId);
    if (!details) return;

    // Update yacht_clubs table
    await supabase
      .from('yacht_clubs')
      .update({
        place_id: details.placeId,
        coordinates_lat: details.location.latitude,
        coordinates_lng: details.location.longitude,
        google_maps_uri: details.googleMapsUri,
        formatted_address: details.formattedAddress,
        website: details.website || yachtClub.website,
      })
      .eq('id', yachtClub.id);
  };

  return (
    <View>
      <Button onPress={searchForClub}>
        Search Google Places for "{yachtClub.name}"
      </Button>

      {searchResults.map(result => (
        <TouchableOpacity
          key={result.placeId}
          onPress={() => assignPlaceId(result.placeId)}
        >
          <Text>{result.displayName}</Text>
          <Text>{result.formattedAddress}</Text>
          <Text>📍 {result.location.latitude}, {result.location.longitude}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Phase 4: Automated Sync & Validation

Create migration script to enrich existing data:

```typescript
// scripts/enrich-yacht-clubs-with-google-places.ts

import { supabase } from '@/src/services/supabase';
import { GooglePlacesService } from '@/src/services/location/GooglePlacesService';

const placesService = new GooglePlacesService();

async function enrichYachtClubs() {
  // Get all yacht clubs without Place IDs
  const { data: clubs } = await supabase
    .from('yacht_clubs')
    .select('*')
    .is('place_id', null);

  for (const club of clubs || []) {
    console.log(`Searching for: ${club.name}`);

    // Search Google Places
    const results = await placesService.searchText(club.name, 'marina');

    if (results.length === 0) {
      console.log(`❌ No results for ${club.name}`);
      continue;
    }

    // Take first result (most relevant)
    const match = results[0];
    const details = await placesService.getPlaceDetails(match.placeId);

    if (!details) continue;

    // Update database with accurate coordinates
    await supabase
      .from('yacht_clubs')
      .update({
        place_id: details.placeId,
        coordinates_lat: details.location.latitude,
        coordinates_lng: details.location.longitude,
        google_maps_uri: details.googleMapsUri,
        formatted_address: details.formattedAddress,
      })
      .eq('id', club.id);

    console.log(`✅ Updated ${club.name} with Place ID: ${details.placeId}`);
    console.log(`   📍 ${details.location.latitude}, ${details.location.longitude}`);

    // Rate limiting (Google has quotas)
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

enrichYachtClubs();
```

## Migration Path

### Step 1: Database Schema
```bash
npx supabase migration create add_google_place_ids
```

```sql
-- supabase/migrations/YYYYMMDD_add_google_place_ids.sql

-- Add Google Place ID columns to sailing_venues
ALTER TABLE sailing_venues ADD COLUMN IF NOT EXISTS place_id TEXT UNIQUE;
ALTER TABLE sailing_venues ADD COLUMN IF NOT EXISTS google_maps_uri TEXT;
ALTER TABLE sailing_venues ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Add Google Place ID columns to yacht_clubs
ALTER TABLE yacht_clubs ADD COLUMN IF NOT EXISTS place_id TEXT UNIQUE;
ALTER TABLE yacht_clubs ADD COLUMN IF NOT EXISTS google_maps_uri TEXT;
ALTER TABLE yacht_clubs ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_venues_place_id ON sailing_venues(place_id);
CREATE INDEX IF NOT EXISTS idx_clubs_place_id ON yacht_clubs(place_id);

-- Comment for documentation
COMMENT ON COLUMN sailing_venues.place_id IS 'Google Place ID for accurate geocoding';
COMMENT ON COLUMN yacht_clubs.place_id IS 'Google Place ID for accurate geocoding';
```

### Step 2: Fix RHKYC Locations (Immediate)

```bash
# Run manual Place ID lookup for RHKYC locations
node scripts/fix-rhkyc-locations.ts
```

```typescript
// scripts/fix-rhkyc-locations.ts

const rhkycLocations = [
  {
    id: 'rhkyc',
    searchQuery: 'Royal Hong Kong Yacht Club Kellett Island'
  },
  {
    id: 'rhkyc-middle-island',
    searchQuery: 'Royal Hong Kong Yacht Club Middle Island'
  },
  {
    id: 'rhkyc-shelter-cove',
    searchQuery: 'Royal Hong Kong Yacht Club Port Shelter' // Fixed name
  }
];

for (const location of rhkycLocations) {
  const results = await placesService.searchText(location.searchQuery);
  console.log(`${location.id}: ${results[0]?.placeId}`);
  // Then manually verify and update
}
```

### Step 3: Bulk Enrichment (All Venues)

```bash
npm run enrich:yacht-clubs
npm run enrich:sailing-venues
```

## Cost Considerations

**Google Places API Pricing (2025):**
- Text Search: $32 per 1000 requests
- Place Details: $17 per 1000 requests
- Geocoding: $5 per 1000 requests

**For RegattaFlow:**
- One-time enrichment: ~300 clubs × 2 API calls = $30
- Ongoing updates: Minimal (only new venues)
- Well within free tier: $200/month credit

## Alternative: MapLibre + OpenStreetMap

If cost is a concern, use **Nominatim** (OSM's geocoding):

```typescript
async function nominatimGeocode(query: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  );
  const data = await response.json();

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name
  };
}
```

**Pros:**
- Free, no API key required
- Open data

**Cons:**
- Less accurate for commercial POIs (yacht clubs)
- No Place IDs
- Usage policy restrictions

## Recommendation

**Use Google Places API** for the following reasons:

1. ✅ Most accurate coordinates for yacht clubs/marinas
2. ✅ Already have API key configured
3. ✅ Place IDs provide stable references
4. ✅ Rich metadata (photos, reviews, hours)
5. ✅ One-time cost (~$30) for complete accuracy
6. ✅ Aligns with existing Google Maps integration

## Next Steps

1. **Immediate**: Run database migration to add `place_id` columns
2. **Quick Fix**: Manually correct RHKYC locations using Google Maps
3. **Week 1**: Build GooglePlacesService
4. **Week 2**: Create admin UI for Place ID assignment
5. **Week 3**: Bulk enrichment of all yacht clubs
6. **Ongoing**: Use Place IDs for all new venues

---

*This integration will ensure RegattaFlow has the most accurate sailing venue data in the industry.*
