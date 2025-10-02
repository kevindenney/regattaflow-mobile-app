-- Sailor Dashboard Enhancements Migration
-- Crew Management, Tuning Guides, and Enhanced Class Features

-- ==========================================
-- CREW MANAGEMENT TABLES
-- ==========================================

-- Crew members table for boat teams
CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES boat_classes(id) ON DELETE CASCADE,
  
  -- Member Info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if not a RegattaFlow user yet
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('helmsman', 'tactician', 'trimmer', 'bowman', 'pit', 'grinder', 'other')),
  
  -- Access & Status
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'edit', 'full')) DEFAULT 'view',
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'inactive')) DEFAULT 'pending',
  invite_token TEXT UNIQUE,
  invite_sent_at TIMESTAMPTZ,
  invite_accepted_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  performance_notes JSONB DEFAULT '[]', -- Array of {date, race, note}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sailor_id, class_id, email)
);

CREATE INDEX IF NOT EXISTS idx_crew_members_sailor ON crew_members(sailor_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_class ON crew_members(class_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user ON crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_status ON crew_members(status);

-- ==========================================
-- TUNING GUIDES TABLES
-- ==========================================

-- Tuning guides storage
CREATE TABLE IF NOT EXISTS tuning_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES boat_classes(id) ON DELETE CASCADE,
  
  -- Guide Info
  title TEXT NOT NULL,
  source TEXT NOT NULL, -- 'North Sails', 'Quantum', 'User Upload', 'Class Association'
  source_url TEXT,
  file_url TEXT, -- Storage URL for the PDF/document
  file_type TEXT, -- 'pdf', 'doc', 'image', 'link'
  
  -- Content
  description TEXT,
  year INTEGER, -- Publication year
  tags TEXT[] DEFAULT '{}', -- ['light-wind', 'heavy-air', 'rigging', 'sail-trim']
  
  -- Scraping Info
  auto_scraped BOOLEAN DEFAULT false,
  scrape_successful BOOLEAN DEFAULT false,
  last_scraped_at TIMESTAMPTZ,
  scrape_error TEXT,
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false, -- Share with all class sailors
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tuning_guides_class ON tuning_guides(class_id);
CREATE INDEX IF NOT EXISTS idx_tuning_guides_public ON tuning_guides(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_tuning_guides_uploaded_by ON tuning_guides(uploaded_by);

-- User's personal tuning guide library
CREATE TABLE IF NOT EXISTS sailor_tuning_guides (
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES tuning_guides(id) ON DELETE CASCADE,
  
  -- Personal Notes & Bookmarks
  is_favorite BOOLEAN DEFAULT false,
  personal_notes TEXT,
  last_viewed_at TIMESTAMPTZ,
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (sailor_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_sailor_tuning_guides_sailor ON sailor_tuning_guides(sailor_id);
CREATE INDEX IF NOT EXISTS idx_sailor_tuning_guides_favorites ON sailor_tuning_guides(is_favorite) WHERE is_favorite = true;

-- ==========================================
-- ENHANCED RACE STATUS TRACKING
-- ==========================================

-- Add columns to regattas for better status tracking
ALTER TABLE regattas 
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES boat_classes(id),
  ADD COLUMN IF NOT EXISTS crew_assigned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tuning_guide_ready BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS documents_ready BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS weather_checked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS venue_intelligence_ready BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS strategy_status TEXT CHECK (strategy_status IN ('none', 'in_progress', 'ready', 'reviewed')) DEFAULT 'none';

-- ==========================================
-- ENHANCED BOAT CLASSES
-- ==========================================

-- Add more metadata to boat_classes
ALTER TABLE boat_classes
  ADD COLUMN IF NOT EXISTS default_tuning_guide_sources JSONB DEFAULT '[
    {"name": "North Sails", "url_pattern": "https://northsails.com/{class}/tuning"},
    {"name": "Quantum Sails", "url_pattern": "https://www.quantumsails.com/en/resources/tuning-guides"}
  ]';

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Crew Members Policies
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sailors can view their own crew" ON crew_members;
CREATE POLICY "Sailors can view their own crew"
  ON crew_members FOR SELECT
  USING (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Sailors can manage their own crew" ON crew_members;
CREATE POLICY "Sailors can manage their own crew"
  ON crew_members FOR ALL
  USING (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Crew members can view their own record" ON crew_members;
CREATE POLICY "Crew members can view their own record"
  ON crew_members FOR SELECT
  USING (auth.uid() = user_id);

-- Tuning Guides Policies
ALTER TABLE tuning_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public tuning guides" ON tuning_guides;
CREATE POLICY "Anyone can view public tuning guides"
  ON tuning_guides FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can view guides for their classes" ON tuning_guides;
CREATE POLICY "Users can view guides for their classes"
  ON tuning_guides FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM sailor_classes WHERE sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload tuning guides" ON tuning_guides;
CREATE POLICY "Users can upload tuning guides"
  ON tuning_guides FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can update their own guides" ON tuning_guides;
CREATE POLICY "Users can update their own guides"
  ON tuning_guides FOR UPDATE
  USING (auth.uid() = uploaded_by);

-- Sailor Tuning Guides Policies
ALTER TABLE sailor_tuning_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tuning guide library" ON sailor_tuning_guides;
CREATE POLICY "Users can manage their own tuning guide library"
  ON sailor_tuning_guides FOR ALL
  USING (auth.uid() = sailor_id);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_crew_members_updated_at ON crew_members;
CREATE TRIGGER update_crew_members_updated_at BEFORE UPDATE ON crew_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tuning_guides_updated_at ON tuning_guides;
CREATE TRIGGER update_tuning_guides_updated_at BEFORE UPDATE ON tuning_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate invite token on crew member creation
CREATE OR REPLACE FUNCTION generate_crew_invite_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.invite_token IS NULL THEN
    NEW.invite_token = encode(gen_random_bytes(32), 'base64');
    NEW.invite_sent_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_crew_invite_token_trigger ON crew_members;
CREATE TRIGGER generate_crew_invite_token_trigger
  BEFORE INSERT ON crew_members
  FOR EACH ROW EXECUTE FUNCTION generate_crew_invite_token();

-- Update race strategy status based on ai_analyses
CREATE OR REPLACE FUNCTION update_race_strategy_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.analysis_type = 'strategy' AND NEW.confidence_score > 0.5 THEN
    UPDATE regattas
    SET strategy_status = 'ready'
    WHERE id = NEW.regatta_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_race_strategy_status_trigger ON ai_analyses;
CREATE TRIGGER update_race_strategy_status_trigger
  AFTER INSERT OR UPDATE ON ai_analyses
  FOR EACH ROW EXECUTE FUNCTION update_race_strategy_status();

-- ==========================================
-- SAMPLE DATA FOR TESTING
-- ==========================================

-- Insert common tuning guide sources for popular classes
INSERT INTO tuning_guides (class_id, title, source, source_url, file_type, is_public, auto_scraped, year)
SELECT 
  id,
  name || ' Official Tuning Guide',
  'Class Association',
  'https://www.' || LOWER(REPLACE(name, ' ', '')) || '-class.org/tuning',
  'link',
  true,
  false,
  2024
FROM boat_classes
WHERE name IN ('Dragon', 'J/70', 'J/80', 'Melges 24', 'Laser', '470', '49er')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON crew_members TO authenticated;
GRANT ALL ON tuning_guides TO authenticated;
GRANT ALL ON sailor_tuning_guides TO authenticated;

COMMENT ON TABLE crew_members IS 'Crew members for sailor boats, with invite and access management';
COMMENT ON TABLE tuning_guides IS 'Tuning guides for boat classes, can be auto-scraped or user-uploaded';
COMMENT ON TABLE sailor_tuning_guides IS 'Personal tuning guide library for sailors';
