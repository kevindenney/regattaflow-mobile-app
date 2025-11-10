-- ============================================================================
-- STRATEGIC PLANNING & EXECUTION EVALUATION MIGRATIONS
-- Apply this SQL in Supabase SQL Editor
-- ============================================================================

-- Migration 1: Add strategic planning fields to sailor_race_preparation
-- ============================================================================

DO $$
BEGIN
  -- Add strategy planning columns
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS rig_tuning_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS prestart_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS start_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS upwind_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS windward_mark_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS downwind_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS leeward_mark_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS finish_strategy TEXT;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS ai_strategy_suggestions JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS shared_with_coach BOOLEAN DEFAULT false;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS coach_id UUID;
  ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;

  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sailor_race_preparation_coach_id_fkey'
    AND table_name = 'sailor_race_preparation'
  ) THEN
    ALTER TABLE public.sailor_race_preparation
    ADD CONSTRAINT sailor_race_preparation_coach_id_fkey
    FOREIGN KEY (coach_id) REFERENCES public.coach_profiles(id) ON DELETE SET NULL;
  END IF;

  -- Create indexes for coach lookups
  CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_coach_id
    ON public.sailor_race_preparation(coach_id)
    WHERE coach_id IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_shared
    ON public.sailor_race_preparation(coach_id, shared_with_coach, shared_at)
    WHERE shared_with_coach = true;

  RAISE NOTICE '✅ Strategy planning fields added to sailor_race_preparation';
END $$;

-- Migration 2: Add execution evaluation fields to race_analysis
-- ============================================================================

DO $$
BEGIN
  -- Link to preparation plan
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS preparation_id UUID;

  -- Execution ratings (1-5)
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS rig_tuning_execution_rating INT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS prestart_execution_rating INT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS start_execution_rating INT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS upwind_execution_rating INT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS windward_mark_execution_rating INT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS downwind_execution_rating INT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS leeward_mark_execution_rating INT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS finish_execution_rating INT;

  -- Execution notes (what actually happened)
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS rig_tuning_execution_notes TEXT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS prestart_execution_notes TEXT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS start_execution_notes TEXT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS upwind_execution_notes TEXT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS windward_mark_execution_notes TEXT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS downwind_execution_notes TEXT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS leeward_mark_execution_notes TEXT;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS finish_execution_notes TEXT;

  -- AI execution coaching
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS ai_execution_coaching JSONB DEFAULT '{}'::jsonb;

  -- Coach sharing for execution analysis
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_shared_with_coach BOOLEAN DEFAULT false;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_coach_id UUID;
  ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_shared_at TIMESTAMPTZ;

  -- Add foreign key constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'race_analysis_preparation_id_fkey'
    AND table_name = 'race_analysis'
  ) THEN
    ALTER TABLE public.race_analysis
    ADD CONSTRAINT race_analysis_preparation_id_fkey
    FOREIGN KEY (preparation_id) REFERENCES public.sailor_race_preparation(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'race_analysis_execution_coach_id_fkey'
    AND table_name = 'race_analysis'
  ) THEN
    ALTER TABLE public.race_analysis
    ADD CONSTRAINT race_analysis_execution_coach_id_fkey
    FOREIGN KEY (execution_coach_id) REFERENCES public.coach_profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add check constraints for rating values
  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS rig_tuning_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT rig_tuning_execution_rating_check
    CHECK (rig_tuning_execution_rating IS NULL OR (rig_tuning_execution_rating >= 1 AND rig_tuning_execution_rating <= 5));

  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS prestart_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT prestart_execution_rating_check
    CHECK (prestart_execution_rating IS NULL OR (prestart_execution_rating >= 1 AND prestart_execution_rating <= 5));

  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS start_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT start_execution_rating_check
    CHECK (start_execution_rating IS NULL OR (start_execution_rating >= 1 AND start_execution_rating <= 5));

  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS upwind_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT upwind_execution_rating_check
    CHECK (upwind_execution_rating IS NULL OR (upwind_execution_rating >= 1 AND upwind_execution_rating <= 5));

  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS windward_mark_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT windward_mark_execution_rating_check
    CHECK (windward_mark_execution_rating IS NULL OR (windward_mark_execution_rating >= 1 AND windward_mark_execution_rating <= 5));

  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS downwind_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT downwind_execution_rating_check
    CHECK (downwind_execution_rating IS NULL OR (downwind_execution_rating >= 1 AND downwind_execution_rating <= 5));

  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS leeward_mark_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT leeward_mark_execution_rating_check
    CHECK (leeward_mark_execution_rating IS NULL OR (leeward_mark_execution_rating >= 1 AND leeward_mark_execution_rating <= 5));

  ALTER TABLE public.race_analysis DROP CONSTRAINT IF EXISTS finish_execution_rating_check;
  ALTER TABLE public.race_analysis ADD CONSTRAINT finish_execution_rating_check
    CHECK (finish_execution_rating IS NULL OR (finish_execution_rating >= 1 AND finish_execution_rating <= 5));

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_race_analysis_preparation_id
    ON public.race_analysis(preparation_id)
    WHERE preparation_id IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_race_analysis_execution_coach_id
    ON public.race_analysis(execution_coach_id)
    WHERE execution_coach_id IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_race_analysis_execution_shared
    ON public.race_analysis(execution_coach_id, execution_shared_with_coach, execution_shared_at)
    WHERE execution_shared_with_coach = true;

  RAISE NOTICE '✅ Execution evaluation fields added to race_analysis';
