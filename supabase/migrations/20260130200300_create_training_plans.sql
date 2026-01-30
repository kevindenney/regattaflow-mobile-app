-- Migration: Create training_plans and training_activities tables for the Reflect tab
-- Supports structured training plans with activities, progress tracking

-- =============================================================================
-- TRAINING PLANS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan definition
  title TEXT NOT NULL,
  description TEXT,

  -- Target race (optional)
  target_race TEXT, -- e.g., "Spring Championship"
  target_date DATE,

  -- Status
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),

  -- Timing
  estimated_duration INTEGER, -- Total estimated minutes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =============================================================================
-- TRAINING ACTIVITIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,

  -- Activity definition
  type TEXT NOT NULL CHECK (type IN ('video', 'article', 'drill', 'workout', 'race_review', 'mental')),
  title TEXT NOT NULL,
  description TEXT,

  -- Duration
  duration INTEGER, -- Minutes

  -- Completion
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Resource link
  resource_url TEXT,

  -- Display
  icon TEXT DEFAULT 'play-circle',

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Training plans
CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON training_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_training_plans_active ON training_plans(user_id) WHERE status = 'in_progress';

-- Training activities
CREATE INDEX IF NOT EXISTS idx_training_activities_plan ON training_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_activities_order ON training_activities(plan_id, sort_order);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_activities ENABLE ROW LEVEL SECURITY;

-- Training plans: Users manage their own
CREATE POLICY "Users can view their own training plans" ON training_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training plans" ON training_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training plans" ON training_plans
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training plans" ON training_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Training activities: Access through plan ownership
CREATE POLICY "Users can view activities for their plans" ON training_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = training_activities.plan_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities for their plans" ON training_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = training_activities.plan_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities for their plans" ON training_activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = training_activities.plan_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities for their plans" ON training_activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = training_activities.plan_id
      AND tp.user_id = auth.uid()
    )
  );

-- =============================================================================
-- HELPER FUNCTION: Get plan progress stats
-- =============================================================================

CREATE OR REPLACE FUNCTION get_training_plan_stats(p_plan_id UUID)
RETURNS TABLE (
  total_activities INTEGER,
  completed_activities INTEGER,
  total_duration INTEGER,
  completed_duration INTEGER,
  completion_percentage NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::INTEGER AS total_activities,
    COUNT(*) FILTER (WHERE is_completed = true)::INTEGER AS completed_activities,
    COALESCE(SUM(duration), 0)::INTEGER AS total_duration,
    COALESCE(SUM(duration) FILTER (WHERE is_completed = true), 0)::INTEGER AS completed_duration,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE is_completed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
      ELSE 0
    END AS completion_percentage
  FROM training_activities
  WHERE plan_id = p_plan_id;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE training_plans IS 'Structured training plans with target races and progress tracking';
COMMENT ON TABLE training_activities IS 'Individual activities within a training plan';
COMMENT ON COLUMN training_plans.status IS 'Plan status: not_started, in_progress, or completed';
COMMENT ON COLUMN training_activities.type IS 'Activity type: video, article, drill, workout, race_review, or mental';
COMMENT ON FUNCTION get_training_plan_stats IS 'Returns completion statistics for a training plan';
