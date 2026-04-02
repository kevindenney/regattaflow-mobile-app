-- Make paid blueprints publicly browsable (metadata visible to everyone).
-- Previously, paid blueprints were only visible to org members or purchasers,
-- which prevented them from appearing in the catalog/interest pages.

DROP POLICY IF EXISTS "Published blueprints viewable with access check" ON timeline_blueprints;

CREATE POLICY "Published blueprints viewable with access check"
  ON timeline_blueprints
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_published = true
      AND (
        access_level = 'public'
        OR access_level = 'paid'
        OR (access_level = 'org_members' AND is_org_active_member(organization_id))
      )
    )
  );
