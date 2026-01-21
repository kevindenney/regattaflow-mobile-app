-- =============================================================================
-- Migration: Fix remaining non-SECURITY DEFINER functions with mutable search_path
-- Date: 2026-01-21
-- Description: Adds SET search_path = public to all remaining functions flagged
--              by Supabase Security Advisor. These are trigger/utility functions.
-- =============================================================================

-- Trigger functions for auto-adding members
ALTER FUNCTION public.add_creator_as_member() SET search_path = public;
ALTER FUNCTION public.add_practice_creator_as_member() SET search_path = public;

-- Team-related functions
ALTER FUNCTION public.create_team_checklist() SET search_path = public;
ALTER FUNCTION public.generate_invite_code() SET search_path = public;

-- Geo-search function (double precision version)
ALTER FUNCTION public.find_nearby_racing_areas(double precision, double precision, double precision) SET search_path = public;

-- Event date helper
ALTER FUNCTION public.set_event_date_from_start_time() SET search_path = public;

-- Updated_at trigger functions
ALTER FUNCTION public.update_coach_annotation_timestamp() SET search_path = public;
ALTER FUNCTION public.update_drill_crew_tasks_updated_at() SET search_path = public;
ALTER FUNCTION public.update_equipment_issues_updated_at() SET search_path = public;
ALTER FUNCTION public.update_practice_intentions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_practice_session_updated_at() SET search_path = public;
ALTER FUNCTION public.update_practice_skill_progress() SET search_path = public;
ALTER FUNCTION public.update_practice_templates_updated_at() SET search_path = public;
ALTER FUNCTION public.update_race_source_documents_updated_at() SET search_path = public;
ALTER FUNCTION public.update_regatta_races_updated_at() SET search_path = public;
ALTER FUNCTION public.update_sail_equipment_details_updated_at() SET search_path = public;
ALTER FUNCTION public.update_sailor_crew_preferences_updated_at() SET search_path = public;
ALTER FUNCTION public.update_team_entry_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_user_capabilities_updated_at() SET search_path = public;
ALTER FUNCTION public.update_user_club_documents_updated_at() SET search_path = public;

-- =============================================================================
-- NOTE: The 3 RLS policy warnings for `strategy_entries` are INTENTIONAL.
-- That table uses permissive policies by design for shared strategy editing.
-- =============================================================================
