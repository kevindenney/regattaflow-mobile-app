-- ============================================================================
-- Weather Dashboard Migration
-- Live conditions tracking for race management
-- ============================================================================

-- 1. Create weather_stations table (data sources)
CREATE TABLE IF NOT EXISTS public.weather_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    
    -- Station info
    name TEXT NOT NULL,
    station_type TEXT DEFAULT 'manual' CHECK (station_type IN (
        'manual',           -- Manual entry by race committee
        'boat_mounted',     -- Sensor on committee boat
        'shore_station',    -- Fixed shore station
        'buoy',            -- Weather buoy
        'api'              -- External API (weather service)
    )),
    
    -- Location
    location_name TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    elevation_meters DECIMAL(6, 2),
    
    -- API configuration (for external sources)
    api_provider TEXT,                  -- e.g., 'openweather', 'weatherapi'
    api_station_id TEXT,
    api_config JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_reading_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_club ON public.weather_stations(club_id);

-- 2. Create weather_readings table (individual data points)
CREATE TABLE IF NOT EXISTS public.weather_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID REFERENCES public.regattas(id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.weather_stations(id) ON DELETE SET NULL,
    
    -- Timestamp
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Wind data (primary)
    wind_direction_degrees INTEGER CHECK (wind_direction_degrees >= 0 AND wind_direction_degrees < 360),
    wind_speed_knots DECIMAL(5, 2),
    wind_gust_knots DECIMAL(5, 2),
    
    -- Wind statistics (for period)
    wind_direction_avg INTEGER,
    wind_direction_std DECIMAL(5, 2),    -- Standard deviation (oscillation)
    wind_speed_avg DECIMAL(5, 2),
    wind_speed_min DECIMAL(5, 2),
    wind_speed_max DECIMAL(5, 2),
    
    -- Atmospheric
    temperature_celsius DECIMAL(4, 1),
    humidity_percent INTEGER CHECK (humidity_percent >= 0 AND humidity_percent <= 100),
    pressure_hpa DECIMAL(6, 1),
    pressure_trend TEXT CHECK (pressure_trend IN ('rising', 'steady', 'falling')),
    
    -- Sea state
    wave_height_meters DECIMAL(4, 2),
    wave_period_seconds DECIMAL(4, 1),
    current_direction_degrees INTEGER,
    current_speed_knots DECIMAL(4, 2),
    
    -- Visibility
    visibility_nm DECIMAL(5, 2),
    cloud_cover_percent INTEGER,
    precipitation TEXT CHECK (precipitation IN ('none', 'light', 'moderate', 'heavy')),
    
    -- Source info
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'sensor', 'api')),
    recorded_by UUID REFERENCES auth.users(id),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_readings_regatta ON public.weather_readings(regatta_id);
CREATE INDEX IF NOT EXISTS idx_readings_time ON public.weather_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_readings_regatta_time ON public.weather_readings(regatta_id, recorded_at DESC);

-- 3. Create weather_alerts table (threshold configurations)
CREATE TABLE IF NOT EXISTS public.weather_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    
    -- Alert configuration
    name TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'high_wind',
        'low_wind',
        'wind_shift',
        'gusts',
        'visibility',
        'lightning',
        'temperature',
        'custom'
    )),
    
    -- Thresholds
    threshold_value DECIMAL(10, 2),
    threshold_unit TEXT,
    comparison TEXT CHECK (comparison IN ('gt', 'gte', 'lt', 'lte', 'eq', 'change')),
    
    -- For wind shift alerts
    shift_degrees INTEGER,               -- Alert if wind shifts more than this
    shift_minutes INTEGER,               -- Over this time period
    
    -- Actions
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    auto_log BOOLEAN DEFAULT TRUE,       -- Auto-log to committee boat log
    sound_alert BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create weather_alert_events table (triggered alerts)
