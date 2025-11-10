-- Add strategic planning fields to sailor_race_preparation table
-- This enables sailors to document their race strategy before the race

-- Strategic planning (before race)
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS rig_tuning_strategy TEXT;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS prestart_strategy TEXT;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS start_strategy TEXT;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS upwind_strategy TEXT;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS windward_mark_strategy TEXT;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS downwind_strategy TEXT;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS leeward_mark_strategy TEXT;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS finish_strategy TEXT;

-- AI-generated strategic context (optional enhancement)
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS ai_strategy_suggestions JSONB DEFAULT '{}'::jsonb;

-- Sharing & collaboration
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS shared_with_coach BOOLEAN DEFAULT false;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;

-- Add index for coach lookups
CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_coach_id
  ON public.sailor_race_preparation(coach_id)
  WHERE coach_id IS NOT NULL;

-- Add index for shared strategies
CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_shared
  ON public.sailor_race_preparation(coach_id, shared_with_coach, shared_at)
  WHERE shared_with_coach = true;

-- Update RLS policies to allow coaches to view shared preparations
DROP POLICY IF EXISTS "Coaches can view shared race preparation" ON public.sailor_race_preparation;
CREATE POLICY "Coaches can view shared race preparation"
  ON public.sailor_race_preparation
  FOR SELECT
  USING (
    shared_with_coach = true
    AND coach_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.coach_profiles
      WHERE id = coach_id
      AND user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN public.sailor_race_preparation.rig_tuning_strategy IS
  'Sailor''s pre-race strategy for rig tuning based on forecasted conditions';
COMMENT ON COLUMN public.sailor_race_preparation.ai_strategy_suggestions IS
  'AI-generated strategy suggestions based on conditions, venue, and sailor''s learning profile';
COMMENT ON COLUMN public.sailor_race_preparation.shared_with_coach IS
  'Whether this preparation has been shared with the assigned coach';
