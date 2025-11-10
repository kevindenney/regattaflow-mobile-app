-- =====================================================
-- Club Onboarding State Migration
-- Tracks onboarding sessions and AI suggestions
-- =====================================================

-- Drop tables if they exist from failed migration
DROP TABLE IF EXISTS public.club_suggested_data CASCADE;
DROP TABLE IF EXISTS public.club_onboarding_sessions CASCADE;

-- Club Onboarding Sessions Table
-- Stores partial progress and scraped data
CREATE TABLE public.club_onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id TEXT REFERENCES public.yacht_clubs(id) ON DELETE SET NULL,

    -- Data at different stages
    scraped_data JSONB DEFAULT '{}'::jsonb,
    suggested_data JSONB DEFAULT '{}'::jsonb,
    confirmed_data JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    source_url TEXT,
    conversation_history JSONB DEFAULT '[]'::jsonb,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Partial unique index for one active session per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_session_per_user
    ON public.club_onboarding_sessions(user_id)
    WHERE status = 'in_progress';

-- Club Suggested Data Table
-- Individual field suggestions awaiting user approval
CREATE TABLE public.club_suggested_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.club_onboarding_sessions(id) ON DELETE CASCADE,

    -- Field identification
    field_name TEXT NOT NULL,
    field_category TEXT CHECK (field_category IN ('basic', 'classes', 'events', 'contacts', 'venue', 'other')),

    -- Suggestion details
    suggested_value JSONB NOT NULL,
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    source TEXT NOT NULL CHECK (source IN ('scrape', 'chat', 'location', 'manual', 'discovery')),

    -- User action
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'edited')),
    edited_value JSONB,

    -- Metadata
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_club_onboarding_sessions_user_id ON public.club_onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_club_onboarding_sessions_status ON public.club_onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_club_onboarding_sessions_created_at ON public.club_onboarding_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_club_suggested_data_session_id ON public.club_suggested_data(session_id);
CREATE INDEX IF NOT EXISTS idx_club_suggested_data_status ON public.club_suggested_data(status);
CREATE INDEX IF NOT EXISTS idx_club_suggested_data_field_category ON public.club_suggested_data(field_category);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get onboarding progress summary
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(session_uuid UUID)
RETURNS TABLE (
    total_suggestions INTEGER,
    accepted_count INTEGER,
    rejected_count INTEGER,
    pending_count INTEGER,
    edited_count INTEGER,
    completion_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_suggestions,
        COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_count,
        COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER as rejected_count,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
        COUNT(*) FILTER (WHERE status = 'edited')::INTEGER as edited_count,
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ((COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected', 'edited'))::FLOAT / COUNT(*)::FLOAT) * 100)::INTEGER
        END as completion_percentage
    FROM public.club_suggested_data
    WHERE session_id = session_uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Cleanup abandoned sessions (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_onboarding_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.club_onboarding_sessions
        WHERE status = 'abandoned'
        AND updated_at < NOW() - INTERVAL '7 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on sessions
DROP TRIGGER IF EXISTS update_club_onboarding_sessions_updated_at ON public.club_onboarding_sessions;
CREATE TRIGGER update_club_onboarding_sessions_updated_at
    BEFORE UPDATE ON public.club_onboarding_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at timestamp on suggested data
DROP TRIGGER IF EXISTS update_club_suggested_data_updated_at ON public.club_suggested_data;
CREATE TRIGGER update_club_suggested_data_updated_at
    BEFORE UPDATE ON public.club_suggested_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update session progress when suggestions change
CREATE OR REPLACE FUNCTION public.update_session_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_progress INTEGER;
BEGIN
    -- Calculate progress percentage
    SELECT completion_percentage
    INTO v_progress
    FROM public.get_onboarding_progress(COALESCE(NEW.session_id, OLD.session_id));

    -- Update session
    UPDATE public.club_onboarding_sessions
    SET progress_percentage = v_progress,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_session_progress_on_suggestion_change ON public.club_suggested_data;
CREATE TRIGGER update_session_progress_on_suggestion_change
    AFTER INSERT OR UPDATE OR DELETE ON public.club_suggested_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_progress();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.club_onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_suggested_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
DROP POLICY IF EXISTS "Users can view own onboarding sessions" ON public.club_onboarding_sessions;
CREATE POLICY "Users can view own onboarding sessions"
    ON public.club_onboarding_sessions FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own sessions
DROP POLICY IF EXISTS "Users can create onboarding sessions" ON public.club_onboarding_sessions;
CREATE POLICY "Users can create onboarding sessions"
    ON public.club_onboarding_sessions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
DROP POLICY IF EXISTS "Users can update own onboarding sessions" ON public.club_onboarding_sessions;
CREATE POLICY "Users can update own onboarding sessions"
    ON public.club_onboarding_sessions FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own sessions
DROP POLICY IF EXISTS "Users can delete own onboarding sessions" ON public.club_onboarding_sessions;
CREATE POLICY "Users can delete own onboarding sessions"
    ON public.club_onboarding_sessions FOR DELETE
    USING (user_id = auth.uid());

-- Users can view suggestions for their sessions
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.club_suggested_data;
CREATE POLICY "Users can view own suggestions"
    ON public.club_suggested_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.club_onboarding_sessions
            WHERE id = club_suggested_data.session_id
            AND user_id = auth.uid()
        )
    );

-- Users can create suggestions for their sessions
DROP POLICY IF EXISTS "Users can create suggestions" ON public.club_suggested_data;
CREATE POLICY "Users can create suggestions"
    ON public.club_suggested_data FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.club_onboarding_sessions
            WHERE id = club_suggested_data.session_id
            AND user_id = auth.uid()
        )
    );

-- Users can update suggestions for their sessions
DROP POLICY IF EXISTS "Users can update own suggestions" ON public.club_suggested_data;
CREATE POLICY "Users can update own suggestions"
    ON public.club_suggested_data FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.club_onboarding_sessions
            WHERE id = club_suggested_data.session_id
            AND user_id = auth.uid()
        )
    );

-- Users can delete suggestions for their sessions
DROP POLICY IF EXISTS "Users can delete own suggestions" ON public.club_suggested_data;
CREATE POLICY "Users can delete own suggestions"
    ON public.club_suggested_data FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.club_onboarding_sessions
            WHERE id = club_suggested_data.session_id
            AND user_id = auth.uid()
        )
    );

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_onboarding_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_suggested_data TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_onboarding_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_abandoned_onboarding_sessions() TO authenticated;
