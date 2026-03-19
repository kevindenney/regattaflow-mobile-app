-- Migration: Timeline Steps System
-- Enables real timeline tracking, step adoption from other users, and org templates.

-- =============================================================================
-- EXTEND NOTIFICATION TYPE ENUM
-- =============================================================================

ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'followed_user_step_completed';

-- =============================================================================
-- TIMELINE STEPS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS timeline_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  program_session_id UUID,
  source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'template', 'copied', 'program_session')),
  source_id UUID,
  copied_from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_place_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'followers'
    CHECK (visibility IN ('private', 'followers', 'coaches', 'organization')),
  share_approximate_location BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_steps_user_interest
  ON timeline_steps(user_id, interest_id);
CREATE INDEX IF NOT EXISTS idx_timeline_steps_user_status
  ON timeline_steps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_timeline_steps_source
  ON timeline_steps(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_steps_copied_from
  ON timeline_steps(copied_from_user_id) WHERE copied_from_user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE timeline_steps ENABLE ROW LEVEL SECURITY;

-- Users can view their own steps
CREATE POLICY "Users can view own timeline steps" ON timeline_steps
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view followed users' steps respecting visibility
CREATE POLICY "Users can view followed users timeline steps" ON timeline_steps
  FOR SELECT USING (
    visibility != 'private'
    AND EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = auth.uid()
        AND following_id = timeline_steps.user_id
    )
  );

-- Users can manage their own steps
CREATE POLICY "Users can insert own timeline steps" ON timeline_steps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline steps" ON timeline_steps
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeline steps" ON timeline_steps
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TIMELINE STEP TEMPLATES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS timeline_step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  path_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, path_name, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_timeline_step_templates_org_interest
  ON timeline_step_templates(organization_id, interest_id);

-- Enable RLS
ALTER TABLE timeline_step_templates ENABLE ROW LEVEL SECURITY;

-- Templates are readable by org members
CREATE POLICY "Org members can view templates" ON timeline_step_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_memberships
      WHERE organization_id = timeline_step_templates.organization_id
        AND user_id = auth.uid()
    )
  );

-- Org admins can manage templates
CREATE POLICY "Org admins can manage templates" ON timeline_step_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_memberships
      WHERE organization_id = timeline_step_templates.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- =============================================================================
-- TRIGGER: Auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_timeline_steps_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_timeline_steps_updated_at ON timeline_steps;
CREATE TRIGGER trigger_timeline_steps_updated_at
  BEFORE UPDATE ON timeline_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_timeline_steps_updated_at();

DROP TRIGGER IF EXISTS trigger_timeline_step_templates_updated_at ON timeline_step_templates;
CREATE TRIGGER trigger_timeline_step_templates_updated_at
  BEFORE UPDATE ON timeline_step_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_timeline_steps_updated_at();

-- =============================================================================
-- TRIGGER: Notify followers on step completion
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_followers_on_step_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
  v_follower RECORD;
BEGIN
  -- Only fire when status changes to 'completed'
  IF OLD.status = 'completed' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get the actor's name
  SELECT full_name INTO v_actor_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Notify each follower who has notifications enabled
  FOR v_follower IN
    SELECT follower_id
    FROM user_follows
    WHERE following_id = NEW.user_id
      AND is_muted = false
  LOOP
    INSERT INTO social_notifications (user_id, type, actor_id, title, body, data)
    VALUES (
      v_follower.follower_id,
      'followed_user_step_completed',
      NEW.user_id,
      COALESCE(v_actor_name, 'Someone') || ' completed a step',
      NEW.title,
      jsonb_build_object(
        'step_id', NEW.id,
        'interest_id', NEW.interest_id,
        'category', NEW.category
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_step_completed ON timeline_steps;
CREATE TRIGGER trigger_notify_step_completed
  AFTER UPDATE ON timeline_steps
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_step_completed();
