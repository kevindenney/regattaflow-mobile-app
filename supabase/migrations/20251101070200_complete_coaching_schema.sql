-- ============================================================================
-- Complete Coaching Schema - Safe Incremental Updates
-- ============================================================================
-- This migration safely adds all necessary columns and creates views/functions
-- It handles existing schemas gracefully without errors.
--
-- Created: 2025-11-01
-- ============================================================================

-- ============================================================================
-- PART 1: Safely add all missing columns to coaching_sessions
-- ============================================================================

DO $$
BEGIN
  -- Ensure table exists first
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coaching_sessions') THEN
    RAISE NOTICE 'Creating coaching_sessions table';
    CREATE TABLE coaching_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coach_id UUID NOT NULL,
      sailor_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  -- Add columns one by one, checking existence
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='sailor_id') THEN
    RAISE NOTICE 'Adding sailor_id column';
    ALTER TABLE coaching_sessions ADD COLUMN sailor_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='client_id') THEN
    ALTER TABLE coaching_sessions ADD COLUMN client_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='session_type') THEN
    ALTER TABLE coaching_sessions ADD COLUMN session_type TEXT DEFAULT 'on_water';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='duration_minutes') THEN
    ALTER TABLE coaching_sessions ADD COLUMN duration_minutes INTEGER DEFAULT 60;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='scheduled_at') THEN
    ALTER TABLE coaching_sessions ADD COLUMN scheduled_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='start_time') THEN
    ALTER TABLE coaching_sessions ADD COLUMN start_time TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='end_time') THEN
    ALTER TABLE coaching_sessions ADD COLUMN end_time TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='started_at') THEN
    ALTER TABLE coaching_sessions ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='completed_at') THEN
    ALTER TABLE coaching_sessions ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='status') THEN
    ALTER TABLE coaching_sessions ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='venue_id') THEN
    ALTER TABLE coaching_sessions ADD COLUMN venue_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='location_notes') THEN
    ALTER TABLE coaching_sessions ADD COLUMN location_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='focus_areas') THEN
    ALTER TABLE coaching_sessions ADD COLUMN focus_areas TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='goals') THEN
    ALTER TABLE coaching_sessions ADD COLUMN goals TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='pre_session_notes') THEN
    ALTER TABLE coaching_sessions ADD COLUMN pre_session_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='session_notes') THEN
    ALTER TABLE coaching_sessions ADD COLUMN session_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='homework') THEN
    ALTER TABLE coaching_sessions ADD COLUMN homework TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='video_urls') THEN
    ALTER TABLE coaching_sessions ADD COLUMN video_urls TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='document_ids') THEN
    ALTER TABLE coaching_sessions ADD COLUMN document_ids TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='fee_amount') THEN
    ALTER TABLE coaching_sessions ADD COLUMN fee_amount INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='currency') THEN
    ALTER TABLE coaching_sessions ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='paid') THEN
    ALTER TABLE coaching_sessions ADD COLUMN paid BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='payment_date') THEN
    ALTER TABLE coaching_sessions ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='stripe_payment_intent_id') THEN
    ALTER TABLE coaching_sessions ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;

  RAISE NOTICE 'coaching_sessions table updated successfully';
END $$;

-- ============================================================================
-- PART 2: Ensure session_feedback table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  skill_improvement TEXT,
  confidence_change TEXT,
  would_recommend BOOLEAN,
  public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Ensure coaching_clients table has all columns
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coaching_clients') THEN
    CREATE TABLE coaching_clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coach_id UUID NOT NULL,
      sailor_id UUID NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='sailor_id') THEN
    ALTER TABLE coaching_clients ADD COLUMN sailor_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='status') THEN
    ALTER TABLE coaching_clients ADD COLUMN status TEXT DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='goals') THEN
    ALTER TABLE coaching_clients ADD COLUMN goals TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='skill_level') THEN
    ALTER TABLE coaching_clients ADD COLUMN skill_level TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='total_sessions') THEN
    ALTER TABLE coaching_clients ADD COLUMN total_sessions INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='last_session_date') THEN
    ALTER TABLE coaching_clients ADD COLUMN last_session_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='coach_notes') THEN
    ALTER TABLE coaching_clients ADD COLUMN coach_notes TEXT;
  END IF;
END $$;

