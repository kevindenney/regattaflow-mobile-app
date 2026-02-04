-- =============================================================================
-- Thread Types: Add support for different thread types (direct, group, fleet, crew)
-- =============================================================================

-- Add thread_type column to distinguish between conversation types
ALTER TABLE crew_threads
ADD COLUMN IF NOT EXISTS thread_type TEXT DEFAULT 'group'
CHECK (thread_type IN ('direct', 'group', 'fleet', 'crew'));

-- Add index for filtering by thread type
CREATE INDEX IF NOT EXISTS idx_crew_threads_type ON crew_threads(thread_type);

-- Update the view to include thread_type
DROP VIEW IF EXISTS crew_threads_with_details;

CREATE OR REPLACE VIEW crew_threads_with_details AS
SELECT
  ct.id,
  ct.name,
  ct.owner_id,
  ct.avatar_emoji,
  ct.thread_type,
  ct.created_at,
  ct.updated_at,
  ctm.user_id AS member_user_id,
  ctm.role,
  ctm.last_read_at,
  (
    SELECT COUNT(*)::int
    FROM crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    AND msg.created_at > COALESCE(ctm.last_read_at, ct.created_at)
    AND msg.user_id != ctm.user_id
  ) AS unread_count,
  (
    SELECT message
    FROM crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message,
  (
    SELECT user_id
    FROM crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message_user_id,
  (
    SELECT created_at
    FROM crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message_at
FROM crew_threads ct
JOIN crew_thread_members ctm ON ctm.thread_id = ct.id;

-- Grant access to the updated view
GRANT SELECT ON crew_threads_with_details TO authenticated;

-- =============================================================================
-- Helper function to find or create a direct message thread between two users
-- =============================================================================

CREATE OR REPLACE FUNCTION find_or_create_direct_thread(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  existing_thread_id UUID;
  new_thread_id UUID;
  other_user_name TEXT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Look for existing direct thread between these two users
  SELECT ct.id INTO existing_thread_id
  FROM crew_threads ct
  WHERE ct.thread_type = 'direct'
  AND EXISTS (
    SELECT 1 FROM crew_thread_members ctm1
    WHERE ctm1.thread_id = ct.id AND ctm1.user_id = current_user_id
  )
  AND EXISTS (
    SELECT 1 FROM crew_thread_members ctm2
    WHERE ctm2.thread_id = ct.id AND ctm2.user_id = other_user_id
  )
  AND (
    SELECT COUNT(*) FROM crew_thread_members WHERE thread_id = ct.id
  ) = 2
  LIMIT 1;

  -- Return existing thread if found
  IF existing_thread_id IS NOT NULL THEN
    RETURN existing_thread_id;
  END IF;

  -- Get other user's name for the thread
  SELECT full_name INTO other_user_name FROM profiles WHERE id = other_user_id;
  IF other_user_name IS NULL THEN
    other_user_name := 'Direct Message';
  END IF;

  -- Create new direct thread
  INSERT INTO crew_threads (name, owner_id, thread_type, avatar_emoji)
  VALUES (other_user_name, current_user_id, 'direct', '💬')
  RETURNING id INTO new_thread_id;

  -- Add both users as members
  INSERT INTO crew_thread_members (thread_id, user_id, role)
  VALUES
    (new_thread_id, current_user_id, 'owner'),
    (new_thread_id, other_user_id, 'member');

  RETURN new_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_or_create_direct_thread(UUID) TO authenticated;
