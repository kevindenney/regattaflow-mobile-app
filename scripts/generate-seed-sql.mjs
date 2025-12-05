#!/usr/bin/env node
/**
 * Generate SQL INSERT statements for learning platform seed data
 * 
 * Outputs SQL that can be run directly in Supabase SQL Editor
 * 
 * Usage: node scripts/generate-seed-sql.mjs > seed-learning-courses.sql
 */

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

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function generateSQL() {
  const sql = [];
  
  sql.push('-- Learning Platform Seed Data');
  sql.push('-- Generated: ' + new Date().toISOString());
  sql.push('-- Run this in Supabase SQL Editor');
  sql.push('');
  sql.push('-- Check if course already exists');
  sql.push(`DO $$`);
  sql.push(`DECLARE`);
  sql.push(`  course_id UUID;`);
  sql.push(`BEGIN`);
  sql.push(`  -- Check if course exists`);
  sql.push(`  SELECT id INTO course_id FROM learning_courses WHERE slug = ${escapeSQL(COURSE_DATA.slug)};`);
  sql.push(`  `);
  sql.push(`  IF course_id IS NULL THEN`);
  sql.push(`    -- Insert course`);
  sql.push(`    INSERT INTO learning_courses (`);
  sql.push(`      slug, title, description, long_description, thumbnail_url,`);
  sql.push(`      level, duration_minutes, price_cents, is_published, is_featured,`);
  sql.push(`      order_index, requires_subscription, min_subscription_tier,`);
  sql.push(`      instructor_name, instructor_bio, learning_objectives`);
  sql.push(`    ) VALUES (`);
  sql.push(`      ${escapeSQL(COURSE_DATA.slug)},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.title)},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.description)},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.long_description)},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.thumbnail_url)},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.level)},`);
  sql.push(`      ${COURSE_DATA.duration_minutes},`);
  sql.push(`      ${COURSE_DATA.price_cents},`);
  sql.push(`      ${COURSE_DATA.is_published},`);
  sql.push(`      ${COURSE_DATA.is_featured},`);
  sql.push(`      ${COURSE_DATA.order_index},`);
  sql.push(`      ${COURSE_DATA.requires_subscription},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.min_subscription_tier)},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.instructor_name)},`);
  sql.push(`      ${escapeSQL(COURSE_DATA.instructor_bio)},`);
  sql.push(`      ${escapeSQL(JSON.stringify(COURSE_DATA.learning_objectives))}::jsonb`);
  sql.push(`    ) RETURNING id INTO course_id;`);
  sql.push(`    `);
  sql.push(`    RAISE NOTICE 'Course created with ID: %', course_id;`);
    sql.push(`    `);
    
    // Insert modules and lessons
    COURSE_DATA.modules.forEach((moduleData, moduleIdx) => {
      const { lessons, ...module } = moduleData;
      
      sql.push(`    -- Module ${moduleIdx + 1}: ${module.title}`);
      sql.push(`    DO $$`);
      sql.push(`    DECLARE`);
      sql.push(`      module_id UUID;`);
      sql.push(`    BEGIN`);
      sql.push(`      INSERT INTO learning_modules (`);
      sql.push(`        course_id, title, description, order_index, duration_minutes`);
      sql.push(`      ) VALUES (`);
      sql.push(`        course_id,`);
      sql.push(`        ${escapeSQL(module.title)},`);
      sql.push(`        ${escapeSQL(module.description)},`);
      sql.push(`        ${module.order_index},`);
      sql.push(`        ${module.duration_minutes || 0}`);
      sql.push(`      ) RETURNING id INTO module_id;`);
      sql.push(`      `);
      sql.push(`      RAISE NOTICE 'Module created: %', module_id;`);
      sql.push(`      `);
      
      lessons.forEach((lesson, lessonIdx) => {
        sql.push(`      -- Lesson ${lessonIdx + 1}: ${lesson.title}`);
        sql.push(`      INSERT INTO learning_lessons (`);
        sql.push(`        module_id, title, description, lesson_type,`);
        sql.push(`        interactive_component, order_index, is_free_preview, duration_seconds`);
        sql.push(`      ) VALUES (`);
        sql.push(`        module_id,`);
        sql.push(`        ${escapeSQL(lesson.title)},`);
        sql.push(`        ${escapeSQL(lesson.description)},`);
        sql.push(`        ${escapeSQL(lesson.lesson_type)},`);
        sql.push(`        ${escapeSQL(lesson.interactive_component)},`);
        sql.push(`        ${lesson.order_index},`);
        sql.push(`        ${lesson.is_free_preview},`);
        sql.push(`        ${lesson.duration_seconds}`);
        sql.push(`      );`);
        sql.push(`      `);
      });
      
      sql.push(`    END $$;`);
      sql.push(`    `);
    });
    
    sql.push(`  ELSE`);
    sql.push(`    RAISE NOTICE 'Course already exists, skipping...';`);
    sql.push(`  END IF;`);
    sql.push(`END $$;`);
    sql.push('');
    sql.push('-- Verify the seed');
    sql.push('SELECT ');
    sql.push('  c.title as course_title,');
    sql.push('  COUNT(DISTINCT m.id) as module_count,');
    sql.push('  COUNT(DISTINCT l.id) as lesson_count');
    sql.push('FROM learning_courses c');
    sql.push('LEFT JOIN learning_modules m ON m.course_id = c.id');
    sql.push('LEFT JOIN learning_lessons l ON l.module_id = m.id');
    sql.push(`WHERE c.slug = ${escapeSQL(COURSE_DATA.slug)}`);
    sql.push('GROUP BY c.id, c.title;');
    
    return sql.join('\n');
}

console.log(generateSQL());

