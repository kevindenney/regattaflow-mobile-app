#!/usr/bin/env node

/**
 * Generate race suggestions for Sarah Chen
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

async function generateSuggestions() {
  console.log('🎯 Generating race suggestions for Sarah Chen...\n');

  // Get Sarah's user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const sarah = users.find(u => u.email === 'sarah.chen@sailing.com');

  if (!sarah) {
    console.error('❌ Sarah Chen not found');
    return;
  }

  console.log('✅ Found Sarah Chen');
  console.log(`   User ID: ${sarah.id}\n`);

  // Check club memberships
  const { data: clubMembers } = await supabase
    .from('club_members')
    .select('club_id, clubs(name)')
    .eq('user_id', sarah.id);

  console.log(`📋 Club Memberships: ${clubMembers?.length || 0}`);
  clubMembers?.forEach(cm => {
    console.log(`   • ${cm.clubs?.name || 'Unknown'}`);
  });

  // Check fleet memberships
  const { data: fleetMembers } = await supabase
    .from('fleet_members')
    .select('fleet_id, fleets(name)')
    .eq('user_id', sarah.id);

  console.log(`\n⛵ Fleet Memberships: ${fleetMembers?.length || 0}`);
  fleetMembers?.forEach(fm => {
    console.log(`   • ${fm.fleets?.name || 'Unknown'}`);
  });

  // Check club events
  if (clubMembers && clubMembers.length > 0) {
    const clubIds = clubMembers.map(cm => cm.club_id);
    const { data: events } = await supabase
      .from('club_events')
      .select('title, start_date, status')
      .in('club_id', clubIds)
      .gte('start_date', new Date().toISOString())
      .order('start_date');

    console.log(`\n📅 Upcoming Club Events: ${events?.length || 0}`);
    events?.forEach(event => {
      const date = new Date(event.start_date).toLocaleDateString();
      console.log(`   • ${event.title} - ${date} (${event.status})`);
    });
  }

  // Check historical races
  const { data: races } = await supabase
    .from('regattas')
    .select('name, start_date, metadata')
    .eq('created_by', sarah.id)
    .order('start_date', { ascending: false })
    .limit(10);

  console.log(`\n🏁 Historical Races: ${races?.length || 0}`);
  races?.forEach(race => {
    const date = new Date(race.start_date).toLocaleDateString();
    const venue = race.metadata?.venue_name || 'Unknown venue';
    console.log(`   • ${race.name} - ${date} - ${venue}`);
  });

  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 Suggestions should now be generated automatically when');
  console.log('   Sarah visits the Add Race page.\n');
  console.log('🔄 If you don\'t see suggestions, refresh the page or check:');
  console.log('   • Browser console for errors');
  console.log('   • Network tab for API calls to RaceSuggestionService\n');
}

generateSuggestions();
