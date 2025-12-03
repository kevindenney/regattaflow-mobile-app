-- ============================================================================
-- Safety Boat Coordinator Migration
-- Track rescue boats, crew assignments, and incidents
-- ============================================================================

-- 1. Create safety_boats table (the boats themselves)
CREATE TABLE IF NOT EXISTS public.safety_boats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    
    -- Boat info
    name TEXT NOT NULL,
    boat_number TEXT,                             -- e.g., "Safety 1", "RIB 3"
    boat_type TEXT,                               -- e.g., "RIB", "Powerboat", "Jet Ski"
    
    -- Registration
    registration_number TEXT,
    hull_color TEXT,
    
    -- Capacity
    max_persons INTEGER DEFAULT 4,
    
    -- Equipment
    has_vhf BOOLEAN DEFAULT TRUE,
    vhf_channel TEXT DEFAULT '72',
    has_first_aid BOOLEAN DEFAULT TRUE,
    has_tow_line BOOLEAN DEFAULT TRUE,
    has_anchor BOOLEAN DEFAULT TRUE,
    equipment_notes TEXT,
    
    -- Status
    status TEXT DEFAULT 'available' CHECK (status IN (
        'available',        -- Ready for assignment
        'assigned',         -- Assigned to position
        'on_water',        -- Currently deployed
        'maintenance',     -- In maintenance
        'unavailable'      -- Not available
    )),
    
    -- Notes
    notes TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_boats_club ON public.safety_boats(club_id);

-- 2. Create safety_positions table (standard positions around the course)
CREATE TABLE IF NOT EXISTS public.safety_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    
    -- Position info
    name TEXT NOT NULL,                           -- e.g., "Mark 1", "Start Line", "Pin End"
    code TEXT,                                    -- Short code for radio, e.g., "M1", "SL"
    position_type TEXT CHECK (position_type IN (
        'mark',             -- At a race mark
        'start_line',       -- Start/finish line
        'gate',             -- Gate mark
        'course',           -- General course position
        'shore',            -- Shore-based
        'roving'            -- Mobile/roving
    )),
    
    -- Location
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Priority
    priority INTEGER DEFAULT 1,                   -- 1 = highest priority
    required_for_racing BOOLEAN DEFAULT FALSE,
    
    -- Display order
    sort_order INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create safety_assignments table (boat assignments to positions for a regatta)
CREATE TABLE IF NOT EXISTS public.safety_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- Assignment
    boat_id UUID NOT NULL REFERENCES public.safety_boats(id) ON DELETE CASCADE,
    position_id UUID REFERENCES public.safety_positions(id) ON DELETE SET NULL,
    
    -- Custom position (if not from predefined positions)
    custom_position_name TEXT,
    
    -- Timing
    assignment_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Status
    status TEXT DEFAULT 'assigned' CHECK (status IN (
        'assigned',         -- Scheduled
        'deployed',         -- On water
        'standby',          -- On standby
        'responding',       -- Responding to incident
        'returning',        -- Returning to station
        'off_duty'          -- Finished for day
    )),
    
    deployed_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(regatta_id, boat_id, assignment_date)
);

