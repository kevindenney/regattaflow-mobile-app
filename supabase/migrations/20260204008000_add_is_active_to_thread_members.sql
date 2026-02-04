-- Migration: Add is_active column to crew_thread_members
-- Fixes: Bug #1 - Message sending fails due to missing column
-- Reference: push_notifications.sql line 194 references ctm.is_active
-- =============================================================================

-- Add is_active column to crew_thread_members
ALTER TABLE crew_thread_members
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create partial index for efficient active member lookups
CREATE INDEX IF NOT EXISTS idx_crew_thread_members_active
ON crew_thread_members(thread_id, is_active)
WHERE is_active = true;

-- Document the column purpose
COMMENT ON COLUMN crew_thread_members.is_active IS
'Whether the user is an active participant in the thread. Set to false when user leaves thread but history is preserved.';

-- Ensure all existing records have is_active = true (defensive)
UPDATE crew_thread_members
SET is_active = true
WHERE is_active IS NULL;
