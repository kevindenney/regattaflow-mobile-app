/**
 * Fix RHKYC Location Coordinates Using Nominatim
 * Uses OpenStreetMap geocoding to get accurate coordinates for RHKYC's three locations
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') });

import { NominatimService } from '../src/services/location/NominatimService';
import { supabase } from '../src/services/supabase';

const nominatimService = new NominatimService();

interface RHKYCLocation {
  id: string;
  name: string;
  searchQuery: string;
  expectedArea: string;
}

const rhkycLocations: RHKYCLocation[] = [
  {
    id: 'rhkyc',
    name: 'Royal Hong Kong Yacht Club - Kellett Island',
    searchQuery: 'Royal Hong Kong Yacht Club, Kellett Island, Causeway Bay, Hong Kong',
    expectedArea: 'Causeway Bay',
  },
  {
    id: 'rhkyc-middle-island',
    name: 'Royal Hong Kong Yacht Club - Middle Island',
    searchQuery: 'Royal Hong Kong Yacht Club Middle Island, Hong Kong',
    expectedArea: 'Stanley',
  },
  {
    id: 'rhkyc-shelter-cove',
    name: 'Royal Hong Kong Yacht Club - Port Shelter',
    searchQuery: 'Royal Hong Kong Yacht Club Port Shelter, Sai Kung, Hong Kong',
    expectedArea: 'Sai Kung',
  },
];

async function fixRHKYCLocations() {
  console.log('🔧 Fixing RHKYC Location Coordinates using OpenStreetMap\n');

  for (const location of rhkycLocations) {
    console.log(`📍 Processing: ${location.name}`);
    console.log(`   Query: "${location.searchQuery}"`);

    try {
      // Search Nominatim with country filter for Hong Kong
      const results = await nominatimService.search(location.searchQuery, {
        countrycodes: 'hk',
        limit: 3,
      });

      if (results.length === 0) {
        console.log(`   ❌ No results found\n`);
        continue;
      }

      // Display all results for manual verification
      console.log(`   Found ${results.length} result(s):`);
      results.forEach((result, idx) => {
        console.log(`   ${idx + 1}. ${result.displayName}`);
        console.log(`      📍 ${result.lat}, ${result.lng}`);
        console.log(`      OSM: ${result.osmType}/${result.osmId}`);
      });

      // Take the first (best) result
      const bestMatch = results[0];

      // Get current coordinates for comparison
      const { data: currentData } = await supabase
        .from('yacht_clubs')
        .select('coordinates_lat, coordinates_lng')
        .eq('id', location.id)
        .single();

      if (currentData) {
        console.log(`   📊 Current: ${currentData.coordinates_lat}, ${currentData.coordinates_lng}`);
        console.log(`   📊 New:     ${bestMatch.lat}, ${bestMatch.lng}`);

        const latDiff = Math.abs(bestMatch.lat - parseFloat(currentData.coordinates_lat));
        const lngDiff = Math.abs(bestMatch.lng - parseFloat(currentData.coordinates_lng));

        console.log(`   📏 Difference: ${latDiff.toFixed(4)}°, ${lngDiff.toFixed(4)}°`);
      }

      // Update database with OSM coordinates
      const { error } = await supabase
        .from('yacht_clubs')
        .update({
          coordinates_lat: bestMatch.lat,
          coordinates_lng: bestMatch.lng,
          osm_id: bestMatch.osmId,
          osm_type: bestMatch.osmType,
          osm_display_name: bestMatch.displayName,
          geocoded_at: new Date().toISOString(),
        })
        .eq('id', location.id);

      if (error) {
        console.log(`   ❌ Update failed: ${error.message}\n`);
      } else {
        console.log(`   ✅ Updated successfully\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✨ RHKYC location fix complete!');
  console.log('\n📋 Summary:');

  // Fetch updated locations
  const { data: updatedLocations } = await supabase
    .from('yacht_clubs')
    .select('id, name, short_name, coordinates_lat, coordinates_lng, osm_display_name, geocoded_at')
    .in('id', rhkycLocations.map(l => l.id))
    .order('name');

  if (updatedLocations) {
    updatedLocations.forEach(club => {
      console.log(`\n${club.short_name || club.name}:`);
      console.log(`  📍 ${club.coordinates_lat}, ${club.coordinates_lng}`);
      console.log(`  🗺️  ${club.osm_display_name || 'No OSM data'}`);
      console.log(`  🕒 Geocoded: ${club.geocoded_at || 'Never'}`);
    });
  }

  process.exit(0);
}

// Run the script
fixRHKYCLocations().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
