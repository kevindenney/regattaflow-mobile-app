-- Create sailor_crew_preferences table for storing crew member preferences from onboarding
-- This table stores the sailor's preferred crew members, roles, and looking-for-crew status

CREATE TABLE IF NOT EXISTS sailor_crew_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES sailor_profiles(id) ON DELETE CASCADE,
  crew_members JSONB DEFAULT '[]'::jsonb,
  looking_for_crew BOOLEAN DEFAULT false,
  crew_roles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one preference record per sailor
  UNIQUE(sailor_id)
);

-- Add RLS policies
ALTER TABLE sailor_crew_preferences ENABLE ROW LEVEL SECURITY;

-- Sailors can view their own crew preferences
CREATE POLICY "Users can view their own crew preferences"
  ON sailor_crew_preferences FOR SELECT
  USING (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

-- Sailors can insert their own crew preferences
CREATE POLICY "Users can insert their own crew preferences"
  ON sailor_crew_preferences FOR INSERT
  WITH CHECK (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

-- Sailors can update their own crew preferences
CREATE POLICY "Users can update their own crew preferences"
  ON sailor_crew_preferences FOR UPDATE
  USING (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

-- Sailors can delete their own crew preferences
CREATE POLICY "Users can delete their own crew preferences"
  ON sailor_crew_preferences FOR DELETE
  USING (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

-- Add index for sailor_id lookups
CREATE INDEX IF NOT EXISTS idx_sailor_crew_preferences_sailor_id
  ON sailor_crew_preferences(sailor_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_sailor_crew_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sailor_crew_preferences_updated_at
  BEFORE UPDATE ON sailor_crew_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_sailor_crew_preferences_updated_at();

COMMENT ON TABLE sailor_crew_preferences IS 'Stores crew member preferences for sailors from onboarding';
COMMENT ON COLUMN sailor_crew_preferences.crew_members IS 'JSON array of crew member objects with name, role, email, phone';
COMMENT ON COLUMN sailor_crew_preferences.looking_for_crew IS 'Whether the sailor is actively looking for crew members';
COMMENT ON COLUMN sailor_crew_preferences.crew_roles IS 'JSON array of crew roles the sailor is looking for';
