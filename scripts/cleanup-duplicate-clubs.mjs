#!/usr/bin/env node

/**
 * Cleanup duplicate clubs, keeping only the most recent of each
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

async function cleanup() {
  console.log('🧹 Cleaning up duplicate clubs...\n');

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select('id, name, short_name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching clubs:', error);
    return;
  }

  const clubsByName = {};
  const toDelete = [];

  for (const club of clubs) {
    const key = club.name;
    if (!clubsByName[key]) {
      clubsByName[key] = club;
      console.log(`✅ Keeping: ${club.short_name} (${club.id})`);
    } else {
      toDelete.push(club.id);
      console.log(`🗑️  Deleting duplicate: ${club.short_name} (${club.id})`);
    }
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('clubs')
      .delete()
      .in('id', toDelete);

    if (deleteError) {
      console.error('\n❌ Error deleting duplicates:', deleteError);
    } else {
      console.log(`\n✅ Deleted ${toDelete.length} duplicate clubs`);
    }
  } else {
    console.log('\n✅ No duplicates found');
  }
}

cleanup();
