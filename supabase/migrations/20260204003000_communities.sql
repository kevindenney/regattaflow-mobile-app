-- =====================================================
-- Communities System Migration
-- Reddit-inspired community structure for discussions
-- Extends venue discussions to support boat classes, races,
-- sailmakers, gear, rules, tactics, and more
-- =====================================================

-- ============================================
-- 1. COMMUNITY TYPE ENUM
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_type') THEN
    CREATE TYPE community_type AS ENUM (
      'venue',        -- Physical sailing location (existing venues)
      'boat_class',   -- Dragon, Laser, J/70, etc.
      'race',         -- Specific regatta/event
      'sailmaker',    -- North, Doyle, Quantum, etc.
      'gear',         -- Foul weather gear, sunglasses, electronics
      'rules',        -- Racing rules, protests, marks
      'tactics',      -- General tactical discussion
      'tuning',       -- Rig tuning, sail trim
      'general'       -- Catch-all for other topics
    );
  END IF;
END $$;

-- ============================================
-- 2. COMMUNITY CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed categories
INSERT INTO community_categories (name, display_name, description, icon, color, sort_order) VALUES
  ('racing', 'Racing', 'Race events and regattas', 'trophy-outline', '#EA580C', 1),
  ('boat_classes', 'Boat Classes', 'Discussion by boat class', 'boat-outline', '#2563EB', 2),
  ('sailmakers', 'Sailmakers', 'Sail brands and performance', 'flag-outline', '#7C3AED', 3),
  ('gear', 'Gear & Equipment', 'Sailing gear and accessories', 'construct-outline', '#059669', 4),
  ('tuning', 'Tuning & Setup', 'Rig tuning and boat setup', 'settings-outline', '#0891B2', 5),
  ('rules', 'Rules & Tactics', 'Racing rules and tactical discussion', 'book-outline', '#DC2626', 6),
  ('locations', 'Locations', 'Sailing venues and racing areas', 'location-outline', '#D97706', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. COMMUNITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  community_type community_type NOT NULL DEFAULT 'general',
  category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
  icon_url TEXT,
  banner_url TEXT,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_official BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  -- Link to existing entities (venue, boat class, race catalog, etc.)
  linked_entity_type TEXT CHECK (linked_entity_type IN ('sailing_venue', 'boat_class', 'catalog_race', 'club')),
  linked_entity_id TEXT,  -- Can be UUID or string ID depending on entity type
  -- Metadata for type-specific info
  metadata JSONB DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(community_type);
CREATE INDEX IF NOT EXISTS idx_communities_category ON communities(category_id);
CREATE INDEX IF NOT EXISTS idx_communities_linked_entity ON communities(linked_entity_type, linked_entity_id);
CREATE INDEX IF NOT EXISTS idx_communities_member_count ON communities(member_count DESC);
CREATE INDEX IF NOT EXISTS idx_communities_official ON communities(is_official) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_communities_last_activity ON communities(last_activity_at DESC);

-- ============================================
-- 4. COMMUNITY MEMBERSHIPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS community_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  notifications_enabled BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_community_memberships_user ON community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community ON community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_role ON community_memberships(community_id, role);

-- ============================================
-- 5. COMMUNITY FLAIRS (Post Tags within Community)
-- ============================================

CREATE TABLE IF NOT EXISTS community_flairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, name)
);

CREATE INDEX IF NOT EXISTS idx_community_flairs_community ON community_flairs(community_id);

-- ============================================
-- 6. ADD community_id TO venue_discussions
-- ============================================

ALTER TABLE venue_discussions
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_venue_discussions_community ON venue_discussions(community_id)
  WHERE community_id IS NOT NULL;

-- ============================================
-- 7. TRIGGER: Update member_count on membership changes
-- ============================================

CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_community_member_count ON community_memberships;
CREATE TRIGGER trigger_update_community_member_count
AFTER INSERT OR DELETE ON community_memberships
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- ============================================
-- 8. TRIGGER: Update post_count on discussion changes
-- ============================================

