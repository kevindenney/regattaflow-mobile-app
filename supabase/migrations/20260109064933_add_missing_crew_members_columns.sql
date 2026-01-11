-- Add missing columns to crew_members table that the application expects

-- Add is_primary column (defaults to false)
ALTER TABLE crew_members
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- Add certifications column (JSONB array, defaults to empty array)
ALTER TABLE crew_members
ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN crew_members.is_primary IS 'Whether this crew member is part of the primary/regular crew';
COMMENT ON COLUMN crew_members.certifications IS 'Array of certification objects with name, issuer, dates, verification status';
