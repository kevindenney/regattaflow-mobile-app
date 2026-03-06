-- Coach review request queue for module artifacts (Milestone 3A)

CREATE TABLE IF NOT EXISTS public.betterat_artifact_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.betterat_module_artifacts(artifact_id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  coach_user_id uuid,
  org_id uuid,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'in_review', 'completed', 'cancelled')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_betterat_artifact_review_requests_coach_status_created
  ON public.betterat_artifact_review_requests(coach_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_betterat_artifact_review_requests_requester_created
  ON public.betterat_artifact_review_requests(requester_user_id, created_at DESC);

ALTER TABLE public.betterat_artifact_review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artifact_review_requests_requester_select" ON public.betterat_artifact_review_requests;
CREATE POLICY "artifact_review_requests_requester_select"
  ON public.betterat_artifact_review_requests
  FOR SELECT
  TO authenticated
  USING (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "artifact_review_requests_requester_insert" ON public.betterat_artifact_review_requests;
CREATE POLICY "artifact_review_requests_requester_insert"
  ON public.betterat_artifact_review_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "artifact_review_requests_coach_select" ON public.betterat_artifact_review_requests;
CREATE POLICY "artifact_review_requests_coach_select"
  ON public.betterat_artifact_review_requests
  FOR SELECT
  TO authenticated
  USING (coach_user_id = auth.uid());

DROP POLICY IF EXISTS "artifact_review_requests_coach_update" ON public.betterat_artifact_review_requests;
CREATE POLICY "artifact_review_requests_coach_update"
  ON public.betterat_artifact_review_requests
  FOR UPDATE
  TO authenticated
  USING (coach_user_id = auth.uid())
  WITH CHECK (coach_user_id = auth.uid());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'update_updated_at_column'
      AND n.nspname = 'public'
  ) THEN
    DROP TRIGGER IF EXISTS update_betterat_artifact_review_requests_updated_at ON public.betterat_artifact_review_requests;
    CREATE TRIGGER update_betterat_artifact_review_requests_updated_at
      BEFORE UPDATE ON public.betterat_artifact_review_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
