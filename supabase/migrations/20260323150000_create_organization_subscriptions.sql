-- Organization Subscriptions Table
-- Supports institutional pricing: Starter ($500/yr), Department ($15/seat/yr), Enterprise (custom)

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('starter', 'department', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  seat_count INTEGER NOT NULL DEFAULT 25,
  member_tier TEXT NOT NULL DEFAULT 'individual'
    CHECK (member_tier IN ('individual', 'pro')),
  billing_period TEXT DEFAULT 'annual',
  amount INTEGER, -- cents
  currency TEXT DEFAULT 'usd',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- RLS: org admins can read their own subscription
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view their subscription"
  ON organization_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organization_subscriptions.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
    AND om.status IN ('active', 'verified')
  ));

-- Add tier_source column to users table
-- Distinguishes self-paid vs org-provided vs trial tiers
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_source TEXT
  DEFAULT 'self' CHECK (tier_source IN ('self', 'organization', 'trial'));

-- Trigger: sync member tiers when org subscription changes
CREATE OR REPLACE FUNCTION sync_org_member_tiers()
RETURNS TRIGGER AS $$
BEGIN
  -- When org subscription is active, grant members the appropriate tier
  IF NEW.status = 'active' THEN
    UPDATE users SET
      subscription_tier = NEW.member_tier,
      subscription_status = 'active',
      tier_source = 'organization'
    WHERE id IN (
      SELECT user_id FROM organization_memberships
      WHERE organization_id = NEW.organization_id
      AND status IN ('active', 'verified')
    )
    AND (
      -- Only upgrade free self-paying users or update existing org-granted users
      (tier_source = 'self' AND subscription_tier = 'free')
      OR tier_source = 'organization'
    );
  END IF;

  -- When org subscription is cancelled/expired, reset org-granted tiers
  IF NEW.status IN ('cancelled', 'expired')
     AND (TG_OP = 'INSERT' OR OLD.status = 'active') THEN
    UPDATE users SET
      subscription_tier = 'free',
      subscription_status = NULL,
      tier_source = 'self'
    WHERE id IN (
      SELECT user_id FROM organization_memberships
      WHERE organization_id = NEW.organization_id
    )
    AND tier_source = 'organization';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_org_member_tiers
  AFTER INSERT OR UPDATE ON organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_org_member_tiers();

-- Trigger: grant tier when new member joins an org with active subscription
CREATE OR REPLACE FUNCTION sync_new_member_org_tier()
RETURNS TRIGGER AS $$
DECLARE
  org_sub RECORD;
BEGIN
  -- Only run when membership becomes active/verified
  IF NEW.status NOT IN ('active', 'verified') THEN
    RETURN NEW;
  END IF;

  -- Check if org has active subscription
  SELECT * INTO org_sub
  FROM organization_subscriptions
  WHERE organization_id = NEW.organization_id
  AND status = 'active'
  LIMIT 1;

  IF FOUND THEN
    -- Only upgrade free self-paying users
    UPDATE users SET
      subscription_tier = org_sub.member_tier,
      subscription_status = 'active',
      tier_source = 'organization'
    WHERE id = NEW.user_id
    AND tier_source = 'self'
    AND subscription_tier = 'free';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_new_member_org_tier
  AFTER INSERT OR UPDATE ON organization_memberships
  FOR EACH ROW EXECUTE FUNCTION sync_new_member_org_tier();

-- Updated_at trigger
CREATE TRIGGER set_organization_subscriptions_updated_at
  BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
