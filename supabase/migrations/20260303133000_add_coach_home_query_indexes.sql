-- =============================================================================
-- Add Coach Home Query Path Indexes
--
-- Canonical ownership:
-- - Owns composite/partial index additions that accelerate Coach Home
--   due-assessment, unread-thread, and program-trend query paths.
-- Override intent:
-- - Additive only; no policy/function ownership changes.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Assessment records: due-work summaries + trend drill-downs
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assessment_records_org_eval_status_created_desc
  ON public.assessment_records (organization_id, evaluator_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_records_org_program_created_desc
  ON public.assessment_records (organization_id, program_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_records_org_eval_assessed_created_desc
  ON public.assessment_records (organization_id, evaluator_id, assessed_at DESC, created_at DESC)
  WHERE competency_id IS NOT NULL
    AND score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_records_org_program_competency_assessed_desc
  ON public.assessment_records (organization_id, program_id, competency_id, assessed_at DESC)
  WHERE competency_id IS NOT NULL
    AND score IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Communication threads/messages: unread thread scans + list ordering
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_communication_threads_org_archived_program_updated_desc
  ON public.communication_threads (organization_id, is_archived, program_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_messages_org_created_desc
  ON public.communication_messages (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_messages_org_thread_created_desc
  ON public.communication_messages (organization_id, thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_thread_reads_org_user_thread_last_read
  ON public.communication_thread_reads (organization_id, user_id, thread_id, last_read_at DESC);

-- -----------------------------------------------------------------------------
-- Program participants: assignment counts and scoped participant lookups
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_program_participants_org_program_status
  ON public.program_participants (organization_id, program_id, status);

COMMIT;
