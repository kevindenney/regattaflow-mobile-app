-- Learning Platform Schema Migration
-- Created: 2024-12-04
-- Purpose: Add learning courses, modules, lessons, enrollments, and progress tracking

-- ============================================
-- LEARNING COURSES (products)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  duration_minutes INTEGER DEFAULT 0,
  price_cents INTEGER, -- NULL = free, or included in subscription
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  -- Access control
  requires_subscription BOOLEAN DEFAULT false, -- true = sailor_pro+ only
  min_subscription_tier TEXT DEFAULT 'free',
  -- Metadata
  instructor_name TEXT,
  instructor_bio TEXT,
  learning_objectives JSONB DEFAULT '[]'::jsonb, -- Array of strings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEARNING MODULES (chapters/sections)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEARNING LESSONS (individual content items)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  -- Content type
  lesson_type TEXT CHECK (lesson_type IN ('video', 'interactive', 'text', 'quiz')) DEFAULT 'video',
  -- For video lessons
  video_url TEXT,
  video_thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  -- For interactive lessons
  interactive_component TEXT, -- Component name, e.g., 'StartingSequenceInteractive'
  interactive_config JSONB DEFAULT '{}'::jsonb, -- Optional config for the component
  -- For text lessons
  content_markdown TEXT,
  -- Ordering & access
  order_index INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEARNING ENROLLMENTS (user course access)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  -- Payment info
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  amount_paid_cents INTEGER,
  -- Access type
  access_type TEXT CHECK (access_type IN ('purchase', 'subscription', 'gift', 'promo')) DEFAULT 'purchase',
  -- Progress tracking
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  -- Certificate
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,
  -- Unique constraint - one enrollment per user per course
  UNIQUE(user_id, course_id)
);

-- ============================================
-- LEARNING LESSON PROGRESS (granular tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  -- Progress state
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  -- For video lessons
  watch_time_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  -- For interactive lessons
  interactions_count INTEGER DEFAULT 0,
  interaction_data JSONB DEFAULT '{}'::jsonb, -- Store user interactions
  -- For quiz lessons
  quiz_score INTEGER,
  quiz_attempts INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint
  UNIQUE(user_id, lesson_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_learning_courses_published ON learning_courses(is_published, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_courses_slug ON learning_courses(slug);
CREATE INDEX IF NOT EXISTS idx_learning_modules_course ON learning_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_lessons_module ON learning_lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_user ON learning_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_course ON learning_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_user ON learning_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_lesson ON learning_lesson_progress(lesson_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_learning_courses_updated_at ON learning_courses;
CREATE TRIGGER trigger_learning_courses_updated_at
  BEFORE UPDATE ON learning_courses
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS trigger_learning_modules_updated_at ON learning_modules;
CREATE TRIGGER trigger_learning_modules_updated_at
  BEFORE UPDATE ON learning_modules
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS trigger_learning_lessons_updated_at ON learning_lessons;
CREATE TRIGGER trigger_learning_lessons_updated_at
  BEFORE UPDATE ON learning_lessons
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS trigger_learning_lesson_progress_updated_at ON learning_lesson_progress;
CREATE TRIGGER trigger_learning_lesson_progress_updated_at
  BEFORE UPDATE ON learning_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- COURSES: Public read for published courses
ALTER TABLE learning_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON learning_courses;
CREATE POLICY "Published courses are viewable by everyone"
  ON learning_courses FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage courses" ON learning_courses;
CREATE POLICY "Admins can manage courses"
  ON learning_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- MODULES: Viewable if course is published
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Modules viewable if course is published" ON learning_modules;
CREATE POLICY "Modules viewable if course is published"
  ON learning_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM learning_courses
      WHERE learning_courses.id = learning_modules.course_id
      AND learning_courses.is_published = true
    )
  );

-- LESSONS: Viewable if course is published
ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lessons viewable if course is published" ON learning_lessons;
CREATE POLICY "Lessons viewable if course is published"
  ON learning_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM learning_modules m
      JOIN learning_courses c ON c.id = m.course_id
      WHERE m.id = learning_lessons.module_id
      AND c.is_published = true
    )
  );

