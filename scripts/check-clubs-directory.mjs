#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkClubsDirectory() {
  console.log('\n📊 Checking clubs table...\n');

  try {
    // Check if clubs table exists and get count
    const { data, error, count } = await supabase
      .from('clubs')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      console.error('❌ Error querying clubs table:', error.message);
      return;
    }

    console.log(`✅ Found ${count || 0} clubs in the database`);

    if (data && data.length > 0) {
      console.log('\n📝 Sample clubs:');
      data.forEach((club, idx) => {
        console.log(`  ${idx + 1}. ${club.name} (${club.country || 'No country'})`);
      });
    } else {
      console.log('\n⚠️  The clubs table is empty!');
      console.log('\n💡 This is why the "Discover Yacht Clubs" section shows no data.');
      console.log('   You need to seed the clubs table with yacht club data.\n');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkClubsDirectory();
