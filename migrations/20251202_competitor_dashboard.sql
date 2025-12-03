-- ============================================================================
-- Competitor Dashboard Migration
-- Personal command center for sailors
-- ============================================================================

-- 1. Create competitor_boats table (boats owned/sailed by competitors)
CREATE TABLE IF NOT EXISTS public.competitor_boats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Boat identification
    name TEXT NOT NULL,
    sail_number TEXT NOT NULL,
    hull_number TEXT,
    
    -- Boat class
    boat_class TEXT NOT NULL,                     -- e.g., "J/70", "Laser", "420"
    class_association TEXT,                       -- e.g., "J/70 Class Association"
    
    -- Details
    year_built INTEGER,
    builder TEXT,
    designer TEXT,
    hull_color TEXT,
    
    -- Ownership
    ownership_type TEXT DEFAULT 'owner' CHECK (ownership_type IN (
        'owner',            -- I own this boat
        'co_owner',         -- I co-own this boat
        'charter',          -- I regularly charter this boat
        'crew'              -- I crew on this boat
    )),
    
    -- Ratings/Handicaps
    phrf_rating INTEGER,
    phrf_certificate_number TEXT,
    phrf_expiry DATE,
    
    irc_rating DECIMAL(4, 3),
    irc_certificate_number TEXT,
    irc_expiry DATE,
    
    orc_rating DECIMAL(4, 3),
    orc_certificate_number TEXT,
    orc_expiry DATE,
    
    custom_rating DECIMAL(6, 2),
    custom_rating_system TEXT,
    
    -- Documentation
    measurement_certificate_url TEXT,
    insurance_certificate_url TEXT,
    registration_document_url TEXT,
    
    -- Photos
    photo_urls TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,             -- Primary boat for quick selection
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_boats_user ON public.competitor_boats(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_boats_sail ON public.competitor_boats(sail_number);

-- 2. Create competitor_alerts table
CREATE TABLE IF NOT EXISTS public.competitor_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alert type
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'race_reminder',        -- Upcoming race reminder
        'results_posted',       -- Results have been posted
        'schedule_change',      -- Schedule change
        'recall',               -- General or individual recall
        'postponement',         -- Race postponed
        'abandonment',          -- Race abandoned
        'protest_filed',        -- Protest filed against you
        'protest_hearing',      -- Hearing scheduled
        'protest_decision',     -- Decision made
        'check_in_reminder',    -- Check-in deadline approaching
        'registration_open',    -- Registration opened for event
        'registration_closing', -- Registration closing soon
        'weather_alert',        -- Weather warning
        'notice_posted',        -- New notice posted
        'standings_update'      -- Series standings updated
    )),
    
    -- Source
    regatta_id UUID REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_id UUID,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Priority
    priority TEXT DEFAULT 'normal' CHECK (priority IN (
        'low',
        'normal',
        'high',
        'urgent'
    )),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Deep link
    action_url TEXT,                              -- Where to navigate when tapped
    
    -- Delivery
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ                        -- When alert should disappear
);

CREATE INDEX IF NOT EXISTS idx_competitor_alerts_user ON public.competitor_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_unread ON public.competitor_alerts(user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_type ON public.competitor_alerts(alert_type);

-- 3. Create competitor_favorites table (saved regattas/clubs)
CREATE TABLE IF NOT EXISTS public.competitor_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- What's favorited
    favorite_type TEXT NOT NULL CHECK (favorite_type IN ('club', 'regatta', 'series')),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    regatta_id UUID REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- Notifications
    notify_new_events BOOLEAN DEFAULT TRUE,
    notify_results BOOLEAN DEFAULT TRUE,
    notify_schedule_changes BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, club_id),
    UNIQUE(user_id, regatta_id)
);

CREATE INDEX IF NOT EXISTS idx_competitor_favorites_user ON public.competitor_favorites(user_id);

-- 4. Create view for competitor race history
CREATE OR REPLACE VIEW public.competitor_race_history AS
SELECT 
    rr.id as result_id,
    rr.race_id,
    rr.entry_id,
    re.user_id,
    re.sail_number,
    re.boat_name,
    re.class as boat_class,
    rr.finish_position,
    rr.corrected_position,
    rr.points,
    rr.status_code,
    rr.finish_time,
    rr.elapsed_time_seconds,
    r.name as race_name,
    r.race_number,
    r.scheduled_start,
    reg.name as regatta_name,
    reg.id as regatta_id,
    reg.start_date as regatta_start,
    reg.end_date as regatta_end,
    c.name as club_name,
    c.id as club_id
FROM public.race_results rr
JOIN public.race_entries re ON re.id = rr.entry_id
JOIN public.races r ON r.id = rr.race_id
JOIN public.regattas reg ON reg.id = r.regatta_id
JOIN public.clubs c ON c.id = reg.club_id
WHERE re.user_id IS NOT NULL;

