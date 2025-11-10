#!/usr/bin/env node

/**
 * Check actual database schema for clubs and fleets tables
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Check clubs table
  console.log('📋 Checking clubs table...');
  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('*')
    .limit(1);

  if (clubsError) {
    console.log(`❌ Clubs table error: ${clubsError.message}`);
  } else {
    console.log('✅ Clubs table exists');
    if (clubs && clubs.length > 0) {
      console.log('   Sample columns:', Object.keys(clubs[0]).join(', '));
    }
  }

  // Check fleets table
  console.log('\n📋 Checking fleets table...');
  const { data: fleets, error: fleetsError } = await supabase
    .from('fleets')
    .select('*')
    .limit(1);

  if (fleetsError) {
    console.log(`❌ Fleets table error: ${fleetsError.message}`);
  } else {
    console.log('✅ Fleets table exists');
    if (fleets && fleets.length > 0) {
      console.log('   Sample columns:', Object.keys(fleets[0]).join(', '));
    }
  }

  // Check club_members table
  console.log('\n📋 Checking club_members table...');
  const { data: clubMembers, error: clubMembersError } = await supabase
    .from('club_members')
    .select('*')
    .limit(1);

  if (clubMembersError) {
    console.log(`❌ Club members table error: ${clubMembersError.message}`);
  } else {
    console.log('✅ Club members table exists');
    if (clubMembers && clubMembers.length > 0) {
      console.log('   Sample columns:', Object.keys(clubMembers[0]).join(', '));
    }
  }

  // Check fleet_members table
  console.log('\n📋 Checking fleet_members table...');
  const { data: fleetMembers, error: fleetMembersError } = await supabase
    .from('fleet_members')
    .select('*')
    .limit(1);

  if (fleetMembersError) {
    console.log(`❌ Fleet members table error: ${fleetMembersError.message}`);
  } else {
    console.log('✅ Fleet members table exists');
    if (fleetMembers && fleetMembers.length > 0) {
      console.log('   Sample columns:', Object.keys(fleetMembers[0]).join(', '));
    }
  }

  // Check club_events table
  console.log('\n📋 Checking club_events table...');
  const { data: clubEvents, error: clubEventsError } = await supabase
    .from('club_events')
    .select('*')
    .limit(1);

  if (clubEventsError) {
    console.log(`❌ Club events table error: ${clubEventsError.message}`);
  } else {
    console.log('✅ Club events table exists');
    if (clubEvents && clubEvents.length > 0) {
      console.log('   Sample columns:', Object.keys(clubEvents[0]).join(', '));
    }
  }

  console.log('\n✅ Schema check complete');
}

checkSchema().catch(console.error);
