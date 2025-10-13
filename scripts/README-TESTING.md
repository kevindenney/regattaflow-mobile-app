# Venue Detection Testing Guide

## 🎯 Quick Start

### 1. Validate API Keys
```bash
npx tsx scripts/validate-api-keys.ts
```

Expected output:
- ✅ Anthropic AI: Working
- ✅ Supabase: Working
- ⚠️ Google Maps: May have restrictions (that's okay)

### 2. Test Venue Detection (Browser)

Open the testing tool:
```bash
open scripts/test-venue-browser.html
```

Or serve it:
```bash
npx http-server scripts -p 8082
# Then open: http://localhost:8082/test-venue-browser.html
```

**What to test:**
- Click "Hong Kong - Victoria Harbor" → Should detect `hong-kong-victoria-harbor`
- Click "Newport, Rhode Island" → Should detect `newport-rhode-island`
- Click "Pacific Ocean" → Should show "No venue found"

### 3. Test Coordinates

Use these coordinates in your browser console or app:

```javascript
// Hong Kong (should detect venue)
const hongKong = { lat: 22.2793, lng: 114.1628 };

// Newport (should detect venue)
const newport = { lat: 41.4901, lng: -71.3128 };

// Pacific Ocean (no venue)
const pacificOcean = { lat: 0.0, lng: -140.0 };
```

## 🐛 Troubleshooting

### Issue: "Unknown Venue" showing
**Cause:** Either:
1. Simulated GPS is not near any registered venue
2. Database query failed
3. Venue data structure mismatch

**Fix:**
1. Check browser console for errors
2. Use test coordinates from `test-venue-browser.html`
3. Verify Supabase RPC functions exist:
   ```sql
   -- Check if function exists
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('venues_within_radius', 'venues_within_bbox');
   ```

### Issue: Confirm button does nothing
**Cause:** `aiVenueResult.venueId` is null or undefined

**Fix:**
1. Check console logs for `🤖 Venue Agent Result`
2. Verify tool results contain `detect_venue_from_gps`
3. Fallback will automatically engage if AI fails

### Issue: Anthropic API not working
**Cause:** API key invalid or missing

**Fix:**
1. Run `npx tsx scripts/validate-api-keys.ts`
2. Check `.env` file has `EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...`
3. Fallback GPS detection will work without AI

## 📊 How Detection Works

### Flow with AI (Preferred)
```
1. Get GPS coordinates
2. Call VenueIntelligenceAgent.switchVenueByGPS()
3. Agent uses detect_venue_from_gps tool
4. Tool queries Supabase RPC venues_within_radius
5. Returns structured venue data
6. Show in modal
```

### Flow without AI (Fallback)
```
1. Get GPS coordinates
2. AI fails (no key, error, timeout)
3. Call detectVenueWithoutAI()
4. Query Supabase RPC directly
5. Calculate confidence score
6. Return same structured format
7. Show in modal with "GPS Fallback" tag
```

## 🧪 Test Cases

| Location | Lat | Lng | Expected Result |
|----------|-----|-----|-----------------|
| Hong Kong | 22.2793 | 114.1628 | hong-kong-victoria-harbor |
| Newport | 41.4901 | -71.3128 | newport-rhode-island |
| San Francisco | 37.8080 | -122.4177 | san-francisco-bay |
| Cowes, UK | 50.7631 | -1.2973 | cowes-isle-of-wight-uk |
| Pacific Ocean | 0.0 | -140.0 | No venue (>50km) |
| Atlantic Ocean | 30.0 | -40.0 | No venue (>50km) |

## 🔧 Debugging Tools

### Check venue data structure
```typescript
// In browser console or app
const result = await detectVenueWithoutAI(22.2793, 114.1628);
console.log('Venue result:', result);

// Should return:
{
  success: true,
  venueId: "hong-kong-victoria-harbor",
  venueName: "Hong Kong - Victoria Harbor",
  distance: 0.5, // km
  confidence: 0.99,
  coordinates: { lat: 22.2793, lng: 114.1628 },
  alternatives: [...]
}
```

### Test Supabase RPC directly
```bash
curl -X POST 'https://qavekrwdbsobecwrfxwu.supabase.co/rest/v1/rpc/venues_within_radius' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lat": 22.2793, "lng": 114.1628, "radius_km": 50}'
```

## 📝 Notes

- **AI Detection** is preferred but not required
- **GPS Fallback** works without any AI API keys
- **Confidence scores** range from 0.1 (far) to 1.0 (center)
- **50km radius** is the default search distance
- **3 alternatives** shown if multiple venues nearby
