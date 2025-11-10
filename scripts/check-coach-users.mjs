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
    .select('user_id, name, email, user_type')
    .or('email.ilike.%coach%,email.ilike.%anderson%');

  console.log('Sailor Profiles with coach emails:');
  console.table(sailorProfiles);

  if (sailorError) {
    console.error('Error fetching sailor profiles:', sailorError);
  }

  // Check coach_profiles
  const { data: coachProfiles, error: coachError } = await supabase
    .from('coach_profiles')
    .select('user_id, name, email, specialties, experience_years');

  console.log('\nCoach Profiles:');
  console.table(coachProfiles);

  if (coachError) {
    console.error('Error fetching coach profiles:', coachError);
  }

  // Check all demo users
  const { data: allDemo, error: demoError } = await supabase
    .from('sailor_profiles')
    .select('user_id, name, email, user_type')
    .or('email.eq.coach.anderson@sailing.com,email.eq.sarah.demo@sailing.com,email.eq.mike.coach@sailing.com');

  console.log('\nAll Demo/Test Users:');
  console.table(allDemo);
}

checkCoachUsers().catch(console.error);
