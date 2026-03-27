-- Interest Manifesto + AI Memory tables
-- Phase 1: Data foundation for conversational AI coaching
-- Fully idempotent: safe to re-run after partial failures

-- 1. User Interest Manifesto — freeform philosophy + AI-extracted fields
CREATE TABLE IF NOT EXISTS user_interest_manifesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  philosophies JSONB DEFAULT '[]',
  role_models JSONB DEFAULT '[]',
  weekly_cadence JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, interest_id)
);

-- RLS
ALTER TABLE user_interest_manifesto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own manifesto" ON user_interest_manifesto;
CREATE POLICY "Users can read own manifesto"
  ON user_interest_manifesto FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own manifesto" ON user_interest_manifesto;
CREATE POLICY "Users can insert own manifesto"
  ON user_interest_manifesto FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own manifesto" ON user_interest_manifesto;
CREATE POLICY "Users can update own manifesto"
  ON user_interest_manifesto FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own manifesto" ON user_interest_manifesto;
CREATE POLICY "Users can delete own manifesto"
  ON user_interest_manifesto FOR DELETE
  USING (auth.uid() = user_id);

-- 2. AI Interest Insights — persistent AI memory per user per interest
CREATE TABLE IF NOT EXISTS ai_interest_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'strength', 'weakness', 'pattern', 'recommendation', 'preference', 'deviation_pattern'
  )),
  content TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  evidence_step_ids JSONB DEFAULT '[]',
  superseded_by UUID REFERENCES ai_interest_insights(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ai_interest_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own insights" ON ai_interest_insights;
CREATE POLICY "Users can read own insights"
  ON ai_interest_insights FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON ai_interest_insights;
CREATE POLICY "Users can insert own insights"
  ON ai_interest_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own insights" ON ai_interest_insights;
CREATE POLICY "Users can update own insights"
  ON ai_interest_insights FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON ai_interest_insights;
CREATE POLICY "Users can delete own insights"
  ON ai_interest_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_interest_insights_user_interest
  ON ai_interest_insights(user_id, interest_id)
  WHERE active = true;

-- 3. AI Conversations — persistent conversation threads
-- Drop pre-existing broken table from earlier attempt (missing status column)
DROP TABLE IF EXISTS ai_conversations CASCADE;

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('capture', 'train', 'review', 'manifesto')),
  context_id UUID,
  messages JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fetching active conversations
CREATE INDEX idx_ai_conversations_user_interest
  ON ai_conversations(user_id, interest_id, context_type)
  WHERE status = 'active';
