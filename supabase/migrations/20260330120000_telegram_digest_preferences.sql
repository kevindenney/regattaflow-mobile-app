-- Add columns for digest delivery and preferences
ALTER TABLE telegram_links ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
ALTER TABLE telegram_links ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE telegram_links ADD COLUMN IF NOT EXISTS digest_timezone TEXT NOT NULL DEFAULT 'UTC';

-- Index for cron query: active + digest_enabled + has chat_id
CREATE INDEX IF NOT EXISTS idx_telegram_links_digest
  ON telegram_links (is_active, digest_enabled)
  WHERE telegram_chat_id IS NOT NULL AND linked_at IS NOT NULL;
