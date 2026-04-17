-- Creator Stripe Connect accounts
-- Decoupled from coach_profiles so any user who sells blueprints can receive payouts.

CREATE TABLE IF NOT EXISTS creator_stripe_accounts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL,
  charges_enabled   boolean NOT NULL DEFAULT false,
  payouts_enabled   boolean NOT NULL DEFAULT false,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (stripe_account_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_creator_stripe_accounts_user_id
  ON creator_stripe_accounts(user_id);

-- RLS
ALTER TABLE creator_stripe_accounts ENABLE ROW LEVEL SECURITY;

-- Owner can read their own account
CREATE POLICY "Users can read own stripe account"
  ON creator_stripe_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can insert their own account
CREATE POLICY "Users can create own stripe account"
  ON creator_stripe_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own account
CREATE POLICY "Users can update own stripe account"
  ON creator_stripe_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role bypass for webhooks and edge functions
CREATE POLICY "Service role full access to creator stripe accounts"
  ON creator_stripe_accounts FOR ALL
  USING (auth.role() = 'service_role');

-- Add pricing_type and stripe_price_id to timeline_blueprints for recurring billing
ALTER TABLE timeline_blueprints
  ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'one_time'
    CHECK (pricing_type IN ('one_time', 'recurring')),
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS stripe_product_id text;

-- Add subscription tracking columns to blueprint_subscriptions
ALTER TABLE blueprint_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'unpaid'));

-- Migrate existing coach Stripe accounts into the new table
-- (coaches who already have stripe_account_id in coach_profiles)
INSERT INTO creator_stripe_accounts (user_id, stripe_account_id)
SELECT
  cp.user_id,
  cp.stripe_account_id
FROM coach_profiles cp
WHERE cp.stripe_account_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_creator_stripe_accounts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_creator_stripe_accounts_updated_at
  BEFORE UPDATE ON creator_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION update_creator_stripe_accounts_updated_at();
