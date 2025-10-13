/**
 * Diagnostic script to test venue queries directly
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qavekrwdbsobecwrfxwu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjU3MzIsImV4cCI6MjA3NDUwMTczMn0.iP6KVo3sJFp08yMCSAc9X9RyQgQFI_n8Az7-7_M2Cog';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
  console.log('🔍 [TEST] Testing Supabase venue queries...\n');

  // Test 1: Count all venues
  console.log('📊 Test 1: Count all venues in sailing_venues table');
  const { count, error: countError } = await supabase
    .from('sailing_venues')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Count error:', countError);
  } else {
    console.log('✅ Total venues:', count);
  }

  // Test 2: Get first 5 venues
  console.log('\n📊 Test 2: Get first 5 venues');
  const { data: venues, error: venuesError } = await supabase
    .from('sailing_venues')
    .select('id, name, country, region, venue_type, data_quality')
    .limit(5);

  if (venuesError) {
    console.error('❌ Venues error:', venuesError);
  } else {
    console.log('✅ First 5 venues:', JSON.stringify(venues, null, 2));
  }

  // Test 3: Count by data_quality
  console.log('\n📊 Test 3: Count venues by data_quality');
  const { data: qualityGroups, error: qualityError } = await supabase
    .from('sailing_venues')
    .select('data_quality')
    .not('data_quality', 'is', null);

  if (qualityError) {
    console.error('❌ Quality error:', qualityError);
  } else {
    const counts = qualityGroups.reduce((acc, v) => {
      acc[v.data_quality] = (acc[v.data_quality] || 0) + 1;
      return acc;
    }, {});
    console.log('✅ Venues by data_quality:', counts);
  }

  // Test 4: Query with data_quality filter (the failing one)
  console.log('\n📊 Test 4: Query with data_quality = verified/community filter');
  const { data: filteredVenues, error: filterError } = await supabase
    .from('sailing_venues')
    .select('id, name, country, region, venue_type, coordinates_lat, coordinates_lng')
    .in('data_quality', ['verified', 'community'])
    .order('name', { ascending: true });

  if (filterError) {
    console.error('❌ Filter error:', filterError);
  } else {
    console.log('✅ Filtered venues count:', filteredVenues?.length || 0);
    if (filteredVenues && filteredVenues.length > 0) {
      console.log('✅ First filtered venue:', filteredVenues[0]);
    }
  }

  // Test 5: Check RLS policies
  console.log('\n📊 Test 5: Check auth state');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    error: authError?.message
  });

  console.log('\n✅ [TEST] Diagnostic complete!');
}

testQueries().catch(console.error);
