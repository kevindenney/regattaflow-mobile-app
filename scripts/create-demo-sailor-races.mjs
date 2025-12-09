#!/usr/bin/env node

/**
 * Script to create demo races for the demo sailor account
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEMO_SAILOR_EMAIL = 'demo-sailor@regattaflow.io';

async function createDemoRaces() {
  console.log('🏁 Creating demo races for demo sailor...\n');

  // Get demo sailor user
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('email', DEMO_SAILOR_EMAIL)
    .single();

  if (!users) {
    console.error('❌ Demo sailor user not found');
    return;
  }

  const demoSailorUserId = users.id;
  console.log(`✅ Found demo sailor: ${demoSailorUserId}`);

  // Get demo sailor profile
  const { data: sailorProfile } = await supabase
    .from('sailor_profiles')
    .select('id')
    .eq('user_id', demoSailorUserId)
    .single();

  if (!sailorProfile) {
    console.log('📝 Creating sailor profile for demo sailor...');
    const { data: newProfile, error: profileError } = await supabase
      .from('sailor_profiles')
      .insert({
        user_id: demoSailorUserId,
        sailing_number: 'DEMO-123',
        home_club: 'Demo Yacht Club',
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating sailor profile:', profileError);
      return;
    }
    console.log(`✅ Created sailor profile: ${newProfile.id}`);
  } else {
    console.log(`✅ Sailor profile exists: ${sailorProfile.id}`);
  }

  // Create demo race event
  console.log('\n📅 Creating demo race event...');

  const raceDate = new Date();
  raceDate.setDate(raceDate.getDate() + 2); // 2 days from now

  const { data: raceEvent, error: raceError } = await supabase
    .from('race_events')
    .insert({
      name: '2025 Hong Kong Open',
      start_date: raceDate.toISOString(),
      end_date: raceDate.toISOString(),
      description: 'Premier racing event in Hong Kong waters',
      metadata: {
        venue_name: 'Victoria Harbor',
        venue_lat: 22.2812,
        venue_lng: 114.1588,
        class_name: 'J/70',
        race_type: 'fleet',
      },
      racing_area_polygon: {
        type: 'Polygon',
        coordinates: [[
          [114.1588, 22.2812],
          [114.1688, 22.2812],
          [114.1688, 22.2912],
          [114.1588, 22.2912],
          [114.1588, 22.2812],
        ]],
      },
    })
    .select()
    .single();

  if (raceError) {
    console.error('❌ Error creating race event:', raceError);
    return;
  }

  console.log(`✅ Created race event: ${raceEvent.name} (${raceEvent.id})`);

  // Create sailor_race_events entry to link sailor to race
  const { error: linkError } = await supabase
    .from('sailor_race_events')
    .insert({
      sailor_id: sailorProfile.id,
      race_event_id: raceEvent.id,
      role: 'helmsman',
      status: 'registered',
    });

  if (linkError && linkError.code !== '23505') { // Ignore duplicate key errors
    console.error('❌ Error linking sailor to race:', linkError);
  } else {
    console.log('✅ Linked sailor to race');
  }

  // Create sailor_race_preparation entry for strategy
  const { error: prepError } = await supabase
    .from('sailor_race_preparation')
    .insert({
      race_event_id: raceEvent.id,
      sailor_id: sailorProfile.id,
      rig_notes: 'Demo rig setup notes',
    });

  if (prepError && prepError.code !== '23505') {
    console.error('❌ Error creating race preparation:', prepError);
  } else {
    console.log('✅ Created race preparation entry');
  }

  console.log('\n✨ Demo race created successfully!');
  console.log('\n📝 You can now:');
  console.log('1. Login as demo-sailor@regattaflow.io');
  console.log('2. Go to Races tab');
  console.log('3. Click on "2025 Hong Kong Open"');
  console.log('4. Add strategy notes in each phase');
  console.log('5. Share with coach');
}

createDemoRaces().catch(console.error);
