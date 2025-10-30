-- Create user_manual_clubs table for tracking manually added clubs
-- Migration: 20251030_create_user_manual_clubs
-- Description: Creates table and RLS policies for user-managed club tracking

-- Create user_manual_clubs table
CREATE TABLE IF NOT EXISTS public.user_manual_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_manual_clubs_user_id ON public.user_manual_clubs(user_id);

-- Create index on added_at for sorting
CREATE INDEX IF NOT EXISTS idx_user_manual_clubs_added_at ON public.user_manual_clubs(added_at DESC);

-- Enable RLS
ALTER TABLE public.user_manual_clubs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own manual clubs
CREATE POLICY "Users can view their own manual clubs"
  ON public.user_manual_clubs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own manual clubs
CREATE POLICY "Users can insert their own manual clubs"
  ON public.user_manual_clubs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own manual clubs
CREATE POLICY "Users can update their own manual clubs"
  ON public.user_manual_clubs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own manual clubs
CREATE POLICY "Users can delete their own manual clubs"
  ON public.user_manual_clubs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_manual_clubs_updated_at
  BEFORE UPDATE ON public.user_manual_clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_manual_clubs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
