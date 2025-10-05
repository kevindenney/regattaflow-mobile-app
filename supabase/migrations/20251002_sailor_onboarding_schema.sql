-- ============================================================================
-- SAILOR ONBOARDING SCHEMA
-- ============================================================================
-- Multi-location support, club/association memberships, and race course library
-- for autonomous onboarding flow powered by OnboardingAgent

-- ============================================================================
-- SAILOR LOCATIONS (Multi-location support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sailor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES sailing_venues(id) ON DELETE CASCADE,

  -- Location preferences
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata for seasonal/frequency tracking
  metadata JSONB DEFAULT '{}'::jsonb, -- {season: 'winter', frequency: 'monthly', notes: '...'}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sailor_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_sailor_locations_sailor ON sailor_locations(sailor_id);
CREATE INDEX IF NOT EXISTS idx_sailor_locations_location ON sailor_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_sailor_locations_primary ON sailor_locations(sailor_id, is_primary) WHERE is_primary = true;

-- ============================================================================
-- CLASS ASSOCIATIONS (International Dragon Association, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS class_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  class_id UUID REFERENCES boat_classes(id) ON DELETE CASCADE,

  -- Association details
  website TEXT,
  racing_rules_url TEXT, -- For scraping standings
  region TEXT, -- 'international', 'north_america', 'europe', 'asia_pacific', etc.

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_class_associations_class ON class_associations(class_id);
CREATE INDEX IF NOT EXISTS idx_class_associations_region ON class_associations(region);

-- ============================================================================
-- SAILOR CLUBS & ASSOCIATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS sailor_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Club or Association (one must be set)
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  association_id UUID REFERENCES class_associations(id) ON DELETE CASCADE,

  club_type TEXT CHECK (club_type IN ('yacht_club', 'class_association')) NOT NULL,

  -- Membership details
  membership_status TEXT CHECK (membership_status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  membership_number TEXT,
  joined_date DATE,

  -- Auto-import preferences
  auto_import_races BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one club or association is set
  CHECK (
    (club_id IS NOT NULL AND association_id IS NULL) OR
    (club_id IS NULL AND association_id IS NOT NULL)
  ),

  -- Unique constraint based on type
  UNIQUE(sailor_id, club_id),
  UNIQUE(sailor_id, association_id)
);

CREATE INDEX IF NOT EXISTS idx_sailor_clubs_sailor ON sailor_clubs(sailor_id);
CREATE INDEX IF NOT EXISTS idx_sailor_clubs_club ON sailor_clubs(club_id) WHERE club_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sailor_clubs_association ON sailor_clubs(association_id) WHERE association_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sailor_clubs_auto_import ON sailor_clubs(auto_import_races) WHERE auto_import_races = true;

-- ============================================================================
-- RACE COURSES (Pre-populated from club websites)
-- ============================================================================
CREATE TABLE IF NOT EXISTS race_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,

  -- Course details
  name TEXT NOT NULL, -- "Course A", "Olympic Triangle", "Windward-Leeward"
  description TEXT,
  course_type TEXT CHECK (course_type IN ('windward_leeward', 'olympic', 'trapezoid', 'coastal', 'custom')),

  -- GeoJSON course data
  marks JSONB NOT NULL, -- Array of marks with lat/lng: [{name: 'Mark 1', lat: 22.28, lng: 114.16}, ...]
  layout JSONB, -- Course layout diagram data

  -- Wind conditions this course is used for
  min_wind_direction INTEGER, -- 0-360 degrees
  max_wind_direction INTEGER, -- 0-360 degrees
  min_wind_speed DECIMAL(5,2), -- knots
  max_wind_speed DECIMAL(5,2), -- knots

  -- Metadata
  typical_length_nm DECIMAL(5,2), -- nautical miles
  estimated_duration_minutes INTEGER,
  last_used_date DATE,
  usage_count INTEGER DEFAULT 0, -- Track popularity

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, name)
);

CREATE INDEX IF NOT EXISTS idx_race_courses_club ON race_courses(club_id);
CREATE INDEX IF NOT EXISTS idx_race_courses_venue ON race_courses(venue_id);
CREATE INDEX IF NOT EXISTS idx_race_courses_type ON race_courses(course_type);
CREATE INDEX IF NOT EXISTS idx_race_courses_wind_direction ON race_courses(min_wind_direction, max_wind_direction);
CREATE INDEX IF NOT EXISTS idx_race_courses_wind_speed ON race_courses(min_wind_speed, max_wind_speed);

