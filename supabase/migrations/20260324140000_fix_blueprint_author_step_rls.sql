-- Fix: blueprint author RLS policy on timeline_steps was blocked by
-- cascading RLS on blueprint_step_actions (no SELECT policy).
-- Solution: SECURITY DEFINER helper function bypasses RLS on joined tables.

-- 1. Helper function
CREATE OR REPLACE FUNCTION get_blueprint_author_adopted_step_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT bsa.adopted_step_id
    FROM blueprint_step_actions bsa
    JOIN blueprint_subscriptions bs ON bs.id = bsa.subscription_id
    JOIN timeline_blueprints tb ON tb.id = bs.blueprint_id
   WHERE tb.user_id = p_user_id
     AND bsa.adopted_step_id IS NOT NULL;
$$;

-- 2. Replace inline-subquery policy with helper-based policy
DROP POLICY IF EXISTS "Blueprint authors can view adopted step copies" ON timeline_steps;

CREATE POLICY "Blueprint authors can view adopted step copies"
  ON timeline_steps
  FOR SELECT
  USING (
    id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid()))
  );
