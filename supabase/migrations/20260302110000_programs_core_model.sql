-- =============================================================================
-- Programs Core Model (Cross-domain)
--
-- Canonical ownership:
-- - Owns baseline cross-domain programs primitives: programs, sessions,
--   participants, assessments, communication, templates, and domain catalog.
-- Override intent:
-- - Provides baseline `assessment_records_select_org_members`; final scoped
--   institutional/non-institution SELECT behavior is owned by
--   `20260302203000_harden_assessment_records_select_rls.sql`.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Programs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain text NOT NULL DEFAULT 'generic'
    CHECK (domain IN ('sailing', 'nursing', 'drawing', 'fitness', 'generic')),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'program',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'planned', 'active', 'completed', 'cancelled', 'archived')),
  start_at timestamptz,
  end_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_org ON public.programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_programs_domain ON public.programs(domain);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_time ON public.programs(start_at, end_at);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_select_org_members" ON public.programs;
CREATE POLICY "programs_select_org_members"
  ON public.programs FOR SELECT
  TO authenticated
  USING (public.is_active_org_member(organization_id));

DROP POLICY IF EXISTS "programs_insert_org_managers" ON public.programs;
CREATE POLICY "programs_insert_org_managers"
  ON public.programs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
    )
  );

DROP POLICY IF EXISTS "programs_update_org_managers" ON public.programs;
CREATE POLICY "programs_update_org_managers"
  ON public.programs FOR UPDATE
  TO authenticated
  USING (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
    )
  )
  WITH CHECK (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
    )
  );

DROP POLICY IF EXISTS "programs_delete_org_admins" ON public.programs;
CREATE POLICY "programs_delete_org_admins"
  ON public.programs FOR DELETE
  TO authenticated
  USING (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager']::text[]
    )
  );

-- -----------------------------------------------------------------------------
-- 2) Program Sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_type text NOT NULL DEFAULT 'session',
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'live', 'completed', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_sessions_program ON public.program_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_org ON public.program_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_time ON public.program_sessions(starts_at, ends_at);

ALTER TABLE public.program_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_sessions_select_org_members" ON public.program_sessions;
CREATE POLICY "program_sessions_select_org_members"
  ON public.program_sessions FOR SELECT
  TO authenticated
  USING (public.is_active_org_member(organization_id));

DROP POLICY IF EXISTS "program_sessions_insert_org_managers" ON public.program_sessions;
CREATE POLICY "program_sessions_insert_org_managers"
  ON public.program_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
    )
  );

DROP POLICY IF EXISTS "program_sessions_update_org_managers" ON public.program_sessions;
CREATE POLICY "program_sessions_update_org_managers"
  ON public.program_sessions FOR UPDATE
  TO authenticated
  USING (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
    )
  )
  WITH CHECK (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
    )
  );

DROP POLICY IF EXISTS "program_sessions_delete_org_admins" ON public.program_sessions;
CREATE POLICY "program_sessions_delete_org_admins"
  ON public.program_sessions FOR DELETE
  TO authenticated
  USING (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager']::text[]
    )
  );

-- -----------------------------------------------------------------------------
-- 3) Program Participants
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.program_sessions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text,
  email text,
  role text NOT NULL DEFAULT 'learner'
    CHECK (role IN (
      'learner', 'student', 'member',
      'coach', 'faculty', 'instructor', 'preceptor', 'tutor',
      'coordinator', 'manager', 'observer', 'staff'
    )),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'completed', 'withdrawn', 'inactive')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_program_participants_org ON public.program_participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_program ON public.program_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_session ON public.program_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_user ON public.program_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_role ON public.program_participants(role);

ALTER TABLE public.program_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_participants_select_org_members" ON public.program_participants;
CREATE POLICY "program_participants_select_org_members"
  ON public.program_participants FOR SELECT
  TO authenticated
  USING (
    public.is_active_org_member(organization_id)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "program_participants_insert_org_managers" ON public.program_participants;
CREATE POLICY "program_participants_insert_org_managers"
  ON public.program_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]
    )
  );

DROP POLICY IF EXISTS "program_participants_update_org_managers_or_self" ON public.program_participants;
CREATE POLICY "program_participants_update_org_managers_or_self"
  ON public.program_participants FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]
    )
  );

