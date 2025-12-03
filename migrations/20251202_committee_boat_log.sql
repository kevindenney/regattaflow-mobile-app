-- ============================================================================
-- Committee Boat Log System Migration
-- Official timestamped event log for race management documentation
-- ============================================================================

-- 1. Create committee_boat_log table
CREATE TABLE IF NOT EXISTS public.committee_boat_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER,                           -- NULL for general regatta entries
    
    -- Entry metadata
    entry_number SERIAL,                           -- Sequential entry number for the day
    log_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- When the event occurred
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),-- When the entry was made
    
    -- Category and type
    category TEXT NOT NULL CHECK (category IN (
        'signal',           -- Signal flags, sounds
        'course',           -- Course changes, marks
        'weather',          -- Wind, conditions
        'incident',         -- On-water incidents
        'protest',          -- Protest-related
        'safety',           -- Safety matters
        'announcement',     -- Public announcements
        'timing',           -- Start/finish times
        'penalty',          -- Penalties applied
        'equipment',        -- Equipment issues
        'committee',        -- Committee decisions
        'general'           -- Other entries
    )),
    
    -- Event details
    event_type TEXT,                               -- Specific event within category
    title TEXT NOT NULL,                           -- Short title/summary
    description TEXT,                              -- Detailed description
    
    -- Flags and signals
    flags_displayed TEXT[],                        -- Array of flag codes
    sound_signals INTEGER,                         -- Number of sound signals
    
    -- Related entities
    related_entry_ids UUID[],                      -- Boats involved
    related_protest_id UUID REFERENCES public.race_protests(id) ON DELETE SET NULL,
    related_start_sequence_id UUID REFERENCES public.race_start_sequences(id) ON DELETE SET NULL,
    
    -- Location
    location TEXT,                                 -- Description of location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Weather conditions at time of entry
    wind_direction INTEGER,                        -- Degrees
    wind_speed DECIMAL(5, 2),                      -- Knots
    weather_notes TEXT,
    
    -- Attachments
    photo_urls TEXT[],
    document_urls TEXT[],
    
    -- Author
    logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    logged_by_name TEXT,                           -- Cached name for historical record
    logged_by_role TEXT,                           -- Role at time of logging
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    -- Auto-logged entries
    is_auto_logged BOOLEAN DEFAULT FALSE,
    auto_log_source TEXT,                          -- e.g., 'start_sequence', 'flag_signal'
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- For deleted entries (soft delete for audit trail)
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    delete_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_log_regatta ON public.committee_boat_log(regatta_id);
CREATE INDEX IF NOT EXISTS idx_log_race ON public.committee_boat_log(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_log_time ON public.committee_boat_log(log_time);
CREATE INDEX IF NOT EXISTS idx_log_category ON public.committee_boat_log(category);
CREATE INDEX IF NOT EXISTS idx_log_date ON public.committee_boat_log(DATE(log_time));

-- 2. Create log_templates table for quick entry templates
CREATE TABLE IF NOT EXISTS public.committee_log_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    
    -- Template details
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    event_type TEXT,
    title_template TEXT NOT NULL,
    description_template TEXT,
    flags_displayed TEXT[],
    sound_signals INTEGER,
    
    -- Display
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Usage
    is_active BOOLEAN DEFAULT TRUE,
    use_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_club ON public.committee_log_templates(club_id);

-- 3. Create log_entry_sequence for daily numbering
CREATE OR REPLACE FUNCTION get_next_log_entry_number(p_regatta_id UUID, p_log_date DATE)
RETURNS INTEGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(entry_number), 0) + 1
    INTO next_num
    FROM public.committee_boat_log
    WHERE regatta_id = p_regatta_id
    AND DATE(log_time) = p_log_date;
    
    RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign entry numbers
CREATE OR REPLACE FUNCTION assign_log_entry_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.entry_number := get_next_log_entry_number(NEW.regatta_id, DATE(NEW.log_time));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_entry_number
    BEFORE INSERT ON public.committee_boat_log
    FOR EACH ROW
    EXECUTE FUNCTION assign_log_entry_number();

