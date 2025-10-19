-- Row Level Security (RLS) Patterns for RegattaFlow
-- This file demonstrates the 4 standard RLS patterns used in RegattaFlow
-- Reference this when creating new tables or modifying security policies

-- ============================================================================
-- PATTERN 1: USER-OWNED DATA
-- ============================================================================
-- Use Case: Data that belongs exclusively to a user
-- Examples: sailor_boats, race_strategies, coach_profiles
-- Rule: Users can only access their own records

-- Example table: sailor_boats
ALTER TABLE sailor_boats ENABLE ROW LEVEL SECURITY;

-- Separate policies for each operation (RECOMMENDED)
CREATE POLICY "Sailors can view their own boats"
  ON sailor_boats FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Sailors can insert their own boats"
  ON sailor_boats FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update their own boats"
  ON sailor_boats FOR UPDATE
  USING (auth.uid() = sailor_id)  -- Can only update if they own it
  WITH CHECK (auth.uid() = sailor_id);  -- Can't transfer ownership

CREATE POLICY "Sailors can delete their own boats"
  ON sailor_boats FOR DELETE
  USING (auth.uid() = sailor_id);

-- Notes:
-- - USING clause: Controls which rows can be selected/updated/deleted
-- - WITH CHECK clause: Controls which rows can be inserted/updated
-- - auth.uid(): Returns the authenticated user's UUID
-- - Always use separate policies for SELECT/INSERT/UPDATE/DELETE

-- ============================================================================
-- PATTERN 2: PUBLIC READ, OWNER WRITE
-- ============================================================================
-- Use Case: Data that anyone can view but only owners can modify
-- Examples: boat_classes, sailing_venues, race_events (public regattas)
-- Rule: Everyone can SELECT, but only owner can INSERT/UPDATE/DELETE

-- Example table: boat_classes
ALTER TABLE boat_classes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view boat classes"
  ON boat_classes FOR SELECT
  USING (true);  -- true = everyone

-- Owner-only write access
CREATE POLICY "Authenticated users can add boat classes"
  ON boat_classes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their boat classes"
  ON boat_classes FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can delete their boat classes"
  ON boat_classes FOR DELETE
  USING (auth.uid() = created_by);

-- Notes:
-- - USING (true) allows access to all rows (public read)
-- - created_by column tracks who created the record
-- - Unauthenticated users can read but not write

-- ============================================================================
-- PATTERN 3: JUNCTION TABLE (Many-to-Many Relationships)
-- ============================================================================
-- Use Case: Linking tables that connect two entities
-- Examples: race_registrations (sailors + races), coaching_sessions (coaches + sailors)
-- Rule: Both linked parties can access the junction record

-- Example table: race_registrations
ALTER TABLE race_registrations ENABLE ROW LEVEL SECURITY;

-- Sailors can view their own registrations
CREATE POLICY "Sailors can view their registrations"
  ON race_registrations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM sailor_profiles WHERE id = race_registrations.sailor_id
    )
  );

-- Race organizers can view registrations for their races
CREATE POLICY "Race organizers can view registrations for their races"
  ON race_registrations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT organizer_id FROM races WHERE id = race_registrations.race_id
    )
  );

-- Sailors can register themselves for races
CREATE POLICY "Sailors can register for races"
  ON race_registrations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM sailor_profiles WHERE id = race_registrations.sailor_id
    )
  );

-- Sailors can withdraw from races (delete their registration)
CREATE POLICY "Sailors can withdraw from races"
  ON race_registrations FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM sailor_profiles WHERE id = race_registrations.sailor_id
    )
  );

-- Race organizers can remove registrations from their races
CREATE POLICY "Race organizers can remove registrations"
  ON race_registrations FOR DELETE
  USING (
    auth.uid() IN (
      SELECT organizer_id FROM races WHERE id = race_registrations.race_id
    )
  );

-- Notes:
-- - Subqueries used to check ownership on related tables
-- - Multiple SELECT policies combine with OR logic
-- - Multiple DELETE policies allow either party to remove the link
-- - Consider adding UPDATE policies if registration details can be modified

-- ============================================================================
-- PATTERN 4: NESTED OWNERSHIP
-- ============================================================================
-- Use Case: Child records inherit ownership from parent
-- Examples: race_marks (owned by races), race_results (owned by races)
-- Rule: Access to child is granted based on access to parent

-- Example table: race_marks (child of races)
ALTER TABLE race_marks ENABLE ROW LEVEL SECURITY;

-- Users can view marks if they can view the parent race
CREATE POLICY "Users can view marks for accessible races"
  ON race_marks FOR SELECT
  USING (
    race_id IN (
      SELECT id FROM races
      WHERE organizer_id = auth.uid()  -- Owner
         OR is_public = true  -- Public race
    )
  );