CREATE OR REPLACE FUNCTION update_community_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.community_id IS NOT NULL THEN
    UPDATE communities
    SET post_count = post_count + 1,
        last_activity_at = now()
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.community_id IS NOT NULL THEN
    UPDATE communities
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.community_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle community_id change
    IF OLD.community_id IS DISTINCT FROM NEW.community_id THEN
      IF OLD.community_id IS NOT NULL THEN
        UPDATE communities SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.community_id;
      END IF;
      IF NEW.community_id IS NOT NULL THEN
        UPDATE communities SET post_count = post_count + 1, last_activity_at = now() WHERE id = NEW.community_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_community_post_count ON venue_discussions;
CREATE TRIGGER trigger_update_community_post_count
AFTER INSERT OR UPDATE OR DELETE ON venue_discussions
FOR EACH ROW EXECUTE FUNCTION update_community_post_count();

-- ============================================
-- 9. TRIGGER: Update communities.updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_communities_updated_at ON communities;
CREATE TRIGGER trigger_communities_updated_at
BEFORE UPDATE ON communities
FOR EACH ROW EXECUTE FUNCTION update_communities_updated_at();

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Generate slug from name
CREATE OR REPLACE FUNCTION generate_community_slug(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_suffix INTEGER := 0;
  v_final_slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove non-alphanumeric
  v_slug := lower(trim(p_name));
  v_slug := regexp_replace(v_slug, '[^a-z0-9\s-]', '', 'g');
  v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  -- Ensure uniqueness
  v_final_slug := v_slug;
  WHILE EXISTS (SELECT 1 FROM communities WHERE slug = v_final_slug) LOOP
    v_suffix := v_suffix + 1;
    v_final_slug := v_slug || '-' || v_suffix;
  END LOOP;

  RETURN v_final_slug;
END;
$$ LANGUAGE plpgsql;

-- Check if user is community member
CREATE OR REPLACE FUNCTION is_community_member(p_user_id UUID, p_community_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_memberships
    WHERE user_id = p_user_id AND community_id = p_community_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is community moderator
CREATE OR REPLACE FUNCTION is_community_moderator(p_user_id UUID, p_community_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_memberships
    WHERE user_id = p_user_id
    AND community_id = p_community_id
    AND role IN ('moderator', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_flairs ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Community categories are readable by all"
  ON community_categories FOR SELECT
  USING (true);

-- Communities: public read
CREATE POLICY "Communities are readable by all"
  ON communities FOR SELECT
  USING (true);

-- Communities: authenticated users can create
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Communities: creator and moderators can update
CREATE POLICY "Community admins can update"
  ON communities FOR UPDATE
  USING (
    auth.uid() = created_by
    OR is_community_moderator(auth.uid(), id)
  );

-- Memberships: users can see all memberships
CREATE POLICY "Memberships are readable by all"
  ON community_memberships FOR SELECT
  USING (true);

-- Memberships: users can join communities
CREATE POLICY "Users can join communities"
  ON community_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'member');

-- Memberships: users can leave communities
CREATE POLICY "Users can leave communities"
  ON community_memberships FOR DELETE
  USING (auth.uid() = user_id);

-- Memberships: moderators can manage roles
CREATE POLICY "Moderators can manage memberships"
  ON community_memberships FOR UPDATE
  USING (
    is_community_moderator(auth.uid(), community_id)
  );

-- Flairs: public read
CREATE POLICY "Community flairs are readable by all"
  ON community_flairs FOR SELECT
  USING (true);

-- Flairs: moderators can manage
CREATE POLICY "Moderators can manage flairs"
  ON community_flairs FOR ALL
  USING (
    is_community_moderator(auth.uid(), community_id)
  );

-- ============================================
-- 12. SEED INITIAL COMMUNITIES FROM EXISTING DATA
-- ============================================

-- Create communities for boat classes
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, linked_entity_type, linked_entity_id, metadata)
SELECT
  bc.name,
  generate_community_slug(bc.name),
  'Discussion for ' || bc.name || ' sailors',
  'boat_class'::community_type,
  (SELECT id FROM community_categories WHERE name = 'boat_classes'),
  true,
  'boat_class',
  bc.id::TEXT,
  '{}'::jsonb
FROM boat_classes bc
WHERE bc.name IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM communities c
  WHERE c.linked_entity_type = 'boat_class' AND c.linked_entity_id = bc.id::TEXT
)
ON CONFLICT (slug) DO NOTHING;

-- Create communities for sailing venues
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, linked_entity_type, linked_entity_id, metadata)
SELECT
  sv.name,
  generate_community_slug(sv.name),
  'Local knowledge and discussion for ' || sv.name,
  'venue'::community_type,
  (SELECT id FROM community_categories WHERE name = 'locations'),
  true,
  'sailing_venue',
  sv.id,
  COALESCE(
    jsonb_build_object('country', sv.country, 'region', sv.region),
    '{}'::jsonb
  )
