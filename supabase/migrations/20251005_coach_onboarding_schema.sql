-- ============================================================================
-- COACH ONBOARDING SCHEMA
-- ============================================================================
-- Tables for coach marketplace onboarding flow
-- Supports coach profiles, availability, and service pricing

-- ============================================================================
-- COACH PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Information (from welcome screen)
  full_name TEXT NOT NULL,
  professional_title TEXT NOT NULL,
  experience_level TEXT NOT NULL, -- '1-2 years', '3-5 years', etc.
  organization TEXT,
  phone TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',

  -- Expertise (from expertise screen)
  specializations TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['match_racing', 'boat_handling', 'dragon', 'swan']

  -- Profile Status
  profile_completed BOOLEAN DEFAULT false,
  profile_published BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_published ON coach_profiles(profile_published) WHERE profile_published = true;

-- ============================================================================
-- COACH AVAILABILITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,

  -- Weekly Availability
  monday BOOLEAN DEFAULT false,
  tuesday BOOLEAN DEFAULT false,
  wednesday BOOLEAN DEFAULT false,
  thursday BOOLEAN DEFAULT false,
  friday BOOLEAN DEFAULT false,
  saturday BOOLEAN DEFAULT false,
  sunday BOOLEAN DEFAULT false,

  -- Time of Day Preferences
  morning BOOLEAN DEFAULT false,      -- 6am - 12pm
  afternoon BOOLEAN DEFAULT false,    -- 12pm - 6pm
  evening BOOLEAN DEFAULT false,      -- 6pm - 10pm

  -- Location Preferences
  location_preference TEXT DEFAULT 'in-person', -- 'in-person' or 'remote'
  remote_coaching BOOLEAN DEFAULT false,
  max_distance_km INTEGER DEFAULT 50,

  -- Group Sizes
  individual_sessions BOOLEAN DEFAULT false,
  small_group BOOLEAN DEFAULT false,  -- 2-4 people
  large_group BOOLEAN DEFAULT false,  -- 5+ people

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(coach_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_availability_coach_id ON coach_availability(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_remote ON coach_availability(remote_coaching) WHERE remote_coaching = true;

-- ============================================================================
-- COACH SERVICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,

  -- Pricing Model
  pricing_model TEXT NOT NULL DEFAULT 'hourly', -- 'hourly' or 'packages'
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Hourly Pricing
  hourly_rate DECIMAL(10,2),
  session_duration_minutes INTEGER DEFAULT 60,

  -- Package Pricing
  single_session_price DECIMAL(10,2),
  five_session_price DECIMAL(10,2),
  ten_session_price DECIMAL(10,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(coach_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_services_coach_id ON coach_services(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_services_pricing_model ON coach_services(pricing_model);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Coach Profiles RLS
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published coach profiles"
  ON coach_profiles FOR SELECT
  USING (profile_published = true);

CREATE POLICY "Coaches can view their own profile"
  ON coach_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can insert their own profile"
  ON coach_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update their own profile"
  ON coach_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coach Availability RLS
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published coach availability"
  ON coach_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_availability.coach_id
      AND coach_profiles.profile_published = true
    )
  );

CREATE POLICY "Coaches can view their own availability"
  ON coach_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_availability.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert their own availability"
  ON coach_availability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_availability.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update their own availability"
  ON coach_availability FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_availability.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_availability.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  );

-- Coach Services RLS
ALTER TABLE coach_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published coach services"
  ON coach_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_services.coach_id
      AND coach_profiles.profile_published = true
    )
  );

CREATE POLICY "Coaches can view their own services"
  ON coach_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_services.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert their own services"
  ON coach_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_services.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update their own services"
  ON coach_services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_services.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE coach_profiles.id = coach_services.coach_id
      AND coach_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get complete coach profile with availability and services
CREATE OR REPLACE FUNCTION get_coach_profile_complete(p_user_id UUID)
RETURNS TABLE (
  profile JSONB,
  availability JSONB,
  services JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(cp.*) as profile,
    to_jsonb(ca.*) as availability,
    to_jsonb(cs.*) as services
  FROM coach_profiles cp
  LEFT JOIN coach_availability ca ON ca.coach_id = cp.id
  LEFT JOIN coach_services cs ON cs.coach_id = cp.id
  WHERE cp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_coach_profile_complete(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE coach_profiles IS 'Coach profiles for the marketplace';
COMMENT ON TABLE coach_availability IS 'Coach weekly availability and location preferences';
COMMENT ON TABLE coach_services IS 'Coach pricing and service offerings';
COMMENT ON FUNCTION get_coach_profile_complete(UUID) IS 'Get complete coach profile with availability and services in one query';
