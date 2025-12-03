-- =============================================================================
-- SECURITY ADVISOR FIXES - RegattaFlowWebsite
-- Generated: 2025-12-03
-- Project ID: qavekrwdbsobecwrfxwu
-- =============================================================================
-- 
-- IMPORTANT: Review each section before applying!
-- Some tables may intentionally have permissive policies.
-- 
-- Run this migration after reviewing the Security Advisor warnings.
-- =============================================================================

-- =============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- =============================================================================
-- If RLS is not enabled, data is exposed to anyone with the anon key

-- User-related tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coach_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coach_specializations ENABLE ROW LEVEL SECURITY;

-- Sailor/Boat tables
ALTER TABLE IF EXISTS sailor_boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sailor_classes ENABLE ROW LEVEL SECURITY;

-- Race/Event tables
ALTER TABLE IF EXISTS regattas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS races ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS race_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS race_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS race_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS race_results ENABLE ROW LEVEL SECURITY;

-- Club event tables
ALTER TABLE IF EXISTS club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_class_fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_registrations ENABLE ROW LEVEL SECURITY;

-- Environmental/Processing tables
ALTER TABLE IF EXISTS environmental_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Scoring tables
ALTER TABLE IF EXISTS series_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scoring_configurations ENABLE ROW LEVEL SECURITY;

-- Reference tables (public read, admin write)
ALTER TABLE IF EXISTS boat_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sailing_venues ENABLE ROW LEVEL SECURITY;

-- Additional tables found in Security Advisor
ALTER TABLE IF EXISTS sailor_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coach_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS race_analytics_data ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 2: USER TABLE POLICIES
-- =============================================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (except auth fields)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert new users (for triggers)
DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);


-- =============================================================================
-- SECTION 3: CLUB PROFILE POLICIES
-- =============================================================================

-- Club owners can read their own profile
DROP POLICY IF EXISTS "Club owners read own profile" ON club_profiles;
CREATE POLICY "Club owners read own profile"
  ON club_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Verified clubs are publicly readable
DROP POLICY IF EXISTS "Verified clubs are public" ON club_profiles;
CREATE POLICY "Verified clubs are public"
  ON club_profiles
  FOR SELECT
  TO authenticated
  USING (
    verification_status = 'verified' 
    AND admin_review_status = 'approved'
  );

-- Club owners can update their profile
DROP POLICY IF EXISTS "Club owners update own profile" ON club_profiles;
CREATE POLICY "Club owners update own profile"
  ON club_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Club owners can insert their profile
DROP POLICY IF EXISTS "Club owners insert profile" ON club_profiles;
CREATE POLICY "Club owners insert profile"
  ON club_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- SECTION 4: CLUB SUBSCRIPTIONS POLICIES (SENSITIVE DATA)
-- =============================================================================

-- Only club owners can see their subscriptions
DROP POLICY IF EXISTS "Club owners read own subscriptions" ON club_subscriptions;
CREATE POLICY "Club owners read own subscriptions"
  ON club_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    club_profile_id IN (
      SELECT id FROM club_profiles WHERE user_id = auth.uid()
    )
  );

-- Service role for Stripe webhooks
DROP POLICY IF EXISTS "Service role manages subscriptions" ON club_subscriptions;
CREATE POLICY "Service role manages subscriptions"
  ON club_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================================================
-- SECTION 5: COACH PROFILE POLICIES
-- =============================================================================

-- Coaches can read their own profile
DROP POLICY IF EXISTS "Coaches read own profile" ON coach_profiles;
CREATE POLICY "Coaches read own profile"
  ON coach_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Published coach profiles are public
DROP POLICY IF EXISTS "Published coaches are public" ON coach_profiles;
CREATE POLICY "Published coaches are public"
  ON coach_profiles
  FOR SELECT
  TO authenticated
  USING (profile_published = true);

-- Coaches can update their profile
DROP POLICY IF EXISTS "Coaches update own profile" ON coach_profiles;
CREATE POLICY "Coaches update own profile"
  ON coach_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coaches can insert their profile
