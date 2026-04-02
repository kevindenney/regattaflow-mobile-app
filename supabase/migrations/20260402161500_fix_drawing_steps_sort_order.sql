-- Fix drawing steps for denneyke: clear starts_at (learning steps, not events)
-- and assign sequential sort_order based on creation time.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_sort
  FROM timeline_steps
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'denneyke@gmail.com')
    AND interest_id IN (SELECT id FROM interests WHERE slug = 'drawing')
)
UPDATE timeline_steps ts
SET starts_at = NULL,
    sort_order = o.new_sort
FROM ordered o
WHERE ts.id = o.id;
