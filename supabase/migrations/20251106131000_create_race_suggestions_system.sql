-- =====================================================
-- Race Suggestions System Migration
-- Creates tables for intelligent race recommendations
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- Race Suggestions Cache
-- Stores pre-computed race suggestions for quick retrieval
CREATE TABLE IF NOT EXISTS public.race_suggestions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Suggestion Metadata
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('club_event', 'fleet_race', 'pattern_match', 'template', 'similar_sailor')),
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Race Data (flexible JSONB for various race formats)
    race_data JSONB NOT NULL,

    -- Source Information
    source_id UUID, -- Can be club_id, fleet_id, or pattern_id depending on type
    source_metadata JSONB,

    -- Explanation for user
    suggestion_reason TEXT,

    -- Cache Management
    expires_at TIMESTAMPTZ NOT NULL,
    dismissed_at TIMESTAMPTZ, -- User dismissed this suggestion
    accepted_at TIMESTAMPTZ, -- User accepted and added this race

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure we don't show same suggestion twice
    CONSTRAINT unique_user_suggestion UNIQUE (user_id, suggestion_type, source_id, race_data)
);

-- Race Patterns
-- ML-derived patterns from user's racing history
CREATE TABLE IF NOT EXISTS public.race_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Pattern Classification
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('seasonal', 'recurring_series', 'venue_preference', 'class_preference', 'temporal_annual')),

    -- Pattern Data (stores pattern-specific attributes)
    pattern_data JSONB NOT NULL,

    -- Statistical Confidence
    confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
    occurrence_count INTEGER DEFAULT 1, -- How many times this pattern occurred
    last_matched_at TIMESTAMPTZ,

    -- Pattern Effectiveness
    suggestion_acceptance_rate DECIMAL(3, 2) DEFAULT 0, -- How often suggestions from this pattern are accepted

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Race Templates
-- Common race structures the user frequently uses
CREATE TABLE IF NOT EXISTS public.race_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Template Info
    template_name TEXT NOT NULL,
    race_name_pattern TEXT, -- e.g., "Spring Championship %YEAR%"

    -- Common Fields
    venue_name TEXT,
    venue_coordinates JSONB,
    boat_class TEXT,
    race_series TEXT,
    typical_month INTEGER CHECK (typical_month >= 1 AND typical_month <= 12),

    -- Usage Statistics
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ,

    -- Full template data
    template_data JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suggestion Feedback
