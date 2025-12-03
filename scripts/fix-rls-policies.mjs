#!/usr/bin/env node

/**
 * Fix RLS policies for race_participants table
 * Allows viewing public and fleet competitors
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixRLSPolicies() {
  console.log('\n🔒 Fixing RLS policies for race_participants...\n');

  try {
    // Read the migration SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251201130000_fix_race_participants_rls.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Executing RLS policy updates...');

    // Execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      // Skip comments
      if (statement.startsWith('--')) continue;

      console.log(`\\nExecuting: ${statement.substring(0, 60)}...`);

      // Use rpc to execute raw SQL (if available) or create individual policies
      // Since Supabase client doesn't support raw SQL execution,
      // we'll need to use the Management API or dashboard
      console.log('⚠️  Please apply this migration via Supabase Dashboard SQL Editor');
    }

    console.log('\\n📋 Migration SQL to run in Supabase Dashboard:');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================\\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixRLSPolicies();
