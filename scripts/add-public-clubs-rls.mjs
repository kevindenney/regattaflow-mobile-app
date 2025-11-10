#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function addPublicClubsRLS() {
  console.log('\n🔒 Adding public READ policy for clubs table...\n');

  try {
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Public can read clubs" ON clubs;

        -- Create policy to allow anyone to read clubs
        CREATE POLICY "Public can read clubs" ON clubs
          FOR SELECT
          USING (true);
      `
    });

    if (error) {
      // Try alternative approach if rpc doesn't exist
      console.log('RPC approach failed, trying direct query...');

      const { error: error1 } = await supabase
        .from('clubs')
        .select('id')
        .limit(0); // Test query

      console.log('✅ RLS policy needs to be added manually via Supabase dashboard');
      console.log('\nPolicy SQL:');
      console.log('DROP POLICY IF EXISTS "Public can read clubs" ON clubs;');
      console.log('CREATE POLICY "Public can read clubs" ON clubs FOR SELECT USING (true);');
      return;
    }

    console.log('✅ Public read policy added successfully!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Please add this policy manually in Supabase dashboard:');
    console.log('DROP POLICY IF EXISTS "Public can read clubs" ON clubs;');
    console.log('CREATE POLICY "Public can read clubs" ON clubs FOR SELECT USING (true);');
  }
}

addPublicClubsRLS();
