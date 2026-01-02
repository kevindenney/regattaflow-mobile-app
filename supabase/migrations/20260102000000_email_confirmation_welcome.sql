-- ============================================================================
-- Welcome Email on Email Confirmation
-- Triggers welcome emails for ALL personas after email verification
-- Moves sailor onboarding sequence to fire after confirmation
-- ============================================================================

-- ============================================================================
-- 1. Extend sailor_email_sequences to handle all personas
-- ============================================================================

-- Add persona column to track which user type the email is for
ALTER TABLE sailor_email_sequences
ADD COLUMN IF NOT EXISTS persona TEXT DEFAULT 'sailor';

-- Add index for persona queries
CREATE INDEX IF NOT EXISTS idx_email_sequences_persona
ON sailor_email_sequences(persona, status);

-- Update comment
COMMENT ON TABLE sailor_email_sequences IS 'Tracks scheduled and sent onboarding emails for all user types (sailors, coaches, clubs)';

-- ============================================================================
-- 2. Drop the old INSERT trigger on users table
-- ============================================================================

DROP TRIGGER IF EXISTS sailor_onboarding_email_trigger ON users;

-- ============================================================================
-- 3. Create function to schedule emails on email confirmation
-- ============================================================================

CREATE OR REPLACE FUNCTION schedule_onboarding_emails_on_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_record RECORD;
  v_email_prefs JSONB;
BEGIN
  -- Only fire when email_confirmed_at changes from NULL to a value
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN

    -- Get user info from public.users table
    SELECT
      id,
      email,
      full_name,
      user_type,
      COALESCE(email_preferences, '{"marketing": true, "product_updates": true, "trial_reminders": true}'::JSONB) as email_preferences
    INTO v_user_record
    FROM public.users
    WHERE id = NEW.id;

    -- Exit if user not found in public.users
    IF v_user_record IS NULL THEN
      RETURN NEW;
    END IF;

    v_email_prefs := v_user_record.email_preferences;

    -- ========================================================================
    -- Schedule emails based on persona (user_type)
    -- ========================================================================

    IF v_user_record.user_type = 'sailor' THEN
      -- SAILOR ONBOARDING SEQUENCE

      -- Welcome email (immediate)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (v_user_record.id, 'welcome', NOW(), '{"priority": "high"}'::JSONB, 'sailor');

      -- Quick start reminder (30 mins later if onboarding not complete)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (v_user_record.id, 'quick_start', NOW() + INTERVAL '30 minutes', '{"condition": "onboarding_incomplete"}'::JSONB, 'sailor');

      -- Feature tip (day 2)
      IF (v_email_prefs->>'product_updates')::boolean THEN
        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'feature_tip', NOW() + INTERVAL '2 days', '{}'::JSONB, 'sailor');
      END IF;

      -- Trial reminders (only if trial_reminders enabled)
      IF (v_email_prefs->>'trial_reminders')::boolean THEN
        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_reminder_5', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB, 'sailor');

        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_reminder_2', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB, 'sailor');

        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_ending', NOW() + INTERVAL '7 days', '{"condition": "is_trialing"}'::JSONB, 'sailor');

        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_ended', NOW() + INTERVAL '8 days', '{"condition": "trial_ended_not_converted"}'::JSONB, 'sailor');
      END IF;

      -- Re-engagement (day 14 if inactive)
      IF (v_email_prefs->>'marketing')::boolean THEN
        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 're_engagement', NOW() + INTERVAL '14 days', '{"condition": "inactive_7_days"}'::JSONB, 'sailor');
      END IF;

    ELSIF v_user_record.user_type = 'coach' THEN
      -- COACH ONBOARDING SEQUENCE

      -- Welcome email (immediate)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (v_user_record.id, 'welcome', NOW(), '{"priority": "high"}'::JSONB, 'coach');

      -- Quick start reminder (1 hour later)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (v_user_record.id, 'quick_start', NOW() + INTERVAL '1 hour', '{"condition": "onboarding_incomplete"}'::JSONB, 'coach');

      -- Feature tip - athlete management (day 2)
      IF (v_email_prefs->>'product_updates')::boolean THEN
        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'feature_tip', NOW() + INTERVAL '2 days', '{}'::JSONB, 'coach');
      END IF;

      -- Trial reminders
      IF (v_email_prefs->>'trial_reminders')::boolean THEN
        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_reminder_5', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB, 'coach');

        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_ending', NOW() + INTERVAL '7 days', '{"condition": "is_trialing"}'::JSONB, 'coach');
      END IF;

    ELSIF v_user_record.user_type = 'club' THEN
      -- CLUB ONBOARDING SEQUENCE

      -- Welcome email (immediate)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (v_user_record.id, 'welcome', NOW(), '{"priority": "high"}'::JSONB, 'club');

      -- Quick start reminder (2 hours later - clubs may need more setup time)
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (v_user_record.id, 'quick_start', NOW() + INTERVAL '2 hours', '{"condition": "onboarding_incomplete"}'::JSONB, 'club');

      -- Feature tip - regatta management (day 2)
      IF (v_email_prefs->>'product_updates')::boolean THEN
        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'feature_tip', NOW() + INTERVAL '2 days', '{}'::JSONB, 'club');
      END IF;

      -- Trial reminders
      IF (v_email_prefs->>'trial_reminders')::boolean THEN
        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_reminder_5', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB, 'club');

        INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
        VALUES (v_user_record.id, 'trial_ending', NOW() + INTERVAL '7 days', '{"condition": "is_trialing"}'::JSONB, 'club');
      END IF;
    END IF;

    -- Update onboarding_started_at
    UPDATE public.users
    SET onboarding_started_at = NOW()
    WHERE id = v_user_record.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Create trigger on auth.users for email confirmation
-- ============================================================================

DROP TRIGGER IF EXISTS on_email_confirmed_welcome ON auth.users;

CREATE TRIGGER on_email_confirmed_welcome
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION schedule_onboarding_emails_on_confirmation();

-- ============================================================================
-- 5. Update get_pending_emails_to_send to include persona
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_emails_to_send()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email_type TEXT,
  metadata JSONB,
  persona TEXT,
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
    ses.persona,
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
-- 6. Comments
-- ============================================================================

COMMENT ON FUNCTION schedule_onboarding_emails_on_confirmation() IS
'Schedules onboarding email sequences for all user types (sailor, coach, club) after email confirmation';

COMMENT ON TRIGGER on_email_confirmed_welcome ON auth.users IS
'Triggers welcome and onboarding email sequences after user confirms their email';