FROM sailing_venues sv
WHERE sv.name IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM communities c
  WHERE c.linked_entity_type = 'sailing_venue' AND c.linked_entity_id = sv.id
)
ON CONFLICT (slug) DO NOTHING;

-- Seed popular sailmakers
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES
  ('North Sails', 'north-sails', 'Discussion about North Sails products, tuning, and performance', 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true, '{"website": "https://www.northsails.com"}'),
  ('Doyle Sails', 'doyle-sails', 'Doyle Sails community - products and performance discussion', 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true, '{"website": "https://www.doylesails.com"}'),
  ('Quantum Sails', 'quantum-sails', 'Quantum Sails discussion and tuning tips', 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true, '{"website": "https://www.quantumsails.com"}'),
  ('Elvstrøm Sails', 'elvstrom-sails', 'Elvstrøm Sails community for class racing', 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true, '{"website": "https://www.elvstromsails.com"}'),
  ('Hyde Sails', 'hyde-sails', 'Hyde Sails discussion and racing tips', 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true, '{"website": "https://www.hydesails.co.uk"}'),
  ('UK Sailmakers', 'uk-sailmakers', 'UK Sailmakers community discussion', 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true, '{"website": "https://www.uksailmakers.com"}')
ON CONFLICT (slug) DO NOTHING;

-- Seed gear communities
INSERT INTO communities (name, slug, description, community_type, category_id, metadata) VALUES
  ('Foul Weather Gear', 'foul-weather-gear', 'Discussion about sailing jackets, pants, and wet weather protection', 'gear', (SELECT id FROM community_categories WHERE name = 'gear'), '{"subtopics": ["jackets", "pants", "boots", "gloves"]}'),
  ('Sailing Sunglasses', 'sailing-sunglasses', 'Best sunglasses for racing and cruising', 'gear', (SELECT id FROM community_categories WHERE name = 'gear'), '{"subtopics": ["polarized", "floating", "sport"]}'),
  ('Marine Electronics', 'marine-electronics', 'GPS, instruments, and sailing electronics', 'gear', (SELECT id FROM community_categories WHERE name = 'gear'), '{"subtopics": ["gps", "instruments", "ais", "vhf"]}'),
  ('Sailing Footwear', 'sailing-footwear', 'Boat shoes, boots, and deck footwear', 'gear', (SELECT id FROM community_categories WHERE name = 'gear'), '{"subtopics": ["boots", "shoes", "sandals"]}'),
  ('Sailing Gloves', 'sailing-gloves', 'Racing gloves and hand protection', 'gear', (SELECT id FROM community_categories WHERE name = 'gear'), '{"subtopics": ["full finger", "3/4 finger", "winter"]}')
ON CONFLICT (slug) DO NOTHING;

