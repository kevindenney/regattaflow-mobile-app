#!/usr/bin/env node
/**
 * Complete setup for Sarah Chen with boat, class, and crew
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupSarahWithCrew() {
  console.log('🚀 Setting up Sarah Chen with complete profile...\n');

  // Get Sarah
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'sarah.chen@sailing.com')
    .single();

  if (!user) {
    console.error('❌ Sarah not found');
    return;
  }

  console.log('✅ Found user:', user.email);

  // Get or create J/70 boat class
  let { data: j70Class } = await supabase
    .from('boat_classes')
    .select('id, name')
    .eq('name', 'J/70')
    .single();

  if (!j70Class) {
    console.log('📝 Creating J/70 boat class...');
    const { data: created, error } = await supabase
      .from('boat_classes')
      .insert({ name: 'J/70', category: 'keelboat' })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating boat class:', error);
      return;
    }
    j70Class = created;
  }

  console.log('✅ Boat class:', j70Class.name, j70Class.id);

  // Add Sarah's boat
  const { data: boat, error: boatError } = await supabase
    .from('sailor_boats')
    .insert({
      sailor_id: user.id,
      class_id: j70Class.id,
      name: 'Velocity',
      sail_number: 'USA 777',
      is_primary: true,
      is_owner: true,
      status: 'active',
    })
    .select()
    .single();

  if (boatError) {
    console.error('❌ Error creating boat:', boatError);
    return;
  }

  console.log('✅ Created boat:', boat.name, boat.sail_number);

  // Add to sailor_classes
  const { data: sailorClass, error: classError } = await supabase
    .from('sailor_classes')
    .insert({
      sailor_id: user.id,
      class_id: j70Class.id,
      is_primary: true,
      boat_name: boat.name,
      sail_number: boat.sail_number,
    })
    .select()
    .single();

  if (classError) {
    console.error('❌ Error linking sailor to class:', classError);
    return;
  }

  console.log('✅ Linked sailor to class');

  // Add crew members
  console.log('\n📝 Adding crew members...\n');

  const crewMembers = [
    {
      sailor_id: user.id,
      class_id: j70Class.id,
      boat_id: boat.id,
      name: 'James Chen',
      email: 'james.chen@example.com',
      role: 'tactician',
      access_level: 'edit',
      status: 'active',
    },
    {
      sailor_id: user.id,
      class_id: j70Class.id,
      boat_id: boat.id,
      name: 'Sophie Martinez',
      email: 'sophie.martinez@example.com',
      role: 'trimmer',
      access_level: 'view',
      status: 'active',
    },
    {
      sailor_id: user.id,
      class_id: j70Class.id,
      boat_id: boat.id,
      name: 'Marcus Williams',
      email: 'marcus.williams@example.com',
      role: 'bowman',
      access_level: 'view',
      status: 'active',
    },
  ];

  const { data: crew, error: crewError } = await supabase
    .from('crew_members')
    .insert(crewMembers)
    .select();

  if (crewError) {
    console.error('❌ Error adding crew:', crewError);
    return;
  }

  console.log(`✅ Added ${crew.length} crew members:`);
  crew.forEach(member => {
    console.log(`   • ${member.name} - ${member.role}`);
  });

  // Update recent regattas to link to J/70 class
  console.log('\n📝 Linking recent races to J/70 class...\n');

  const { data: updated, error: updateError } = await supabase
    .from('regattas')
    .update({ class_id: j70Class.id })
    .eq('created_by', user.id)
    .is('class_id', null)
    .select('id, name');

  if (updateError) {
    console.error('❌ Error updating regattas:', updateError);
  } else {
    console.log(`✅ Updated ${updated?.length || 0} races to use J/70 class`);
    updated?.slice(0, 3).forEach(race => {
      console.log(`   • ${race.name}`);
    });
  }

  console.log('\n🎉 Setup complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Refresh your app');
  console.log('   2. Go to the Crew tab - you should see 3 crew members');
  console.log('   3. View any race detail - you should see the same crew');
  console.log(`   4. Class ID for reference: ${j70Class.id}`);
}

setupSarahWithCrew().catch(console.error);
