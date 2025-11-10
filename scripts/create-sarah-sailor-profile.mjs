#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSailorProfile() {
  const userId = '66ca1c3e-9ae1-4619-b8f0-d3992363084d';

  console.log('Creating sailor_profile for Sarah Chen...');

  const { data, error } = await supabase
    .from('sailor_profiles')
    .insert({
      user_id: userId,
      sailing_number: 'USA 12345',
      home_club: 'Royal Hong Kong Yacht Club',
      boat_class_preferences: ['J/70', 'Dragon'],
      experience_level: 'intermediate',
      preferred_venues: ['Hong Kong', 'Victoria Harbour'],
      sailing_since: '2015-01-01'
    })
    .select();

  if (error) {
    console.error('Error creating sailor profile:', error);
    process.exit(1);
  }

  console.log('✅ Sailor profile created successfully:', data);
}

createSailorProfile();
