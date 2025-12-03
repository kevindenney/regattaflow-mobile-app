-- ============================================================================
-- Handicap Calculator Migration
-- PHRF, IRC, ORC, and custom rating systems for corrected time scoring
-- ============================================================================

-- 1. Create handicap_systems table (defines rating system configurations)
CREATE TABLE IF NOT EXISTS public.handicap_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- System identification
    code TEXT NOT NULL UNIQUE,                    -- e.g., 'PHRF', 'IRC', 'ORC'
    name TEXT NOT NULL,
    description TEXT,
    
    -- Calculation type
    calculation_type TEXT NOT NULL CHECK (calculation_type IN (
        'time_on_time',      -- Corrected = Elapsed × TCF
        'time_on_distance',  -- Corrected = Elapsed - (Distance × Rating)
        'custom'             -- Custom formula
    )),
    
    -- Rating interpretation
    rating_unit TEXT DEFAULT 'seconds_per_mile', -- or 'tcf', 'gph', 'seconds_per_nm'
    lower_is_faster BOOLEAN DEFAULT TRUE,        -- PHRF: lower = faster, IRC TCF: higher = faster
    
    -- Base values for time-on-time calculations
    base_rating DECIMAL(10,4),                   -- Base rating for TCF calculation
    tcf_formula TEXT,                            -- Formula for calculating TCF from rating
    
    -- Distance-based formula (time-on-distance)
    tod_formula TEXT,                            -- e.g., 'elapsed - (distance * rating)'
    
    -- Custom formula (for complex systems)
    custom_formula TEXT,
    
    -- Validation
    min_rating DECIMAL(10,4),
    max_rating DECIMAL(10,4),
    
    -- Display
    rating_precision INTEGER DEFAULT 0,          -- Decimal places for rating display
    time_precision INTEGER DEFAULT 0,            -- Decimal places for corrected time
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_builtin BOOLEAN DEFAULT FALSE,            -- System-provided vs user-created
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create boat_ratings table (ratings for specific boats)
CREATE TABLE IF NOT EXISTS public.boat_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Boat identification
    boat_id UUID,                                 -- Optional link to boats table
    sail_number TEXT NOT NULL,
    boat_name TEXT,
    boat_class TEXT,
    
    -- Club association
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    
    -- Rating
    system_id UUID NOT NULL REFERENCES public.handicap_systems(id) ON DELETE CASCADE,
    rating DECIMAL(10,4) NOT NULL,
    
    -- Rating details
    certificate_number TEXT,
    certificate_expiry DATE,
    issuing_authority TEXT,
    
    -- Calculated TCF (for time-on-time systems)
    tcf DECIMAL(10,6),
    
    -- History
    previous_rating DECIMAL(10,4),
    rating_changed_at TIMESTAMPTZ,
    rating_notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique rating per boat per system
    UNIQUE(sail_number, system_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ratings_system ON public.boat_ratings(system_id);
CREATE INDEX IF NOT EXISTS idx_ratings_club ON public.boat_ratings(club_id);
CREATE INDEX IF NOT EXISTS idx_ratings_sail ON public.boat_ratings(sail_number);

-- 3. Create race_handicap_results table (corrected times for races)
CREATE TABLE IF NOT EXISTS public.race_handicap_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Race identification
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    entry_id UUID NOT NULL,                       -- Link to race_entries
    
    -- Rating used
    system_id UUID NOT NULL REFERENCES public.handicap_systems(id),
    rating_id UUID REFERENCES public.boat_ratings(id),
    rating_value DECIMAL(10,4) NOT NULL,          -- Rating at time of race
    tcf_value DECIMAL(10,6),                      -- TCF at time of race
    
    -- Times
    elapsed_seconds INTEGER NOT NULL,             -- Elapsed time in seconds
    corrected_seconds DECIMAL(12,3) NOT NULL,     -- Corrected time in seconds
    
    -- Course
    course_distance_nm DECIMAL(6,3),              -- For time-on-distance
    
    -- Position
    scratch_position INTEGER,                     -- Position by elapsed time
    corrected_position INTEGER,                   -- Position by corrected time
    
    -- Delta from winner
    time_behind_seconds DECIMAL(12,3),            -- Seconds behind corrected winner
    
    -- Status
    status TEXT DEFAULT 'finished' CHECK (status IN (
        'finished', 'DNF', 'DNS', 'DSQ', 'RET', 'OCS', 'RAF'
    )),
    
    -- Calculation metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(regatta_id, race_number, entry_id, system_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_handicap_results_race ON public.race_handicap_results(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_handicap_results_system ON public.race_handicap_results(system_id);

-- 4. Create function to calculate TCF from PHRF rating
CREATE OR REPLACE FUNCTION calculate_phrf_tcf(rating DECIMAL, base_rating DECIMAL DEFAULT 550)
RETURNS DECIMAL AS $$
BEGIN
    -- Standard PHRF Time-on-Time formula
    -- TCF = 650 / (550 + Rating)
    RETURN 650.0 / (base_rating + rating);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Create function to calculate corrected time
CREATE OR REPLACE FUNCTION calculate_corrected_time(
    p_elapsed_seconds INTEGER,
    p_system_code TEXT,
    p_rating DECIMAL,
    p_distance_nm DECIMAL DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
    v_system RECORD;
    v_tcf DECIMAL;
    v_corrected DECIMAL;
BEGIN
    -- Get system configuration
    SELECT * INTO v_system
    FROM public.handicap_systems
    WHERE code = p_system_code;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unknown handicap system: %', p_system_code;
    END IF;
    
    CASE v_system.calculation_type
        WHEN 'time_on_time' THEN
            -- Calculate TCF
            IF v_system.code = 'PHRF' THEN
                v_tcf := calculate_phrf_tcf(p_rating, COALESCE(v_system.base_rating, 550));
            ELSIF v_system.code = 'IRC' THEN
                -- IRC: rating IS the TCF
                v_tcf := p_rating;
            ELSE
                -- Generic: TCF = base / (base + rating)
                v_tcf := COALESCE(v_system.base_rating, 650) / 
                         (COALESCE(v_system.base_rating, 550) + p_rating);
            END IF;
            
            -- Corrected = Elapsed × TCF
            v_corrected := p_elapsed_seconds * v_tcf;
            
        WHEN 'time_on_distance' THEN
            IF p_distance_nm IS NULL THEN
                RAISE EXCEPTION 'Distance required for time-on-distance calculation';
            END IF;
            
            -- Corrected = Elapsed - (Distance × Rating)
            v_corrected := p_elapsed_seconds - (p_distance_nm * p_rating);
            
        ELSE
            RAISE EXCEPTION 'Unsupported calculation type: %', v_system.calculation_type;
    END CASE;
    
    RETURN ROUND(v_corrected, 3);
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to auto-calculate TCF when rating is inserted/updated
CREATE OR REPLACE FUNCTION calculate_boat_tcf()
RETURNS TRIGGER AS $$
DECLARE
    v_system RECORD;
BEGIN
    SELECT * INTO v_system
    FROM public.handicap_systems
    WHERE id = NEW.system_id;
    
    IF v_system.calculation_type = 'time_on_time' THEN
        IF v_system.code = 'PHRF' THEN
            NEW.tcf := calculate_phrf_tcf(NEW.rating, COALESCE(v_system.base_rating, 550));
        ELSIF v_system.code = 'IRC' THEN
            NEW.tcf := NEW.rating;  -- IRC rating IS the TCF
        ELSE
            NEW.tcf := COALESCE(v_system.base_rating, 650) / 
                       (COALESCE(v_system.base_rating, 550) + NEW.rating);
        END IF;
    END IF;
    
    -- Track rating changes
    IF TG_OP = 'UPDATE' AND OLD.rating != NEW.rating THEN
        NEW.previous_rating := OLD.rating;
        NEW.rating_changed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_tcf
    BEFORE INSERT OR UPDATE ON public.boat_ratings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_boat_tcf();

-- 7. Insert built-in handicap systems
INSERT INTO public.handicap_systems (
    code, name, description, calculation_type, rating_unit,
    lower_is_faster, base_rating, rating_precision, is_builtin, is_active
) VALUES
    ('PHRF', 'PHRF Time-on-Time', 
     'Performance Handicap Racing Fleet - Time on Time scoring',
     'time_on_time', 'seconds_per_mile', TRUE, 550, 0, TRUE, TRUE),
    
    ('PHRF_TOD', 'PHRF Time-on-Distance',
     'Performance Handicap Racing Fleet - Time on Distance scoring',
     'time_on_distance', 'seconds_per_mile', TRUE, NULL, 0, TRUE, TRUE),
    
    ('IRC', 'IRC',
     'International Rating Certificate - TCC is the rating',
     'time_on_time', 'tcf', FALSE, NULL, 3, TRUE, TRUE),
    
    ('ORC', 'ORC',
     'Offshore Racing Congress rating system',
     'time_on_time', 'seconds_per_mile', TRUE, 600, 1, TRUE, TRUE),
    
    ('ORR', 'ORR',
     'Offshore Racing Rule',
     'time_on_time', 'seconds_per_mile', TRUE, 550, 1, TRUE, TRUE),
    
    ('HANDICAP', 'Club Handicap',
     'Simple club-defined handicap system',
     'time_on_time', 'seconds_per_mile', TRUE, 100, 0, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 8. Create view for race results with corrected times
CREATE OR REPLACE VIEW public.race_results_with_handicap AS
SELECT 
    rr.id as result_id,
    rr.regatta_id,
    rr.race_number,
    rr.entry_id,
    re.sail_number,
    re.boat_name,
    re.skipper_name,
    rr.finish_time,
    rr.elapsed_time,
    EXTRACT(EPOCH FROM rr.elapsed_time)::INTEGER as elapsed_seconds,
    rr.finish_position as scratch_position,
    rr.status,
    hr.system_id,
    hs.code as system_code,
    hs.name as system_name,
    hr.rating_value,
    hr.tcf_value,
    hr.corrected_seconds,
    hr.corrected_position,
    hr.time_behind_seconds,
    -- Format corrected time as interval
    make_interval(secs => hr.corrected_seconds) as corrected_time
FROM public.race_results rr
JOIN public.race_entries re ON re.id = rr.entry_id
LEFT JOIN public.race_handicap_results hr ON hr.entry_id = rr.entry_id 
    AND hr.regatta_id = rr.regatta_id 
    AND hr.race_number = rr.race_number
LEFT JOIN public.handicap_systems hs ON hs.id = hr.system_id;

-- 9. Create view for fleet standings by handicap system
CREATE OR REPLACE VIEW public.handicap_standings AS
SELECT 
    hr.regatta_id,
    hr.system_id,
    hs.code as system_code,
    hs.name as system_name,
    hr.entry_id,
    re.sail_number,
    re.boat_name,
    re.skipper_name,
    br.rating as current_rating,
    br.tcf as current_tcf,
    COUNT(*) as races_sailed,
    SUM(CASE WHEN hr.status = 'finished' THEN hr.corrected_position ELSE NULL END) as total_points,
    AVG(CASE WHEN hr.status = 'finished' THEN hr.corrected_position ELSE NULL END) as avg_position,
    COUNT(*) FILTER (WHERE hr.corrected_position = 1) as wins,
    COUNT(*) FILTER (WHERE hr.corrected_position <= 3) as podiums
FROM public.race_handicap_results hr
JOIN public.handicap_systems hs ON hs.id = hr.system_id
JOIN public.race_entries re ON re.id = hr.entry_id
LEFT JOIN public.boat_ratings br ON br.sail_number = re.sail_number AND br.system_id = hr.system_id
GROUP BY hr.regatta_id, hr.system_id, hs.code, hs.name, hr.entry_id, 
         re.sail_number, re.boat_name, re.skipper_name, br.rating, br.tcf
ORDER BY total_points NULLS LAST;

-- 10. RLS Policies
ALTER TABLE public.handicap_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boat_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_handicap_results ENABLE ROW LEVEL SECURITY;

-- Systems: anyone can read, admins can manage
CREATE POLICY "Anyone can view handicap systems"
    ON public.handicap_systems FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage handicap systems"
    ON public.handicap_systems FOR ALL
    USING (
        NOT is_builtin OR
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );

-- Ratings: club staff can manage their club's ratings
CREATE POLICY "Anyone can view active ratings"
    ON public.boat_ratings FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Club staff can manage ratings"
    ON public.boat_ratings FOR ALL
    USING (
        club_id IS NULL OR
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = boat_ratings.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

-- Handicap results: club staff can manage
CREATE POLICY "Anyone can view handicap results"
    ON public.race_handicap_results FOR SELECT
    USING (TRUE);

CREATE POLICY "Club staff can manage handicap results"
    ON public.race_handicap_results FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_handicap_results.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

-- 11. Grants
GRANT ALL ON public.handicap_systems TO authenticated;
GRANT ALL ON public.boat_ratings TO authenticated;
GRANT ALL ON public.race_handicap_results TO authenticated;
GRANT SELECT ON public.race_results_with_handicap TO authenticated;
GRANT SELECT ON public.handicap_standings TO authenticated;

-- 12. Update triggers
CREATE TRIGGER update_systems_updated_at
    BEFORE UPDATE ON public.handicap_systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON public.boat_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

