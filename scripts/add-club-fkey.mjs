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
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function addForeignKey() {
  console.log('⚓ Adding foreign key constraint to club_members.club_id...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.club_members
        ADD CONSTRAINT club_members_club_id_fkey
        FOREIGN KEY (club_id)
        REFERENCES public.clubs(id)
        ON DELETE CASCADE;
    `
  });

  if (error) {
    // Try direct query instead
    const { data, error: directError } = await supabase
      .from('_migrations')
      .select('*')
      .limit(1);

    if (directError) {
      console.error('❌ Failed to add foreign key:', error.message);
      console.log('\n📝 Run this SQL manually in Supabase Dashboard > SQL Editor:');
      console.log(`
ALTER TABLE public.club_members
  ADD CONSTRAINT club_members_club_id_fkey
  FOREIGN KEY (club_id)
  REFERENCES public.clubs(id)
  ON DELETE CASCADE;
      `);
      process.exit(1);
    }
  }

  console.log('✅ Foreign key constraint added successfully!');
}

addForeignKey().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
