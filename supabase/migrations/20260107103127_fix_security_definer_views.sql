-- Fix SECURITY DEFINER views by recreating them with SECURITY INVOKER
-- This ensures RLS policies are respected for the querying user
-- Fixes security advisor errors for: coach_metrics_view, coach_feedback_view, coach_sailor_sessions_view

-- Drop and recreate coach_metrics_view with security_invoker
DROP VIEW IF EXISTS public.coach_metrics_view;
CREATE VIEW public.coach_metrics_view
WITH (security_invoker = on)
AS
SELECT
  cp.id AS coach_id,
  cp.user_id,
  cp.display_name,
  cp.profile_image_url AS profile_photo_url,
  count(DISTINCT cs.id) FILTER (WHERE cs.status = 'completed'::text) AS total_completed_sessions,
  count(DISTINCT cs.id) FILTER (WHERE (cs.status = ANY (ARRAY['scheduled'::text, 'confirmed'::text])) AND cs.scheduled_at >= now()) AS upcoming_sessions,
  count(DISTINCT cs.id) FILTER (WHERE cs.status = 'completed'::text AND cs.completed_at >= date_trunc('month'::text, now())) AS sessions_this_month,
  count(DISTINCT COALESCE(cs.sailor_id, cs.student_id)) AS total_clients,
  count(DISTINCT cc.id) FILTER (WHERE cc.status = 'active'::text) AS active_clients,
  round(avg(sf.rating), 2) AS average_rating,
  count(sf.id) AS total_reviews
FROM coach_profiles cp
  LEFT JOIN coaching_sessions cs ON cp.id = cs.coach_id
  LEFT JOIN coaching_clients cc ON cp.id = cc.coach_id
  LEFT JOIN session_feedback sf ON cs.id = sf.session_id
GROUP BY cp.id, cp.user_id, cp.display_name, cp.profile_image_url;

-- Restore grants for coach_metrics_view
GRANT SELECT ON public.coach_metrics_view TO anon, authenticated, service_role;

-- Drop and recreate coach_feedback_view with security_invoker
DROP VIEW IF EXISTS public.coach_feedback_view;
CREATE VIEW public.coach_feedback_view
WITH (security_invoker = on)
AS
SELECT
  sf.id AS feedback_id,
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
FROM session_feedback sf
  JOIN coaching_sessions cs ON sf.session_id = cs.id
  JOIN coach_profiles cp ON cs.coach_id = cp.id
  LEFT JOIN users u ON COALESCE(cs.sailor_id, cs.student_id) = u.id
WHERE sf.public = true;

-- Restore grants for coach_feedback_view
GRANT SELECT ON public.coach_feedback_view TO anon, authenticated, service_role;

-- Drop and recreate coach_sailor_sessions_view with security_invoker
DROP VIEW IF EXISTS public.coach_sailor_sessions_view;
CREATE VIEW public.coach_sailor_sessions_view
WITH (security_invoker = on)
AS
SELECT
  cs.id AS session_id,
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
FROM coaching_sessions cs
  LEFT JOIN coach_profiles cp ON cs.coach_id = cp.id
  LEFT JOIN users u ON COALESCE(cs.sailor_id, cs.student_id) = u.id
  LEFT JOIN session_feedback sf ON cs.id = sf.session_id;

-- Restore grants for coach_sailor_sessions_view
GRANT SELECT ON public.coach_sailor_sessions_view TO anon, authenticated, service_role;
