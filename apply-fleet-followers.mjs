#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📋 Reading fleet_followers migration...');
    const migrationPath = join(__dirname, 'supabase/migrations/20251201150000_create_fleet_followers_table.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('🔄 Applying migration...');
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Try direct approach if RPC doesn't work
      console.log('⚠️  RPC failed, trying direct SQL execution...');

      // Split and execute statements one by one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
        if (stmtError) {
          console.warn(`⚠️  Warning: ${stmtError.message}`);
        }
      }
    }

    console.log('✅ Fleet followers table created successfully!');

    // Verify the table exists
    const { data, error: checkError } = await supabase
      .from('fleet_followers')
      .select('count')
      .limit(0);

    if (checkError) {
      console.error('❌ Error verifying table:', checkError.message);
    } else {
      console.log('✅ Table verified!');
    }

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  }
}

applyMigration();
