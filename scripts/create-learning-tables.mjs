#!/usr/bin/env node
/**
 * Create Learning Tables Directly
 *
 * Creates the learning platform tables using Supabase client
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
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('No .env.local found');
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('═══════════════════════════════════════════════════════════');
console.log('  📦 Creating Learning Platform Tables');
console.log('═══════════════════════════════════════════════════════════\n');

// Individual table creation statements
const createStatements = [
  // learning_courses
  `CREATE TABLE IF NOT EXISTS learning_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    thumbnail_url TEXT,
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    duration_minutes INTEGER DEFAULT 0,
    price_cents INTEGER,
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    requires_subscription BOOLEAN DEFAULT false,
    min_subscription_tier TEXT DEFAULT 'free',
    instructor_name TEXT,
    instructor_bio TEXT,
    learning_objectives JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // learning_modules
  `CREATE TABLE IF NOT EXISTS learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // learning_lessons
  `CREATE TABLE IF NOT EXISTS learning_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lesson_type TEXT CHECK (lesson_type IN ('video', 'interactive', 'text', 'quiz')) DEFAULT 'video',
    video_url TEXT,
    video_thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    interactive_component TEXT,
    interactive_config JSONB DEFAULT '{}'::jsonb,
    content_markdown TEXT,
    order_index INTEGER DEFAULT 0,
    is_free_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // learning_enrollments
  `CREATE TABLE IF NOT EXISTS learning_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
    stripe_payment_id TEXT,
    stripe_checkout_session_id TEXT,
    amount_paid_cents INTEGER,
    access_type TEXT CHECK (access_type IN ('purchase', 'subscription', 'gift', 'promo')) DEFAULT 'purchase',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    progress_percent INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    certificate_issued_at TIMESTAMPTZ,
    certificate_url TEXT,
    UNIQUE(user_id, course_id)
  )`,

  // learning_lesson_progress
  `CREATE TABLE IF NOT EXISTS learning_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    watch_time_seconds INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    interaction_data JSONB DEFAULT '{}'::jsonb,
    quiz_score INTEGER,
    quiz_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
  )`,
];

async function createTables() {
  for (const sql of createStatements) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
    process.stdout.write(`Creating ${tableName}... `);

    try {
      // Use the raw SQL execution via rpc
      const { error } = await supabase.rpc('exec', { sql });

      if (error) {
        // Try checking if table exists
        const { error: checkError } = await supabase.from(tableName).select('id').limit(0);
        if (!checkError || !checkError.message.includes('does not exist')) {
          console.log('EXISTS');
          continue;
        }
        console.log('ERROR:', error.message);
      } else {
        console.log('OK');
      }
    } catch (e) {
      console.log('SKIPPED (RPC not available)');
    }
  }
}

async function checkTables() {
  console.log('\n📋 Checking table status:\n');

  const tables = ['learning_courses', 'learning_modules', 'learning_lessons', 'learning_enrollments', 'learning_lesson_progress'];

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      if (response.ok) {
        console.log(`   ✅ ${table}`);
      } else {
        const error = await response.text();
        if (error.includes('does not exist')) {
          console.log(`   ❌ ${table} - NOT FOUND`);
        } else {
          console.log(`   ⚠️  ${table} - ${error.substring(0, 50)}`);
        }
      }
    } catch (e) {
      console.log(`   ❌ ${table} - ${e.message}`);
    }
  }
}

async function main() {
  await checkTables();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('If tables are missing, please run the migration manually:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log(`1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('2. Copy the SQL from: supabase/migrations/20251204200000_create_learning_platform.sql');
  console.log('3. Paste and click "Run"\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