-- ============================================================================
-- ENHANCED ONBOARDING TRACKING
-- ============================================================================

-- Add onboarding fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT CHECK (onboarding_step IN (
    'user_type_selected',
    'locations_added',
    'boats_added',
    'fleets_joined',
    'clubs_added',
    'completed'
  )) DEFAULT 'user_type_selected',
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb; -- Store onboarding selections temporarily

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Sailor Locations
ALTER TABLE sailor_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own locations" ON sailor_locations;
CREATE POLICY "Users can manage their own locations"
  ON sailor_locations FOR ALL
  USING (auth.uid() = sailor_id);

-- Class Associations (Public read, admin write)
ALTER TABLE class_associations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view class associations" ON class_associations;
CREATE POLICY "Anyone can view class associations"
  ON class_associations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage class associations" ON class_associations;
CREATE POLICY "Admins can manage class associations"
  ON class_associations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Sailor Clubs
ALTER TABLE sailor_clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own club memberships" ON sailor_clubs;
CREATE POLICY "Users can manage their own club memberships"
  ON sailor_clubs FOR ALL
  USING (auth.uid() = sailor_id);

-- Race Courses (Public read for planning, club admins can write)
ALTER TABLE race_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view race courses" ON race_courses;
CREATE POLICY "Anyone can view race courses"
  ON race_courses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Club admins can manage race courses" ON race_courses;
CREATE POLICY "Club admins can manage race courses"
  ON race_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('club', 'admin')
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Sailor Locations triggers
DROP TRIGGER IF EXISTS update_sailor_locations_updated_at ON sailor_locations;
CREATE TRIGGER update_sailor_locations_updated_at
  BEFORE UPDATE ON sailor_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sailor Clubs triggers
DROP TRIGGER IF EXISTS update_sailor_clubs_updated_at ON sailor_clubs;
CREATE TRIGGER update_sailor_clubs_updated_at
  BEFORE UPDATE ON sailor_clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Class Associations triggers
DROP TRIGGER IF EXISTS update_class_associations_updated_at ON class_associations;
CREATE TRIGGER update_class_associations_updated_at
  BEFORE UPDATE ON class_associations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Race Courses triggers
DROP TRIGGER IF EXISTS update_race_courses_updated_at ON race_courses;
CREATE TRIGGER update_race_courses_updated_at
  BEFORE UPDATE ON race_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one primary location per sailor
CREATE OR REPLACE FUNCTION ensure_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary locations for this sailor
    UPDATE sailor_locations
    SET is_primary = false
    WHERE sailor_id = NEW.sailor_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS ensure_single_primary_location_trigger ON sailor_locations;
CREATE TRIGGER ensure_single_primary_location_trigger
  BEFORE INSERT OR UPDATE ON sailor_locations
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_location();

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

-- Insert popular class associations
INSERT INTO class_associations (name, short_name, class_id, website, region)
SELECT
  'International Dragon Association',
  'IDA',
  id,
  'https://intdragon.net',
  'international'
FROM boat_classes WHERE name = 'Dragon'
ON CONFLICT (name) DO NOTHING;

INSERT INTO class_associations (name, short_name, class_id, website, region)
SELECT
  'J/70 Class Association',
  'J/70 CA',
  id,
  'https://j70class.org',
  'international'
FROM boat_classes WHERE name = 'J/70'
ON CONFLICT (name) DO NOTHING;

INSERT INTO class_associations (name, short_name, class_id, website, region)
SELECT
  'Melges 24 Class Association',
  'M24 CA',
  id,
  'https://melges24.com',
  'international'
FROM boat_classes WHERE name = 'Melges 24'
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT ALL ON sailor_locations TO authenticated;
GRANT ALL ON class_associations TO authenticated;
GRANT ALL ON sailor_clubs TO authenticated;
GRANT ALL ON race_courses TO authenticated;

-- Comments for documentation
COMMENT ON TABLE sailor_locations IS 'Multi-location support for sailors racing in different venues (e.g., Hong Kong + Chicago)';
COMMENT ON TABLE class_associations IS 'International and regional boat class associations (e.g., International Dragon Association)';
COMMENT ON TABLE sailor_clubs IS 'Sailor memberships in yacht clubs and class associations with auto-import preferences';
COMMENT ON TABLE race_courses IS 'Pre-populated race courses from club websites for AI course prediction';
