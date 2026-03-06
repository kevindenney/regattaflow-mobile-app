# V1 Artifact Anchor: Nursing Module Artifacts

Date: 2026-03-06  
Scope: canonical persistence path for module artifacts, focused on nursing modules:
- `gibbs_reflection`
- `clinical_reasoning`
- `self_assessment`
- `learning_notes`

## 1) Module-by-module persistence map

### `gibbs_reflection`
- Component file path(s):
  - [configs/nursing.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/nursing.ts:368)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:947)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1706)
- Exact Supabase insert/update call site(s):
  - None for this module flow. No `.from(...).insert/update/upsert` in the module tool path.
  - The module content only emits `onContentChange` to parent state:
    - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1978)
    - [components/cards/content/RaceSummaryCard.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/cards/content/RaceSummaryCard.tsx:669)
    - [components/races/RaceDetailContent.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/RaceDetailContent.tsx:96)
- Table name(s):
  - None currently (no persistence for this module artifact).
- Primary key strategy:
  - None currently (in-memory React state only).
- How module reloads data (select queries):
  - No Supabase `select` for this module.
  - Reload source is local component state (`toolValues[moduleId]`, `notes[moduleId]`, `attachments[moduleId]`) while the screen/component instance lives:
    - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1961)
    - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:2264)

### `clinical_reasoning`
- Component file path(s):
  - [configs/nursing.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/nursing.ts:375)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1087)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1707)
- Exact Supabase insert/update call site(s):
  - None in this module path.
- Table name(s):
  - None currently.
- Primary key strategy:
  - None currently.
- How module reloads data (select queries):
  - No Supabase `select`; local-only state rehydration inside current render tree.

### `self_assessment`
- Component file path(s):
  - [configs/nursing.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/nursing.ts:389)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1257)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1708)
- Exact Supabase insert/update call site(s):
  - None in this module path.
- Table name(s):
  - None currently.
- Primary key strategy:
  - None currently.
- How module reloads data (select queries):
  - No Supabase `select`; local-only state rehydration inside current render tree.

### `learning_notes`
- Component file path(s):
  - [configs/nursing.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/configs/nursing.ts:339)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1489)
  - [components/races/ModuleDetailBottomSheet.tsx](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/components/races/ModuleDetailBottomSheet.tsx:1709)
- Exact Supabase insert/update call site(s):
  - None in this module path.
- Table name(s):
  - None currently.
- Primary key strategy:
  - None currently.
- How module reloads data (select queries):
  - No Supabase `select`; local-only state rehydration inside current render tree.

## 2) Existing nearby canonical persistence anchors (for related data)

These are the current stable persisted anchors in the codebase that are adjacent to reflection/review workflows.

- Debrief/reflection responses (JSONB blob):
  - Table: `race_timer_sessions`
  - Select call sites:
    - [hooks/useDebriefInterview.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useDebriefInterview.ts:261)
  - Insert/update call sites:
    - [hooks/useDebriefInterview.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useDebriefInterview.ts:430)
    - [hooks/useDebriefInterview.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useDebriefInterview.ts:482)
  - Practical identity strategy in code today:
    - App resolves latest row by `(regatta_id OR race_id, sailor_id)` ordered by `end_time DESC`, then updates by session `id`.

- AI evaluations:
  - Table: `ai_coach_analysis`
  - Schema anchor:
    - [20260207100100_create_ai_coach_analysis_table.sql](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/migrations/20260207100100_create_ai_coach_analysis_table.sql:4)
  - Insert call site:
    - [services/agents/RaceAnalysisAgent.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/agents/RaceAnalysisAgent.ts:297)
  - Select call sites:
    - [services/RaceAnalysisService.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/RaceAnalysisService.ts:71)
    - [hooks/useRaceAnalysisData.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/hooks/useRaceAnalysisData.ts:288)
  - Key strategy:
    - Row `id` (UUID PK), foreign key `timer_session_id` to `race_timer_sessions.id`.

- Competency attempts and reviews:
  - Tables:
    - `betterat_competency_attempts`
    - `betterat_competency_progress`
    - `betterat_competency_reviews`
  - Schema anchor:
    - [20260226200000_competency_tracking.sql](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/supabase/migrations/20260226200000_competency_tracking.sql:60)
  - Insert/update/select call sites:
    - Attempt insert: [services/competencyService.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/competencyService.ts:234)
    - Progress select/update: [services/competencyService.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/competencyService.ts:198)
    - Faculty review insert: [services/competencyService.ts](/Users/kdenney/Developer/RegattaFlow/regattaflow-app/services/competencyService.ts:400)
  - Key strategy:
    - `betterat_competency_attempts.id` UUID PK per attempt.
    - `betterat_competency_progress` unique `(user_id, competency_id)`.
    - `betterat_competency_reviews.id` UUID PK with FK `progress_id`.

## 3) Recommended artifact key strategy

Recommendation: use `artifact_id` (UUID) as the canonical key for module artifacts, and keep a uniqueness guard composite for idempotency.

- Best primary key:
  - `artifact_id uuid primary key default gen_random_uuid()`
- Required uniqueness guard:
  - `unique (event_id, user_id, module_id, artifact_version)`
  - For v1, `artifact_version = 1` gives one canonical artifact per user+event+module.
- Why this is best:
  - Supports multiple revisions over time while preserving one canonical record for current UX.
  - Gives a single FK target for downstream tables without repeating composite columns everywhere.
  - Aligns with existing PK/FK style in `ai_coach_analysis` and competency tables.

Attach strategy by consumer:
- Competency attempts:
  - Add nullable `artifact_id` FK on `betterat_competency_attempts`.
  - Keep existing `event_id` for backward compatibility and coarse linking.
- AI evaluations:
  - Add nullable `artifact_id` FK on `ai_coach_analysis` (or dedicated `ai_module_evaluations` table if evaluations become module-granular).
  - Keep `timer_session_id` for race-level analysis continuity.
- Coach reviews:
  - Add nullable `artifact_id` FK on review rows (new module-review table or existing review domain table).
  - Continue using domain-specific IDs (`progress_id`, `session_id`) where already established.

If you need a composite-only alternative (no UUID FK), use:
- `(event_id, user_id, module_id, artifact_version)`

But this is not preferred, because every dependent table must copy all four columns and enforce referential integrity manually.
