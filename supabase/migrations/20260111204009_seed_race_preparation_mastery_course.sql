-- Seed Race Preparation Mastery Course
-- This course teaches pre-race preparation from forecast to start line

-- Insert the course
INSERT INTO learning_courses (
  id,
  slug,
  title,
  description,
  long_description,
  level,
  duration_minutes,
  is_published,
  is_featured,
  order_index,
  requires_subscription,
  min_subscription_tier,
  instructor_name,
  instructor_bio,
  learning_objectives
) VALUES (
  gen_random_uuid(),
  'race-preparation-mastery',
  'Race Preparation Mastery',
  'Complete pre-race preparation from forecast to start line. Master weather analysis, tactical planning, equipment setup, and race document interpretation.',
  'This comprehensive course covers everything you need to know to prepare thoroughly for race day. From analyzing weather forecasts and currents to understanding race documents and optimizing your equipment setup, you''ll learn the systematic approach used by top sailors to arrive at the start line fully prepared.',
  'intermediate',
  240,
  true,
  true,
  3,
  false,
  'free',
  'Kevin Denney',
  'NorthU Certified Instructor with 20+ years of racing experience across multiple classes',
  '["Weather and forecast analysis", "Current and tidal strategy", "Wind shift prediction", "Course strategy and layline calculations", "Fleet positioning tactics", "Equipment inspection and sail selection", "Safety gear requirements", "NOR and SI interpretation", "Course signal recognition"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Get the course ID for inserting modules
DO $$
DECLARE
  v_course_id UUID;
  v_module_1_id UUID;
  v_module_2_id UUID;
  v_module_3_id UUID;
  v_module_4_id UUID;
BEGIN
  -- Get the course ID
  SELECT id INTO v_course_id FROM learning_courses WHERE slug = 'race-preparation-mastery';

  -- Generate module IDs
  v_module_1_id := gen_random_uuid();
  v_module_2_id := gen_random_uuid();
  v_module_3_id := gen_random_uuid();
  v_module_4_id := gen_random_uuid();

  -- Module 1: Weather & Conditions
  INSERT INTO learning_modules (id, course_id, title, description, order_index, duration_minutes)
  VALUES (v_module_1_id, v_course_id, 'Weather & Conditions', 'Understanding weather forecasts, currents, and wind patterns', 1, 60)
  ON CONFLICT DO NOTHING;

  -- Module 1 Lessons
  INSERT INTO learning_lessons (module_id, title, description, lesson_type, interactive_component, order_index, duration_seconds, is_free_preview)
  VALUES
    (v_module_1_id, 'Forecast Analysis', 'Learn to interpret weather forecasts and identify optimal racing windows', 'interactive', 'WeatherAnalysisInteractive', 1, 900, true),
    (v_module_1_id, 'Reading Current & Tide', 'Understand tidal currents and how they affect your race strategy', 'interactive', 'CurrentReadingInteractive', 2, 900, false),
    (v_module_1_id, 'Predicting Wind Shifts', 'Identify geographic and thermal wind shifts before they happen', 'interactive', 'WindShiftPredictionInteractive', 3, 900, false)
  ON CONFLICT DO NOTHING;

  -- Module 2: Tactical Planning
  INSERT INTO learning_modules (id, course_id, title, description, order_index, duration_minutes)
  VALUES (v_module_2_id, v_course_id, 'Tactical Planning', 'Strategic planning for race day success', 2, 60)
  ON CONFLICT DO NOTHING;

  -- Module 2 Lessons
  INSERT INTO learning_lessons (module_id, title, description, lesson_type, interactive_component, order_index, duration_seconds, is_free_preview)
  VALUES
    (v_module_2_id, 'Layline Calculator', 'Calculate laylines accounting for wind, current, and boat performance', 'interactive', 'LaylineCalculatorInteractive', 1, 900, false),
    (v_module_2_id, 'Fleet Positioning', 'Visualize fleet dynamics and find clear air lanes', 'interactive', 'FleetPositioningInteractive', 2, 900, true),
    (v_module_2_id, 'Mark Rounding Tactics', 'Master inside/outside scenarios and approach strategies', 'interactive', 'MarkRoundingTacticsInteractive', 3, 900, false)
  ON CONFLICT DO NOTHING;

  -- Module 3: Equipment & Rigging
  INSERT INTO learning_modules (id, course_id, title, description, order_index, duration_minutes)
  VALUES (v_module_3_id, v_course_id, 'Equipment & Rigging', 'Prepare your boat and gear for optimal performance', 3, 60)
  ON CONFLICT DO NOTHING;

  -- Module 3 Lessons
  INSERT INTO learning_lessons (module_id, title, description, lesson_type, interactive_component, order_index, duration_seconds, is_free_preview)
  VALUES
    (v_module_3_id, 'Sail Selection', 'Match your sail inventory to the forecasted conditions', 'interactive', 'SailSelectionInteractive', 1, 900, false),
    (v_module_3_id, 'Safety Gear Check', 'Scenario-based safety equipment decisions', 'interactive', 'SafetyGearCheckInteractive', 2, 900, true),
    (v_module_3_id, 'Rig Tuning Basics', 'Set up your rig for the expected conditions', 'interactive', 'ShroudTensionSimulator', 3, 900, false)
  ON CONFLICT DO NOTHING;

  -- Module 4: Rules & Documents
  INSERT INTO learning_modules (id, course_id, title, description, order_index, duration_minutes)
  VALUES (v_module_4_id, v_course_id, 'Rules & Documents', 'Master race documents and regulations', 4, 60)
  ON CONFLICT DO NOTHING;

  -- Module 4 Lessons
  INSERT INTO learning_lessons (module_id, title, description, lesson_type, interactive_component, order_index, duration_seconds, is_free_preview)
  VALUES
    (v_module_4_id, 'NOR Essentials', 'Master the critical elements of the Notice of Race', 'interactive', 'NORQuizInteractive', 1, 900, false),
    (v_module_4_id, 'SI Interpretation', 'Parse Sailing Instructions for race-critical information', 'interactive', 'SIInterpreterInteractive', 2, 900, false),
    (v_module_4_id, 'Course Signals', 'Recognize and respond to course signals and flags', 'interactive', 'CourseSignalsInteractive', 3, 900, true)
  ON CONFLICT DO NOTHING;

END $$;
