-- Add body_text column to playbook_resources for full extracted content
-- This enables Q&A to search and cite full PDF/URL/note content, not just the 500-char description
ALTER TABLE playbook_resources ADD COLUMN IF NOT EXISTS body_text text;

-- Index for full-text search on body_text
CREATE INDEX IF NOT EXISTS idx_playbook_resources_body_tsvector
  ON playbook_resources USING gin (to_tsvector('english', COALESCE(body_text, '')));
