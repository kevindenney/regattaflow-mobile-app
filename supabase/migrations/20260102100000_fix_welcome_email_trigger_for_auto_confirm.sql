-- ============================================================================
-- Fix Welcome Email Trigger for Auto-Confirm Mode
-- The auth.users trigger only fires on UPDATE, but when email confirmation is
-- disabled (auto-confirm), email_confirmed_at is set on INSERT, not UPDATE.
--
-- Solution: Create a trigger on public.users INSERT which we have full control over.
-- This fires when a new user row is created in public.users (after auth signup).
-- ============================================================================

-- ============================================================================
-- 1. Create function to schedule emails on public.users INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION schedule_onboarding_emails_on_user_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_email_prefs JSONB;
BEGIN
  -- Get email preferences (default to all enabled)
  v_email_prefs := COALESCE(NEW.email_preferences, '{"marketing": true, "product_updates": true, "trial_reminders": true}'::JSONB);

  -- ========================================================================
  -- Schedule emails based on user_type
  -- ========================================================================

  IF NEW.user_type = 'sailor' THEN
    -- SAILOR ONBOARDING SEQUENCE
    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
    VALUES (NEW.id, 'welcome', NOW(), '{"priority": "high"}'::JSONB, 'sailor');

    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
    VALUES (NEW.id, 'quick_start', NOW() + INTERVAL '30 minutes', '{"condition": "onboarding_incomplete"}'::JSONB, 'sailor');

    IF (v_email_prefs->>'product_updates')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'feature_tip', NOW() + INTERVAL '2 days', '{}'::JSONB, 'sailor');
    END IF;

    IF (v_email_prefs->>'trial_reminders')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'trial_reminder_5', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB, 'sailor');

      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'trial_ending', NOW() + INTERVAL '7 days', '{"condition": "is_trialing"}'::JSONB, 'sailor');
    END IF;

  ELSIF NEW.user_type = 'coach' THEN
    -- COACH ONBOARDING SEQUENCE
    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
    VALUES (NEW.id, 'welcome', NOW(), '{"priority": "high"}'::JSONB, 'coach');

    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
    VALUES (NEW.id, 'quick_start', NOW() + INTERVAL '1 hour', '{"condition": "onboarding_incomplete"}'::JSONB, 'coach');

    IF (v_email_prefs->>'product_updates')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'feature_tip', NOW() + INTERVAL '2 days', '{}'::JSONB, 'coach');
    END IF;

    IF (v_email_prefs->>'trial_reminders')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'trial_reminder_5', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB, 'coach');

      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'trial_ending', NOW() + INTERVAL '7 days', '{"condition": "is_trialing"}'::JSONB, 'coach');
    END IF;

  ELSIF NEW.user_type = 'club' THEN
    -- CLUB ONBOARDING SEQUENCE
    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
    VALUES (NEW.id, 'welcome', NOW(), '{"priority": "high"}'::JSONB, 'club');

    INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
    VALUES (NEW.id, 'quick_start', NOW() + INTERVAL '2 hours', '{"condition": "onboarding_incomplete"}'::JSONB, 'club');

    IF (v_email_prefs->>'product_updates')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'feature_tip', NOW() + INTERVAL '2 days', '{}'::JSONB, 'club');
    END IF;

    IF (v_email_prefs->>'trial_reminders')::boolean THEN
      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'trial_reminder_5', NOW() + INTERVAL '5 days', '{"condition": "is_trialing"}'::JSONB, 'club');

      INSERT INTO sailor_email_sequences (user_id, email_type, scheduled_for, metadata, persona)
      VALUES (NEW.id, 'trial_ending', NOW() + INTERVAL '7 days', '{"condition": "is_trialing"}'::JSONB, 'club');
    END IF;
  END IF;

  -- Update onboarding_started_at
  NEW.onboarding_started_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Create trigger on public.users INSERT
-- ============================================================================

DROP TRIGGER IF EXISTS on_user_insert_schedule_emails ON public.users;

CREATE TRIGGER on_user_insert_schedule_emails
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION schedule_onboarding_emails_on_user_insert();

-- ============================================================================
-- 3. Comments
-- ============================================================================

COMMENT ON FUNCTION schedule_onboarding_emails_on_user_insert() IS
'Schedules onboarding email sequences for all user types (sailor, coach, club) when a new user is created in public.users.';

COMMENT ON TRIGGER on_user_insert_schedule_emails ON public.users IS
'Triggers welcome and onboarding email sequences when a new user is created';
