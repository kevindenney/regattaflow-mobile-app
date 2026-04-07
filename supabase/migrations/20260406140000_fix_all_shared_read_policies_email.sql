-- Fix all shared-read policies to match by email (for pending invites)
-- in addition to shared_with_user_id (for accepted invites).
-- Uses auth.jwt() ->> 'email' to avoid querying auth.users.

DROP POLICY IF EXISTS "Shared viewers can read resources" ON playbook_resources;
CREATE POLICY "Shared viewers can read resources"
  ON playbook_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_resources.playbook_id
        AND ps.invite_status IN ('pending', 'accepted')
        AND (
          ps.shared_with_user_id = auth.uid()
          OR ps.shared_with_email = (auth.jwt() ->> 'email')
        )
    )
  );

DROP POLICY IF EXISTS "Shared viewers can read concepts" ON playbook_concepts;
CREATE POLICY "Shared viewers can read concepts"
  ON playbook_concepts FOR SELECT
  USING (
    playbook_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_concepts.playbook_id
        AND ps.invite_status IN ('pending', 'accepted')
        AND (
          ps.shared_with_user_id = auth.uid()
          OR ps.shared_with_email = (auth.jwt() ->> 'email')
        )
    )
  );

DROP POLICY IF EXISTS "Shared viewers can read patterns" ON playbook_patterns;
CREATE POLICY "Shared viewers can read patterns"
  ON playbook_patterns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_patterns.playbook_id
        AND ps.invite_status IN ('pending', 'accepted')
        AND (
          ps.shared_with_user_id = auth.uid()
          OR ps.shared_with_email = (auth.jwt() ->> 'email')
        )
    )
  );

DROP POLICY IF EXISTS "Shared viewers can read reviews" ON playbook_reviews;
CREATE POLICY "Shared viewers can read reviews"
  ON playbook_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_reviews.playbook_id
        AND ps.invite_status IN ('pending', 'accepted')
        AND (
          ps.shared_with_user_id = auth.uid()
          OR ps.shared_with_email = (auth.jwt() ->> 'email')
        )
    )
  );

DROP POLICY IF EXISTS "Shared viewers can read qa" ON playbook_qa;
CREATE POLICY "Shared viewers can read qa"
  ON playbook_qa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_qa.playbook_id
        AND ps.invite_status IN ('pending', 'accepted')
        AND (
          ps.shared_with_user_id = auth.uid()
          OR ps.shared_with_email = (auth.jwt() ->> 'email')
        )
    )
  );
