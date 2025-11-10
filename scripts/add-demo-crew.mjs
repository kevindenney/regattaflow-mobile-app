#!/usr/bin/env node
/**
 * Add demo crew members for testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addDemoCrew() {
  // Get demo sailor (Sarah Chen)
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'sarah.chen@sailing.com')
    .single();

  if (!user) {
    console.error('❌ Demo user not found');
    return;
  }

  console.log('✅ Found demo user:', user.email, user.id);

  // Get sailor's classes
  const { data: classes } = await supabase
    .from('sailor_classes')
    .select('class_id, boat_classes(name)')
    .eq('sailor_id', user.id);

  if (!classes || classes.length === 0) {
    console.error('❌ No classes found for demo user');
    console.log('💡 Run this first: node scripts/setup-demo-accounts.ts');
    return;
  }

  console.log('✅ Found classes:', classes.map(c => c.boat_classes?.name).join(', '));

  // Use the first class for demo crew
  const classId = classes[0].class_id;
  const className = classes[0].boat_classes?.name || 'Unknown';

  console.log(`\n📝 Adding crew members for ${className}...\n`);

  const crewMembers = [
    {
      sailor_id: user.id,
      class_id: classId,
      name: 'James Chen',
      email: 'james.chen@example.com',
      role: 'tactician',
      access_level: 'edit',
      status: 'active',
    },
    {
      sailor_id: user.id,
      class_id: classId,
      name: 'Sophie Martinez',
      email: 'sophie.martinez@example.com',
      role: 'trimmer',
      access_level: 'view',
      status: 'active',
    },
    {
      sailor_id: user.id,
      class_id: classId,
      name: 'Marcus Williams',
      email: 'marcus.williams@example.com',
      role: 'bowman',
      access_level: 'view',
      status: 'active',
    },
  ];

  const { data: inserted, error } = await supabase
    .from('crew_members')
    .insert(crewMembers)
    .select();

  if (error) {
    console.error('❌ Error inserting crew:', error);
    return;
  }

  console.log(`✅ Added ${inserted.length} crew members:`);
  inserted.forEach(member => {
    console.log(`   • ${member.name} - ${member.role}`);
  });

  console.log('\n🎉 Done! Now refresh your app to see the crew.');
  console.log('💡 To link crew to races, update regattas.class_id to:', classId);
}

addDemoCrew().catch(console.error);