-- Track user interactions with suggestions for ML improvement
CREATE TABLE IF NOT EXISTS public.suggestion_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    suggestion_id UUID REFERENCES public.race_suggestions_cache(id) ON DELETE SET NULL,

    -- Feedback Type
    action TEXT NOT NULL CHECK (action IN ('accepted', 'dismissed', 'modified', 'clicked')),

    -- Context
    suggestion_type TEXT NOT NULL,
    confidence_score DECIMAL(3, 2),

    -- Modified Fields (if user modified before accepting)
    modified_fields TEXT[],

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Race Suggestions Cache Indexes
CREATE INDEX IF NOT EXISTS idx_race_suggestions_cache_user_id ON public.race_suggestions_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_race_suggestions_cache_type ON public.race_suggestions_cache(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_race_suggestions_cache_expires_at ON public.race_suggestions_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_race_suggestions_cache_user_type ON public.race_suggestions_cache(user_id, suggestion_type);
CREATE INDEX IF NOT EXISTS idx_race_suggestions_cache_dismissed ON public.race_suggestions_cache(dismissed_at) WHERE dismissed_at IS NULL;

-- Race Patterns Indexes
CREATE INDEX IF NOT EXISTS idx_race_patterns_user_id ON public.race_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_race_patterns_type ON public.race_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_race_patterns_confidence ON public.race_patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_race_patterns_user_type ON public.race_patterns(user_id, pattern_type);

-- Race Templates Indexes
CREATE INDEX IF NOT EXISTS idx_race_templates_user_id ON public.race_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_race_templates_usage ON public.race_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_race_templates_last_used ON public.race_templates(last_used_at DESC);

-- Suggestion Feedback Indexes
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_user_id ON public.suggestion_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_suggestion_id ON public.suggestion_feedback(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_action ON public.suggestion_feedback(action);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Clean expired suggestions
CREATE OR REPLACE FUNCTION public.clean_expired_suggestions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.race_suggestions_cache
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active suggestions for user
CREATE OR REPLACE FUNCTION public.get_active_suggestions(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    suggestion_type TEXT,
    race_data JSONB,
    confidence_score DECIMAL,
    suggestion_reason TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rsc.id,
        rsc.suggestion_type,
        rsc.race_data,
        rsc.confidence_score,
        rsc.suggestion_reason,
        rsc.created_at
    FROM public.race_suggestions_cache rsc
    WHERE rsc.user_id = p_user_id
        AND rsc.expires_at > NOW()
        AND rsc.dismissed_at IS NULL
        AND rsc.accepted_at IS NULL
    ORDER BY rsc.confidence_score DESC, rsc.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Record suggestion feedback
CREATE OR REPLACE FUNCTION public.record_suggestion_feedback(
    p_user_id UUID,
    p_suggestion_id UUID,
    p_action TEXT,
    p_modified_fields TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_feedback_id UUID;
    v_suggestion RECORD;
BEGIN
    -- Get suggestion details
    SELECT suggestion_type, confidence_score
    INTO v_suggestion
    FROM public.race_suggestions_cache
    WHERE id = p_suggestion_id;

    -- Insert feedback
    INSERT INTO public.suggestion_feedback (
        user_id,
        suggestion_id,
        action,
        suggestion_type,
        confidence_score,
        modified_fields
    )
    VALUES (
        p_user_id,
        p_suggestion_id,
        p_action,
        v_suggestion.suggestion_type,
        v_suggestion.confidence_score,
        p_modified_fields
    )
    RETURNING id INTO v_feedback_id;

    -- Update suggestion cache
    IF p_action = 'accepted' THEN
        UPDATE public.race_suggestions_cache
        SET accepted_at = NOW()
        WHERE id = p_suggestion_id;
    ELSIF p_action = 'dismissed' THEN
        UPDATE public.race_suggestions_cache
        SET dismissed_at = NOW()
        WHERE id = p_suggestion_id;
    END IF;

    RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update pattern effectiveness based on feedback
CREATE OR REPLACE FUNCTION public.update_pattern_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pattern acceptance rate when feedback is recorded
    IF NEW.action = 'accepted' AND NEW.suggestion_id IS NOT NULL THEN
        UPDATE public.race_patterns rp
        SET
            suggestion_acceptance_rate = (
                SELECT
                    COUNT(*) FILTER (WHERE action = 'accepted')::DECIMAL /
                    NULLIF(COUNT(*)::DECIMAL, 0)
                FROM public.suggestion_feedback sf
                JOIN public.race_suggestions_cache rsc ON sf.suggestion_id = rsc.id
                WHERE rsc.source_id = rp.id
                    AND sf.user_id = NEW.user_id
            ),
            updated_at = NOW()
        WHERE EXISTS (
            SELECT 1
            FROM public.race_suggestions_cache rsc
            WHERE rsc.id = NEW.suggestion_id
                AND rsc.source_id = rp.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on race_suggestions_cache
DROP TRIGGER IF EXISTS update_race_suggestions_cache_updated_at ON public.race_suggestions_cache;
CREATE TRIGGER update_race_suggestions_cache_updated_at
    BEFORE UPDATE ON public.race_suggestions_cache
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at timestamp on race_patterns
DROP TRIGGER IF EXISTS update_race_patterns_updated_at ON public.race_patterns;
CREATE TRIGGER update_race_patterns_updated_at
    BEFORE UPDATE ON public.race_patterns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at timestamp on race_templates
DROP TRIGGER IF EXISTS update_race_templates_updated_at ON public.race_templates;
CREATE TRIGGER update_race_templates_updated_at
    BEFORE UPDATE ON public.race_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update pattern effectiveness when feedback is recorded
DROP TRIGGER IF EXISTS update_pattern_effectiveness_trigger ON public.suggestion_feedback;
CREATE TRIGGER update_pattern_effectiveness_trigger
    AFTER INSERT ON public.suggestion_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pattern_effectiveness();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.race_suggestions_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own suggestions
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.race_suggestions_cache;
CREATE POLICY "Users can view own suggestions"
    ON public.race_suggestions_cache FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own suggestions" ON public.race_suggestions_cache;
CREATE POLICY "Users can update own suggestions"
    ON public.race_suggestions_cache FOR UPDATE
    USING (user_id = auth.uid());

-- Users can only see their own patterns
DROP POLICY IF EXISTS "Users can view own patterns" ON public.race_patterns;
CREATE POLICY "Users can view own patterns"
    ON public.race_patterns FOR SELECT
    USING (user_id = auth.uid());

-- Users can only see their own templates
DROP POLICY IF EXISTS "Users can view own templates" ON public.race_templates;
CREATE POLICY "Users can view own templates"
    ON public.race_templates FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own templates" ON public.race_templates;
CREATE POLICY "Users can manage own templates"
    ON public.race_templates FOR ALL
    USING (user_id = auth.uid());

-- Users can only see their own feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON public.suggestion_feedback;
CREATE POLICY "Users can view own feedback"
    ON public.suggestion_feedback FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.suggestion_feedback;
CREATE POLICY "Users can insert own feedback"
    ON public.suggestion_feedback FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on tables
GRANT SELECT, UPDATE ON public.race_suggestions_cache TO authenticated;
GRANT SELECT ON public.race_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.race_templates TO authenticated;
GRANT SELECT, INSERT ON public.suggestion_feedback TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.clean_expired_suggestions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_suggestions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_suggestion_feedback(UUID, UUID, TEXT, TEXT[]) TO authenticated;
