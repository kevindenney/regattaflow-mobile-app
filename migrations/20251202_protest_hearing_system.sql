-- ============================================================================
-- Protest Hearing System Migration
-- Extends existing race_protests with full hearing management
-- ============================================================================

-- 1. Add additional columns to race_protests table
ALTER TABLE public.race_protests
ADD COLUMN IF NOT EXISTS protest_number TEXT,
ADD COLUMN IF NOT EXISTS hail_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hail_details TEXT,
ADD COLUMN IF NOT EXISTS red_flag_displayed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS informed_protestee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS time_limit_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS time_limit_waived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS time_limit_waive_reason TEXT;

COMMENT ON COLUMN public.race_protests.protest_number IS 'Sequential protest number for the regatta (e.g., P1, P2)';
COMMENT ON COLUMN public.race_protests.hail_given IS 'Whether protestor hailed "Protest" at time of incident';
COMMENT ON COLUMN public.race_protests.red_flag_displayed IS 'Whether protestor displayed red flag (Class B)';
COMMENT ON COLUMN public.race_protests.informed_protestee IS 'Whether protestee was informed of protest intent';
COMMENT ON COLUMN public.race_protests.time_limit_validated IS 'Whether protest was filed within time limit';

-- 2. Create protest_hearings table for detailed hearing management
CREATE TABLE IF NOT EXISTS public.protest_hearings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protest_id UUID NOT NULL REFERENCES public.race_protests(id) ON DELETE CASCADE,
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- Scheduling
    hearing_number INTEGER NOT NULL,           -- Order of hearings for the day
    scheduled_time TIMESTAMPTZ NOT NULL,
    estimated_duration INTERVAL DEFAULT '30 minutes',
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    
    -- Location
    room_name TEXT,
    room_location TEXT,
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_meeting_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'in_progress',
        'completed',
        'postponed',
        'cancelled'
    )),
    postpone_reason TEXT,
    rescheduled_to UUID REFERENCES public.protest_hearings(id),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_by UUID REFERENCES auth.users(id),
    
    UNIQUE(regatta_id, hearing_number, scheduled_time::DATE)
);

CREATE INDEX IF NOT EXISTS idx_hearings_protest ON public.protest_hearings(protest_id);
CREATE INDEX IF NOT EXISTS idx_hearings_regatta ON public.protest_hearings(regatta_id);
CREATE INDEX IF NOT EXISTS idx_hearings_schedule ON public.protest_hearings(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_hearings_status ON public.protest_hearings(status);

-- 3. Create protest_committee_members table
CREATE TABLE IF NOT EXISTS public.protest_committee_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- Member info
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Qualifications
    is_international_judge BOOLEAN DEFAULT FALSE,
    is_national_judge BOOLEAN DEFAULT FALSE,
    is_regional_judge BOOLEAN DEFAULT FALSE,
    certifications TEXT[],                    -- Array of certification codes
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    availability_notes TEXT,
    
    -- Role
    role TEXT DEFAULT 'member' CHECK (role IN (
        'chair',
        'vice_chair',
        'member',
        'alternate'
    )),
    
    -- Conflicts
    conflicted_entries UUID[],               -- Entries they cannot hear protests for
    conflict_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pc_members_regatta ON public.protest_committee_members(regatta_id);

-- 4. Create hearing_panel_assignments table
CREATE TABLE IF NOT EXISTS public.hearing_panel_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hearing_id UUID NOT NULL REFERENCES public.protest_hearings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.protest_committee_members(id) ON DELETE CASCADE,
    
    -- Role in this hearing
    role TEXT DEFAULT 'member' CHECK (role IN (
        'chair',
        'member',
        'scribe'
    )),
    
    -- Attendance
    attended BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hearing_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_panel_hearing ON public.hearing_panel_assignments(hearing_id);
CREATE INDEX IF NOT EXISTS idx_panel_member ON public.hearing_panel_assignments(member_id);

-- 5. Create protest_evidence table
CREATE TABLE IF NOT EXISTS public.protest_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protest_id UUID NOT NULL REFERENCES public.race_protests(id) ON DELETE CASCADE,
    
    -- Evidence type
    evidence_type TEXT NOT NULL CHECK (evidence_type IN (
        'diagram',
        'photo',
        'video',
        'document',
        'track_data',
        'witness_statement',
        'official_statement',
        'other'
    )),
    
    -- Content
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size INTEGER,
    
    -- For track data
    track_data JSONB,
    
    -- Source
    submitted_by TEXT NOT NULL CHECK (submitted_by IN (
        'protestor',
        'protestee',
        'race_committee',
        'protest_committee',
        'witness'
    )),
    submitted_by_user_id UUID REFERENCES auth.users(id),
    submitted_by_entry_id UUID REFERENCES public.race_entries(id),
    
    -- Timing
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Admissibility
    is_admitted BOOLEAN DEFAULT TRUE,
    admission_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_protest ON public.protest_evidence(protest_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON public.protest_evidence(evidence_type);

-- 6. Create protest_witnesses table
CREATE TABLE IF NOT EXISTS public.protest_witnesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protest_id UUID NOT NULL REFERENCES public.race_protests(id) ON DELETE CASCADE,
    
    -- Witness info
    name TEXT NOT NULL,
    entry_id UUID REFERENCES public.race_entries(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN (
        'participant',
        'race_official',
        'spectator',
        'other'
    )),
    
    -- Called by
    called_by TEXT NOT NULL CHECK (called_by IN (
        'protestor',
        'protestee',
        'protest_committee'
    )),
    
    -- Testimony
    testified BOOLEAN DEFAULT FALSE,
    testimony_summary TEXT,
    
    -- Contact
    contact_info TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_witnesses_protest ON public.protest_witnesses(protest_id);

-- 7. Create protest_decisions table for formal decision records
CREATE TABLE IF NOT EXISTS public.protest_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protest_id UUID NOT NULL REFERENCES public.race_protests(id) ON DELETE CASCADE,
    hearing_id UUID REFERENCES public.protest_hearings(id) ON DELETE SET NULL,
    
    -- Decision
    decision_type TEXT NOT NULL CHECK (decision_type IN (
        'protest_upheld',
        'protest_dismissed',
        'protest_withdrawn',
        'no_protest_valid',
        'redress_granted',
        'redress_denied',
        'request_withdrawn',
        'measurement_failed',
        'measurement_passed'
    )),
    
    -- Findings
    facts_found TEXT NOT NULL,
    conclusions TEXT NOT NULL,
    rules_applied TEXT[],                    -- Array of rule numbers
    
    -- Penalty
    penalty_type TEXT CHECK (penalty_type IN (
        'dsq',
        'dns',
        'dnf',
        'scoring_penalty',
        'time_penalty',
        'warning',
        'fine',
        'other',
        'none'
    )),
    penalty_details TEXT,
    affected_entry_ids UUID[],
    
    -- For redress
    redress_type TEXT CHECK (redress_type IN (
        'average_points',
        'points_equal_to',
        'percentage_adjustment',
        'finish_position',
        'other'
    )),
    redress_value TEXT,
    
    -- Appeal information
    is_appealable BOOLEAN DEFAULT TRUE,
    appeal_deadline TIMESTAMPTZ,
    
    -- Document
    decision_document_url TEXT,
    
    -- Signatures
    signed_by_chair BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    
    -- Metadata
    decided_by UUID REFERENCES auth.users(id),
    decided_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(protest_id)
);

CREATE INDEX IF NOT EXISTS idx_decisions_protest ON public.protest_decisions(protest_id);
CREATE INDEX IF NOT EXISTS idx_decisions_hearing ON public.protest_decisions(hearing_id);

-- 8. Create hearing_rooms table for room management
CREATE TABLE IF NOT EXISTS public.hearing_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER,
    has_video BOOLEAN DEFAULT FALSE,
    has_whiteboard BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(regatta_id, name)
);

CREATE INDEX IF NOT EXISTS idx_rooms_regatta ON public.hearing_rooms(regatta_id);