DROP POLICY IF EXISTS "program_participants_delete_org_admins" ON public.program_participants;
CREATE POLICY "program_participants_delete_org_admins"
  ON public.program_participants FOR DELETE
  TO authenticated
  USING (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager']::text[]
    )
  );

-- -----------------------------------------------------------------------------
-- 4) Assessment Records
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.program_sessions(id) ON DELETE SET NULL,
  participant_id uuid REFERENCES public.program_participants(id) ON DELETE SET NULL,
  competency_id uuid REFERENCES public.betterat_competencies(id) ON DELETE SET NULL,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric(5, 2),
  rubric_level text,
  notes text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'reviewed', 'finalized')),
  assessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_records_org ON public.assessment_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessment_records_program ON public.assessment_records(program_id);
CREATE INDEX IF NOT EXISTS idx_assessment_records_session ON public.assessment_records(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_records_participant ON public.assessment_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_assessment_records_evaluator ON public.assessment_records(evaluator_id);

ALTER TABLE public.assessment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_records_select_org_members" ON public.assessment_records;
CREATE POLICY "assessment_records_select_org_members"
  ON public.assessment_records FOR SELECT
  TO authenticated
  USING (
    public.is_active_org_member(organization_id)
    OR evaluator_id = auth.uid()
  );

DROP POLICY IF EXISTS "assessment_records_insert_staff" ON public.assessment_records;
CREATE POLICY "assessment_records_insert_staff"
  ON public.assessment_records FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid()
    AND public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'tutor']::text[]
    )
  );

DROP POLICY IF EXISTS "assessment_records_update_staff_or_evaluator" ON public.assessment_records;
CREATE POLICY "assessment_records_update_staff_or_evaluator"
  ON public.assessment_records FOR UPDATE
  TO authenticated
  USING (
    evaluator_id = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor']::text[]
    )
  )
  WITH CHECK (
    evaluator_id = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor']::text[]
    )
  );

DROP POLICY IF EXISTS "assessment_records_delete_admins" ON public.assessment_records;
CREATE POLICY "assessment_records_delete_admins"
  ON public.assessment_records FOR DELETE
  TO authenticated
  USING (
    public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager']::text[]
    )
  );

-- -----------------------------------------------------------------------------
-- 5) Communication Threads + Messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.program_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  thread_type text NOT NULL DEFAULT 'announcement'
    CHECK (thread_type IN ('announcement', 'discussion', 'support', 'coordination')),
  visibility text NOT NULL DEFAULT 'org_members'
    CHECK (visibility IN ('org_members', 'program_participants', 'private_staff')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_archived boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_threads_org ON public.communication_threads(organization_id);
CREATE INDEX IF NOT EXISTS idx_communication_threads_program ON public.communication_threads(program_id);
CREATE INDEX IF NOT EXISTS idx_communication_threads_session ON public.communication_threads(session_id);

ALTER TABLE public.communication_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communication_threads_select_org_members" ON public.communication_threads;
CREATE POLICY "communication_threads_select_org_members"
  ON public.communication_threads FOR SELECT
  TO authenticated
  USING (public.is_active_org_member(organization_id));

DROP POLICY IF EXISTS "communication_threads_insert_staff" ON public.communication_threads;
CREATE POLICY "communication_threads_insert_staff"
  ON public.communication_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]
    )
  );

DROP POLICY IF EXISTS "communication_threads_update_staff" ON public.communication_threads;
CREATE POLICY "communication_threads_update_staff"
  ON public.communication_threads FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[])
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[])
  );

DROP POLICY IF EXISTS "communication_threads_delete_admins" ON public.communication_threads;
CREATE POLICY "communication_threads_delete_admins"
  ON public.communication_threads FOR DELETE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[]));

CREATE TABLE IF NOT EXISTS public.communication_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_messages_thread ON public.communication_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_communication_messages_org ON public.communication_messages(organization_id);

ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communication_messages_select_org_members" ON public.communication_messages;
CREATE POLICY "communication_messages_select_org_members"
  ON public.communication_messages FOR SELECT
  TO authenticated
  USING (public.is_active_org_member(organization_id));

DROP POLICY IF EXISTS "communication_messages_insert_org_members" ON public.communication_messages;
CREATE POLICY "communication_messages_insert_org_members"
  ON public.communication_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_active_org_member(organization_id)
  );

DROP POLICY IF EXISTS "communication_messages_delete_admins_or_sender" ON public.communication_messages;
CREATE POLICY "communication_messages_delete_admins_or_sender"
  ON public.communication_messages FOR DELETE
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[])
  );

