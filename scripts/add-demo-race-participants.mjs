#!/usr/bin/env node
/**
 * Add demo race participants to test Fleet Competitors card
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addDemoParticipants() {
  console.log('🚀 Adding demo race participants...\n');

  // Get Sarah's recent race
  const { data: sarah } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'sarah.chen@sailing.com')
    .single();

  if (!sarah) {
    console.error('❌ Sarah not found');
    return;
  }

  const { data: race } = await supabase
    .from('regattas')
    .select('id, name')
    .eq('created_by', sarah.id)
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  if (!race) {
    console.error('❌ No races found for Sarah');
    return;
  }

  console.log(`✅ Adding participants to: ${race.name}\n`);

  // Get J/70 fleet
  const { data: fleet } = await supabase
    .from('fleets')
    .select('id, name')
    .eq('class_id', (await supabase
      .from('boat_classes')
      .select('id')
      .eq('name', 'J/70')
      .single()
    ).data?.id)
    .maybeSingle();

  const fleetId = fleet?.id;

  // Get other demo users
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('email', [
      'marcus.thompson@demo.regattaflow.com',
      'demo-sailor@regattaflow.app',
      'denneyke@gmail.com',
    ]);

  if (!users || users.length === 0) {
    console.error('❌ No demo users found');
    return;
  }

  const participants = [
    {
      user_id: users.find(u => u.email === 'marcus.thompson@demo.regattaflow.com')?.id,
      regatta_id: race.id,
      fleet_id: fleetId,
      boat_name: 'Thunder',
      sail_number: 'USA 888',
      status: 'confirmed',
      visibility: 'public',
      registered_at: new Date().toISOString(),
    },
    {
      user_id: users.find(u => u.email === 'demo-sailor@regattaflow.app')?.id,
      regatta_id: race.id,
      fleet_id: fleetId,
      boat_name: 'Lightning',
      sail_number: 'USA 999',
      status: 'registered',
      visibility: 'public',
      registered_at: new Date().toISOString(),
    },
    {
      user_id: users.find(u => u.email === 'denneyke@gmail.com')?.id,
      regatta_id: race.id,
      fleet_id: fleetId,
      boat_name: 'Phoenix Rising',
      sail_number: 'USA 111',
      status: 'tentative',
      visibility: 'fleet',
      registered_at: new Date().toISOString(),
    },
  ].filter(p => p.user_id); // Remove any undefined users

  if (participants.length === 0) {
    console.error('❌ No valid participants to add');
    return;
  }

  const { data: inserted, error } = await supabase
    .from('race_participants')
    .insert(participants)
    .select();

  if (error) {
    console.error('❌ Error inserting participants:', error);
    return;
  }

  console.log(`✅ Added ${inserted.length} race participants:`);
  inserted.forEach((p, i) => {
    const user = users.find(u => u.id === p.user_id);
    console.log(`   ${i + 1}. ${user?.full_name} - ${p.boat_name} (${p.sail_number}) - ${p.status}`);
  });

  console.log('\n🎉 Done! Fleet Competitors card will now show these sailors.');
  console.log(`📍 Race: ${race.name}`);
  console.log(`🚢 Fleet: ${fleet?.name || 'No fleet'}`);
}

addDemoParticipants().catch(console.error);
