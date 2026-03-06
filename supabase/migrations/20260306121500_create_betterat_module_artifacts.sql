-- Create or align persisted module artifacts for BetterAt nursing modules.
-- This migration is idempotent and also upgrades earlier table variants.

CREATE TABLE IF NOT EXISTS public.betterat_module_artifacts (
  artifact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  module_id text NOT NULL,
  artifact_version int NOT NULL DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT betterat_module_artifacts_event_type_check
    CHECK (event_type IN ('regatta', 'race_event', 'timeline_step')),
  CONSTRAINT betterat_module_artifacts_event_scope_version_unique
    UNIQUE (event_type, event_id, user_id, module_id, artifact_version)
);

-- Align existing installations that may have been created without event_type.
ALTER TABLE public.betterat_module_artifacts
  ADD COLUMN IF NOT EXISTS event_type text;

ALTER TABLE public.betterat_module_artifacts
  ALTER COLUMN event_type SET DEFAULT 'timeline_step';

UPDATE public.betterat_module_artifacts
SET event_type = 'timeline_step'
WHERE event_type IS NULL;

ALTER TABLE public.betterat_module_artifacts
  ALTER COLUMN event_type SET NOT NULL;

ALTER TABLE public.betterat_module_artifacts
  ALTER COLUMN event_type DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'betterat_module_artifacts_event_type_check'
      AND conrelid = 'public.betterat_module_artifacts'::regclass
  ) THEN
    ALTER TABLE public.betterat_module_artifacts
      ADD CONSTRAINT betterat_module_artifacts_event_type_check
      CHECK (event_type IN ('regatta', 'race_event', 'timeline_step'));
  END IF;
END
$$;

-- Replace legacy unique constraints with the required scoped unique constraint.
DO $$
DECLARE
  existing_constraint record;
BEGIN
  FOR existing_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.betterat_module_artifacts'::regclass
      AND contype = 'u'
      AND conname <> 'betterat_module_artifacts_event_scope_version_unique'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.betterat_module_artifacts DROP CONSTRAINT IF EXISTS %I',
      existing_constraint.conname
    );
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'betterat_module_artifacts_event_scope_version_unique'
      AND conrelid = 'public.betterat_module_artifacts'::regclass
  ) THEN
    ALTER TABLE public.betterat_module_artifacts
      ADD CONSTRAINT betterat_module_artifacts_event_scope_version_unique
      UNIQUE (event_type, event_id, user_id, module_id, artifact_version);
  END IF;
END
$$;

ALTER TABLE public.betterat_module_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own module artifacts" ON public.betterat_module_artifacts;
CREATE POLICY "Users can select own module artifacts"
  ON public.betterat_module_artifacts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own module artifacts" ON public.betterat_module_artifacts;
CREATE POLICY "Users can insert own module artifacts"
  ON public.betterat_module_artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own module artifacts" ON public.betterat_module_artifacts;
CREATE POLICY "Users can update own module artifacts"
  ON public.betterat_module_artifacts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reuse shared updated_at trigger function if present in this project.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'update_updated_at_column'
      AND n.nspname = 'public'
  ) THEN
    DROP TRIGGER IF EXISTS update_betterat_module_artifacts_updated_at ON public.betterat_module_artifacts;
    CREATE TRIGGER update_betterat_module_artifacts_updated_at
      BEFORE UPDATE ON public.betterat_module_artifacts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
