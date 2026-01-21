-- =============================================================================
-- Migration: Remove duplicate indexes
-- Date: 2026-01-21
-- Description: Removes redundant duplicate indexes identified by Supabase
--              Performance Advisor. Keeps the shorter-named index in each pair.
-- =============================================================================

-- club_ai_documents: Remove duplicates (keep club_documents_club_idx, club_documents_type_idx)
DROP INDEX IF EXISTS idx_club_documents_club;
DROP INDEX IF EXISTS idx_club_documents_type;

-- fleet_followers: Remove duplicate (keep idx_fleet_followers_follower)
DROP INDEX IF EXISTS idx_fleet_followers_follower_id;

-- fleet_members: Remove duplicate (keep idx_fleet_members_user)
DROP INDEX IF EXISTS idx_fleet_members_user_id;

-- race_strategies: Remove duplicates (keep idx_race_strategies_regatta, idx_race_strategies_user)
DROP INDEX IF EXISTS idx_race_strategies_regatta_id;
DROP INDEX IF EXISTS idx_race_strategies_user_id;

-- sailor_race_preparation: Remove duplicate unique constraint (keep the PK-based one)
-- Note: unique_sailor_race is a CONSTRAINT, not just an index
ALTER TABLE public.sailor_race_preparation DROP CONSTRAINT IF EXISTS unique_sailor_race;

-- =============================================================================
-- NOTE: The following warnings are INFORMATIONAL and don't require action:
-- - multiple_permissive_policies (495): Normal with complex RLS setups
-- - auth_rls_initplan (465): Expected when using auth.uid() in policies
-- - unused_index (296): Many are for AI features not yet fully used
-- - unindexed_foreign_keys (92): Add indexes only if slow queries observed
-- =============================================================================