CREATE INDEX IF NOT EXISTS idx_assignments_regatta ON public.safety_assignments(regatta_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON public.safety_assignments(assignment_date);

-- 4. Create safety_crew table (crew members on safety boats)
CREATE TABLE IF NOT EXISTS public.safety_crew (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.safety_assignments(id) ON DELETE CASCADE,
    
    -- Crew member
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN (
        'driver',           -- Boat driver/skipper
        'crew',             -- General crew
        'first_aid',        -- First aid qualified
        'rescue_swimmer'    -- Rescue swimmer
    )),
    
    -- Contact
    phone TEXT,
    vhf_callsign TEXT,
    
    -- Certifications
    powerboat_certified BOOLEAN DEFAULT FALSE,
    first_aid_certified BOOLEAN DEFAULT FALSE,
    rescue_certified BOOLEAN DEFAULT FALSE,
    
    -- Status
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crew_assignment ON public.safety_crew(assignment_id);

-- 5. Create safety_radio_checks table
CREATE TABLE IF NOT EXISTS public.safety_radio_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.safety_assignments(id) ON DELETE CASCADE,
    
    -- Check details
    check_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    initiated_by TEXT,                            -- 'committee' or 'safety_boat'
    
    -- Status
    status TEXT CHECK (status IN (
        'successful',       -- Clear communication
        'partial',          -- Some issues
        'failed',           -- Could not establish contact
        'no_response'       -- No response from safety boat
    )),
    
    signal_quality TEXT CHECK (signal_quality IN (
        'excellent',
        'good',
        'fair',
        'poor'
    )),
    
    notes TEXT,
    checked_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_checks_assignment ON public.safety_radio_checks(assignment_id);

-- 6. Create safety_incidents table
CREATE TABLE IF NOT EXISTS public.safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- Incident identification
    incident_number SERIAL,
    
    -- Timing
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    incident_time TIMESTAMPTZ,                    -- When incident actually occurred
    resolved_at TIMESTAMPTZ,
    
    -- Location
    location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    near_mark TEXT,                               -- e.g., "Near Mark 2"
    
    -- Incident type
    incident_type TEXT NOT NULL CHECK (incident_type IN (
        'capsize',
        'dismasting',
        'collision',
        'man_overboard',
        'medical',
        'equipment_failure',
        'grounding',
        'tow_request',
        'retirement',
        'search',
        'other'
    )),
    severity TEXT DEFAULT 'minor' CHECK (severity IN (
        'minor',            -- No injury, quick resolution
        'moderate',         -- Some assistance needed
        'serious',          -- Significant intervention
        'critical'          -- Emergency, may need external help
    )),
    
    -- Boats involved
    race_entry_ids UUID[],                        -- Racing boats involved
    sail_numbers TEXT[],                          -- Sail numbers (for quick reference)
    
    -- Response
    responding_boat_id UUID REFERENCES public.safety_boats(id),
    responding_assignment_id UUID REFERENCES public.safety_assignments(id),
    response_time_seconds INTEGER,                -- Time from report to on-scene
    
    -- Details
    description TEXT NOT NULL,
    actions_taken TEXT,
    outcome TEXT CHECK (outcome IN (
        'resumed_racing',   -- Boat continued racing
        'retired',          -- Boat retired from race
        'towed_to_shore',   -- Boat towed in
        'medical_transport', -- Person transported for medical
        'external_assistance', -- Coast guard/emergency services
        'resolved_on_water', -- Resolved without shore assistance
        'pending'           -- Still being handled
    )),
    
    -- Injuries
    injuries_reported BOOLEAN DEFAULT FALSE,
    injury_details TEXT,
    medical_attention_required BOOLEAN DEFAULT FALSE,
    
    -- Equipment
    equipment_damage TEXT,
    equipment_lost TEXT,
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open',             -- Active incident
        'in_progress',      -- Being handled
        'resolved',         -- Closed
        'requires_followup' -- Needs additional action
    )),
    
    -- Reporting
    reported_by UUID REFERENCES auth.users(id),
    reported_by_name TEXT,
    
    -- Committee log reference
    log_entry_id UUID REFERENCES public.committee_boat_log(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_regatta ON public.safety_incidents(regatta_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON public.safety_incidents(incident_type);

-- 7. Create function to generate incident number per regatta
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(incident_number), 0) + 1
    INTO next_num
    FROM public.safety_incidents
    WHERE regatta_id = NEW.regatta_id;
    
    NEW.incident_number := next_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_incident_number
    BEFORE INSERT ON public.safety_incidents
    FOR EACH ROW
    EXECUTE FUNCTION generate_incident_number();

-- 8. Create function to auto-log incidents to committee boat log
CREATE OR REPLACE FUNCTION auto_log_safety_incident()
RETURNS TRIGGER AS $$
DECLARE
    v_log_id UUID;
    v_title TEXT;
    v_severity_emoji TEXT;
BEGIN
    -- Set emoji based on severity
    v_severity_emoji := CASE NEW.severity
        WHEN 'critical' THEN '🚨'
        WHEN 'serious' THEN '⚠️'
        WHEN 'moderate' THEN '⚡'
        ELSE '📋'
    END;
    
    v_title := v_severity_emoji || ' Incident #' || NEW.incident_number || ': ' || 
               REPLACE(NEW.incident_type, '_', ' ');
    
    -- Create log entry
    INSERT INTO public.committee_boat_log (
        regatta_id, log_time, category, event_type,
        title, description, location,
        is_auto_logged, auto_log_source
    ) VALUES (
        NEW.regatta_id,
        COALESCE(NEW.incident_time, NEW.reported_at),
        'safety',
        'incident_' || NEW.incident_type,
        v_title,
        NEW.description ||
            CASE WHEN NEW.sail_numbers IS NOT NULL AND array_length(NEW.sail_numbers, 1) > 0 
                 THEN E'\nBoats: ' || array_to_string(NEW.sail_numbers, ', ')
                 ELSE '' END ||
            CASE WHEN NEW.location IS NOT NULL 
                 THEN E'\nLocation: ' || NEW.location 
                 ELSE '' END,
        NEW.location,
        TRUE,
        'safety_coordinator'
    )
    RETURNING id INTO v_log_id;
    
    -- Update incident with log reference
    NEW.log_entry_id := v_log_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_log_incident
    BEFORE INSERT ON public.safety_incidents
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_safety_incident();

-- 9. Create function to log incident resolution
CREATE OR REPLACE FUNCTION log_incident_resolution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, log_time, category, event_type,
            title, description,
            is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id,
            NEW.resolved_at,
            'safety',
            'incident_resolved',
            '✓ Incident #' || NEW.incident_number || ' Resolved',
            'Outcome: ' || COALESCE(REPLACE(NEW.outcome, '_', ' '), 'Resolved') ||
                CASE WHEN NEW.actions_taken IS NOT NULL 
                     THEN E'\nActions: ' || NEW.actions_taken 
                     ELSE '' END,
            TRUE,
            'safety_coordinator'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_incident_resolved
    AFTER UPDATE ON public.safety_incidents
    FOR EACH ROW
    EXECUTE FUNCTION log_incident_resolution();

-- 10. Create view for safety dashboard
CREATE OR REPLACE VIEW public.safety_dashboard AS
SELECT 
    sa.regatta_id,
    sa.assignment_date,
    sb.id as boat_id,
    sb.name as boat_name,
    sb.boat_number,
    sb.boat_type,
    sb.vhf_channel,
    sa.id as assignment_id,
    sa.status as assignment_status,
    COALESCE(sp.name, sa.custom_position_name) as position_name,
    sp.code as position_code,
    sp.position_type,
    sa.deployed_at,
    sa.returned_at,
    (
        SELECT json_agg(json_build_object(
            'id', sc.id,
            'name', sc.name,
            'role', sc.role,
            'phone', sc.phone,
            'checked_in', sc.checked_in
        ))
        FROM public.safety_crew sc
        WHERE sc.assignment_id = sa.id
    ) as crew,
    (
        SELECT COUNT(*)
        FROM public.safety_radio_checks src
        WHERE src.assignment_id = sa.id
        AND src.check_time >= NOW() - INTERVAL '1 hour'
    ) as recent_radio_checks,
    (
        SELECT src.status
        FROM public.safety_radio_checks src
        WHERE src.assignment_id = sa.id
        ORDER BY src.check_time DESC
        LIMIT 1
    ) as last_radio_status
FROM public.safety_assignments sa
JOIN public.safety_boats sb ON sb.id = sa.boat_id
LEFT JOIN public.safety_positions sp ON sp.id = sa.position_id
WHERE sa.assignment_date = CURRENT_DATE
ORDER BY sp.sort_order, sb.name;

-- 11. Create view for incident summary
CREATE OR REPLACE VIEW public.incident_summary AS
SELECT 
    regatta_id,
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE status = 'open') as open_incidents,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE severity = 'serious') as serious_count,
    COUNT(*) FILTER (WHERE injuries_reported) as with_injuries,
    COUNT(*) FILTER (WHERE medical_attention_required) as medical_required,
    AVG(response_time_seconds) FILTER (WHERE response_time_seconds IS NOT NULL) as avg_response_seconds
