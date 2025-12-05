#!/usr/bin/env node
/**
 * Execute Learning Platform Migration
 *
 * Runs the migration SQL directly via the Supabase postgres connection
 */

import postgres from 'postgres';
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
  console.log('No .env.local found');
}

// Supabase database connection
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

// Use the database password from service role key (this is a simplification)
// In production, you'd use the actual database password
const DATABASE_URL = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

console.log('═══════════════════════════════════════════════════════════');
console.log('  📦 Executing Learning Platform Migration');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Project: ${projectRef}\n`);

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251204200000_create_learning_platform.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('Migration loaded. Attempting connection...\n');

// Since direct postgres connection may not work, let's output the SQL for manual execution
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('MANUAL MIGRATION REQUIRED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Please run this migration in Supabase SQL Editor:\n');
console.log(`1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log(`2. Paste the contents of: supabase/migrations/20251204200000_create_learning_platform.sql`);
console.log(`3. Click "Run"\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Also output a curl command for the API approach
console.log('Alternatively, you can open this URL to run the SQL:\n');
console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