-- 9. Function to auto-generate protest numbers
CREATE OR REPLACE FUNCTION generate_protest_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Get the next protest number for this regatta
    SELECT COALESCE(MAX(CAST(SUBSTRING(protest_number FROM 2) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.race_protests
    WHERE regatta_id = NEW.regatta_id
    AND protest_number IS NOT NULL;
    
    NEW.protest_number := 'P' || next_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_protest_number
    BEFORE INSERT ON public.race_protests
    FOR EACH ROW
    WHEN (NEW.protest_number IS NULL)
    EXECUTE FUNCTION generate_protest_number();

-- 10. Function to validate protest time limit
CREATE OR REPLACE FUNCTION validate_protest_time_limit()
RETURNS TRIGGER AS $$
DECLARE
    race_deadline TIMESTAMPTZ;
BEGIN
    -- Get the protest deadline for the race
    SELECT protest_deadline INTO race_deadline
    FROM public.regatta_races
    WHERE regatta_id = NEW.regatta_id
    AND race_number = NEW.race_number;
    
    -- If deadline exists and protest is filed after, mark as needing validation
    IF race_deadline IS NOT NULL AND NEW.filed_at > race_deadline THEN
        NEW.time_limit_validated := FALSE;
    ELSE
        NEW.time_limit_validated := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_validate_time_limit
    BEFORE INSERT ON public.race_protests
    FOR EACH ROW
    EXECUTE FUNCTION validate_protest_time_limit();

-- 11. Function to apply decision penalties to results
CREATE OR REPLACE FUNCTION apply_protest_decision()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act on new decisions with penalties
    IF NEW.penalty_type IS NOT NULL AND NEW.affected_entry_ids IS NOT NULL THEN
        -- Update race results with the penalty
        UPDATE public.race_results
        SET score_code = UPPER(NEW.penalty_type),
            status = CASE 
                WHEN NEW.penalty_type = 'dsq' THEN 'dsq'
                WHEN NEW.penalty_type = 'dns' THEN 'dns'
                WHEN NEW.penalty_type = 'dnf' THEN 'dnf'
                ELSE status
            END
        FROM public.race_protests p
        WHERE p.id = NEW.protest_id
        AND race_results.regatta_id = p.regatta_id
        AND race_results.race_number = p.race_number
        AND race_results.entry_id = ANY(NEW.affected_entry_ids);
        
        -- Also update the protest status
        UPDATE public.race_protests
        SET status = 'decided',
            decision = NEW.decision_type,
            decision_made_at = NEW.decided_at,
            penalties_applied = jsonb_build_object(
                'penalty_type', NEW.penalty_type,
                'affected_entries', NEW.affected_entry_ids
            )
        WHERE id = NEW.protest_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_apply_decision
    AFTER INSERT ON public.protest_decisions
    FOR EACH ROW
    EXECUTE FUNCTION apply_protest_decision();

-- 12. RLS Policies

ALTER TABLE public.protest_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protest_committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_panel_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protest_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protest_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protest_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_rooms ENABLE ROW LEVEL SECURITY;

-- Hearings: Club staff can manage, participants can view their own
CREATE POLICY "Club staff can manage hearings"
    ON public.protest_hearings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = protest_hearings.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

CREATE POLICY "Participants can view hearings"
    ON public.protest_hearings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM race_protests p
            WHERE p.id = protest_hearings.protest_id
            AND (
                p.protestor_entry_id IN (
                    SELECT id FROM race_entries WHERE sailor_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM race_entries re
                    WHERE re.id = ANY(p.protestee_entry_ids)
                    AND re.sailor_id = auth.uid()
                )
            )
        )
    );

-- PC Members: Club staff can manage
CREATE POLICY "Club staff can manage PC members"
    ON public.protest_committee_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = protest_committee_members.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- Panel assignments: Club staff can manage
CREATE POLICY "Club staff can manage panels"
    ON public.hearing_panel_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM protest_hearings ph
            JOIN regattas r ON r.id = ph.regatta_id
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE ph.id = hearing_panel_assignments.hearing_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- Evidence: Participants can add to their protests, staff can manage all
CREATE POLICY "Participants can submit evidence"
    ON public.protest_evidence FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM race_protests p
            WHERE p.id = protest_evidence.protest_id
            AND (
                p.protestor_entry_id IN (
                    SELECT id FROM race_entries WHERE sailor_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM race_entries re
                    WHERE re.id = ANY(p.protestee_entry_ids)
                    AND re.sailor_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Staff can manage evidence"
    ON public.protest_evidence FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM race_protests p
            JOIN regattas r ON r.id = p.regatta_id
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE p.id = protest_evidence.protest_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

-- Witnesses: Staff can manage
CREATE POLICY "Staff can manage witnesses"
    ON public.protest_witnesses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM race_protests p
            JOIN regattas r ON r.id = p.regatta_id
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE p.id = protest_witnesses.protest_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- Decisions: Staff can create, public can view final
CREATE POLICY "Staff can create decisions"
    ON public.protest_decisions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM race_protests p
            JOIN regattas r ON r.id = p.regatta_id
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE p.id = protest_decisions.protest_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

CREATE POLICY "Public can view signed decisions"
    ON public.protest_decisions FOR SELECT
    USING (signed_by_chair = TRUE);

-- Rooms: Staff can manage
CREATE POLICY "Staff can manage rooms"
    ON public.hearing_rooms FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = hearing_rooms.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- 13. Grants
GRANT ALL ON public.protest_hearings TO authenticated;
GRANT ALL ON public.protest_committee_members TO authenticated;
GRANT ALL ON public.hearing_panel_assignments TO authenticated;
GRANT ALL ON public.protest_evidence TO authenticated;
GRANT ALL ON public.protest_witnesses TO authenticated;
GRANT ALL ON public.protest_decisions TO authenticated;
GRANT ALL ON public.hearing_rooms TO authenticated;

-- 14. Update triggers
CREATE TRIGGER update_protest_hearings_updated_at
    BEFORE UPDATE ON public.protest_hearings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protest_decisions_updated_at
    BEFORE UPDATE ON public.protest_decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

