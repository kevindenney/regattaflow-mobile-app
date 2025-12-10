-- =============================================================================
-- COMPREHENSIVE SECURITY FIXES - RegattaFlowWebsite
-- Generated: 2025-12-10
-- Project ID: qavekrwdbsobecwrfxwu
-- 
-- This migration fixes all issues from Supabase Security Advisor:
-- - 23 tables with RLS disabled
-- - 8 security definer views (1 missing from previous fix)
-- - 14 tables with RLS enabled but no policies
-- - Critical function search path issues
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES WITHOUT IT (23 tables)
-- =============================================================================

-- Sailor-related tables
ALTER TABLE IF EXISTS public.sailor_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.boat_crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sailor_racing_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sailor_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sailor_classes ENABLE ROW LEVEL SECURITY;

-- Racing tables
ALTER TABLE IF EXISTS public.racing_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.strategy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rig_settings_history ENABLE ROW LEVEL SECURITY;

-- Club/Organization tables
ALTER TABLE IF EXISTS public.yacht_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_class_fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coach_specializations ENABLE ROW LEVEL SECURITY;

-- Coaching tables
ALTER TABLE IF EXISTS public.session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coaching_clients ENABLE ROW LEVEL SECURITY;

-- Maintenance tables
ALTER TABLE IF EXISTS public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Multi-domain tables (drawing/nursing - seems like test data from another project)
ALTER TABLE IF EXISTS public.drawing_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drawing_affiliation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drawing_affiliation_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nursing_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nursing_affiliation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nursing_affiliation_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinical_sessions ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 2: CREATE POLICIES FOR NEWLY RLS-ENABLED TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 sailor_coaches - Users can manage their own coach relationships
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their coach relationships" ON public.sailor_coaches;
CREATE POLICY "Users can view their coach relationships"
  ON public.sailor_coaches
  FOR SELECT
  TO authenticated
  USING (sailor_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their coach relationships" ON public.sailor_coaches;
CREATE POLICY "Users can manage their coach relationships"
  ON public.sailor_coaches
  FOR ALL
  TO authenticated
  USING (sailor_id = auth.uid())
  WITH CHECK (sailor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.2 boat_crew_members - Boat owners can manage crew
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Boat owners can view crew members" ON public.boat_crew_members;
CREATE POLICY "Boat owners can view crew members"
  ON public.boat_crew_members
  FOR SELECT
  TO authenticated
  USING (
    sailor_id = auth.uid()
    OR boat_id IN (SELECT id FROM public.sailor_boats WHERE sailor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Boat owners can manage crew members" ON public.boat_crew_members;
CREATE POLICY "Boat owners can manage crew members"
  ON public.boat_crew_members
  FOR ALL
  TO authenticated
  USING (sailor_id = auth.uid())
  WITH CHECK (sailor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.3 sailor_racing_participation - Users manage their participation
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their racing participation" ON public.sailor_racing_participation;
CREATE POLICY "Users can manage their racing participation"
  ON public.sailor_racing_participation
  FOR ALL
  TO authenticated
  USING (sailor_id = auth.uid())
  WITH CHECK (sailor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.4 sailor_connections - Users manage their connections
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their connections" ON public.sailor_connections;
CREATE POLICY "Users can view their connections"
  ON public.sailor_connections
  FOR SELECT
  TO authenticated
  USING (sailor_id = auth.uid() OR connected_sailor_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their connections" ON public.sailor_connections;
CREATE POLICY "Users can manage their connections"
  ON public.sailor_connections
  FOR ALL
  TO authenticated
  USING (sailor_id = auth.uid())
  WITH CHECK (sailor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.5 sailor_classes - Users manage their class memberships
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their class memberships" ON public.sailor_classes;
CREATE POLICY "Users can manage their class memberships"
  ON public.sailor_classes
  FOR ALL
  TO authenticated
  USING (sailor_id = auth.uid())
  WITH CHECK (sailor_id = auth.uid());

-- Authenticated users can view class memberships (for fleet discovery)
DROP POLICY IF EXISTS "Authenticated users can view class memberships" ON public.sailor_classes;
CREATE POLICY "Authenticated users can view class memberships"
  ON public.sailor_classes
  FOR SELECT
  TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 2.6 racing_series - Public read, creators manage
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view racing series" ON public.racing_series;
CREATE POLICY "Anyone can view racing series"
  ON public.racing_series
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage racing series" ON public.racing_series;
CREATE POLICY "Service role can manage racing series"
  ON public.racing_series
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2.7 strategy_entries - Domain-based access (generic pattern)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage strategy entries" ON public.strategy_entries;
CREATE POLICY "Authenticated users can manage strategy entries"
  ON public.strategy_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2.8 rig_settings_history - Users manage their own settings history
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their rig settings history" ON public.rig_settings_history;
CREATE POLICY "Users can manage their rig settings history"
  ON public.rig_settings_history
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.9 yacht_clubs - Public read (reference data)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view yacht clubs" ON public.yacht_clubs;
CREATE POLICY "Anyone can view yacht clubs"
  ON public.yacht_clubs
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Service role can manage yacht clubs" ON public.yacht_clubs;
CREATE POLICY "Service role can manage yacht clubs"
  ON public.yacht_clubs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2.10 club_class_fleets - Club admins manage, public read
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view club class fleets" ON public.club_class_fleets;
CREATE POLICY "Anyone can view club class fleets"
  ON public.club_class_fleets
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Club users can manage their fleets" ON public.club_class_fleets;
CREATE POLICY "Club users can manage their fleets"
  ON public.club_class_fleets
  FOR ALL
  TO authenticated
  USING (club_id = auth.uid())
  WITH CHECK (club_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.11 class_groups - Public read (reference data)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view class groups" ON public.class_groups;
CREATE POLICY "Anyone can view class groups"
  ON public.class_groups
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage class groups" ON public.class_groups;
CREATE POLICY "Service role can manage class groups"
  ON public.class_groups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2.12 class_group_members - Public read (reference data)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view class group members" ON public.class_group_members;
CREATE POLICY "Anyone can view class group members"
  ON public.class_group_members
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage class group members" ON public.class_group_members;
CREATE POLICY "Service role can manage class group members"
  ON public.class_group_members
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2.13 coach_specializations - Coaches manage their own
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view coach specializations" ON public.coach_specializations;
CREATE POLICY "Anyone can view coach specializations"
  ON public.coach_specializations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Coaches can manage their specializations" ON public.coach_specializations;
CREATE POLICY "Coaches can manage their specializations"
  ON public.coach_specializations
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.14 session_feedback - Session participants can manage
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view public feedback" ON public.session_feedback;
CREATE POLICY "Users can view public feedback"
  ON public.session_feedback
  FOR SELECT
  TO authenticated
  USING (public = true);

DROP POLICY IF EXISTS "Session participants can manage feedback" ON public.session_feedback;
CREATE POLICY "Session participants can manage feedback"
  ON public.session_feedback
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.coaching_sessions 
      WHERE sailor_id = auth.uid() OR student_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.coaching_sessions 
      WHERE sailor_id = auth.uid() OR student_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 2.15 coaching_clients - Coaches and clients can view their relationships
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Coaches can view their clients" ON public.coaching_clients;
CREATE POLICY "Coaches can view their clients"
  ON public.coaching_clients
  FOR SELECT
  TO authenticated
  USING (
    sailor_id = auth.uid()
    OR coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Coaches can manage their clients" ON public.coaching_clients;
CREATE POLICY "Coaches can manage their clients"
  ON public.coaching_clients
  FOR ALL
  TO authenticated
  USING (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()))
  WITH CHECK (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 2.16 maintenance_records - Boat owners manage their records
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Boat owners can manage maintenance records" ON public.maintenance_records;
CREATE POLICY "Boat owners can manage maintenance records"
  ON public.maintenance_records
  FOR ALL
  TO authenticated
  USING (sailor_id = auth.uid())
  WITH CHECK (sailor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2.17-2.23 Multi-domain tables (drawing/nursing) - Authenticated access
-- These appear to be from another project domain, applying basic auth policies
-- -----------------------------------------------------------------------------

-- Drawing affiliations
DROP POLICY IF EXISTS "Authenticated users can view drawing affiliations" ON public.drawing_affiliations;
CREATE POLICY "Authenticated users can view drawing affiliations"
  ON public.drawing_affiliations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages drawing affiliations" ON public.drawing_affiliations;
CREATE POLICY "Service role manages drawing affiliations"
  ON public.drawing_affiliations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drawing affiliation assignments
DROP POLICY IF EXISTS "Users can view their drawing assignments" ON public.drawing_affiliation_assignments;
CREATE POLICY "Users can view their drawing assignments"
  ON public.drawing_affiliation_assignments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their drawing assignments" ON public.drawing_affiliation_assignments;
CREATE POLICY "Users can manage their drawing assignments"
  ON public.drawing_affiliation_assignments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Drawing affiliation workshops
DROP POLICY IF EXISTS "Authenticated can view drawing workshops" ON public.drawing_affiliation_workshops;
CREATE POLICY "Authenticated can view drawing workshops"
  ON public.drawing_affiliation_workshops
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages drawing workshops" ON public.drawing_affiliation_workshops;
CREATE POLICY "Service role manages drawing workshops"
  ON public.drawing_affiliation_workshops
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Nursing affiliations
DROP POLICY IF EXISTS "Authenticated users can view nursing affiliations" ON public.nursing_affiliations;
CREATE POLICY "Authenticated users can view nursing affiliations"
  ON public.nursing_affiliations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages nursing affiliations" ON public.nursing_affiliations;
CREATE POLICY "Service role manages nursing affiliations"
  ON public.nursing_affiliations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Nursing affiliation assignments
DROP POLICY IF EXISTS "Users can view their nursing assignments" ON public.nursing_affiliation_assignments;
CREATE POLICY "Users can view their nursing assignments"
  ON public.nursing_affiliation_assignments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their nursing assignments" ON public.nursing_affiliation_assignments;
CREATE POLICY "Users can manage their nursing assignments"
  ON public.nursing_affiliation_assignments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Nursing affiliation rotations
DROP POLICY IF EXISTS "Authenticated can view nursing rotations" ON public.nursing_affiliation_rotations;
CREATE POLICY "Authenticated can view nursing rotations"
  ON public.nursing_affiliation_rotations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages nursing rotations" ON public.nursing_affiliation_rotations;
CREATE POLICY "Service role manages nursing rotations"
  ON public.nursing_affiliation_rotations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clinical sessions
DROP POLICY IF EXISTS "Authenticated can view clinical sessions" ON public.clinical_sessions;
CREATE POLICY "Authenticated can view clinical sessions"
  ON public.clinical_sessions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages clinical sessions" ON public.clinical_sessions;
CREATE POLICY "Service role manages clinical sessions"
  ON public.clinical_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================================================
-- SECTION 3: ADD POLICIES TO TABLES WITH RLS ENABLED BUT NO POLICIES (14 tables)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 coach_availability - Coaches manage, public can view active coaches
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Coaches can manage their availability" ON public.coach_availability;
CREATE POLICY "Coaches can manage their availability"
  ON public.coach_availability
  FOR ALL
  TO authenticated
  USING (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()))
  WITH CHECK (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active coach availability" ON public.coach_availability;
CREATE POLICY "Anyone can view active coach availability"
  ON public.coach_availability
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- -----------------------------------------------------------------------------
-- 3.2 coach_services - Coaches manage, public can view active services
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Coaches can manage their services" ON public.coach_services;
CREATE POLICY "Coaches can manage their services"
  ON public.coach_services
  FOR ALL
  TO authenticated
  USING (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()))
  WITH CHECK (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active coach services" ON public.coach_services;
CREATE POLICY "Anyone can view active coach services"
  ON public.coach_services
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- -----------------------------------------------------------------------------
-- 3.3 coaching_sessions - Participants can view/manage their sessions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Session participants can view their sessions" ON public.coaching_sessions;
CREATE POLICY "Session participants can view their sessions"
  ON public.coaching_sessions
  FOR SELECT
  TO authenticated
  USING (
    sailor_id = auth.uid() 
    OR student_id = auth.uid()
    OR coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Coaches can manage sessions" ON public.coaching_sessions;
CREATE POLICY "Coaches can manage sessions"
  ON public.coaching_sessions
  FOR ALL
  TO authenticated
  USING (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()))
  WITH CHECK (coach_id IN (SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 3.4 external_race_results - Public reference data
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view external race results" ON public.external_race_results;
CREATE POLICY "Anyone can view external race results"
  ON public.external_race_results
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages external race results" ON public.external_race_results;
CREATE POLICY "Service role manages external race results"
  ON public.external_race_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3.5 fleet_activity - Fleet members can view, actors can manage
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Fleet members can view activity" ON public.fleet_activity;
CREATE POLICY "Fleet members can view activity"
  ON public.fleet_activity
  FOR SELECT
  TO authenticated
  USING (
    fleet_id IN (
      SELECT fleet_id FROM public.fleet_members WHERE user_id = auth.uid()
    )
    OR visibility = 'public'
  );

DROP POLICY IF EXISTS "Users can create fleet activity" ON public.fleet_activity;
CREATE POLICY "Users can create fleet activity"
  ON public.fleet_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3.6 global_racing_events - Public reference data
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view global racing events" ON public.global_racing_events;
CREATE POLICY "Anyone can view global racing events"
  ON public.global_racing_events
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages global racing events" ON public.global_racing_events;
CREATE POLICY "Service role manages global racing events"
  ON public.global_racing_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3.7 race_registrations - Sailors manage their own, organizers can view all
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Sailors can manage their registrations" ON public.race_registrations;
CREATE POLICY "Sailors can manage their registrations"
  ON public.race_registrations
  FOR ALL
  TO authenticated
  USING (sailor_id = auth.uid())
  WITH CHECK (sailor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3.8 regatta_results - Participants can view their results, public can view published
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants can view their results" ON public.regatta_results;
CREATE POLICY "Participants can view their results"
  ON public.regatta_results
  FOR SELECT
  TO authenticated
  USING (
    sailor_id = auth.uid()
    OR regatta_id IN (SELECT id FROM public.regattas WHERE created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Race creators can manage results" ON public.regatta_results;
CREATE POLICY "Race creators can manage results"
  ON public.regatta_results
  FOR ALL
  TO authenticated
  USING (regatta_id IN (SELECT id FROM public.regattas WHERE created_by = auth.uid()))
  WITH CHECK (regatta_id IN (SELECT id FROM public.regattas WHERE created_by = auth.uid()));

-- -----------------------------------------------------------------------------
-- 3.9 sailing_specialties - Public reference data
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view sailing specialties" ON public.sailing_specialties;
CREATE POLICY "Anyone can view sailing specialties"
  ON public.sailing_specialties
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages sailing specialties" ON public.sailing_specialties;
CREATE POLICY "Service role manages sailing specialties"
  ON public.sailing_specialties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3.10 sensor_configurations - Users manage their own sensors
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their sensor configurations" ON public.sensor_configurations;
CREATE POLICY "Users can manage their sensor configurations"
  ON public.sensor_configurations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3.11 sensor_data_logs - Users can access their own data
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their sensor data" ON public.sensor_data_logs;
CREATE POLICY "Users can manage their sensor data"
  ON public.sensor_data_logs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3.12 session_reviews - Public reviews visible, reviewers manage their own
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view public reviews" ON public.session_reviews;
CREATE POLICY "Anyone can view public reviews"
  ON public.session_reviews
  FOR SELECT
  TO authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "Reviewers can manage their reviews" ON public.session_reviews;
CREATE POLICY "Reviewers can manage their reviews"
  ON public.session_reviews
  FOR ALL
  TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3.13 user_venue_profiles - Users manage their own profiles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their venue profiles" ON public.user_venue_profiles;
CREATE POLICY "Users can manage their venue profiles"
  ON public.user_venue_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3.14 venue_transitions - Users can view/manage their own transitions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their venue transitions" ON public.venue_transitions;
CREATE POLICY "Users can manage their venue transitions"
  ON public.venue_transitions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- =============================================================================
-- SECTION 4: FIX SECURITY DEFINER VIEW (saved_venues_with_details)
-- =============================================================================

DROP VIEW IF EXISTS public.saved_venues_with_details;
CREATE VIEW public.saved_venues_with_details 
WITH (security_invoker = true) AS
SELECT COALESCE(sv.id, s.venue_id) AS id,
    s.user_id,
    COALESCE(sv.name, s.location_name, 'Unknown Venue'::text) AS name,
    COALESCE(sv.country, 'Unknown'::text) AS country,
    COALESCE(sv.region, s.location_region, 'Unknown'::text) AS region,
    sv.coordinates_lat,
    sv.coordinates_lng,
    s.id AS saved_venue_id,
    s.service_type,
    s.location_name,
    s.location_region,
    s.notes,
    s.is_home_venue,
    s.created_at AS saved_at,
    sv.venue_type,
    sv.time_zone
FROM (saved_venues s
    LEFT JOIN sailing_venues sv ON ((sv.id = s.venue_id)));

-- Grant permissions on the view
GRANT SELECT ON public.saved_venues_with_details TO authenticated;


-- =============================================================================
-- SECTION 5: FIX CRITICAL FUNCTION SEARCH PATHS (Most commonly used functions)
-- =============================================================================
-- Setting search_path to prevent search path injection attacks

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix ensure_one_primary_boat function
CREATE OR REPLACE FUNCTION public.ensure_one_primary_boat()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.sailor_boats 
    SET is_primary = false 
    WHERE sailor_id = NEW.sailor_id 
    AND id != NEW.id 
    AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix generate_crew_invite_token function
CREATE OR REPLACE FUNCTION public.generate_crew_invite_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.invite_token IS NULL THEN
    NEW.invite_token = encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

-- Fix log_ai_usage function
CREATE OR REPLACE FUNCTION public.log_ai_usage(
  p_user_id uuid,
  p_function_name text,
  p_request_data jsonb DEFAULT '{}'::jsonb,
  p_response_data jsonb DEFAULT '{}'::jsonb,
  p_tokens_used integer DEFAULT 0,
  p_processing_time_ms integer DEFAULT 0,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.ai_usage_logs (
    user_id,
    function_name,
    request_data,
    response_data,
    tokens_used,
    processing_time_ms,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_function_name,
    p_request_data,
    p_response_data,
    p_tokens_used,
    p_processing_time_ms,
    p_success,
    p_error_message
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;


-- =============================================================================
-- VERIFICATION QUERIES (Run these after applying to confirm fixes)
-- =============================================================================
-- 
-- Check tables with RLS disabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND NOT rowsecurity;
--
-- Check tables with RLS but no policies:
-- SELECT t.tablename
-- FROM pg_tables t
-- LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
-- WHERE t.schemaname = 'public' AND t.rowsecurity = true
-- GROUP BY t.tablename
-- HAVING COUNT(p.policyname) = 0;
--
-- Check security definer views:
-- SELECT viewname FROM pg_views 
-- WHERE schemaname = 'public' 
-- AND NOT (definition LIKE '%security_invoker%');
--
-- =============================================================================

COMMIT;

