#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoachUsers() {
  console.log('Checking coach users...\n');

  // Check sailor_profiles for coach emails
  const { data: sailorProfiles, error: sailorError } = await supabase
    .from('sailor_profiles')
    .select('*')
    .or('email.ilike.%coach%,email.ilike.%anderson%');

  console.log('Sailor Profiles with coach emails:');
  if (sailorProfiles && sailorProfiles.length > 0) {
    sailorProfiles.forEach(p => {
      console.log(`  - ${p.email} (ID: ${p.user_id}, Type: ${p.user_type})`);
    });
  } else {
    console.log('  None found');
  }

  if (sailorError) {
    console.error('Error:', sailorError.message);
  }

  // Check coach_profiles
  const { data: coachProfiles, error: coachError } = await supabase
    .from('coach_profiles')
    .select('*');

  console.log('\nCoach Profiles:');
  if (coachProfiles && coachProfiles.length > 0) {
    coachProfiles.forEach(p => {
      console.log(`  - ${p.email} (ID: ${p.user_id})`);
    });
  } else {
    console.log('  None found');
  }

  if (coachError) {
    console.error('Error:', coachError.message);
  }

  // Check specific demo users
  console.log('\n\nChecking specific test users:');
  const testEmails = ['coach.anderson@sailing.com', 'sarah.demo@sailing.com', 'mike.coach@sailing.com'];

  for (const email of testEmails) {
    const { data: sailor } = await supabase
      .from('sailor_profiles')
      .select('user_id, email, user_type')
      .eq('email', email)
      .single();

    const { data: coach } = await supabase
      .from('coach_profiles')
      .select('user_id, email')
      .eq('email', email)
      .single();

    console.log(`\n${email}:`);
    console.log(`  Sailor Profile: ${sailor ? `YES (type: ${sailor.user_type})` : 'NO'}`);
    console.log(`  Coach Profile: ${coach ? 'YES' : 'NO'}`);
  }
}

checkCoachUsers().catch(console.error);