-- Only race organizers can manage marks
CREATE POLICY "Race organizers can add marks"
  ON race_marks FOR INSERT
  WITH CHECK (
    race_id IN (
      SELECT id FROM races WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Race organizers can update marks"
  ON race_marks FOR UPDATE
  USING (
    race_id IN (
      SELECT id FROM races WHERE organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT id FROM races WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Race organizers can delete marks"
  ON race_marks FOR DELETE
  USING (
    race_id IN (
      SELECT id FROM races WHERE organizer_id = auth.uid()
    )
  );

-- Notes:
-- - Child table queries the parent table to determine access
-- - Subquery efficiency is critical (ensure parent has proper indexes)
-- - Consider materialized views for complex ownership chains
-- - USING and WITH CHECK must both reference parent for UPDATE

-- ============================================================================
-- ADVANCED PATTERN: CONDITIONAL PUBLIC ACCESS
-- ============================================================================
-- Use Case: Data that can be public OR private based on a flag
-- Examples: race_strategies (can be shared), coach_profiles (can be listed)
-- Rule: Public if flag is true, owner-only if false

-- Example table: race_strategies
ALTER TABLE race_strategies ENABLE ROW LEVEL SECURITY;

-- Public strategies OR owner's strategies
CREATE POLICY "Users can view public strategies or their own"
  ON race_strategies FOR SELECT
  USING (
    is_public = true
    OR auth.uid() = sailor_id
  );

-- Only owners can create strategies
CREATE POLICY "Sailors can create their own strategies"
  ON race_strategies FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

-- Only owners can update strategies (including privacy setting)
CREATE POLICY "Sailors can update their own strategies"
  ON race_strategies FOR UPDATE
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

-- Only owners can delete strategies
CREATE POLICY "Sailors can delete their own strategies"
  ON race_strategies FOR DELETE
  USING (auth.uid() = sailor_id);

-- Notes:
-- - OR logic combines multiple access conditions
-- - is_public flag is controlled by the owner via UPDATE policy
-- - Public read does not grant write access

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- 1. INDEX FOREIGN KEYS used in RLS policies
-- Critical for subquery performance

CREATE INDEX IF NOT EXISTS idx_race_registrations_sailor_id
  ON race_registrations(sailor_id);

CREATE INDEX IF NOT EXISTS idx_race_registrations_race_id
  ON race_registrations(race_id);

CREATE INDEX IF NOT EXISTS idx_race_marks_race_id
  ON race_marks(race_id);

-- 2. INDEX BOOLEAN FLAGS used for public/private logic
CREATE INDEX IF NOT EXISTS idx_race_strategies_is_public
  ON race_strategies(is_public);

-- 3. COMPOSITE INDEXES for complex policies
CREATE INDEX IF NOT EXISTS idx_races_organizer_public
  ON races(organizer_id, is_public);

-- ============================================================================
-- TESTING RLS POLICIES
-- ============================================================================

-- 1. Test as authenticated user
-- Set user context (in Supabase, this happens automatically)
-- SELECT set_config('request.jwt.claims', '{"sub": "user-uuid-here"}', true);

-- 2. Verify policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'sailor_boats'
-- ORDER BY policyname;

-- 3. Test SELECT policy
-- SELECT * FROM sailor_boats;  -- Should only return current user's boats

-- 4. Test INSERT policy
-- INSERT INTO sailor_boats (sailor_id, boat_class_id, sail_number)
-- VALUES (auth.uid(), 'some-uuid', '12345');  -- Should succeed

-- 5. Test unauthorized INSERT
-- INSERT INTO sailor_boats (sailor_id, boat_class_id, sail_number)
-- VALUES ('different-user-uuid', 'some-uuid', '67890');  -- Should fail

-- 6. Test UPDATE policy
-- UPDATE sailor_boats
-- SET sail_number = '11111'
-- WHERE id = 'owned-boat-uuid';  -- Should succeed

-- 7. Test unauthorized UPDATE
-- UPDATE sailor_boats
-- SET sail_number = '22222'
-- WHERE id = 'other-users-boat-uuid';  -- Should fail (row not visible)

-- ============================================================================
-- COMMON RLS MISTAKES TO AVOID
-- ============================================================================

-- ❌ MISTAKE 1: Using ALL operation (too permissive)
-- CREATE POLICY "bad_policy" ON table FOR ALL USING (auth.uid() = user_id);
-- ✅ CORRECT: Use separate SELECT, INSERT, UPDATE, DELETE policies

-- ❌ MISTAKE 2: Forgetting WITH CHECK on INSERT
-- CREATE POLICY "bad_insert" ON table FOR INSERT USING (auth.uid() = user_id);
-- ✅ CORRECT: INSERT uses WITH CHECK, not USING

-- ❌ MISTAKE 3: Missing both USING and WITH CHECK on UPDATE
-- CREATE POLICY "bad_update" ON table FOR UPDATE USING (auth.uid() = user_id);
-- ✅ CORRECT: UPDATE needs both USING (can update) and WITH CHECK (valid result)

-- ❌ MISTAKE 4: Using UPDATE to transfer ownership without safeguards
-- CREATE POLICY "bad_transfer" ON table FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (true);  -- ⚠️ Allows changing user_id to anyone!
-- ✅ CORRECT: WITH CHECK should also verify auth.uid() = user_id

-- ❌ MISTAKE 5: Inefficient subqueries without indexes
-- CREATE POLICY "slow_policy" ON child_table FOR SELECT
--   USING (parent_id IN (SELECT id FROM parent WHERE user_id = auth.uid()));
-- ✅ CORRECT: Add index on parent_table(user_id) and child_table(parent_id)

-- ❌ MISTAKE 6: Not enabling RLS on tables
-- (Policies won't apply if RLS is not enabled)
-- ✅ CORRECT: Always ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY CHECKLIST
-- ============================================================================

-- [ ] RLS is enabled on all tables containing user data
-- [ ] Separate policies for SELECT, INSERT, UPDATE, DELETE
-- [ ] INSERT policies use WITH CHECK (not USING)
-- [ ] UPDATE policies have both USING and WITH CHECK
-- [ ] Subqueries in policies are indexed for performance
-- [ ] Policies prevent ownership transfer (unless intentional)
-- [ ] Service role bypasses RLS (use with caution in Edge Functions)
-- [ ] Public read policies use USING (true) explicitly
-- [ ] Junction tables have policies for both linked entities
-- [ ] Nested ownership chains have indexed foreign keys
