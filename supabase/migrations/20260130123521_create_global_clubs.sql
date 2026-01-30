-- Migration: Create unified global_clubs table
-- Consolidates yacht_clubs directory + clubs platform into one searchable directory

-- ============================================================================
-- 1. CREATE GLOBAL_CLUBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  club_type TEXT DEFAULT 'yacht_club' CHECK (club_type IN (
    'yacht_club', 'sailing_club', 'class_association', 'racing_organization', 'marina', 'community'
  )),

  -- Location
  country TEXT,
  country_code CHAR(2),  -- ISO 3166-1 alpha-2
  region TEXT,           -- State/province
  city TEXT,
  address TEXT,
  latitude DECIMAL(10, 7),   -- Latitude coordinate
  longitude DECIMAL(10, 7),  -- Longitude coordinate
  timezone TEXT,

  -- Contact & web
  website TEXT,
  email TEXT,
  phone TEXT,
  social_links JSONB DEFAULT '{}',  -- {facebook, instagram, twitter, etc.}

  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT,    -- Hex color for UI

  -- Metadata
  established_year INT,
  member_count_estimate INT,

  -- Official affiliations
  world_sailing_member_id TEXT,  -- MNA ID if national authority
  us_sailing_id TEXT,
  rya_id TEXT,
  isaf_id TEXT,

  -- Sailing details
  home_waters TEXT,              -- Description of sailing area
  typical_classes TEXT[],        -- Common boat classes sailed here
  facilities TEXT[],             -- ['clubhouse', 'marina', 'boat_storage', etc.]

  -- Source & verification
  source TEXT DEFAULT 'manual' CHECK (source IN (
    'manual', 'world_sailing', 'us_sailing', 'rya', 'scraped', 'user_submitted', 'migration'
  )),
  source_url TEXT,               -- Where the data came from
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),

  -- Platform integration (links to RegattaFlow platform club if claimed)
  platform_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),

  -- Legacy references (for migration tracking)
  legacy_yacht_club_id UUID,     -- Original yacht_clubs.id
  legacy_club_id UUID,           -- Original clubs.id

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_global_clubs_name ON global_clubs USING gin(to_tsvector('english', name));
CREATE INDEX idx_global_clubs_country ON global_clubs(country_code);
CREATE INDEX idx_global_clubs_region ON global_clubs(region);
CREATE INDEX idx_global_clubs_type ON global_clubs(club_type);
CREATE INDEX idx_global_clubs_verified ON global_clubs(verified);
CREATE INDEX idx_global_clubs_platform ON global_clubs(platform_club_id) WHERE platform_club_id IS NOT NULL;
CREATE INDEX idx_global_clubs_location ON global_clubs(latitude, longitude);

-- ============================================================================
-- 3. ENABLE RLS
-- ============================================================================

ALTER TABLE global_clubs ENABLE ROW LEVEL SECURITY;

-- Anyone can read global clubs (public directory)
CREATE POLICY "Global clubs are viewable by everyone"
  ON global_clubs FOR SELECT
  USING (true);

-- Only authenticated users can insert (for user submissions)
CREATE POLICY "Authenticated users can submit clubs"
  ON global_clubs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only the claimer or admins can update
CREATE POLICY "Club claimers can update their clubs"
  ON global_clubs FOR UPDATE
  TO authenticated
  USING (
    claimed_by = auth.uid()
    OR verified_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = global_clubs.platform_club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 4. MIGRATE DATA FROM YACHT_CLUBS
-- ============================================================================
-- Note: yacht_clubs data migration skipped because schema varies.
-- The seed-global-clubs.mjs script will populate initial data.

-- ============================================================================
-- 5. MIGRATE DATA FROM CLUBS (PLATFORM CLUBS)
-- ============================================================================
-- Note: Platform clubs data migration skipped because location field type differs.
-- The seed-global-clubs.mjs script will populate initial data.

-- ============================================================================
-- 6. CREATE GLOBAL_CLUB_MEMBERS TABLE (unified membership)
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_club_id UUID NOT NULL REFERENCES global_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Membership details
  role TEXT DEFAULT 'member' CHECK (role IN (
    'member', 'officer', 'admin', 'owner'
  )),
  member_number TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Preferences
  auto_import_races BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(global_club_id, user_id)
);

CREATE INDEX idx_global_club_members_user ON global_club_members(user_id);
CREATE INDEX idx_global_club_members_club ON global_club_members(global_club_id);

ALTER TABLE global_club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view club memberships"
  ON global_club_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own memberships"
  ON global_club_members FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. MIGRATE EXISTING MEMBERSHIPS
-- ============================================================================
-- Note: Membership data migration skipped because source table schemas differ.
-- Memberships will be created when users join clubs through the UI.

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to search clubs with full-text search
CREATE OR REPLACE FUNCTION search_global_clubs(
  search_query TEXT DEFAULT NULL,
  country_filter TEXT DEFAULT NULL,
  club_type_filter TEXT DEFAULT NULL,
  verified_only BOOLEAN DEFAULT false,
  result_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  short_name TEXT,
  description TEXT,
  club_type TEXT,
  country TEXT,
  city TEXT,
  logo_url TEXT,
  verified BOOLEAN,
  platform_club_id UUID,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.name,
    gc.short_name,
    gc.description,
    gc.club_type,
    gc.country,
    gc.city,
    gc.logo_url,
    gc.verified,
    gc.platform_club_id,
    COUNT(gcm.id) as member_count
  FROM global_clubs gc
  LEFT JOIN global_club_members gcm ON gcm.global_club_id = gc.id
  WHERE
    (search_query IS NULL OR gc.name ILIKE '%' || search_query || '%')
    AND (country_filter IS NULL OR gc.country_code = country_filter OR gc.country ILIKE '%' || country_filter || '%')
    AND (club_type_filter IS NULL OR gc.club_type = club_type_filter)
    AND (NOT verified_only OR gc.verified = true)
  GROUP BY gc.id
  ORDER BY
    gc.verified DESC,
    COUNT(gcm.id) DESC,
    gc.name ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. CREATE UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_global_clubs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_global_clubs_updated_at
  BEFORE UPDATE ON global_clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_global_clubs_updated_at();

-- ============================================================================
-- 10. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE global_clubs IS 'Unified directory of sailing clubs worldwide - combines platform clubs and directory entries';
COMMENT ON COLUMN global_clubs.platform_club_id IS 'Links to clubs table when club has been claimed and set up on RegattaFlow';
COMMENT ON COLUMN global_clubs.verified IS 'True if club identity has been verified (email, admin approval, etc.)';
COMMENT ON COLUMN global_clubs.source IS 'Where this club data originated from';
