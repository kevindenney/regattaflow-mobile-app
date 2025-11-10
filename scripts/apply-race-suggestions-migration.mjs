#!/usr/bin/env node

/**
 * Apply race suggestions system migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

async function applyMigration() {
  console.log('🔧 Applying race suggestions system migration...\n');

  // Read the migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251106130000_create_race_suggestions_system.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file loaded');
  console.log(`   Size: ${migrationSQL.length} characters`);
  console.log(`   Path: ${migrationPath}\n`);

  console.log('⚠️  This migration needs to be run in the Supabase SQL Editor');
  console.log('   because the Supabase client doesn\'t support raw SQL execution.\n');

  console.log('📋 Instructions:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
  console.log('   2. Copy the SQL from the file:');
  console.log(`      ${migrationPath}`);
  console.log('   3. Paste it into the SQL Editor');
  console.log('   4. Click "Run"\n');

  console.log('💡 Quick check - Does the table exist?');

  try {
    const { error } = await supabase
      .from('race_suggestions_cache')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ❌ Table does not exist yet - migration needs to be applied\n');
        console.log('Or run this command to copy the SQL to your clipboard:');
        console.log(`   cat "${migrationPath}" | pbcopy`);
      } else {
        console.log('   ⚠️  Unexpected error:', error.message);
      }
    } else {
      console.log('   ✅ Table already exists!\n');
      console.log('🎉 Migration already applied successfully!');
    }
  } catch (err) {
    console.error('   ❌ Error checking table:', err.message);
  }
}

applyMigration();
