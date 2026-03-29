-- Telegram integration: account linking + conversation state
-- Enables users to interact with BetterAt via Telegram AI agent

-- =============================================================================
-- telegram_links — maps Telegram users to BetterAt accounts
-- =============================================================================

CREATE TABLE IF NOT EXISTS telegram_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  telegram_username TEXT,
  link_code TEXT,
  link_code_expires_at TIMESTAMPTZ,
  linked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active link per Telegram user
CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_links_tg_user_active
  ON telegram_links(telegram_user_id) WHERE is_active = true;

-- Look up by BetterAt user
CREATE INDEX IF NOT EXISTS idx_telegram_links_user
  ON telegram_links(user_id) WHERE user_id IS NOT NULL;

-- Look up by link code (during linking flow)
CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_links_code
  ON telegram_links(link_code) WHERE link_code IS NOT NULL;

ALTER TABLE telegram_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own telegram links"
  ON telegram_links FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own telegram links"
  ON telegram_links FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- telegram_conversations — conversation history per Telegram chat
-- =============================================================================

CREATE TABLE IF NOT EXISTS telegram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_conv_chat
  ON telegram_conversations(telegram_chat_id);

CREATE INDEX IF NOT EXISTS idx_telegram_conv_user
  ON telegram_conversations(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE telegram_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own telegram conversations"
  ON telegram_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE telegram_links IS 'Maps Telegram user IDs to BetterAt accounts for the Telegram AI agent';
COMMENT ON TABLE telegram_conversations IS 'Stores conversation history between users and the BetterAt Telegram bot';
