-- =============================================================================
-- Migration: Fix SECURITY DEFINER functions missing SET search_path
-- Date: 2026-01-21
-- Description: Adds SET search_path = public to all SECURITY DEFINER functions
--              to prevent search path injection attacks. Also fixes view with
--              security_invoker = true.
-- =============================================================================

-- =============================================================================
-- FIX: SECURITY DEFINER functions missing SET search_path
-- (Signatures verified from database)
-- =============================================================================

-- Function: get_practice_carryover_items(p_user_id uuid)
ALTER FUNCTION public.get_practice_carryover_items(uuid) SET search_path = public;

-- Function: get_sails_needing_inspection(p_boat_id uuid, p_days_threshold integer)
ALTER FUNCTION public.get_sails_needing_inspection(uuid, integer) SET search_path = public;

-- Function: get_user_team_entry_ids(p_user_id uuid)
ALTER FUNCTION public.get_user_team_entry_ids(uuid) SET search_path = public;

-- Function: insert_sample_coach_annotations()
ALTER FUNCTION public.insert_sample_coach_annotations() SET search_path = public;

-- Function: is_team_creator(p_team_entry_id uuid, p_user_id uuid)
ALTER FUNCTION public.is_team_creator(uuid, uuid) SET search_path = public;

-- Function: join_practice_by_invite(p_invite_code text, p_display_name text, p_role text)
ALTER FUNCTION public.join_practice_by_invite(text, text, text) SET search_path = public;

-- Function: join_team_by_invite(p_invite_code text, p_display_name text, p_sail_number text, p_role text)
ALTER FUNCTION public.join_team_by_invite(text, text, text, text) SET search_path = public;

-- Function: set_practice_invite_code(session_id uuid)
ALTER FUNCTION public.set_practice_invite_code(uuid) SET search_path = public;

-- Function: set_team_invite_code(entry_id uuid)
ALTER FUNCTION public.set_team_invite_code(uuid) SET search_path = public;

-- =============================================================================
-- FIX: View with SECURITY DEFINER -> SECURITY INVOKER
-- =============================================================================

-- Recreate view with security_invoker = true to respect RLS policies
CREATE OR REPLACE VIEW public.sail_inventory_with_health
WITH (security_invoker = true)
AS
SELECT
  be.id,
  be.boat_id,
  be.sailor_id,
  be.custom_name,
  be.category AS sail_type,
  be.subcategory,
  be.serial_number,
  be.purchase_date,
  be.condition,
  be.status,
  be.photos,
  be.specifications,
  be.total_usage_hours,
  be.total_races_used,
  sed.sailmaker,
  sed.sail_number,
  sed.design_name,
  sed.material,
  sed.construction_type,
  sed.area_sqm,
  sed.optimal_wind_range_min,
  sed.optimal_wind_range_max,
  sed.estimated_race_hours,
  sed.estimated_race_hours_remaining,
  sed.primary_use,
  latest_inspection.id AS last_inspection_id,
  latest_inspection.overall_condition_score AS last_inspection_score,
  latest_inspection.inspection_date AS last_inspection_date,
  latest_inspection.race_ready AS last_inspection_race_ready,
  latest_inspection.ai_recommendations,
  latest_inspection.issues_detected,
  CASE
    WHEN latest_inspection.overall_condition_score >= 80 THEN 'good'
    WHEN latest_inspection.overall_condition_score >= 60 THEN 'fair'
    WHEN latest_inspection.overall_condition_score >= 40 THEN 'poor'
    WHEN latest_inspection.overall_condition_score IS NOT NULL THEN 'critical'
    ELSE 'unknown'
  END AS condition_status,
  CASE
    WHEN latest_inspection.inspection_date < NOW() - INTERVAL '30 days' THEN true
    ELSE false
  END AS inspection_overdue
FROM boat_equipment be
LEFT JOIN sail_equipment_details sed ON be.id = sed.equipment_id
LEFT JOIN LATERAL (
  SELECT * FROM sail_inspections si
  WHERE si.equipment_id = be.id
  ORDER BY si.inspection_date DESC
  LIMIT 1
) latest_inspection ON true
WHERE be.category IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero', 'storm_jib', 'trysail');

-- =============================================================================
-- DONE: All SECURITY DEFINER functions now have SET search_path = public
--       View now uses security_invoker = true
-- =============================================================================
