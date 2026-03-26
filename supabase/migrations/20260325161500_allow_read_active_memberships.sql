-- Allow any authenticated user to read active organization memberships.
-- This enables profile pages to display a user's org affiliations to visitors,
-- which is standard social-platform behavior.
CREATE POLICY "org_memberships_read_active_public"
  ON organization_memberships
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(membership_status, status) = 'active'
  );
