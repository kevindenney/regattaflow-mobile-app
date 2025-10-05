-- Add Stripe Connect status fields to coach_profiles
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN coach_profiles.stripe_account_id IS 'Stripe Connect account ID for receiving payments';
COMMENT ON COLUMN coach_profiles.stripe_details_submitted IS 'Whether coach has submitted all required Stripe onboarding details';
COMMENT ON COLUMN coach_profiles.stripe_charges_enabled IS 'Whether the Stripe account can accept charges';
COMMENT ON COLUMN coach_profiles.stripe_payouts_enabled IS 'Whether the Stripe account can receive payouts';
