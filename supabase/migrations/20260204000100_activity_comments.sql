-- =============================================================================
-- Activity Comments: Allow followers to comment on race activity in the Follow feed
-- =============================================================================

-- activity_comments: Comments on sailor activity (race results, entries, etc.)
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('race_result', 'race_entry', 'race_completion', 'achievement')),
  activity_id UUID NOT NULL,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The sailor being commented on
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The commenter
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity
  ON activity_comments(activity_type, activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_target_user
  ON activity_comments(target_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user
  ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created
  ON activity_comments(created_at DESC);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Comments are visible to:
-- 1. The target user (sailor whose activity is being commented on)
-- 2. The commenter
-- 3. Anyone who follows the target user (public activity feed)
CREATE POLICY "Activity comments are visible to followers and participants"
  ON activity_comments FOR SELECT
  USING (
    -- Commenter can see their own comments
    auth.uid() = user_id
    OR
    -- Target user can see comments on their activity
    auth.uid() = target_user_id
    OR
    -- Followers of the target user can see comments
    EXISTS (
      SELECT 1 FROM user_follows
      WHERE user_follows.follower_id = auth.uid()
      AND user_follows.following_id = activity_comments.target_user_id
    )
  );

-- Users can comment on activity of users they follow
CREATE POLICY "Users can comment on followed users' activity"
  ON activity_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Can comment on own activity
      auth.uid() = target_user_id
      OR
      -- Can comment on followed users' activity
      EXISTS (
        SELECT 1 FROM user_follows
        WHERE user_follows.follower_id = auth.uid()
        AND user_follows.following_id = activity_comments.target_user_id
      )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON activity_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments, target users can delete comments on their activity
CREATE POLICY "Users can delete their own comments or target users can moderate"
  ON activity_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    auth.uid() = target_user_id
  );

-- =============================================================================
-- Trigger to create notification when someone comments
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_on_activity_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user is commenting on their own activity
  IF NEW.user_id = NEW.target_user_id THEN
    RETURN NEW;
  END IF;

  -- Create a notification for the target user
  INSERT INTO social_notifications (
    user_id,
    type,
    actor_id,
    reference_type,
    reference_id,
    message
  ) VALUES (
    NEW.target_user_id,
    'comment',
    NEW.user_id,
    'activity_comment',
    NEW.id,
    LEFT(NEW.content, 100) -- Truncate long messages for notification preview
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_activity_comment
AFTER INSERT ON activity_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_activity_comment();

-- Note: Profile data is joined at the service layer to avoid schema dependencies
