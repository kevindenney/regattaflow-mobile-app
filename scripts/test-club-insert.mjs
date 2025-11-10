#!/usr/bin/env node

/**
 * Test inserting a club with minimal fields
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  console.log('🔍 Testing club insert with minimal fields...\n');

  // Try with just name
  console.log('Test 1: Just name');
  let { data, error } = await supabase
    .from('clubs')
    .insert({ name: '__TEST__' })
    .select()
    .single();

  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log('✅ Success! Columns:', Object.keys(data).join(', '));
    await supabase.from('clubs').delete().eq('id', data.id);
    return;
  }

  // Try with name and location
  console.log('\nTest 2: Name and location');
  ({ data, error } = await supabase
    .from('clubs')
    .insert({
      name: '__TEST__',
      latitude: 0,
      longitude: 0,
    })
    .select()
    .single());

  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log('✅ Success! Columns:', Object.keys(data).join(', '));
    await supabase.from('clubs').delete().eq('id', data.id);
  }
}

testInsert().catch(console.error);
