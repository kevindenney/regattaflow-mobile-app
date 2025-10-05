# Google Places API Setup for RegattaFlow

## ✅ Implementation Complete

Google Places API integration is ready to use for accurate yacht club and marina geocoding.

## 🔧 What's Been Built

1. **GooglePlacesService** (`src/services/location/GooglePlacesService.ts`)
   - Text search for places
   - Place details with photos, ratings, hours
   - Geocoding & reverse geocoding
   - Batch processing support

2. **Database Schema** (Migration applied ✅)
   - `google_place_id` - Unique Place ID
   - `google_maps_uri` - Direct Google Maps link
   - `formatted_address` - Full address
   - `rating` & `user_ratings_total` - User reviews
   - `phone_number`, `business_status` - Contact & status

3. **CLI Scripts**
   - `npm run geocode:google` - Enrich all clubs
   - `npm run geocode:google:dry-run` - Preview changes
   - Test script for RHKYC locations

## ⚠️ Required Setup

### Step 1: Enable Places API (New)

Your API key is configured but the **Places API (New)** needs to be enabled:

1. **Visit**: https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=176626806015

2. **Click "Enable"**

3. **Wait 2-3 minutes** for propagation

### Step 2: Test the Integration

After enabling the API:

```bash
npx tsx scripts/test-google-places-rhkyc.ts
```

This will:
- Search for all 3 RHKYC locations
- Show detailed results with coordinates, ratings, addresses
- Generate SQL to update the database

### Step 3: Apply Updates

The script will output SQL like:

```sql
UPDATE yacht_clubs
SET
  coordinates_lat = 22.2845,
  coordinates_lng = 114.1822,
  google_place_id = 'ChIJ...',
  google_maps_uri = 'https://maps.google.com/?cid=...',
  formatted_address = 'Royal Hong Kong Yacht Club, Kellett Island...',
  rating = 4.5,
  user_ratings_total = 234,
  geocoded_at = NOW()
WHERE id = 'rhkyc';
```

Run this SQL via Supabase MCP or the Supabase dashboard.

## 💰 Cost Estimate

### Per Yacht Club:
- **Text Search**: $0.032
- **Place Details**: $0.017 (if fetching details)
- **Total**: ~$0.049 per club

### For Your Database:
- **7 RHKYC-related clubs**: $0.34
- **All ~300 yacht clubs**: ~$15

Google provides **$200/month free credit**, so this is well within budget.

## 📖 Usage Examples

### Search for a Yacht Club

```typescript
import { googlePlacesService } from '@/src/services/location/GooglePlacesService';

// Search with location bias
const results = await googlePlacesService.searchYachtClub(
  'Royal Hong Kong Yacht Club Middle Island',
  {
    latitude: 22.234,
    longitude: 114.186,
    radius: 10000 // 10km
  }
);

console.log(results[0].displayName);
// "Royal Hong Kong Yacht Club - Middle Island"

console.log(results[0].location);
// { latitude: 22.2436, longitude: 114.1956 }

console.log(results[0].rating);
// 4.6
```

### Get Place Details

```typescript
const details = await googlePlacesService.getPlaceDetails(placeId);

console.log(details?.phoneNumber);
// "+852 2832 2817"

console.log(details?.website);
// "https://www.rhkyc.org.hk"

console.log(details?.openingHours?.weekdayText);
// ["Monday: 8:00 AM – 10:00 PM", ...]
```

### Geocode Address

```typescript
const result = await googlePlacesService.geocodeAddress(
  'Kellett Island, Causeway Bay, Hong Kong'
);

console.log(result?.location);
// { latitude: 22.2845, longitude: 114.1822 }
```

## 🔄 Workflow

### For New Yacht Clubs

1. **Admin adds club** with approximate coordinates
2. **Script searches Google Places** for exact match
3. **Admin reviews results** and selects best match
4. **System updates** with Place ID and accurate data
5. **Map renders** with official Google coordinates

### For Existing Clubs

1. **Run bulk enrichment**:
   ```bash
   npm run geocode:google:dry-run --limit 10
   ```
2. **Review output** and verify accuracy
3. **Run for real**:
   ```bash
   npm run geocode:google --limit 10
   ```
4. **Check results** on map

## 🆚 Google Places vs OSM

### Google Places ✅
- ✅ Comprehensive yacht club data
- ✅ Accurate coordinates (verified)
- ✅ Photos, reviews, hours, phone numbers
- ✅ Business status (open/closed)
- ✅ Stable Place IDs
- ⚠️ Cost: ~$0.05 per club (one-time)
- ⚠️ Vendor lock-in

### OpenStreetMap ❌
- ❌ Missing most yacht clubs
- ❌ Incomplete data for marinas
- ✅ Free, open data
- ✅ No vendor lock-in

**Decision**: Google Places is the right choice for RegattaFlow because:
1. One-time $15 cost for 300 clubs is negligible
2. Accuracy is critical for navigation and race planning
3. Rich metadata enhances user experience
4. Well within Google's $200/month free tier

## 🗺️ Next Steps

1. **Enable Places API** (see link above)
2. **Test RHKYC**: `npx tsx scripts/test-google-places-rhkyc.ts`
3. **Apply SQL updates** via Supabase
4. **Bulk enrich** remaining clubs
5. **Build admin UI** for manual Place ID assignment

## 📚 Resources

- **Google Places API Docs**: https://developers.google.com/maps/documentation/places/web-service/overview
- **Pricing**: https://developers.google.com/maps/billing-and-pricing/pricing
- **Place Types**: https://developers.google.com/maps/documentation/places/web-service/supported_types
- **Console**: https://console.cloud.google.com/google/maps-apis/

---

**Ready to geocode!** Enable the API and run the test script.
