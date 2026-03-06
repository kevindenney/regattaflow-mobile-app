# BetterAt V1 Detailed Plan: Persisted Nursing Artifacts on Timeline Home

Date: 2026-03-06
Owner: Codex implementation plan
Scope: V1 thin slice (1-2 weeks) for learner-first nursing workflow with optional coach/org overlays.

## 1) Executive Summary

V1 ships a learner-first competency feedback loop directly inside Timeline and module drawers, with no new dashboard requirement. Nursing learners can create and edit artifact drafts in existing module tools, auto-save those drafts, and explicitly trigger progress updates by tapping `Get feedback`. Only `Clinical Reasoning` runs a Claude evaluation in V1. Coach and org/admin capabilities are additive overlays, not dependencies.

What V1 ships:
- Timeline remains the default home pattern and gains subtle competency progress signals.
- Persisted module artifacts using `betterat_module_artifacts` with `event_type + event_id + user_id + module_id + artifact_version`.
- Nursing module draft auto-save for:
  - `gibbs_reflection`
  - `clinical_reasoning`
  - `self_assessment`
  - `learning_notes`
- Learner-triggered `Get feedback` action:
  - converts draft artifact into a feedback submission event
  - links artifact to selected competency candidates (from `configs/competency-candidates.ts`)
  - writes competency attempts only at submission time (drafts do not count)
  - creates/advances competency progress in existing `betterat_competency_*` flow with unvalidated state preserved.
- Clinical Reasoning evaluator (Claude via Supabase Edge Function) with structured JSON output and versioned prompt/rubric metadata.
- Timeline card chip `Advanced X` where X is calculated from competency advancements attributable to that Step submission.
- Optional coach overlay:
  - learner can request review
  - coach queue supports approve/adjust + note
- Optional org/admin overlay:
  - learner can join org later
  - org can define recommended templates/targets
  - basic cohort visibility and CSV export.

What is explicitly deferred:
- Scoring/evaluation for non-clinical-reasoning modules.
- New standalone nursing dashboard screens.
- Complex org analytics beyond basic cohort visibility/export.
- Deep transfer UI (no dedicated transfer screen in V1).
- High-automation coach assignment/routing logic.
- Full offline sync conflict engine (V1 uses pragmatic draft queue + retry).

Success criteria for V1:
- A nursing learner can complete a full loop solo: draft -> get feedback -> competency progression visible on Timeline.
- The same flow still works with no coach and no org membership.
- Coach/org overlays can be turned on later without refactoring learner core.

## 2) UX Specification by Persona

### Learner (solo-first)

Primary jobs-to-be-done:
- Capture reflective evidence quickly in the Step they are already in.
- Understand what competency areas the artifact maps to.
- Decide when a draft should count toward progress.
- Receive calm, specific feedback from AI (clinical reasoning only in V1).

Key screens/routes in V1 (current files):
- Timeline home + step cards:
  - `app/(tabs)/races.tsx`
  - `components/cards/TimelineGridView.tsx`
  - `components/cards/CardGridTimeline.tsx`
- Config-driven module tiles:
  - `components/cards/content/phases/ConfigDrivenPhaseContent.tsx`
- Module drawer + nursing tools:
  - `components/races/ModuleDetailBottomSheet.tsx`
- Nursing module definitions:
  - `configs/nursing.ts`
- Candidate competency sets:
  - `configs/competency-candidates.ts`

Happy path (learner):
1. Learner opens Timeline Step from home.
2. Learner opens `clinical_reasoning` in module drawer.
3. Draft auto-saves silently while typing.
4. Learner sees `Maps to` competency candidates scoped to this module.
5. Learner taps `Get feedback`.
6. App persists submission event, creates competency attempt links, invokes Claude evaluator.
7. Learner returns to Timeline and sees `Advanced X` chip on Step card.
8. Learner optionally taps `Request coach review` if connected to coach/org.

