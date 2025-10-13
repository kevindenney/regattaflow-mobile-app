/**
 * Test Venue Coordinates
 * Use these coordinates to test GPS-based venue detection
 */

export const TEST_COORDINATES = {
  // Hong Kong - Victoria Harbor
  hongKong: {
    name: 'Hong Kong - Victoria Harbor',
    lat: 22.2793,
    lng: 114.1628,
    venueId: 'hong-kong-victoria-harbor',
    description: 'Premier racing venue in Hong Kong with RHKYC'
  },

  // Newport, Rhode Island
  newport: {
    name: 'Newport, Rhode Island',
    lat: 41.4901,
    lng: -71.3128,
    venueId: 'newport-rhode-island',
    description: 'Americas Cup venue, home of NYYC'
  },

  // San Francisco Bay
  sanFrancisco: {
    name: 'San Francisco Bay',
    lat: 37.8080,
    lng: -122.4177,
    venueId: 'san-francisco-bay',
    description: 'Championship venue with challenging conditions'
  },

  // Cowes, Isle of Wight
  cowes: {
    name: 'Cowes, Isle of Wight',
    lat: 50.7631,
    lng: -1.2973,
    venueId: 'cowes-isle-of-wight-uk',
    description: 'Historic British sailing venue, home of Cowes Week'
  },

  // Sydney Harbor
  sydney: {
    name: 'Sydney Harbor',
    lat: -33.8568,
    lng: 151.2153,
    venueId: 'sydney-harbour-australia',
    description: 'Australian premier racing venue'
  },

  // Lake Garda, Italy
  lakeGarda: {
    name: 'Lake Garda, Italy',
    lat: 45.7666,
    lng: 10.7273,
    venueId: 'lake-garda-italy',
    description: 'Championship inland venue with reliable winds'
  },

  // Auckland, New Zealand
  auckland: {
    name: 'Auckland, New Zealand',
    lat: -36.8485,
    lng: 174.7633,
    venueId: 'auckland-new-zealand',
    description: 'Americas Cup venue 2021, Waitemata Harbour'
  },

  // Bermuda
  bermuda: {
    name: 'Bermuda',
    lat: 32.2949,
    lng: -64.7780,
    venueId: 'bermuda',
    description: 'Americas Cup venue 2017, Great Sound'
  },

  // Middle of Pacific Ocean (No venue)
  pacificOcean: {
    name: 'Pacific Ocean - No Venue',
    lat: 0.0,
    lng: -140.0,
    venueId: null,
    description: 'Test case: No venue should be detected here'
  },

  // Middle of Atlantic Ocean (No venue)
  atlanticOcean: {
    name: 'Atlantic Ocean - No Venue',
    lat: 30.0,
    lng: -40.0,
    venueId: null,
    description: 'Test case: No venue should be detected here'
  }
};

/**
 * Print test instructions
 */
export function printTestInstructions() {
  console.log('\n📍 VENUE DETECTION TEST COORDINATES\n');
  console.log('Copy and paste these in your browser console to test:');
  console.log('-----------------------------------------------\n');

  Object.entries(TEST_COORDINATES).forEach(([key, coords]) => {
    console.log(`${coords.name}:`);
    console.log(`  Lat: ${coords.lat}, Lng: ${coords.lng}`);
    if (coords.venueId) {
      console.log(`  Expected: ${coords.venueId}`);
    } else {
      console.log(`  Expected: No venue detected`);
    }
    console.log(`  ${coords.description}\n`);
  });
}

/**
 * Quick test using fetch
 */
export async function testCoordinates(lat: number, lng: number) {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials not configured');
    return;
  }

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
      console.log(`✅ Found ${data.length} venues:`);
      data.slice(0, 3).forEach((v: any) => {
        console.log(`  - ${v.name} (${v.distance_km.toFixed(1)} km)`);
      });
    } else {
      console.log('❌ No venues found within 50km');
    }

    return data;
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

// Export for easy access
export default TEST_COORDINATES;
