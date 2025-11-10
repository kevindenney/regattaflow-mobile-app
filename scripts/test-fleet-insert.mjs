#!/usr/bin/env node

/**
 * Test fleet insert with real club ID
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFleet() {
  // Get first club
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('name', 'Royal Hong Kong Yacht Club')
    .single();

  if (clubError || !club) {
    console.error('❌ Error fetching club:', clubError);
    return;
  }

  console.log('✅ Found club:', club.name);
  console.log('   ID:', club.id);

  // Try to insert a test fleet
  const { data: fleet, error: fleetError } = await supabase
    .from('fleets')
    .insert({
      name: '__TEST_FLEET__',
      description: 'Test fleet',
      club_id: club.id,
      region: 'Hong Kong',
      visibility: 'public',
    })
    .select()
    .single();

  if (fleetError) {
    console.error('\n❌ Error creating fleet:', fleetError.message);
    console.error('   Details:', fleetError.details);
    console.error('   Hint:', fleetError.hint);
  } else {
    console.log('\n✅ Fleet created successfully!');
    console.log('   ID:', fleet.id);

    // Clean up
    await supabase.from('fleets').delete().eq('id', fleet.id);
    console.log('✅ Test fleet deleted');
  }
}

testFleet();
