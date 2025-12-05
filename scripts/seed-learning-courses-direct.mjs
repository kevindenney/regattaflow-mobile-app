#!/usr/bin/env node
/**
 * Seed Learning Courses - Direct Postgres Connection
 * 
 * Seeds course data using direct postgres connection to bypass schema cache
 * 
 * Usage: node scripts/seed-learning-courses-direct.mjs
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

// Course data
const COURSE_DATA = {
  slug: 'winning-starts-first-beats',
  title: 'Winning Starts & First Beats',
  description: 'Master the critical first moments of every race with proven techniques for reading the line, timing your approach, and executing a winning start.',
  long_description: `This comprehensive course covers everything you need to know about race starts in sailboat racing. From understanding the starting sequence to advanced positioning strategies, you'll learn the techniques used by top sailors worldwide.

Whether you're new to racing or looking to sharpen your competitive edge, this course provides interactive lessons that let you practice and visualize key concepts before hitting the water.`,
  thumbnail_url: '/images/courses/winning-starts.jpg',
  level: 'intermediate',
  duration_minutes: 150,
  price_cents: 7500,
  is_published: true,
  is_featured: true,
  order_index: 1,
  requires_subscription: false,
  min_subscription_tier: 'free',
  instructor_name: 'Kevin Denney',
  instructor_bio: 'NorthU Certified Instructor with 20+ years of racing experience across multiple classes.',
  learning_objectives: [
    'Understand the 5-4-1-0 starting sequence and flag signals',
    'Read line bias and identify the favored end',
    'Execute precise timed runs to the line',
    'Position and defend your spot on the line',
    'Apply advanced strategies for different conditions',
  ],
  modules: [
    {
      title: 'Understanding the Start',
      description: 'Foundation concepts for race starts',
      order_index: 1,
      lessons: [
        {
          title: 'Setting the Course',
          description: 'Learn how race committees set the course and what it means for your start strategy.',
          lesson_type: 'interactive',
          interactive_component: 'SetCourseInteractive',
          order_index: 1,
          is_free_preview: true,
          duration_seconds: 600,
        },
        {
          title: 'The Starting Sequence',
          description: 'Master the 5-4-1-0 minute sequence with flags and horns.',
          lesson_type: 'interactive',
          interactive_component: 'StartingSequenceInteractive',
          order_index: 2,
          is_free_preview: true,
          duration_seconds: 900,
        },
      ],
    },
    {
      title: 'Reading the Line',
      description: 'Techniques for finding advantage before the start',
      order_index: 2,
      lessons: [
        {
          title: 'Line Bias Fundamentals',
          description: 'Learn to read the start line and identify which end gives you an advantage.',
          lesson_type: 'interactive',
          interactive_component: 'LineBiasInteractive',
          order_index: 1,
          is_free_preview: false,
          duration_seconds: 720,
        },
        {
          title: 'Finding the Favored End',
          description: 'Techniques for determining which end of the line to start from.',
          lesson_type: 'interactive',
          interactive_component: 'FavoredEndInteractive',
          order_index: 2,
          is_free_preview: false,
          duration_seconds: 600,
        },
      ],
    },
    {
      title: 'Execution',
      description: 'Putting it all together on race day',
      order_index: 3,
      lessons: [
        {
          title: 'The Timed Run',
          description: 'Perfect your approach with the timed run technique.',
          lesson_type: 'interactive',
          interactive_component: 'TimedRunInteractive',
          order_index: 1,
          is_free_preview: false,
          duration_seconds: 720,
        },
        {
          title: 'Positioning & Defense',
          description: 'Secure and defend your position on the start line.',
          lesson_type: 'interactive',
          interactive_component: 'PositioningInteractive',
          order_index: 2,
          is_free_preview: false,
          duration_seconds: 840,
        },
        {
          title: 'Advanced Starting Strategies',
          description: 'Advanced techniques for different conditions and fleet sizes.',
          lesson_type: 'interactive',
          interactive_component: 'StartingStrategiesInteractive',
          order_index: 3,
          is_free_preview: false,
          duration_seconds: 900,
        },
      ],
    },
  ],
};

async function seedCourses() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🌱 Seeding Learning Courses');
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
      console.log(`   Modules: ${courseResult[0].module_count}`);
      console.log(`   Lessons: ${courseResult[0].lesson_count}\n`);
    }

  } catch (e) {
    console.error('❌ Error seeding courses:', e.message);
    throw e;
  } finally {
    await sql.end();
  }
}

seedCourses()
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

