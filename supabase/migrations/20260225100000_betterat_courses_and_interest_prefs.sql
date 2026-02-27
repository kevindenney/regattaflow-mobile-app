-- Migration: Add preferred_interest_id to user_preferences and create
-- betterat_courses, betterat_lessons, and betterat_lesson_progress tables.
-- These tables power the BetterAt multi-interest learning platform.

-- =============================================================================
-- 1. Add preferred_interest_id to user_preferences
-- =============================================================================

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_interest_id uuid REFERENCES interests(id);

COMMENT ON COLUMN public.user_preferences.preferred_interest_id
  IS 'The interest (e.g. sailing, medicine) the user has selected as their primary focus';

-- =============================================================================
-- 2. Create betterat_courses
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.betterat_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id uuid NOT NULL REFERENCES interests(id),
  title text NOT NULL,
  description text,
  level text NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  topic text,
  sort_order integer NOT NULL DEFAULT 0,
  lesson_count integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.betterat_courses
  IS 'Courses scoped to an interest, containing ordered lessons with interactive content';

-- =============================================================================
-- 3. Create betterat_lessons
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.betterat_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES betterat_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  lesson_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  interactive_type text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.betterat_lessons
  IS 'Individual lessons within a course. lesson_data holds step arrays for interactive components';
COMMENT ON COLUMN public.betterat_lessons.lesson_data
  IS 'JSON step arrays consumed by interactive components (body-assessment, auscultation-simulator, etc.)';
COMMENT ON COLUMN public.betterat_lessons.interactive_type
  IS 'Identifier for the interactive component to render (e.g. body-assessment, auscultation-simulator)';

-- =============================================================================
-- 4. Create betterat_lesson_progress
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.betterat_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES betterat_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  score integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

COMMENT ON TABLE public.betterat_lesson_progress
  IS 'Tracks per-user completion status and score for each lesson';

-- =============================================================================
-- 5. Enable RLS and create policies
-- =============================================================================

-- ---- betterat_courses -------------------------------------------------------
ALTER TABLE public.betterat_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are publicly readable"
  ON public.betterat_courses
  FOR SELECT
  USING (published = true);

-- ---- betterat_lessons -------------------------------------------------------
ALTER TABLE public.betterat_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published lessons are publicly readable"
  ON public.betterat_lessons
  FOR SELECT
  USING (published = true);

-- ---- betterat_lesson_progress -----------------------------------------------
ALTER TABLE public.betterat_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson progress"
  ON public.betterat_lesson_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress"
  ON public.betterat_lesson_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
  ON public.betterat_lesson_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 6. Create indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_betterat_courses_interest_id
  ON public.betterat_courses (interest_id);

CREATE INDEX IF NOT EXISTS idx_betterat_lessons_course_id
  ON public.betterat_lessons (course_id);

CREATE INDEX IF NOT EXISTS idx_betterat_lesson_progress_user_id
  ON public.betterat_lesson_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_betterat_lesson_progress_lesson_id
  ON public.betterat_lesson_progress (lesson_id);

-- =============================================================================
-- 7. Updated-at triggers (reuses existing update_updated_at_column function)
-- =============================================================================

CREATE TRIGGER update_betterat_courses_updated_at
  BEFORE UPDATE ON public.betterat_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betterat_lessons_updated_at
  BEFORE UPDATE ON public.betterat_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betterat_lesson_progress_updated_at
  BEFORE UPDATE ON public.betterat_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
