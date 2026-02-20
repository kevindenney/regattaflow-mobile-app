-- ============================================================================
-- Atomic unread count increment for messaging
-- Prevents race conditions when multiple messages are sent simultaneously
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_unread_count(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_last_message_at TIMESTAMPTZ,
  p_last_message_preview TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coaching_conversations
  SET
    last_message_at = p_last_message_at,
    last_message_preview = p_last_message_preview,
    coach_unread_count = CASE
      WHEN p_sender_id = sailor_id THEN coach_unread_count + 1
      ELSE coach_unread_count
    END,
    sailor_unread_count = CASE
      WHEN p_sender_id = coach_id THEN sailor_unread_count + 1
      ELSE sailor_unread_count
    END
  WHERE id = p_conversation_id;
END;
$$;
