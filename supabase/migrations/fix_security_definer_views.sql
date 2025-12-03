-- =============================================================================
-- FIX SECURITY DEFINER VIEWS - RegattaFlowWebsite
-- Generated: 2025-12-03
-- =============================================================================
-- Views with SECURITY DEFINER bypass RLS. Convert to SECURITY INVOKER.
-- This ensures the view respects the RLS policies of the querying user.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Fix 1: ai_insights_summary view
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.ai_insights_summary;
CREATE VIEW public.ai_insights_summary 
WITH (security_invoker = true) AS
SELECT r.name AS regatta_name,
    r.start_date,
    r.status AS regatta_status,
    aa.analysis_type,
    aa.confidence_score,
    aa.created_at AS analysis_created,
    p.first_name,
    p.last_name,
    count(aa.id) OVER (PARTITION BY aa.regatta_id) AS total_analyses_for_regatta
FROM ((ai_analyses aa
    JOIN regattas r ON ((aa.regatta_id = r.id)))
    JOIN profiles p ON ((aa.user_id = p.id)))
WHERE (aa.created_at >= (now() - '7 days'::interval))
ORDER BY aa.created_at DESC;

-- -----------------------------------------------------------------------------
-- Fix 2: coach_feedback_view
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.coach_feedback_view;
CREATE VIEW public.coach_feedback_view 
WITH (security_invoker = true) AS
SELECT sf.id AS feedback_id,
    sf.session_id,
    sf.rating,
    sf.feedback_text,
    sf.communication_rating,
    sf.expertise_rating,
    sf.value_rating,
    sf.skill_improvement,
    sf.confidence_change,
    sf.would_recommend,
    sf.created_at AS feedback_date,
    cs.session_type,
    cs.completed_at AS session_date,
    cs.duration_minutes,
    cs.coach_id,
    cp.display_name AS coach_name,
    COALESCE(cs.sailor_id, cs.student_id) AS sailor_id,
    u.full_name AS sailor_name,
    u.email AS sailor_email
FROM (((session_feedback sf
    JOIN coaching_sessions cs ON ((sf.session_id = cs.id)))
    JOIN coach_profiles cp ON ((cs.coach_id = cp.id)))
    LEFT JOIN users u ON ((COALESCE(cs.sailor_id, cs.student_id) = u.id)))
WHERE (sf.public = true);

-- -----------------------------------------------------------------------------
-- Fix 3: coach_metrics_view
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.coach_metrics_view;
CREATE VIEW public.coach_metrics_view 
WITH (security_invoker = true) AS
SELECT cp.id AS coach_id,
    cp.user_id,
    cp.display_name,
    cp.profile_image_url AS profile_photo_url,
    count(DISTINCT cs.id) FILTER (WHERE (cs.status = 'completed'::text)) AS total_completed_sessions,
    count(DISTINCT cs.id) FILTER (WHERE ((cs.status = ANY (ARRAY['scheduled'::text, 'confirmed'::text])) AND (cs.scheduled_at >= now()))) AS upcoming_sessions,
    count(DISTINCT cs.id) FILTER (WHERE ((cs.status = 'completed'::text) AND (cs.completed_at >= date_trunc('month'::text, now())))) AS sessions_this_month,
    count(DISTINCT COALESCE(cs.sailor_id, cs.student_id)) AS total_clients,
    count(DISTINCT cc.id) FILTER (WHERE (cc.status = 'active'::text)) AS active_clients,
    round(avg(sf.rating), 2) AS average_rating,
    count(sf.id) AS total_reviews
FROM (((coach_profiles cp
    LEFT JOIN coaching_sessions cs ON ((cp.id = cs.coach_id)))
    LEFT JOIN coaching_clients cc ON ((cp.id = cc.coach_id)))
    LEFT JOIN session_feedback sf ON ((cs.id = sf.session_id)))
GROUP BY cp.id, cp.user_id, cp.display_name, cp.profile_image_url;

