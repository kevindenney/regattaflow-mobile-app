-- ============================================================================
-- catalog_races + saved_catalog_races
--
-- Public catalog of major regattas for discovery and discussion tagging.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- catalog_races — the main catalog table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE SET NULL,
  organizing_authority TEXT,
  organizing_club_id TEXT REFERENCES yacht_clubs(id) ON DELETE SET NULL,
  description TEXT,
  website_url TEXT,
  race_type TEXT CHECK (race_type IN (
    'fleet', 'distance', 'match', 'team', 'offshore', 'coastal', 'dinghy'
  )),
  boat_classes TEXT[] DEFAULT ARRAY[]::TEXT[],
  level TEXT CHECK (level IN (
    'world_championship', 'continental', 'national', 'regional', 'club', 'open'
  )),
  recurrence TEXT CHECK (recurrence IN (
    'annual', 'biennial', 'quadrennial', 'one_time', 'series'
  )),
  typical_month INTEGER CHECK (typical_month BETWEEN 1 AND 12),
  typical_duration_days INTEGER,
  next_edition_date DATE,
  country TEXT,
  region TEXT,
  follower_count INTEGER DEFAULT 0,
  discussion_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for discovery
CREATE INDEX idx_catalog_races_slug ON catalog_races(slug);
CREATE INDEX idx_catalog_races_featured ON catalog_races(is_featured) WHERE is_featured = true;
CREATE INDEX idx_catalog_races_venue ON catalog_races(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX idx_catalog_races_country ON catalog_races(country);
CREATE INDEX idx_catalog_races_name_search ON catalog_races USING gin (to_tsvector('english', name));

-- RLS
ALTER TABLE catalog_races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_races_public_read" ON catalog_races
  FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- saved_catalog_races — user follows / bookmarks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_catalog_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_race_id UUID NOT NULL REFERENCES catalog_races(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, catalog_race_id)
);

CREATE INDEX idx_saved_catalog_races_user ON saved_catalog_races(user_id);

-- RLS
ALTER TABLE saved_catalog_races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_catalog_races_own_select" ON saved_catalog_races
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "saved_catalog_races_own_insert" ON saved_catalog_races
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_catalog_races_own_delete" ON saved_catalog_races
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Trigger: auto-update follower_count on catalog_races
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_catalog_race_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE catalog_races
      SET follower_count = follower_count + 1
      WHERE id = NEW.catalog_race_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE catalog_races
      SET follower_count = GREATEST(0, follower_count - 1)
      WHERE id = OLD.catalog_race_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_saved_catalog_races_follower_count
AFTER INSERT OR DELETE ON saved_catalog_races
FOR EACH ROW
EXECUTE FUNCTION update_catalog_race_follower_count();

-- ---------------------------------------------------------------------------
-- updated_at auto-update
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_catalog_races_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_catalog_races_updated_at
BEFORE UPDATE ON catalog_races
FOR EACH ROW
EXECUTE FUNCTION update_catalog_races_updated_at();
