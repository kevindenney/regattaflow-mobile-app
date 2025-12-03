-- ============================================================================
-- Multi-Class Start Scheduler Migration
-- Staggered starts for multiple fleets with rolling sequences
-- ============================================================================

-- 1. Create race_start_schedule table (master schedule for a race day)
CREATE TABLE IF NOT EXISTS public.race_start_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- Schedule info
    name TEXT NOT NULL,                           -- e.g., "Race 1-3", "Morning Races"
    scheduled_date DATE NOT NULL,
    
    -- Global settings
    start_interval_minutes INTEGER DEFAULT 5,     -- Time between class warnings
    sequence_type TEXT DEFAULT '5-4-1-go' CHECK (sequence_type IN (
        '5-4-1-go',      -- 5 min warning, 4 min prep, 1 min, go
        '3-2-1-go',      -- 3 min warning, 2 min prep, 1 min, go
        '5-1-go',        -- 5 min warning, 1 min, go (no prep)
        'custom'         -- Custom intervals
    )),
    
    -- Custom sequence timing (used when sequence_type = 'custom')
    warning_minutes INTEGER DEFAULT 5,
    preparatory_minutes INTEGER DEFAULT 4,
    one_minute_signal BOOLEAN DEFAULT TRUE,
    
    -- First warning time
    first_warning_time TIME,                      -- Planned time for first warning
    actual_first_warning TIMESTAMPTZ,             -- Actual time started
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft',         -- Being configured
        'ready',         -- Ready to start
        'in_progress',   -- Start sequence running
        'completed',     -- All fleets started
        'abandoned'      -- Abandoned
    )),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_regatta ON public.race_start_schedules(regatta_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.race_start_schedules(scheduled_date);

-- 2. Create fleet_start_entries table (individual fleet entries in schedule)
CREATE TABLE IF NOT EXISTS public.fleet_start_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.race_start_schedules(id) ON DELETE CASCADE,
    
    -- Fleet info
    fleet_id UUID REFERENCES public.fleets(id) ON DELETE SET NULL,
    fleet_name TEXT NOT NULL,                     -- Cached/override name
    class_flag TEXT,                              -- Flag code for this class
    
    -- Position in sequence
    start_order INTEGER NOT NULL,                 -- 1, 2, 3... order of starts
    
    -- Race assignment
    race_number INTEGER NOT NULL,                 -- Which race number for this fleet
    
    -- Timing (calculated from schedule settings)
    planned_warning_time TIMESTAMPTZ,
    planned_prep_time TIMESTAMPTZ,
    planned_start_time TIMESTAMPTZ,
    
    -- Actual times
    actual_warning_time TIMESTAMPTZ,
    actual_prep_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Waiting to start
        'warning',           -- Warning signal given
        'preparatory',       -- Prep signal given
        'one_minute',        -- One minute signal
        'started',           -- Race started
        'general_recall',    -- General recall, restart needed
        'individual_recall', -- Individual recall, race continues
        'postponed',         -- Postponed
        'abandoned'          -- Abandoned
    )),
    
    -- Recall handling
    recall_count INTEGER DEFAULT 0,
    last_recall_at TIMESTAMPTZ,
    recall_notes TEXT,
    
    -- Override interval (different from schedule default)
    custom_interval_minutes INTEGER,              -- NULL = use schedule default
    
    -- Link to start sequence (for detailed tracking)
    start_sequence_id UUID REFERENCES public.race_start_sequences(id),
    
    -- Link to time limit
    time_limit_id UUID REFERENCES public.race_time_limits(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(schedule_id, start_order)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fleet_entries_schedule ON public.fleet_start_entries(schedule_id);
CREATE INDEX IF NOT EXISTS idx_fleet_entries_order ON public.fleet_start_entries(schedule_id, start_order);
CREATE INDEX IF NOT EXISTS idx_fleet_entries_status ON public.fleet_start_entries(status);

-- 3. Create function to calculate planned times when schedule is configured
CREATE OR REPLACE FUNCTION calculate_fleet_start_times()
RETURNS TRIGGER AS $$
DECLARE
    v_schedule RECORD;
    v_prev_warning TIMESTAMPTZ;
    v_interval INTEGER;
    v_warning_offset INTEGER;
    v_prep_offset INTEGER;
BEGIN
    -- Get schedule info
    SELECT * INTO v_schedule
    FROM public.race_start_schedules
    WHERE id = NEW.schedule_id;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Determine interval
    v_interval := COALESCE(NEW.custom_interval_minutes, v_schedule.start_interval_minutes, 5);
    
    -- Get sequence timing
    CASE v_schedule.sequence_type
        WHEN '5-4-1-go' THEN
            v_warning_offset := 5;
            v_prep_offset := 4;
        WHEN '3-2-1-go' THEN
            v_warning_offset := 3;
            v_prep_offset := 2;
        WHEN '5-1-go' THEN
            v_warning_offset := 5;
            v_prep_offset := 0;  -- No prep signal
        ELSE
            v_warning_offset := COALESCE(v_schedule.warning_minutes, 5);
            v_prep_offset := COALESCE(v_schedule.preparatory_minutes, 4);
    END CASE;
    
    -- Calculate times based on start order
    IF NEW.start_order = 1 THEN
        -- First fleet uses first_warning_time
        IF v_schedule.first_warning_time IS NOT NULL THEN
            NEW.planned_warning_time := v_schedule.scheduled_date + v_schedule.first_warning_time;
        END IF;
    ELSE
        -- Subsequent fleets: warning = previous fleet's warning + interval
        SELECT planned_warning_time INTO v_prev_warning
        FROM public.fleet_start_entries
        WHERE schedule_id = NEW.schedule_id
        AND start_order = NEW.start_order - 1;
        
        IF v_prev_warning IS NOT NULL THEN
            NEW.planned_warning_time := v_prev_warning + (v_interval || ' minutes')::INTERVAL;
        END IF;
    END IF;
    
    -- Calculate prep and start times from warning
    IF NEW.planned_warning_time IS NOT NULL THEN
        IF v_prep_offset > 0 THEN
            NEW.planned_prep_time := NEW.planned_warning_time + 
                ((v_warning_offset - v_prep_offset) || ' minutes')::INTERVAL;
        END IF;
        NEW.planned_start_time := NEW.planned_warning_time + 
            (v_warning_offset || ' minutes')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_start_times
    BEFORE INSERT OR UPDATE ON public.fleet_start_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_fleet_start_times();

-- 4. Create function to recalculate all times when schedule changes
CREATE OR REPLACE FUNCTION recalculate_schedule_times()
RETURNS TRIGGER AS $$
BEGIN
    -- Trigger recalculation by touching all fleet entries
    UPDATE public.fleet_start_entries
    SET updated_at = NOW()
    WHERE schedule_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_recalculate_on_schedule_change
    AFTER UPDATE OF first_warning_time, start_interval_minutes, sequence_type ON public.race_start_schedules
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_schedule_times();

-- 5. Create function to handle general recall (restart single fleet)
CREATE OR REPLACE FUNCTION handle_general_recall(
    p_fleet_entry_id UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_entry RECORD;
    v_schedule RECORD;
    v_new_order INTEGER;
    v_interval INTEGER;
BEGIN
    -- Get the fleet entry
    SELECT * INTO v_entry
    FROM public.fleet_start_entries
    WHERE id = p_fleet_entry_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fleet entry not found';
    END IF;
    
    -- Get schedule
    SELECT * INTO v_schedule
    FROM public.race_start_schedules
    WHERE id = v_entry.schedule_id;
    
    -- Update the entry status
    UPDATE public.fleet_start_entries
    SET status = 'general_recall',
        recall_count = recall_count + 1,
        last_recall_at = NOW(),
        recall_notes = COALESCE(recall_notes || E'\n', '') || 
            NOW()::TEXT || ': ' || COALESCE(p_notes, 'General recall'),
        actual_warning_time = NULL,
        actual_prep_time = NULL,
        actual_start_time = NULL
    WHERE id = p_fleet_entry_id;
    
    -- Find the last fleet in the sequence
    SELECT MAX(start_order) INTO v_new_order
    FROM public.fleet_start_entries
    WHERE schedule_id = v_entry.schedule_id;
    
    -- Move this fleet to the end
    UPDATE public.fleet_start_entries
    SET start_order = v_new_order + 1,
        status = 'pending'
    WHERE id = p_fleet_entry_id;
    
    -- Renumber remaining fleets
    WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY start_order) as new_order
        FROM public.fleet_start_entries
        WHERE schedule_id = v_entry.schedule_id
        AND id != p_fleet_entry_id
        AND start_order > v_entry.start_order
    )
    UPDATE public.fleet_start_entries fe
    SET start_order = ordered.new_order
    FROM ordered
    WHERE fe.id = ordered.id;
    
    -- Log to committee boat log
    INSERT INTO public.committee_boat_log (
        regatta_id, race_number, log_time, category, event_type,
        title, description, flags_displayed, sound_signals,
        is_auto_logged, auto_log_source
    ) VALUES (
        v_schedule.regatta_id, v_entry.race_number, NOW(),
        'signal', 'general_recall',
        'General Recall: ' || v_entry.fleet_name,
        'General recall for ' || v_entry.fleet_name || ' Race ' || v_entry.race_number || 
            '. Fleet moved to end of sequence.' ||
            CASE WHEN p_notes IS NOT NULL THEN ' Notes: ' || p_notes ELSE '' END,
        ARRAY['First Substitute'],
        2,
        TRUE, 'start_scheduler'
    );
    
    RETURN p_fleet_entry_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create view for current schedule status
