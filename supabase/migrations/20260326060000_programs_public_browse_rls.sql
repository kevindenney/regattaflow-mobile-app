-- Allow non-members to read programs that have at least one published public blueprint.
-- This enables the org browser page to show program groupings for public blueprints
-- (e.g. HKSF national schemes) without requiring org membership.

CREATE POLICY "programs_select_public_browse"
  ON public.programs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.timeline_blueprints tb
      WHERE tb.program_id = programs.id
        AND tb.is_published = true
        AND tb.access_level = 'public'
    )
  );
