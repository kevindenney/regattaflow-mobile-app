# V1 Plan: Competency-Linked Artifacts (Student + Coach + Org Thin Slice)

Date: 2026-03-06  
Inputs:
- [Artifact anchor](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/docs/ai/v1-artifact-anchor.md)
- [Nursing seed catalog](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/competencies/nursing-core-v1.ts)
- [Sailing seed catalog](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/competencies/sailing-core-v1.ts)
- [Module candidate sets](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/competency-candidates.ts)

## Scope and Outcome

Deliver a V1 that ships one end-to-end path across three personas:

- Student (solo-first, required):
  - Tag module submissions to competency candidates from module-scoped candidate sets.
  - Run Claude evaluator for `clinical_reasoning` only (Edge Function).
  - Show a timeline step card badge: `Advanced {N}`.
  - Advance progress on submit with review state `unvalidated`.
- Coach (optional but working):
  - Student can request review.
  - Coach queue shows pending items and supports approve/adjust + note.
- Org/Admin (optional but working):
  - Student can connect to organization later.
  - Organization can define recommended templates/targets.
  - Basic cohort visibility and CSV export.

## Constraints Applied

- Reuse existing `betterat_competency_*` tables for progress and review workflows.
- Add DB objects only where current architecture has no persistence anchor for module artifacts.
- Keep clinical reasoning evaluator isolated to one module in V1.

## Canonical Data Model (V1)

### Required DB additions

1. New table `betterat_module_artifacts` (required)
- Reason: module artifacts are currently local state only in `ModuleDetailBottomSheet`.
- Key model:
  - `id uuid pk`
  - `event_id uuid not null`
  - `user_id uuid not null`
  - `module_id text not null`
  - `artifact_version int not null default 1`
  - `validation_status text not null default 'unvalidated'` (`unvalidated | approved | adjusted`)
  - `content jsonb not null` (tool values + notes + attachments refs)
  - `competency_ids text[] not null default '{}'`
  - `requested_reviewer_id uuid null`
  - `reviewed_by uuid null`
  - `reviewed_at timestamptz null`
  - `coach_note text null`
  - `ai_evaluation jsonb null` (clinical reasoning only in V1)
  - `organization_id uuid null` (for cohort views/exports)
  - `created_at / updated_at`
- Uniqueness:
  - `unique (event_id, user_id, module_id, artifact_version)`

2. Column addition on `betterat_competency_attempts` (required)
- Add nullable `artifact_id uuid references betterat_module_artifacts(id) on delete set null`.
- Reason: direct join between competency attempts and module artifact that generated the attempt.

### No required DB additions for

- `betterat_competency_progress` status enum: keep existing states; V1 review state lives on artifact (`validation_status='unvalidated'`).
- `ai_coach_analysis`: not required for this thin slice because module-level evaluator payload is stored in `betterat_module_artifacts.ai_evaluation`.

## RLS Outline (Touched Tables)

### `betterat_module_artifacts`
- `select`:
  - owner (`user_id = auth.uid()`)
  - assigned reviewer (`requested_reviewer_id = auth.uid()`)
  - organization staff (`organization_memberships` role in `owner|admin|manager|coach|faculty|preceptor|instructor`, `status in active|verified`, same `organization_id`)
- `insert`:
  - owner only (`user_id = auth.uid()`)
- `update`:
  - owner can edit draft/unvalidated artifact
  - reviewer/staff can update `validation_status`, `coach_note`, `reviewed_*`

### `betterat_competency_attempts`
- Keep current policies.
- Extend preceptor/coach update policy only if role-based queue access is needed beyond `preceptor_id`.

### `organization_memberships` / `domain_catalog` / templates
- Reuse existing RLS and role checks from programs/org stack.
- No policy change unless cohort export moves server-side.

## Milestones and Exact File Paths

## Milestone 1: Student Submit Flow (core thin slice)

Goal: module artifact save + competency tagging + attempt creation + unvalidated state.

Files to add:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/types/moduleArtifacts.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/moduleArtifactService.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useModuleArtifactSubmission.ts`

Files to change:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/competency-candidates.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/competencyService.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/types/competency.ts`

DB migration files to add:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/migrations/20260306110000_create_betterat_module_artifacts.sql`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/migrations/20260306111000_add_artifact_id_to_competency_attempts.sql`