-- -----------------------------------------------------------------------------
-- Fix 4: coach_sailor_sessions_view
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.coach_sailor_sessions_view;
CREATE VIEW public.coach_sailor_sessions_view 
WITH (security_invoker = true) AS
SELECT cs.id AS session_id,
    cs.coach_id,
    COALESCE(cs.sailor_id, cs.student_id) AS sailor_id,
    cs.session_type,
    cs.duration_minutes,
    cs.scheduled_at,
    cs.completed_at,
    cs.status,
    cs.location_notes,
    cs.focus_areas,
    cs.goals,
    cs.session_notes,
    cs.homework,
    COALESCE(cs.fee_amount, cs.total_amount_cents) AS fee_amount,
    cs.currency,
    cs.paid,
    cs.created_at,
    cs.updated_at,
    cs.venue_id,
    cp.display_name AS coach_name,
    cp.profile_image_url AS coach_photo,
    cp.specializations AS coach_specialties,
    u.full_name AS sailor_name,
    u.email AS sailor_email,
    sf.rating AS feedback_rating,
    sf.feedback_text,
    sf.skill_improvement,
    sf.would_recommend
FROM (((coaching_sessions cs
    LEFT JOIN coach_profiles cp ON ((cs.coach_id = cp.id)))
    LEFT JOIN users u ON ((COALESCE(cs.sailor_id, cs.student_id) = u.id)))
    LEFT JOIN session_feedback sf ON ((cs.id = sf.session_id)));

-- -----------------------------------------------------------------------------
-- Fix 5: me view (user's own profile)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.me;
CREATE VIEW public.me 
WITH (security_invoker = true) AS
SELECT id,
    email,
    user_type,
    created_at,
    updated_at,
    onboarding_step,
    onboarding_data
FROM users
WHERE (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Fix 6: race_analytics view
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.race_analytics;
CREATE VIEW public.race_analytics 
WITH (security_invoker = true) AS
SELECT r.id AS regatta_id,
    r.name AS regatta_name,
    r.start_date,
    r.status,
    count(DISTINCT bp.boat_id) AS participating_boats,
    round(avg(bp.speed_knots), 2) AS average_speed,
    round(max(bp.speed_knots), 2) AS top_speed,
    min(bp."timestamp") AS race_start_time,
    max(bp."timestamp") AS last_position_update
FROM (regattas r
    LEFT JOIN boat_positions bp ON ((r.id = bp.regatta_id)))
GROUP BY r.id, r.name, r.start_date, r.status;

-- -----------------------------------------------------------------------------
-- Fix 7: weather_impact view
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.weather_impact;
CREATE VIEW public.weather_impact 
WITH (security_invoker = true) AS
SELECT r.name AS regatta_name,
    date_trunc('hour'::text, w."timestamp") AS hour,
    round(avg(w.wind_speed_knots), 1) AS avg_wind_speed,
    round(avg(w.wind_direction), 0) AS avg_wind_direction,
    round(avg(w.wave_height_meters), 2) AS avg_wave_height,
    round(avg(bp.speed_knots), 2) AS avg_boat_speed,
    count(bp.id) AS position_reports,
    round((corr((w.wind_speed_knots)::double precision, (bp.speed_knots)::double precision))::numeric, 3) AS wind_speed_correlation
FROM ((regattas r
    JOIN boat_positions bp ON ((r.id = bp.regatta_id)))
    JOIN weather_conditions w ON ((st_dwithin(w.location, bp."position", (5000)::double precision) AND (abs(EXTRACT(epoch FROM (w."timestamp" - bp."timestamp"))) < (3600)::numeric))))
GROUP BY r.name, (date_trunc('hour'::text, w."timestamp"))
HAVING (count(bp.id) >= 5)
ORDER BY r.name, (date_trunc('hour'::text, w."timestamp"));


-- =============================================================================
-- GRANT PERMISSIONS ON VIEWS
-- =============================================================================
-- Views need explicit grants for authenticated and anon roles

GRANT SELECT ON public.ai_insights_summary TO authenticated;
GRANT SELECT ON public.coach_feedback_view TO authenticated;
GRANT SELECT ON public.coach_metrics_view TO authenticated;
GRANT SELECT ON public.coach_sailor_sessions_view TO authenticated;
GRANT SELECT ON public.me TO authenticated;
GRANT SELECT ON public.race_analytics TO authenticated;
GRANT SELECT ON public.weather_impact TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Run this to verify views are now using SECURITY INVOKER:
-- 
-- SELECT 
--   viewname,
--   CASE 
--     WHEN definition LIKE '%security_invoker%' THEN 'SECURITY INVOKER ✓'
--     ELSE 'Check needed'
--   END as security_mode
-- FROM pg_views 
-- WHERE schemaname = 'public' 
-- AND viewname IN ('weather_impact', 'me', 'coach_feedback_view', 
--                  'race_analytics', 'coach_sailor_sessions_view',
--                  'ai_insights_summary', 'coach_metrics_view');
-- =============================================================================

