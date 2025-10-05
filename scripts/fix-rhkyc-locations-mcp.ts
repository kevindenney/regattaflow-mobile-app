/**
 * Fix RHKYC Location Coordinates Using Nominatim
 * Uses OpenStreetMap geocoding via direct API calls
 * This version doesn't need Supabase client - we'll output SQL to run manually
 */

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  osm_id: string;
  osm_type: string;
}

interface RHKYCLocation {
  id: string;
  name: string;
  searchQuery: string;
}

const rhkycLocations: RHKYCLocation[] = [
  {
    id: 'rhkyc',
    name: 'Royal Hong Kong Yacht Club - Kellett Island',
    searchQuery: 'Royal Hong Kong Yacht Club Causeway Bay',
  },
  {
    id: 'rhkyc-middle-island',
    name: 'Royal Hong Kong Yacht Club - Middle Island',
    searchQuery: 'Middle Island Hong Kong',
  },
  {
    id: 'rhkyc-shelter-cove',
    name: 'Royal Hong Kong Yacht Club - Port Shelter',
    searchQuery: 'Port Shelter Sai Kung Hong Kong',
  },
];

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    countrycodes: 'hk',
    limit: '3',
  });

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RegattaFlow/1.0 (Sailing Race Management App)',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  return await response.json();
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixRHKYCLocations() {
  console.log('🔧 Fixing RHKYC Location Coordinates using OpenStreetMap\n');
  console.log('This will generate SQL update statements for you to run.\n');

  const updates: string[] = [];

  for (const location of rhkycLocations) {
    console.log(`📍 Processing: ${location.name}`);
    console.log(`   Query: "${location.searchQuery}"`);

    try {
      const results = await searchNominatim(location.searchQuery);

      if (results.length === 0) {
        console.log(`   ❌ No results found\n`);
        continue;
      }

      console.log(`   Found ${results.length} result(s):`);
      results.forEach((result, idx) => {
        console.log(`   ${idx + 1}. ${result.display_name}`);
        console.log(`      📍 ${result.lat}, ${result.lon}`);
        console.log(`      OSM: ${result.osm_type}/${result.osm_id}`);
      });

      const bestMatch = results[0];

      console.log(`   ✅ Using best match\n`);

      // Generate SQL update
      const sql = `
UPDATE yacht_clubs
SET
  coordinates_lat = ${bestMatch.lat},
  coordinates_lng = ${bestMatch.lon},
  osm_id = '${bestMatch.osm_id}',
  osm_type = '${bestMatch.osm_type}',
  osm_display_name = '${bestMatch.display_name.replace(/'/g, "''")}',
  geocoded_at = NOW()
WHERE id = '${location.id}';
`.trim();

      updates.push(sql);

      // Rate limiting - 1 req/sec
      await delay(1000);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📋 GENERATED SQL UPDATES');
  console.log('='.repeat(70) + '\n');

  if (updates.length > 0) {
    const fullSQL = updates.join('\n\n');
    console.log(fullSQL);
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Generated ${updates.length} SQL update statement(s)`);
    console.log('Run these via Supabase MCP or SQL editor to apply changes.');
  } else {
    console.log('❌ No updates generated');
  }
}

// Run the script
fixRHKYCLocations().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