CREATE TABLE IF NOT EXISTS public.weather_alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.weather_alerts(id) ON DELETE SET NULL,
    reading_id UUID REFERENCES public.weather_readings(id) ON DELETE SET NULL,
    
    -- Alert details
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Values at time of alert
    current_value DECIMAL(10, 2),
    threshold_value DECIMAL(10, 2),
    
    -- Status
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    
    -- Log reference
    log_entry_id UUID REFERENCES public.committee_boat_log(id)
);

CREATE INDEX IF NOT EXISTS idx_alert_events_regatta ON public.weather_alert_events(regatta_id);

-- 5. Create function to calculate wind statistics
CREATE OR REPLACE FUNCTION calculate_wind_stats(
    p_regatta_id UUID,
    p_minutes INTEGER DEFAULT 10
) RETURNS TABLE (
    avg_direction INTEGER,
    direction_std DECIMAL,
    avg_speed DECIMAL,
    min_speed DECIMAL,
    max_speed DECIMAL,
    avg_gust DECIMAL,
    reading_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Circular mean for direction
        (ATAN2(
            AVG(SIN(RADIANS(wind_direction_degrees))),
            AVG(COS(RADIANS(wind_direction_degrees)))
        ) * 180 / PI() + 360)::INTEGER % 360 as avg_direction,
        -- Circular standard deviation
        SQRT(-2 * LN(SQRT(
            POWER(AVG(SIN(RADIANS(wind_direction_degrees))), 2) +
            POWER(AVG(COS(RADIANS(wind_direction_degrees))), 2)
        ))) * 180 / PI() as direction_std,
        AVG(wind_speed_knots)::DECIMAL(5,2) as avg_speed,
        MIN(wind_speed_knots)::DECIMAL(5,2) as min_speed,
        MAX(wind_speed_knots)::DECIMAL(5,2) as max_speed,
        AVG(wind_gust_knots)::DECIMAL(5,2) as avg_gust,
        COUNT(*)::INTEGER as reading_count
    FROM public.weather_readings
    WHERE regatta_id = p_regatta_id
    AND recorded_at >= NOW() - (p_minutes || ' minutes')::INTERVAL
    AND wind_direction_degrees IS NOT NULL
    AND wind_speed_knots IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to detect wind shifts
CREATE OR REPLACE FUNCTION detect_wind_shift(
    p_regatta_id UUID,
    p_threshold_degrees INTEGER DEFAULT 15,
    p_minutes INTEGER DEFAULT 10
) RETURNS TABLE (
    shift_detected BOOLEAN,
    previous_direction INTEGER,
    current_direction INTEGER,
    shift_amount INTEGER,
    shift_direction TEXT
) AS $$
DECLARE
    v_prev_dir INTEGER;
    v_curr_dir INTEGER;
    v_shift INTEGER;
BEGIN
    -- Get average direction from 10-20 minutes ago
    SELECT (ATAN2(
        AVG(SIN(RADIANS(wind_direction_degrees))),
        AVG(COS(RADIANS(wind_direction_degrees)))
    ) * 180 / PI() + 360)::INTEGER % 360
    INTO v_prev_dir
    FROM public.weather_readings
    WHERE regatta_id = p_regatta_id
    AND recorded_at BETWEEN NOW() - ((p_minutes * 2) || ' minutes')::INTERVAL 
                        AND NOW() - (p_minutes || ' minutes')::INTERVAL
    AND wind_direction_degrees IS NOT NULL;
    
    -- Get average direction from last 10 minutes
    SELECT (ATAN2(
        AVG(SIN(RADIANS(wind_direction_degrees))),
        AVG(COS(RADIANS(wind_direction_degrees)))
    ) * 180 / PI() + 360)::INTEGER % 360
    INTO v_curr_dir
    FROM public.weather_readings
    WHERE regatta_id = p_regatta_id
    AND recorded_at >= NOW() - (p_minutes || ' minutes')::INTERVAL
    AND wind_direction_degrees IS NOT NULL;
    
    -- Calculate shift (handling 360/0 wrap)
    v_shift := ((v_curr_dir - v_prev_dir + 540) % 360) - 180;
    
    RETURN QUERY SELECT 
        ABS(v_shift) >= p_threshold_degrees,
        v_prev_dir,
        v_curr_dir,
        v_shift,
        CASE 
            WHEN v_shift > 0 THEN 'veered'  -- Clockwise shift
            WHEN v_shift < 0 THEN 'backed'  -- Counter-clockwise shift
            ELSE 'steady'
        END;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to auto-log weather to committee log
CREATE OR REPLACE FUNCTION auto_log_weather()
RETURNS TRIGGER AS $$
DECLARE
    v_direction_name TEXT;
BEGIN
    -- Get direction name
    v_direction_name := CASE 
        WHEN NEW.wind_direction_degrees IS NULL THEN 'Unknown'
        WHEN NEW.wind_direction_degrees >= 337 OR NEW.wind_direction_degrees < 23 THEN 'N'
        WHEN NEW.wind_direction_degrees >= 23 AND NEW.wind_direction_degrees < 68 THEN 'NE'
        WHEN NEW.wind_direction_degrees >= 68 AND NEW.wind_direction_degrees < 113 THEN 'E'
        WHEN NEW.wind_direction_degrees >= 113 AND NEW.wind_direction_degrees < 158 THEN 'SE'
        WHEN NEW.wind_direction_degrees >= 158 AND NEW.wind_direction_degrees < 203 THEN 'S'
        WHEN NEW.wind_direction_degrees >= 203 AND NEW.wind_direction_degrees < 248 THEN 'SW'
        WHEN NEW.wind_direction_degrees >= 248 AND NEW.wind_direction_degrees < 293 THEN 'W'
        ELSE 'NW'
    END;
    
    -- Only auto-log manual readings (not every sensor reading)
    IF NEW.source = 'manual' THEN
        INSERT INTO public.committee_boat_log (
            regatta_id, log_time, category, event_type,
            title, description, wind_direction, wind_speed,
            is_auto_logged, auto_log_source
        ) VALUES (
            NEW.regatta_id, NEW.recorded_at,
            'weather', 'conditions',
            'Weather: ' || v_direction_name || ' ' || COALESCE(NEW.wind_speed_knots::TEXT, '?') || 'kts',
            'Wind: ' || COALESCE(NEW.wind_direction_degrees::TEXT, '?') || '° (' || v_direction_name || ') at ' || 
            COALESCE(NEW.wind_speed_knots::TEXT, '?') || ' knots' ||
            CASE WHEN NEW.wind_gust_knots IS NOT NULL THEN ', gusts to ' || NEW.wind_gust_knots || ' knots' ELSE '' END ||
            CASE WHEN NEW.notes IS NOT NULL THEN '. ' || NEW.notes ELSE '' END,
            NEW.wind_direction_degrees,
            NEW.wind_speed_knots,
            TRUE, 'weather_dashboard'
        );
    END IF;
    
    -- Update station last reading
    IF NEW.station_id IS NOT NULL THEN
        UPDATE public.weather_stations
        SET last_reading_at = NEW.recorded_at
        WHERE id = NEW.station_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_log_weather_reading
    AFTER INSERT ON public.weather_readings
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_weather();

-- 8. Create view for latest conditions
CREATE OR REPLACE VIEW public.latest_weather AS
SELECT DISTINCT ON (regatta_id)
    wr.*,
    ws.name as station_name,
    ws.station_type,
    CASE 
        WHEN wr.wind_direction_degrees >= 337 OR wr.wind_direction_degrees < 23 THEN 'N'
        WHEN wr.wind_direction_degrees >= 23 AND wr.wind_direction_degrees < 68 THEN 'NE'
        WHEN wr.wind_direction_degrees >= 68 AND wr.wind_direction_degrees < 113 THEN 'E'
        WHEN wr.wind_direction_degrees >= 113 AND wr.wind_direction_degrees < 158 THEN 'SE'
        WHEN wr.wind_direction_degrees >= 158 AND wr.wind_direction_degrees < 203 THEN 'S'
        WHEN wr.wind_direction_degrees >= 203 AND wr.wind_direction_degrees < 248 THEN 'SW'
        WHEN wr.wind_direction_degrees >= 248 AND wr.wind_direction_degrees < 293 THEN 'W'
        ELSE 'NW'
    END as wind_direction_name
FROM public.weather_readings wr
LEFT JOIN public.weather_stations ws ON ws.id = wr.station_id
ORDER BY regatta_id, recorded_at DESC;

-- 9. Create view for wind history (last hour)
CREATE OR REPLACE VIEW public.wind_history AS
SELECT 
    regatta_id,
    DATE_TRUNC('minute', recorded_at) as time_bucket,
    AVG(wind_direction_degrees)::INTEGER as avg_direction,
    AVG(wind_speed_knots)::DECIMAL(5,2) as avg_speed,
    MAX(wind_gust_knots)::DECIMAL(5,2) as max_gust,
    COUNT(*) as reading_count
FROM public.weather_readings
WHERE recorded_at >= NOW() - INTERVAL '1 hour'
AND wind_direction_degrees IS NOT NULL
GROUP BY regatta_id, DATE_TRUNC('minute', recorded_at)
ORDER BY regatta_id, time_bucket;

-- 10. Insert default weather alerts
INSERT INTO public.weather_alerts (club_id, name, alert_type, threshold_value, threshold_unit, comparison, severity, auto_log)
VALUES
    (NULL, 'High Wind Warning', 'high_wind', 25, 'knots', 'gte', 'warning', TRUE),
    (NULL, 'High Wind Critical', 'high_wind', 35, 'knots', 'gte', 'critical', TRUE),
    (NULL, 'Low Wind', 'low_wind', 5, 'knots', 'lte', 'info', TRUE),
    (NULL, 'Strong Gusts', 'gusts', 30, 'knots', 'gte', 'warning', TRUE),
    (NULL, 'Major Wind Shift', 'wind_shift', 30, 'degrees', 'change', 'warning', TRUE),
    (NULL, 'Poor Visibility', 'visibility', 1, 'nm', 'lte', 'warning', TRUE)
ON CONFLICT DO NOTHING;

-- 11. RLS Policies
ALTER TABLE public.weather_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alert_events ENABLE ROW LEVEL SECURITY;

-- Stations: club staff can manage
CREATE POLICY "Club staff can manage stations"
    ON public.weather_stations FOR ALL
    USING (
        club_id IS NULL OR
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = weather_stations.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- Readings: club staff can manage, public can view
CREATE POLICY "Anyone can view weather readings"
    ON public.weather_readings FOR SELECT
    USING (TRUE);

CREATE POLICY "Club staff can add readings"
    ON public.weather_readings FOR INSERT
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = weather_readings.regatta_id
            AND cm.user_id = auth.uid()
        )
    );

-- Alerts: anyone can view, club staff can manage
CREATE POLICY "Anyone can view alerts"
    ON public.weather_alerts FOR SELECT
    USING (TRUE);

CREATE POLICY "Club staff can manage alerts"
    ON public.weather_alerts FOR ALL
    USING (
        club_id IS NULL OR
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = weather_alerts.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- Alert events: club staff can manage
CREATE POLICY "Club staff can manage alert events"
    ON public.weather_alert_events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = weather_alert_events.regatta_id
            AND cm.user_id = auth.uid()
        )
    );

-- 12. Grants
GRANT ALL ON public.weather_stations TO authenticated;
GRANT ALL ON public.weather_readings TO authenticated;
GRANT ALL ON public.weather_alerts TO authenticated;
GRANT ALL ON public.weather_alert_events TO authenticated;
GRANT SELECT ON public.latest_weather TO authenticated;
GRANT SELECT ON public.wind_history TO authenticated;

-- 13. Update trigger
CREATE TRIGGER update_stations_updated_at
    BEFORE UPDATE ON public.weather_stations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

