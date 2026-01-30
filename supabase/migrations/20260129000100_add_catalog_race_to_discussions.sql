-- ============================================================================
-- Add catalog_race_id to venue_discussions
--
-- Allows discussion posts to be tagged with a catalog race.
-- Also adds a trigger to maintain catalog_races.discussion_count.
-- ============================================================================

ALTER TABLE venue_discussions
  ADD COLUMN catalog_race_id UUID REFERENCES catalog_races(id) ON DELETE SET NULL;

CREATE INDEX idx_venue_discussions_catalog_race
  ON venue_discussions(catalog_race_id)
  WHERE catalog_race_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Trigger: auto-update discussion_count on catalog_races
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_catalog_race_discussion_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.catalog_race_id IS NOT NULL THEN
    UPDATE catalog_races
      SET discussion_count = discussion_count + 1
      WHERE id = NEW.catalog_race_id;
  ELSIF TG_OP = 'DELETE' AND OLD.catalog_race_id IS NOT NULL THEN
    UPDATE catalog_races
      SET discussion_count = GREATEST(0, discussion_count - 1)
      WHERE id = OLD.catalog_race_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle race tag changing
    IF OLD.catalog_race_id IS DISTINCT FROM NEW.catalog_race_id THEN
      IF OLD.catalog_race_id IS NOT NULL THEN
        UPDATE catalog_races
          SET discussion_count = GREATEST(0, discussion_count - 1)
          WHERE id = OLD.catalog_race_id;
      END IF;
      IF NEW.catalog_race_id IS NOT NULL THEN
        UPDATE catalog_races
          SET discussion_count = discussion_count + 1
          WHERE id = NEW.catalog_race_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_venue_discussions_catalog_race_count
AFTER INSERT OR UPDATE OR DELETE ON venue_discussions
FOR EACH ROW
EXECUTE FUNCTION update_catalog_race_discussion_count();
