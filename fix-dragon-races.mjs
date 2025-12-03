#!/usr/bin/env node
/**
 * Fix Dragon Championship races to include boat_classes data
 * This enables North Sails tuning guide matching
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const DRAGON_CLASS_ID = '130829e3-05dd-4ab3-bea2-e0231c12064a';

async function fixDragonRaces() {
  console.log('🔧 Fixing Dragon Championship races...\n');

  // Step 1: Find Dragon Championship races with empty boat_classes
  const { data: races, error: fetchError } = await supabase
    .from('race_events')
    .select('id, name, boat_id, boat_classes')
    .ilike('name', '%Dragon%Championship%');

  if (fetchError) {
    console.error('❌ Error fetching races:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${races.length} Dragon Championship races\n`);

  const racesToFix = races.filter(
    (race) => !race.boat_classes || race.boat_classes.length === 0
  );

  if (racesToFix.length === 0) {
    console.log('✅ All Dragon Championship races already have boat_classes set!');
    return;
  }

  console.log(`📝 Fixing ${racesToFix.length} races...\n`);

  // Step 2: Update each race
  for (const race of racesToFix) {
    console.log(`Updating: ${race.name}`);

    const { error: updateError } = await supabase
      .from('race_events')
      .update({
        boat_classes: [
          {
            id: DRAGON_CLASS_ID,
            name: 'Dragon',
          },
        ],
      })
      .eq('id', race.id);

    if (updateError) {
      console.error(`  ❌ Error updating race ${race.id}:`, updateError);
    } else {
      console.log(`  ✅ Updated successfully`);
    }
  }

  // Step 3: Verify
  console.log('\n✅ Verification:');
  const { data: updated } = await supabase
    .from('race_events')
    .select('id, name, boat_classes')
    .ilike('name', '%Dragon%Championship%');

  updated.forEach((race) => {
    const hasClasses = race.boat_classes && race.boat_classes.length > 0;
    console.log(`  ${hasClasses ? '✅' : '❌'} ${race.name}: ${hasClasses ? JSON.stringify(race.boat_classes) : 'NO CLASSES'}`);
  });

  console.log('\n🎉 Done! Refresh your race page to see North Sails Dragon tuning guidance.');
}

fixDragonRaces().catch(console.error);