CREATE OR REPLACE VIEW public.schedule_status AS
SELECT 
    s.id as schedule_id,
    s.regatta_id,
    s.name as schedule_name,
    s.scheduled_date,
    s.status as schedule_status,
    s.first_warning_time,
    s.start_interval_minutes,
    s.sequence_type,
    COUNT(fe.id) as total_fleets,
    COUNT(fe.id) FILTER (WHERE fe.status = 'started') as fleets_started,
    COUNT(fe.id) FILTER (WHERE fe.status = 'pending') as fleets_pending,
    COUNT(fe.id) FILTER (WHERE fe.status IN ('warning', 'preparatory', 'one_minute')) as fleets_in_sequence,
    COUNT(fe.id) FILTER (WHERE fe.status = 'general_recall') as fleets_recalled,
    MIN(fe.planned_warning_time) FILTER (WHERE fe.status = 'pending') as next_warning_time,
    (SELECT fe2.fleet_name FROM public.fleet_start_entries fe2 
     WHERE fe2.schedule_id = s.id AND fe2.status = 'pending' 
     ORDER BY fe2.start_order LIMIT 1) as next_fleet
FROM public.race_start_schedules s
LEFT JOIN public.fleet_start_entries fe ON fe.schedule_id = s.id
GROUP BY s.id;