FROM public.safety_incidents
GROUP BY regatta_id;

-- 12. Insert default safety positions
INSERT INTO public.safety_positions (club_id, name, code, position_type, priority, required_for_racing, sort_order)
VALUES
    (NULL, 'Start/Finish Line', 'S/F', 'start_line', 1, TRUE, 1),
    (NULL, 'Pin End', 'PIN', 'start_line', 2, FALSE, 2),
    (NULL, 'Mark 1 (Windward)', 'M1', 'mark', 1, TRUE, 3),
    (NULL, 'Mark 2 (Leeward)', 'M2', 'mark', 2, FALSE, 4),
    (NULL, 'Gate', 'GATE', 'gate', 2, FALSE, 5),
    (NULL, 'Offset Mark', 'OFF', 'mark', 3, FALSE, 6),
    (NULL, 'Mid-Course', 'MID', 'course', 3, FALSE, 7),
    (NULL, 'Roving', 'ROV', 'roving', 2, FALSE, 8),
    (NULL, 'Shore Support', 'SHORE', 'shore', 3, FALSE, 9)
ON CONFLICT DO NOTHING;

-- 13. RLS Policies
ALTER TABLE public.safety_boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_radio_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;

-- Safety boats: club staff can manage
CREATE POLICY "Club staff can manage safety boats"
    ON public.safety_boats FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = safety_boats.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- Positions: anyone can view defaults, club staff can manage custom
