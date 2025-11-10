-- ============================================================================
-- AI Activity Schema Migration
-- ============================================================================
-- Creates tables for Claude Skills integration tracking, logging, and content
-- Created: 2025-11-01
-- ============================================================================

-- ============================================================================
-- Table: ai_activity_logs
-- Tracks all Claude API calls with metrics, costs, and status
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Skill/Action
  skill TEXT NOT NULL, -- e.g., 'event_document_drafting', 'race_day_comms', 'support_chat'
  action TEXT NOT NULL, -- e.g., 'generate_nor', 'draft_notification', 'chat_response'

  -- Status & Metrics
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  tokens_in INTEGER CHECK (tokens_in >= 0),
  tokens_out INTEGER CHECK (tokens_out >= 0),
  duration_ms INTEGER CHECK (duration_ms >= 0),

  -- Request/Response
  request_payload JSONB, -- Input parameters (sanitized, no PII)
  response_payload JSONB, -- Claude's response (sanitized)
  error_message TEXT,

  -- Model Info
  model TEXT, -- e.g., 'claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT ai_activity_logs_club_user_idx UNIQUE (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_activity_logs_club_id ON public.ai_activity_logs(club_id);
CREATE INDEX IF NOT EXISTS idx_ai_activity_logs_user_id ON public.ai_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_activity_logs_skill ON public.ai_activity_logs(skill);
CREATE INDEX IF NOT EXISTS idx_ai_activity_logs_status ON public.ai_activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_activity_logs_created_at ON public.ai_activity_logs(created_at DESC);

-- ============================================================================
-- Table: ai_generated_documents
-- Stores AI-generated documents (NORs, SIs, summaries, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.club_events(id) ON DELETE CASCADE, -- Optional: linked to event
  race_id UUID, -- Optional: linked to race_events
  activity_log_id UUID REFERENCES public.ai_activity_logs(id) ON DELETE SET NULL,

  -- Document Metadata
  document_type TEXT NOT NULL CHECK (document_type IN ('nor', 'si', 'amendment', 'summary', 'communication', 'analysis', 'report', 'other')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published', 'archived', 'rejected')),

  -- Content
  draft_text TEXT NOT NULL,
  final_text TEXT, -- Edited version after human review
  metadata JSONB, -- Additional structured data (sections, formatting, etc.)

  -- Attribution
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_documents_club_id ON public.ai_generated_documents(club_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_documents_event_id ON public.ai_generated_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_documents_status ON public.ai_generated_documents(status);
CREATE INDEX IF NOT EXISTS idx_ai_generated_documents_created_at ON public.ai_generated_documents(created_at DESC);

-- ============================================================================
-- Table: ai_notifications
-- Queue for AI-generated notifications (push, email, SMS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  race_id UUID, -- Optional: linked to race_events
  event_id UUID REFERENCES public.club_events(id) ON DELETE CASCADE,
  activity_log_id UUID REFERENCES public.ai_activity_logs(id) ON DELETE SET NULL,

  -- Notification Details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('race_update', 'event_reminder', 'weather_alert', 'schedule_change', 'general')),
  audience TEXT NOT NULL CHECK (audience IN ('all', 'participants', 'skippers', 'race_committee', 'admins', 'custom')),
  audience_filter JSONB, -- Custom filters (e.g., boat_class: ['Laser', '420'])

  -- Content
  subject TEXT NOT NULL,
  draft_body TEXT NOT NULL,
  final_body TEXT, -- Edited version after review
  draft_channels TEXT[] NOT NULL, -- ['push', 'email', 'sms']

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'failed', 'cancelled')),

  -- Attribution
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_notifications_club_id ON public.ai_notifications(club_id);
-- Note: status column doesn't exist in current schema, using published instead
CREATE INDEX IF NOT EXISTS idx_ai_notifications_published ON public.ai_notifications(published);
CREATE INDEX IF NOT EXISTS idx_ai_notifications_created_at ON public.ai_notifications(created_at DESC);

-- ============================================================================
-- Table: ai_conversations
-- Stores chat conversations for membership support
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation Details
  title TEXT, -- Auto-generated summary of first message
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated', 'archived')),

  -- Messages (array of {role, content, timestamp})
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Context for AI (updated with each interaction)
  context_snapshot JSONB, -- Club info, user role, recent events, etc.

  -- Escalation
  escalated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Staff member
  escalation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_club_id ON public.ai_conversations(club_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
-- Note: status and last_message_at columns don't exist in current schema
-- CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON public.ai_conversations(status);
-- CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message_at ON public.ai_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);

-- ============================================================================
-- Table: ai_usage_monthly
-- Aggregated monthly usage metrics per club for billing/tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month (e.g., '2025-11-01')

  -- Aggregated Metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens_in INTEGER NOT NULL DEFAULT 0,
  total_tokens_out INTEGER NOT NULL DEFAULT 0,
  total_duration_ms BIGINT NOT NULL DEFAULT 0,

  -- By Skill (JSONB for flexibility)
  requests_by_skill JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"event_drafting": 10, "support_chat": 25}
  tokens_by_skill JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"event_drafting": {"in": 1000, "out": 2000}}

  -- Cost Estimation (optional, calculated client-side or via trigger)
  estimated_cost_usd DECIMAL(10, 4),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one row per club per month
  CONSTRAINT ai_usage_monthly_club_month_unique UNIQUE (club_id, usage_month)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_club_id ON public.ai_usage_monthly(club_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_month ON public.ai_usage_monthly(usage_month DESC);

-- ============================================================================
-- Function: Update ai_usage_monthly on new activity log
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_usage_monthly()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  month_start DATE;
BEGIN
  -- Only process completed logs
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get the first day of the month
  month_start := DATE_TRUNC('month', NEW.created_at)::DATE;

  -- Insert or update monthly usage
  INSERT INTO public.ai_usage_monthly (
    club_id,
    month,
    total_requests,
    total_tokens_in,
    total_tokens_out,
    total_duration_ms,
    requests_by_skill,
    tokens_by_skill,
    updated_at
  )
  VALUES (
    NEW.club_id,
    month_start,
    1,
    COALESCE(NEW.tokens_in, 0),
    COALESCE(NEW.tokens_out, 0),
    COALESCE(NEW.duration_ms, 0),
    jsonb_build_object(NEW.skill, 1),
    jsonb_build_object(NEW.skill, jsonb_build_object(
      'in', COALESCE(NEW.tokens_in, 0),
      'out', COALESCE(NEW.tokens_out, 0)
    )),
    NOW()
  )
  ON CONFLICT (club_id, month) DO UPDATE SET
    total_requests = ai_usage_monthly.total_requests + 1,
    total_tokens_in = ai_usage_monthly.total_tokens_in + COALESCE(NEW.tokens_in, 0),
    total_tokens_out = ai_usage_monthly.total_tokens_out + COALESCE(NEW.tokens_out, 0),
    total_duration_ms = ai_usage_monthly.total_duration_ms + COALESCE(NEW.duration_ms, 0),
    requests_by_skill = jsonb_set(
      COALESCE(ai_usage_monthly.requests_by_skill, '{}'::jsonb),
      ARRAY[NEW.skill],
      to_jsonb(COALESCE((ai_usage_monthly.requests_by_skill->>NEW.skill)::integer, 0) + 1),
      true
    ),
    tokens_by_skill = jsonb_set(
      COALESCE(ai_usage_monthly.tokens_by_skill, '{}'::jsonb),
      ARRAY[NEW.skill],
      jsonb_build_object(
        'in', COALESCE((ai_usage_monthly.tokens_by_skill->NEW.skill->>'in')::integer, 0) + COALESCE(NEW.tokens_in, 0),
        'out', COALESCE((ai_usage_monthly.tokens_by_skill->NEW.skill->>'out')::integer, 0) + COALESCE(NEW.tokens_out, 0)
      ),
      true
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_ai_usage_monthly ON public.ai_activity_logs;
CREATE TRIGGER trigger_update_ai_usage_monthly
  AFTER INSERT OR UPDATE ON public.ai_activity_logs
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_ai_usage_monthly();

-- ============================================================================
-- RLS Policies (Row Level Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.ai_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_monthly ENABLE ROW LEVEL SECURITY;

-- ai_activity_logs: Club admins can view logs
CREATE POLICY ai_activity_logs_club_admin_select
  ON public.ai_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_activity_logs.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'sailing_manager', 'race_officer')
    )
  );

