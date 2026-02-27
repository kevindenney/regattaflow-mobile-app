-- ============================================================================
-- Fix: Cross-table infinite recursion in competency RLS policies
-- ============================================================================
-- The original faculty/preceptor policies created a 3-table recursion cycle:
--   progress → attempts → reviews → progress
-- Postgres detects this at plan time and raises "infinite recursion detected".
--
-- Fix: Drop all cross-referencing faculty/preceptor policies. The _own_*
-- policies (user_id = auth.uid()) handle student access. The simple
-- preceptor_id = auth.uid() policies on attempts handle preceptor access.
-- Faculty/reviewer multi-table policies will be re-added with proper
-- role-based checks when those features are implemented.
-- ============================================================================

-- 1. Drop recursive policies on betterat_competency_progress
DROP POLICY IF EXISTS "progress_faculty_read" ON betterat_competency_progress;
DROP POLICY IF EXISTS "progress_faculty_update" ON betterat_competency_progress;
DROP POLICY IF EXISTS "progress_preceptor_read" ON betterat_competency_progress;
DROP POLICY IF EXISTS "progress_preceptor_update" ON betterat_competency_progress;

-- 2. Drop faculty policy on attempts that queries reviews
DROP POLICY IF EXISTS "attempts_faculty_read" ON betterat_competency_attempts;

-- 3. Drop reviews policy that queries back to progress
DROP POLICY IF EXISTS "reviews_faculty_read" ON betterat_competency_reviews;

-- Remaining safe policies (no cross-table references):
--   progress: progress_own_read, progress_own_insert, progress_own_update
--   attempts: attempts_own_read, attempts_own_insert, attempts_preceptor_read, attempts_preceptor_update
--   reviews:  reviews_faculty_insert
