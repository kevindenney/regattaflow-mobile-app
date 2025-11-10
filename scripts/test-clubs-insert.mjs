#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('\n🧪 Testing clubs table insert...\n');

  // Try minimal insert
  const testClub = {
    id: 'test-club-123',
    name: 'Test Yacht Club',
  };

  const { data, error } = await supabase
    .from('clubs')
    .insert(testClub)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 This tells us what columns are required/available');
  } else {
    console.log('✅ Success! Inserted:');
    console.log(data);

    // Clean up
    await supabase.from('clubs').delete().eq('id', 'test-club-123');
  }
}

testInsert();