-- ENROLLMENTS: Users can see and create their own
ALTER TABLE learning_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments" ON learning_enrollments;
CREATE POLICY "Users can view own enrollments"
  ON learning_enrollments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own enrollments" ON learning_enrollments;
CREATE POLICY "Users can insert own enrollments"
  ON learning_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollments" ON learning_enrollments;
CREATE POLICY "Users can update own enrollments"
  ON learning_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

-- PROGRESS: Users can manage their own progress
ALTER TABLE learning_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON learning_lesson_progress;
CREATE POLICY "Users can view own progress"
  ON learning_lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON learning_lesson_progress;
CREATE POLICY "Users can insert own progress"
  ON learning_lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON learning_lesson_progress;
CREATE POLICY "Users can update own progress"
  ON learning_lesson_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate course progress for a user
CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  -- Count total lessons in course
  SELECT COUNT(*) INTO total_lessons
  FROM learning_lessons l
  JOIN learning_modules m ON m.id = l.module_id
  WHERE m.course_id = p_course_id;

  IF total_lessons = 0 THEN
    RETURN 0;
  END IF;

  -- Count completed lessons
  SELECT COUNT(*) INTO completed_lessons
  FROM learning_lesson_progress lp
  JOIN learning_lessons l ON l.id = lp.lesson_id
  JOIN learning_modules m ON m.id = l.module_id
  WHERE lp.user_id = p_user_id
    AND m.course_id = p_course_id
    AND lp.is_completed = true;

  RETURN ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a course
CREATE OR REPLACE FUNCTION can_access_course(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  course_requires_sub BOOLEAN;
  course_min_tier TEXT;
  has_enrollment BOOLEAN;
BEGIN
  -- Get course requirements
  SELECT requires_subscription, min_subscription_tier
  INTO course_requires_sub, course_min_tier
  FROM learning_courses
  WHERE id = p_course_id;

  -- If course doesn't require subscription, check for enrollment or free access
  IF NOT course_requires_sub THEN
    -- Check if user is enrolled
    SELECT EXISTS(
      SELECT 1 FROM learning_enrollments
      WHERE user_id = p_user_id AND course_id = p_course_id
    ) INTO has_enrollment;

    IF has_enrollment THEN
      RETURN true;
    END IF;

    -- Check if course is free
    IF course_min_tier = 'free' THEN
      RETURN true;
    END IF;
  END IF;

  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM users
  WHERE id = p_user_id;

  -- Check subscription tier hierarchy
  IF user_tier IN ('sailor_pro', 'championship', 'professional') THEN
    RETURN true;
  END IF;

  -- Check for individual enrollment
  SELECT EXISTS(
    SELECT 1 FROM learning_enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO has_enrollment;

  RETURN has_enrollment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================
GRANT SELECT ON learning_courses TO authenticated;
GRANT SELECT ON learning_modules TO authenticated;
GRANT SELECT ON learning_lessons TO authenticated;
GRANT ALL ON learning_enrollments TO authenticated;
GRANT ALL ON learning_lesson_progress TO authenticated;

-- For anon users (unauthenticated) - can view published courses
GRANT SELECT ON learning_courses TO anon;
GRANT SELECT ON learning_modules TO anon;
GRANT SELECT ON learning_lessons TO anon;

COMMENT ON TABLE learning_courses IS 'Learning courses/products available for purchase or subscription access';
COMMENT ON TABLE learning_modules IS 'Modules/chapters within a learning course';
COMMENT ON TABLE learning_lessons IS 'Individual lessons within a module (video, interactive, text, quiz)';
COMMENT ON TABLE learning_enrollments IS 'User enrollments/purchases of courses';
COMMENT ON TABLE learning_lesson_progress IS 'Granular progress tracking for each lesson';
