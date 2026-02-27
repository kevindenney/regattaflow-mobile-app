-- Simplify club roles to a canonical three-level model:
--   admin, race_admin, volunteer_results
-- Keep member/guest unchanged.
--
-- This migration:
-- 1) Backfills existing club_members.role values to canonical values
-- 2) Refreshes role check constraints on club_members to include canonical + legacy aliases
-- 3) Updates AI activity policies so race_admin retains operational access

BEGIN;

-- 1) Backfill role values in club_members
UPDATE public.club_members
SET role = CASE role
  WHEN 'owner' THEN 'admin'
  WHEN 'race_officer' THEN 'race_admin'
  WHEN 'sailing_manager' THEN 'race_admin'
  WHEN 'communications' THEN 'race_admin'
  WHEN 'treasurer' THEN 'race_admin'
  WHEN 'membership_manager' THEN 'race_admin'
  WHEN 'secretary' THEN 'race_admin'
  WHEN 'scorer' THEN 'volunteer_results'
  WHEN 'race_committee' THEN 'volunteer_results'
  WHEN 'instructor' THEN 'member'
  ELSE role
END
WHERE role IN (
  'owner',
  'race_officer',
  'sailing_manager',
  'communications',
  'treasurer',
  'membership_manager',
  'secretary',
  'scorer',
  'race_committee',
  'instructor'
);

-- 2) Refresh role check constraints on club_members.
-- Drop existing role-related CHECK constraints defensively, then add one explicit constraint.
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'club_members'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.club_members DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE public.club_members
  ADD CONSTRAINT club_members_role_check
  CHECK (
    role IN (
      -- canonical
      'admin',
      'race_admin',
      'volunteer_results',
      'member',
      'guest',
      -- legacy aliases allowed for compatibility with older services
      'owner',
      'race_officer',
      'scorer',
      'communications',
      'treasurer',
      'membership_manager',
      'sailing_manager',
      'race_committee',
      'instructor',
      'secretary'
    )
  );

-- 3) Update AI activity schema policies to accept canonical role names.
-- Keep policy names unchanged so downstream tooling remains stable.
DROP POLICY IF EXISTS ai_activity_logs_club_admin_select ON public.ai_activity_logs;
CREATE POLICY ai_activity_logs_club_admin_select
  ON public.ai_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_activity_logs.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_admin')
    )
  );

DROP POLICY IF EXISTS ai_generated_documents_club_admin_all ON public.ai_generated_documents;
CREATE POLICY ai_generated_documents_club_admin_all
  ON public.ai_generated_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_generated_documents.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_admin')
    )
  );

DROP POLICY IF EXISTS ai_notifications_club_admin_all ON public.ai_notifications;
CREATE POLICY ai_notifications_club_admin_all
  ON public.ai_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_notifications.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_admin')
    )
  );

DROP POLICY IF EXISTS ai_conversations_club_admin_select ON public.ai_conversations;
CREATE POLICY ai_conversations_club_admin_select
  ON public.ai_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_conversations.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_admin')
    )
  );

DROP POLICY IF EXISTS ai_usage_monthly_club_admin_select ON public.ai_usage_monthly;
CREATE POLICY ai_usage_monthly_club_admin_select
  ON public.ai_usage_monthly
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = ai_usage_monthly.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_admin')
    )
  );

COMMIT;
