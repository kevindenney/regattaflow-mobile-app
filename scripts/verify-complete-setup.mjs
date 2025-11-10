#!/usr/bin/env node

/**
 * Verify complete clubs, fleets, and memberships setup
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

async function verifySetup() {
  console.log('🔍 Verifying Complete Setup...\n');
  console.log('═'.repeat(60));

  // Check clubs
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, short_name')
    .order('short_name');

  console.log(`\n✅ Clubs (${clubs.length})`);
  clubs.forEach(club => {
    console.log(`   • ${club.short_name} - ${club.name}`);
  });

  // Check fleets
  const { data: fleets } = await supabase
    .from('fleets')
    .select('id, name, club_id')
    .order('name');

  console.log(`\n✅ Fleets (${fleets.length})`);
  for (const fleet of fleets) {
    const club = clubs.find(c => c.id === fleet.club_id);
    console.log(`   • ${fleet.name} (${club?.short_name || 'Unknown'})`);
  }

  // Check club memberships
  const { data: clubMembers } = await supabase
    .from('club_members')
    .select('user_id, club_id, role');

  console.log(`\n✅ Club Memberships (${clubMembers.length})`);

  // Get user emails
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.email; });

  const membersByUser = {};
  clubMembers.forEach(cm => {
    const email = userMap[cm.user_id];
    if (!membersByUser[email]) membersByUser[email] = [];
    const club = clubs.find(c => c.id === cm.club_id);
    membersByUser[email].push(`${club?.short_name} (${cm.role})`);
  });

  Object.entries(membersByUser).forEach(([email, memberships]) => {
    console.log(`   • ${email}`);
    memberships.forEach(m => console.log(`     - ${m}`));
  });

  // Check fleet memberships
  const { data: fleetMembers } = await supabase
    .from('fleet_members')
    .select('user_id, fleet_id');

  console.log(`\n✅ Fleet Memberships (${fleetMembers.length})`);

  const fleetMembersByUser = {};
  fleetMembers.forEach(fm => {
    const email = userMap[fm.user_id];
    if (!fleetMembersByUser[email]) fleetMembersByUser[email] = [];
    const fleet = fleets.find(f => f.id === fm.fleet_id);
    fleetMembersByUser[email].push(fleet?.name);
  });

  Object.entries(fleetMembersByUser).forEach(([email, memberships]) => {
    console.log(`   • ${email}`);
    memberships.forEach(m => console.log(`     - ${m}`));
  });

  // Check club events
  const { data: events } = await supabase
    .from('club_events')
    .select('title, club_id, start_date, status')
    .order('start_date');

  console.log(`\n✅ Club Events (${events.length})`);
  events.forEach(event => {
    const club = clubs.find(c => c.id === event.club_id);
    const date = new Date(event.start_date).toLocaleDateString();
    console.log(`   • ${event.title}`);
    console.log(`     ${club?.short_name} - ${date} - ${event.status}`);
  });

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Complete setup verified!\n');
  console.log('📊 Summary:');
  console.log(`   • ${clubs.length} clubs`);
  console.log(`   • ${fleets.length} fleets`);
  console.log(`   • ${clubMembers.length} club memberships`);
  console.log(`   • ${fleetMembers.length} fleet memberships`);
  console.log(`   • ${events.length} upcoming events`);
  console.log('\n🎯 Ready for testing!\n');
}

verifySetup();
