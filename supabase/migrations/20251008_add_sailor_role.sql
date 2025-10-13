-- ============================================================================
-- SAILOR ROLE & SIMPLIFIED ONBOARDING
-- ============================================================================
-- Adds sailor_role field (owner/crew/both) to users table
-- Simplifies onboarding by removing next_race requirement

-- ============================================================================
-- ADD SAILOR ROLE TO USERS TABLE
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sailor_role TEXT
  CHECK (sailor_role IN ('owner', 'crew', 'both'));

-- ============================================================================
-- SIMPLIFY ONBOARDING COMPLETED LOGIC
-- ============================================================================
-- Onboarding is now complete when:
-- 1. User type is selected (sailor/coach/club)
-- 2. Sailor role is selected (owner/crew/both) - for sailors only
-- 3. At least one boat is added (optional - can skip)
--
-- REMOVED REQUIREMENTS:
-- - Next race data
-- - Racing calendar
-- - Crew confirmation

-- Update existing sailors to have a default role if null
UPDATE users
SET sailor_role = 'owner'
WHERE user_type = 'sailor'
  AND sailor_role IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN users.sailor_role IS 'Sailor role: owner (boat owner), crew (crew member), both (owner who also crews on other boats)';
