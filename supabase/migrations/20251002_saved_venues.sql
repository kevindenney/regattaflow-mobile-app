-- Migration: User Saved/Favorite Venues
-- Allows users to save specific venues to their profile for quick access
-- and filters map views to show only their saved locations

-- Create saved_venues table
CREATE TABLE IF NOT EXISTS public.saved_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL REFERENCES public.sailing_venues(id) ON DELETE CASCADE,
  notes TEXT,
  is_home_venue BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a user can only save a venue once
  UNIQUE(user_id, venue_id)
);

-- Create index for fast lookups by user
CREATE INDEX idx_saved_venues_user_id ON public.saved_venues(user_id);
CREATE INDEX idx_saved_venues_venue_id ON public.saved_venues(venue_id);
CREATE INDEX idx_saved_venues_home ON public.saved_venues(user_id, is_home_venue) WHERE is_home_venue = true;

-- Enable RLS
ALTER TABLE public.saved_venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own saved venues
CREATE POLICY "Users can view their own saved venues"
  ON public.saved_venues
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved venues"
  ON public.saved_venues
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved venues"
  ON public.saved_venues
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved venues"
  ON public.saved_venues
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER set_saved_venues_updated_at
  BEFORE UPDATE ON public.saved_venues
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_venues_updated_at();

-- Create view for saved venues with full venue details
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

-- Grant access to the view
GRANT SELECT ON public.saved_venues_with_details TO authenticated;

-- RLS for the view (inherits from saved_venues RLS)
ALTER VIEW public.saved_venues_with_details SET (security_invoker = true);

COMMENT ON TABLE public.saved_venues IS 'User-specific saved/favorite sailing venues for quick access and filtering';
COMMENT ON COLUMN public.saved_venues.notes IS 'User notes about this venue (e.g., "Great for light wind racing")';
COMMENT ON COLUMN public.saved_venues.is_home_venue IS 'Flag to mark the user''s primary/home sailing venue';
