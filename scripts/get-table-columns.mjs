#!/usr/bin/env node

/**
 * Get actual columns for clubs and club_members tables
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

async function getColumns() {
  console.log('🔍 Getting table columns...\n');

  // Insert a test club to see what columns are required
  console.log('📋 Testing clubs table insert...');
  const { data: clubData, error: clubError } = await supabase
    .from('clubs')
    .insert({
      name: '__TEST_CLUB__',
      slug: '__test__',
    })
    .select()
    .single();

  if (clubError) {
    console.log(`❌ Clubs insert error: ${clubError.message}`);
    console.log('   Details:', clubError.details);
    console.log('   Hint:', clubError.hint);
  } else {
    console.log('✅ Clubs table insert successful');
    console.log('   Columns:', Object.keys(clubData).join(', '));

    // Delete the test club
    await supabase.from('clubs').delete().eq('id', clubData.id);
    console.log('   Test club deleted');
  }

  // Test club_members table
  console.log('\n📋 Testing club_members table...');
  const { data: existingClub } = await supabase
    .from('clubs')
    .select('id')
    .limit(1)
    .single();

  if (existingClub) {
    const { data: memberData, error: memberError } = await supabase
      .from('club_members')
      .select('*')
      .limit(1)
      .single();

    if (memberError) {
      console.log(`   No members found, checking insert structure...`);
    } else if (memberData) {
      console.log('✅ Club members table structure:');
      console.log('   Columns:', Object.keys(memberData).join(', '));
    }
  }

  console.log('\n✅ Column check complete');
}

getColumns().catch(console.error);