DROP POLICY IF EXISTS "Coaches insert profile" ON coach_profiles;
CREATE POLICY "Coaches insert profile"
  ON coach_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- SECTION 6: COACH AVAILABILITY POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Coaches manage own availability" ON coach_availability;
CREATE POLICY "Coaches manage own availability"
  ON coach_availability
  FOR ALL
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Published availability is readable
DROP POLICY IF EXISTS "Published availability is public" ON coach_availability;
CREATE POLICY "Published availability is public"
  ON coach_availability
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE profile_published = true
    )
  );


-- =============================================================================
-- SECTION 7: COACH SERVICES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Coaches manage own services" ON coach_services;
CREATE POLICY "Coaches manage own services"
  ON coach_services
  FOR ALL
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Published services are readable
DROP POLICY IF EXISTS "Published services are public" ON coach_services;
CREATE POLICY "Published services are public"
  ON coach_services
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE profile_published = true
    )
  );


-- =============================================================================
-- SECTION 8: SAILOR BOATS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Sailors read own boats" ON sailor_boats;
CREATE POLICY "Sailors read own boats"
  ON sailor_boats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Sailors insert own boats" ON sailor_boats;
CREATE POLICY "Sailors insert own boats"
  ON sailor_boats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Sailors update own boats" ON sailor_boats;
CREATE POLICY "Sailors update own boats"
  ON sailor_boats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Sailors delete own boats" ON sailor_boats;
CREATE POLICY "Sailors delete own boats"
  ON sailor_boats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sailor_id);


-- =============================================================================
-- SECTION 9: SAILOR CLASSES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Sailors manage own classes" ON sailor_classes;
CREATE POLICY "Sailors manage own classes"
  ON sailor_classes
  FOR ALL
  TO authenticated
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);


-- =============================================================================
-- SECTION 10: RACE EVENTS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users read own race events" ON race_events;
CREATE POLICY "Users read own race events"
  ON race_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own race events" ON race_events;
CREATE POLICY "Users insert own race events"
  ON race_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own race events" ON race_events;
CREATE POLICY "Users update own race events"
  ON race_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own race events" ON race_events;
CREATE POLICY "Users delete own race events"
  ON race_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 11: RACE MARKS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users manage marks for own races" ON race_marks;
CREATE POLICY "Users manage marks for own races"
  ON race_marks
  FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT id FROM race_events WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT id FROM race_events WHERE user_id = auth.uid()
    )
  );


-- =============================================================================
-- SECTION 12: REGATTAS POLICIES
-- =============================================================================
-- NOTE: regattas table uses created_by, not user_id

DROP POLICY IF EXISTS "Users read own regattas" ON regattas;
CREATE POLICY "Users read own regattas"
  ON regattas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users manage own regattas" ON regattas;
CREATE POLICY "Users manage own regattas"
  ON regattas
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);


-- =============================================================================
-- SECTION 13: RACES POLICIES (within regattas)
-- =============================================================================

DROP POLICY IF EXISTS "Users manage races in own regattas" ON races;
CREATE POLICY "Users manage races in own regattas"
  ON races
  FOR ALL
  TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  );


-- =============================================================================
-- SECTION 14: CLUB EVENTS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Club admins manage events" ON club_events;
CREATE POLICY "Club admins manage events"
  ON club_events
  FOR ALL
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM club_profiles WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  )
  WITH CHECK (
    club_id IN (
      SELECT id FROM club_profiles WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Public events are readable by all authenticated users
DROP POLICY IF EXISTS "Public events are readable" ON club_events;
CREATE POLICY "Public events are readable"
  ON club_events
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' 
    AND status IN ('published', 'registration_open', 'in_progress', 'completed')
  );


-- =============================================================================
-- SECTION 15: EVENT REGISTRATIONS POLICIES (SENSITIVE)
-- =============================================================================

-- Users can see their own registrations
DROP POLICY IF EXISTS "Users read own registrations" ON event_registrations;
CREATE POLICY "Users read own registrations"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create registrations for themselves
DROP POLICY IF EXISTS "Users create own registrations" ON event_registrations;
CREATE POLICY "Users create own registrations"
  ON event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their pending registrations
DROP POLICY IF EXISTS "Users update own pending registrations" ON event_registrations;
CREATE POLICY "Users update own pending registrations"
  ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'waitlist'))
  WITH CHECK (auth.uid() = user_id);

