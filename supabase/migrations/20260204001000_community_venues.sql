-- Migration: Add support for community-created venues
-- Enables users to add venues that don't exist in the database

-- Add source column to sailing_venues if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sailing_venues' AND column_name = 'source'
  ) THEN
    ALTER TABLE sailing_venues
    ADD COLUMN source TEXT DEFAULT 'official'
    CHECK (source IN ('official', 'community', 'imported'));
  END IF;
END $$;

-- Add created_by column to track who created community venues
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sailing_venues' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE sailing_venues
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for community venues lookup
CREATE INDEX IF NOT EXISTS idx_sailing_venues_source ON sailing_venues(source);
CREATE INDEX IF NOT EXISTS idx_sailing_venues_created_by ON sailing_venues(created_by);

-- Enable RLS on sailing_venues if not already enabled
ALTER TABLE sailing_venues ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read venues (they're public)
DROP POLICY IF EXISTS "Anyone can view venues" ON sailing_venues;
CREATE POLICY "Anyone can view venues" ON sailing_venues
  FOR SELECT USING (true);

-- Allow authenticated users to insert community venues
DROP POLICY IF EXISTS "Authenticated users can create community venues" ON sailing_venues;
CREATE POLICY "Authenticated users can create community venues" ON sailing_venues
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND source = 'community'
    AND created_by = auth.uid()
  );

-- Allow users to update their own community venues (within first 24 hours)
DROP POLICY IF EXISTS "Users can update their own community venues" ON sailing_venues;
CREATE POLICY "Users can update their own community venues" ON sailing_venues
  FOR UPDATE
  USING (
    auth.uid() = created_by
    AND source = 'community'
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    auth.uid() = created_by
    AND source = 'community'
  );

-- Function to generate a URL-safe slug from venue name
CREATE OR REPLACE FUNCTION generate_venue_slug(venue_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(trim(venue_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- Truncate to reasonable length
  base_slug := left(base_slug, 60);

  -- Check for uniqueness and add suffix if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM sailing_venues WHERE id = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Comment on the new columns
COMMENT ON COLUMN sailing_venues.source IS 'Source of the venue data: official (curated), community (user-submitted), imported (bulk import)';
COMMENT ON COLUMN sailing_venues.created_by IS 'User who created this venue (for community venues)';