-- 5. Create view for competitor upcoming races
CREATE OR REPLACE VIEW public.competitor_upcoming_races AS
SELECT 
    re.id as entry_id,
    re.user_id,
    re.sail_number,
    re.boat_name,
    re.class as boat_class,
    re.status as entry_status,
    r.id as race_id,
    r.name as race_name,
    r.race_number,
    r.scheduled_start,
    r.status as race_status,
    reg.name as regatta_name,
    reg.id as regatta_id,
    reg.venue,
    reg.start_date as regatta_start,
    reg.end_date as regatta_end,
    c.name as club_name,
    c.id as club_id,
    c.logo_url as club_logo,
    -- Check-in status
    ci.status as check_in_status,
    ci.checked_in_at
FROM public.race_entries re
JOIN public.races r ON r.id = re.race_id
JOIN public.regattas reg ON reg.id = r.regatta_id
JOIN public.clubs c ON c.id = reg.club_id
LEFT JOIN public.race_check_ins ci ON ci.race_id = r.id AND ci.entry_id = re.id
WHERE re.user_id IS NOT NULL
  AND (r.scheduled_start IS NULL OR r.scheduled_start > NOW() - INTERVAL '1 day')
  AND r.status NOT IN ('completed', 'abandoned')
ORDER BY r.scheduled_start;

-- 6. Create view for competitor statistics
CREATE OR REPLACE VIEW public.competitor_statistics AS
SELECT 
    re.user_id,
    COUNT(DISTINCT rr.race_id) as total_races,
    COUNT(DISTINCT r.regatta_id) as total_regattas,
    COUNT(*) FILTER (WHERE rr.finish_position = 1) as first_places,
    COUNT(*) FILTER (WHERE rr.finish_position = 2) as second_places,
    COUNT(*) FILTER (WHERE rr.finish_position = 3) as third_places,
    COUNT(*) FILTER (WHERE rr.finish_position <= 3) as podiums,
    COUNT(*) FILTER (WHERE rr.status_code = 'DNF') as dnf_count,
    COUNT(*) FILTER (WHERE rr.status_code = 'DSQ') as dsq_count,
    COUNT(*) FILTER (WHERE rr.status_code = 'DNS') as dns_count,
    COUNT(*) FILTER (WHERE rr.status_code = 'OCS') as ocs_count,
    AVG(rr.finish_position) FILTER (WHERE rr.finish_position > 0) as avg_finish,
    MIN(rr.finish_position) FILTER (WHERE rr.finish_position > 0) as best_finish,
    -- By year
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM r.scheduled_start) = EXTRACT(YEAR FROM NOW())) as races_this_year,
    COUNT(*) FILTER (WHERE rr.finish_position <= 3 AND EXTRACT(YEAR FROM r.scheduled_start) = EXTRACT(YEAR FROM NOW())) as podiums_this_year,
    -- Recent form (last 10 races)
    (
        SELECT AVG(sub.finish_position)
        FROM (
            SELECT rr2.finish_position
            FROM public.race_results rr2
            JOIN public.race_entries re2 ON re2.id = rr2.entry_id
            JOIN public.races r2 ON r2.id = rr2.race_id
            WHERE re2.user_id = re.user_id
              AND rr2.finish_position > 0
            ORDER BY r2.scheduled_start DESC
            LIMIT 10
        ) sub
    ) as recent_avg_finish
FROM public.race_results rr
JOIN public.race_entries re ON re.id = rr.entry_id
JOIN public.races r ON r.id = rr.race_id
WHERE re.user_id IS NOT NULL
GROUP BY re.user_id;

