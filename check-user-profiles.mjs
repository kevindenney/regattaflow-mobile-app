#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfiles() {
  console.log('🔍 Checking user profile tables...\n');

  // Check sailor_profiles
  const { data: sailors, error: sailorError } = await supabase
    .from('sailor_profiles')
    .select('user_id, full_name, avatar_url')
    .limit(3);

  if (sailorError) {
    console.log('❌ sailor_profiles:', sailorError.message);
  } else {
    console.log('✅ sailor_profiles:', sailors?.length ?? 0, 'records');
    console.log('   Sample:', sailors?.[0]);
  }

  // Check coach_profiles
  const { data: coaches, error: coachError } = await supabase
    .from('coach_profiles')
    .select('user_id, full_name, avatar_url')
    .limit(3);

  if (coachError) {
    console.log('❌ coach_profiles:', coachError.message);
  } else {
    console.log('✅ coach_profiles:', coaches?.length ?? 0, 'records');
    console.log('   Sample:', coaches?.[0]);
  }

  // Check if we have a profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .limit(3);

  if (profileError) {
    console.log('❌ profiles:', profileError.message);
  } else {
    console.log('✅ profiles:', profiles?.length ?? 0, 'records');
    console.log('   Sample:', profiles?.[0]);
  }
}

checkProfiles().catch(console.error);
