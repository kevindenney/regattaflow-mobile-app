-- =============================================================================
-- Migration: Create race_source_documents and field_provenance tables
-- Purpose: Unified document management with source provenance tracking
-- =============================================================================

-- =============================================================================
-- TABLE: race_source_documents
-- Unified source-of-truth for all documents associated with a race
-- =============================================================================

CREATE TABLE IF NOT EXISTS race_source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Document Source (one required)
  -- 'url' = fetched from URL, 'upload' = user uploaded file, 'paste' = pasted text
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'upload', 'paste')),
  source_url TEXT,                    -- For URL-sourced docs
  file_path TEXT,                     -- For uploaded files (storage path)
  pasted_content_hash TEXT,           -- SHA256 hash for deduplication of pasted content

  -- Classification
  document_type TEXT NOT NULL CHECK (document_type IN ('nor', 'si', 'amendment', 'appendix', 'course_diagram', 'other')),
  title TEXT NOT NULL,
  description TEXT,

  -- Versioning - for amendments and updates
  version_number INTEGER DEFAULT 1,
  supersedes_id UUID REFERENCES race_source_documents(id) ON DELETE SET NULL,
  effective_date DATE,

  -- AI Extraction
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB,               -- Full extraction result
  contributed_fields JSONB,           -- Array of field paths this doc contributed
  extraction_error TEXT,
  extracted_at TIMESTAMPTZ,

  -- Sharing
  is_shared BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT source_required CHECK (
    (source_type = 'url' AND source_url IS NOT NULL) OR
    (source_type = 'upload' AND file_path IS NOT NULL) OR
    (source_type = 'paste' AND pasted_content_hash IS NOT NULL)
  )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_race_source_documents_regatta_id ON race_source_documents(regatta_id);
CREATE INDEX IF NOT EXISTS idx_race_source_documents_user_id ON race_source_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_race_source_documents_source_url ON race_source_documents(source_url) WHERE source_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_race_source_documents_document_type ON race_source_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_race_source_documents_extraction_status ON race_source_documents(extraction_status);
CREATE INDEX IF NOT EXISTS idx_race_source_documents_supersedes_id ON race_source_documents(supersedes_id) WHERE supersedes_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_race_source_documents_is_shared ON race_source_documents(is_shared) WHERE is_shared = true;

-- Composite index for duplicate URL detection within same regatta
CREATE INDEX IF NOT EXISTS idx_race_source_documents_regatta_url
  ON race_source_documents(regatta_id, source_url)
  WHERE source_url IS NOT NULL;

-- Composite index for duplicate paste content detection
CREATE INDEX IF NOT EXISTS idx_race_source_documents_regatta_hash
  ON race_source_documents(regatta_id, pasted_content_hash)
  WHERE pasted_content_hash IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_race_source_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS race_source_documents_updated_at ON race_source_documents;
CREATE TRIGGER race_source_documents_updated_at
  BEFORE UPDATE ON race_source_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_race_source_documents_updated_at();

-- =============================================================================
-- TABLE: field_provenance
-- Track which document contributed which field value to a race
-- =============================================================================

CREATE TABLE IF NOT EXISTS field_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES race_source_documents(id) ON DELETE CASCADE,

  -- Field identification
  field_path TEXT NOT NULL,           -- JSONPath-like: "vhf_channels[0].channel", "race_name", etc.
  field_value JSONB,                  -- The actual value extracted

  -- Confidence and verification
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  user_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),

  -- Timestamps
  extracted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each field can only have one source per regatta (latest wins)
  UNIQUE(regatta_id, field_path)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_field_provenance_regatta_id ON field_provenance(regatta_id);
CREATE INDEX IF NOT EXISTS idx_field_provenance_source_document_id ON field_provenance(source_document_id);
CREATE INDEX IF NOT EXISTS idx_field_provenance_field_path ON field_provenance(field_path);
CREATE INDEX IF NOT EXISTS idx_field_provenance_user_verified ON field_provenance(user_verified) WHERE user_verified = true;

-- =============================================================================
-- RLS Policies for race_source_documents
-- =============================================================================

