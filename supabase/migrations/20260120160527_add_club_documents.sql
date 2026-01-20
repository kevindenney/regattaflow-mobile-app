-- Migration: Add club_documents table for club-level documents (SSI, policies, etc.)
-- These documents are inherited by races at the club

-- Create document category enum for better type safety
DO $$ BEGIN
  CREATE TYPE club_document_category AS ENUM (
    'ssi',           -- Standard Sailing Instructions
    'appendix',      -- SSI Appendices (VHF policy, protest procedures, etc.)
    'attachment',    -- SSI Attachments (course diagrams, mark positions)
    'policy',        -- Club policies (safety, insurance, etc.)
    'reference',     -- Reference documents (tide tables, local notices)
    'other'          -- Other club documents
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create SSI subtype enum for granular classification
DO $$ BEGIN
  CREATE TYPE ssi_subtype AS ENUM (
    'introduction',
    'part_1',
    'part_2',
    'part_3',
    'attachment_a',
    'attachment_b',
    'attachment_c',
    'appendix_a',
    'appendix_b',
    'appendix_c',
    'emergency_contacts',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create club_documents table
CREATE TABLE IF NOT EXISTS club_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Either reference an uploaded document OR an external URL (at least one required)
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  external_url TEXT,

  -- Classification
  document_category club_document_category NOT NULL DEFAULT 'other',
  document_subtype ssi_subtype,

  -- Display information
  title TEXT NOT NULL,
  description TEXT,

  -- Versioning
  version TEXT,  -- e.g., "2025", "v2.1"
  effective_date DATE,

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- AI extraction results (VHF channels, course marks, emergency contacts, etc.)
  ai_extraction JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT club_document_has_source CHECK (
    document_id IS NOT NULL OR external_url IS NOT NULL
  ),
  CONSTRAINT valid_external_url CHECK (
    external_url IS NULL OR external_url ~ '^https?://'
  )
);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_club_documents_club_id ON club_documents(club_id);
CREATE INDEX IF NOT EXISTS idx_club_documents_category ON club_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_club_documents_active ON club_documents(club_id, is_active) WHERE is_active = true;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_club_documents_updated_at ON club_documents;
CREATE TRIGGER set_club_documents_updated_at
  BEFORE UPDATE ON club_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add inherit_club_documents column to race_documents table
-- This controls whether a race should show inherited club SSI documents
ALTER TABLE race_documents
ADD COLUMN IF NOT EXISTS inherit_club_documents BOOLEAN NOT NULL DEFAULT true;

-- Enable RLS
ALTER TABLE club_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: For MVP, simplified policies. Can be tightened with proper role management later.

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view active club documents" ON club_documents;
DROP POLICY IF EXISTS "Authenticated users can insert club documents" ON club_documents;
DROP POLICY IF EXISTS "Authenticated users can update club documents" ON club_documents;
DROP POLICY IF EXISTS "Authenticated users can delete club documents" ON club_documents;
DROP POLICY IF EXISTS "Club owners can insert club documents" ON club_documents;
DROP POLICY IF EXISTS "Club owners can update club documents" ON club_documents;
DROP POLICY IF EXISTS "Club owners can delete club documents" ON club_documents;
DROP POLICY IF EXISTS "Club admins can insert club documents" ON club_documents;
DROP POLICY IF EXISTS "Club admins can update club documents" ON club_documents;
DROP POLICY IF EXISTS "Club admins can delete club documents" ON club_documents;

-- Authenticated users can read active club documents
CREATE POLICY "Users can view active club documents"
  ON club_documents FOR SELECT
  USING (
    is_active = true
    AND auth.uid() IS NOT NULL
  );

-- For MVP: any authenticated user can manage club documents
-- TODO: Tighten to club admins/owners when role system is implemented
CREATE POLICY "Authenticated users can insert club documents"
  ON club_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update club documents"
  ON club_documents FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete club documents"
  ON club_documents FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add comment for documentation
COMMENT ON TABLE club_documents IS 'Club-level documents (SSI, policies) that can be inherited by races at the club';
COMMENT ON COLUMN club_documents.ai_extraction IS 'AI-extracted data: {vhf_channels: [], marks: [], emergency_contacts: [], course_info: {}}';
COMMENT ON COLUMN club_documents.document_subtype IS 'Fine-grained classification for SSI parts, attachments, and appendices';
