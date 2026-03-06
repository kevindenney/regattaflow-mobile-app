-- Org-published step templates for Timeline "Create New" recommendations (Org/Admin V1)

CREATE TABLE IF NOT EXISTS public.betterat_org_step_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  interest_slug text NOT NULL,
  title text NOT NULL,
  description text,
  step_type text NOT NULL,
  module_ids text[] NOT NULL DEFAULT '{}'::text[],
  suggested_competency_ids text[] NOT NULL DEFAULT '{}'::text[],
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_betterat_org_step_templates_org_interest_published
  ON public.betterat_org_step_templates(org_id, interest_slug, is_published);

ALTER TABLE public.betterat_org_step_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- SELECT policy: prefer org-member check when helper exists; fallback to authenticated-only access.
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'is_active_org_member'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "org_step_templates_select" ON public.betterat_org_step_templates';
    EXECUTE $policy$
      CREATE POLICY "org_step_templates_select"
        ON public.betterat_org_step_templates
        FOR SELECT
        TO authenticated
        USING (public.is_active_org_member(org_id))
    $policy$;
  ELSE
    -- TODO: tighten once org membership helper is guaranteed in every environment.
    EXECUTE 'DROP POLICY IF EXISTS "org_step_templates_select" ON public.betterat_org_step_templates';
    EXECUTE $policy$
      CREATE POLICY "org_step_templates_select"
        ON public.betterat_org_step_templates
        FOR SELECT
        TO authenticated
        USING (true)
    $policy$;
  END IF;

  -- INSERT/UPDATE policy: prefer org-role helper; fallback keeps writes service-role only.
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'has_org_role'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "org_step_templates_insert_admin" ON public.betterat_org_step_templates';
    EXECUTE $policy$
      CREATE POLICY "org_step_templates_insert_admin"
        ON public.betterat_org_step_templates
        FOR INSERT
        TO authenticated
        WITH CHECK (
          public.has_org_role(org_id, ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor']::text[])
        )
    $policy$;

    EXECUTE 'DROP POLICY IF EXISTS "org_step_templates_update_admin" ON public.betterat_org_step_templates';
    EXECUTE $policy$
      CREATE POLICY "org_step_templates_update_admin"
        ON public.betterat_org_step_templates
        FOR UPDATE
        TO authenticated
        USING (
          public.has_org_role(org_id, ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor']::text[])
        )
        WITH CHECK (
          public.has_org_role(org_id, ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor']::text[])
        )
    $policy$;
  ELSE
    -- TODO: enable admin writes when org-role helper is available in all environments.
    EXECUTE 'DROP POLICY IF EXISTS "org_step_templates_insert_admin" ON public.betterat_org_step_templates';
    EXECUTE $policy$
      CREATE POLICY "org_step_templates_insert_admin"
        ON public.betterat_org_step_templates
        FOR INSERT
        TO authenticated
        WITH CHECK (false)
    $policy$;

    EXECUTE 'DROP POLICY IF EXISTS "org_step_templates_update_admin" ON public.betterat_org_step_templates';
    EXECUTE $policy$
      CREATE POLICY "org_step_templates_update_admin"
        ON public.betterat_org_step_templates
        FOR UPDATE
        TO authenticated
        USING (false)
        WITH CHECK (false)
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'update_updated_at_column'
      AND n.nspname = 'public'
  ) THEN
    DROP TRIGGER IF EXISTS update_betterat_org_step_templates_updated_at ON public.betterat_org_step_templates;
    CREATE TRIGGER update_betterat_org_step_templates_updated_at
      BEFORE UPDATE ON public.betterat_org_step_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
