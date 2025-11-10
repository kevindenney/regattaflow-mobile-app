-- Create sailor_race_preparation table to store race-specific sailor preparation data
CREATE TABLE IF NOT EXISTS public.sailor_race_preparation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_event_id UUID NOT NULL REFERENCES public.race_events(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rig planning data
  rig_notes TEXT,
  selected_rig_preset_id TEXT,

  -- Regulatory acknowledgements
  regulatory_acknowledgements JSONB DEFAULT '{
    "cleanRegatta": false,
    "signOn": false,
    "safetyBriefing": false
  }'::jsonb,

  -- Structured race brief for AI context
  race_brief_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one record per sailor per race
  CONSTRAINT unique_sailor_race UNIQUE(race_event_id, sailor_id)
);

-- Add RLS policies
ALTER TABLE public.sailor_race_preparation ENABLE ROW LEVEL SECURITY;

-- Sailors can view their own preparation data
DROP POLICY IF EXISTS "Sailors can view own race preparation" ON public.sailor_race_preparation;
CREATE POLICY "Sailors can view own race preparation"
  ON public.sailor_race_preparation
  FOR SELECT
  USING (auth.uid() = sailor_id);

-- Sailors can insert their own preparation data
DROP POLICY IF EXISTS "Sailors can insert own race preparation" ON public.sailor_race_preparation;
CREATE POLICY "Sailors can insert own race preparation"
  ON public.sailor_race_preparation
  FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

-- Sailors can update their own preparation data
DROP POLICY IF EXISTS "Sailors can update own race preparation" ON public.sailor_race_preparation;
CREATE POLICY "Sailors can update own race preparation"
  ON public.sailor_race_preparation
  FOR UPDATE
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

-- Sailors can delete their own preparation data
DROP POLICY IF EXISTS "Sailors can delete own race preparation" ON public.sailor_race_preparation;
CREATE POLICY "Sailors can delete own race preparation"
  ON public.sailor_race_preparation
  FOR DELETE
  USING (auth.uid() = sailor_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_sailor_race
  ON public.sailor_race_preparation(sailor_id, race_event_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sailor_race_preparation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sailor_race_preparation_updated_at ON public.sailor_race_preparation;
CREATE TRIGGER update_sailor_race_preparation_updated_at
  BEFORE UPDATE ON public.sailor_race_preparation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sailor_race_preparation_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.sailor_race_preparation IS
  'Stores sailor-specific race preparation data including rig notes, acknowledgements, and race brief context for AI integration';
