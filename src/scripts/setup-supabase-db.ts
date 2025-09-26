/**
 * Direct Supabase Database Setup Script
 * Creates tables and inserts venue data directly via Supabase client
 */

import { supabase } from '@/src/services/supabase';

export async function setupSupabaseDatabase(): Promise<void> {
  console.log('🚀 [SETUP] Starting Supabase database setup...');

  try {
    // Step 1: Create sailing_venues table using raw SQL
    console.log('🏗️ [SETUP] Creating sailing_venues table...');

    const createVenuesTableSQL = `
      CREATE TABLE IF NOT EXISTS sailing_venues (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        coordinates_lng DECIMAL NOT NULL,
        coordinates_lat DECIMAL NOT NULL,
        country TEXT NOT NULL,
        region TEXT NOT NULL,
        venue_type TEXT CHECK (venue_type IN ('championship', 'premier', 'regional', 'local', 'club')) NOT NULL,
        established_year INTEGER,
        time_zone TEXT NOT NULL,
        data_quality TEXT CHECK (data_quality IN ('verified', 'community', 'estimated')) NOT NULL DEFAULT 'community',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: createVenuesError } = await supabase.rpc('exec_sql', {
      query: createVenuesTableSQL
    });

    if (createVenuesError && !createVenuesError.message.includes('already exists')) {
      console.log('⚠️ [SETUP] RPC exec_sql not available, trying direct query...');

      // Try using the REST API directly
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: createVenuesTableSQL })
      });

      if (!response.ok) {
        console.log('ℹ️ [SETUP] Direct SQL execution not available, will use insert-based table creation');
      }
    } else {
      console.log('✅ [SETUP] sailing_venues table created successfully');
    }

    // Step 2: Create yacht_clubs table
    console.log('🏗️ [SETUP] Creating yacht_clubs table...');

    const createClubsTableSQL = `
      CREATE TABLE IF NOT EXISTS yacht_clubs (
        id TEXT PRIMARY KEY,
        venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        short_name TEXT,
        prestige_level TEXT CHECK (prestige_level IN ('international', 'national', 'regional', 'local')) NOT NULL DEFAULT 'local',
        membership_type TEXT CHECK (membership_type IN ('private', 'public', 'reciprocal')) NOT NULL DEFAULT 'public',
        founded INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await supabase.rpc('exec_sql', { query: createClubsTableSQL });

    // Step 3: Insert venue data
    console.log('📊 [SETUP] Inserting venue data...');

    const venueData = [
      {
        id: 'hong-kong-victoria-harbor',
        name: 'Hong Kong - Victoria Harbor',
        coordinates_lng: 114.1694,
        coordinates_lat: 22.3193,
        country: 'Hong Kong SAR',
        region: 'asia-pacific',
        venue_type: 'premier',
        time_zone: 'Asia/Hong_Kong',
        established_year: 1849,
        data_quality: 'verified'
      },
      {
        id: 'cowes-solent',
        name: 'Cowes - The Solent',
        coordinates_lng: -1.2982,
        coordinates_lat: 50.7612,
        country: 'United Kingdom',
        region: 'europe',
        venue_type: 'premier',
        time_zone: 'Europe/London',
        established_year: 1815,
        data_quality: 'verified'
      },
      {
        id: 'americas-cup-san-francisco',
        name: 'America\'s Cup San Francisco Bay',
        coordinates_lng: -122.4194,
        coordinates_lat: 37.7749,
        country: 'United States',
        region: 'north-america',
        venue_type: 'championship',
        time_zone: 'America/Los_Angeles',
        established_year: 2013,
        data_quality: 'verified'
      },
      {
        id: 'americas-cup-auckland',
        name: 'America\'s Cup Auckland',
        coordinates_lng: 174.7633,
        coordinates_lat: -36.8485,
        country: 'New Zealand',
        region: 'oceania',
        venue_type: 'championship',
        time_zone: 'Pacific/Auckland',
        established_year: 2000,
        data_quality: 'verified'
      },
      {
        id: 'olympic-tokyo-enoshima',
        name: 'Olympic Sailing Venue - Enoshima',
        coordinates_lng: 139.4757,
        coordinates_lat: 35.3037,
        country: 'Japan',
        region: 'asia-pacific',
        venue_type: 'championship',
        time_zone: 'Asia/Tokyo',
        established_year: 1964,
        data_quality: 'verified'
      },
      {
        id: 'newport-rhode-island',
        name: 'Newport, Rhode Island',
        coordinates_lng: -71.3128,
        coordinates_lat: 41.4901,
        country: 'United States',
        region: 'north-america',
        venue_type: 'premier',
        time_zone: 'America/New_York',
        established_year: 1844,
        data_quality: 'verified'
      },
      {
        id: 'sydney-harbour',
        name: 'Sydney Harbour',
        coordinates_lng: 151.2093,
        coordinates_lat: -33.8688,
        country: 'Australia',
        region: 'oceania',
        venue_type: 'premier',
        time_zone: 'Australia/Sydney',
        established_year: 1862,
        data_quality: 'verified'
      },
      {
        id: 'chicago-great-lakes',
        name: 'Chicago - Great Lakes',
        coordinates_lng: -87.6298,
        coordinates_lat: 41.8781,
        country: 'United States',
        region: 'north-america',
        venue_type: 'regional',
        time_zone: 'America/Chicago',
        data_quality: 'community'
      },
      {
        id: 'palma-mallorca',
        name: 'Palma de Mallorca',
        coordinates_lng: 2.6502,
        coordinates_lat: 39.5696,
        country: 'Spain',
        region: 'europe',
        venue_type: 'regional',
        time_zone: 'Europe/Madrid',
        data_quality: 'community'
      },
      {
        id: 'singapore-marina-bay',
        name: 'Singapore - Marina Bay',
        coordinates_lng: 103.8198,
        coordinates_lat: 1.3521,
        country: 'Singapore',
        region: 'asia-pacific',
        venue_type: 'regional',
        time_zone: 'Asia/Singapore',
        data_quality: 'community'
      },
      {
        id: 'st-thomas-usvi',
        name: 'St. Thomas, US Virgin Islands',
        coordinates_lng: -64.9631,
        coordinates_lat: 18.3381,
        country: 'US Virgin Islands',
        region: 'caribbean',
        venue_type: 'regional',
        time_zone: 'America/Puerto_Rico',
        established_year: 1960,
        data_quality: 'verified'
      },
      {
        id: 'bvi-tortola',
        name: 'British Virgin Islands - Tortola',
        coordinates_lng: -64.6208,
        coordinates_lat: 18.4207,
        country: 'British Virgin Islands',
        region: 'caribbean',
        venue_type: 'regional',
        time_zone: 'America/Puerto_Rico',
        established_year: 1970,
        data_quality: 'verified'
      }
    ];

    const { data: insertedVenues, error: venuesInsertError } = await supabase
      .from('sailing_venues')
      .insert(venueData)
      .select();

    if (venuesInsertError) {
      console.error('❌ [SETUP] Failed to insert venues:', venuesInsertError);
      throw venuesInsertError;
    }

    console.log(`✅ [SETUP] Inserted ${insertedVenues?.length || 0} venues successfully`);

    // Step 4: Insert yacht club data
    console.log('⛵ [SETUP] Inserting yacht club data...');

    const clubData = [
      {
        id: 'rhkyc',
        venue_id: 'hong-kong-victoria-harbor',
        name: 'Royal Hong Kong Yacht Club',
        short_name: 'RHKYC',
        prestige_level: 'international',
        membership_type: 'private',
        founded: 1849
      },
      {
        id: 'royal-yacht-squadron',
        venue_id: 'cowes-solent',
        name: 'Royal Yacht Squadron',
        short_name: 'RYS',
        prestige_level: 'international',
        membership_type: 'private',
        founded: 1815
      },
      {
        id: 'st-francis-yacht-club',
        venue_id: 'americas-cup-san-francisco',
        name: 'St. Francis Yacht Club',
        short_name: 'StFYC',
        prestige_level: 'international',
        membership_type: 'private'
      },
      {
        id: 'royal-new-zealand-yacht-squadron',
        venue_id: 'americas-cup-auckland',
        name: 'Royal New Zealand Yacht Squadron',
        short_name: 'RNZYS',
        prestige_level: 'international',
        membership_type: 'private'
      },
      {
        id: 'enoshima-yacht-club',
        venue_id: 'olympic-tokyo-enoshima',
        name: 'Enoshima Yacht Club',
        prestige_level: 'national',
        membership_type: 'public'
      },
      {
        id: 'new-york-yacht-club',
        venue_id: 'newport-rhode-island',
        name: 'New York Yacht Club',
        short_name: 'NYYC',
        prestige_level: 'international',
        membership_type: 'private',
        founded: 1844
      },
      {
        id: 'cruising-yacht-club-australia',
        venue_id: 'sydney-harbour',
        name: 'Cruising Yacht Club of Australia',
        short_name: 'CYCA',
        prestige_level: 'international',
        membership_type: 'private',
        founded: 1862
      },
      {
        id: 'st-thomas-yacht-club',
        venue_id: 'st-thomas-usvi',
        name: 'St. Thomas Yacht Club',
        short_name: 'STYC',
        prestige_level: 'regional',
        membership_type: 'private',
        founded: 1963
      }
    ];

    const { data: insertedClubs, error: clubsInsertError } = await supabase
      .from('yacht_clubs')
      .insert(clubData)
      .select();

    if (clubsInsertError) {
      console.error('❌ [SETUP] Failed to insert clubs:', clubsInsertError);
      throw clubsInsertError;
    }

    console.log(`✅ [SETUP] Inserted ${insertedClubs?.length || 0} yacht clubs successfully`);

    // Step 5: Verify the setup
    console.log('🔍 [SETUP] Verifying database setup...');

    const { count: venueCount } = await supabase
      .from('sailing_venues')
      .select('*', { count: 'exact', head: true });

    const { count: clubCount } = await supabase
      .from('yacht_clubs')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ [SETUP] Database setup complete!`);
    console.log(`📊 [SETUP] Final counts: ${venueCount} venues, ${clubCount} yacht clubs`);

  } catch (error: any) {
    console.error('❌ [SETUP] Database setup failed:', error);
    throw error;
  }
}

// Export for use in other modules
export { setupSupabaseDatabase };