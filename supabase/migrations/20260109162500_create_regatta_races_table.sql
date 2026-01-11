-- Create regatta_races table for individual races within a regatta
-- This supports club scoring, check-in, and race management functionality

CREATE TABLE IF NOT EXISTS regatta_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  race_name TEXT,
  race_date DATE,
  scheduled_date DATE,
  scheduled_time TIME,
  actual_start TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'postponed', 'in_progress', 'completed', 'abandoned', 'cancelled')),

  -- Check-in settings
  check_in_opens_at TIMESTAMPTZ,
  check_in_closes_at TIMESTAMPTZ,
  check_in_qr_token TEXT UNIQUE,
  self_check_in_enabled BOOLEAN DEFAULT false,

  -- Course/conditions
  course_id UUID,
  wind_direction INTEGER,
  wind_speed_knots NUMERIC(4,1),
  weather_notes TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint on regatta + race number
  UNIQUE (regatta_id, race_number)
);

-- Create indexes
CREATE INDEX idx_regatta_races_regatta_id ON regatta_races(regatta_id);
CREATE INDEX idx_regatta_races_status ON regatta_races(status);
CREATE INDEX idx_regatta_races_scheduled_date ON regatta_races(scheduled_date);
CREATE INDEX idx_regatta_races_qr_token ON regatta_races(check_in_qr_token) WHERE check_in_qr_token IS NOT NULL;

-- Enable RLS
ALTER TABLE regatta_races ENABLE ROW LEVEL SECURITY;

-- RLS policies: access follows regatta ownership
CREATE POLICY "Users can view races of their regattas"
  ON regatta_races
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_races.regatta_id
      AND regattas.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create races in their regattas"
  ON regatta_races
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_races.regatta_id
      AND regattas.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update races in their regattas"
  ON regatta_races
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_races.regatta_id
      AND regattas.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete races in their regattas"
  ON regatta_races
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_races.regatta_id
      AND regattas.created_by = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_regatta_races_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER regatta_races_updated_at
  BEFORE UPDATE ON regatta_races
  FOR EACH ROW
  EXECUTE FUNCTION update_regatta_races_updated_at();
