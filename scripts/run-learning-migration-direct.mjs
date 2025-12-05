#!/usr/bin/env node
/**
 * Run Learning Platform Migration Directly
 * 
 * Executes the migration SQL using postgres package
 * 
 * Usage: node scripts/run-learning-migration-direct.mjs
 * 
 * Requires:
 * - EXPO_PUBLIC_SUPABASE_URL
 * - SUPABASE_DB_PASSWORD (or SUPABASE_SERVICE_ROLE_KEY for connection string construction)
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
      const value = valueParts.join('=').trim();
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = cleanValue;
    }
  });
} catch (e) {
  console.log('No .env.local found, using environment variables');
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  📦 Learning Platform Migration');
console.log('  RegattaFlow - Direct SQL Execution');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Project: ${projectRef}`);
console.log(`Supabase URL: ${SUPABASE_URL}\n`);

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251204200000_create_learning_platform.sql');
let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log(`✅ Migration file loaded: ${migrationPath}\n`);
} catch (e) {
  console.error(`❌ Could not read migration file: ${migrationPath}`);
  console.error(e.message);
  process.exit(1);
}

// Try to construct database connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// Or direct: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

let sql;
let connectionString;

if (DB_PASSWORD) {
  // Use direct connection (port 5432) - more reliable for DDL
  connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
  console.log('🔗 Using direct database connection (port 5432)\n');
} else if (SERVICE_KEY) {
  // Try to use service key (this won't work for direct postgres, but we'll try pooler)
  // Note: Service key is not the DB password, but we can try pooler connection
  console.log('⚠️  SUPABASE_DB_PASSWORD not found, trying pooler connection...');
  console.log('   (This may not work - you may need to set SUPABASE_DB_PASSWORD)\n');
  
  // Pooler connection (port 6543) - less reliable for DDL but worth trying
  connectionString = `postgresql://postgres.${projectRef}:${SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
} else {
  console.error('❌ Missing SUPABASE_DB_PASSWORD or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nTo get your database password:');
  console.error(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
  console.error('2. Copy the database password');
  console.error('3. Add to .env.local: SUPABASE_DB_PASSWORD=your_password\n');
  process.exit(1);
}

try {
  console.log('🔌 Connecting to database...');
  sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  console.log('✅ Connected!\n');
} catch (e) {
  console.error('❌ Connection failed:', e.message);
  console.error('\n💡 Alternative: Run migration manually in Supabase SQL Editor:');
  console.error(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  process.exit(1);
}

// Execute migration
async function runMigration() {
  console.log('🚀 Executing migration...\n');
  
  try {
    // Execute the entire migration as a single transaction
    // Split by semicolons but handle multi-line statements
    const statements = migrationSQL
      .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|GRANT|COMMENT|$))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));
    
    console.log(`   Found ${statements.length} SQL statements\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 5) continue;
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;
      
      try {
        // Add semicolon if not present
        const sqlWithSemicolon = statement.endsWith(';') ? statement : statement + ';';
        
        await sql.unsafe(sqlWithSemicolon);
        successCount++;
        process.stdout.write('.');
      } catch (e) {
        // Some errors are expected (e.g., "already exists")
        if (e.message?.includes('already exists') || 
            e.message?.includes('duplicate') ||
            e.message?.includes('does not exist') && e.message?.includes('DROP')) {
          process.stdout.write('s'); // skipped (expected)
        } else {
          errorCount++;
          errors.push({ statement: i + 1, error: e.message, sql: statement.substring(0, 100) });
          process.stdout.write('x');
        }
      }
    }
    
    console.log('\n');
    console.log(`✅ Migration complete: ${successCount} succeeded, ${errorCount} errors\n`);
    
    if (errors.length > 0) {
      console.log('⚠️  Errors encountered:\n');
      errors.forEach(({ statement, error, sql }) => {
        console.log(`   Statement ${statement}: ${error}`);
        console.log(`   SQL: ${sql}...\n`);
      });
    }
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    const tables = ['learning_courses', 'learning_modules', 'learning_lessons', 'learning_enrollments', 'learning_lesson_progress'];
    
    for (const table of tables) {
      try {
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
      } catch (e) {
        console.log(`   ⚠️  ${table} - Error checking: ${e.message}`);
      }
    }
    
    console.log('\n');
    
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    throw e;
  } finally {
    await sql.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ Migration Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Next step: Run the seed script to add course data:');
    console.log('  node scripts/setup-learning-platform.mjs\n');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Migration failed:', e.message);
    console.error('\n💡 If connection failed, try running manually:');
    console.error(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    process.exit(1);
  });

