#!/usr/bin/env node
/**
 * Fix Dragon Championship regattas to include class_id
 * The race detail screen loads from regattas table, not race_events
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const DRAGON_CLASS_ID = '130829e3-05dd-4ab3-bea2-e0231c12064a';

async function fixDragonRegattas() {
  console.log('🔧 Fixing Dragon Championship regattas (the table the UI actually uses)...\n');

  // Step 1: Find Dragon Championship regattas with null class_id
  const { data: regattas, error: fetchError } = await supabase
    .from('regattas')
    .select('id, name, class_id, metadata')
    .ilike('name', '%Dragon%Championship%');

  if (fetchError) {
    console.error('❌ Error fetching regattas:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${regattas.length} Dragon Championship regattas\n`);

  const regattasToFix = regattas.filter((regatta) => !regatta.class_id);

  if (regattasToFix.length === 0) {
    console.log('✅ All Dragon Championship regattas already have class_id set!');
    return;
  }

  console.log(`📝 Fixing ${regattasToFix.length} regattas...\n`);

  // Step 2: Update each regatta
  for (const regatta of regattasToFix) {
    console.log(`Updating: ${regatta.name}`);

    // Update both class_id and metadata.class_name
    const updatedMetadata = {
      ...(regatta.metadata || {}),
      class_id: DRAGON_CLASS_ID,
      class_name: 'Dragon',
    };

    const { error: updateError } = await supabase
      .from('regattas')
      .update({
        class_id: DRAGON_CLASS_ID,
        metadata: updatedMetadata,
      })
      .eq('id', regatta.id);

    if (updateError) {
      console.error(`  ❌ Error updating regatta ${regatta.id}:`, updateError);
    } else {
      console.log(`  ✅ Updated successfully`);
    }
  }

  // Step 3: Verify
  console.log('\n✅ Verification:');
  const { data: updated } = await supabase
    .from('regattas')
    .select('id, name, class_id, metadata')
    .ilike('name', '%Dragon%Championship%');

  updated.forEach((regatta) => {
    const hasClassId = !!regatta.class_id;
    const hasMetadataClass = regatta.metadata?.class_name === 'Dragon';
    console.log(
      `  ${hasClassId && hasMetadataClass ? '✅' : '❌'} ${regatta.name}:`
    );
    console.log(`     class_id: ${regatta.class_id || 'NULL'}`);
    console.log(`     metadata.class_name: ${regatta.metadata?.class_name || 'NULL'}`);
  });

  console.log('\n🎉 Done! Refresh your race page to see North Sails Dragon tuning guidance.');
  console.log('💡 Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
}

fixDragonRegattas().catch(console.error);
