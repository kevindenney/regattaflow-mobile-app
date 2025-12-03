-- Registration Email System
-- Auto-send beautiful confirmation emails when sailors register

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES race_entries(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_registration ON email_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent ON email_logs(sent_at DESC);

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view email logs
CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Service role can insert logs
CREATE POLICY "Service can insert logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Create function to trigger email on new registration
CREATE OR REPLACE FUNCTION notify_registration_created()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  -- Get the webhook URL from app settings or environment
  webhook_url := current_setting('app.settings.registration_webhook_url', true);
  
  -- If webhook URL is set, make HTTP request
  IF webhook_url IS NOT NULL AND webhook_url != '' THEN
    -- Note: This requires pg_net extension for HTTP calls
    -- Alternative: Use Supabase Database Webhooks from dashboard
    PERFORM net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'race_entries',
        'record', row_to_json(NEW)
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the insert if webhook fails
  RAISE WARNING 'Registration webhook failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (will only work if pg_net is enabled)
-- For Supabase, use Database Webhooks from the dashboard instead
-- DROP TRIGGER IF EXISTS on_registration_created ON race_entries;
-- CREATE TRIGGER on_registration_created
--   AFTER INSERT ON race_entries
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_registration_created();

-- Add email preferences to user profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "registration_confirmations": true,
  "results_published": true,
  "protest_updates": true,
  "race_signals": false,
  "marketing": false
}'::jsonb;

-- Add NOR and SI URLs to regattas if not exists
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS nor_url TEXT;
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS si_url TEXT;

-- Add venue_name if not exists
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS venue_name TEXT;

-- Add payment fields to race_entries if not exists
ALTER TABLE race_entries ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'paid', 'waived', 'refunded'));
ALTER TABLE race_entries ADD COLUMN IF NOT EXISTS entry_fee TEXT;
ALTER TABLE race_entries ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
ALTER TABLE race_entries ADD COLUMN IF NOT EXISTS payment_reference TEXT;

COMMENT ON TABLE email_logs IS 'Track all transactional emails sent by the system';
COMMENT ON FUNCTION notify_registration_created() IS 'Trigger function to send confirmation email on new registration';

