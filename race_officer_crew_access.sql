-- Add RLS policy for race officers to view crew assignments
-- This allows race officers to see crew manifests for races they manage

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Race officers can view crew for their races" ON public.race_crew_assignments;

-- Create new policy for race officers
CREATE POLICY "Race officers can view crew for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    race_id IN (
      -- Race officers can see crew for races in their club's regattas
      SELECT rr.id
      FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      INNER JOIN public.club_members cm ON cm.club_id = r.club_id
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('race_officer', 'admin', 'sailing_manager', 'race_committee')
    )
  );

-- Success message
SELECT 'Race officer crew access policy created successfully!' AS status;