Edge cases:
- Offline while drafting: keep local pending write queue; show `Saved locally` status; sync when online.
- No coach connected: `Get feedback` still works; `Request review` hidden/disabled with calm copy.
- No org connected: all learner functions still work; org features absent.
- No internet on `Get feedback`: submission queued, user sees `Will send when online`.
- Partial drafts: drafts remain editable and do not create attempts/progress until submit.

Microcopy principles:
- Calm and non-bureaucratic: “Saved”, “Ready for feedback”, “Needs one more pass”.
- Avoid institutional jargon in core learner path.
- Keep prompts action-oriented and short.
- Never imply failure for draft states.

### Coach

Primary jobs-to-be-done:
- See only review requests relevant to them.
- Quickly approve/adjust with one practical note.
- Keep learner momentum without heavy workflow friction.

Key screens/routes in V1 (current files):
- Existing review foundations:
  - `app/preceptor-dashboard.tsx`
  - `components/competency/PreceptorValidationCard.tsx`
- Competency service layer:
  - `services/competencyService.ts`
- New artifact queue screen (planned):
  - `app/coach/artifact-queue.tsx` (new)

Happy path (coach):
1. Coach opens review queue route.
2. Sees pending artifact cards with module, Step, learner, mapped competencies.
3. Opens artifact details and evaluator output (for clinical reasoning).
4. Chooses `Approve` or `Adjust`, adds note.
5. Decision updates queue status and linked competency progression state.

Edge cases:
- Coach offline: queue is read-only cached view with retry for decisions.
- Missing evaluator output: card still reviewable using learner artifact content.
- Learner edited after request: queue shows newer draft/version indicator.

Microcopy principles:
- Use coaching tone, not compliance tone.
- Action labels: `Approve`, `Adjust`, `Add note`.
- Keep feedback suggestions concise and specific.

### Org Admin

Primary jobs-to-be-done:
- Allow late connection of learners to org context.
- Configure recommended templates/targets by domain.
- View cohort-level progress and export lightweight reports.

Key screens/routes in V1 (current files):
- Organization access and membership:
  - `app/settings/organization-access.tsx`
- Program/institution workspace home:
  - `app/(tabs)/programs-experience.tsx`
- Program/org data services:
  - `services/ProgramService.ts`
  - `services/activityCatalog.ts`

Happy path (org admin):
1. Admin configures recommended template/target set for nursing.
2. Learners optionally join org and retain existing solo history.
3. Admin opens cohort visibility page and filters by module/competency.
4. Admin exports CSV.

Edge cases:
- Learner never joins org: not shown in cohort views.
- Cross-org memberships: scope by active org only.
- Export on large cohorts: paginate and stream CSV rows.

Microcopy principles:
- Administrative copy should be concise and practical.
- Distinguish `recommended` from `required` in V1.

## 3) UX Details for Timeline as Home (Per Interest)

Timeline Step card changes:
- Nursing:
  - Add chip `Advanced X` when at least one competency advancement was created from Step submissions.
  - Optional secondary chip `Feedback pending` when learner submitted but no coach decision yet.
  - Keep existing status chips (`PLANNED`, `DONE`, etc.) intact.
- Sailing:
  - No behavior break; existing flow remains.
  - If competency candidates are present for sailing modules, same `Advanced X` chip logic applies silently.

Likely files:
- `components/cards/TimelineGridView.tsx`
- `components/cards/CardGridTimeline.tsx`
- `app/(tabs)/races.tsx`

Module drawer behavior:
- Existing nursing modules remain in `configs/nursing.ts` and render in `ModuleDetailBottomSheet`.
- Drawer adds sections in this order:
  1. Existing module tool UI
  2. `Maps to` competency candidates (module-scoped)
  3. Submission actions (`Get feedback`, optional `Request review`)
  4. Existing AI Coach / Network / History sections.

Where `Maps to` appears:
- In `components/races/ModuleDetailBottomSheet.tsx`, immediately under tool body and above AI Coach card.

Where `Get feedback` appears:
- In `components/races/ModuleDetailBottomSheet.tsx`, sticky bottom action row (primary CTA).

