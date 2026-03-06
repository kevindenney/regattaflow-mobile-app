-- Add optional artifact linkage fields to competency attempts (only if missing)
ALTER TABLE public.betterat_competency_attempts
  ADD COLUMN IF NOT EXISTS artifact_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'unvalidated';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'betterat_comp_attempts_artifact_id_fkey'
      AND conrelid = 'public.betterat_competency_attempts'::regclass
  ) THEN
    ALTER TABLE public.betterat_competency_attempts
      ADD CONSTRAINT betterat_comp_attempts_artifact_id_fkey
      FOREIGN KEY (artifact_id)
      REFERENCES public.betterat_module_artifacts(artifact_id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.betterat_module_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.betterat_module_artifacts(artifact_id) ON DELETE CASCADE,
  evaluator text NOT NULL,
  model text,
  prompt_version text NOT NULL DEFAULT 'v1',
  rubric_version text NOT NULL DEFAULT 'v1',
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT betterat_module_evaluations_artifact_prompt_rubric_unique
    UNIQUE (artifact_id, prompt_version, rubric_version)
);

CREATE INDEX IF NOT EXISTS idx_betterat_module_evaluations_artifact
  ON public.betterat_module_evaluations(artifact_id);

ALTER TABLE public.betterat_module_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own module evaluations" ON public.betterat_module_evaluations;
CREATE POLICY "Users can select own module evaluations"
  ON public.betterat_module_evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.betterat_module_artifacts a
      WHERE a.artifact_id = betterat_module_evaluations.artifact_id
        AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own module evaluations" ON public.betterat_module_evaluations;
CREATE POLICY "Users can insert own module evaluations"
  ON public.betterat_module_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.betterat_module_artifacts a
      WHERE a.artifact_id = betterat_module_evaluations.artifact_id
        AND a.user_id = auth.uid()
    )
  );
