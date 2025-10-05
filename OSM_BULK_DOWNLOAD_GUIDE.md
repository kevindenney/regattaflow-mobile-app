# OpenStreetMap Bulk Marina Download - FREE

## ✅ What's Ready

You can now download **10,000+ sailing venues worldwide for $0** using OpenStreetMap's Overpass API.

### Components Built:

1. **OverpassService** (`src/services/location/OverpassService.ts`)
   - Query marinas globally
   - Query yacht clubs
   - Filter by country, region, or bounding box
   - FREE - no API key required

2. **Download Script** (`scripts/download-global-marinas.ts`)
   - Downloads ALL marinas worldwide
   - Splits into regions to avoid timeout
   - Generates import SQL
   - Saves to JSON for review

## 🚀 Quick Start

### Test with Hong Kong (5 minutes):

```bash
# Quick test - just Hong Kong marinas
curl -s "https://overpass-api.de/api/interpreter" --data-urlencode \
  "data=[out:json];(node[\"leisure\"=\"marina\"](22.1,113.8,22.6,114.5););out;" \
  | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).elements.length + " marinas"))'
```

### Download All Marinas Worldwide:

```bash
npm run download:marinas
```

**What happens:**
- Queries 6 world regions (North America, Europe, Asia, etc.)
- Downloads ~10,000+ marina locations
- Saves to `data/global-marinas.json`
- Generates sample SQL: `data/import-marinas-sample.sql`
- **Time:** ~5-10 minutes
- **Cost:** $0

## 📊 Expected Results

### Global Coverage:
- **USA**: ~3,000+ marinas
- **Europe**: ~2,500+ marinas
- **Asia-Pacific**: ~1,500+ marinas
- **Caribbean**: ~500+ marinas
- **Rest of World**: ~2,500+ marinas

### Data Quality:
- ✅ Coordinates: 100% (required by OSM)
- ✅ Names: ~70% (some unnamed)
- ⚠️ Websites: ~10%
- ⚠️ Phone numbers: ~5%
- ❌ Ratings: Not available
- ❌ Photos: Not available

## 💡 Recommended Strategy: Hybrid Approach

### Step 1: Bulk OSM Download (FREE)
```bash
npm run download:marinas
```
Gets you 10,000+ venues at $0 cost.

### Step 2: Import to Database
```sql
-- Import from data/import-marinas-sample.sql
-- Or write custom import script
```

### Step 3: Enhance Premium Venues with Google
```bash
# Only for championship/premier venues (~100 locations)
npm run geocode:google -- --venue-type championship
```

**Total cost:** ~$3 (100 venues × $0.032)

## 🌍 Usage Examples

### Query Specific Country:

```typescript
import { overpassService } from '@/src/services/location/OverpassService';

// Get all marinas in Hong Kong
const hkMarinas = await overpassService.queryByCountry('HK');
console.log(`Found ${hkMarinas.length} marinas in Hong Kong`);

// Get all USA marinas
const usMarinas = await overpassService.queryByCountry('US');
```

### Query Specific Region:

```typescript
// Get marinas in San Francisco Bay
const sfBayMarinas = await overpassService.queryByRegion('San Francisco Bay');

// Get marinas in Mediterranean
const bounds: [number, number, number, number] = [30, -6, 46, 36]; // [S, W, N, E]
const medMarinas = await overpassService.queryMarinas(bounds);
```

### Query Globally:

```typescript
// WARNING: This takes ~10 minutes
const allMarinas = await overpassService.downloadAllMarinasWorldwide();
console.log(`Downloaded ${allMarinas.length} marinas`);
```

## 🔄 Data Structure

### OSM Marina Format:

```json
{
  "id": "2192703444",
  "type": "node",
  "lat": 22.3697806,
  "lon": 113.9908567,
  "tags": {
    "leisure": "marina",
    "name": "Gold Coast Yacht and Country Club",
    "website": "https://www.goldcoast.com.hk",
    "phone": "+852 2345 6789",
    "capacity": "200",
    "seamark:type": "harbour"
  }
}
```

### Converted to RegattaFlow Format:

```typescript
{
  name: "Gold Coast Yacht and Country Club",
  coordinates_lat: 22.3697806,
  coordinates_lng: 113.9908567,
  osm_id: "2192703444",
  osm_type: "node",
  website: "https://www.goldcoast.com.hk",
  phone: "+852 2345 6789",
  capacity: 200
}
```

## 🆚 OSM vs Google Places

| Feature | OSM (Free) | Google Places ($$$) |
|---------|------------|---------------------|
| **Global Coverage** | ✅ 10,000+ | ✅ 15,000+ |
| **Coordinates** | ✅ Accurate | ✅ Very Accurate |
| **Names** | ✅ 70% | ✅ 95% |
| **Addresses** | ⚠️ 30% | ✅ 100% |
| **Websites** | ⚠️ 10% | ✅ 80% |
| **Phone Numbers** | ⚠️ 5% | ✅ 90% |
| **Ratings/Reviews** | ❌ None | ✅ Yes |
| **Photos** | ❌ None | ✅ Yes |
| **Business Hours** | ⚠️ Rare | ✅ Yes |
| **Cost per 1000** | **$0** | **$32** |

## 📈 Recommended Implementation

### For RegattaFlow with Thousands of Venues:

```typescript
// 1. Bulk download from OSM (FREE)
const allMarinas = await overpassService.downloadAllMarinasWorldwide();

// 2. Import to database
await importToSupabase(allMarinas);

// 3. Mark premium venues for Google enhancement
await markPremiumVenues(['championship', 'premier']);

// 4. Enhance ONLY premium venues with Google (~100 venues)
await enhanceWithGoogle({ venueType: ['championship', 'premier'] });
```

**Result:**
- 10,000 venues from OSM: $0
- 100 premium venues enhanced with Google: $3.20
- **Total: $3.20 for 10,100 venues**

## ⚡ Performance Tips

### Rate Limiting:
- Overpass API: Max 2 requests/second (automatic in service)
- Google Places: No hard limit, but use 200ms delay

### Chunking:
- Download by region (built into script)
- Import to DB in batches of 1000

### Caching:
- Save OSM data to JSON file
- Re-import anytime without re-downloading

## 🔧 Troubleshooting

### Timeout Errors:
```
Error: Overpass API error: 504
```
**Solution:** Query smaller regions or use shorter timeout

### Empty Results:
```
Found 0 locations
```
**Solution:** Check bounding box coordinates (must be [S, W, N, E])

### Missing Names:
**Solution:** Many OSM marinas lack names - this is normal. You can:
1. Generate names from location: "Marina at {nearest_city}"
2. Exclude unnamed venues
3. Use Google Places for important venues

## 💾 Output Files

After running `npm run download:marinas`:

1. **`data/global-marinas.json`**
   - Full dataset (~10,000+ marinas)
   - Complete OSM tags
   - ~5-10 MB file size

2. **`data/import-marinas-sample.sql`**
   - Sample SQL (first 100 marinas)
   - Ready to run on Supabase
   - Template for full import

## 🎯 Next Steps

1. **Test:** `npm run download:marinas` (takes ~10 min)
2. **Review:** Check `data/global-marinas.json`
3. **Import:** Run SQL or create bulk import script
4. **Enhance:** Use Google for ~100 premium venues
5. **Done:** 10,000+ venues for ~$3 total

---

**Cost Comparison:**
- ❌ All 10,000 via Google: **$320**
- ✅ Hybrid (OSM + Google for 100): **$3**
- 💰 Savings: **$317** (99% cheaper!)
