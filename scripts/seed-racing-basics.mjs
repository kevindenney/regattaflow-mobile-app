#!/usr/bin/env node
/**
 * Seed Racing Basics Course - Direct Postgres Connection
 * 
 * Seeds the "Racing Basics" course data using direct postgres connection
 * 
 * Usage: node scripts/seed-racing-basics.mjs
 * Requires: SUPABASE_DB_PASSWORD in .env.local
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
          lesson_type: 'text',
          order_index: 2,
          is_free_preview: false,
          duration_seconds: 900,
        },
        {
          title: 'Downwind Basics',
          description: 'Introduction to downwind sailing',
          lesson_type: 'text',
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
  console.log('  Direct Postgres Connection');
  console.log('═══════════════════════════════════════════════════════════\n');

  const sql = postgres(connectionString, { max: 1 });

  try {
    // Check if course already exists
    const existing = await sql`
      SELECT id FROM learning_courses WHERE slug = ${COURSE_DATA.slug}
    `;

    if (existing.length > 0) {
      console.log(`⏭️  Course "${COURSE_DATA.title}" already exists, skipping...\n`);
      await sql.end();
      return;
    }

    // Insert course
    console.log(`📚 Creating course: ${COURSE_DATA.title}`);
    const { learning_objectives, modules, ...course } = COURSE_DATA;
    
    const [insertedCourse] = await sql`
      INSERT INTO learning_courses ${sql({
        ...course,
        learning_objectives: JSON.stringify(learning_objectives),
      })}
      RETURNING id
    `;

    console.log(`✅ Course created with ID: ${insertedCourse.id}\n`);

    // Insert modules and lessons
    for (const moduleData of COURSE_DATA.modules) {
      const { lessons, ...module } = moduleData;
      module.course_id = insertedCourse.id;

      console.log(`   📁 Creating module: ${module.title}`);
      const [insertedModule] = await sql`
        INSERT INTO learning_modules ${sql(module, Object.keys(module))}
        RETURNING id
      `;

      // Insert lessons
      for (const lessonData of lessons) {
        const lesson = { ...lessonData, module_id: insertedModule.id };
        console.log(`      📄 Creating lesson: ${lesson.title}`);
        
        await sql`
          INSERT INTO learning_lessons ${sql(lesson, Object.keys(lesson))}
        `;
      }
    }

    console.log(`\n✅ Course "${COURSE_DATA.title}" fully seeded!\n`);

    // Verify
    console.log('🔍 Verifying seed...\n');
    const courseResult = await sql`
      SELECT 
        c.id,
        c.title,
        c.slug,
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT l.id) as lesson_count
      FROM learning_courses c
      LEFT JOIN learning_modules m ON m.course_id = c.id
      LEFT JOIN learning_lessons l ON l.module_id = m.id
      WHERE c.slug = ${COURSE_DATA.slug}
      GROUP BY c.id, c.title, c.slug
    `;

    if (courseResult.length > 0) {
      console.log(`✅ Course: ${courseResult[0].title}`);
      console.log(`   Slug: ${courseResult[0].slug}`);
      console.log(`   Modules: ${courseResult[0].module_count}`);
      console.log(`   Lessons: ${courseResult[0].lesson_count}\n`);
    }

  } catch (e) {
    console.error('❌ Error seeding course:', e.message);
    if (e.detail) {
      console.error('   Detail:', e.detail);
    }
    throw e;
  } finally {
    await sql.end();
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

