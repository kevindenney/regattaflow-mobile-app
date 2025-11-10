#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkCoachUsers() {
  console.log('Checking coach users setup...\n');

  // Check specific test users
  const testEmails = [
    'coach.anderson@sailing.com',
    'sarah.chen@sailing.com',
    'mike.thompson@racing.com'
  ];

  for (const email of testEmails) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Checking: ${email}`);
    console.log('='.repeat(60));

    // Get auth user
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const authUser = authUsers.find(u => u.email === email);

    if (!authUser) {
      console.log('❌ Auth user not found');
      continue;
    }

    console.log(`✅ Auth User ID: ${authUser.id}`);
    console.log(`   Metadata:`, authUser.user_metadata);

    // Get users table profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, user_type, onboarding_completed')
      .eq('id', authUser.id)
      .maybeSingle();

    if (userError) {
      console.log('❌ Users table error:', userError.message);
    } else if (userProfile) {
      console.log('✅ Users Table Profile:');
      console.log('   User Type:', userProfile.user_type || 'NULL');
      console.log('   Full Name:', userProfile.full_name || 'NULL');
      console.log('   Onboarding:', userProfile.onboarding_completed ? 'Complete' : 'Incomplete');
    } else {
      console.log('❌ No profile in users table');
    }

    // Check coach_profiles
    const { data: coachProfile, error: coachError } = await supabase
      .from('coach_profiles')
      .select('id, user_id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (coachError && coachError.code !== 'PGRST116') {
      console.log('❌ Coach profiles error:', coachError.message);
    } else if (coachProfile) {
      console.log('✅ Has Coach Profile: YES');
    } else {
      console.log('⚪ Has Coach Profile: NO');
    }

    // Check club memberships
    const { data: clubMembers, error: clubError } = await supabase
      .from('club_members')
      .select('club_id, role')
      .eq('user_id', authUser.id);

    if (clubError) {
      console.log('❌ Club members error:', clubError.message);
    } else if (clubMembers && clubMembers.length > 0) {
      console.log(`✅ Club Memberships: ${clubMembers.length}`);
      clubMembers.forEach(m => console.log(`   - Role: ${m.role}`));
    } else {
      console.log('⚪ Club Memberships: None');
    }
  }

  console.log(`\n${'='.repeat(60)}\n`);
}

checkCoachUsers().catch(console.error);
