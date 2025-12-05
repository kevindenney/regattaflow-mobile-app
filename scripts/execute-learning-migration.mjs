#!/usr/bin/env node
/**
 * Execute Learning Platform Migration
 * 
 * This script provides multiple ways to execute the migration:
 * 1. Uses Supabase Management API (if access token available)
 * 2. Uses direct postgres connection (if DB password available)
 * 3. Provides instructions for manual execution
 * 
 * Usage: node scripts/execute-learning-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
} catch (e) {
  // Ignore
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  📦 Learning Platform Migration');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Project: ${projectRef}\n`);

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251204200000_create_learning_platform.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// Method 1: Try using Supabase client with service key to execute via REST API
// Note: Supabase REST API doesn't support arbitrary SQL, so we'll need to use
// the SQL Editor API or direct postgres connection

async function trySupabaseClient() {
  if (!SERVICE_KEY) {
    return false;
  }

  console.log('🔧 Attempting via Supabase client...\n');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if tables exist
  const tables = ['learning_courses', 'learning_modules', 'learning_lessons', 'learning_enrollments', 'learning_lesson_progress'];
  let allExist = true;

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(0);
    if (error && error.message.includes('does not exist')) {
      allExist = false;
      break;
    }
  }

  if (allExist) {
    console.log('✅ All learning tables already exist!\n');
    return true;
  }

  console.log('⚠️  Supabase REST API cannot execute DDL statements directly.');
  console.log('   Need to use postgres connection or manual execution.\n');
  return false;
}

async function tryPostgresConnection() {
  if (!DB_PASSWORD) {
    return false;
  }

  console.log('🔧 Attempting via direct postgres connection...\n');
  
  try {
    const postgres = (await import('postgres')).default;
    const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
    
    const sql = postgres(connectionString, { max: 1 });
    
    console.log('✅ Connected to database!\n');
    console.log('🚀 Executing migration...\n');
    
    // Execute the migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables
    const tables = ['learning_courses', 'learning_modules', 'learning_lessons', 'learning_enrollments', 'learning_lesson_progress'];
    console.log('🔍 Verifying tables...\n');
    
    for (const table of tables) {
      const result = await sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      )`;
      
      if (result[0]?.exists) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - NOT FOUND`);
      }
    }
    
    await sql.end();
    return true;
  } catch (e) {
    console.log(`⚠️  Postgres connection failed: ${e.message}\n`);
    return false;
  }
}

function showManualInstructions() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📋 MANUAL MIGRATION REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('To execute the migration manually:\n');
  console.log(`1. Open Supabase SQL Editor:`);
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log('2. Copy the migration SQL from:');
  console.log(`   ${migrationPath}\n`);
  console.log('3. Paste into the SQL Editor and click "Run"\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Alternative: Use Supabase CLI');
  console.log('  npx supabase db push --linked\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  // Try method 1: Check if tables exist via Supabase client
  const tablesExist = await trySupabaseClient();
  if (tablesExist) {
    console.log('✅ Migration not needed - tables already exist!\n');
    return;
  }

  // Try method 2: Direct postgres connection
  const postgresSuccess = await tryPostgresConnection();
  if (postgresSuccess) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ Migration Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Next: Run seed script:');
    console.log('  node scripts/setup-learning-platform.mjs\n');
    return;
  }

  // Method 3: Manual instructions
  showManualInstructions();
  
  console.log('💡 To enable automatic migration:');
  console.log('   Add SUPABASE_DB_PASSWORD to .env.local');
  console.log('   Get it from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database\n');
}

main().catch(console.error);

