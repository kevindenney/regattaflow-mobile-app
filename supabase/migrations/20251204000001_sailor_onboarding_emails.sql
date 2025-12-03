-- ============================================================================
-- Sailor Onboarding Email Sequences
-- Tracks email sequences for sailor onboarding flow
-- ============================================================================

-- Create email sequences table
CREATE TABLE IF NOT EXISTS sailor_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_sailor_emails_pending 
ON sailor_email_sequences(scheduled_for) 
WHERE status = 'pending';

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_sailor_emails_user 
ON sailor_email_sequences(user_id);

-- Index for email type queries
CREATE INDEX IF NOT EXISTS idx_sailor_emails_type 
ON sailor_email_sequences(email_type, status);

-- ============================================================================
-- Add subscription tracking fields to users table
-- ============================================================================

-- Add trial tracking fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_starts_at') THEN
    ALTER TABLE users ADD COLUMN trial_starts_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_started_at') THEN
    ALTER TABLE users ADD COLUMN onboarding_started_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_active_at') THEN
    ALTER TABLE users ADD COLUMN last_active_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_preferences') THEN
    ALTER TABLE users ADD COLUMN email_preferences JSONB DEFAULT '{"marketing": true, "product_updates": true, "trial_reminders": true}'::JSONB;
  END IF;
END $$;

-- ============================================================================
-- Function to schedule onboarding emails for new sailors
-- ============================================================================

CREATE OR REPLACE FUNCTION schedule_sailor_onboarding_emails()
RETURNS TRIGGER AS $$
DECLARE
  user_email_prefs JSONB;
BEGIN
  -- Only schedule for sailor user_type
  IF NEW.user_type = 'sailor' THEN
    -- Get email preferences (default to all enabled)
    user_email_prefs := COALESCE(NEW.email_preferences, '{"marketing": true, "product_updates": true, "trial_reminders": true}'::JSONB);
    
    -- Welcome email (immediate)
    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
    VALUES (NEW.id, 'welcome', NOW(), '{"priority": "high"}'::JSONB);
    
    -- Quick start reminder (30 mins later if onboarding not complete)
    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
    VALUES (NEW.id, 'quick_start', NOW() + INTERVAL '30 minutes', '{"condition": "onboarding_incomplete"}'::JSONB);
    
    -- Feature tip (day 2)
    IF (user_email_prefs->>'product_updates')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
      VALUES (NEW.id, 'feature_tip', NOW() + INTERVAL '2 days', '{}'::JSONB);
    END IF;
    
    -- Trial reminders (only if trial_reminders enabled)
    IF (user_email_prefs->>'trial_reminders')::boolean THEN
      -- 5 days trial reminder
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
      VALUES (NEW.id, 'trial_reminder_5', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB);
      
      -- 2 days trial reminder
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
      VALUES (NEW.id, 'trial_reminder_2', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB);
      
      -- Trial ending (day 7)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
      VALUES (NEW.id, 'trial_ending', NOW() + INTERVAL '7 days', '{"condition": "is_trialing"}'::JSONB);
      
      -- Trial ended (day 8)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
      VALUES (NEW.id, 'trial_ended', NOW() + INTERVAL '8 days', '{"condition": "trial_ended_not_converted"}'::JSONB);
    END IF;
    
    -- Re-engagement (day 14 if inactive)
    IF (user_email_prefs->>'marketing')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata)
      VALUES (NEW.id, 're_engagement', NOW() + INTERVAL '14 days', '{"condition": "inactive_7_days"}'::JSONB);
    END IF;
    
    -- Update onboarding_started_at
    UPDATE users SET onboarding_started_at = NOW() WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger to schedule emails on new sailor signup
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sailor_onboarding_email_trigger ON users;

-- Create trigger for new user inserts with sailor type
CREATE TRIGGER sailor_onboarding_email_trigger
AFTER INSERT ON users
FOR EACH ROW 
WHEN (NEW.user_type = 'sailor')
EXECUTE FUNCTION schedule_sailor_onboarding_emails();

-- ============================================================================
-- Function to cancel pending trial emails (when user upgrades)
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_pending_trial_emails(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER;
BEGIN
  UPDATE sailor_email_sequences
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND email_type IN ('trial_reminder_5', 'trial_reminder_2', 'trial_ending', 'trial_ended');
  
  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get pending emails ready to send
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_emails_to_send()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email_type TEXT,
  metadata JSONB,
  user_email TEXT,
  user_name TEXT,
  subscription_tier TEXT,
  subscription_status TEXT,
  onboarding_completed BOOLEAN,
  last_active_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ses.id,
    ses.user_id,
    ses.email_type,
    ses.metadata,
    u.email as user_email,
    u.full_name as user_name,
    u.subscription_tier,
    u.subscription_status,
    u.onboarding_completed,
    u.last_active_at
  FROM sailor_email_sequences ses
  JOIN users u ON ses.user_id = u.id
  WHERE ses.status = 'pending'
    AND ses.scheduled_for <= NOW()
  ORDER BY ses.scheduled_for ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to mark email as sent
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_email_sent(p_email_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sailor_email_sequences
  SET 
    status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE id = p_email_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to mark email as failed
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_email_failed(p_email_id UUID, p_error TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sailor_email_sequences
  SET 
    status = 'failed',
    metadata = metadata || jsonb_build_object('error', COALESCE(p_error, 'Unknown error'), 'failed_at', NOW()),
    updated_at = NOW()
  WHERE id = p_email_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE sailor_email_sequences ENABLE ROW LEVEL SECURITY;

-- Users can view their own email sequences
CREATE POLICY "Users can view own email sequences"
ON sailor_email_sequences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can insert/update (via edge functions)
CREATE POLICY "Service role can manage email sequences"
ON sailor_email_sequences
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Update timestamp trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sailor_email_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sailor_email_sequences_timestamp ON sailor_email_sequences;

CREATE TRIGGER update_sailor_email_sequences_timestamp
BEFORE UPDATE ON sailor_email_sequences
FOR EACH ROW
EXECUTE FUNCTION update_sailor_email_sequences_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE sailor_email_sequences IS 'Tracks scheduled and sent onboarding emails for sailors';
COMMENT ON COLUMN sailor_email_sequences.email_type IS 'Type of email: welcome, quick_start, feature_tip, trial_reminder_5, trial_reminder_2, trial_ending, trial_ended, onboarding_complete, re_engagement';
COMMENT ON COLUMN sailor_email_sequences.status IS 'Email status: pending, sent, cancelled, failed';
COMMENT ON COLUMN sailor_email_sequences.metadata IS 'Additional email metadata including conditions and error info';

