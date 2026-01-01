#!/usr/bin/env node
/**
 * Update lessons to use interactive components
 * Uses Supabase client (service role key)
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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function updateLessons() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔄 Updating Lessons to Interactive');
  console.log('═══════════════════════════════════════════════════════════\n');

  // First, find the course
  const { data: course, error: courseError } = await supabase
    .from('learning_courses')
    .select('id, title')
    .eq('slug', 'racing-basics')
    .single();

  if (courseError || !course) {
    console.error('❌ Could not find racing-basics course:', courseError?.message);
    process.exit(1);
  }

  console.log(`📚 Found course: ${course.title} (${course.id})\n`);

  // Get all lessons for this course
  const { data: modules, error: modulesError } = await supabase
    .from('learning_modules')
    .select('id, title, learning_lessons(*)')
    .eq('course_id', course.id)
    .order('order_index');

  if (modulesError) {
    console.error('❌ Could not fetch modules:', modulesError.message);
    process.exit(1);
  }

  // Find and update "What is Sailboat Racing?"
  for (const mod of modules) {
    for (const lesson of mod.learning_lessons || []) {
      if (lesson.title === 'What is Sailboat Racing?') {
        console.log(`🔄 Updating "${lesson.title}"...`);
        const { error } = await supabase
          .from('learning_lessons')
          .update({
            lesson_type: 'interactive',
            interactive_component: 'WhatIsSailboatRacingInteractive',
          })
          .eq('id', lesson.id);

        if (error) {
          console.error(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Updated to interactive`);
        }
      }

      if (lesson.title === 'Types of Races') {
        console.log(`🔄 Updating "${lesson.title}"...`);
        const { error } = await supabase
          .from('learning_lessons')
          .update({
            lesson_type: 'interactive',
            interactive_component: 'TypesOfRacesInteractive',
            description: 'Fleet racing, match racing, team racing, and distance racing explained',
            duration_seconds: 600,
          })
          .eq('id', lesson.id);

        if (error) {
          console.error(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Updated to interactive`);
        }
      }
    }
  }

  // Verify updates
  console.log('\n📋 Verifying updates...\n');

  const { data: updatedModules } = await supabase
    .from('learning_modules')
    .select('title, learning_lessons(title, lesson_type, interactive_component)')
    .eq('course_id', course.id)
    .eq('title', 'Introduction to Racing')
    .single();

  if (updatedModules) {
    console.log(`Module: ${updatedModules.title}`);
    for (const lesson of updatedModules.learning_lessons || []) {
      const status = lesson.interactive_component ? '✅' : '⏳';
      console.log(`  ${status} ${lesson.title}`);
      console.log(`      Type: ${lesson.lesson_type}`);
      console.log(`      Component: ${lesson.interactive_component || 'none'}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ Update Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

updateLessons().catch(console.error);
