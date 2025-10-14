-- Add missing columns to sailor_boats table
-- The table exists but is missing many columns from the full schema

-- Add name column (required!)
ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Unnamed Boat';

-- Add hull and construction details
ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS hull_number TEXT;

ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS manufacturer TEXT;

ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS year_built INTEGER;

ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS hull_material TEXT;

-- Add status column
ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL CHECK (status IN ('active', 'stored', 'sold', 'retired')) DEFAULT 'active';

-- Add ownership type (replace is_owner boolean with enum)
ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS ownership_type TEXT CHECK (ownership_type IN ('owned', 'co_owned', 'chartered', 'club_boat'));

-- Add location fields
ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS home_club_id TEXT;

ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS storage_location TEXT;

-- Add purchase details
ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS purchase_date DATE;

ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2);

-- Add notes and metadata
ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE sailor_boats
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Remove the default from name column now that it exists
ALTER TABLE sailor_boats
ALTER COLUMN name DROP DEFAULT;
