-- Create user_capabilities table for additive capability model
-- This enables sailors to add capabilities (like coaching) without changing their base user_type

CREATE TABLE IF NOT EXISTS user_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capability_type TEXT NOT NULL CHECK (capability_type IN ('coaching')),
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, capability_type)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_capabilities_user_id ON user_capabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_capabilities_active ON user_capabilities(user_id, capability_type) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_capabilities ENABLE ROW LEVEL SECURITY;

-- Users can read their own capabilities
CREATE POLICY "Users can read own capabilities"
  ON user_capabilities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own capabilities (for self-upgrade flows)
CREATE POLICY "Users can add own capabilities"
  ON user_capabilities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own capabilities (activate/deactivate)
CREATE POLICY "Users can update own capabilities"
  ON user_capabilities
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_capabilities_updated_at
  BEFORE UPDATE ON user_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_capabilities_updated_at();

-- Comment for documentation
COMMENT ON TABLE user_capabilities IS 'Tracks additive capabilities for users (e.g., coaching). Sailors can add capabilities without changing their base user_type.';
COMMENT ON COLUMN user_capabilities.capability_type IS 'Type of capability: coaching (more types can be added later)';
COMMENT ON COLUMN user_capabilities.is_active IS 'Whether the capability is currently active';
COMMENT ON COLUMN user_capabilities.metadata IS 'Additional metadata for the capability (e.g., certification details)';
