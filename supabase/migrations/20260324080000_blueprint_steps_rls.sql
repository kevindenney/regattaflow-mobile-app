-- Allow viewing non-private timeline steps that belong to a published blueprint's author+interest.
-- This enables the blueprint detail page to show the author's steps to any viewer
-- who can see the blueprint itself.
CREATE POLICY "Blueprint viewers can see author steps"
  ON public.timeline_steps
  FOR SELECT
  USING (
    visibility <> 'private'
    AND EXISTS (
      SELECT 1
      FROM public.timeline_blueprints bp
      WHERE bp.user_id = timeline_steps.user_id
        AND bp.interest_id = timeline_steps.interest_id
        AND bp.is_published = true
        AND (
          bp.access_level = 'public'
          OR (
            bp.access_level IN ('org_members', 'paid')
            AND is_org_active_member(bp.organization_id)
          )
        )
    )
  );
