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

async function fixCoachAnderson() {
  console.log('Fixing Coach Anderson setup...\n');

  const email = 'coach.anderson@sailing.com';

  // Get auth user
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const authUser = authUsers.find(u => u.email === email);

  if (!authUser) {
    console.error('❌ Auth user not found for', email);
    process.exit(1);
  }

  const userId = authUser.id;
  console.log(`✅ Found user: ${email} (ID: ${userId})\n`);

  // 1. Update user_type to 'coach' in users table
  console.log('1. Updating user_type to "coach"...');
  const { error: updateError } = await supabase
    .from('users')
    .update({
      user_type: 'coach',
      onboarding_completed: true,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('❌ Failed to update user_type:', updateError.message);
  } else {
    console.log('✅ User type updated to "coach"\n');
  }

  // 2. Create coach_profile
  console.log('2. Creating coach_profile...');
  const { data: existingCoach } = await supabase
    .from('coach_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingCoach) {
    console.log('ℹ️  Coach profile already exists\n');
  } else {
    const { error: coachError } = await supabase
      .from('coach_profiles')
      .insert({
        user_id: userId,
        bio: 'Professional sailing coach specializing in race tactics, boat speed, and starting techniques.',
        specialties: ['Race tactics', 'Boat speed', 'Starts'],
        experience_years: 18,
        certifications: ['World Sailing Instructor', 'National Coach'],
        hourly_rate: 150,
        is_available: true,
      });

    if (coachError) {
      console.error('❌ Failed to create coach profile:', coachError.message);
    } else {
      console.log('✅ Coach profile created\n');
    }
  }

  // 3. Update club memberships to role='coach'
  console.log('3. Updating club membership roles...');
  const { data: memberships } = await supabase
    .from('club_members')
    .select('id, club_id')
    .eq('user_id', userId);

  if (memberships && memberships.length > 0) {
    for (const membership of memberships) {
      const { error: roleError } = await supabase
        .from('club_members')
        .update({ role: 'coach' })
        .eq('id', membership.id);

      if (roleError) {
        console.error(`❌ Failed to update membership ${membership.id}:`, roleError.message);
      } else {
        console.log(`✅ Updated club membership role to "coach"`);
      }
    }
    console.log('');
  } else {
    console.log('ℹ️  No club memberships found\n');
  }

  // Verify the changes
  console.log('Verification:');
  console.log('='.repeat(60));

  const { data: updatedUser } = await supabase
    .from('users')
    .select('user_type, onboarding_completed')
    .eq('id', userId)
    .single();

  const { data: coachProfile } = await supabase
    .from('coach_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: updatedMemberships } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', userId);

  console.log(`User Type: ${updatedUser?.user_type}`);
  console.log(`Onboarding Complete: ${updatedUser?.onboarding_completed}`);
  console.log(`Has Coach Profile: ${coachProfile ? 'YES' : 'NO'}`);
  console.log(`Club Memberships: ${updatedMemberships?.length || 0}`);
  if (updatedMemberships && updatedMemberships.length > 0) {
    updatedMemberships.forEach((m, i) => console.log(`  ${i + 1}. Role: ${m.role}`));
  }
  console.log('='.repeat(60));

  console.log('\n✅ Coach Anderson setup complete!');
  console.log('💡 Log out and log back in for changes to take effect');
}

fixCoachAnderson().catch(console.error);
