/**
 * Enrich Yacht Clubs with Google Places Data
 * Uses Google Places API for accurate coordinates, photos, ratings, and metadata
 *
 * Usage:
 *   npm run geocode:google         - Process all clubs
 *   npm run geocode:google:dry-run - Preview without updating
 */

/**
 * Note: This script outputs SQL for you to run via Supabase MCP
 * We don't directly connect to Supabase to avoid credential issues
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { GooglePlacesService } from '../src/services/location/GooglePlacesService';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;

if (!googleApiKey) {
  console.error('❌ Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env');
  console.error('   Add to .env: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here');
  process.exit(1);
}

const googlePlaces = new GooglePlacesService(googleApiKey);

interface YachtClub {
  id: string;
  name: string;
  short_name?: string;
  venue_id: string;
  coordinates_lat: number;
  coordinates_lng: number;
  google_place_id?: string;
}

interface EnrichmentOptions {
  force?: boolean; // Re-geocode even if already done
  dryRun?: boolean; // Don't update database
  limit?: number; // Max clubs to process
  clubId?: string; // Process specific club only
}

async function enrichYachtClubs(options: EnrichmentOptions = {}) {
  console.log('🗺️  Enriching Yacht Clubs with Google Places API\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No database changes\n');
  }

  // Fetch yacht clubs
  let query = supabase
    .from('yacht_clubs')
    .select('id, name, short_name, venue_id, coordinates_lat, coordinates_lng, google_place_id')
    .order('name');

  if (options.clubId) {
    query = query.eq('id', options.clubId);
  } else if (!options.force) {
    query = query.is('google_place_id', null);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data: clubs, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch yacht clubs:', error);
    process.exit(1);
  }

  if (!clubs || clubs.length === 0) {
    console.log('✅ No yacht clubs need processing!');
    process.exit(0);
  }

  console.log(`📊 Processing ${clubs.length} yacht club(s)\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i] as YachtClub;

    console.log(`[${i + 1}/${clubs.length}] ${club.name}`);
    console.log(`   Current: ${club.coordinates_lat}, ${club.coordinates_lng}`);

    try {
      // Search Google Places with location bias
      const results = await googlePlaces.searchYachtClub(club.name, {
        latitude: club.coordinates_lat,
        longitude: club.coordinates_lng,
        radius: 10000, // 10km radius
      });

      if (results.length === 0) {
        console.log(`   ❌ No results found\n`);
        failCount++;
        continue;
      }

      console.log(`   Found ${results.length} result(s):`);
      results.forEach((result, idx) => {
        console.log(`   ${idx + 1}. ${result.displayName}`);
        console.log(`      📍 ${result.location.latitude}, ${result.location.longitude}`);
        console.log(`      🆔 ${result.placeId}`);
        if (result.rating) {
          console.log(`      ⭐ ${result.rating} (${result.userRatingsTotal} reviews)`);
        }
      });

      const bestMatch = results[0];

      // Get detailed place information
      console.log(`   🔍 Fetching place details...`);
      const details = await googlePlaces.getPlaceDetails(bestMatch.placeId);

      if (!details) {
        console.log(`   ❌ Failed to get place details\n`);
        failCount++;
        continue;
      }

      console.log(`   ✅ Got details: ${details.formattedAddress}`);

      // Calculate distance change
      const latDiff = Math.abs(details.location.latitude - club.coordinates_lat);
      const lngDiff = Math.abs(details.location.longitude - club.coordinates_lng);
      const distanceKm = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111;

      console.log(`   📏 Distance correction: ~${distanceKm.toFixed(2)} km`);

      // Update database
      if (!options.dryRun) {
        const { error: updateError } = await supabase
          .from('yacht_clubs')
          .update({
            coordinates_lat: details.location.latitude,
            coordinates_lng: details.location.longitude,
            google_place_id: details.placeId,
            google_maps_uri: details.googleMapsUri,
            formatted_address: details.formattedAddress,
            place_types: details.types,
            rating: details.rating,
            user_ratings_total: details.userRatingsTotal,
            phone_number: details.phoneNumber || details.internationalPhoneNumber,
            business_status: details.businessStatus,
            website: details.website || club.id, // Keep existing if no Google website
            geocoded_at: new Date().toISOString(),
          })
          .eq('id', club.id);

        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}\n`);
          failCount++;
        } else {
          console.log(`   ✅ Updated\n`);
          successCount++;
        }
      } else {
        console.log(`   ✅ Would update (dry run)\n`);
        successCount++;
      }

      // Rate limiting - be nice to Google
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 ENRICHMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed:  ${failCount}`);
  console.log(`📊 Total:   ${clubs.length}`);

  if (options.dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  console.log('\n💰 Estimated Google API cost: $' + (clubs.length * 0.049).toFixed(2));
  console.log('   (Text Search: $0.032 + Place Details: $0.017 per club)');

  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: EnrichmentOptions = {
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  limit: args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1])
    : undefined,
  clubId: args.includes('--club')
    ? args[args.indexOf('--club') + 1]
    : undefined,
};

// Run
enrichYachtClubs(options).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
