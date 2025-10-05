/**
 * Add Sample Crew Members Script
 * Run this to add two sample crew members to the database
 *
 * Usage: npx ts-node scripts/add-sample-crew.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSampleCrewMembers() {
  console.log('🚀 Adding sample crew members...\n');

  const crewMembers = [
    {
      sailor_id: 'd67f765e-7fe6-4f79-b514-f1b7f9a1ba3f',
      class_id: '861d0d69-7f2e-41e8-9f97-0f410c1aa175',
      email: 'sarah.johnson@example.com',
      name: 'Sarah Johnson',
      role: 'trimmer',
      access_level: 'view',
      status: 'active',
      notes: 'Experienced trimmer, specializes in light wind conditions',
    },
    {
      sailor_id: 'd67f765e-7fe6-4f79-b514-f1b7f9a1ba3f',
      class_id: '861d0d69-7f2e-41e8-9f97-0f410c1aa175',
      email: 'mike.chen@example.com',
      name: 'Mike Chen',
      role: 'bowman',
      access_level: 'view',
      status: 'active',
      notes: 'Strong bowman, excellent in heavy weather',
    },
  ];

  for (const member of crewMembers) {
    console.log(`Adding: ${member.name} (${member.role})...`);

    const { data, error } = await supabase
      .from('crew_members')
      .insert(member)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log(`  ⚠️  ${member.name} already exists, skipping`);
      } else {
        console.error(`  ❌ Error adding ${member.name}:`, error.message);
      }
    } else {
      console.log(`  ✅ Added ${member.name} successfully`);
      console.log(`     ID: ${data.id}`);
      console.log(`     Role: ${data.role}`);
      console.log(`     Status: ${data.status}\n`);
    }
  }

  console.log('✨ Done!');
}

addSampleCrewMembers().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});