How `Advanced X` is calculated:
- Per Step (`event_type`, `event_id`, `user_id`), compute distinct competencies that gained a new attempt from submitted artifacts since the previous baseline.
- V1 pragmatic calculation:
  - distinct `competency_id` in `betterat_competency_attempts` where `artifact_id` links to artifact rows for that Step and submission window.
- Display:
  - chip text `Advanced {X}`
  - hidden when `X = 0`.

How cross-interest transfer sparks appear:
- Rare, single-line, no new screen.
- Example: `Transfer spark: your race debrief consistency supports clinical handoff clarity.`
- Render only when confidence threshold passes and not shown recently.
- Surface location:
  - one-line hint under `Advanced X` on Timeline card or inside module drawer header (choose one in implementation; no extra route).

## 4) Data Model and Supabase Schema Plan

Confirmed base artifact table:
- `betterat_module_artifacts`
- Key: `(event_type,event_id,user_id,module_id,artifact_version)` unique.
- RLS: owner `select/insert/update`.

Additional schema needed for V1 thin slice:

### A) Artifact-competency links (required)

New table: `betterat_module_artifact_competencies`
- `id uuid pk default gen_random_uuid()`
- `artifact_id uuid not null references betterat_module_artifacts(artifact_id) on delete cascade`
- `competency_id uuid not null references betterat_competencies(id) on delete cascade`
- `link_source text not null check (link_source in ('student_selected','ai_suggested'))`
- `confidence numeric null`
- `is_primary boolean not null default false`
- `created_at timestamptz not null default now()`
- `unique(artifact_id,competency_id,link_source)`

Rationale:
- Keeps candidate selection queryable and auditable.
- Avoids parsing `content` JSON for reporting.

### B) Artifact evaluations (required for Claude output)

New table: `betterat_module_artifact_evaluations`
- `evaluation_id uuid pk default gen_random_uuid()`
- `artifact_id uuid not null references betterat_module_artifacts(artifact_id) on delete cascade`
- `provider text not null default 'anthropic'`
- `model text not null`
- `module_id text not null`
- `status text not null check (status in ('succeeded','failed','timeout'))`
- `prompt_version text not null`
- `rubric_version text not null`
- `candidate_set_version text not null`
- `request_payload jsonb not null default '{}'::jsonb`
- `response_payload jsonb not null default '{}'::jsonb`
- `error_message text null`
- `latency_ms int null`
- `created_at timestamptz not null default now()`

Rationale:
- Separate immutable evaluation history from mutable artifact content.
- Enables prompt/rubric experimentation and replay.

### C) Coach review requests / queue (required for optional coach overlay)

New table: `betterat_module_artifact_reviews`
- `review_id uuid pk default gen_random_uuid()`
- `artifact_id uuid not null references betterat_module_artifacts(artifact_id) on delete cascade`
- `requester_user_id uuid not null`
- `requested_reviewer_user_id uuid null`
- `organization_id uuid null`
- `status text not null check (status in ('pending','in_review','approved','adjusted','cancelled'))`
- `review_note text null`
- `requested_at timestamptz not null default now()`
- `resolved_at timestamptz null`
- `resolved_by_user_id uuid null`

Rationale:
- Keeps coach queue independent from faculty-only `betterat_competency_reviews` semantics.
- Allows learner-only mode with no review rows.

### D) Org templates / targets (optional in V1)

Prefer reuse, no new table initially:
- `betterat_activity_templates` via `services/activityCatalog.ts`
- `domain_catalog` via `services/ProgramService.ts`
- Put nursing competency target metadata in `domain_catalog.metadata`.

### Reuse of existing competency tables

- Continue using:
  - `betterat_competency_attempts`
  - `betterat_competency_progress`
  - `betterat_competency_reviews`
- Add nullable `artifact_id uuid` to `betterat_competency_attempts` if not present.
- Draft autosaves do not write attempts.
- `Get feedback` writes attempts and updates progress.

