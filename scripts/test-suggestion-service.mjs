#!/usr/bin/env node

/**
 * Test the race suggestion service directly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testService() {
  console.log('🧪 Testing Race Suggestion Service...\n');

  // Get Sarah's user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const sarah = users.find(u => u.email === 'sarah.chen@sailing.com');

  if (!sarah) {
    console.error('❌ Sarah Chen not found');
    return;
  }

  console.log('✅ Testing for Sarah Chen:', sarah.id);

  // Test 1: Get club memberships
  console.log('\n📋 Test 1: Club Memberships');
  const { data: clubMembers, error: clubError } = await supabase
    .from('club_members')
    .select(`
      club_id,
      clubs:club_id (
        id,
        name,
        short_name
      )
    `)
    .eq('user_id', sarah.id);

  if (clubError) {
    console.error('   ❌ Error:', clubError.message);
  } else {
    console.log(`   ✅ Found ${clubMembers.length} club(s)`);
    clubMembers.forEach(cm => {
      console.log(`      • ${cm.clubs?.name || 'Unknown'}`);
    });
  }

  // Test 2: Get club events
  if (clubMembers && clubMembers.length > 0) {
    console.log('\n📅 Test 2: Upcoming Club Events');
    const clubIds = clubMembers.map(cm => cm.club_id);

    const { data: events, error: eventsError } = await supabase
      .from('club_events')
      .select('*')
      .in('club_id', clubIds)
      .gte('start_date', new Date().toISOString())
      .order('start_date')
      .limit(10);

    if (eventsError) {
      console.error('   ❌ Error:', eventsError.message);
    } else {
      console.log(`   ✅ Found ${events.length} upcoming event(s)`);
      events.forEach(event => {
        const date = new Date(event.start_date).toLocaleDateString();
        console.log(`      • ${event.title} - ${date}`);
      });
    }
  }

  // Test 3: Get historical races for pattern detection
  console.log('\n🏁 Test 3: Historical Races');
  const { data: races, error: racesError } = await supabase
    .from('regattas')
    .select('name, start_date, metadata')
    .eq('created_by', sarah.id)
    .order('start_date', { ascending: false })
    .limit(10);

  if (racesError) {
    console.error('   ❌ Error:', racesError.message);
  } else {
    console.log(`   ✅ Found ${races.length} historical race(s)`);

    // Detect Spring Championship pattern
    const springChamps = races.filter(r =>
      r.name && r.name.toLowerCase().includes('spring') &&
      r.name.toLowerCase().includes('championship')
    );

    if (springChamps.length >= 2) {
      console.log(`   🎯 Pattern detected: "Spring Championship" appears ${springChamps.length} times`);
      springChamps.forEach(race => {
        const date = new Date(race.start_date);
        console.log(`      • ${race.name} - ${date.getMonth() + 1}/${date.getFullYear()}`);
      });
    }
  }

  // Test 4: Check cache table
  console.log('\n💾 Test 4: Suggestion Cache');
  const { data: cached, error: cacheError } = await supabase
    .from('race_suggestions_cache')
    .select('*')
    .eq('user_id', sarah.id)
    .gt('expires_at', new Date().toISOString());

  if (cacheError) {
    console.error('   ❌ Error:', cacheError.message);
  } else {
    console.log(`   ✅ Found ${cached.length} cached suggestion(s)`);
    if (cached.length === 0) {
      console.log('   💡 No cached suggestions - will be generated on first page load');
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Service test complete!\n');
}

testService().catch(err => {
  console.error('\n❌ Test failed:', err);
  console.error(err.stack);
});
