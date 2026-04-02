-- ============================================================================
-- user_interests: tracks which interests a user has explicitly added
-- ============================================================================
-- Users start with zero interests and must explicitly add ones they want
-- to get better at. This replaces the previous model where all public
-- interests were shown to every user.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, interest_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);

-- RLS
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Users can read their own interests
CREATE POLICY "user_interests_select_own_v1"
  ON public.user_interests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can add interests for themselves
CREATE POLICY "user_interests_insert_own_v1"
  ON public.user_interests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove their own interests
CREATE POLICY "user_interests_delete_own_v1"
  ON public.user_interests FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Faculty/admin can read org members' interests (for dashboards)
CREATE POLICY "user_interests_faculty_read_v1"
  ON public.user_interests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM organization_memberships om1
      JOIN organization_memberships om2 ON om2.organization_id = om1.organization_id
        AND om2.user_id = user_interests.user_id
        AND COALESCE(om2.membership_status, om2.status) = 'active'
      WHERE om1.user_id = auth.uid()
        AND COALESCE(om1.membership_status, om1.status) = 'active'
        AND om1.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );
