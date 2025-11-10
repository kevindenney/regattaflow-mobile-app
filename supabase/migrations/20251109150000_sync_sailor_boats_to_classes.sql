-- Sync Sailor Boats to Classes Migration
--
-- This migration ensures that all boats in sailor_boats have a corresponding
-- entry in sailor_classes. This fixes the issue where the Crew tab shows
-- "Add a boat class..." because sailor_classes is empty.
--
-- The migration:
-- 1. Finds all unique sailor+class combinations from sailor_boats
-- 2. Inserts missing entries into sailor_classes
-- 3. Uses the primary boat's metadata for each class

-- Insert missing sailor_classes entries from sailor_boats
INSERT INTO sailor_classes (sailor_id, class_id, is_primary, boat_name, sail_number)
SELECT DISTINCT ON (sb.sailor_id, sb.class_id)
  sb.sailor_id,
  sb.class_id,
  COALESCE(sb.is_primary, false) as is_primary,
  sb.name as boat_name,
  sb.sail_number
FROM sailor_boats sb
WHERE NOT EXISTS (
  SELECT 1
  FROM sailor_classes sc
  WHERE sc.sailor_id = sb.sailor_id
    AND sc.class_id = sb.class_id
)
-- Prefer the primary boat for each sailor+class combination
ORDER BY sb.sailor_id, sb.class_id, sb.is_primary DESC NULLS LAST, sb.created_at ASC;

-- Add a comment to document this
COMMENT ON TABLE sailor_classes IS 'Junction table linking sailors to boat classes. Automatically synced with sailor_boats table via application logic.';
