-- Add pending_photo_url to telegram_conversations for photo-attach button flow.
-- When a user sends a photo, the uploaded URL is stored here temporarily.
-- When the user taps an "Attach to: Step" button, the callback handler reads
-- and clears this field.

ALTER TABLE telegram_conversations
  ADD COLUMN IF NOT EXISTS pending_photo_url TEXT;