RLS policy outline for touched tables:
- `betterat_module_artifacts`: owner read/write; optional reviewer read via join to review table.
- `betterat_module_artifact_competencies`: owner read/write; reviewer read when artifact in pending review.
- `betterat_module_artifact_evaluations`: owner read; insert by service role/edge function; reviewer read on assigned items.
- `betterat_module_artifact_reviews`: owner create/read; assigned reviewer read/update; org staff read by membership role.
- `betterat_competency_attempts`: preserve existing owner/preceptor access and extend with artifact-linked joins only if needed.

## 5) Claude Evaluator Design (Clinical Reasoning Only)

Edge function:
- Name: `clinical-reasoning-evaluate`
- Location: `supabase/functions/clinical-reasoning-evaluate/index.ts`
- Provider: Anthropic Claude (through Edge function runtime secret).

Input contract:
- `artifact_id`
- `event_type`
- `event_id`
- `user_id`
- `module_id` (must equal `clinical_reasoning` in V1)
- `artifact_content` (normalized tool values)
- `interest_slug`
- `candidate_competency_ids` (from module candidate set only)
- `prompt_version`
- `rubric_version`

Output contract (structured JSON):
- `status`: `succeeded | failed | timeout`
- `overall_assessment`: `developing | proficient | advanced`
- `dimension_scores`: array of `{dimension,score,reason}`
- `recommended_competency_links`: array of `{competency_id,confidence,reason}`
- `next_best_actions`: string[] (max 3)
- `confidence`: number (0-1)
- `safety_flags`: string[]
- `model`: string

Prompt shape:
- System prompt enforces nursing-safe, educational, non-diagnostic feedback.
- Rubric prompt uses explicit dimensions for clinical reasoning quality.
- Candidate competency titles/descriptions are injected from `configs/competency-candidates.ts` lookup only.

Candidate set strategy:
- Resolve module-specific set from `NURSING_COMPETENCY_CANDIDATES_V1`.
- Never evaluate against entire nursing catalog.
- Reject evaluator call if candidate set is empty or unresolved.

Storage and versioning:
- Persist full evaluator result in `betterat_module_artifact_evaluations`.
- Persist selected AI links into `betterat_module_artifact_competencies` with `link_source='ai_suggested'`.
- Persist quick summary snapshot into artifact `content` for UI rendering convenience.
- Required version fields each run:
  - `prompt_version`
  - `rubric_version`
  - `candidate_set_version`.

Failure handling and retries:
- Timeouts/failures persist failed evaluation row with `error_message`.
- UI shows `Couldn’t evaluate right now. Try again.`
- Retry policy: exponential backoff client retry for transient errors, max 2 immediate retries.
- Non-retryable errors (bad payload/schema mismatch) stop with actionable message.

## 6) Cross-Interest Transfer Design (Automatic and Subtle)

Minimal hidden meta-skill tags (V1):
- `reflection_depth`
- `decision_clarity`
- `pattern_detection`
- `communication_precision`
- `self_calibration`
- `adaptation_under_uncertainty`

Generation rules:
- Generate tags at artifact submit time from evaluator output and rule-based heuristics.
- Show transfer spark only when:
  - confidence >= threshold (e.g., 0.75)
  - novel relative to recent sparks
  - not shown in last N steps.
- Stay silent when confidence low or repetitive.

Data location:
- Store transfer tags on artifact-level metadata in `betterat_module_artifacts.content.transfer_tags`.
- Keep long-term transfer profile derived, not primary-stored in V1.

Influence on nursing next best action:
- Re-rank `next_best_actions` by transfer tag affinity from recent non-nursing steps.
- No new UI surface required; effects appear as slightly better suggestions in existing `Get feedback` result summary.

## 7) Milestone Plan (Build-to Checklist)

### Milestone 1: Artifact draft persistence plumbing
Goal:
- Persist drafts from nursing module tools in `betterat_module_artifacts`.

Files to add/change:
- Add: `types/moduleArtifacts.ts`
- Add: `services/moduleArtifactService.ts`
- Add: `hooks/useModuleArtifacts.ts`
- Change: `components/races/ModuleDetailBottomSheet.tsx`
- Change: `components/cards/content/RaceSummaryCard.tsx`
- Change: `components/races/RaceDetailContent.tsx`

