-- ============================================
-- Practice Intentions Migration
-- Creates table for practice session checklist state and carryover items
-- ============================================

-- ============================================
-- 1. Practice Intentions Table
-- Stores per-session checklist completions, drill ratings, and carryover items
-- ============================================
CREATE TABLE IF NOT EXISTS public.practice_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Checklist state per phase
  -- Format: { "itemId": { itemId, completedAt, completedBy, completedByName, notes } }
  checklist_completions JSONB DEFAULT '{}'::jsonb,

  -- Drill ratings for reflect phase
  -- Format: { "drillId": { rating: 1-5, notes: "..." } }
  drill_ratings JSONB DEFAULT '{}'::jsonb,

  -- Reflection data
  overall_rating INTEGER CHECK (overall_rating IS NULL OR (overall_rating BETWEEN 1 AND 5)),
  reflection_notes TEXT,
  key_learning TEXT,
  next_focus TEXT,

  -- Carryover items from previous sessions
  -- Format: [{ id, type, label, sourceSessionId, sourceSessionName, sourceSessionDate, resolved }]
  carryover_items JSONB DEFAULT '[]'::jsonb,

  -- Equipment issues logged during reflect phase (become carryover for next session)
  -- Format: [{ id, description, createdAt, priority }]
  equipment_issues JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one intentions record per user per session
  UNIQUE (practice_session_id, user_id)
);

-- ============================================
-- 2. Indexes
-- ============================================

-- Index for looking up intentions by session
CREATE INDEX IF NOT EXISTS idx_practice_intentions_session
  ON public.practice_intentions(practice_session_id);

-- Index for looking up user's intentions
CREATE INDEX IF NOT EXISTS idx_practice_intentions_user
  ON public.practice_intentions(user_id);

-- Composite index for the common lookup pattern
CREATE INDEX IF NOT EXISTS idx_practice_intentions_session_user
  ON public.practice_intentions(practice_session_id, user_id);

-- ============================================
-- 3. Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_practice_intentions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_practice_intentions_updated_at ON public.practice_intentions;
CREATE TRIGGER trigger_practice_intentions_updated_at
  BEFORE UPDATE ON public.practice_intentions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_intentions_updated_at();

-- ============================================
-- 4. Row Level Security
-- ============================================

-- Enable RLS
ALTER TABLE public.practice_intentions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own intentions
CREATE POLICY "practice_intentions_select_own"
  ON public.practice_intentions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Session members can view intentions for sessions they're part of
-- (allows shared checklists for team practices)
CREATE POLICY "practice_intentions_select_session_member"
  ON public.practice_intentions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_session_members psm
      WHERE psm.session_id = practice_intentions.practice_session_id
        AND psm.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own intentions
CREATE POLICY "practice_intentions_insert_own"
  ON public.practice_intentions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own intentions
CREATE POLICY "practice_intentions_update_own"
  ON public.practice_intentions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Session organizers can update any intentions in their session
-- (for shared checklist management)
CREATE POLICY "practice_intentions_update_organizer"
  ON public.practice_intentions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions ps
      WHERE ps.id = practice_intentions.practice_session_id
        AND ps.created_by = auth.uid()
    )
  );

-- Policy: Users can delete their own intentions
CREATE POLICY "practice_intentions_delete_own"
  ON public.practice_intentions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Helper Functions
-- ============================================

-- Function to get carryover items for next practice session
-- Returns equipment issues from the user's most recent completed session
CREATE OR REPLACE FUNCTION get_practice_carryover_items(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::jsonb;
  last_session RECORD;
  issues JSONB;
BEGIN
  -- Find the most recently completed session for this user
  SELECT ps.id, ps.title, ps.scheduled_date, pi.equipment_issues
  INTO last_session
  FROM public.practice_sessions ps
  LEFT JOIN public.practice_intentions pi ON pi.practice_session_id = ps.id AND pi.user_id = p_user_id
  WHERE ps.status = 'completed'
    AND EXISTS (
      SELECT 1 FROM public.practice_session_members psm
      WHERE psm.session_id = ps.id
        AND psm.user_id = p_user_id
    )
  ORDER BY ps.scheduled_date DESC, ps.updated_at DESC
  LIMIT 1;

  -- If we found a session with equipment issues, transform them into carryover items
  IF last_session.equipment_issues IS NOT NULL AND jsonb_array_length(last_session.equipment_issues) > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', issue->>'id',
        'type', 'equipment_issue',
        'label', issue->>'description',
        'sourceSessionId', last_session.id,
        'sourceSessionName', last_session.title,
        'sourceSessionDate', last_session.scheduled_date,
        'resolved', false
      )
    )
    INTO result
    FROM jsonb_array_elements(last_session.equipment_issues) AS issue
    WHERE (issue->>'resolved')::boolean IS NOT TRUE;
  END IF;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_practice_carryover_items(UUID) TO authenticated;

-- ============================================
-- 6. Comments
-- ============================================
COMMENT ON TABLE public.practice_intentions IS 'Stores practice session checklist completions, drill ratings, reflections, and carryover items';
COMMENT ON COLUMN public.practice_intentions.checklist_completions IS 'JSONB map of itemId -> completion record with user attribution';
COMMENT ON COLUMN public.practice_intentions.drill_ratings IS 'JSONB map of drillId -> rating (1-5) with optional notes';
COMMENT ON COLUMN public.practice_intentions.carryover_items IS 'Items carried forward from previous sessions (equipment issues, incomplete goals)';
COMMENT ON COLUMN public.practice_intentions.equipment_issues IS 'Equipment issues logged during this session (become carryover for next session)';
