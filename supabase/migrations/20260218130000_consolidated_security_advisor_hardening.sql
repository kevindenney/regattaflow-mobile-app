-- Consolidated Security Advisor hardening migration.
-- Combines:
-- - 20260218113000_fix_security_advisor_views_and_user_profiles.sql
-- - 20260218121500_fix_search_path_and_permissive_rls.sql
-- - 20260218124000_strict_strategy_entries_rls.sql

-- -----------------------------------------------------------------------------
-- A) Views: remove exposed auth.users dependency and enforce security_invoker
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.user_profiles
WITH (security_invoker = true) AS
SELECT
  u.id,
  COALESCE(
    NULLIF(BTRIM(to_jsonb(u)->>'full_name'), ''),
    split_part(COALESCE(to_jsonb(u)->>'email', ''), '@', 1),
    'Sailor'
  ) AS full_name,
  to_jsonb(u)->>'avatar_url' AS avatar_url,
  (to_jsonb(u)->>'email')::character varying(255) AS email,
  (to_jsonb(u)->>'created_at')::timestamptz AS created_at
FROM public.users u;

REVOKE ALL ON public.user_profiles FROM anon;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;

COMMENT ON VIEW public.user_profiles IS
  'Public-safe user profile view sourced from public.users (not auth.users).';

CREATE OR REPLACE VIEW public.crew_threads_with_details
WITH (security_invoker = true) AS
SELECT
  ct.id,
  ct.name,
  ct.owner_id,
  ct.avatar_emoji,
  ct.thread_type,
  ct.created_at,
  ct.updated_at,
  ctm.user_id AS member_user_id,
  ctm.role,
  ctm.last_read_at,
  (
    SELECT COUNT(*)::int
    FROM public.crew_thread_messages msg
    WHERE msg.thread_id = ct.id
      AND msg.created_at > COALESCE(ctm.last_read_at, ct.created_at)
      AND msg.user_id != ctm.user_id
  ) AS unread_count,
  (
    SELECT msg.message
    FROM public.crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message,
  (
    SELECT msg.user_id
    FROM public.crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message_user_id,
  (
    SELECT msg.created_at
    FROM public.crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message_at
FROM public.crew_threads ct
JOIN public.crew_thread_members ctm ON ctm.thread_id = ct.id;

GRANT SELECT ON public.crew_threads_with_details TO authenticated;
GRANT SELECT ON public.crew_threads_with_details TO service_role;

CREATE OR REPLACE VIEW public.communities_with_stats
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.description,
  c.community_type,
  c.category_id,
  c.icon_url,
  c.banner_url,
  c.member_count,
  (
    SELECT COUNT(*)
    FROM public.venue_discussions vd
    WHERE vd.community_id = c.id
      AND vd.is_public = true
  )::integer AS post_count,
  c.created_by,
  c.is_official,
  c.is_verified,
  c.linked_entity_type,
  c.linked_entity_id,
  c.metadata,
  c.created_at,
  c.updated_at,
  c.last_activity_at,
  cat.display_name AS category_name,
  cat.icon AS category_icon,
  cat.color AS category_color,
  (
    SELECT COUNT(*)
    FROM public.venue_discussions vd
    WHERE vd.community_id = c.id
      AND vd.created_at > now() - interval '24 hours'
  ) AS posts_last_24h,
  (
    SELECT COUNT(DISTINCT cm.user_id)
    FROM public.community_memberships cm
    WHERE cm.community_id = c.id
      AND cm.joined_at > now() - interval '7 days'
  ) AS new_members_7d
FROM public.communities c
LEFT JOIN public.community_categories cat ON c.category_id = cat.id;

GRANT SELECT ON public.communities_with_stats TO authenticated;
GRANT SELECT ON public.communities_with_stats TO anon;
GRANT SELECT ON public.communities_with_stats TO service_role;

-- -----------------------------------------------------------------------------
-- B) Functions: fix mutable search_path warnings
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'update_crew_thread_updated_at',
        'search_global_clubs',
        'create_group_thread',
        'is_thread_member',
        'update_positioned_course_updated_at',
        'generate_race_collaborator_invite_code',
        'notify_on_activity_comment',
        'is_community_moderator',
        'get_class_experts',
        'is_community_member',
        'update_race_journals_updated_at',
        'update_documents_updated_at',
        'get_community_races',
        'generate_community_slug',
        'get_author_venue_stats',
        'update_follower_posts_updated_at',
        'get_venue_activity_stats',
        'update_community_post_count',
        'find_or_create_direct_thread',
        'generate_invite_code',
        'update_community_member_count',
        'accept_team_invite',
        'update_communities_updated_at',
        'update_discussion_vote_counts',
        'is_venue_moderator',
        'calculate_hot_score',
        'create_subscription_team_for_user',
        'update_discussion_comment_count',
        'handle_race_suggestion_updated_at',
        'generate_venue_slug',
        'update_global_clubs_updated_at',
        'is_venue_member',
        'update_subscription_team_timestamp',
        'update_sailor_goals_updated_at',
        'find_race_participants'
      ])
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public',
      rec.schema_name,
      rec.function_name,
      rec.args
    );
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- C) Tighten non-intentional permissive RLS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role can insert analysis" ON public.ai_coach_analysis;
CREATE POLICY "Service role can insert analysis"
  ON public.ai_coach_analysis
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can submit clubs" ON public.global_clubs;
CREATE POLICY "Authenticated users can submit clubs"
  ON public.global_clubs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service can create achievements" ON public.sailor_achievements;
CREATE POLICY "Service can create achievements"
  ON public.sailor_achievements
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service can manage sailor stats" ON public.sailor_stats;
CREATE POLICY "Service can manage sailor stats"
  ON public.sailor_stats
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service can create notifications" ON public.social_notifications;
CREATE POLICY "Service can create notifications"
  ON public.social_notifications
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- D) Strict strategy_entries write policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can insert strategy entries" ON public.strategy_entries;
DROP POLICY IF EXISTS "Authenticated users can update strategy entries" ON public.strategy_entries;
DROP POLICY IF EXISTS "Authenticated users can delete strategy entries" ON public.strategy_entries;

CREATE POLICY "Authenticated users can insert strategy entries"
  ON public.strategy_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND COALESCE(to_jsonb(strategy_entries)->>'domain', '') = 'race'
    AND EXISTS (
      SELECT 1
      FROM public.regattas r
      WHERE r.id::text = to_jsonb(strategy_entries)->>'entity_id'
        AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update strategy entries"
  ON public.strategy_entries
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND COALESCE(to_jsonb(strategy_entries)->>'domain', '') = 'race'
    AND EXISTS (
      SELECT 1
      FROM public.regattas r
      WHERE r.id::text = to_jsonb(strategy_entries)->>'entity_id'
        AND r.created_by = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND COALESCE(to_jsonb(strategy_entries)->>'domain', '') = 'race'
    AND EXISTS (
      SELECT 1
      FROM public.regattas r
      WHERE r.id::text = to_jsonb(strategy_entries)->>'entity_id'
        AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can delete strategy entries"
  ON public.strategy_entries
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND COALESCE(to_jsonb(strategy_entries)->>'domain', '') = 'race'
    AND EXISTS (
      SELECT 1
      FROM public.regattas r
      WHERE r.id::text = to_jsonb(strategy_entries)->>'entity_id'
        AND r.created_by = auth.uid()
    )
  );

