-- Add RLS policy for race officers to view crew assignments
-- Corrected to use club_race_calendar link between regattas and clubs

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Race officers can view crew for their races" ON public.race_crew_assignments;

-- Create new policy for race officers
-- race_id references regatta_id, which links to clubs via club_race_calendar
CREATE POLICY "Race officers can view crew for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    race_id IN (
      -- Race officers can see crew for regattas in their club's calendar
      SELECT crc.regatta_id
      FROM public.club_race_calendar crc
      INNER JOIN public.club_members cm ON cm.club_id = crc.club_id
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('race_officer', 'admin', 'sailing_manager', 'race_committee')
    )
  );

-- Success message
SELECT 'Race officer crew access policy created successfully!' AS status;
