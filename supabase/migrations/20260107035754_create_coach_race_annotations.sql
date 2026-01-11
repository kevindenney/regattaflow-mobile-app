-- Migration: Create coach_race_annotations table
-- Purpose: Store coach annotations/marginalia on race data fields
-- Design: Tufte-inspired "absence as interface" pattern
--         Coach feedback appears as marginalia on specific data fields

-- Create enum for annotation field types
CREATE TYPE coach_annotation_field AS ENUM (
  'result',
  'keyMoment',
  'whatWorked',
  'toImprove',
  'start',
  'upwind',
  'downwind',
  'finish',
  'general'
);

-- Create the coach_race_annotations table
CREATE TABLE IF NOT EXISTS coach_race_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  race_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Annotation content
  field coach_annotation_field NOT NULL DEFAULT 'general',
  comment TEXT NOT NULL,

  -- Read status (for "NEW" indicator in Marginalia)
  is_read BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
-- Sailors viewing their race annotations
CREATE INDEX idx_coach_annotations_sailor_race
  ON coach_race_annotations(sailor_id, race_id);

-- Coaches viewing annotations they've made
CREATE INDEX idx_coach_annotations_coach
  ON coach_race_annotations(coach_id);

-- Finding unread annotations for a sailor
CREATE INDEX idx_coach_annotations_unread
  ON coach_race_annotations(sailor_id, is_read)
  WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE coach_race_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Coaches can create annotations for sailors (simplified policy - coach_id must match auth.uid())
-- Future enhancement: restrict to only sailors in active coaching relationships
CREATE POLICY "Coaches can create annotations"
  ON coach_race_annotations
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Coaches can view annotations they created
CREATE POLICY "Coaches can view their own annotations"
  ON coach_race_annotations
  FOR SELECT
  USING (coach_id = auth.uid());

-- Sailors can view annotations addressed to them
CREATE POLICY "Sailors can view their annotations"
  ON coach_race_annotations
  FOR SELECT
  USING (sailor_id = auth.uid());

-- Coaches can update their own annotations
CREATE POLICY "Coaches can update their own annotations"
  ON coach_race_annotations
  FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Sailors can mark annotations as read
CREATE POLICY "Sailors can mark annotations as read"
  ON coach_race_annotations
  FOR UPDATE
  USING (sailor_id = auth.uid())
  WITH CHECK (
    sailor_id = auth.uid()
    -- Only allow updating is_read field
    -- (enforced by application logic)
  );

-- Coaches can delete their own annotations
CREATE POLICY "Coaches can delete their own annotations"
  ON coach_race_annotations
  FOR DELETE
  USING (coach_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coach_annotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coach_annotation_updated_at
  BEFORE UPDATE ON coach_race_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_annotation_timestamp();

-- Comments for documentation
COMMENT ON TABLE coach_race_annotations IS
  'Coach annotations/marginalia on race data fields (Tufte-inspired design)';
COMMENT ON COLUMN coach_race_annotations.field IS
  'Which data field this annotation references (result, keyMoment, etc.)';
COMMENT ON COLUMN coach_race_annotations.is_read IS
  'Whether sailor has seen this annotation (shows NEW indicator if false)';
