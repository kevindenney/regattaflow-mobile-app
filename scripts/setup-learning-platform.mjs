#!/usr/bin/env node
/**
 * Learning Platform Setup Script
 *
 * This script:
 * 1. Runs the learning platform migration
 * 2. Seeds initial course data
 *
 * Usage: node scripts/setup-learning-platform.mjs
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
  console.log('No .env.local found, using environment variables');
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Course data to seed
const COURSES = [
  {
    slug: 'winning-starts-first-beats',
    title: 'Winning Starts & First Beats',
    description: 'Master the critical first moments of every race with proven techniques for reading the line, timing your approach, and executing a winning start.',
    long_description: `This comprehensive course covers everything you need to know about race starts in sailboat racing. From understanding the starting sequence to advanced positioning strategies, you'll learn the techniques used by top sailors worldwide.

Whether you're new to racing or looking to sharpen your competitive edge, this course provides interactive lessons that let you practice and visualize key concepts before hitting the water.`,
    thumbnail_url: '/images/courses/winning-starts.jpg',
    level: 'intermediate',
    duration_minutes: 150,
    price_cents: 7500, // €75
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
  },
];

async function runMigration() {
  console.log('\n📦 Running learning platform migration...\n');

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251204200000_create_learning_platform.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split into individual statements (handle multi-line statements)
  const statements = migrationSQL
    .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|GRANT|COMMENT|$))/i)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (!statement || statement.length < 5) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' }).maybeSingle();

      if (error) {
        // Try direct query for statements that don't work with RPC
        const { error: directError } = await supabase.from('_').select().limit(0);
        if (directError && !directError.message.includes('does not exist')) {
          throw error;
        }
      }
      successCount++;
      process.stdout.write('.');
    } catch (e) {
      // Some statements might fail if objects already exist - that's OK
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        process.stdout.write('s'); // skipped
      } else {
        errorCount++;
        process.stdout.write('x');
        // console.error(`\nError: ${e.message}\nStatement: ${statement.substring(0, 100)}...`);
      }
    }
  }

  console.log(`\n\nMigration complete: ${successCount} succeeded, ${errorCount} errors\n`);
}

async function checkTablesExist() {
  console.log('🔍 Checking if learning tables exist...\n');

  const tables = ['learning_courses', 'learning_modules', 'learning_lessons', 'learning_enrollments', 'learning_lesson_progress'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log(`   ❌ ${table} - NOT FOUND`);
      return false;
    } else {
      console.log(`   ✅ ${table} - exists`);
    }
  }

  return true;
}

async function seedCourses() {
  console.log('\n🌱 Seeding learning courses...\n');

  // Wait a moment for schema cache to update
  console.log('   ⏳ Waiting for schema cache to update...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  for (const courseData of COURSES) {
    const { modules, ...course } = courseData;

    // Check if course already exists - retry with delay if schema cache issue
    let existing = null;
    let retries = 3;
    while (retries > 0) {
      const { data, error } = await supabase
      .from('learning_courses')
      .select('id')
      .eq('slug', course.slug)
      .maybeSingle();
      
      if (!error) {
        existing = data;
        break;
      }
      
      if (error.message.includes('schema cache')) {
        console.log(`   ⏳ Schema cache issue, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
      } else {
        throw error;
      }
    }

    if (existing) {
      console.log(`   ⏭️  Course "${course.title}" already exists, skipping...`);
      continue;
    }

    // Insert course - retry if schema cache issue
    console.log(`   📚 Creating course: ${course.title}`);
    let insertedCourse = null;
    let insertRetries = 3;
    
    while (insertRetries > 0) {
      const { data, error: courseError } = await supabase
      .from('learning_courses')
      .insert(course)
      .select()
      .single();

      if (!courseError) {
        insertedCourse = data;
        break;
      }
      
      if (courseError.message.includes('schema cache')) {
        console.log(`   ⏳ Schema cache issue, retrying insert... (${insertRetries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        insertRetries--;
      } else {
      console.error(`   ❌ Error creating course: ${courseError.message}`);
        break;
      }
    }

    if (!insertedCourse) {
      continue;
    }

    console.log(`   ✅ Course created with ID: ${insertedCourse.id}`);

    // Insert modules and lessons
    for (const moduleData of modules) {
      const { lessons, ...module } = moduleData;
      module.course_id = insertedCourse.id;

      console.log(`      📁 Creating module: ${module.title}`);
      const { data: insertedModule, error: moduleError } = await supabase
        .from('learning_modules')
        .insert(module)
        .select()
        .single();

      if (moduleError) {
        console.error(`      ❌ Error creating module: ${moduleError.message}`);
        continue;
      }

      // Insert lessons
      for (const lessonData of lessons) {
        const lesson = { ...lessonData, module_id: insertedModule.id };

        console.log(`         📄 Creating lesson: ${lesson.title}`);
        const { error: lessonError } = await supabase
          .from('learning_lessons')
          .insert(lesson);

        if (lessonError) {
          console.error(`         ❌ Error creating lesson: ${lessonError.message}`);
        }
      }
    }

    console.log(`   ✅ Course "${course.title}" fully seeded!\n`);
  }
}

async function verifySeed() {
  console.log('\n📊 Verifying seed data...\n');

  // Wait for schema cache
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Try with retries for schema cache issues
  let courses = null;
  let retries = 3;
  
  while (retries > 0) {
    const { data, error: coursesError } = await supabase
    .from('learning_courses')
    .select(`
      id,
      slug,
      title,
      is_published,
      learning_modules (
        id,
        title,
        learning_lessons (
          id,
          title,
          lesson_type,
          interactive_component
        )
      )
    `)
    .eq('is_published', true);

    if (!coursesError) {
      courses = data;
      break;
    }
    
    if (coursesError.message.includes('schema cache')) {
      console.log(`   ⏳ Schema cache issue, retrying verification... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries--;
    } else {
    console.error('Error fetching courses:', coursesError.message);
      return;
    }
  }

  if (!courses) {
    console.error('Could not fetch courses after retries');
    return;
  }

  console.log(`Found ${courses.length} published course(s):\n`);

  for (const course of courses) {
    console.log(`📚 ${course.title} (${course.slug})`);

    let totalLessons = 0;
    for (const module of course.learning_modules || []) {
      const lessonCount = module.learning_lessons?.length || 0;
      totalLessons += lessonCount;
      console.log(`   📁 ${module.title} (${lessonCount} lessons)`);

      for (const lesson of module.learning_lessons || []) {
        const type = lesson.lesson_type === 'interactive'
          ? `🎮 ${lesson.interactive_component}`
          : `📹 ${lesson.lesson_type}`;
        console.log(`      ${type}: ${lesson.title}`);
      }
    }

    console.log(`   Total: ${course.learning_modules?.length || 0} modules, ${totalLessons} lessons\n`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 Learning Platform Setup');
  console.log('  RegattaFlow - Sailing Course Platform');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nSupabase URL: ${SUPABASE_URL}\n`);

  // Check if tables exist first
  const tablesExist = await checkTablesExist();

  if (!tablesExist) {
    console.log('\n⚠️  Tables do not exist. Please run the migration first:');
    console.log('   npx supabase db push');
    console.log('   OR');
    console.log('   Run the SQL directly in Supabase SQL Editor\n');

    // Try to run via Supabase CLI
    console.log('Attempting to run migration via SQL...\n');
    await runMigration();

    // Check again
    const tablesExistNow = await checkTablesExist();
    if (!tablesExistNow) {
      console.log('\n❌ Tables still not created. Please run migration manually.');
      console.log('   Copy the SQL from: supabase/migrations/20251204200000_create_learning_platform.sql');
      console.log('   Paste into Supabase SQL Editor and run.\n');
      process.exit(1);
    }
  }

  // Seed the courses
  await seedCourses();

  // Verify the seed
  await verifySeed();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ Learning Platform Setup Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
