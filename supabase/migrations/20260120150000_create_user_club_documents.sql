-- =============================================================================
-- Migration: Create user_club_documents table
-- Purpose: Allow users to upload SSI documents with AI extraction
-- =============================================================================

-- Create the user_club_documents table
CREATE TABLE IF NOT EXISTS user_club_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  race_id UUID REFERENCES regattas(id) ON DELETE SET NULL,

  -- Document info
  document_type TEXT NOT NULL DEFAULT 'ssi',
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,

  -- Sharing
  is_shared BOOLEAN DEFAULT false,

  -- Extraction
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB,
  extraction_error TEXT,
  extracted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_club_documents_user_id ON user_club_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_club_documents_club_id ON user_club_documents(club_id);
CREATE INDEX IF NOT EXISTS idx_user_club_documents_race_id ON user_club_documents(race_id);
CREATE INDEX IF NOT EXISTS idx_user_club_documents_extraction_status ON user_club_documents(extraction_status);
CREATE INDEX IF NOT EXISTS idx_user_club_documents_is_shared ON user_club_documents(is_shared) WHERE is_shared = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_club_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_club_documents_updated_at ON user_club_documents;
CREATE TRIGGER user_club_documents_updated_at
  BEFORE UPDATE ON user_club_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_club_documents_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Enable RLS
ALTER TABLE user_club_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can always see their own documents
CREATE POLICY "Users can view own documents"
  ON user_club_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can see shared documents for clubs they are members of
-- This allows sailors who are members of a club to see SSI documents shared by other sailors
CREATE POLICY "Users can view shared club documents"
  ON user_club_documents
  FOR SELECT
  TO authenticated
  USING (
    is_shared = true
    AND club_id IS NOT NULL
    AND EXISTS (
      -- User is a member of this club via club_members
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = user_club_documents.club_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON user_club_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON user_club_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON user_club_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- Storage bucket for user documents (if not exists)
-- =============================================================================

-- Note: Storage bucket creation is typically done via Supabase dashboard or
-- separate migration. The bucket should be named 'user-documents' with:
-- - Public: false (requires authenticated access)
-- - File size limit: 10MB
-- - Allowed MIME types: application/pdf

-- Add comment for documentation
COMMENT ON TABLE user_club_documents IS 'User-uploaded club documents (SSI, etc.) with AI extraction support';
COMMENT ON COLUMN user_club_documents.document_type IS 'Type of document: ssi, nor, amendment, other';
COMMENT ON COLUMN user_club_documents.extraction_status IS 'AI extraction status: pending, processing, completed, failed';
COMMENT ON COLUMN user_club_documents.extracted_data IS 'JSON blob containing AI-extracted data from the document';
COMMENT ON COLUMN user_club_documents.is_shared IS 'If true, other sailors racing at this club can see this document';