-- ============================================================================
-- PART 4: Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_id ON coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_sailor_id ON coaching_sessions(sailor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_status ON coaching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled_at ON coaching_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_clients_coach_id ON coaching_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_clients_sailor_id ON coaching_clients(sailor_id);

-- ============================================================================
-- PART 5: Drop and recreate views
-- ============================================================================

DROP VIEW IF EXISTS coach_sailor_sessions_view CASCADE;
DROP VIEW IF EXISTS coach_metrics_view CASCADE;
DROP VIEW IF EXISTS coach_feedback_view CASCADE;

-- View: coach_sailor_sessions_view
CREATE VIEW coach_sailor_sessions_view AS
SELECT
  cs.id AS session_id,
  cs.coach_id,
  cs.sailor_id,
  cs.session_type,
  cs.duration_minutes,
  cs.scheduled_at,
  cs.completed_at,
  cs.status,
  cs.location_notes,
  cs.focus_areas,
  cs.goals,
  cs.session_notes,
  cs.homework,
  cs.fee_amount,
  cs.currency,
  cs.paid,
  cs.created_at,
  cs.updated_at,
  cp.display_name AS coach_name,
  cp.profile_image_url AS coach_photo,
  cp.specializations AS coach_specialties,
  COALESCE(p.first_name || ' ' || p.last_name, u.full_name) AS sailor_name,
  COALESCE(p.email, u.email) AS sailor_email,
  p.avatar_url AS sailor_avatar,
  sv.name AS venue_name,
  COALESCE(sv.formatted_address, sv.region || ', ' || sv.country) AS venue_location,
  sf.rating AS feedback_rating,
  sf.feedback_text,
  sf.skill_improvement,
  sf.would_recommend
FROM coaching_sessions cs
LEFT JOIN coach_profiles cp ON cs.coach_id = cp.id
LEFT JOIN users u ON cs.sailor_id = u.id
LEFT JOIN profiles p ON cs.sailor_id = p.id
LEFT JOIN sailing_venues sv ON cs.venue_id::text = sv.id
LEFT JOIN session_feedback sf ON cs.id = sf.session_id;

-- View: coach_metrics_view
CREATE VIEW coach_metrics_view AS
SELECT
  cp.id AS coach_id,
  cp.user_id,
  cp.display_name,
  cp.profile_image_url,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'completed') AS total_completed_sessions,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.status IN ('scheduled', 'confirmed') AND cs.scheduled_at >= NOW()) AS upcoming_sessions,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'completed' AND cs.completed_at >= DATE_TRUNC('month', NOW())) AS sessions_this_month,
  COUNT(DISTINCT cs.sailor_id) AS total_clients,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.status = 'active') AS active_clients,
  ROUND(AVG(sf.rating)::numeric, 2) AS average_rating,
  COUNT(sf.id) AS total_reviews
FROM coach_profiles cp
LEFT JOIN coaching_sessions cs ON cp.id = cs.coach_id
LEFT JOIN coaching_clients cc ON cp.id = cc.coach_id
LEFT JOIN session_feedback sf ON cs.id = sf.session_id
GROUP BY cp.id, cp.user_id, cp.display_name, cp.profile_image_url;

-- View: coach_feedback_view
CREATE VIEW coach_feedback_view AS
SELECT
  sf.id AS feedback_id,
  sf.session_id,
  sf.rating,
  sf.feedback_text,
  sf.communication_rating,
  sf.expertise_rating,
  sf.value_rating,
  sf.skill_improvement,
  sf.confidence_change,
  sf.would_recommend,
  sf.created_at AS feedback_date,
  cs.session_type,
  cs.completed_at AS session_date,
  cs.duration_minutes,
  cs.coach_id,
  cp.display_name AS coach_name,
  cs.sailor_id,
  u.full_name AS sailor_name,
  u.email AS sailor_email
FROM session_feedback sf
JOIN coaching_sessions cs ON sf.session_id = cs.id
JOIN coach_profiles cp ON cs.coach_id = cp.id
LEFT JOIN users u ON cs.sailor_id = u.id
WHERE sf.public = true;

-- ============================================================================
-- PART 6: Create RPC Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_coach_dashboard_data(p_coach_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (SELECT row_to_json(cp) FROM coach_profiles cp WHERE cp.id = p_coach_id),
    'metrics', (SELECT row_to_json(cm) FROM coach_metrics_view cm WHERE cm.coach_id = p_coach_id),
    'upcoming_sessions', (
      SELECT COALESCE(json_agg(row_to_json(cs)), '[]'::json)
      FROM coach_sailor_sessions_view cs
      WHERE cs.coach_id = p_coach_id
        AND cs.status IN ('scheduled', 'confirmed')
        AND cs.scheduled_at >= NOW()
      ORDER BY cs.scheduled_at ASC
      LIMIT 10
    )
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_sailor_coaching_overview(p_sailor_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'upcoming_sessions', (
      SELECT COALESCE(json_agg(row_to_json(cs)), '[]'::json)
      FROM coach_sailor_sessions_view cs
      WHERE cs.sailor_id = p_sailor_id
        AND cs.status IN ('scheduled', 'confirmed', 'pending')
        AND cs.scheduled_at >= NOW()
      ORDER BY cs.scheduled_at ASC
      LIMIT 10
    ),
    'completed_sessions', (
      SELECT COALESCE(json_agg(row_to_json(cs)), '[]'::json)
      FROM coach_sailor_sessions_view cs
      WHERE cs.sailor_id = p_sailor_id
        AND cs.status = 'completed'
      ORDER BY cs.completed_at DESC
      LIMIT 10
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- search_coaches function defined in later migrations with finalized schema

-- ============================================================================
-- PART 7: Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON coaching_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON coaching_clients TO authenticated;

GRANT SELECT ON coach_sailor_sessions_view TO authenticated;
GRANT SELECT ON coach_metrics_view TO authenticated;
GRANT SELECT ON coach_feedback_view TO authenticated;

GRANT EXECUTE ON FUNCTION get_coach_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sailor_coaching_overview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_coaches(TEXT[], DECIMAL, INTEGER, TEXT, INTEGER, INTEGER) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Coaching schema migration completed successfully!';
END $$;