-- 7. Create function to get competitor standings in active series
CREATE OR REPLACE FUNCTION get_competitor_series_standings(p_user_id UUID)
RETURNS TABLE (
    series_id UUID,
    series_name TEXT,
    regatta_id UUID,
    club_name TEXT,
    position INTEGER,
    total_entries INTEGER,
    points DECIMAL,
    races_sailed INTEGER,
    races_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.id,
        reg.name,
        reg.id,
        c.name,
        ss.position,
        (SELECT COUNT(DISTINCT entry_id) FROM series_standings WHERE regatta_id = reg.id)::INTEGER,
        ss.total_points,
        ss.races_sailed,
        (SELECT COUNT(*) FROM races WHERE regatta_id = reg.id AND status = 'pending')::INTEGER
    FROM public.series_standings ss
    JOIN public.race_entries re ON re.id = ss.entry_id
    JOIN public.regattas reg ON reg.id = ss.regatta_id
    JOIN public.clubs c ON c.id = reg.club_id
    WHERE re.user_id = p_user_id
      AND reg.end_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY ss.position;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to send alert to competitor
CREATE OR REPLACE FUNCTION send_competitor_alert(
    p_user_id UUID,
    p_alert_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_regatta_id UUID DEFAULT NULL,
    p_race_id UUID DEFAULT NULL,
    p_club_id UUID DEFAULT NULL,
    p_priority TEXT DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO public.competitor_alerts (
        user_id, alert_type, title, message,
        regatta_id, race_id, club_id,
        priority, action_url, expires_at
    ) VALUES (
        p_user_id, p_alert_type, p_title, p_message,
        p_regatta_id, p_race_id, p_club_id,
        p_priority, p_action_url, p_expires_at
    )
    RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to send alert when results are posted
CREATE OR REPLACE FUNCTION notify_competitor_results()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_regatta_name TEXT;
    v_race_name TEXT;
    v_position INTEGER;
BEGIN
    -- Get entry user
    SELECT re.user_id INTO v_user_id
    FROM public.race_entries re
    WHERE re.id = NEW.entry_id;
    
    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get race/regatta info
    SELECT r.name, reg.name, NEW.finish_position
    INTO v_race_name, v_regatta_name, v_position
    FROM public.races r
    JOIN public.regattas reg ON reg.id = r.regatta_id
    WHERE r.id = NEW.race_id;
    
    -- Send alert
    PERFORM send_competitor_alert(
        v_user_id,
        'results_posted',
        'Results Posted: ' || v_race_name,
        CASE 
            WHEN v_position = 1 THEN '🥇 Congratulations! You finished 1st!'
            WHEN v_position = 2 THEN '🥈 Great job! You finished 2nd!'
            WHEN v_position = 3 THEN '🥉 Well done! You finished 3rd!'
            WHEN v_position <= 10 THEN 'You finished ' || v_position || 'th in ' || v_regatta_name
            ELSE 'Your results are now available'
        END,
        (SELECT regatta_id FROM public.races WHERE id = NEW.race_id),
        NEW.race_id,
        NULL,
        CASE WHEN v_position <= 3 THEN 'high' ELSE 'normal' END,
        '/results/' || NEW.race_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_results_posted
    AFTER INSERT ON public.race_results
    FOR EACH ROW
    EXECUTE FUNCTION notify_competitor_results();

-- 10. Create trigger to send alert when protest filed against competitor
CREATE OR REPLACE FUNCTION notify_competitor_protest()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_protestee_id UUID;
BEGIN
    -- Get users for protestee entries
    IF NEW.protestee_entry_ids IS NOT NULL THEN
        FOR v_protestee_id IN SELECT unnest(NEW.protestee_entry_ids)
        LOOP
            SELECT re.user_id INTO v_user_id
            FROM public.race_entries re
            WHERE re.id = v_protestee_id;
            
            IF v_user_id IS NOT NULL THEN
                PERFORM send_competitor_alert(
                    v_user_id,
                    'protest_filed',
                    '⚠️ Protest Filed Against You',
                    'A protest has been filed. Check the details and prepare your response.',
                    NEW.regatta_id,
                    NEW.race_id,
                    NULL,
                    'urgent',
                    '/protests/' || NEW.id
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_protest_filed
    AFTER INSERT ON public.race_protests
    FOR EACH ROW
    EXECUTE FUNCTION notify_competitor_protest();

-- 11. RLS Policies
ALTER TABLE public.competitor_boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_favorites ENABLE ROW LEVEL SECURITY;

-- Boats: users can only manage their own boats
CREATE POLICY "Users can manage their own boats"
    ON public.competitor_boats FOR ALL
    USING (user_id = auth.uid());

-- Alerts: users can only see their own alerts
CREATE POLICY "Users can see their own alerts"
    ON public.competitor_alerts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own alerts"
    ON public.competitor_alerts FOR UPDATE
    USING (user_id = auth.uid());

-- System can insert alerts (using service role)
CREATE POLICY "System can insert alerts"
    ON public.competitor_alerts FOR INSERT
    WITH CHECK (TRUE);

-- Favorites: users can manage their own favorites
CREATE POLICY "Users can manage their own favorites"
    ON public.competitor_favorites FOR ALL
    USING (user_id = auth.uid());

-- 12. Grants
GRANT ALL ON public.competitor_boats TO authenticated;
GRANT ALL ON public.competitor_alerts TO authenticated;
GRANT ALL ON public.competitor_favorites TO authenticated;
GRANT SELECT ON public.competitor_race_history TO authenticated;
GRANT SELECT ON public.competitor_upcoming_races TO authenticated;
GRANT SELECT ON public.competitor_statistics TO authenticated;

-- 13. Update triggers
CREATE TRIGGER update_competitor_boats_updated_at
    BEFORE UPDATE ON public.competitor_boats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

