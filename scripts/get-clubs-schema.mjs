#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getClubsSchema() {
  try {
    // Try to insert an empty object to see what columns are expected
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('\n📋 Clubs table columns:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('\n⚠️  No data in clubs table, trying to get schema from types...');
    }

    // Also try to insert empty object to see required fields
    const { error: insertError } = await supabase
      .from('clubs')
      .insert({})
      .select();

    if (insertError) {
      console.log('\n📝 Insert error (this tells us required fields):');
      console.log(insertError.message);
    }

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

getClubsSchema();
