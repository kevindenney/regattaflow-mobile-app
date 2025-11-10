#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

// Use anon key like the UI does
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyClubsVisible() {
  console.log('\n🔍 Verifying clubs are visible with anon key (UI perspective)...\n');

  try {
    const { data, error, count } = await supabase
      .from('clubs')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n⚠️  Clubs are NOT visible to public users!');
      return;
    }

    console.log(`✅ Found ${count} clubs visible to public!\n`);

    if (data && data.length > 0) {
      console.log('📝 Clubs that will appear in "Discover Yacht Clubs":');
      data.forEach((club, idx) => {
        console.log(`  ${idx + 1}. ${club.name} (${club.short_name})`);
        if (club.website) {
          console.log(`     🌐 ${club.website}`);
        }
      });
      console.log('\n✨ Success! The "Discover Yacht Clubs" section will now show data!\n');
    }

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

verifyClubsVisible();