DB migrations:
- None if base `betterat_module_artifacts` migration is already applied to target DB.

Acceptance criteria:
- Editing nursing modules creates/updates draft artifacts.
- Re-opening drawer reloads latest draft for same `(event_type,event_id,user_id,module_id)`.
- No competency attempts are created during draft edits.

Rollback:
- Feature flag draft load/save hook; disable to restore local-only behavior.

### Milestone 2: Candidate mapping UI (`Maps to`)
Goal:
- Show scoped competency candidates in module drawer.

Files to add/change:
- Change: `components/races/ModuleDetailBottomSheet.tsx`
- Change: `configs/competency-candidates.ts`
- Add: `lib/competencies/candidateResolver.ts`

DB migrations:
- None.

Acceptance criteria:
- `Maps to` list appears for nursing target modules.
- Candidate list uses module-scoped set only.

Rollback:
- Hide `Maps to` panel behind feature flag.

### Milestone 3: `Get feedback` submission and competency attempt writes
Goal:
- Drafts count only on learner submission.

Files to add/change:
- Change: `components/races/ModuleDetailBottomSheet.tsx`
- Change: `services/competencyService.ts`
- Change: `hooks/useCompetencyProgress.ts`
- Add: `services/artifactSubmissionService.ts`

DB migrations:
- Add: `supabase/migrations/<ts>_create_betterat_module_artifact_competencies.sql`
- Add: `supabase/migrations/<ts>_add_artifact_id_to_betterat_competency_attempts.sql`

Acceptance criteria:
- Tapping `Get feedback` creates linked artifact-competency rows.
- Competency attempts/progress update only at submit.
- Submission state is unvalidated by default.

Rollback:
- Keep attempts write path behind runtime flag; disable writes and retain draft save.

### Milestone 4: Claude clinical reasoning evaluator
Goal:
- Evaluate only `clinical_reasoning` submissions.

Files to add/change:
- Add: `supabase/functions/clinical-reasoning-evaluate/index.ts`
- Add: `services/ai/ClinicalReasoningEvaluationService.ts`
- Add: `types/clinicalReasoningEvaluation.ts`
- Change: `components/races/ModuleDetailBottomSheet.tsx`

DB migrations:
- Add: `supabase/migrations/<ts>_create_betterat_module_artifact_evaluations.sql`

Acceptance criteria:
- Successful evaluator run stores versioned output.
- Failed run stores failure record and shows retry UX.
- Non-clinical-reasoning modules are not evaluated.

Rollback:
- Disable evaluator invocation; submission still logs attempts.

### Milestone 5: Timeline chips (`Advanced X`, pending feedback)
Goal:
- Surface lightweight progress on Step card.

Files to add/change:
- Change: `components/cards/TimelineGridView.tsx`
- Change: `components/cards/CardGridTimeline.tsx`
- Change: `hooks/useEnrichedRaces.ts`
- Change: `services/TimelineStepService.ts`

DB migrations:
- None required; use existing artifact + attempts joins.

Acceptance criteria:
- Chip appears only when Step has advancements.
- Chip updates after submit and refresh.
- Sailing cards are not regressed.

Rollback:
- Guard chips with flag and fallback to existing card rendering.

### Milestone 6: Coach review request and queue
Goal:
- Optional coach overlay with approve/adjust + note.

Files to add/change:
- Add: `services/moduleArtifactReviewService.ts`
- Add: `hooks/useModuleArtifactReviewQueue.ts`
- Add: `app/coach/artifact-queue.tsx`
- Change: `components/races/ModuleDetailBottomSheet.tsx`
- Change: `app/preceptor-dashboard.tsx`

DB migrations:
- Add: `supabase/migrations/<ts>_create_betterat_module_artifact_reviews.sql`

Acceptance criteria:
- Learner can request review.
- Coach sees assigned pending items.
- Coach approve/adjust updates review status and note.

