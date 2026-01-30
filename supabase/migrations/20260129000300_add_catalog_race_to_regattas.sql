-- ============================================================================
-- Migration: Add catalog_race_id to regattas
-- Links personal regattas to catalog race entries for discussion integration
-- ============================================================================

ALTER TABLE regattas
  ADD COLUMN catalog_race_id UUID REFERENCES catalog_races(id) ON DELETE SET NULL;

-- Index for lookups
CREATE INDEX idx_regattas_catalog_race
  ON regattas(catalog_race_id) WHERE catalog_race_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN regattas.catalog_race_id IS
  'Optional link to a public catalog race for discussion integration';
