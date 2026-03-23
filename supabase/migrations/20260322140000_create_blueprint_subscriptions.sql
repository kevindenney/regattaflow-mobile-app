-- Migration: Timeline Blueprint Subscriptions
-- Enables users to publish their timeline as a subscribable blueprint
-- and others to subscribe for living updates as new steps are added.

-- =============================================================================
-- EXTEND NOTIFICATION TYPE ENUM
-- =============================================================================

ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'blueprint_new_step';

-- =============================================================================
-- EXTEND TIMELINE STEPS SOURCE TYPE
-- =============================================================================

-- Add 'blueprint' as a valid source_type for adopted blueprint steps
ALTER TABLE timeline_steps DROP CONSTRAINT IF EXISTS timeline_steps_source_type_check;
ALTER TABLE timeline_steps ADD CONSTRAINT timeline_steps_source_type_check
  CHECK (source_type IN ('manual', 'template', 'copied', 'program_session', 'blueprint'));

-- =============================================================================
-- BLUEPRINT PUBLICATION REGISTRY
-- =============================================================================

CREATE TABLE IF NOT EXISTS timeline_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest_id),
  UNIQUE (slug)
);

-- =============================================================================
-- BLUEPRINT SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS blueprint_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES timeline_blueprints(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  auto_adopt BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (blueprint_id, subscriber_id)
);

-- =============================================================================
-- BLUEPRINT STEP ACTIONS (adopt / dismiss / seen tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS blueprint_step_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES blueprint_subscriptions(id) ON DELETE CASCADE,
  source_step_id UUID NOT NULL REFERENCES timeline_steps(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('adopted', 'dismissed', 'seen')),
  acted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  adopted_step_id UUID REFERENCES timeline_steps(id) ON DELETE SET NULL,
  UNIQUE (subscription_id, source_step_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_blueprints_user ON timeline_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_slug ON timeline_blueprints(slug);
CREATE INDEX IF NOT EXISTS idx_blueprints_published ON timeline_blueprints(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_blueprint ON blueprint_subscriptions(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON blueprint_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_step_actions_subscription ON blueprint_step_actions(subscription_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE timeline_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_step_actions ENABLE ROW LEVEL SECURITY;

-- Blueprints: anyone can view published; owner can manage all
CREATE POLICY "Published blueprints are viewable by all"
  ON timeline_blueprints FOR SELECT
  USING (is_published = true OR user_id = auth.uid());

CREATE POLICY "Users manage own blueprints"
  ON timeline_blueprints FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own blueprints"
  ON timeline_blueprints FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own blueprints"
  ON timeline_blueprints FOR DELETE
  USING (user_id = auth.uid());

-- Subscriptions: subscriber can manage; blueprint owner can view
CREATE POLICY "View own subscriptions or as blueprint owner"
  ON blueprint_subscriptions FOR SELECT
  USING (
    subscriber_id = auth.uid()
    OR blueprint_id IN (SELECT id FROM timeline_blueprints WHERE user_id = auth.uid())
  );

CREATE POLICY "Subscribe to blueprints"
  ON blueprint_subscriptions FOR INSERT
  WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "Update own subscriptions"
  ON blueprint_subscriptions FOR UPDATE
  USING (subscriber_id = auth.uid());

CREATE POLICY "Unsubscribe from blueprints"
  ON blueprint_subscriptions FOR DELETE
  USING (subscriber_id = auth.uid());

-- Step actions: subscriber manages own
CREATE POLICY "Manage own step actions"
  ON blueprint_step_actions FOR ALL
  USING (
    subscription_id IN (
      SELECT id FROM blueprint_subscriptions WHERE subscriber_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGER: subscriber count maintenance
-- =============================================================================

CREATE OR REPLACE FUNCTION update_blueprint_subscriber_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE timeline_blueprints
    SET subscriber_count = subscriber_count + 1, updated_at = now()
    WHERE id = NEW.blueprint_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE timeline_blueprints
    SET subscriber_count = GREATEST(subscriber_count - 1, 0), updated_at = now()
    WHERE id = OLD.blueprint_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_blueprint_subscriber_count
  AFTER INSERT OR DELETE ON blueprint_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_blueprint_subscriber_count();

-- =============================================================================
-- TRIGGER: notify subscribers when blueprint owner creates a new step
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_blueprint_subscribers()
RETURNS trigger AS $$
BEGIN
  -- Only notify for non-private steps
  IF NEW.visibility != 'private' THEN
    INSERT INTO social_notifications (user_id, type, data, created_at)
    SELECT
      bs.subscriber_id,
      'blueprint_new_step',
      jsonb_build_object(
        'step_id', NEW.id,
        'step_title', NEW.title,
        'blueprint_id', tb.id,
        'blueprint_title', tb.title,
        'author_id', NEW.user_id
      ),
      now()
    FROM timeline_blueprints tb
    JOIN blueprint_subscriptions bs ON bs.blueprint_id = tb.id
    WHERE tb.user_id = NEW.user_id
      AND tb.interest_id = NEW.interest_id
      AND tb.is_published = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_blueprint_subscribers
  AFTER INSERT ON timeline_steps
  FOR EACH ROW EXECUTE FUNCTION notify_blueprint_subscribers();

-- =============================================================================
-- updated_at trigger for timeline_blueprints
-- =============================================================================

CREATE TRIGGER set_timeline_blueprints_updated_at
  BEFORE UPDATE ON timeline_blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
