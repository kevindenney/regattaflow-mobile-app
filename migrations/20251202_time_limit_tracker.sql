-- ============================================================================
-- Time Limit Tracker Migration
-- RRS-compliant race time limits with auto-DNF
-- ============================================================================

-- 1. Create race_time_limits table
CREATE TABLE IF NOT EXISTS public.race_time_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    fleet_id UUID REFERENCES public.fleets(id) ON DELETE SET NULL,
    
    -- Time Limit Configuration (RRS 35)
    -- Race time limit: max time for first boat to finish
    race_time_limit_minutes INTEGER,          -- NULL = no limit
    
    -- Mark rounding limit: max time to round first mark
    first_mark_limit_minutes INTEGER,         -- NULL = no limit
    
    -- Finishing window: time allowed after first finish for remaining boats
    finishing_window_minutes INTEGER DEFAULT 30,
    
    -- Actual race times
    race_start_time TIMESTAMPTZ,
    first_mark_time TIMESTAMPTZ,              -- First boat rounds mark
    first_finish_time TIMESTAMPTZ,            -- First boat finishes
    
    -- Calculated deadlines
    race_time_deadline TIMESTAMPTZ,           -- race_start + race_time_limit
    first_mark_deadline TIMESTAMPTZ,          -- race_start + first_mark_limit
    finishing_deadline TIMESTAMPTZ,           -- first_finish + finishing_window
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Race not started
        'racing',            -- Race in progress
        'first_finished',    -- First boat has finished, window active
        'time_expired',      -- Time limit reached, no finishers
        'window_expired',    -- Finishing window expired
        'completed'          -- All boats finished or DNF'd
    )),
    
    -- Alerts
    warning_sent_at TIMESTAMPTZ,              -- 5-minute warning sent
    one_minute_warning_at TIMESTAMPTZ,        -- 1-minute warning sent
    limit_expired_at TIMESTAMPTZ,             -- When limit was triggered
    
    -- Auto-DNF settings
    auto_dnf_enabled BOOLEAN DEFAULT TRUE,
    auto_dnf_applied_at TIMESTAMPTZ,
    boats_dnf_count INTEGER DEFAULT 0,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(regatta_id, race_number, fleet_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_limits_regatta ON public.race_time_limits(regatta_id);
CREATE INDEX IF NOT EXISTS idx_time_limits_status ON public.race_time_limits(status);
CREATE INDEX IF NOT EXISTS idx_time_limits_deadline ON public.race_time_limits(finishing_deadline);

-- 2. Create function to calculate deadlines when race starts
CREATE OR REPLACE FUNCTION calculate_time_limit_deadlines()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate race time deadline
    IF NEW.race_start_time IS NOT NULL AND NEW.race_time_limit_minutes IS NOT NULL THEN
        NEW.race_time_deadline := NEW.race_start_time + (NEW.race_time_limit_minutes || ' minutes')::INTERVAL;
    END IF;
    
    -- Calculate first mark deadline
    IF NEW.race_start_time IS NOT NULL AND NEW.first_mark_limit_minutes IS NOT NULL THEN
        NEW.first_mark_deadline := NEW.race_start_time + (NEW.first_mark_limit_minutes || ' minutes')::INTERVAL;
    END IF;
    
    -- Calculate finishing deadline when first boat finishes
    IF NEW.first_finish_time IS NOT NULL AND NEW.finishing_window_minutes IS NOT NULL THEN
        NEW.finishing_deadline := NEW.first_finish_time + (NEW.finishing_window_minutes || ' minutes')::INTERVAL;
        
        -- Update status to first_finished if not already
        IF OLD.first_finish_time IS NULL THEN
            NEW.status := 'first_finished';
        END IF;
    END IF;
    
    -- Update status when race starts
    IF NEW.race_start_time IS NOT NULL AND OLD.race_start_time IS NULL THEN
        NEW.status := 'racing';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_deadlines
    BEFORE INSERT OR UPDATE ON public.race_time_limits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_limit_deadlines();

-- 3. Create function to check and expire time limits
CREATE OR REPLACE FUNCTION check_time_limit_expired()
RETURNS TRIGGER AS $$
DECLARE
    log_entry_id UUID;
BEGIN
    -- Check if race time limit expired (no finishers)
    IF NEW.status = 'racing' 
       AND NEW.race_time_deadline IS NOT NULL 
       AND NEW.race_time_deadline <= NOW()
       AND NEW.first_finish_time IS NULL THEN
        NEW.status := 'time_expired';
        NEW.limit_expired_at := NOW();
        
        -- Log to committee boat log
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NOW(),
            'timing', 'time_limit_expired',
            'Race Time Limit Expired',
            'Race ' || NEW.race_number || ' time limit of ' || NEW.race_time_limit_minutes || ' minutes has expired with no finishers',
            TRUE, 'time_limit_tracker'
        );
    END IF;
    
    -- Check if finishing window expired
    IF NEW.status = 'first_finished'
       AND NEW.finishing_deadline IS NOT NULL
       AND NEW.finishing_deadline <= NOW() THEN
        NEW.status := 'window_expired';
        NEW.limit_expired_at := NOW();
        
        -- Log to committee boat log
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NOW(),
            'timing', 'finishing_window_expired',
            'Finishing Window Expired',
            'Race ' || NEW.race_number || ' finishing window of ' || NEW.finishing_window_minutes || ' minutes has expired',
            TRUE, 'time_limit_tracker'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_limits_on_update
    BEFORE UPDATE ON public.race_time_limits
    FOR EACH ROW
    EXECUTE FUNCTION check_time_limit_expired();