CREATE POLICY "Anyone can view positions"
    ON public.safety_positions FOR SELECT
    USING (TRUE);

CREATE POLICY "Club staff can manage positions"
    ON public.safety_positions FOR ALL
    USING (
        club_id IS NULL OR
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = safety_positions.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- Assignments: club staff can manage
CREATE POLICY "Club staff can manage assignments"
    ON public.safety_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = safety_assignments.regatta_id
            AND cm.user_id = auth.uid()
        )
    );

-- Crew: club staff can manage
CREATE POLICY "Club staff can manage crew"
    ON public.safety_crew FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM safety_assignments sa
            JOIN regattas r ON r.id = sa.regatta_id
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE sa.id = safety_crew.assignment_id
            AND cm.user_id = auth.uid()
        )
    );

-- Radio checks: club staff can manage
CREATE POLICY "Club staff can manage radio checks"
    ON public.safety_radio_checks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM safety_assignments sa
            JOIN regattas r ON r.id = sa.regatta_id
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE sa.id = safety_radio_checks.assignment_id
            AND cm.user_id = auth.uid()
        )
    );

-- Incidents: club staff can manage
CREATE POLICY "Club staff can manage incidents"
    ON public.safety_incidents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = safety_incidents.regatta_id
            AND cm.user_id = auth.uid()
        )
    );

-- 14. Grants
GRANT ALL ON public.safety_boats TO authenticated;
GRANT ALL ON public.safety_positions TO authenticated;
GRANT ALL ON public.safety_assignments TO authenticated;
GRANT ALL ON public.safety_crew TO authenticated;
GRANT ALL ON public.safety_radio_checks TO authenticated;
GRANT ALL ON public.safety_incidents TO authenticated;
GRANT SELECT ON public.safety_dashboard TO authenticated;
GRANT SELECT ON public.incident_summary TO authenticated;

-- 15. Update triggers
CREATE TRIGGER update_safety_boats_updated_at
    BEFORE UPDATE ON public.safety_boats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_assignments_updated_at
    BEFORE UPDATE ON public.safety_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_incidents_updated_at
    BEFORE UPDATE ON public.safety_incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