-- Seed rules & tactics communities
INSERT INTO communities (name, slug, description, community_type, category_id, metadata) VALUES
  ('Racing Rules of Sailing', 'racing-rules-of-sailing', 'Discussion and interpretation of the Racing Rules of Sailing', 'rules', (SELECT id FROM community_categories WHERE name = 'rules'), '{"official_rules": true}'),
  ('Protests & Redress', 'protests-and-redress', 'How to file protests, redress requests, and hearing procedures', 'rules', (SELECT id FROM community_categories WHERE name = 'rules'), '{}'),
  ('Starting Tactics', 'starting-tactics', 'Starting line strategy, timing, and positioning', 'tactics', (SELECT id FROM community_categories WHERE name = 'rules'), '{}'),
  ('Mark Roundings', 'mark-roundings', 'Tactical discussion for windward, leeward, and gate marks', 'tactics', (SELECT id FROM community_categories WHERE name = 'rules'), '{}'),
  ('Current & Wind Strategy', 'current-wind-strategy', 'Using current and wind shifts to your advantage', 'tactics', (SELECT id FROM community_categories WHERE name = 'rules'), '{}')
ON CONFLICT (slug) DO NOTHING;

-- Seed tuning communities
INSERT INTO communities (name, slug, description, community_type, category_id, metadata) VALUES
  ('Mast Tuning', 'mast-tuning', 'Mast rake, pre-bend, and shroud tension discussion', 'tuning', (SELECT id FROM community_categories WHERE name = 'tuning'), '{}'),
  ('Sail Trim', 'sail-trim', 'Main, jib, and spinnaker trim techniques', 'tuning', (SELECT id FROM community_categories WHERE name = 'tuning'), '{}'),
  ('Boat Speed', 'boat-speed', 'Getting the most speed out of your boat', 'tuning', (SELECT id FROM community_categories WHERE name = 'tuning'), '{}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 13. MIGRATE SAVED VENUES TO COMMUNITY MEMBERSHIPS
-- ============================================

-- For each saved venue, create a community membership if the venue has a community
INSERT INTO community_memberships (user_id, community_id, role, notifications_enabled, joined_at)
SELECT DISTINCT
  sv.user_id,
  c.id,
  'member',
  true,
  sv.created_at
FROM saved_venues sv
JOIN communities c ON c.linked_entity_type = 'sailing_venue' AND c.linked_entity_id = sv.venue_id
WHERE NOT EXISTS (
  SELECT 1 FROM community_memberships cm
  WHERE cm.user_id = sv.user_id AND cm.community_id = c.id
);

-- ============================================
-- 14. LINK EXISTING DISCUSSIONS TO COMMUNITIES
-- ============================================

-- Update venue_discussions to link to their community
UPDATE venue_discussions vd
SET community_id = c.id
FROM communities c
WHERE c.linked_entity_type = 'sailing_venue'
AND c.linked_entity_id = vd.venue_id
AND vd.community_id IS NULL;

-- ============================================
-- 15. CREATE VIEW FOR COMMUNITY LISTING WITH STATS
-- ============================================

CREATE OR REPLACE VIEW communities_with_stats AS
SELECT
  c.*,
  cat.display_name as category_name,
  cat.icon as category_icon,
  cat.color as category_color,
  (
    SELECT COUNT(*)
    FROM venue_discussions vd
    WHERE vd.community_id = c.id
    AND vd.created_at > now() - interval '24 hours'
  ) as posts_last_24h,
  (
    SELECT COUNT(DISTINCT cm.user_id)
    FROM community_memberships cm
    WHERE cm.community_id = c.id
    AND cm.joined_at > now() - interval '7 days'
  ) as new_members_7d
FROM communities c
LEFT JOIN community_categories cat ON c.category_id = cat.id;

GRANT SELECT ON communities_with_stats TO authenticated;

COMMENT ON VIEW communities_with_stats IS 'Communities with category info and activity stats';