END $$;

-- Add RLS policies
-- ============================================================================

-- Allow coaches to view shared race preparations
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

-- Allow coaches to view shared execution analyses
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

-- Add helpful comments
-- ============================================================================

COMMENT ON COLUMN public.sailor_race_preparation.rig_tuning_strategy IS
  'Sailor''s pre-race strategy for rig tuning based on forecasted conditions';
COMMENT ON COLUMN public.sailor_race_preparation.ai_strategy_suggestions IS
  'AI-generated strategy suggestions based on conditions, venue, and sailor''s learning profile';
COMMENT ON COLUMN public.sailor_race_preparation.shared_with_coach IS
  'Whether this preparation has been shared with the assigned coach';

COMMENT ON COLUMN public.race_analysis.preparation_id IS
  'Links to the pre-race preparation plan for plan-vs-execution comparison';
COMMENT ON COLUMN public.race_analysis.rig_tuning_execution_rating IS
  'How well did you execute your rig tuning strategy? (1=poorly, 5=perfectly)';
COMMENT ON COLUMN public.race_analysis.ai_execution_coaching IS
  'AI-generated coaching comparing planned strategy vs actual execution';
COMMENT ON COLUMN public.race_analysis.execution_shared_with_coach IS
  'Whether this execution analysis has been shared with the assigned coach';

-- Verify migrations
-- ============================================================================

SELECT
  'sailor_race_preparation' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'sailor_race_preparation'
AND column_name LIKE '%strategy%'
ORDER BY ordinal_position;

SELECT
  'race_analysis' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'race_analysis'
AND column_name LIKE '%execution%'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================================================';
  RAISE NOTICE '✅ MIGRATIONS APPLIED SUCCESSFULLY!';
  RAISE NOTICE '✅ ============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   • Added 8 strategic planning fields to sailor_race_preparation';
  RAISE NOTICE '   • Added 8 execution rating fields to race_analysis';
  RAISE NOTICE '   • Added 8 execution notes fields to race_analysis';
  RAISE NOTICE '   • Added AI suggestions and coaching fields';
  RAISE NOTICE '   • Added coach sharing fields';
  RAISE NOTICE '   • Created indexes for performance';
  RAISE NOTICE '   • Added RLS policies for coach access';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Ready to use the new strategic planning & execution evaluation features!';
  RAISE NOTICE '';
END $$;
