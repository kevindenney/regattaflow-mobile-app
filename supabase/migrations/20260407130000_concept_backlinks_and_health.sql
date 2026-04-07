-- Add related_concept_ids to playbook_concepts for backlinking between concepts.
-- This enables the "knowledge graph" pattern: concepts reference each other,
-- making the wiki navigable and improving AI context retrieval.
--
-- Also adds a knowledge_health jsonb column to playbook_reviews for storing
-- health check results (contradictions, gaps, stale concepts).

-- 1. Backlinks column on concepts
ALTER TABLE playbook_concepts
  ADD COLUMN IF NOT EXISTS related_concept_ids UUID[] DEFAULT '{}';

-- Index for finding all concepts that link TO a given concept (reverse lookup)
CREATE INDEX IF NOT EXISTS idx_playbook_concepts_related
  ON playbook_concepts USING gin (related_concept_ids)
  WHERE related_concept_ids != '{}';

-- 2. Health check results on reviews
ALTER TABLE playbook_reviews
  ADD COLUMN IF NOT EXISTS knowledge_health JSONB DEFAULT NULL;
