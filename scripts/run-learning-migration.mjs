#!/usr/bin/env node
/**
 * Direct SQL Migration Runner for Learning Platform
 *
 * Runs the learning platform migration directly via Supabase REST API
 */

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
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('No .env.local found, using environment variables');
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    // If exec_sql doesn't exist, that's expected
    if (text.includes('function') && text.includes('does not exist')) {
      return { needsDirect: true };
    }
    throw new Error(`SQL Error: ${text}`);
  }

  return response.json();
}

async function runDirectSQL(sql) {
  // Use the SQL API directly
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: sql,
  });

  return response;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📦 Learning Platform Direct Migration');
  console.log('═══════════════════════════════════════════════════════════\n');

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251204200000_create_learning_platform.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('Migration file loaded. Running via Supabase dashboard is recommended.\n');
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/qavekrwdbsobecwrfxwu/sql/new\n');
  console.log('Copy the contents of this file:');
  console.log(`  ${migrationPath}\n`);

  // Try to check if tables already exist by querying them
  console.log('Checking current state...\n');

  try {
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/learning_courses?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (checkResponse.ok) {
      console.log('✅ learning_courses table exists');
    } else {
      const error = await checkResponse.text();
      if (error.includes('does not exist')) {
        console.log('❌ learning_courses table does NOT exist');
        console.log('\n⚠️  Please run the migration SQL manually in Supabase Dashboard.\n');
      } else {
        console.log('⚠️  Could not verify table status:', error);
      }
    }

    // Check all tables
    const tables = ['learning_modules', 'learning_lessons', 'learning_enrollments', 'learning_lesson_progress'];
    for (const table of tables) {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });
      if (resp.ok) {
        console.log(`✅ ${table} table exists`);
      } else {
        console.log(`❌ ${table} table does NOT exist`);
      }
    }

  } catch (e) {
    console.error('Error checking tables:', e.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
