#!/usr/bin/env node
/**
 * Sync Sailor Boats to Classes Migration
 *
 * This script ensures that all boats in sailor_boats have a corresponding
 * entry in sailor_classes. This fixes the issue where the Crew tab shows
 * "Add a boat class..." because sailor_classes is empty.
 *
 * Run with: node scripts/sync-sailor-boats-to-classes.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncBoatsToClasses() {
  console.log('🔄 Starting sync of sailor_boats to sailor_classes...\n');

  try {
    // 1. Get all boats from sailor_boats
    const { data: boats, error: boatsError } = await supabase
      .from('sailor_boats')
      .select('id, sailor_id, class_id, name, sail_number, is_primary');

    if (boatsError) {
      throw new Error(`Failed to fetch boats: ${boatsError.message}`);
    }

    console.log(`📊 Found ${boats?.length || 0} boats in sailor_boats table\n`);

    if (!boats || boats.length === 0) {
      console.log('✅ No boats to sync');
      return;
    }

    // 2. Get existing sailor_classes entries
    const { data: existingClasses, error: classesError } = await supabase
      .from('sailor_classes')
      .select('sailor_id, class_id');

    if (classesError) {
      throw new Error(`Failed to fetch existing classes: ${classesError.message}`);
    }

    console.log(`📊 Found ${existingClasses?.length || 0} existing entries in sailor_classes\n`);

    // 3. Build a set of existing sailor+class combinations
    const existingSet = new Set(
      (existingClasses || []).map(c => `${c.sailor_id}:${c.class_id}`)
    );

    // 4. Group boats by sailor+class to determine which should be primary
    const classGroups = new Map();
    for (const boat of boats) {
      const key = `${boat.sailor_id}:${boat.class_id}`;
      if (!classGroups.has(key)) {
        classGroups.set(key, []);
      }
      classGroups.get(key).push(boat);
    }

    // 5. Create missing sailor_classes entries
    const toInsert = [];
    for (const [key, boatsInClass] of classGroups.entries()) {
      if (!existingSet.has(key)) {
        // Find the primary boat, or use the first one
        const primaryBoat = boatsInClass.find(b => b.is_primary) || boatsInClass[0];

        toInsert.push({
          sailor_id: primaryBoat.sailor_id,
          class_id: primaryBoat.class_id,
          is_primary: !!primaryBoat.is_primary,
          boat_name: primaryBoat.name,
          sail_number: primaryBoat.sail_number,
        });
      }
    }

    console.log(`📝 Preparing to insert ${toInsert.length} new sailor_classes entries\n`);

    if (toInsert.length === 0) {
      console.log('✅ All boats already have corresponding sailor_classes entries');
      return;
    }

    // 6. Insert the new entries
    console.log('Inserting entries:');
    for (const entry of toInsert) {
      console.log(`  - Sailor ${entry.sailor_id.slice(0, 8)}... → Class ${entry.class_id.slice(0, 8)}... (${entry.boat_name || 'Unnamed'})`);
    }
    console.log('');

    const { data: inserted, error: insertError } = await supabase
      .from('sailor_classes')
      .insert(toInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert entries: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${inserted?.length || 0} new sailor_classes entries\n`);

    // 7. Verify the sync
    const { data: finalClasses, error: finalError } = await supabase
      .from('sailor_classes')
      .select('sailor_id, class_id');

    if (finalError) {
      console.warn(`⚠️  Could not verify final count: ${finalError.message}`);
    } else {
      console.log(`📊 Final count: ${finalClasses?.length || 0} entries in sailor_classes`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your app to see the changes');
    console.log('   2. Navigate to the Crew tab - it should now show your boat classes');
    console.log('   3. Try adding a new boat - it will automatically register the class');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the migration
syncBoatsToClasses();
