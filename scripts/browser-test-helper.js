/**
 * Browser Console Testing Helper
 * Copy this into your browser console while the app is running
 * Usage: testVenue(lat, lng)
 */

// Test coordinates
const VENUES = {
  hongKong: { lat: 22.2793, lng: 114.1628, name: 'Hong Kong - Victoria Harbor' },
  newport: { lat: 41.4901, lng: -71.3128, name: 'Newport, Rhode Island' },
  sanFrancisco: { lat: 37.8080, lng: -122.4177, name: 'San Francisco Bay' },
  cowes: { lat: 50.7631, lng: -1.2973, name: 'Cowes, Isle of Wight' },
  sydney: { lat: -33.8568, lng: 151.2153, name: 'Sydney Harbor' },
  pacific: { lat: 0.0, lng: -140.0, name: 'Pacific Ocean (no venue)' },
};

// Supabase config
const SUPABASE_URL = 'https://qavekrwdbsobecwrfxwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjU3MzIsImV4cCI6MjA3NDUwMTczMn0.VC9qBK7M-LMIy0hIUJn1xpZRRdT7oZB1U0KO0-t-xFg';

// Test function
async function testVenue(lat, lng) {
  console.log(`\n🧪 Testing coordinates: ${lat}, ${lng}`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/venues_within_radius`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          lat,
          lng,
          radius_km: 50,
        }),
      }
    );

    const data = await response.json();

    if (data.length > 0) {
      console.log(`✅ Found ${data.length} venue(s):`);
      data.slice(0, 5).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.name}`);
        console.log(`     ID: ${v.id}`);
        console.log(`     Distance: ${v.distance_km.toFixed(1)} km`);
        console.log(`     Coords: ${v.coordinates.coordinates[1].toFixed(4)}, ${v.coordinates.coordinates[0].toFixed(4)}\n`);
      });
      return data;
    } else {
      console.log('❌ No venues found within 50km');
      return [];
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

// Quick test all venues
async function testAll() {
  console.log('🌊 Testing all venues...\n');

  for (const [key, venue] of Object.entries(VENUES)) {
    console.log(`\n📍 ${venue.name}`);
    await testVenue(venue.lat, venue.lng);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }

  console.log('\n✅ All tests complete!');
}

// Print available commands
console.log(`
🌊 Venue Detection Test Helper Loaded!

Available commands:
  testVenue(lat, lng)     - Test specific coordinates
  testAll()               - Test all preset venues
  VENUES                  - View preset coordinates

Examples:
  testVenue(22.2793, 114.1628)  // Hong Kong
  testVenue(41.4901, -71.3128)  // Newport
  testAll()                      // Test everything
`);