-- 4. Create function to auto-log from start sequences
CREATE OR REPLACE FUNCTION auto_log_start_sequence()
RETURNS TRIGGER AS $$
DECLARE
    regatta_name TEXT;
BEGIN
    -- Get regatta name
    SELECT name INTO regatta_name FROM public.regattas WHERE id = NEW.regatta_id;
    
    -- Log warning signal
    IF NEW.warning_signal_at IS NOT NULL AND OLD.warning_signal_at IS NULL THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, flags_displayed, sound_signals,
            related_start_sequence_id, is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NEW.warning_signal_at,
            'signal', 'warning_signal',
            'Warning Signal',
            'Warning signal for Race ' || NEW.race_number || ' (' || NEW.fleet_name || ')',
            ARRAY[NEW.class_flag],
            1,
            NEW.id, TRUE, 'start_sequence'
        );
    END IF;
    
    -- Log preparatory signal
    IF NEW.preparatory_signal_at IS NOT NULL AND OLD.preparatory_signal_at IS NULL THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, flags_displayed, sound_signals,
            related_start_sequence_id, is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NEW.preparatory_signal_at,
            'signal', 'preparatory_signal',
            'Preparatory Signal',
            'Preparatory signal for Race ' || NEW.race_number,
            ARRAY['P'],
            1,
            NEW.id, TRUE, 'start_sequence'
        );
    END IF;
    
    -- Log start signal
    IF NEW.start_signal_at IS NOT NULL AND OLD.start_signal_at IS NULL THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, sound_signals,
            related_start_sequence_id, is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NEW.start_signal_at,
            'timing', 'race_start',
            'Race Start',
            'Race ' || NEW.race_number || ' (' || NEW.fleet_name || ') started',
            1,
            NEW.id, TRUE, 'start_sequence'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_log_start_events
    AFTER UPDATE ON public.race_start_sequences
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_start_sequence();

-- 5. Create function to auto-log flag signals
CREATE OR REPLACE FUNCTION auto_log_flag_signal()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'displayed' AND (OLD IS NULL OR OLD.status != 'displayed') THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, flags_displayed, sound_signals,
            is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NEW.displayed_at,
            'signal', 'flag_displayed',
            NEW.flag_code || ' Flag Displayed',
            COALESCE(NEW.meaning, 'Flag ' || NEW.flag_code || ' displayed'),
            ARRAY[NEW.flag_code],
            COALESCE(NEW.sound_signals, 0),
            TRUE, 'flag_signal'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_log_flags
    AFTER INSERT OR UPDATE ON public.race_flags
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_flag_signal();

-- 6. Create function to auto-log protests
CREATE OR REPLACE FUNCTION auto_log_protest()
RETURNS TRIGGER AS $$
DECLARE
    protestor_sail TEXT;
BEGIN
    -- Get protestor sail number
    SELECT sail_number INTO protestor_sail
    FROM public.race_entries
    WHERE id = NEW.protestor_entry_id;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, related_protest_id, related_entry_ids,
            is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NEW.filed_at,
            'protest', 'protest_filed',
            'Protest Filed: ' || NEW.protest_number,
            'Protest filed by ' || COALESCE(protestor_sail, 'Race Committee') || 
            ' - ' || REPLACE(NEW.protest_type, '_', ' '),
            NEW.id,
            CASE WHEN NEW.protestor_entry_id IS NOT NULL 
                 THEN ARRAY[NEW.protestor_entry_id] || COALESCE(NEW.protestee_entry_ids, ARRAY[]::UUID[])
                 ELSE NEW.protestee_entry_ids
            END,
            TRUE, 'protest'
        );
    ELSIF NEW.status = 'decided' AND OLD.status != 'decided' THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, race_number, log_time, category, event_type,
            title, description, related_protest_id,
            is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.race_number, NEW.decision_made_at,
            'protest', 'protest_decided',
            'Protest Decision: ' || NEW.protest_number,
            'Protest ' || NEW.protest_number || ' - ' || COALESCE(NEW.decision, 'Decision made'),
            NEW.id,
            TRUE, 'protest'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_log_protests
    AFTER INSERT OR UPDATE ON public.race_protests
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_protest();

