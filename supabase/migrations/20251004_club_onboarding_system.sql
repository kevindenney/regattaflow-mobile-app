-- ============================================================================
-- CLUB ONBOARDING SYSTEM
-- ============================================================================
-- Adds club profiles, subscriptions, and verification tracking for club onboarding

-- Club profiles (extends users table for club-type users)
CREATE TABLE IF NOT EXISTS club_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  yacht_club_id TEXT REFERENCES yacht_clubs(id) ON DELETE SET NULL,

  -- Verification status
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) NOT NULL DEFAULT 'pending',
  verification_method TEXT CHECK (verification_method IN ('dns', 'meta_tag', 'manual')),
  verification_token TEXT,
  verified_at TIMESTAMPTZ,

  -- Extracted data from website
  established_year INTEGER,
  member_count INTEGER,
  extracted_data JSONB DEFAULT '{}',

  -- Admin approval
  admin_review_status TEXT CHECK (admin_review_status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS club_profiles_user_idx ON club_profiles(user_id);
CREATE INDEX IF NOT EXISTS club_profiles_yacht_club_idx ON club_profiles(yacht_club_id);
CREATE INDEX IF NOT EXISTS club_profiles_verification_status_idx ON club_profiles(verification_status);
CREATE INDEX IF NOT EXISTS club_profiles_admin_review_idx ON club_profiles(admin_review_status);

-- Club subscriptions (Stripe integration)
CREATE TABLE IF NOT EXISTS club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_profile_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,

  -- Stripe details
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,

  -- Subscription details
  plan_id TEXT NOT NULL CHECK (plan_id IN ('starter', 'professional', 'enterprise')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')) NOT NULL DEFAULT 'trialing',

  -- Pricing
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT CHECK (interval IN ('month', 'year')) NOT NULL DEFAULT 'month',

  -- Dates
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_profile_id)
);

CREATE INDEX IF NOT EXISTS club_subscriptions_club_profile_idx ON club_subscriptions(club_profile_id);
CREATE INDEX IF NOT EXISTS club_subscriptions_stripe_subscription_idx ON club_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS club_subscriptions_status_idx ON club_subscriptions(status);

-- Club verification attempts (for audit trail)
CREATE TABLE IF NOT EXISTS club_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_profile_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,

  method TEXT CHECK (method IN ('dns', 'meta_tag')) NOT NULL,
  website_url TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  ip_address TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS club_verification_attempts_club_profile_idx ON club_verification_attempts(club_profile_id);
CREATE INDEX IF NOT EXISTS club_verification_attempts_created_at_idx ON club_verification_attempts(created_at DESC);

-- Club admin approval queue (view for admins)
CREATE OR REPLACE VIEW club_approval_queue AS
SELECT
  cp.id,
  cp.user_id,
  cp.club_name,
  cp.website_url,
  cp.verification_status,
  cp.verification_method,
  cp.verified_at,
  cp.admin_review_status,
  cp.created_at,
  cp.extracted_data,
  u.email,
  COUNT(cva.id) as verification_attempts
FROM club_profiles cp
JOIN auth.users u ON cp.user_id = u.id
LEFT JOIN club_verification_attempts cva ON cp.id = cva.club_profile_id
WHERE cp.admin_review_status = 'pending'
GROUP BY cp.id, u.email
ORDER BY cp.created_at ASC;

-- RLS Policies
ALTER TABLE club_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Club profiles policies
CREATE POLICY "Users can view their own club profile"
  ON club_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own club profile"
  ON club_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own club profile"
  ON club_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all club profiles (TODO: add admin role check)
CREATE POLICY "Admins can view all club profiles"
  ON club_profiles FOR SELECT
  USING (true); -- TODO: Add admin role check

-- Club subscriptions policies
CREATE POLICY "Users can view their own club subscription"
  ON club_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = club_subscriptions.club_profile_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own club subscription"
  ON club_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = club_profile_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own club subscription"
  ON club_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = club_subscriptions.club_profile_id
      AND cp.user_id = auth.uid()
    )
  );

-- Club verification attempts policies
CREATE POLICY "Users can view their own verification attempts"
  ON club_verification_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = club_verification_attempts.club_profile_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own verification attempts"
  ON club_verification_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = club_profile_id
      AND cp.user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_club_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_profiles_timestamp
  BEFORE UPDATE ON club_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_club_profile_timestamp();

CREATE TRIGGER update_club_subscriptions_timestamp
  BEFORE UPDATE ON club_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_club_profile_timestamp();
