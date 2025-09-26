/**
 * Browser-based Database Setup
 * Run this in the browser console to set up Supabase tables
 */

import { supabase } from '@/src/services/supabase';

// Make this available globally for browser console
(window as any).setupSupabaseVenues = async function() {
  console.log('🚀 Starting Supabase venue database setup...');

  // First, let's try to create tables using individual INSERT operations
  // This will cause Supabase to auto-create the table with inferred schema

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

  try {
    console.log('📊 Inserting venue data...');
    const { data: insertedVenues, error: venuesError } = await supabase
      .from('sailing_venues')
      .insert(venueData)
      .select();

    if (venuesError) {
      console.error('❌ Failed to insert venues:', venuesError);
      return;
    }

    console.log(`✅ Successfully inserted ${insertedVenues?.length || 0} venues!`);

    // Now insert yacht clubs
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

    console.log('⛵ Inserting yacht clubs...');
    const { data: insertedClubs, error: clubsError } = await supabase
      .from('yacht_clubs')
      .insert(clubData)
      .select();

    if (clubsError) {
      console.error('❌ Failed to insert clubs:', clubsError);
      return;
    }

    console.log(`✅ Successfully inserted ${insertedClubs?.length || 0} yacht clubs!`);

    // Verify the data
    const { count: venueCount } = await supabase
      .from('sailing_venues')
      .select('*', { count: 'exact', head: true });

    const { count: clubCount } = await supabase
      .from('yacht_clubs')
      .select('*', { count: 'exact', head: true });

    console.log(`🎉 Database setup complete! ${venueCount} venues, ${clubCount} clubs`);
    console.log('💡 Now refresh the page to see the venues load from Supabase!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
};

console.log('🚀 Database setup function ready! Run: setupSupabaseVenues()');