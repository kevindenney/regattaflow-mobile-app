-- Safe migration for saved_venues table
-- Checks for existing objects before creating

-- Drop table if you want to start fresh (comment out if you want to preserve data)
-- DROP TABLE IF EXISTS public.saved_venues CASCADE;

-- Create saved_venues table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_venues') THEN
    CREATE TABLE public.saved_venues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      venue_id TEXT NOT NULL REFERENCES public.sailing_venues(id) ON DELETE CASCADE,
      notes TEXT,
      is_home_venue BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, venue_id)
    );
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_venues_user_id') THEN
    CREATE INDEX idx_saved_venues_user_id ON public.saved_venues(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_venues_venue_id') THEN
    CREATE INDEX idx_saved_venues_venue_id ON public.saved_venues(venue_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_venues_home') THEN
    CREATE INDEX idx_saved_venues_home ON public.saved_venues(user_id, is_home_venue) WHERE is_home_venue = true;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.saved_venues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own saved venues" ON public.saved_venues;
DROP POLICY IF EXISTS "Users can insert their own saved venues" ON public.saved_venues;
DROP POLICY IF EXISTS "Users can update their own saved venues" ON public.saved_venues;
DROP POLICY IF EXISTS "Users can delete their own saved venues" ON public.saved_venues;

-- Create RLS Policies
CREATE POLICY "Users can view their own saved venues"
  ON public.saved_venues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved venues"
  ON public.saved_venues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved venues"
  ON public.saved_venues FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved venues"
  ON public.saved_venues FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace function for updated_at
CREATE OR REPLACE FUNCTION update_saved_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS set_saved_venues_updated_at ON public.saved_venues;
CREATE TRIGGER set_saved_venues_updated_at
  BEFORE UPDATE ON public.saved_venues
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_venues_updated_at();

-- Create or replace view
CREATE OR REPLACE VIEW public.saved_venues_with_details AS
SELECT
  sv.id AS saved_venue_id,
  sv.user_id,
  sv.notes,
  sv.is_home_venue,
  sv.created_at AS saved_at,
  sv.updated_at AS saved_updated_at,
  v.id,
  v.name,
  v.country,
  v.region,
  v.venue_type,
  v.coordinates_lat,
  v.coordinates_lng,
  v.created_at AS venue_created_at,
  v.updated_at AS venue_updated_at
FROM public.saved_venues sv
JOIN public.sailing_venues v ON sv.venue_id = v.id;

-- Grant permissions
GRANT SELECT ON public.saved_venues_with_details TO authenticated;

-- Add comments
COMMENT ON TABLE public.saved_venues IS 'User-specific saved/favorite sailing venues';
COMMENT ON COLUMN public.saved_venues.notes IS 'User notes about this venue';
COMMENT ON COLUMN public.saved_venues.is_home_venue IS 'Flag to mark user''s primary sailing venue';
