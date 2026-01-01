#!/usr/bin/env node
/**
 * Update Types of Races lesson to use interactive component
 *
 * Usage: node scripts/update-types-of-races-lesson.mjs
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
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
} catch (e) {
  // Ignore
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!DB_PASSWORD) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD');
  console.error('\nTo get your database password:');
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.error(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
  console.error('2. Copy the database password');
  console.error('3. Add to .env.local: SUPABASE_DB_PASSWORD=your_password\n');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

async function updateLessons() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔄 Updating Racing Basics Lessons to Interactive');
  console.log('═══════════════════════════════════════════════════════════\n');

  const sql = postgres(connectionString, { max: 1 });

  try {
    // First, let's see what we have
    console.log('📋 Current lessons in Introduction to Racing module:\n');

    const currentLessons = await sql`
      SELECT
        l.id,
        l.title,
        l.lesson_type,
        l.interactive_component,
        l.description
      FROM learning_lessons l
      JOIN learning_modules m ON l.module_id = m.id
      JOIN learning_courses c ON m.course_id = c.id
      WHERE c.slug = 'racing-basics'
        AND m.title = 'Introduction to Racing'
      ORDER BY l.order_index
    `;

    currentLessons.forEach(lesson => {
      console.log(`   ${lesson.title}`);
      console.log(`      Type: ${lesson.lesson_type}`);
      console.log(`      Component: ${lesson.interactive_component || 'none'}`);
      console.log('');
    });

    // Update "What is Sailboat Racing?"
    console.log('🔄 Updating "What is Sailboat Racing?" to interactive...');
    const result1 = await sql`
      UPDATE learning_lessons l
      SET
        lesson_type = 'interactive',
        interactive_component = 'WhatIsSailboatRacingInteractive',
        updated_at = NOW()
      FROM learning_modules m, learning_courses c
      WHERE l.module_id = m.id
        AND m.course_id = c.id
        AND c.slug = 'racing-basics'
        AND l.title = 'What is Sailboat Racing?'
      RETURNING l.id, l.title
    `;

    if (result1.length > 0) {
      console.log(`   ✅ Updated: ${result1[0].title}\n`);
    } else {
      console.log('   ⚠️  Lesson not found or already updated\n');
    }

    // Update "Types of Races"
    console.log('🔄 Updating "Types of Races" to interactive...');
    const result2 = await sql`
      UPDATE learning_lessons l
      SET
        lesson_type = 'interactive',
        interactive_component = 'TypesOfRacesInteractive',
        description = 'Fleet racing, match racing, team racing, and distance racing explained',
        duration_seconds = 600,
        updated_at = NOW()
      FROM learning_modules m, learning_courses c
      WHERE l.module_id = m.id
        AND m.course_id = c.id
        AND c.slug = 'racing-basics'
        AND l.title = 'Types of Races'
      RETURNING l.id, l.title
    `;

    if (result2.length > 0) {
      console.log(`   ✅ Updated: ${result2[0].title}\n`);
    } else {
      console.log('   ⚠️  Lesson not found or already updated\n');
    }

    // Verify the updates
    console.log('📋 Updated lessons:\n');

    const updatedLessons = await sql`
      SELECT
        l.id,
        l.title,
        l.lesson_type,
        l.interactive_component
      FROM learning_lessons l
      JOIN learning_modules m ON l.module_id = m.id
      JOIN learning_courses c ON m.course_id = c.id
      WHERE c.slug = 'racing-basics'
        AND m.title = 'Introduction to Racing'
      ORDER BY l.order_index
    `;

    updatedLessons.forEach(lesson => {
      const status = lesson.interactive_component ? '✅' : '⏳';
      console.log(`   ${status} ${lesson.title}`);
      console.log(`      Type: ${lesson.lesson_type}`);
      console.log(`      Component: ${lesson.interactive_component || 'none'}`);
      console.log('');
    });

  } catch (e) {
    console.error('❌ Error updating lessons:', e.message);
    if (e.detail) {
      console.error('   Detail:', e.detail);
    }
    throw e;
  } finally {
    await sql.end();
  }
}

updateLessons()
  .then(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ Update Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Update failed:', e.message);
    process.exit(1);
  });