ALTER TABLE race_source_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can always see their own documents
CREATE POLICY "Users can view own source documents"
  ON race_source_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can see documents for races they own or participate in
CREATE POLICY "Users can view race source documents"
  ON race_source_documents
  FOR SELECT
  TO authenticated
  USING (
    regatta_id IS NOT NULL
    AND (
      -- User owns the regatta
      EXISTS (
        SELECT 1 FROM regattas r
        WHERE r.id = race_source_documents.regatta_id
        AND r.owner_id = auth.uid()
      )
      OR
      -- User has a race entry for this regatta
      EXISTS (
        SELECT 1 FROM race_entries re
        JOIN race_events rev ON re.race_event_id = rev.id
        WHERE rev.regatta_id = race_source_documents.regatta_id
        AND re.user_id = auth.uid()
      )
    )
  );

-- Policy: Users can see shared documents for clubs they are members of
CREATE POLICY "Users can view shared club source documents"
  ON race_source_documents
  FOR SELECT
  TO authenticated
  USING (
    is_shared = true
    AND regatta_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM regattas r
      JOIN clubs c ON r.club_id = c.id
      JOIN club_members cm ON cm.club_id = c.id
      WHERE r.id = race_source_documents.regatta_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- Policy: Users can insert documents
CREATE POLICY "Users can insert source documents"
  ON race_source_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own source documents"
  ON race_source_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own source documents"
  ON race_source_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- RLS Policies for field_provenance
-- =============================================================================

ALTER TABLE field_provenance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view provenance for races they have access to
CREATE POLICY "Users can view field provenance for accessible races"
  ON field_provenance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM race_source_documents rsd
      WHERE rsd.id = field_provenance.source_document_id
      AND (
        rsd.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM regattas r
          WHERE r.id = rsd.regatta_id
          AND r.owner_id = auth.uid()
        )
      )
    )
  );

-- Policy: Users can insert provenance for their documents
CREATE POLICY "Users can insert field provenance"
  ON field_provenance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM race_source_documents rsd
      WHERE rsd.id = field_provenance.source_document_id
      AND rsd.user_id = auth.uid()
    )
  );

-- Policy: Users can update provenance for their documents
CREATE POLICY "Users can update field provenance"
  ON field_provenance
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM race_source_documents rsd
      WHERE rsd.id = field_provenance.source_document_id
      AND rsd.user_id = auth.uid()
    )
  );

-- Policy: Users can delete provenance for their documents
CREATE POLICY "Users can delete field provenance"
  ON field_provenance
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM race_source_documents rsd
      WHERE rsd.id = field_provenance.source_document_id
      AND rsd.user_id = auth.uid()
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE race_source_documents IS 'Unified source documents for races with provenance tracking';
COMMENT ON COLUMN race_source_documents.source_type IS 'How the document was added: url, upload, or paste';
COMMENT ON COLUMN race_source_documents.source_url IS 'Original URL for URL-sourced documents (for reference and re-extraction)';
COMMENT ON COLUMN race_source_documents.pasted_content_hash IS 'SHA256 hash of pasted content for duplicate detection';
COMMENT ON COLUMN race_source_documents.document_type IS 'Classification: nor, si, amendment, appendix, course_diagram, other';
COMMENT ON COLUMN race_source_documents.version_number IS 'Version number for tracking amendments';
COMMENT ON COLUMN race_source_documents.supersedes_id IS 'References the document this one replaces (for amendments)';
COMMENT ON COLUMN race_source_documents.contributed_fields IS 'Array of field paths this document contributed to the race';
COMMENT ON COLUMN race_source_documents.is_shared IS 'If true, visible to other club members';

COMMENT ON TABLE field_provenance IS 'Tracks which document contributed each field value to a race';
COMMENT ON COLUMN field_provenance.field_path IS 'JSONPath-like identifier: vhf_channels[0].channel, race_name, etc.';
COMMENT ON COLUMN field_provenance.extraction_confidence IS 'AI confidence score 0.00-1.00';
COMMENT ON COLUMN field_provenance.user_verified IS 'True if user confirmed the extracted value is correct';
