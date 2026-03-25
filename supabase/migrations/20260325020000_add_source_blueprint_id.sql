-- Add source_blueprint_id to timeline_steps for direct lineage tracking
-- from adopted step → source blueprint (avoids joining through blueprint_step_actions)

ALTER TABLE timeline_steps
  ADD COLUMN IF NOT EXISTS source_blueprint_id UUID REFERENCES timeline_blueprints(id);

CREATE INDEX IF NOT EXISTS idx_timeline_steps_source_blueprint
  ON timeline_steps(source_blueprint_id) WHERE source_blueprint_id IS NOT NULL;