-- 7. Create view for daily log summary
CREATE OR REPLACE VIEW public.committee_log_daily_summary AS
SELECT 
    regatta_id,
    DATE(log_time) as log_date,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE category = 'signal') as signal_count,
    COUNT(*) FILTER (WHERE category = 'timing') as timing_count,
    COUNT(*) FILTER (WHERE category = 'incident') as incident_count,
    COUNT(*) FILTER (WHERE category = 'protest') as protest_count,
    COUNT(*) FILTER (WHERE category = 'safety') as safety_count,
    COUNT(*) FILTER (WHERE is_auto_logged) as auto_logged_count,
    MIN(log_time) as first_entry,
    MAX(log_time) as last_entry
FROM public.committee_boat_log
WHERE NOT is_deleted
GROUP BY regatta_id, DATE(log_time);

-- 8. RLS Policies
ALTER TABLE public.committee_boat_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_log_templates ENABLE ROW LEVEL SECURITY;

-- Log entries: Club staff can manage, public can view verified entries
CREATE POLICY "Club staff can manage log entries"
    ON public.committee_boat_log FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = committee_boat_log.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

CREATE POLICY "Public can view verified log entries"
    ON public.committee_boat_log FOR SELECT
    USING (
        verified = TRUE 
        AND NOT is_deleted
        AND EXISTS (
            SELECT 1 FROM regattas
            WHERE regattas.id = committee_boat_log.regatta_id
            AND regattas.results_published = TRUE
        )
    );

-- Templates: Club staff can manage
CREATE POLICY "Club staff can manage templates"
    ON public.committee_log_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = committee_log_templates.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- 9. Insert default templates
INSERT INTO public.committee_log_templates (club_id, name, category, event_type, title_template, description_template, flags_displayed, sound_signals, icon, color, sort_order)
VALUES
    (NULL, 'General Recall', 'signal', 'general_recall', 'General Recall', 'General recall signaled - First Substitute displayed', ARRAY['First Substitute'], 2, '🔄', '#F59E0B', 1),
    (NULL, 'Individual Recall', 'signal', 'individual_recall', 'Individual Recall', 'Individual recall - X flag displayed', ARRAY['X'], 1, '⚠️', '#EF4444', 2),
    (NULL, 'Postponement', 'signal', 'postponement', 'Race Postponed', 'AP flag displayed - race postponed', ARRAY['AP'], 2, '⏸️', '#6B7280', 3),
    (NULL, 'Course Change', 'course', 'course_change', 'Course Changed', 'Course changed - C flag displayed', ARRAY['C'], 1, '🔀', '#3B82F6', 4),
    (NULL, 'Shortened Course', 'course', 'shortened', 'Course Shortened', 'S flag displayed - course shortened', ARRAY['S'], 2, '✂️', '#8B5CF6', 5),
    (NULL, 'Abandonment', 'signal', 'abandonment', 'Race Abandoned', 'N flag displayed - race abandoned', ARRAY['N'], 3, '🚫', '#DC2626', 6),
    (NULL, 'Race Finish', 'timing', 'race_finish', 'Race Finished', 'Last boat finished', NULL, 1, '🏁', '#10B981', 7),
    (NULL, 'Weather Update', 'weather', 'conditions', 'Weather Conditions', 'Current weather conditions recorded', NULL, 0, '🌤️', '#0EA5E9', 8),
    (NULL, 'Safety Incident', 'safety', 'incident', 'Safety Incident', 'Safety incident reported', NULL, 0, '🚨', '#EF4444', 9),
    (NULL, 'Mark Move', 'course', 'mark_move', 'Mark Repositioned', 'Race mark repositioned', NULL, 0, '📍', '#F59E0B', 10)
ON CONFLICT DO NOTHING;

-- 10. Grants
GRANT ALL ON public.committee_boat_log TO authenticated;
GRANT ALL ON public.committee_log_templates TO authenticated;
GRANT SELECT ON public.committee_log_daily_summary TO authenticated;

-- 11. Update trigger
CREATE TRIGGER update_log_updated_at
    BEFORE UPDATE ON public.committee_boat_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

