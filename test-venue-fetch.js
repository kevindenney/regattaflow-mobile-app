// Test script to verify Supabase sailing_venues fetch
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://qavekrwdbsobecwrfxwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjU3MzIsImV4cCI6MjA3NDUwMTczMn0.iP6KVo3sJFp08yMCSAc9X9RyQgQFI_n8Az7-7_M2Cog';

async function testVenueFetch() {
  console.log('🧪 Testing Supabase venue fetch...\n');

  const url = `${SUPABASE_URL}/rest/v1/sailing_venues?select=id,name,country,region,venue_type,coordinates_lat,coordinates_lng&data_quality=in.(verified,community)&order=venue_type.desc,name.asc`;

  console.log('📡 Request URL:', url);
  console.log('🔑 Using anon key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Response status:', response.status, response.statusText);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Success! Fetched', data.length, 'venues');
    console.log('\n📋 First 5 venues:');
    data.slice(0, 5).forEach((venue, i) => {
      console.log(`  ${i + 1}. ${venue.name} (${venue.venue_type}) - ${venue.country}`);
    });

    console.log('\n📊 Venues by type:');
    const byType = data.reduce((acc, v) => {
      acc[v.venue_type] = (acc[v.venue_type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testVenueFetch();
