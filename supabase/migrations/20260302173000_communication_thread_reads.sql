-- =============================================================================
-- Communication Thread Read Tracking
--
-- Canonical ownership:
-- - Owns `communication_thread_reads` table, indexes, policies, and
--   `updated_at` trigger wiring.
-- Override intent:
-- - None; this migration is the canonical owner for these symbols in the
--   20260302 lane.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.communication_thread_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_communication_thread_reads_org_user
  ON public.communication_thread_reads(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_communication_thread_reads_thread_user
  ON public.communication_thread_reads(thread_id, user_id);

ALTER TABLE public.communication_thread_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communication_thread_reads_select_own" ON public.communication_thread_reads;
CREATE POLICY "communication_thread_reads_select_own"
  ON public.communication_thread_reads FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.is_active_org_member(organization_id)
  );

DROP POLICY IF EXISTS "communication_thread_reads_insert_own" ON public.communication_thread_reads;
CREATE POLICY "communication_thread_reads_insert_own"
  ON public.communication_thread_reads FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_org_member(organization_id)
  );

DROP POLICY IF EXISTS "communication_thread_reads_update_own" ON public.communication_thread_reads;
CREATE POLICY "communication_thread_reads_update_own"
  ON public.communication_thread_reads FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.is_active_org_member(organization_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_org_member(organization_id)
  );

DROP POLICY IF EXISTS "communication_thread_reads_delete_own_or_admin" ON public.communication_thread_reads;
CREATE POLICY "communication_thread_reads_delete_own_or_admin"
  ON public.communication_thread_reads FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[])
  );

DROP TRIGGER IF EXISTS trigger_communication_thread_reads_updated_at ON public.communication_thread_reads;
CREATE TRIGGER trigger_communication_thread_reads_updated_at
  BEFORE UPDATE ON public.communication_thread_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

COMMIT;