Implementation notes:
- In `ModuleDetailBottomSheet`, add submit CTA for tool modules.
- Candidate list source per module: `COMPETENCY_CANDIDATES_BY_CATALOG_V1`.
- On submit:
  - persist artifact row (`validation_status='unvalidated'`)
  - insert one competency attempt per selected competency with `artifact_id`
  - ensure progress row exists using existing competency service logic
- Keep existing local preview behavior unchanged.

## Milestone 2: Clinical Reasoning Claude Evaluator (module-specific)

Goal: evaluate only `clinical_reasoning` submissions through Edge Function and persist result.

Files to add:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/functions/clinical-reasoning-evaluate/index.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/functions/clinical-reasoning-evaluate/deno.json`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/ai/ClinicalReasoningEvaluationService.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/types/clinicalReasoningEvaluation.ts`

Files to change:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/moduleArtifactService.ts`

DB migration files (only if needed for strict typing/indexing):
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/migrations/20260306112000_add_ai_evaluation_index_to_module_artifacts.sql`

Implementation notes:
- Invoke `supabase.functions.invoke('clinical-reasoning-evaluate', { body })`.
- Persist response into `betterat_module_artifacts.ai_evaluation`.
- Do not run evaluator for other modules in V1.

## Milestone 3: Timeline Badge (`Advanced X`)

Goal: show progress signal on timeline step cards once submissions exist.

Files to change:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/TimelineStepService.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useEnrichedRaces.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/cards/TimelineGridView.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/cards/CardGridTimeline.tsx`

Implementation notes:
- Compute `advancedCount` as count of unique competencies with new attempts linked to artifacts for that step/event.
- Store lightweight badge payload in step metadata for render speed, e.g. `metadata.competency_badge = { advancedCount, unvalidatedCount }`.
- Render badge text `Advanced {N}`.

## Milestone 4: Coach Optional Flow (request + queue + decision)

Goal: reviewer workflow without changing core student flow.

Files to add:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useCoachArtifactQueue.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/competency/CoachArtifactReviewCard.tsx`

Files to change:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/app/preceptor-dashboard.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/moduleArtifactService.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/competencyService.ts`

DB migration files (only if needed):
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/migrations/20260306113000_add_module_artifact_review_indexes.sql`

Implementation notes:
- Student action: “Request review” sets `requested_reviewer_id`.
- Queue source: `betterat_module_artifacts` where `validation_status='unvalidated'` and reviewer matches.
- Decision:
  - `approve`: mark artifact approved; optionally call existing preceptor validation path for linked attempts.
  - `adjust`: keep/revert to adjusted + note.

## Milestone 5: Org/Admin Optional Flow (templates, targets, cohort visibility, export)

Goal: org overlay, not required for solo use.

Files to change:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/app/settings/organization-access.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/activityCatalog.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/ProgramService.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useActivityCatalog.ts`

Files to add:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/app/organization/competency-overview.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/OrganizationCompetencyExportService.ts`

DB changes:
- Prefer none by reusing:
  - `betterat_activity_templates` for recommended templates
  - `domain_catalog` for org-level target defaults (catalog type `metric`/`template`)
  - `organization_memberships` for cohort scoping

Implementation notes:
- Student can connect org later through existing organization access flow.
- Org can define recommended templates/targets in existing catalog/template stack.
- Cohort visibility: aggregate `betterat_module_artifacts` + competency joins by `organization_id`.
- Export: CSV from cohort query (client or service helper).

## Milestone 6: QA and Guardrails

Files to add:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/__tests__/moduleArtifactService.test.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/__tests__/ModuleDetailBottomSheet.competency-tagging.test.tsx`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/__tests__/ClinicalReasoningEvaluationService.test.ts`
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/app/__tests__/preceptor-dashboard.artifact-queue.test.tsx`

Files to change:
- `/Users/kdenney/Developer/RegattaFlow/regattaflow-app/docs/ai/v1-artifact-anchor.md` (backfill final anchors after implementation)

## Acceptance Criteria (V1)

- Student can submit `clinical_reasoning` with competency tags from module-specific candidate set.
- Submission persists and creates linked competency attempt(s) with review state `unvalidated`.
- Clinical reasoning evaluator runs through Edge Function and stores result on artifact.
- Timeline shows `Advanced X` badge for impacted step.
- Coach can review requested artifacts and set approve/adjust + note.
- Org path remains optional: solo student flow works without org membership.
- Org can view basic cohort artifact/progress list and export CSV.
