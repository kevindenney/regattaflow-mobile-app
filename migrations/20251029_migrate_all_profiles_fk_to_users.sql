-- ============================================
-- Migration: Migrate all profiles FK constraints to users
-- Date: 2025-10-29
-- ============================================
--
-- Issue: Multiple tables reference legacy profiles table instead of users
-- This causes 409 errors when creating records because users are in the users table,
-- but foreign keys point to the empty/legacy profiles table.
--
-- Run this migration in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- Or via Supabase CLI:
-- supabase db push migrations/20251029_migrate_all_profiles_fk_to_users.sql
--
-- ============================================

-- ============================================
-- STEP 1: Drop all old FK constraints
-- ============================================

-- regattas.created_by
ALTER TABLE public.regattas
  DROP CONSTRAINT IF EXISTS regattas_created_by_fkey;

-- race_participants.user_id
ALTER TABLE public.race_participants
  DROP CONSTRAINT IF EXISTS race_participants_user_id_fkey;

-- race_documents.user_id
ALTER TABLE public.race_documents
  DROP CONSTRAINT IF EXISTS race_documents_user_id_fkey;

-- ai_analyses.user_id
ALTER TABLE public.ai_analyses
  DROP CONSTRAINT IF EXISTS ai_analyses_user_id_fkey;

-- ai_usage_logs.user_id
ALTER TABLE public.ai_usage_logs
  DROP CONSTRAINT IF EXISTS ai_usage_logs_user_id_fkey;

-- subscriptions.user_id
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- weather_insights.user_id
ALTER TABLE public.weather_insights
  DROP CONSTRAINT IF EXISTS weather_insights_user_id_fkey;

-- ============================================
-- STEP 2: Create new FK constraints to users
-- ============================================

-- regattas.created_by -> users(id)
ALTER TABLE public.regattas
  ADD CONSTRAINT regattas_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- race_participants.user_id -> users(id)
ALTER TABLE public.race_participants
  ADD CONSTRAINT race_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- race_documents.user_id -> users(id)
ALTER TABLE public.race_documents
  ADD CONSTRAINT race_documents_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- ai_analyses.user_id -> users(id)
ALTER TABLE public.ai_analyses
  ADD CONSTRAINT ai_analyses_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- ai_usage_logs.user_id -> users(id)
ALTER TABLE public.ai_usage_logs
  ADD CONSTRAINT ai_usage_logs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- subscriptions.user_id -> users(id)
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- weather_insights.user_id -> users(id)
ALTER TABLE public.weather_insights
  ADD CONSTRAINT weather_insights_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_regattas_created_by ON public.regattas(created_by);
CREATE INDEX IF NOT EXISTS idx_race_participants_user ON public.race_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_race_documents_user ON public.race_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user ON public.ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_insights_user ON public.weather_insights(user_id);

-- ============================================
-- STEP 4: Add comments for documentation
-- ============================================

COMMENT ON CONSTRAINT regattas_created_by_fkey ON public.regattas IS
  'References users table (migrated from profiles on 2025-10-29)';

COMMENT ON CONSTRAINT race_participants_user_id_fkey ON public.race_participants IS
  'References users table (migrated from profiles on 2025-10-29)';

COMMENT ON CONSTRAINT race_documents_user_id_fkey ON public.race_documents IS
  'References users table (migrated from profiles on 2025-10-29)';

COMMENT ON CONSTRAINT ai_analyses_user_id_fkey ON public.ai_analyses IS
  'References users table (migrated from profiles on 2025-10-29)';

COMMENT ON CONSTRAINT ai_usage_logs_user_id_fkey ON public.ai_usage_logs IS
  'References users table (migrated from profiles on 2025-10-29)';

COMMENT ON CONSTRAINT subscriptions_user_id_fkey ON public.subscriptions IS
  'References users table (migrated from profiles on 2025-10-29)';

COMMENT ON CONSTRAINT weather_insights_user_id_fkey ON public.weather_insights IS
  'References users table (migrated from profiles on 2025-10-29)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after the migration to verify success:
--
-- 1. Check all FK constraints now point to users:
-- SELECT
--   r.relname AS table_name,
--   c.conname AS constraint_name,
--   pg_get_constraintdef(c.oid) AS definition
-- FROM pg_constraint c
-- JOIN pg_class r ON c.conrelid = r.oid
-- WHERE c.conname IN (
--   'regattas_created_by_fkey',
--   'race_participants_user_id_fkey',
--   'race_documents_user_id_fkey',
--   'ai_analyses_user_id_fkey',
--   'ai_usage_logs_user_id_fkey',
--   'subscriptions_user_id_fkey',
--   'weather_insights_user_id_fkey'
-- )
-- ORDER BY r.relname;
--
-- 2. Test race creation (should work now!)
