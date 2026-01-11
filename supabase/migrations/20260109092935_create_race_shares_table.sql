-- Create race_shares table to track sharing activity
-- This tracks when sailors share their strategies or analyses with others

CREATE TABLE IF NOT EXISTS race_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_event_id UUID REFERENCES race_events(id) ON DELETE CASCADE,
  sailor_id UUID REFERENCES sailor_profiles(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('pre_race', 'post_race', 'result')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'coach', 'crew', 'native', 'copy')),
  recipient_id UUID, -- For coach/crew shares, references the recipient
  recipient_type TEXT CHECK (recipient_type IN ('coach', 'crew', NULL)),
  content_snapshot JSONB, -- Optional snapshot of what was shared
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_race_shares_sailor ON race_shares(sailor_id);
CREATE INDEX idx_race_shares_race ON race_shares(race_event_id);
CREATE INDEX idx_race_shares_type ON race_shares(share_type);
CREATE INDEX idx_race_shares_channel ON race_shares(channel);
CREATE INDEX idx_race_shares_shared_at ON race_shares(shared_at DESC);

-- RLS policies
ALTER TABLE race_shares ENABLE ROW LEVEL SECURITY;

-- Sailors can read their own share history
CREATE POLICY "Sailors can read own share history"
  ON race_shares
  FOR SELECT
  USING (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

-- Sailors can insert their own shares
CREATE POLICY "Sailors can create own shares"
  ON race_shares
  FOR INSERT
  WITH CHECK (
    sailor_id IN (
      SELECT id FROM sailor_profiles WHERE user_id = auth.uid()
    )
  );

-- Coaches can see shares sent to them
CREATE POLICY "Coaches can see shares sent to them"
  ON race_shares
  FOR SELECT
  USING (
    recipient_type = 'coach' AND
    recipient_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE race_shares IS 'Tracks when sailors share their race strategies or analyses with others';
COMMENT ON COLUMN race_shares.share_type IS 'Type of content shared: pre_race (strategy), post_race (analysis), or result (quick result)';
COMMENT ON COLUMN race_shares.channel IS 'Channel used for sharing: whatsapp, email, coach, crew, native, or copy';
COMMENT ON COLUMN race_shares.recipient_id IS 'ID of the recipient (coach_profile.id or crew_member.id) for in-app shares';
COMMENT ON COLUMN race_shares.content_snapshot IS 'Optional JSON snapshot of what was shared at that moment';
