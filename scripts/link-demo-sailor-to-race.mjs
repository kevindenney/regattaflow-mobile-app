#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function linkDemoSailorToRace() {
  console.log('🔗 Linking demo sailor to race...\n');

  // Get demo sailor profile
  const { data: users } = await supabase.rpc('get_user_id_by_email', {
    email_input: 'demo-sailor@regattaflow.io'
  }).single();

  const demoSailorUserId = 'f6f6a7f6-7755-412b-a87b-3a7617721cc7'; // From previous query

  const { data: sailorProfile } = await supabase
    .from('sailor_profiles')
    .select('id')
    .eq('user_id', demoSailorUserId)
    .single();

  if (!sailorProfile) {
    console.error('❌ Demo sailor profile not found');
    return;
  }

  const sailorId = sailorProfile.id;
  console.log(`✅ Demo sailor profile: ${sailorId}`);

  // Use the Corinthian race
  const raceId = 'f3ff4705-acaf-40be-aaef-865fb42f2a9c';
  console.log(`✅ Using race: Corinthian 3 & 4`);

  // Link sailor to race (if not already linked)
  const { error: linkError } = await supabase
    .from('sailor_race_events')
    .upsert({
      sailor_id: sailorId,
      race_event_id: raceId,
      role: 'helmsman',
      status: 'registered',
    }, {
      onConflict: 'sailor_id,race_event_id',
      ignoreDuplicates: true,
    });

  if (linkError) {
    console.log('⚠️  Link may already exist:', linkError.message);
  } else {
    console.log('✅ Linked sailor to race');
  }

  // Create race preparation entry
  const { error: prepError } = await supabase
    .from('sailor_race_preparation')
    .upsert({
      race_event_id: raceId,
      sailor_id: sailorId,
      rig_notes: 'Medium conditions setup',
    }, {
      onConflict: 'race_event_id,sailor_id',
      ignoreDuplicates: false,
    });

  if (prepError) {
    console.log('⚠️  Preparation entry may exist:', prepError.message);
  } else {
    console.log('✅ Created race preparation entry');
  }

  console.log('\n✨ Demo sailor is now linked to the race!');
  console.log('\n📝 Next steps:');
  console.log('1. Refresh the races page');
  console.log('2. You should now see "Corinthian 3 & 4" race');
  console.log('3. Click on it and add strategy notes');
  console.log('4. Share with coach!');
}

linkDemoSailorToRace().catch(console.error);
