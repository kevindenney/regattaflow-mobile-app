-- Run this in Supabase SQL Editor to mark first lesson of each module as free preview

-- Get the first lesson from each module and mark as free preview
UPDATE learning_lessons
SET is_free_preview = true
WHERE id IN (
  SELECT DISTINCT ON (module_id) id
  FROM learning_lessons
  ORDER BY module_id, order_index
);

-- Verify the update
SELECT 
  l.title as lesson_title,
  l.is_free_preview,
  m.title as module_title,
  l.order_index
FROM learning_lessons l
JOIN learning_modules m ON l.module_id = m.id
ORDER BY m.order_index, l.order_index;

