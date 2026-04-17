-- Track the inspiring source content linked to a blueprint.
-- Enables the "Inspiration → Interest → Blueprint" flow where a user
-- pastes inspiring content and the system generates a learning plan.

ALTER TABLE timeline_blueprints
  ADD COLUMN IF NOT EXISTS inspiration_source_url TEXT,
  ADD COLUMN IF NOT EXISTS inspiration_source_text TEXT,
  ADD COLUMN IF NOT EXISTS inspiration_source_type TEXT
    CHECK (inspiration_source_type IN ('url', 'text', 'description'));
