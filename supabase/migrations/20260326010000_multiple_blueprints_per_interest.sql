-- Migration: Multiple Blueprints Per Interest
--
-- Drops unique constraints that limit one blueprint per interest,
-- adds blueprint_steps junction table for curated step lists.

-- =============================================================================
-- DROP UNIQUE CONSTRAINTS (allow multiple blueprints per interest)
-- =============================================================================

DROP INDEX IF EXISTS idx_blueprint_user_interest_individual;
DROP INDEX IF EXISTS idx_blueprint_user_interest_org_program;
DROP INDEX IF EXISTS idx_blueprint_user_interest_org_no_program;

-- Keep slug unique (already exists)
-- Add a non-unique index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blueprint_user_interest
  ON timeline_blueprints(user_id, interest_id);

-- =============================================================================
-- BLUEPRINT_STEPS JUNCTION TABLE (curated step lists per blueprint)
-- =============================================================================

CREATE TABLE IF NOT EXISTS blueprint_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id uuid NOT NULL REFERENCES timeline_blueprints(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES timeline_steps(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE (blueprint_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_blueprint_steps_blueprint ON blueprint_steps(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_steps_step ON blueprint_steps(step_id);

-- RLS
ALTER TABLE blueprint_steps ENABLE ROW LEVEL SECURITY;

-- Blueprint author can do everything
CREATE POLICY blueprint_steps_author_all ON blueprint_steps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM timeline_blueprints b WHERE b.id = blueprint_id AND b.user_id = auth.uid())
  );

-- Subscribers can read
CREATE POLICY blueprint_steps_subscriber_read ON blueprint_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM blueprint_subscriptions bs
            WHERE bs.blueprint_id = blueprint_steps.blueprint_id
              AND bs.subscriber_id = auth.uid())
  );

-- Public read for published public blueprints
CREATE POLICY blueprint_steps_public_read ON blueprint_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM timeline_blueprints b
            WHERE b.id = blueprint_id AND b.is_published = true
              AND b.access_level = 'public')
  );
