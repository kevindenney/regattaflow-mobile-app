-- Add public sharing support to timeline_steps
ALTER TABLE timeline_steps
  ADD COLUMN share_token TEXT UNIQUE,
  ADD COLUMN share_enabled BOOLEAN DEFAULT false,
  ADD COLUMN public_shared_at TIMESTAMPTZ;

CREATE INDEX idx_timeline_steps_share_token
  ON timeline_steps (share_token) WHERE share_enabled = true;
