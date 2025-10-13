-- Migration: AI Document Extraction Persistence
-- Extends ai_analyses table to support document extraction storage

-- Add document_id field to ai_analyses table
ALTER TABLE ai_analyses
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES sailing_documents(id) ON DELETE CASCADE;

-- Update analysis_type constraint to include 'document_extraction'
ALTER TABLE ai_analyses
DROP CONSTRAINT IF EXISTS ai_analyses_analysis_type_check;

ALTER TABLE ai_analyses
ADD CONSTRAINT ai_analyses_analysis_type_check
CHECK (analysis_type = ANY (ARRAY['strategy'::text, 'performance'::text, 'prediction'::text, 'document_extraction'::text]));

-- Add index for document lookups
CREATE INDEX IF NOT EXISTS idx_ai_analyses_document_id ON ai_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_type ON ai_analyses(user_id, analysis_type);

-- Add comment
COMMENT ON COLUMN ai_analyses.document_id IS 'Links AI analysis to a sailing document for course extraction';

-- Allow regatta_id to be nullable (since document extraction may not be tied to a specific regatta)
ALTER TABLE ai_analyses
ALTER COLUMN regatta_id DROP NOT NULL;

-- RLS Policies for document extraction
-- Users can insert their own document extractions
CREATE POLICY "Users can insert their own document extractions"
  ON ai_analyses FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND analysis_type = 'document_extraction'
  );

-- Users can view their own document extractions
CREATE POLICY "Users can view their own document extractions"
  ON ai_analyses FOR SELECT
  USING (
    auth.uid() = user_id
    AND analysis_type = 'document_extraction'
  );

-- Users can update their own document extractions
CREATE POLICY "Users can update their own document extractions"
  ON ai_analyses FOR UPDATE
  USING (auth.uid() = user_id AND analysis_type = 'document_extraction')
  WITH CHECK (auth.uid() = user_id AND analysis_type = 'document_extraction');

-- Users can delete their own document extractions
CREATE POLICY "Users can delete their own document extractions"
  ON ai_analyses FOR DELETE
  USING (auth.uid() = user_id AND analysis_type = 'document_extraction');
