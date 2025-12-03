-- ============================================================================
-- Add Foreign Keys to coaching_clients and Create Mock Data for Coach Anderson
-- ============================================================================

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add foreign key for coach_id pointing to users table
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coaching_clients_coach_id_fkey'
  ) THEN
    ALTER TABLE coaching_clients
    ADD CONSTRAINT coaching_clients_coach_id_fkey
    FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for sailor_id pointing to users table
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coaching_clients_sailor_id_fkey'
  ) THEN
    ALTER TABLE coaching_clients
    ADD CONSTRAINT coaching_clients_sailor_id_fkey
    FOREIGN KEY (sailor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Create Mock Coaching Clients for Coach Anderson
-- ============================================================================

-- Get Coach Anderson's user_id
DO $$
DECLARE
  coach_anderson_id UUID;
  sarah_chen_id UUID;
  mike_thompson_id UUID;
  emma_wilson_id UUID;
BEGIN
  -- Get user IDs (these should exist from previous migrations)
  SELECT id INTO coach_anderson_id FROM auth.users WHERE email = 'coach.anderson@sailing.com';
  SELECT id INTO sarah_chen_id FROM auth.users WHERE email = 'sarah.chen@sailing.com';
  SELECT id INTO mike_thompson_id FROM auth.users WHERE email = 'mike.thompson@racing.com';
  SELECT id INTO emma_wilson_id FROM auth.users WHERE email = 'emma.wilson@yacht.club';

  -- Only proceed if coach exists
  IF coach_anderson_id IS NOT NULL THEN
    -- Insert Sarah Chen as active client
    IF sarah_chen_id IS NOT NULL THEN
      INSERT INTO coaching_clients (
        coach_id,
        sailor_id,
        status,
        total_sessions,
        last_session_date,
        coach_notes,
        created_at,
        updated_at
      ) VALUES (
        coach_anderson_id,
        sarah_chen_id,
        'active',
        12,
        NOW() - INTERVAL '3 days',
        'Sarah is making excellent progress on starts. Focus on boat handling in heavy air next session.',
        NOW() - INTERVAL '6 months',
        NOW() - INTERVAL '3 days'
      )
      ON CONFLICT (coach_id, sailor_id) DO UPDATE
      SET
        status = EXCLUDED.status,
        total_sessions = EXCLUDED.total_sessions,
        last_session_date = EXCLUDED.last_session_date,
        coach_notes = EXCLUDED.coach_notes,
        updated_at = NOW();
    END IF;

    -- Insert Mike Thompson as active client
    IF mike_thompson_id IS NOT NULL THEN
      INSERT INTO coaching_clients (
        coach_id,
        sailor_id,
        status,
        total_sessions,
        last_session_date,
        coach_notes,
        created_at,
        updated_at
      ) VALUES (
        coach_anderson_id,
        mike_thompson_id,
        'active',
        8,
        NOW() - INTERVAL '1 week',
        'Working on tactical decision-making and mark roundings. Good improvement in last 3 sessions.',
        NOW() - INTERVAL '4 months',
        NOW() - INTERVAL '1 week'
      )
      ON CONFLICT (coach_id, sailor_id) DO UPDATE
      SET
        status = EXCLUDED.status,
        total_sessions = EXCLUDED.total_sessions,
        last_session_date = EXCLUDED.last_session_date,
        coach_notes = EXCLUDED.coach_notes,
        updated_at = NOW();
    END IF;

    -- Insert Emma Wilson as active client
    IF emma_wilson_id IS NOT NULL THEN
      INSERT INTO coaching_clients (
        coach_id,
        sailor_id,
        status,
        total_sessions,
        last_session_date,
        coach_notes,
        created_at,
        updated_at
      ) VALUES (
        coach_anderson_id,
        emma_wilson_id,
        'active',
        15,
        NOW() - INTERVAL '2 days',
        'Emma has shown remarkable improvement in speed optimization. Ready for regional championships.',
        NOW() - INTERVAL '8 months',
        NOW() - INTERVAL '2 days'
      )
      ON CONFLICT (coach_id, sailor_id) DO UPDATE
      SET
        status = EXCLUDED.status,
        total_sessions = EXCLUDED.total_sessions,
        last_session_date = EXCLUDED.last_session_date,
        coach_notes = EXCLUDED.coach_notes,
        updated_at = NOW();
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Create some coaching sessions for these clients
-- ============================================================================

DO $$
DECLARE
  coach_anderson_id UUID;
  sarah_chen_id UUID;
  mike_thompson_id UUID;
  emma_wilson_id UUID;
BEGIN
  SELECT id INTO coach_anderson_id FROM auth.users WHERE email = 'coach.anderson@sailing.com';
  SELECT id INTO sarah_chen_id FROM auth.users WHERE email = 'sarah.chen@sailing.com';
  SELECT id INTO mike_thompson_id FROM auth.users WHERE email = 'mike.thompson@racing.com';
  SELECT id INTO emma_wilson_id FROM auth.users WHERE email = 'emma.wilson@yacht.club';

  IF coach_anderson_id IS NOT NULL THEN
    -- Upcoming session with Sarah
    IF sarah_chen_id IS NOT NULL THEN
      INSERT INTO coaching_sessions (
        coach_id,
        sailor_id,
        scheduled_at,
        duration_minutes,
        session_type,
        focus_areas,
        status,
        location,
        created_at
      ) VALUES (
        coach_anderson_id,
        sarah_chen_id,
        NOW() + INTERVAL '2 days',
        90,
        'on_water',
        'Heavy air boat handling, starts in current',
        'scheduled',
        'Victoria Harbour',
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Recent completed session with Mike
    IF mike_thompson_id IS NOT NULL THEN
      INSERT INTO coaching_sessions (
        coach_id,
        sailor_id,
        scheduled_at,
        duration_minutes,
        session_type,
        focus_areas,
        status,
        location,
        session_notes,
        created_at
      ) VALUES (
        coach_anderson_id,
        mike_thompson_id,
        NOW() - INTERVAL '1 week',
        120,
        'on_water',
        'Mark roundings, tactical positioning',
        'completed',
        'San Francisco Bay',
        'Excellent session. Mike showed 30% improvement in mark rounding efficiency.',
        NOW() - INTERVAL '1 week'
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Recent completed session with Emma
    IF emma_wilson_id IS NOT NULL THEN
      INSERT INTO coaching_sessions (
        coach_id,
        sailor_id,
        scheduled_at,
        duration_minutes,
        session_type,
        focus_areas,
        status,
        location,
        session_notes,
        created_at
      ) VALUES (
        coach_anderson_id,
        emma_wilson_id,
        NOW() - INTERVAL '2 days',
        60,
        'video_review',
        'Speed optimization, trim techniques',
        'completed',
        'Remote',
        'Reviewed race footage from last regatta. Identified 3 key areas for improvement.',
        NOW() - INTERVAL '2 days'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
