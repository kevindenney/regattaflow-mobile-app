-- =============================================================================
-- Create Group Thread Function
--
-- SECURITY DEFINER function to create group threads, bypassing RLS.
-- This matches the pattern used by find_or_create_direct_thread for DMs.
-- =============================================================================

CREATE OR REPLACE FUNCTION create_group_thread(
  thread_name TEXT,
  thread_emoji TEXT DEFAULT '⛵',
  member_ids UUID[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  new_thread_id UUID;
  member_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Validate thread name
  IF thread_name IS NULL OR length(trim(thread_name)) = 0 THEN
    RAISE EXCEPTION 'Thread name is required';
  END IF;

  -- Create the thread
  INSERT INTO crew_threads (name, owner_id, avatar_emoji, thread_type)
  VALUES (trim(thread_name), current_user_id, COALESCE(thread_emoji, '⛵'), 'group')
  RETURNING id INTO new_thread_id;

  -- Add owner as first member
  INSERT INTO crew_thread_members (thread_id, user_id, role)
  VALUES (new_thread_id, current_user_id, 'owner');

  -- Add additional members
  IF member_ids IS NOT NULL AND array_length(member_ids, 1) > 0 THEN
    FOREACH member_id IN ARRAY member_ids
    LOOP
      -- Skip if it's the owner (already added)
      IF member_id != current_user_id THEN
        INSERT INTO crew_thread_members (thread_id, user_id, role)
        VALUES (new_thread_id, member_id, 'member')
        ON CONFLICT (thread_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN new_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_group_thread(TEXT, TEXT, UUID[]) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION create_group_thread IS
  'Creates a new group thread with the current user as owner.
   Uses SECURITY DEFINER to bypass RLS for thread creation.
   Parameters:
   - thread_name: Required name for the group
   - thread_emoji: Optional emoji (defaults to ⛵)
   - member_ids: Optional array of user IDs to add as members';
