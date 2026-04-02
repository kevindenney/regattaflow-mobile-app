-- Migration: Blueprint Pricing
-- Enables creators to set prices on blueprints and tracks purchases.

-- =============================================================================
-- ADD PRICING COLUMNS TO timeline_blueprints
-- =============================================================================

ALTER TABLE timeline_blueprints
  ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd';

-- =============================================================================
-- CREATE blueprint_purchases TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS blueprint_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES timeline_blueprints(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blueprint_id, buyer_id)
);

ALTER TABLE blueprint_purchases ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own purchases
CREATE POLICY "Users view own purchases"
  ON blueprint_purchases FOR SELECT
  USING (buyer_id = auth.uid());

-- SECURITY DEFINER function to check blueprint ownership without RLS recursion
-- MUST use plpgsql (not sql) to prevent function inlining, which would
-- expose the cross-table reference and trigger PostgreSQL's recursion detection.
CREATE OR REPLACE FUNCTION public.is_blueprint_owner(p_blueprint_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM timeline_blueprints
    WHERE id = p_blueprint_id AND user_id = auth.uid()
  );
END;
$$;

-- Blueprint owners can see purchases of their blueprints
CREATE POLICY "Blueprint owners view purchases"
  ON blueprint_purchases FOR SELECT
  USING (public.is_blueprint_owner(blueprint_id));

-- Only service role can insert/update (webhook creates rows)
CREATE POLICY "Service role manages purchases"
  ON blueprint_purchases FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blueprint_purchases_buyer
  ON blueprint_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_purchases_blueprint
  ON blueprint_purchases(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_purchases_status
  ON blueprint_purchases(blueprint_id, status);

-- =============================================================================
-- UPDATE can_subscribe_to_blueprint() TO CHECK PURCHASES
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
  v_has_purchase boolean;
BEGIN
  SELECT access_level, organization_id, is_published
  INTO v_access_level, v_org_id, v_is_published
  FROM timeline_blueprints
  WHERE id = p_blueprint_id;

  IF NOT FOUND OR NOT v_is_published THEN RETURN false; END IF;
  IF v_access_level = 'public' THEN RETURN true; END IF;
  IF v_access_level = 'org_members' THEN
    RETURN is_org_active_member(v_org_id);
  END IF;
  IF v_access_level = 'paid' THEN
    -- Allow if org member (free access for org members)
    IF v_org_id IS NOT NULL AND is_org_active_member(v_org_id) THEN
      RETURN true;
    END IF;
    -- Allow if user has completed purchase
    SELECT EXISTS (
      SELECT 1 FROM blueprint_purchases
      WHERE blueprint_id = p_blueprint_id
        AND buyer_id = auth.uid()
        AND status = 'completed'
    ) INTO v_has_purchase;
    RETURN v_has_purchase;
  END IF;
  RETURN false;
END;
$$;

-- =============================================================================
-- UPDATE RLS: Allow paid blueprints to be visible to purchasers
-- Uses SECURITY DEFINER function to avoid RLS recursion between
-- timeline_blueprints and blueprint_purchases policies.
-- =============================================================================

-- MUST use plpgsql (not sql) to prevent function inlining — same reason as is_blueprint_owner.
CREATE OR REPLACE FUNCTION public.has_blueprint_purchase(p_blueprint_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blueprint_purchases
    WHERE blueprint_id = p_blueprint_id
      AND buyer_id = auth.uid()
      AND status = 'completed'
  );
END;
$$;

DROP POLICY IF EXISTS "Published blueprints viewable with access check" ON timeline_blueprints;

CREATE POLICY "Published blueprints viewable with access check"
  ON timeline_blueprints FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_published = true
      AND (
        access_level = 'public'
        OR (access_level = 'org_members' AND public.is_org_active_member(organization_id))
        OR (access_level = 'paid' AND (
          public.is_org_active_member(organization_id)
          OR public.has_blueprint_purchase(id)
        ))
      )
    )
  );

-- =============================================================================
-- UPDATE get_blueprint_access_info() TO INCLUDE PRICE
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
    'title', tb.title,
    'price_cents', tb.price_cents,
    'currency', tb.currency
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