-- ai_generated_documents: Club members can view, admins can insert/update
CREATE POLICY ai_generated_documents_club_member_select
  ON public.ai_generated_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_generated_documents.club_id
        AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY ai_generated_documents_club_admin_all
  ON public.ai_generated_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_generated_documents.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'sailing_manager', 'race_officer', 'communications')
    )
  );

-- ai_notifications: Similar to documents
CREATE POLICY ai_notifications_club_member_select
  ON public.ai_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_notifications.club_id
        AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY ai_notifications_club_admin_all
  ON public.ai_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_notifications.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'sailing_manager', 'race_officer', 'communications')
    )
  );

-- ai_conversations: Users can only access their own conversations
CREATE POLICY ai_conversations_user_select
  ON public.ai_conversations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY ai_conversations_user_insert
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_conversations_user_update
  ON public.ai_conversations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Club admins can view all conversations for support
CREATE POLICY ai_conversations_club_admin_select
  ON public.ai_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_conversations.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'sailing_manager', 'communications')
    )
  );

-- ai_usage_monthly: Club admins can view usage
CREATE POLICY ai_usage_monthly_club_admin_select
  ON public.ai_usage_monthly
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_usage_monthly.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'treasurer')
    )
  );

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.ai_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_generated_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_conversations TO authenticated;
GRANT SELECT ON public.ai_usage_monthly TO authenticated;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ AI Activity Schema created successfully!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - ai_activity_logs (tracks all Claude API calls)';
  RAISE NOTICE '  - ai_generated_documents (NORs, SIs, summaries, etc.)';
  RAISE NOTICE '  - ai_notifications (push/email/SMS queue)';
  RAISE NOTICE '  - ai_conversations (support chat history)';
  RAISE NOTICE '  - ai_usage_monthly (aggregated metrics for billing)';
  RAISE NOTICE 'Created trigger: update_ai_usage_monthly';
  RAISE NOTICE 'Created RLS policies for secure access';
END $$;
