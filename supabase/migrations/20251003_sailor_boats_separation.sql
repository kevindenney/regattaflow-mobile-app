-- Sailor Boats Table Migration
-- Separates individual boats from class membership and fleet associations
-- Fixes the confusion between boats (individual vessels) and fleets (class groups)

-- ==========================================
-- SAILOR BOATS TABLE (Individual Vessels)
-- ==========================================

CREATE TABLE IF NOT EXISTS sailor_boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES boat_classes(id) ON DELETE CASCADE,

  -- Boat Identity
  name TEXT NOT NULL, -- "Dragonfly", "My Dragon", etc.
  sail_number TEXT,
  hull_number TEXT,

  -- Boat Details
  manufacturer TEXT, -- "North Sails Dragon", "Custom Built"
  year_built INTEGER,
  hull_material TEXT, -- "Fiberglass", "Carbon", "Wood"

  -- Status
  is_primary BOOLEAN DEFAULT false, -- Primary boat for this class
  status TEXT NOT NULL CHECK (status IN ('active', 'stored', 'sold', 'retired')) DEFAULT 'active',

  -- Location & Storage
  home_club_id TEXT REFERENCES yacht_clubs(id),
  storage_location TEXT,

  -- Ownership
  ownership_type TEXT CHECK (ownership_type IN ('owned', 'co_owned', 'chartered', 'club_boat')),
  purchase_date DATE,
  purchase_price DECIMAL(12,2),

  -- Notes & Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure sailor can only have one primary boat per class
  UNIQUE(sailor_id, class_id, is_primary) WHERE is_primary = true
);

CREATE INDEX IF NOT EXISTS idx_sailor_boats_sailor ON sailor_boats(sailor_id);
CREATE INDEX IF NOT EXISTS idx_sailor_boats_class ON sailor_boats(class_id);
CREATE INDEX IF NOT EXISTS idx_sailor_boats_status ON sailor_boats(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sailor_boats_club ON sailor_boats(home_club_id);

-- ==========================================
-- MIGRATE EXISTING DATA
-- ==========================================

-- Migrate boat names and sail numbers from sailor_classes to sailor_boats
INSERT INTO sailor_boats (
  sailor_id,
  class_id,
  name,
  sail_number,
  is_primary,
  status
)
SELECT
  sailor_id,
  class_id,
  COALESCE(boat_name, bc.name || ' Boat') as name, -- Use class name if no boat name
  sail_number,
  is_primary,
  'active' as status
FROM sailor_classes sc
LEFT JOIN boat_classes bc ON bc.id = sc.class_id
WHERE boat_name IS NOT NULL OR sail_number IS NOT NULL
ON CONFLICT DO NOTHING;

-- ==========================================
-- UPDATE EQUIPMENT & CREW TABLES
-- ==========================================

-- Add boat_id column to boat_equipment (optional, for backward compatibility)
ALTER TABLE boat_equipment
  ADD COLUMN IF NOT EXISTS boat_id UUID REFERENCES sailor_boats(id) ON DELETE CASCADE;

-- Create index for boat_id lookups
CREATE INDEX IF NOT EXISTS idx_boat_equipment_boat ON boat_equipment(boat_id);

-- Add boat_id column to crew_members (optional, for backward compatibility)
ALTER TABLE crew_members
  ADD COLUMN IF NOT EXISTS boat_id UUID REFERENCES sailor_boats(id) ON DELETE CASCADE;

-- Create index for boat_id lookups
CREATE INDEX IF NOT EXISTS idx_crew_members_boat ON crew_members(boat_id);

-- Update equipment to link to boats where possible
UPDATE boat_equipment be
SET boat_id = sb.id
FROM sailor_boats sb
WHERE be.sailor_id = sb.sailor_id
  AND be.class_id = sb.class_id
  AND be.boat_id IS NULL
  AND sb.is_primary = true; -- Link to primary boat for now

-- Update crew to link to boats where possible
UPDATE crew_members cm
SET boat_id = sb.id
FROM sailor_boats sb
WHERE cm.sailor_id = sb.sailor_id
  AND cm.class_id = sb.class_id
  AND cm.boat_id IS NULL
  AND sb.is_primary = true; -- Link to primary boat for now

-- ==========================================
-- UPDATE TUNING SETTINGS
-- ==========================================

-- Add boat_id to tuning settings
ALTER TABLE boat_tuning_settings
  ADD COLUMN IF NOT EXISTS boat_id UUID REFERENCES sailor_boats(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tuning_settings_boat ON boat_tuning_settings(boat_id);

-- Update tuning settings to link to boats
UPDATE boat_tuning_settings bts
SET boat_id = sb.id
FROM sailor_boats sb
WHERE bts.sailor_id = sb.sailor_id
  AND bts.class_id = sb.class_id
  AND bts.boat_id IS NULL
  AND sb.is_primary = true;

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE sailor_boats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sailors can view their own boats" ON sailor_boats;
CREATE POLICY "Sailors can view their own boats"
  ON sailor_boats FOR SELECT
  USING (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Sailors can manage their own boats" ON sailor_boats;
CREATE POLICY "Sailors can manage their own boats"
  ON sailor_boats FOR ALL
  USING (auth.uid() = sailor_id);

-- Update equipment policies to allow access via boat_id
DROP POLICY IF EXISTS "Sailors can view equipment via boat" ON boat_equipment;
CREATE POLICY "Sailors can view equipment via boat"
  ON boat_equipment FOR SELECT
  USING (
    auth.uid() = sailor_id
    OR boat_id IN (SELECT id FROM sailor_boats WHERE sailor_id = auth.uid())
  );

-- Update crew policies to allow access via boat_id
DROP POLICY IF EXISTS "Sailors can view crew via boat" ON crew_members;
CREATE POLICY "Sailors can view crew via boat"
  ON crew_members FOR SELECT
  USING (
    auth.uid() = sailor_id
    OR boat_id IN (SELECT id FROM sailor_boats WHERE sailor_id = auth.uid())
  );

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Ensure only one primary boat per sailor per class
CREATE OR REPLACE FUNCTION ensure_one_primary_boat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary boats for this sailor/class combination
    UPDATE sailor_boats
    SET is_primary = false
    WHERE sailor_id = NEW.sailor_id
      AND class_id = NEW.class_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_one_primary_boat_trigger ON sailor_boats;
CREATE TRIGGER ensure_one_primary_boat_trigger
  BEFORE INSERT OR UPDATE OF is_primary ON sailor_boats
  FOR EACH ROW EXECUTE FUNCTION ensure_one_primary_boat();

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_sailor_boats_updated_at ON sailor_boats;
CREATE TRIGGER update_sailor_boats_updated_at
  BEFORE UPDATE ON sailor_boats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DEPRECATION NOTICE
-- ==========================================

-- NOTE: boat_name and sail_number columns in sailor_classes are now deprecated
-- They are kept for backward compatibility but should not be used in new code
-- Use the sailor_boats table instead

COMMENT ON COLUMN sailor_classes.boat_name IS 'DEPRECATED: Use sailor_boats table instead';
COMMENT ON COLUMN sailor_classes.sail_number IS 'DEPRECATED: Use sailor_boats table instead';

-- Grant permissions
GRANT ALL ON sailor_boats TO authenticated;

COMMENT ON TABLE sailor_boats IS 'Individual boats owned by sailors - separates vessels from class membership and fleets';