-- -----------------------------------------------------------------------------
-- 6) Templates + Domain Catalog
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain text NOT NULL DEFAULT 'generic'
    CHECK (domain IN ('sailing', 'nursing', 'drawing', 'fitness', 'generic')),
  template_type text NOT NULL DEFAULT 'program'
    CHECK (template_type IN ('program', 'session', 'checklist', 'assessment', 'message')),
  title text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_templates_org ON public.program_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_templates_domain ON public.program_templates(domain);
CREATE INDEX IF NOT EXISTS idx_program_templates_type ON public.program_templates(template_type);

ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_templates_select_visible" ON public.program_templates;
CREATE POLICY "program_templates_select_visible"
  ON public.program_templates FOR SELECT
  TO authenticated
  USING (
    is_shared = true
    OR (
      organization_id IS NOT NULL
      AND public.is_active_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "program_templates_insert_staff" ON public.program_templates;
CREATE POLICY "program_templates_insert_staff"
  ON public.program_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      organization_id IS NULL
      AND created_by = auth.uid()
    )
    OR (
      organization_id IS NOT NULL
      AND created_by = auth.uid()
      AND public.has_org_role(
        organization_id,
        ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]
      )
    )
  );

DROP POLICY IF EXISTS "program_templates_update_staff" ON public.program_templates;
CREATE POLICY "program_templates_update_staff"
  ON public.program_templates FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[])
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[])
    )
  );

DROP POLICY IF EXISTS "program_templates_delete_staff" ON public.program_templates;
CREATE POLICY "program_templates_delete_staff"
  ON public.program_templates FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']::text[])
    )
  );

CREATE TABLE IF NOT EXISTS public.domain_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL
    CHECK (domain IN ('sailing', 'nursing', 'drawing', 'fitness', 'generic')),
  catalog_type text NOT NULL DEFAULT 'label'
    CHECK (catalog_type IN ('label', 'role', 'template', 'metric', 'action')),
  key text NOT NULL,
  value text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain, catalog_type, key)
);

CREATE INDEX IF NOT EXISTS idx_domain_catalog_domain_type ON public.domain_catalog(domain, catalog_type);

ALTER TABLE public.domain_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "domain_catalog_read_all" ON public.domain_catalog;
CREATE POLICY "domain_catalog_read_all"
  ON public.domain_catalog FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "domain_catalog_write_admin_only" ON public.domain_catalog;
CREATE POLICY "domain_catalog_write_admin_only"
  ON public.domain_catalog FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      JOIN public.organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND om.status IN ('active', 'verified')
        AND om.role IN ('owner', 'admin')
        AND o.organization_type = 'institution'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      JOIN public.organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND om.status IN ('active', 'verified')
        AND om.role IN ('owner', 'admin')
        AND o.organization_type = 'institution'
    )
  );

-- -----------------------------------------------------------------------------
-- 7) Updated-at trigger helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_programs_core_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_programs_updated_at ON public.programs;
CREATE TRIGGER trigger_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

DROP TRIGGER IF EXISTS trigger_program_sessions_updated_at ON public.program_sessions;
CREATE TRIGGER trigger_program_sessions_updated_at
  BEFORE UPDATE ON public.program_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

DROP TRIGGER IF EXISTS trigger_program_participants_updated_at ON public.program_participants;
CREATE TRIGGER trigger_program_participants_updated_at
  BEFORE UPDATE ON public.program_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

DROP TRIGGER IF EXISTS trigger_assessment_records_updated_at ON public.assessment_records;
CREATE TRIGGER trigger_assessment_records_updated_at
  BEFORE UPDATE ON public.assessment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

DROP TRIGGER IF EXISTS trigger_communication_threads_updated_at ON public.communication_threads;
CREATE TRIGGER trigger_communication_threads_updated_at
  BEFORE UPDATE ON public.communication_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

DROP TRIGGER IF EXISTS trigger_program_templates_updated_at ON public.program_templates;
CREATE TRIGGER trigger_program_templates_updated_at
  BEFORE UPDATE ON public.program_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

DROP TRIGGER IF EXISTS trigger_domain_catalog_updated_at ON public.domain_catalog;
CREATE TRIGGER trigger_domain_catalog_updated_at
  BEFORE UPDATE ON public.domain_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_programs_core_updated_at();

COMMIT;
