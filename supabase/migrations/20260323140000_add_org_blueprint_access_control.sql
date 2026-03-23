-- Migration: Add organization-scoped blueprints with access control
--
-- Allows blueprints to be published under an organization (not just individual),
-- and gates subscription access by membership level.

-- =============================================================================
-- ADD COLUMNS
-- =============================================================================

ALTER TABLE timeline_blueprints
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'public';

-- Add CHECK constraint for access_level
ALTER TABLE timeline_blueprints
  ADD CONSTRAINT timeline_blueprints_access_level_check
  CHECK (access_level IN ('public', 'org_members', 'paid'));

-- =============================================================================
-- REPLACE UNIQUE CONSTRAINT WITH PARTIAL INDEXES
-- =============================================================================

-- Drop the old one-blueprint-per-user-per-interest constraint
ALTER TABLE timeline_blueprints
  DROP CONSTRAINT IF EXISTS timeline_blueprints_user_id_interest_id_key;

-- Individual blueprints: one per user per interest (no org)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blueprint_user_interest_individual
  ON timeline_blueprints(user_id, interest_id)
  WHERE organization_id IS NULL;

-- Org blueprints: one per user per interest per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_blueprint_user_interest_org
  ON timeline_blueprints(user_id, interest_id, organization_id)
  WHERE organization_id IS NOT NULL;

-- Org lookup index
CREATE INDEX IF NOT EXISTS idx_blueprints_org
  ON timeline_blueprints(organization_id)
  WHERE organization_id IS NOT NULL;

-- =============================================================================
-- UPDATE RLS POLICIES
-- =============================================================================

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Published blueprints are viewable by all" ON timeline_blueprints;

-- New SELECT: public blueprints visible to all, org_members/paid require membership
CREATE POLICY "Published blueprints viewable with access check"
  ON timeline_blueprints FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_published = true
      AND (
        access_level = 'public'
        OR (access_level IN ('org_members', 'paid') AND public.is_org_active_member(organization_id))
      )
    )
  );

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Users manage own blueprints" ON timeline_blueprints;

-- New INSERT: must be org member to publish under an org
CREATE POLICY "Users insert own blueprints"
  ON timeline_blueprints FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR public.is_org_active_member(organization_id)
    )
  );

-- =============================================================================
-- SUBSCRIPTION GATING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.can_subscribe_to_blueprint(p_blueprint_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_level text;
  v_org_id uuid;
  v_is_published boolean;
BEGIN
  SELECT access_level, organization_id, is_published
  INTO v_access_level, v_org_id, v_is_published
  FROM timeline_blueprints
  WHERE id = p_blueprint_id;

  IF NOT FOUND OR NOT v_is_published THEN RETURN false; END IF;
  IF v_access_level = 'public' THEN RETURN true; END IF;
  IF v_access_level IN ('org_members', 'paid') THEN
    RETURN is_org_active_member(v_org_id);
  END IF;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_subscribe_to_blueprint(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_subscribe_to_blueprint(uuid) TO authenticated;

-- Update subscription INSERT policy to enforce access gating
DROP POLICY IF EXISTS "Subscribe to blueprints" ON blueprint_subscriptions;

CREATE POLICY "Subscribe to blueprints"
  ON blueprint_subscriptions FOR INSERT
  WITH CHECK (
    subscriber_id = auth.uid()
    AND public.can_subscribe_to_blueprint(blueprint_id)
  );

-- =============================================================================
-- RPC: Get access info for a blueprint by slug (even if RLS blocks full data)
-- Used by the landing page to show "members only" messaging
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_blueprint_access_info(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'exists', true,
    'access_level', tb.access_level,
    'is_published', tb.is_published,
    'org_id', tb.organization_id,
    'org_name', o.name,
    'org_slug', o.slug,
    'title', tb.title
  )
  INTO v_result
  FROM timeline_blueprints tb
  LEFT JOIN organizations o ON o.id = tb.organization_id
  WHERE tb.slug = p_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_blueprint_access_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_blueprint_access_info(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_blueprint_access_info(text) TO anon;
