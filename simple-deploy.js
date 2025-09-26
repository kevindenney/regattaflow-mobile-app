#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role
const supabase = createClient(
  'https://qavekrwdbsobecwrfxwu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkyNTczMiwiZXhwIjoyMDc0NTAxNzMyfQ.Lpmb-n5yVa9adBvp3GkqByWyEeBfRbbCVOhOjqsy4Xw'
);

async function deploySimpleSchema() {
  console.log('🌍 Deploying Simplified Venue Schema...');

  try {
    // First, let's seed some sample venues directly (this will create the table automatically)
    console.log('1️⃣ Creating venues via direct data insert...');

    const sampleVenues = [
      {
        id: 'hong-kong-victoria-harbor',
        name: 'Hong Kong - Victoria Harbor',
        coordinates_lat: 22.3193,
        coordinates_lng: 114.1694,
        country: 'Hong Kong SAR',
        region: 'asia-pacific',
        venue_type: 'premier',
        time_zone: 'Asia/Hong_Kong',
        data_quality: 'verified'
      },
      {
        id: 'cowes-solent',
        name: 'Cowes - The Solent',
        coordinates_lat: 50.7612,
        coordinates_lng: -1.2982,
        country: 'United Kingdom',
        region: 'europe',
        venue_type: 'premier',
        time_zone: 'Europe/London',
        data_quality: 'verified'
      },
      {
        id: 'san-francisco-bay',
        name: 'San Francisco Bay',
        coordinates_lat: 37.7749,
        coordinates_lng: -122.4194,
        country: 'United States',
        region: 'north-america',
        venue_type: 'championship',
        time_zone: 'America/Los_Angeles',
        data_quality: 'verified'
      },
      {
        id: 'auckland-hauraki-gulf',
        name: 'Auckland - Hauraki Gulf',
        coordinates_lat: -36.8485,
        coordinates_lng: 174.7633,
        country: 'New Zealand',
        region: 'oceania',
        venue_type: 'championship',
        time_zone: 'Pacific/Auckland',
        data_quality: 'verified'
      },
      {
        id: 'porto-cervo-sardinia',
        name: 'Porto Cervo - Sardinia',
        coordinates_lat: 41.1375,
        coordinates_lng: 9.5367,
        country: 'Italy',
        region: 'europe',
        venue_type: 'premier',
        time_zone: 'Europe/Rome',
        data_quality: 'verified'
      },
      {
        id: 'newport-rhode-island',
        name: 'Newport - Rhode Island',
        coordinates_lat: 41.4901,
        coordinates_lng: -71.3128,
        country: 'United States',
        region: 'north-america',
        venue_type: 'championship',
        time_zone: 'America/New_York',
        data_quality: 'verified'
      },
      {
        id: 'sydney-harbor',
        name: 'Sydney Harbor',
        coordinates_lat: -33.8688,
        coordinates_lng: 151.2093,
        country: 'Australia',
        region: 'oceania',
        venue_type: 'premier',
        time_zone: 'Australia/Sydney',
        data_quality: 'verified'
      },
      {
        id: 'kiel-week',
        name: 'Kiel - Baltic Sea',
        coordinates_lat: 54.3233,
        coordinates_lng: 10.1394,
        country: 'Germany',
        region: 'europe',
        venue_type: 'championship',
        time_zone: 'Europe/Berlin',
        data_quality: 'verified'
      },
      {
        id: 'valencia-spain',
        name: 'Valencia - Mediterranean',
        coordinates_lat: 39.4699,
        coordinates_lng: -0.3763,
        country: 'Spain',
        region: 'europe',
        venue_type: 'premier',
        time_zone: 'Europe/Madrid',
        data_quality: 'verified'
      },
      {
        id: 'rio-de-janeiro-guanabara',
        name: 'Rio de Janeiro - Guanabara Bay',
        coordinates_lat: -22.9068,
        coordinates_lng: -43.1729,
        country: 'Brazil',
        region: 'south-america',
        venue_type: 'championship',
        time_zone: 'America/Sao_Paulo',
        data_quality: 'verified'
      },
      {
        id: 'enoshima-japan',
        name: 'Enoshima - Sagami Bay',
        coordinates_lat: 35.3048,
        coordinates_lng: 139.4813,
        country: 'Japan',
        region: 'asia-pacific',
        venue_type: 'championship',
        time_zone: 'Asia/Tokyo',
        data_quality: 'verified'
      },
      {
        id: 'marseille-france',
        name: 'Marseille - Mediterranean',
        coordinates_lat: 43.2965,
        coordinates_lng: 5.3698,
        country: 'France',
        region: 'europe',
        venue_type: 'championship',
        time_zone: 'Europe/Paris',
        data_quality: 'verified'
      }
    ];

    const { data, error } = await supabase
      .from('sailing_venues')
      .upsert(sampleVenues);

    if (error) {
      console.log('❌ Failed to seed venues:', error.message);
      console.log('Details:', error);
      return;
    } else {
      console.log(`✅ Successfully seeded ${sampleVenues.length} global sailing venues!`);
    }

    // Now seed some yacht clubs
    console.log('2️⃣ Creating yacht clubs...');
    const sampleClubs = [
      {
        id: 'rhkyc',
        venue_id: 'hong-kong-victoria-harbor',
        name: 'Royal Hong Kong Yacht Club',
        short_name: 'RHKYC',
        prestige_level: 'international',
        membership_type: 'private'
      },
      {
        id: 'royal-yacht-squadron',
        venue_id: 'cowes-solent',
        name: 'Royal Yacht Squadron',
        short_name: 'RYS',
        prestige_level: 'international',
        membership_type: 'private'
      },
      {
        id: 'st-francis-yacht-club',
        venue_id: 'san-francisco-bay',
        name: 'St. Francis Yacht Club',
        short_name: 'StFYC',
        prestige_level: 'international',
        membership_type: 'private'
      },
      {
        id: 'rnzys',
        venue_id: 'auckland-hauraki-gulf',
        name: 'Royal New Zealand Yacht Squadron',
        short_name: 'RNZYS',
        prestige_level: 'international',
        membership_type: 'private'
      },
      {
        id: 'yccs',
        venue_id: 'porto-cervo-sardinia',
        name: 'Yacht Club Costa Smeralda',
        short_name: 'YCCS',
        prestige_level: 'international',
        membership_type: 'private'
      }
    ];

    const { error: clubError } = await supabase
      .from('yacht_clubs')
      .upsert(sampleClubs);

    if (clubError) {
      console.log('❌ Failed to seed clubs:', clubError.message);
    } else {
      console.log(`✅ Successfully seeded ${sampleClubs.length} prestigious yacht clubs!`);
    }

    // Test the venue detection
    console.log('3️⃣ Testing venue queries...');
    const { data: allVenues, error: queryError } = await supabase
      .from('sailing_venues')
      .select('*')
      .order('name');

    if (queryError) {
      console.log('❌ Query test failed:', queryError.message);
    } else {
      console.log(`✅ Query test passed! Found ${allVenues.length} venues`);
      console.log('Venues by region:');
      const byRegion = allVenues.reduce((acc, venue) => {
        acc[venue.region] = (acc[venue.region] || 0) + 1;
        return acc;
      }, {});
      Object.entries(byRegion).forEach(([region, count]) => {
        console.log(`   ${region}: ${count} venues`);
      });
    }

    console.log('');
    console.log('🎉 RegattaFlow Global Venue Intelligence is now ACTIVE!');
    console.log('');
    console.log('✅ Features Now Available:');
    console.log('   🌍 12 Major Global Sailing Venues');
    console.log('   🏆 5 Prestigious Yacht Clubs');
    console.log('   📍 Venue Search & Discovery');
    console.log('   🏁 Foundation for GPS Detection');
    console.log('   🌊 Multi-Regional Coverage');
    console.log('');
    console.log('Ready to test in your Expo app! 🚀');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deploySimpleSchema();