-- Club admins can manage registrations for their events
DROP POLICY IF EXISTS "Club admins manage event registrations" ON event_registrations;
CREATE POLICY "Club admins manage event registrations"
  ON event_registrations
  FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT ce.id FROM club_events ce
      JOIN club_profiles cp ON ce.club_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT ce.id FROM club_events ce
      JOIN club_profiles cp ON ce.club_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );


-- =============================================================================
-- SECTION 16: DOCUMENT PROCESSING JOBS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users manage own document jobs" ON document_processing_jobs;
CREATE POLICY "Users manage own document jobs"
  ON document_processing_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- SECTION 17: ENVIRONMENTAL FORECASTS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users read forecasts for own races" ON environmental_forecasts;
CREATE POLICY "Users read forecasts for own races"
  ON environmental_forecasts
  FOR SELECT
  TO authenticated
  USING (
    race_event_id IN (
      SELECT id FROM race_events WHERE user_id = auth.uid()
    )
  );

-- Service role for weather updates
DROP POLICY IF EXISTS "Service role manages forecasts" ON environmental_forecasts;
CREATE POLICY "Service role manages forecasts"
  ON environmental_forecasts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =============================================================================
-- SECTION 18: RACE RESULTS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users manage results for own regattas" ON race_results;
CREATE POLICY "Users manage results for own regattas"
  ON race_results
  FOR ALL
  TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  );

-- Published results are public
DROP POLICY IF EXISTS "Published results are public" ON race_results;
CREATE POLICY "Published results are public"
  ON race_results
  FOR SELECT
  TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE results_published = true
    )
  );


-- =============================================================================
-- SECTION 19: SERIES STANDINGS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users manage standings for own regattas" ON series_standings;
CREATE POLICY "Users manage standings for own regattas"
  ON series_standings
  FOR ALL
  TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  );


-- =============================================================================
-- SECTION 20: REFERENCE TABLES (PUBLIC READ)
-- =============================================================================

-- Boat Classes - Public read, admin write
DROP POLICY IF EXISTS "Anyone can read boat classes" ON boat_classes;
CREATE POLICY "Anyone can read boat classes"
  ON boat_classes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Sailing Venues - Public read, admin write  
DROP POLICY IF EXISTS "Anyone can read sailing venues" ON sailing_venues;
CREATE POLICY "Anyone can read sailing venues"
  ON sailing_venues
  FOR SELECT
  TO authenticated, anon
  USING (true);


-- =============================================================================
-- SECTION 21: RACE STRATEGIES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users manage own race strategies" ON race_strategies;
CREATE POLICY "Users manage own race strategies"
  ON race_strategies
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- SECTION 22: COACH SPECIALIZATIONS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Coaches manage own specializations" ON coach_specializations;
CREATE POLICY "Coaches manage own specializations"
  ON coach_specializations
  FOR ALL
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Published specializations are readable
DROP POLICY IF EXISTS "Published specializations are public" ON coach_specializations;
CREATE POLICY "Published specializations are public"
  ON coach_specializations
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE profile_published = true
    )
  );


-- =============================================================================
-- SECTION 23: CLUB CLASS FLEETS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Club admins manage fleets" ON club_class_fleets;
CREATE POLICY "Club admins manage fleets"
  ON club_class_fleets
  FOR ALL
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM club_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    club_id IN (
      SELECT id FROM club_profiles WHERE user_id = auth.uid()
    )
  );

