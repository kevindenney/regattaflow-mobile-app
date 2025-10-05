/**
 * Batch Enrich Yacht Clubs with Google Places
 * Fetches data from Supabase MCP and enriches with Google Places API
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('❌ Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

interface YachtClub {
  id: string;
  name: string;
  short_name?: string;
  coordinates_lat: number;
  coordinates_lng: number;
  venue_id: string;
}

// Clubs to process (paste from Supabase query)
const clubs: YachtClub[] = [
  {"id":"aberdeen-boat-club","name":"Aberdeen Boat Club","short_name":"ABC","coordinates_lat":22.24,"coordinates_lng":114.16,"venue_id":"hong-kong-victoria-harbor"},
  {"id":"aberdeen-marina-club","name":"Aberdeen Marina Club","short_name":"AMC","coordinates_lat":22.2444,"coordinates_lng":114.1648,"venue_id":"hong-kong-victoria-harbor"},
  {"id":"annapolis-yacht-club","name":"Annapolis Yacht Club","short_name":"AYC","coordinates_lat":38.9784,"coordinates_lng":-76.4922,"venue_id":"annapolis-chesapeake"},
  {"id":"beverly-yacht-club","name":"Beverly Yacht Club","short_name":"BYC","coordinates_lat":41.698,"coordinates_lng":-70.7612,"venue_id":"marion-buzzards-bay"},
  {"id":"chesapeake-bay-yacht-club","name":"Chesapeake Bay Yacht Club","short_name":"CBYC","coordinates_lat":38.975,"coordinates_lng":-76.485,"venue_id":"annapolis-chesapeake"},
  {"id":"chicago-yacht-club","name":"Chicago Yacht Club","short_name":"CYC","coordinates_lat":41.887,"coordinates_lng":-87.618,"venue_id":"chicago-lake-michigan"},
  {"id":"club-nautico-ibiza","name":"Club Náutico de Ibiza","short_name":"CNI","coordinates_lat":39.5696,"coordinates_lng":2.6502,"venue_id":"ibiza-balearic"},
  {"id":"club-nautico-san-juan","name":"Club Náutico de San Juan","short_name":"CNSJ","coordinates_lat":18.4655,"coordinates_lng":-66.1057,"venue_id":"puerto-rico-san-juan"},
  {"id":"columbia-yacht-club","name":"Columbia Yacht Club","short_name":"CoYC","coordinates_lat":41.89,"coordinates_lng":-87.61,"venue_id":"chicago-lake-michigan"},
  {"id":"corinthian-yacht-club-sf","name":"Corinthian Yacht Club","short_name":"CYC","coordinates_lat":37.869,"coordinates_lng":-122.501,"venue_id":"sausalito-california"}
];

async function searchPlace(club: YachtClub) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus'
    },
    body: JSON.stringify({
      textQuery: club.name,
      includedType: 'marina',
      locationBias: {
        circle: {
          center: { latitude: club.coordinates_lat, longitude: club.coordinates_lng },
          radius: 10000 // 10km
        }
      },
      maxResultCount: 1
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}

async function enrichClubs() {
  console.log(`🗺️  Enriching ${clubs.length} Yacht Clubs\n`);
  console.log('='.repeat(70) + '\n');

  const updates: string[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i];

    console.log(`[${i + 1}/${clubs.length}] ${club.name}`);

    try {
      const data = await searchPlace(club);

      if (!data.places || data.places.length === 0) {
        console.log(`   ❌ Not found\n`);
        failCount++;
        continue;
      }

      const place = data.places[0];

      console.log(`   ✅ ${place.displayName?.text || 'Found'}`);
      console.log(`   📍 ${place.location.latitude}, ${place.location.longitude}`);
      if (place.rating) {
        console.log(`   ⭐ ${place.rating}/5.0 (${place.userRatingCount} reviews)`);
      }
      console.log();

      // Generate SQL
      const sql = `
UPDATE yacht_clubs
SET
  coordinates_lat = ${place.location.latitude},
  coordinates_lng = ${place.location.longitude},
  google_place_id = '${place.id}',
  google_maps_uri = '${place.googleMapsUri || ''}',
  formatted_address = '${(place.formattedAddress || '').replace(/'/g, "''")}',
  place_types = ARRAY['${(place.types || []).join("','")}']::TEXT[],
  rating = ${place.rating || 'NULL'},
  user_ratings_total = ${place.userRatingCount || 'NULL'},
  business_status = ${place.businessStatus ? `'${place.businessStatus}'` : 'NULL'},
  geocoded_at = NOW()
WHERE id = '${club.id}';
`.trim();

      updates.push(sql);
      successCount++;

      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📋 GENERATED SQL UPDATES');
  console.log('='.repeat(70) + '\n');

  if (updates.length > 0) {
    console.log(updates.join('\n\n'));
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`\n💰 Cost: $${(successCount * 0.032).toFixed(2)}`);
  } else {
    console.log('❌ No updates generated');
  }
}

enrichClubs().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
