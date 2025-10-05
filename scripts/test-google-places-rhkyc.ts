/**
 * Test Google Places API with RHKYC Locations
 * Generates SQL update statements for manual execution
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env
config({ path: resolve(__dirname, '../.env') });

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('❌ Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env');
  process.exit(1);
}

interface RHKYCLocation {
  id: string;
  name: string;
  currentLat: number;
  currentLng: number;
}

const rhkycLocations: RHKYCLocation[] = [
  {
    id: 'rhkyc',
    name: 'Royal Hong Kong Yacht Club Kellett Island',
    currentLat: 22.2845,
    currentLng: 114.1822,
  },
  {
    id: 'rhkyc-middle-island',
    name: 'Royal Hong Kong Yacht Club Middle Island',
    currentLat: 22.23422,
    currentLng: 114.18576,
  },
  {
    id: 'rhkyc-shelter-cove',
    name: 'Royal Hong Kong Yacht Club Shelter Cove',
    currentLat: 22.3837,
    currentLng: 114.2707,
  },
];

async function searchPlace(query: string, lat: number, lng: number) {
  const requestBody = {
    textQuery: query,
    includedType: 'marina',
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 10000, // 10km
      },
    },
    maxResultCount: 3,
  };

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY!,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.googleMapsUri',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function testRHKYC() {
  console.log('🗺️  Testing Google Places API with RHKYC Locations\n');
  console.log('='.repeat(70) + '\n');

  const updates: string[] = [];

  for (const location of rhkycLocations) {
    console.log(`📍 ${location.name}`);
    console.log(`   Current: ${location.currentLat}, ${location.currentLng}\n`);

    try {
      const data = await searchPlace(location.name, location.currentLat, location.currentLng);

      if (!data.places || data.places.length === 0) {
        console.log('   ❌ No results found\n');
        continue;
      }

      console.log(`   Found ${data.places.length} result(s):\n`);

      data.places.forEach((place: any, idx: number) => {
        console.log(`   ${idx + 1}. ${place.displayName?.text || 'Unknown'}`);
        console.log(`      📍 ${place.location.latitude}, ${place.location.longitude}`);
        console.log(`      📋 ${place.formattedAddress || 'No address'}`);
        console.log(`      🆔 ${place.id}`);
        if (place.rating) {
          console.log(`      ⭐ ${place.rating}/5.0 (${place.userRatingCount} reviews)`);
        }
        console.log(`      🔗 ${place.googleMapsUri || 'No URI'}\n`);
      });

      // Use best match (first result)
      const best = data.places[0];

      // Calculate distance
      const latDiff = Math.abs(best.location.latitude - location.currentLat);
      const lngDiff = Math.abs(best.location.longitude - location.currentLng);
      const distanceKm = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111;

      console.log(`   📏 Distance from current: ${distanceKm.toFixed(2)} km`);
      console.log(`   ✅ Using: ${best.displayName?.text}\n`);

      // Generate SQL
      const sql = `
UPDATE yacht_clubs
SET
  coordinates_lat = ${best.location.latitude},
  coordinates_lng = ${best.location.longitude},
  google_place_id = '${best.id}',
  google_maps_uri = '${best.googleMapsUri || ''}',
  formatted_address = '${(best.formattedAddress || '').replace(/'/g, "''")}',
  place_types = ARRAY['${(best.types || []).join("','")}']::TEXT[],
  rating = ${best.rating || 'NULL'},
  user_ratings_total = ${best.userRatingCount || 'NULL'},
  geocoded_at = NOW()
WHERE id = '${location.id}';
`.trim();

      updates.push(sql);

      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📋 GENERATED SQL UPDATES');
  console.log('='.repeat(70) + '\n');

  if (updates.length > 0) {
    console.log(updates.join('\n\n'));
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Generated ${updates.length} SQL statement(s)`);
    console.log('\nRun these via Supabase MCP to apply changes.');
  } else {
    console.log('❌ No updates generated');
  }

  console.log('\n💰 API Cost: $' + (rhkycLocations.length * 0.032).toFixed(3));
  console.log('   (Text Search: $0.032 per request)');
}

testRHKYC().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
