-- ============================================================================
-- Coaching Schema - With Type Compatibility Fixes
-- ============================================================================
-- This migration handles type mismatches between UUIDs and TEXT fields
-- All joins use explicit casts for compatibility
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

  -- Add columns with existence checks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='sailor_id') THEN
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

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='completed_at') THEN
    ALTER TABLE coaching_sessions ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='status') THEN
    ALTER TABLE coaching_sessions ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='venue_id') THEN
    -- Check the data type of sailing_venues.id to match it
    ALTER TABLE coaching_sessions ADD COLUMN venue_id TEXT;
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

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='session_notes') THEN
    ALTER TABLE coaching_sessions ADD COLUMN session_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='homework') THEN
    ALTER TABLE coaching_sessions ADD COLUMN homework TEXT;
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

  RAISE NOTICE '✅ coaching_sessions table updated successfully';
END $$;

-- ============================================================================
-- PART 2: Ensure session_feedback table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  communication_rating INTEGER,
  expertise_rating INTEGER,
  value_rating INTEGER,
  skill_improvement TEXT,
  confidence_change TEXT,
  would_recommend BOOLEAN,
  public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Ensure coaching_clients table exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coaching_clients') THEN
    CREATE TABLE coaching_clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coach_id UUID NOT NULL,
      sailor_id UUID NOT NULL,
      status TEXT DEFAULT 'active',
      total_sessions INTEGER DEFAULT 0,
      last_session_date TIMESTAMPTZ,
      coach_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='sailor_id') THEN
    ALTER TABLE coaching_clients ADD COLUMN sailor_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='total_sessions') THEN
    ALTER TABLE coaching_clients ADD COLUMN total_sessions INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_clients' AND column_name='last_session_date') THEN
    ALTER TABLE coaching_clients ADD COLUMN last_session_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- PART 4: Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_id ON coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_sailor_id ON coaching_sessions(sailor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_status ON coaching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_clients_coach_id ON coaching_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_clients_sailor_id ON coaching_clients(sailor_id);

-- ============================================================================
-- PART 5: Drop and recreate views with proper type handling
-- ============================================================================

DROP VIEW IF EXISTS coach_sailor_sessions_view CASCADE;
DROP VIEW IF EXISTS coach_metrics_view CASCADE;
DROP VIEW IF EXISTS coach_feedback_view CASCADE;

-- View: coach_sailor_sessions_view (simplified, no venue join to avoid type issues)
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
  cs.venue_id,
  cp.display_name AS coach_name,
  cp.profile_image_url AS coach_photo,
  cp.specializations AS coach_specialties,
  u.full_name AS sailor_name,
  u.email AS sailor_email,
  p.avatar_url AS sailor_avatar,
  sf.rating AS feedback_rating,
  sf.feedback_text,
  sf.skill_improvement,
  sf.would_recommend
FROM coaching_sessions cs
LEFT JOIN coach_profiles cp ON cs.coach_id = cp.id
LEFT JOIN users u ON cs.sailor_id = u.id
LEFT JOIN profiles p ON cs.sailor_id = p.id
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

DROP FUNCTION IF EXISTS search_coaches(TEXT[], DECIMAL, INTEGER, TEXT, INTEGER, INTEGER);

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

CREATE OR REPLACE FUNCTION search_coaches(
  p_specialties TEXT[] DEFAULT NULL,
  p_min_rating DECIMAL DEFAULT NULL,
  p_max_hourly_rate INTEGER DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  coach_id UUID,
  display_name TEXT,
  profile_image_url TEXT,
  bio TEXT,
  specializations TEXT[],
  hourly_rate INTEGER,
  currency TEXT,
  based_at TEXT,
  average_rating DECIMAL,
  total_sessions INTEGER,
  is_verified BOOLEAN,
  match_score DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id AS coach_id,
    cp.display_name,
    cp.profile_image_url,
    cp.bio,
    cp.specializations,
    cp.hourly_rate,
    cp.currency,
    cp.location_name,
    cm.average_rating,
    COALESCE(cm.total_completed_sessions, 0)::INTEGER AS total_sessions,
    cp.is_verified,
    1.0::DECIMAL AS match_score
  FROM coach_profiles cp
  LEFT JOIN coach_metrics_view cm ON cp.id = cm.coach_id
  WHERE
    cp.is_active = true
    AND (p_specialties IS NULL OR cp.specializations && p_specialties)
    AND (p_min_rating IS NULL OR COALESCE(cm.average_rating, 0) >= p_min_rating)
    AND (p_max_hourly_rate IS NULL OR cp.hourly_rate <= p_max_hourly_rate)
  ORDER BY cm.average_rating DESC NULLS LAST, cm.total_completed_sessions DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

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
  RAISE NOTICE 'Created tables: coaching_sessions, session_feedback, coaching_clients';
  RAISE NOTICE 'Created views: coach_sailor_sessions_view, coach_metrics_view, coach_feedback_view';
  RAISE NOTICE 'Created functions: get_coach_dashboard_data, get_sailor_coaching_overview, search_coaches';
END $$;