Rollback:
- Hide request/queue entry points with flag.

### Milestone 7: Org optional templates/targets + cohort export
Goal:
- Org-level recommendations and cohort visibility/export without blocking learner.

Files to add/change:
- Change: `services/activityCatalog.ts`
- Change: `services/ProgramService.ts`
- Change: `app/(tabs)/programs-experience.tsx`
- Add: `app/organization/competency-cohort.tsx`
- Add: `services/OrganizationCompetencyExportService.ts`

DB migrations:
- Prefer none; reuse `betterat_activity_templates` and `domain_catalog`.

Acceptance criteria:
- Org can define recommendation metadata.
- Cohort view filters by org.
- CSV export works for filtered cohort rows.

Rollback:
- Route hidden; underlying learner flow unaffected.

### Milestone 8: Transfer sparks + hardening
Goal:
- Add subtle cross-interest transfer hints and stabilize V1.

Files to add/change:
- Change: `components/cards/TimelineGridView.tsx`
- Change: `components/races/ModuleDetailBottomSheet.tsx`
- Add: `lib/transfer/transferSparkService.ts`
- Add: `hooks/useTransferSpark.ts`

DB migrations:
- None; tags stored in artifact content JSON in V1.

Acceptance criteria:
- Sparks appear rarely and only when threshold met.
- No new screens added.
- No noticeable feed noise.

Rollback:
- Disable spark computation/rendering with flag.

## 8) QA Plan

Manual checklist:
- Learner
  - Create nursing Step, open each target module, type content, verify draft autosave.
  - Close/reopen app and confirm draft recovery.
  - Tap `Get feedback` and verify attempts/progress update once.
  - For `clinical_reasoning`, verify evaluator output appears and persists.
  - Confirm no coach/org required for full loop.
- Coach
  - Request review from learner account.
  - Verify queue visibility and decision actions from coach account.
  - Confirm approve/adjust note persists and removes from pending queue.
- Org admin
  - Join learner to org after solo usage and verify history still visible.
  - Configure recommendation metadata and verify it influences candidate ordering.
  - Export cohort CSV with expected columns.

Regression risks:
- Timeline step type discrimination (`event_type/event_id` derivation).
- RLS policy collisions with existing auth patterns.
- Existing sailing timeline rendering and module behavior.
- Competency flows currently used by preceptor/faculty dashboards.
- Edge function failures causing blocking UI states.

Performance considerations:
- Debounce draft saves (e.g., 400-800ms) to avoid write storms.
- Batch fetch artifact summaries for visible steps only.
- Cap candidate list per module (already scoped in config).
- Paginate coach queue and org cohort queries.

## 9) Open Questions and Risks

Open questions:
- How should `event_type`/`event_id` map from current Step entities across all interests?
- Is there an existing canonical `timeline_step` UUID for every rendered step in nursing, or do some flows still rely on `regatta` IDs?
- Should coach decisions write into `betterat_competency_reviews` in V1, or remain artifact-level until faculty workflow is explicitly invoked?
- Which org roles can review artifact-level items by default (`coach`, `faculty`, `preceptor` all?)
- Should evaluator invocation happen synchronously on submit or via queued background job?

Risks:
- Target DB may not yet have artifact migration applied (currently observed as missing table in remote check).
- RLS rules for new review tables can block queue reads if org membership joins are incomplete.
- Inconsistent route usage between `races` and `programs-experience` may fragment timeline-home expectations.

Default decisions to unblock implementation:
- Default `event_type = 'timeline_step'` for new nursing submissions unless explicit step identity is missing.
- If timeline step ID unavailable, fallback to `event_type='regatta'` + event UUID and log warning.
- Keep coach review artifact-level in V1; do not auto-write faculty review rows.
- Restrict evaluator to `clinical_reasoning` hard check in service and edge function.
- Feature flag each milestone (`ARTIFACT_DRAFTS_V1`, `CLINICAL_REASONING_EVAL_V1`, `COACH_ARTIFACT_QUEUE_V1`, `TRANSFER_SPARKS_V1`).

