-- Create equipment_issues table for cross-race equipment tracking
-- Implements temporal flow: issues noted post-race appear in next race's checklist

CREATE TABLE IF NOT EXISTS equipment_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id UUID,  -- No foreign key since boats table may not exist
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  from_race_id UUID,
  from_race_name TEXT,
  from_race_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_for_race_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_equipment_issues_user_id ON equipment_issues(user_id);
CREATE INDEX idx_equipment_issues_boat_id ON equipment_issues(boat_id);
CREATE INDEX idx_equipment_issues_unresolved ON equipment_issues(user_id) WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE equipment_issues ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can manage their own equipment issues
CREATE POLICY "Users can view their own equipment issues"
  ON equipment_issues
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own equipment issues"
  ON equipment_issues
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment issues"
  ON equipment_issues
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment issues"
  ON equipment_issues
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_equipment_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_issues_updated_at
  BEFORE UPDATE ON equipment_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_issues_updated_at();
