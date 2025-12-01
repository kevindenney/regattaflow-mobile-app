-- Add execution evaluation fields to race_analysis table
-- This enables sailors to rate and reflect on how well they executed their planned strategy

-- Link to pre-race preparation (plan)
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS preparation_id UUID REFERENCES public.sailor_race_preparation(id) ON DELETE SET NULL;

-- Execution ratings (1-5: how well did you execute your plan?)
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS rig_tuning_execution_rating INT CHECK (rig_tuning_execution_rating >= 1 AND rig_tuning_execution_rating <= 5);
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS prestart_execution_rating INT CHECK (prestart_execution_rating >= 1 AND prestart_execution_rating <= 5);
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS start_execution_rating INT CHECK (start_execution_rating >= 1 AND start_execution_rating <= 5);
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS upwind_execution_rating INT CHECK (upwind_execution_rating >= 1 AND upwind_execution_rating <= 5);
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS windward_mark_execution_rating INT CHECK (windward_mark_execution_rating >= 1 AND windward_mark_execution_rating <= 5);
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS downwind_execution_rating INT CHECK (downwind_execution_rating >= 1 AND downwind_execution_rating <= 5);
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS leeward_mark_execution_rating INT CHECK (leeward_mark_execution_rating >= 1 AND leeward_mark_execution_rating <= 5);
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS finish_execution_rating INT CHECK (finish_execution_rating >= 1 AND finish_execution_rating <= 5);

-- Execution notes (what actually happened vs the plan)
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS rig_tuning_execution_notes TEXT;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS prestart_execution_notes TEXT;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS start_execution_notes TEXT;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS upwind_execution_notes TEXT;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS windward_mark_execution_notes TEXT;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS downwind_execution_notes TEXT;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS leeward_mark_execution_notes TEXT;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS finish_execution_notes TEXT;

-- AI-generated execution coaching (plan vs actual analysis)
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS ai_execution_coaching JSONB DEFAULT '{}'::jsonb;

-- Sharing & collaboration
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_shared_with_coach BOOLEAN DEFAULT false;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_shared_at TIMESTAMPTZ;

-- Add index for preparation lookups (plan-to-execution links)
CREATE INDEX IF NOT EXISTS idx_race_analysis_preparation_id
  ON public.race_analysis(preparation_id)
  WHERE preparation_id IS NOT NULL;

-- Add index for coach lookups on execution analysis
CREATE INDEX IF NOT EXISTS idx_race_analysis_execution_coach_id
  ON public.race_analysis(execution_coach_id)
  WHERE execution_coach_id IS NOT NULL;

-- Add index for shared execution analyses
CREATE INDEX IF NOT EXISTS idx_race_analysis_execution_shared
  ON public.race_analysis(execution_coach_id, execution_shared_with_coach, execution_shared_at)
  WHERE execution_shared_with_coach = true;

-- Update RLS policies to allow coaches to view shared execution analyses
DROP POLICY IF EXISTS "Coaches can view shared execution analysis" ON public.race_analysis;
CREATE POLICY "Coaches can view shared execution analysis"
  ON public.race_analysis
  FOR SELECT
  USING (
    execution_shared_with_coach = true
    AND execution_coach_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.coach_profiles
      WHERE id = execution_coach_id
      AND user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN public.race_analysis.preparation_id IS
  'Links to the pre-race preparation plan for plan-vs-execution comparison';
COMMENT ON COLUMN public.race_analysis.rig_tuning_execution_rating IS
  'How well did you execute your rig tuning strategy? (1=poorly, 5=perfectly)';
COMMENT ON COLUMN public.race_analysis.ai_execution_coaching IS
  'AI-generated coaching comparing planned strategy vs actual execution';
COMMENT ON COLUMN public.race_analysis.execution_shared_with_coach IS
  'Whether this execution analysis has been shared with the assigned coach';
