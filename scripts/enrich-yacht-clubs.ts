/**
 * Bulk Enrich Yacht Club Locations Using Nominatim
 * Uses OpenStreetMap geocoding to improve coordinates for all yacht clubs
 *
 * Features:
 * - Respects Nominatim 1 req/sec rate limit
 * - Skips already geocoded clubs (unless --force flag)
 * - Shows before/after comparison
 * - Dry run mode for testing
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') });

import { NominatimService } from '../src/services/location/NominatimService';
import { supabase } from '../src/services/supabase';

const nominatimService = new NominatimService();

interface EnrichmentOptions {
  force?: boolean; // Re-geocode even if already done
  dryRun?: boolean; // Don't actually update database
  limit?: number; // Max number of clubs to process
  skipIds?: string[]; // Club IDs to skip
}

interface YachtClub {
  id: string;
  name: string;
  short_name?: string;
  venue_id: string;
  coordinates_lat: number;
  coordinates_lng: number;
  osm_id?: string;
  geocoded_at?: string;
  country?: string;
}

async function enrichYachtClubs(options: EnrichmentOptions = {}) {
  console.log('🌍 Enriching Yacht Club Locations with OpenStreetMap\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No database changes will be made\n');
  }

  // Fetch yacht clubs that need geocoding
  let query = supabase
    .from('yacht_clubs')
    .select(`
      id, name, short_name, venue_id,
      coordinates_lat, coordinates_lng,
      osm_id, geocoded_at
    `)
    .order('name');

  // Skip already geocoded unless force flag
  if (!options.force) {
    query = query.is('osm_id', null);
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
    console.log('✅ No yacht clubs need geocoding!');
    process.exit(0);
  }

  console.log(`📊 Found ${clubs.length} yacht club(s) to process\n`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i] as YachtClub;

    // Skip if in skip list
    if (options.skipIds?.includes(club.id)) {
      console.log(`⏭️  Skipping: ${club.name} (in skip list)\n`);
      skipCount++;
      continue;
    }

    console.log(`[${i + 1}/${clubs.length}] ${club.name}`);
    console.log(`   Current: ${club.coordinates_lat}, ${club.coordinates_lng}`);

    try {
      // Get venue info for country context
      const { data: venue } = await supabase
        .from('sailing_venues')
        .select('country')
        .eq('id', club.venue_id)
        .single();

      const country = venue?.country;

      // Geocode the yacht club
      const result = await nominatimService.geocodeYachtClub(club.name, country);

      if (!result) {
        console.log(`   ❌ No results found\n`);
        failCount++;
        continue;
      }

      console.log(`   Found: ${result.displayName}`);
      console.log(`   New:   ${result.lat}, ${result.lng}`);

      // Calculate difference
      const latDiff = Math.abs(result.lat - club.coordinates_lat);
      const lngDiff = Math.abs(result.lng - club.coordinates_lng);
      const distanceKm = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111; // Rough km conversion

      console.log(`   📏 Distance: ~${distanceKm.toFixed(2)} km`);

      // Update database (unless dry run)
      if (!options.dryRun) {
        const { error: updateError } = await supabase
          .from('yacht_clubs')
          .update({
            coordinates_lat: result.lat,
            coordinates_lng: result.lng,
            osm_id: result.osmId,
            osm_type: result.osmType,
            osm_display_name: result.displayName,
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
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`📊 Total:   ${clubs.length}`);

  if (options.dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

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
};

// Run the script
enrichYachtClubs(options).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
