-- Add RLS policy for race officers to view crew assignments
-- Fixed to work with actual schema (regattas table, not regatta_races)

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Race officers can view crew for their races" ON public.race_crew_assignments;

-- Create new policy for race officers
-- The race_id in race_crew_assignments refers to the regatta_id
CREATE POLICY "Race officers can view crew for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    race_id IN (
      -- Race officers can see crew for their club's regattas
      SELECT r.id
      FROM public.regattas r
      INNER JOIN public.club_members cm ON cm.club_id = r.club_id
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('race_officer', 'admin', 'sailing_manager', 'race_committee')
    )
  );

-- Success message
SELECT 'Race officer crew access policy created successfully!' AS status;
