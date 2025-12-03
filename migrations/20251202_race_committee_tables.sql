-- Migration: Race Committee Operations Tables
-- Description: Creates tables for race committee functionality - start sequences, flags, course signals
-- Date: 2025-12-02

-- ============================================================================
-- RACE START SEQUENCES TABLE
-- Tracks start sequence information for each race
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.race_start_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    
    -- Sequence Configuration
    sequence_type TEXT DEFAULT '5-minute' CHECK (sequence_type IN ('5-minute', '3-minute', 'custom')),
    warning_time TIMESTAMPTZ,
    prep_time TIMESTAMPTZ,
    one_minute_time TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'warning',
        'prep',
        'one_minute',
        'started',
        'completed',
        'postponed',
        'abandoned',
        'general_recall'
    )),
    
    -- Recall tracking
    recall_count INTEGER DEFAULT 0,
    last_recall_at TIMESTAMPTZ,
    
    -- Metadata
    started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_start_sequence UNIQUE (regatta_id, race_number)
);

CREATE INDEX IF NOT EXISTS idx_start_sequences_regatta ON public.race_start_sequences(regatta_id);
CREATE INDEX IF NOT EXISTS idx_start_sequences_race ON public.race_start_sequences(regatta_id, race_number);

-- ============================================================================
-- RACE FLAGS TABLE
-- Records flag signals displayed during racing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.race_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER,
    
    -- Flag Information
    flag_type TEXT NOT NULL,                         -- AP, N, 1st Sub, I, Z, U, Black, S, L, M, Y, C, etc.
    flag_description TEXT,
    action TEXT NOT NULL DEFAULT 'display' CHECK (action IN ('display', 'lower', 'dip')),
    
    -- Timing
    displayed_at TIMESTAMPTZ DEFAULT NOW(),
    lowered_at TIMESTAMPTZ,
    
    -- Location (optional)
    display_location TEXT,                           -- e.g., 'Signal Boat', 'Pin End'
    
    -- Recording info
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_race_flags_regatta ON public.race_flags(regatta_id);
CREATE INDEX IF NOT EXISTS idx_race_flags_race ON public.race_flags(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_race_flags_type ON public.race_flags(flag_type);

-- ============================================================================
-- RACE COURSE SIGNALS TABLE
-- Tracks course designations displayed to competitors
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.race_course_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    
    -- Course Information
    course_designation TEXT NOT NULL,                -- e.g., 'W3', 'L2', 'Triangle'
    course_description TEXT,                         -- Optional detailed description
    course_distance DECIMAL(6,2),                    -- Nautical miles (optional)
    
    -- Display timing
    signaled_at TIMESTAMPTZ DEFAULT NOW(),
    changed_at TIMESTAMPTZ,                          -- If course was modified
    
    -- Recording info
    signaled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_course_signal UNIQUE (regatta_id, race_number)
);

CREATE INDEX IF NOT EXISTS idx_course_signals_regatta ON public.race_course_signals(regatta_id);

-- ============================================================================
-- RACE OCS/UFD TRACKING TABLE
-- Tracks boats that are over early or receive UFD penalties
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.race_ocs_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    entry_id UUID NOT NULL REFERENCES public.race_entries(id) ON DELETE CASCADE,
    
    -- OCS Details
    violation_type TEXT NOT NULL CHECK (violation_type IN ('ocs', 'bfd', 'ufd', 'zfp')),
    violation_time TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status
    recalled BOOLEAN DEFAULT false,
    returned_correctly BOOLEAN,
    penalty_applied TEXT,                            -- e.g., 'DSQ', '20%', 'DNE'
    
    -- Recording
    observed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    video_evidence_url TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_ocs_entry UNIQUE (regatta_id, race_number, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_ocs_tracking_regatta ON public.race_ocs_tracking(regatta_id, race_number);

-- ============================================================================
-- RACE PROTESTS TABLE (if not exists)
-- Tracks formal protests filed during racing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.race_protests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    
    -- Protest Details
    protest_type TEXT NOT NULL CHECK (protest_type IN (
        'boat_vs_boat',
        'boat_vs_rc',
        'rc_vs_boat',
        'redress_request',
        'equipment_inspection',
        'measurement'
    )),
    
    -- Parties
    protestor_entry_id UUID REFERENCES public.race_entries(id) ON DELETE SET NULL,
    protestee_entry_ids UUID[],                      -- Array of boat IDs being protested
    
    -- Details
    rule_infringed TEXT,                             -- e.g., 'RRS 10', 'RRS 18.2(a)'
    incident_time TIMESTAMPTZ,
    incident_location TEXT,
    description TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'filed' CHECK (status IN (
        'filed',
        'accepted',
        'rejected',
        'withdrawn',
        'heard',
        'decided',
        'appealed'
    )),
    
    -- Hearing
    hearing_time TIMESTAMPTZ,
    hearing_location TEXT,
    
    -- Decision
    decision TEXT,
    decision_made_at TIMESTAMPTZ,
    penalties_applied JSONB,                         -- e.g., {"entry_id": "DSQ"}
    
    -- Recording
    filed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    filed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Attachments
    evidence_urls TEXT[],
    diagrams_urls TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protests_regatta ON public.race_protests(regatta_id);
CREATE INDEX IF NOT EXISTS idx_protests_race ON public.race_protests(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_protests_status ON public.race_protests(status);

-- ============================================================================
-- FINISH LINE RECORDS TABLE
-- Detailed finish line crossing records
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.race_finish_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    entry_id UUID NOT NULL REFERENCES public.race_entries(id) ON DELETE CASCADE,
    
    -- Timing
    finish_time TIMESTAMPTZ NOT NULL,
    elapsed_seconds INTEGER,
    corrected_seconds INTEGER,                       -- After handicap correction
    
    -- Position
    line_position INTEGER,                           -- Order at the line (raw)
    corrected_position INTEGER,                      -- After handicap
    
    -- Recording method
    recording_method TEXT DEFAULT 'manual' CHECK (recording_method IN (
        'manual',
        'transponder',
        'video',
        'finishlynx',
        'app'
    )),
    
    -- Additional data
    crossing_distance DECIMAL(4,2),                  -- Meters from pin (optional)
    
    -- Recorder
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_finish_record UNIQUE (regatta_id, race_number, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_finish_records_regatta ON public.race_finish_records(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_finish_records_position ON public.race_finish_records(regatta_id, race_number, line_position);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.race_start_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_course_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_ocs_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_protests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_finish_records ENABLE ROW LEVEL SECURITY;

-- Start sequences: Club staff can manage, participants can view
CREATE POLICY "Club staff can manage start sequences"
    ON public.race_start_sequences FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.regattas r
            JOIN public.club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_start_sequences.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'race_committee')
        )
    );

CREATE POLICY "Participants can view start sequences"
    ON public.race_start_sequences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.race_entries re
            WHERE re.regatta_id = race_start_sequences.regatta_id
            AND re.sailor_id = auth.uid()
        )
    );

