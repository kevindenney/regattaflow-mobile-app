#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function addForeignKey() {
  console.log('⚓ Adding foreign key constraint to club_members.club_id...');

  // Use raw SQL query via Supabase
  const { data, error } = await supabase
    .from('_supabase_admin')
    .select('*')
    .limit(1);

  // Since we can't execute DDL directly, let's test if the foreign key works
  console.log('\n🧪 Testing if foreign key join works...');

  const { data: testData, error: testError } = await supabase
    .from('club_members')
    .select(`
      id,
      club_id,
      clubs (
        id,
        name
      )
    `)
    .eq('user_id', '66ca1c3e-9ae1-4619-b8f0-d3992363084d')
    .limit(1);

  if (testError) {
    console.error('❌ Join test failed:', testError.message);
    console.log('\n📝 You need to run this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log(`ALTER TABLE public.club_members
  ADD CONSTRAINT club_members_club_id_fkey
  FOREIGN KEY (club_id)
  REFERENCES public.clubs(id)
  ON DELETE CASCADE;`);
    process.exit(1);
  }

  console.log('✅ Join test successful!');
  console.log('📊 Test result:', JSON.stringify(testData, null, 2));
}

addForeignKey();