-- 7. Create view for timeline display
CREATE OR REPLACE VIEW public.start_timeline AS
SELECT 
    fe.id,
    fe.schedule_id,
    s.regatta_id,
    s.name as schedule_name,
    fe.fleet_name,
    fe.class_flag,
    fe.start_order,
    fe.race_number,
    fe.status,
    fe.planned_warning_time,
    fe.planned_prep_time,
    fe.planned_start_time,
    fe.actual_warning_time,
    fe.actual_prep_time,
    fe.actual_start_time,
    fe.recall_count,
    COALESCE(fe.actual_warning_time, fe.planned_warning_time) as effective_warning_time,
    COALESCE(fe.actual_start_time, fe.planned_start_time) as effective_start_time,
    CASE 
        WHEN fe.status = 'pending' AND fe.planned_warning_time <= NOW() + INTERVAL '2 minutes' THEN 'upcoming'
        WHEN fe.status IN ('warning', 'preparatory', 'one_minute') THEN 'active'
        WHEN fe.status = 'started' THEN 'completed'
        ELSE fe.status
    END as timeline_status
FROM public.fleet_start_entries fe
JOIN public.race_start_schedules s ON s.id = fe.schedule_id
ORDER BY fe.schedule_id, fe.start_order;

-- 8. RLS Policies
ALTER TABLE public.race_start_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_start_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club staff can manage schedules"
    ON public.race_start_schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_start_schedules.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

CREATE POLICY "Public can view schedules"
    ON public.race_start_schedules FOR SELECT
    USING (
        status != 'draft'
        AND EXISTS (
            SELECT 1 FROM regattas
            WHERE regattas.id = race_start_schedules.regatta_id
        )
    );

CREATE POLICY "Club staff can manage fleet entries"
    ON public.fleet_start_entries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM race_start_schedules rss
            JOIN regattas r ON r.id = rss.regatta_id
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE rss.id = fleet_start_entries.schedule_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

CREATE POLICY "Public can view fleet entries"
    ON public.fleet_start_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM race_start_schedules rss
            WHERE rss.id = fleet_start_entries.schedule_id
            AND rss.status != 'draft'
        )
    );

-- 9. Grants
GRANT ALL ON public.race_start_schedules TO authenticated;
GRANT ALL ON public.fleet_start_entries TO authenticated;
GRANT SELECT ON public.schedule_status TO authenticated;
GRANT SELECT ON public.start_timeline TO authenticated;

-- 10. Update triggers
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.race_start_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fleet_entries_updated_at
    BEFORE UPDATE ON public.fleet_start_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

