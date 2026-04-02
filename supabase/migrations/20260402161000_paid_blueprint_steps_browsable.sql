-- Allow anyone to read blueprint_steps for published paid blueprints.
-- This lets potential buyers see what steps are included before purchasing.

CREATE POLICY "blueprint_steps_paid_read"
  ON blueprint_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM timeline_blueprints b
      WHERE b.id = blueprint_steps.blueprint_id
        AND b.is_published = true
        AND b.access_level = 'paid'
    )
  );

-- Update timeline_steps policy to allow viewing steps that belong to
-- published paid blueprints (so buyers can preview step titles/descriptions).
-- Previously this required org membership for paid blueprints.

DROP POLICY IF EXISTS "Blueprint viewers can see author steps" ON timeline_steps;

CREATE POLICY "Blueprint viewers can see author steps"
  ON timeline_steps
  FOR SELECT
  USING (
    visibility <> 'private'
    AND EXISTS (
      SELECT 1 FROM timeline_blueprints bp
      WHERE bp.user_id = timeline_steps.user_id
        AND bp.interest_id = timeline_steps.interest_id
        AND bp.is_published = true
        AND (
          bp.access_level = 'public'
          OR bp.access_level = 'paid'
          OR (bp.access_level = 'org_members' AND is_org_active_member(bp.organization_id))
        )
    )
  );
