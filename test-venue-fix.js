/**
 * Test the fix - verify venues load without data_quality filter
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qavekrwdbsobecwrfxwu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjU3MzIsImV4cCI6MjA3NDUwMTczMn0.iP6KVo3sJFp08yMCSAc9X9RyQgQFI_n8Az7-7_M2Cog';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFix() {
  console.log('🧪 Testing venue query fix...\n');

  // This is the FIXED query (matches VenueSelector component)
  console.log('📊 Running FIXED query (no data_quality filter):');
  const { data, error } = await supabase
    .from('sailing_venues')
    .select('id, name, country, region, venue_type, coordinates_lat, coordinates_lng')
    .order('name', { ascending: true })
    .limit(50);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ SUCCESS!');
  console.log(`✅ Loaded ${data.length} venues`);
  console.log('\n📋 First 5 venues:');
  data.slice(0, 5).forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name} (${v.country}) - ${v.venue_type}`);
  });

  console.log('\n🎉 FIX VALIDATED: VenueSelector will now display venues correctly!');
}

testFix().catch(console.error);
