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

async function testClubDirectoryAPI() {
  console.log('\n🧪 Testing Club Directory API (exactly like UI calls it)...\n');

  try {
    console.log('1️⃣ Calling api.clubs.getClubDirectory()...');
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true });

    console.log('\n📊 API Response:');
    console.log('  - Error:', error?.message || 'None');
    console.log('  - Data:', data ? `${data.length} clubs` : 'null/undefined');

    if (data && data.length > 0) {
      console.log('\n✅ SUCCESS! Clubs are available:');
      data.forEach((club, idx) => {
        console.log(`  ${idx + 1}. ${club.name} (${club.short_name})`);
      });
    } else if (!error) {
      console.log('\n⚠️  API returned success but NO DATA');
      console.log('   This means:');
      console.log('   - Database query succeeded');
      console.log('   - But clubs table is empty OR RLS is blocking');
    }

    // Check what the React app would receive
    console.log('\n🔍 What useApi would return:');
    console.log('  {');
    console.log(`    data: ${data ? `[${data.length} clubs]` : 'null'},`);
    console.log(`    error: ${error ? error.message : 'null'},`);
    console.log(`    loading: false`);
    console.log('  }');

  } catch (err) {
    console.error('\n❌ Exception:', err);
  }
}

testClubDirectoryAPI();
