-- Tuning Guides OCR/Extraction Enhancement
-- Adds support for extracted content, fleet sharing, and searchable guide data

-- Add extracted content columns to tuning_guides
ALTER TABLE tuning_guides
  ADD COLUMN IF NOT EXISTS extracted_content TEXT,
  ADD COLUMN IF NOT EXISTS extracted_sections JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS extraction_status TEXT CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS extraction_error TEXT,
  ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ;

-- Create index for full-text search on extracted content
CREATE INDEX IF NOT EXISTS idx_tuning_guides_extracted_content
  ON tuning_guides USING gin(to_tsvector('english', extracted_content));

-- Create fleet tuning guides sharing table
CREATE TABLE IF NOT EXISTS fleet_tuning_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES tuning_guides(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Sharing metadata
  share_notes TEXT,
  is_recommended BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(fleet_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_tuning_guides_fleet ON fleet_tuning_guides(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_tuning_guides_guide ON fleet_tuning_guides(guide_id);

-- Add comments
COMMENT ON COLUMN tuning_guides.extracted_content IS 'Full extracted text from guide via OCR or PDF parsing';
COMMENT ON COLUMN tuning_guides.extracted_sections IS 'Structured sections like [{"title": "Light Wind", "content": "...", "settings": {...}}]';
COMMENT ON COLUMN tuning_guides.extraction_status IS 'Status of content extraction process';
COMMENT ON TABLE fleet_tuning_guides IS 'Tuning guides shared within fleets by members';

-- RLS Policies for fleet_tuning_guides
ALTER TABLE fleet_tuning_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fleet members can view fleet guides" ON fleet_tuning_guides;
CREATE POLICY "Fleet members can view fleet guides"
  ON fleet_tuning_guides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_tuning_guides.fleet_id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Fleet members can share guides" ON fleet_tuning_guides;
CREATE POLICY "Fleet members can share guides"
  ON fleet_tuning_guides FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by
    AND EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_tuning_guides.fleet_id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can remove their own shared guides" ON fleet_tuning_guides;
CREATE POLICY "Users can remove their own shared guides"
  ON fleet_tuning_guides FOR DELETE
  USING (auth.uid() = shared_by);

-- Function to search tuning guides with extracted content
CREATE OR REPLACE FUNCTION search_tuning_guides(
  search_query TEXT,
  p_class_id UUID DEFAULT NULL,
  p_sailor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  class_id UUID,
  title TEXT,
  source TEXT,
  file_url TEXT,
  description TEXT,
  extracted_content TEXT,
  tags TEXT[],
  year INTEGER,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tg.id,
    tg.class_id,
    tg.title,
    tg.source,
    tg.file_url,
    tg.description,
    tg.extracted_content,
    tg.tags,
    tg.year,
    ts_rank(
      to_tsvector('english', COALESCE(tg.title, '') || ' ' || COALESCE(tg.description, '') || ' ' || COALESCE(tg.extracted_content, '')),
      plainto_tsquery('english', search_query)
    ) AS relevance_score
  FROM tuning_guides tg
  WHERE
    (p_class_id IS NULL OR tg.class_id = p_class_id)
    AND (
      tg.is_public = true
      OR tg.uploaded_by = p_sailor_id
      OR EXISTS (
        SELECT 1 FROM sailor_tuning_guides stg
        WHERE stg.guide_id = tg.id AND stg.sailor_id = p_sailor_id
      )
    )
    AND (
      to_tsvector('english', COALESCE(tg.title, '') || ' ' || COALESCE(tg.description, '') || ' ' || COALESCE(tg.extracted_content, ''))
      @@ plainto_tsquery('english', search_query)
    )
  ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get fleet tuning guides
CREATE OR REPLACE FUNCTION get_fleet_tuning_guides(p_fleet_id UUID)
RETURNS TABLE (
  guide_id UUID,
  guide_title TEXT,
  guide_source TEXT,
  guide_file_url TEXT,
  guide_description TEXT,
  guide_tags TEXT[],
  guide_year INTEGER,
  guide_extracted_content TEXT,
  shared_by_id UUID,
  shared_by_name TEXT,
  share_notes TEXT,
  is_recommended BOOLEAN,
  shared_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tg.id AS guide_id,
    tg.title AS guide_title,
    tg.source AS guide_source,
    tg.file_url AS guide_file_url,
    tg.description AS guide_description,
    tg.tags AS guide_tags,
    tg.year AS guide_year,
    tg.extracted_content AS guide_extracted_content,
    ftg.shared_by AS shared_by_id,
    u.email AS shared_by_name,
    ftg.share_notes,
    ftg.is_recommended,
    ftg.created_at AS shared_at
  FROM fleet_tuning_guides ftg
  JOIN tuning_guides tg ON ftg.guide_id = tg.id
  LEFT JOIN auth.users u ON ftg.shared_by = u.id
  WHERE ftg.fleet_id = p_fleet_id
  ORDER BY ftg.is_recommended DESC, ftg.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON fleet_tuning_guides TO authenticated;
GRANT EXECUTE ON FUNCTION search_tuning_guides TO authenticated;
GRANT EXECUTE ON FUNCTION get_fleet_tuning_guides TO authenticated;
