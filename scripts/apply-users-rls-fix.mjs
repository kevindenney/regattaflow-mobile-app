#!/usr/bin/env node

/**
 * Apply RLS fix to allow users to see other fleet members' names
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fix for users table...\n');

  try {
    // Drop the restrictive policy
    console.log('📝 Dropping old restrictive policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "users_select" ON users;'
    });

    if (dropError) {
      console.error('⚠️  Error dropping policy (may not exist):', dropError.message);
    } else {
      console.log('✅ Old policy dropped');
    }

    // Create new permissive policy
    console.log('\n📝 Creating new policy to allow seeing fleet members...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "users_can_see_public_profile_info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);`
    });

    if (createError) {
      // If rpc doesn't work, try direct SQL execution
      console.log('⚠️  RPC method failed, trying direct SQL...');

      // Use the raw SQL query method
      const { error: directError } = await supabase
        .from('users')
        .select('id')
        .limit(0); // This is just to test connection

      if (directError) {
        throw new Error('Cannot execute SQL directly. Please run the migration manually.');
      }

      console.log('ℹ️  Please run this SQL manually in Supabase Dashboard > SQL Editor:');
      console.log('\n' + '-'.repeat(60));
      console.log(`DROP POLICY IF EXISTS "users_select" ON users;

CREATE POLICY "users_can_see_public_profile_info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);`);
      console.log('-'.repeat(60) + '\n');

      return;
    }

    console.log('✅ New policy created successfully!\n');
    console.log('🎉 RLS fix applied! Fleet members can now see each other\'s names.\n');

  } catch (error) {
    console.error('❌ Error applying RLS fix:', error.message);
    console.log('\nℹ️  Please run this SQL manually in Supabase Dashboard > SQL Editor:');
    console.log('\n' + '-'.repeat(60));
    console.log(`DROP POLICY IF EXISTS "users_select" ON users;

CREATE POLICY "users_can_see_public_profile_info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);`);
    console.log('-'.repeat(60) + '\n');
    process.exit(1);
  }
}

applyRLSFix();
