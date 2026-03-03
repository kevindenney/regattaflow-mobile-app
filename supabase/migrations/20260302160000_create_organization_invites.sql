-- =============================================================================
-- Organization Invites Audit Trail
--
-- Canonical ownership:
-- - Owns `organization_invites` table, indexes, select/delete policies, and
--   staged base invite insert/update policies.
-- Override intent:
-- - `organization_invites_insert_org_staff_base_v1` and
--   `organization_invites_update_org_staff_base_v1` are staging symbols and
--   are superseded by later hardening migrations.
-- Compatibility:
-- - `_base_v1` policy names are retained here to keep merge history explicit.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.program_sessions(id) ON DELETE SET NULL,
  participant_id uuid REFERENCES public.program_participants(id) ON DELETE SET NULL,
  invitee_name text,
  invitee_email text,
  role_label text NOT NULL,
  channel text NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'sms', 'link')),
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'sent', 'opened', 'accepted', 'declined', 'revoked', 'failed')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz,
  responded_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_invites_org ON public.organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_program ON public.organization_invites(program_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_participant ON public.organization_invites(participant_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_status ON public.organization_invites(status);
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON public.organization_invites(invitee_email);

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organization_invites_select_org_members" ON public.organization_invites;
CREATE POLICY "organization_invites_select_org_members"
  ON public.organization_invites FOR SELECT
  TO authenticated
  USING (public.is_active_org_member(organization_id));

DROP POLICY IF EXISTS "organization_invites_insert_org_staff" ON public.organization_invites;
DROP POLICY IF EXISTS "organization_invites_insert_org_staff_base_v1" ON public.organization_invites;
CREATE POLICY "organization_invites_insert_org_staff_base_v1"
  ON public.organization_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator', 'faculty', 'instructor', 'preceptor', 'coach', 'tutor']::text[]
    )
  );

DROP POLICY IF EXISTS "organization_invites_update_org_staff" ON public.organization_invites;
DROP POLICY IF EXISTS "organization_invites_update_org_staff_base_v1" ON public.organization_invites;
CREATE POLICY "organization_invites_update_org_staff_base_v1"
  ON public.organization_invites FOR UPDATE
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
  )
  WITH CHECK (
    invited_by = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
  );

DROP POLICY IF EXISTS "organization_invites_delete_admins" ON public.organization_invites;
CREATE POLICY "organization_invites_delete_admins"
  ON public.organization_invites FOR DELETE
  TO authenticated
  USING (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager']::text[]
    )
  );

DROP TRIGGER IF EXISTS trigger_organization_invites_updated_at ON public.organization_invites;
CREATE TRIGGER trigger_organization_invites_updated_at
  BEFORE UPDATE ON public.organization_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

COMMIT;
