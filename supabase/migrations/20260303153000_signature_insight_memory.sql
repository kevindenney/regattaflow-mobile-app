-- =============================================================================
-- signature insight memory + event log
--
-- Canonical ownership:
-- - Owns persistent principle memory and signature insight event outcomes for
--   BetterAt signature-insight flows.
-- Override intent:
-- - none
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_principle_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  interest_id text NOT NULL,
  principle_text text NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence_score numeric(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  times_reinforced integer NOT NULL DEFAULT 0 CHECK (times_reinforced >= 0),
  times_challenged integer NOT NULL DEFAULT 0 CHECK (times_challenged >= 0),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest_id, principle_text)
);

CREATE INDEX IF NOT EXISTS idx_user_principle_memory_user_interest_seen
  ON public.user_principle_memory(user_id, interest_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.signature_insight_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  interest_id text NOT NULL,
  race_event_id uuid REFERENCES public.race_events(id) ON DELETE SET NULL,
  checklist_item_id uuid REFERENCES public.race_checklist_items(id) ON DELETE SET NULL,
  ai_analysis_id uuid REFERENCES public.ai_coach_analysis(id) ON DELETE SET NULL,
  source_kind text NOT NULL DEFAULT 'timeline_step_completion',
  source_window_start date,
  source_window_end date,
  insight_text text NOT NULL,
  principle_text text NOT NULL,
  evidence_text text NOT NULL,
  confidence_score numeric(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  outcome text NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'accepted', 'edited', 'dismissed')),
  edited_principle_text text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT signature_insight_events_edit_requires_text
    CHECK (outcome <> 'edited' OR edited_principle_text IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_signature_insight_events_source_window
  ON public.signature_insight_events(user_id, organization_id, interest_id, source_kind, source_window_start, source_window_end)
  WHERE source_window_start IS NOT NULL AND source_window_end IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_signature_insight_events_user_created
  ON public.signature_insight_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signature_insight_events_user_outcome
  ON public.signature_insight_events(user_id, outcome, created_at DESC);

ALTER TABLE public.user_principle_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_insight_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_principle_memory_select_self_or_org_staff" ON public.user_principle_memory;
CREATE POLICY "user_principle_memory_select_self_or_org_staff"
  ON public.user_principle_memory FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND public.has_org_role(
        organization_id,
        ARRAY['owner', 'admin', 'manager', 'coordinator', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
      )
    )
  );

DROP POLICY IF EXISTS "user_principle_memory_insert_self" ON public.user_principle_memory;
CREATE POLICY "user_principle_memory_insert_self"
  ON public.user_principle_memory FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_principle_memory_update_self" ON public.user_principle_memory;
CREATE POLICY "user_principle_memory_update_self"
  ON public.user_principle_memory FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "signature_insight_events_select_self_or_org_staff" ON public.signature_insight_events;
CREATE POLICY "signature_insight_events_select_self_or_org_staff"
  ON public.signature_insight_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND public.has_org_role(
        organization_id,
        ARRAY['owner', 'admin', 'manager', 'coordinator', 'faculty', 'instructor', 'preceptor', 'coach']::text[]
      )
    )
  );

DROP POLICY IF EXISTS "signature_insight_events_insert_self" ON public.signature_insight_events;
CREATE POLICY "signature_insight_events_insert_self"
  ON public.signature_insight_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "signature_insight_events_update_self" ON public.signature_insight_events;
CREATE POLICY "signature_insight_events_update_self"
  ON public.signature_insight_events FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.apply_signature_insight_outcome_v1(
  p_event_id uuid,
  p_outcome text,
  p_edited_principle_text text DEFAULT NULL
)
RETURNS public.signature_insight_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_outcome text := lower(trim(coalesce(p_outcome, '')));
  v_event public.signature_insight_events%ROWTYPE;
  v_principle_text text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_outcome NOT IN ('accepted', 'edited', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid outcome: %', p_outcome;
  END IF;

  IF v_outcome = 'edited' AND nullif(trim(coalesce(p_edited_principle_text, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Edited principle text is required when outcome is edited';
  END IF;

  SELECT *
  INTO v_event
  FROM public.signature_insight_events
  WHERE id = p_event_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Signature insight event not found for current user';
  END IF;

  UPDATE public.signature_insight_events
  SET
    outcome = v_outcome,
    edited_principle_text = CASE
      WHEN v_outcome = 'edited' THEN trim(p_edited_principle_text)
      ELSE NULL
    END,
    resolved_at = v_now
  WHERE id = v_event.id
  RETURNING * INTO v_event;

  v_principle_text := CASE
    WHEN v_outcome = 'edited' THEN trim(coalesce(p_edited_principle_text, ''))
    ELSE v_event.principle_text
  END;

  IF v_outcome IN ('accepted', 'edited') THEN
    INSERT INTO public.user_principle_memory (
      user_id,
      organization_id,
      interest_id,
      principle_text,
      evidence_refs,
      confidence_score,
      times_reinforced,
      times_challenged,
      last_seen_at,
      updated_at
    )
    VALUES (
      v_event.user_id,
      v_event.organization_id,
      v_event.interest_id,
      v_principle_text,
      jsonb_build_array(
        jsonb_build_object(
          'signature_insight_event_id', v_event.id,
          'race_event_id', v_event.race_event_id,
          'checklist_item_id', v_event.checklist_item_id,
          'ai_analysis_id', v_event.ai_analysis_id,
          'resolved_at', v_now
        )
      ),
      v_event.confidence_score,
      1,
      0,
      v_now,
      v_now
    )
    ON CONFLICT (user_id, interest_id, principle_text)
    DO UPDATE SET
      organization_id = COALESCE(user_principle_memory.organization_id, EXCLUDED.organization_id),
      confidence_score = GREATEST(
        COALESCE(user_principle_memory.confidence_score, 0),
        COALESCE(EXCLUDED.confidence_score, 0)
      ),
      times_reinforced = user_principle_memory.times_reinforced + 1,
      last_seen_at = v_now,
      updated_at = v_now,
      evidence_refs = CASE
        WHEN jsonb_typeof(user_principle_memory.evidence_refs) = 'array'
          THEN user_principle_memory.evidence_refs
        ELSE '[]'::jsonb
      END || jsonb_build_array(
        jsonb_build_object(
          'signature_insight_event_id', v_event.id,
          'race_event_id', v_event.race_event_id,
          'checklist_item_id', v_event.checklist_item_id,
          'ai_analysis_id', v_event.ai_analysis_id,
          'resolved_at', v_now
        )
      );
  ELSIF v_outcome = 'dismissed' THEN
    UPDATE public.user_principle_memory
    SET
      times_challenged = times_challenged + 1,
      last_seen_at = v_now,
      updated_at = v_now
    WHERE user_id = v_event.user_id
      AND interest_id = v_event.interest_id
      AND principle_text = v_principle_text;
  END IF;

  RETURN v_event;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_signature_insight_outcome_v1(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_signature_insight_outcome_v1(uuid, text, text) TO authenticated;

COMMIT;
