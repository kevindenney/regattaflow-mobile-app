-- Add actual rig settings tracking to races
-- This allows sailors to record what settings they actually used (vs. recommendations)
-- and track performance correlation over time

-- Add actual_rig_settings column to regattas table
ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS actual_rig_settings jsonb;
  -- Structure: {
  --   "settings": [
  --     { "key": "upper_shrouds", "label": "Upper Shrouds", "value": "Loos 12", "unit": "gauge" }
  --   ],
  --   "wind_actual": { "speed": 6, "direction": 45 },
  --   "recorded_at": "2025-12-07T10:00:00Z",
  --   "notes": "Felt underpowered, should have gone to 14 next time",
  --   "performance_rating": 4,  -- 1-5 scale
  --   "conditions_matched_forecast": true
  -- }

COMMENT ON COLUMN regattas.actual_rig_settings IS 'JSON object storing actual rig settings used during the race, including performance notes and conditions';

-- Create a separate table for rig settings history (for analytics)
CREATE TABLE IF NOT EXISTS rig_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id uuid REFERENCES sailor_profiles(id) ON DELETE CASCADE,
  boat_id uuid REFERENCES boats(id) ON DELETE SET NULL,
  regatta_id uuid REFERENCES regattas(id) ON DELETE SET NULL,
  race_event_id uuid REFERENCES race_events(id) ON DELETE SET NULL,
  
  -- What was used
  settings jsonb NOT NULL,
  -- Structure: [{ key, label, value, unit }]
  
  -- Conditions
  wind_speed_forecast numeric(4,1),
  wind_speed_actual numeric(4,1),
  wind_direction_forecast integer,
  wind_direction_actual integer,
  wave_height text,
  current_speed numeric(3,1),
  
  -- Outcome
  performance_rating smallint CHECK (performance_rating >= 1 AND performance_rating <= 5),
  finish_position integer,
  fleet_size integer,
  notes text,
  conditions_matched_forecast boolean,
  
  -- Recommendation comparison
  recommended_settings jsonb,
  deviation_from_recommended jsonb,
  -- Structure: { "upper_shrouds": { "recommended": "14", "actual": "12", "delta": "-2" } }
  
  -- Metadata
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance queries
CREATE INDEX IF NOT EXISTS idx_rig_settings_history_sailor_id ON rig_settings_history(sailor_id);
CREATE INDEX IF NOT EXISTS idx_rig_settings_history_boat_id ON rig_settings_history(boat_id);
CREATE INDEX IF NOT EXISTS idx_rig_settings_history_wind_speed ON rig_settings_history(wind_speed_actual);
CREATE INDEX IF NOT EXISTS idx_rig_settings_history_performance ON rig_settings_history(performance_rating);

-- Enable RLS
ALTER TABLE rig_settings_history ENABLE ROW LEVEL SECURITY;

-- Policies for rig_settings_history
CREATE POLICY "Users can view their own rig settings history"
  ON rig_settings_history FOR SELECT
  USING (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own rig settings history"
  ON rig_settings_history FOR INSERT
  WITH CHECK (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own rig settings history"
  ON rig_settings_history FOR UPDATE
  USING (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_rig_settings_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rig_settings_history_updated_at
  BEFORE UPDATE ON rig_settings_history
  FOR EACH ROW
  EXECUTE FUNCTION update_rig_settings_history_updated_at();

