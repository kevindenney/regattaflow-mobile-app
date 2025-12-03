-- Add RLS policy for race officers to view crew assignments
-- Simplified approach: use race_participants to verify race exists and user has club role

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Race officers can view crew for their races" ON public.race_crew_assignments;

-- Create new policy for race officers
-- Allow viewing if user is a race officer/admin at any club and the race has participants
CREATE POLICY "Race officers can view crew for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    -- User must be a race officer, admin, sailing_manager, or race_committee at some club
    EXISTS (
      SELECT 1
      FROM public.club_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('race_officer', 'admin', 'sailing_manager', 'race_committee')
    )
    -- AND the race_id must correspond to an actual race with participants
    AND EXISTS (
      SELECT 1
      FROM public.race_participants rp
      WHERE rp.regatta_id::text = race_id::text
      LIMIT 1
    )
  );

-- Success message
SELECT 'Race officer crew access policy created successfully!' AS status;
