#!/usr/bin/env node

/**
 * Fix fleets.club_id foreign key constraint
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixForeignKey() {
  console.log('🔧 Fixing fleets.club_id foreign key...\n');

  const sql = `
    -- Drop the incorrect foreign key constraint
    ALTER TABLE public.fleets
      DROP CONSTRAINT IF EXISTS fleets_club_id_fkey;

    -- Add the correct foreign key constraint pointing to clubs table
    ALTER TABLE public.fleets
      ADD CONSTRAINT fleets_club_id_fkey
      FOREIGN KEY (club_id)
      REFERENCES public.clubs(id)
      ON DELETE CASCADE;

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_fleets_club_id ON public.fleets(club_id);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct approach using supabase-js
      console.log('Trying alternative approach...\n');

      // Drop constraint
      await supabase.from('fleets').select('id').limit(0); // Just to test connection

      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));

      throw error;
    }

    console.log('✅ Foreign key constraint fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Manual steps:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Paste the following SQL:');
    console.log('\n' + sql);
    console.log('\n3. Run the query');
  }
}

fixForeignKey();
