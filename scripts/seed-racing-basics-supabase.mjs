#!/usr/bin/env node
/**
 * Seed Racing Basics Course - Supabase Client
 * 
 * Seeds the "Racing Basics" course data using Supabase client
 * 
 * Usage: node scripts/seed-racing-basics-supabase.mjs
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
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

if (!SUPABASE_URL) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nTo get your service role key:');
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.error(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/settings/api`);
  console.error('2. Copy the "service_role" key (not the anon key)');
  console.error('3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Racing Basics course data from course-catalog.json
const COURSE_DATA = {
  slug: 'racing-basics',
  title: 'Racing Basics',
  description: 'Master the fundamentals of sailboat racing, from rules to race structure. Perfect for sailors new to competitive racing or those wanting a solid foundation.',
  long_description: 'This comprehensive course covers everything you need to know to start racing confidently. Learn the racing rules, understand race structure, master basic tactics, and develop the skills needed to compete at the club level.',
  thumbnail_url: '/images/courses/racing-basics.jpg',
  level: 'beginner', // level-1 maps to beginner
  duration_minutes: 120,
  price_cents: 0, // Free course
  is_published: true,
  is_featured: false,
  order_index: 0,
  requires_subscription: false,
  min_subscription_tier: 'free',
  instructor_name: 'Kevin Denney',
  instructor_bio: 'NorthU Certified Instructor with 20+ years of racing experience across multiple classes.',
  learning_objectives: [
    'Understanding the Racing Rules of Sailing (RRS)',
    'Race structure and course types',
    'Basic right-of-way rules',
    'Starting procedures and signals',
    'Mark rounding basics',
    'Protest procedures',
    'Race preparation essentials',
    'Safety in racing',
  ],
  modules: [
    {
      title: 'Introduction to Racing',
      description: 'Foundation concepts for competitive sailing',
      order_index: 1,
      duration_minutes: 15,
      lessons: [
        {
          title: 'What is Sailboat Racing?',
          description: 'Overview of competitive sailing and what makes it exciting',
          lesson_type: 'interactive',
          interactive_component: 'WhatIsSailboatRacingInteractive',
          order_index: 1,
          is_free_preview: true,
          duration_seconds: 600,
        },
        {
          title: 'Types of Races',
          description: 'Fleet racing, match racing, team racing, and distance racing explained',
          lesson_type: 'interactive',
          interactive_component: 'TypesOfRacesInteractive',
          order_index: 2,
          is_free_preview: true,
          duration_seconds: 600,
        },
      ],
    },
    {
      title: 'Racing Rules Basics',
      description: 'Essential right-of-way and mark room rules',
      order_index: 2,
      duration_minutes: 30,
      lessons: [
        {
          title: 'Right-of-Way Rules',
          description: 'Learn port/starboard, windward/leeward, and overtaking rules',
          lesson_type: 'interactive',
          interactive_component: 'RightOfWayInteractive',
          order_index: 1,
          is_free_preview: false,
          duration_seconds: 900,
        },
        {
          title: 'Mark Room Rules',
          description: 'Understanding overlap, mark room, and proper rounding',
          lesson_type: 'interactive',
          interactive_component: 'MarkRoomInteractive',
          order_index: 2,
          is_free_preview: false,
          duration_seconds: 900,
        },
      ],
    },
    {
      title: 'Race Structure',
      description: 'Understanding race formats and starting procedures',
      order_index: 3,
      duration_minutes: 25,
      lessons: [
        {
          title: 'The Starting Sequence',
          description: 'Master the 5-4-1-0 minute sequence',
          lesson_type: 'interactive',
          interactive_component: 'StartingSequenceInteractive',
          order_index: 1,
          is_free_preview: true,
          duration_seconds: 900,
        },
        {
          title: 'Course Types',
          description: 'Windward-leeward, triangle, and distance courses',
          lesson_type: 'text',
          order_index: 2,
          is_free_preview: false,
          duration_seconds: 600,
        },
      ],
    },
    {
      title: 'Basic Tactics',
      description: 'Fundamental racing tactics and techniques',
      order_index: 4,
      duration_minutes: 50,
      lessons: [
        {
          title: 'Starting Basics',
          description: 'Fundamental starting techniques',
          lesson_type: 'interactive',
          interactive_component: 'StartingBasicsInteractive',
          order_index: 1,
          is_free_preview: false,
          duration_seconds: 1200,
        },
        {
          title: 'Upwind Tactics',
          description: 'Basic upwind sailing strategies',
          lesson_type: 'interactive',
          interactive_component: 'UpwindTacticsInteractive',
          order_index: 2,
          is_free_preview: false,
          duration_seconds: 900,
        },
        {
          title: 'Downwind Basics',
          description: 'Introduction to downwind sailing',
          lesson_type: 'interactive',
          interactive_component: 'DownwindBasicsInteractive',
          order_index: 3,
          is_free_preview: false,
          duration_seconds: 600,
        },
      ],
    },
  ],
};

async function seedRacingBasics() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🌱 Seeding Racing Basics Course');
  console.log('  Using Supabase Client');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Check if course already exists
    const { data: existing, error: checkError } = await supabase
      .from('learning_courses')
      .select('id')
      .eq('slug', COURSE_DATA.slug)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      console.log(`⏭️  Course "${COURSE_DATA.title}" already exists, skipping...\n`);
      return;
    }

    // Insert course
    console.log(`📚 Creating course: ${COURSE_DATA.title}`);
    const { learning_objectives, modules, ...course } = COURSE_DATA;
    
    const { data: insertedCourse, error: courseError } = await supabase
      .from('learning_courses')
      .insert({
        ...course,
        learning_objectives: learning_objectives,
      })
      .select('id')
      .single();

    if (courseError) {
      throw courseError;
    }

    console.log(`✅ Course created with ID: ${insertedCourse.id}\n`);

    // Insert modules and lessons
    for (const moduleData of COURSE_DATA.modules) {
      const { lessons, ...module } = moduleData;
      module.course_id = insertedCourse.id;

      console.log(`   📁 Creating module: ${module.title}`);
      const { data: insertedModule, error: moduleError } = await supabase
        .from('learning_modules')
        .insert(module)
        .select('id')
        .single();

      if (moduleError) {
        throw moduleError;
      }

      // Insert lessons
      for (const lessonData of lessons) {
        const lesson = { ...lessonData, module_id: insertedModule.id };
        console.log(`      📄 Creating lesson: ${lesson.title}`);
        
        const { error: lessonError } = await supabase
          .from('learning_lessons')
          .insert(lesson);

        if (lessonError) {
          throw lessonError;
        }
      }
    }

    console.log(`\n✅ Course "${COURSE_DATA.title}" fully seeded!\n`);

    // Verify
    console.log('🔍 Verifying seed...\n');
    const { data: courseResult, error: verifyError } = await supabase
      .from('learning_courses')
      .select(`
        id,
        title,
        slug,
        learning_modules (
          id,
          learning_lessons (id)
        )
      `)
      .eq('slug', COURSE_DATA.slug)
      .single();

    if (verifyError) {
      console.warn('⚠️  Could not verify seed:', verifyError.message);
    } else if (courseResult) {
      const moduleCount = courseResult.learning_modules?.length || 0;
      const lessonCount = courseResult.learning_modules?.reduce((sum, m) => sum + (m.learning_lessons?.length || 0), 0) || 0;
      console.log(`✅ Course: ${courseResult.title}`);
      console.log(`   Slug: ${courseResult.slug}`);
      console.log(`   Modules: ${moduleCount}`);
      console.log(`   Lessons: ${lessonCount}\n`);
    }

  } catch (e) {
    console.error('❌ Error seeding course:', e.message);
    if (e.detail) {
      console.error('   Detail:', e.detail);
    }
    if (e.hint) {
      console.error('   Hint:', e.hint);
    }
    throw e;
  }
}

seedRacingBasics()
  .then(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ Seed Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Seed failed:', e.message);
    process.exit(1);
  });