-- 4. Create function to auto-DNF boats when window expires
CREATE OR REPLACE FUNCTION auto_dnf_unfinished_boats(
    p_time_limit_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_regatta_id UUID;
    v_race_number INTEGER;
    v_fleet_id UUID;
    v_dnf_count INTEGER := 0;
BEGIN
    -- Get time limit details
    SELECT regatta_id, race_number, fleet_id
    INTO v_regatta_id, v_race_number, v_fleet_id
    FROM public.race_time_limits
    WHERE id = p_time_limit_id
    AND auto_dnf_enabled = TRUE
    AND status IN ('time_expired', 'window_expired')
    AND auto_dnf_applied_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Update race_results for boats without a finish time
    WITH unfinished AS (
        SELECT rr.id
        FROM public.race_results rr
        JOIN public.race_entries re ON re.id = rr.entry_id
        WHERE rr.regatta_id = v_regatta_id
        AND rr.race_number = v_race_number
        AND (v_fleet_id IS NULL OR re.fleet_id = v_fleet_id)
        AND rr.finish_time IS NULL
        AND rr.status NOT IN ('DNF', 'DNS', 'RET', 'DSQ', 'OCS', 'BFD', 'UFD')
    )
    UPDATE public.race_results
    SET status = 'DNF',
        notes = COALESCE(notes, '') || ' [Auto-DNF: Time limit expired]'
    WHERE id IN (SELECT id FROM unfinished);
    
    GET DIAGNOSTICS v_dnf_count = ROW_COUNT;
    
    -- Update time limit record
    UPDATE public.race_time_limits
    SET auto_dnf_applied_at = NOW(),
        boats_dnf_count = v_dnf_count,
        status = 'completed'
    WHERE id = p_time_limit_id;
    
    -- Log to committee boat log
    IF v_dnf_count > 0 THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, is_auto_logged, auto_log_source
        ) VALUES (
            v_regatta_id, v_race_number, NOW(),
            'timing', 'auto_dnf_applied',
            'Auto-DNF Applied',
            v_dnf_count || ' boat(s) marked DNF for Race ' || v_race_number || ' - time limit exceeded',
            TRUE, 'time_limit_tracker'
        );
    END IF;
    
    RETURN v_dnf_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Create view for active time limits
