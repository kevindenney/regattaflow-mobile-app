-- Add completed_at and due_at to timeline_steps
-- completed_at: auto-set when status → completed, cleared when un-completing
-- due_at: optional deadline for externally-imposed due dates

ALTER TABLE timeline_steps
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

-- Backfill completed_at for already-completed steps using updated_at as best guess
UPDATE timeline_steps
  SET completed_at = updated_at
  WHERE status = 'completed' AND completed_at IS NULL;

-- Index for querying overdue steps
CREATE INDEX IF NOT EXISTS idx_timeline_steps_due_at
  ON timeline_steps (due_at)
  WHERE due_at IS NOT NULL AND status != 'completed';