-- Flags: Club staff can manage, public can view
CREATE POLICY "Club staff can manage flags"
    ON public.race_flags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.regattas r
            JOIN public.club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_flags.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'race_committee')
        )
    );

CREATE POLICY "Public can view flags"
    ON public.race_flags FOR SELECT
    USING (true);

-- Course signals: Similar policies
CREATE POLICY "Club staff can manage course signals"
    ON public.race_course_signals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.regattas r
            JOIN public.club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_course_signals.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'race_committee')
        )
    );

CREATE POLICY "Public can view course signals"
    ON public.race_course_signals FOR SELECT
    USING (true);

-- OCS tracking: Club staff only
CREATE POLICY "Club staff can manage OCS tracking"
    ON public.race_ocs_tracking FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.regattas r
            JOIN public.club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_ocs_tracking.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'race_committee')
        )
    );

-- Protests: Anyone can file, club staff can manage
CREATE POLICY "Anyone can file protests"
    ON public.race_protests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.race_entries re
            WHERE re.regatta_id = race_protests.regatta_id
            AND re.sailor_id = auth.uid()
        )
    );

CREATE POLICY "Club staff can manage protests"
    ON public.race_protests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.regattas r
            JOIN public.club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_protests.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

CREATE POLICY "Participants can view their protests"
    ON public.race_protests FOR SELECT
    USING (
        filed_by = auth.uid() OR
        protestor_entry_id IN (
            SELECT id FROM public.race_entries WHERE sailor_id = auth.uid()
        )
    );

-- Finish records: Club staff can manage, participants can view
CREATE POLICY "Club staff can manage finish records"
    ON public.race_finish_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.regattas r
            JOIN public.club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_finish_records.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'race_committee', 'scorer')
        )
    );

CREATE POLICY "Public can view finish records"
    ON public.race_finish_records FOR SELECT
    USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER trigger_start_sequences_updated
    BEFORE UPDATE ON public.race_start_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_course_signals_updated
    BEFORE UPDATE ON public.race_course_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_protests_updated
    BEFORE UPDATE ON public.race_protests
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_finish_records_updated
    BEFORE UPDATE ON public.race_finish_records
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.race_start_sequences TO anon;
GRANT SELECT ON public.race_flags TO anon;
GRANT SELECT ON public.race_course_signals TO anon;
GRANT SELECT ON public.race_finish_records TO anon;

GRANT ALL ON public.race_start_sequences TO authenticated;
GRANT ALL ON public.race_flags TO authenticated;
GRANT ALL ON public.race_course_signals TO authenticated;
GRANT ALL ON public.race_ocs_tracking TO authenticated;
GRANT ALL ON public.race_protests TO authenticated;
GRANT ALL ON public.race_finish_records TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.race_start_sequences IS 'Tracks start sequence information for each race';
COMMENT ON TABLE public.race_flags IS 'Records signal flags displayed during racing';
COMMENT ON TABLE public.race_course_signals IS 'Tracks course designations signaled to competitors';
COMMENT ON TABLE public.race_ocs_tracking IS 'Tracks OCS/BFD/UFD violations';
COMMENT ON TABLE public.race_protests IS 'Formal protests filed during racing';
COMMENT ON TABLE public.race_finish_records IS 'Detailed finish line crossing records';