CREATE OR REPLACE VIEW public.active_time_limits AS
SELECT 
    tl.*,
    r.name as regatta_name,
    f.name as fleet_name,
    CASE 
        WHEN tl.status = 'racing' AND tl.race_time_deadline IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (tl.race_time_deadline - NOW())) / 60)
        WHEN tl.status = 'first_finished' AND tl.finishing_deadline IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (tl.finishing_deadline - NOW())) / 60)
        ELSE NULL
    END as minutes_remaining,
    CASE 
        WHEN tl.status = 'racing' THEN tl.race_time_deadline
        WHEN tl.status = 'first_finished' THEN tl.finishing_deadline
        ELSE NULL
    END as current_deadline,
    (SELECT COUNT(*) FROM public.race_results rr 
     WHERE rr.regatta_id = tl.regatta_id 
     AND rr.race_number = tl.race_number 
     AND rr.finish_time IS NOT NULL) as boats_finished,
    (SELECT COUNT(*) FROM public.race_results rr 
     WHERE rr.regatta_id = tl.regatta_id 
     AND rr.race_number = tl.race_number 
     AND rr.finish_time IS NULL
     AND rr.status NOT IN ('DNF', 'DNS', 'RET', 'DSQ')) as boats_still_racing
FROM public.race_time_limits tl
LEFT JOIN public.regattas r ON r.id = tl.regatta_id
LEFT JOIN public.fleets f ON f.id = tl.fleet_id
WHERE tl.status IN ('racing', 'first_finished');

-- 6. Create default time limit templates table
CREATE TABLE IF NOT EXISTS public.time_limit_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Default values
    race_time_limit_minutes INTEGER,
    first_mark_limit_minutes INTEGER,
    finishing_window_minutes INTEGER DEFAULT 30,
    auto_dnf_enabled BOOLEAN DEFAULT TRUE,
    
    -- Conditions (when to apply)
    race_type TEXT,                           -- e.g., 'windward_leeward', 'distance'
    min_course_length_nm DECIMAL,
    max_course_length_nm DECIMAL,
    
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common templates
INSERT INTO public.time_limit_templates (
    club_id, name, description, 
    race_time_limit_minutes, first_mark_limit_minutes, finishing_window_minutes,
    race_type, is_default
) VALUES
    (NULL, 'Standard Buoy Race', 'Typical windward-leeward race', 90, 30, 30, 'windward_leeward', TRUE),
    (NULL, 'Short Course', 'Quick around-the-buoys racing', 60, 20, 20, 'short', FALSE),
    (NULL, 'Long Distance', 'Extended distance racing', 180, 60, 45, 'distance', FALSE),
    (NULL, 'No Time Limit', 'Race until all boats finish', NULL, NULL, 60, NULL, FALSE)
ON CONFLICT DO NOTHING;

-- 7. RLS Policies
ALTER TABLE public.race_time_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_limit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club staff can manage time limits"
    ON public.race_time_limits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_time_limits.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

CREATE POLICY "Public can view active time limits"
    ON public.race_time_limits FOR SELECT
    USING (
        status IN ('racing', 'first_finished')
        AND EXISTS (
            SELECT 1 FROM regattas
            WHERE regattas.id = race_time_limits.regatta_id
            AND regattas.results_published = TRUE
        )
    );

CREATE POLICY "Club staff can manage templates"
    ON public.time_limit_templates FOR ALL
    USING (
        club_id IS NULL OR
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = time_limit_templates.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- 8. Grants
GRANT ALL ON public.race_time_limits TO authenticated;
GRANT ALL ON public.time_limit_templates TO authenticated;
GRANT SELECT ON public.active_time_limits TO authenticated;

-- 9. Update trigger
CREATE TRIGGER update_time_limits_updated_at
    BEFORE UPDATE ON public.race_time_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