-- Public clubs have readable fleets
DROP POLICY IF EXISTS "Verified club fleets are readable" ON club_class_fleets;
CREATE POLICY "Verified club fleets are readable"
  ON club_class_fleets
  FOR SELECT
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM club_profiles 
      WHERE verification_status = 'verified' 
      AND admin_review_status = 'approved'
    )
  );


-- =============================================================================
-- SECTION 24: SCORING CONFIGURATIONS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users manage scoring for own regattas" ON scoring_configurations;
CREATE POLICY "Users manage scoring for own regattas"
  ON scoring_configurations
  FOR ALL
  TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  );


-- =============================================================================
-- SECTION 25: SAILOR_COACHES TABLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can see their coach relationships" ON sailor_coaches;
CREATE POLICY "Users can see their coach relationships"
  ON sailor_coaches
  FOR SELECT
  TO authenticated
  USING (
    sailor_id = auth.uid() 
    OR coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Coaches can manage their sailor relationships" ON sailor_coaches;
CREATE POLICY "Coaches can manage their sailor relationships"
  ON sailor_coaches
  FOR ALL
  TO authenticated
  USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );


-- =============================================================================
-- SECTION 26: FIX SECURITY DEFINER VIEWS
-- =============================================================================
-- Views with SECURITY DEFINER bypass RLS. Convert to SECURITY INVOKER.
-- 
-- NOTE: You need to get the current view definitions and recreate them.
-- Run this query to get view definitions:
-- 
--   SELECT viewname, definition 
--   FROM pg_views 
--   WHERE schemaname = 'public' 
--   AND viewname IN ('weather_impact', 'me', 'coach_feedback_view', 
--                    'race_analytics', 'coach_sailor_sessions_view',
--                    'ai_insights_summary', 'coach_metrics_view');
--
-- Then recreate each view with SECURITY INVOKER:
--
-- Example fix pattern:
-- DROP VIEW IF EXISTS public.weather_impact;
-- CREATE VIEW public.weather_impact 
-- WITH (security_invoker = true) AS
-- <original_select_statement>;
--
-- IMPORTANT: Run the query above in Supabase SQL Editor to get exact definitions
-- before applying the fixes below.

-- Placeholder - replace with actual view definitions after inspection:

-- Fix weather_impact view
-- DROP VIEW IF EXISTS public.weather_impact;
-- CREATE VIEW public.weather_impact WITH (security_invoker = true) AS
-- SELECT ... (get definition from database);

-- Fix me view  
-- DROP VIEW IF EXISTS public.me;
-- CREATE VIEW public.me WITH (security_invoker = true) AS
-- SELECT ... (get definition from database);

-- Fix coach_feedback_view
-- DROP VIEW IF EXISTS public.coach_feedback_view;
-- CREATE VIEW public.coach_feedback_view WITH (security_invoker = true) AS
-- SELECT ... (get definition from database);

-- Fix race_analytics view
-- DROP VIEW IF EXISTS public.race_analytics;
-- CREATE VIEW public.race_analytics WITH (security_invoker = true) AS
-- SELECT ... (get definition from database);

-- Fix coach_sailor_sessions_view
-- DROP VIEW IF EXISTS public.coach_sailor_sessions_view;
-- CREATE VIEW public.coach_sailor_sessions_view WITH (security_invoker = true) AS
-- SELECT ... (get definition from database);

-- Fix ai_insights_summary view
-- DROP VIEW IF EXISTS public.ai_insights_summary;
-- CREATE VIEW public.ai_insights_summary WITH (security_invoker = true) AS
-- SELECT ... (get definition from database);

-- Fix coach_metrics_view
-- DROP VIEW IF EXISTS public.coach_metrics_view;
-- CREATE VIEW public.coach_metrics_view WITH (security_invoker = true) AS
-- SELECT ... (get definition from database);


-- =============================================================================
-- VERIFICATION QUERIES - Run these to check the results
-- =============================================================================

-- Check which tables have RLS enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- Check policies on each table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

