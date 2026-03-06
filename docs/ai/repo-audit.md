# Repo Audit: Timeline/Step/Artifact Integration (Nursing Competency Model)

## 1) App structure (navigation, key screens)

### Root navigation shell
- `app/_layout.tsx`
  - Root providers: auth, interest, organization, query client, etc.
  - Root `Stack` router container.
- `app/index.tsx`
  - Entry routing/redirect logic (signed-in vs guest, last-tab behavior).

### Tab navigation
- `app/(tabs)/_layout.tsx`
  - Expo Router `Tabs` setup.
  - Tab visibility by persona/capabilities.
- `lib/navigation-config.ts`
  - Single source of truth for tab labels/routes and drawer/sidebar labels.
  - Learner tabs currently: `races`, `connect`, `learn`, `reflect`, `search`.
  - Learner timeline tab label standardized to `Timeline`.

### Key learner screens
- `app/(tabs)/races.tsx` — Timeline (plan/act/review step cards).
- `app/(tabs)/connect.tsx` — people/forums/organizations social surface.
- `app/(tabs)/learn.tsx` — courses/coaches + org-scoped cohort/templates views.
- `app/(tabs)/reflect.tsx` — progress/log/profile reflection surface.
- `app/(tabs)/search.tsx` — search/discovery.

### Key org/admin surfaces relevant to nursing
- `app/(tabs)/programs-experience.tsx` and `app/(tabs)/programs.tsx` (Programs & Placements workspace routes in tab config).
- `app/settings/organization-access.tsx` — org membership/invite/access control screen.
- `app/organization/[slug].tsx` — organization public/member page.
- `app/organization/home.tsx` — organization home routing target.

---

## 2) Timeline screen implementation (tree, data, state)

### Primary file
- `app/(tabs)/races.tsx`

### High-level component tree (main timeline path)
- `RacesScreen` (`app/(tabs)/races.tsx`)
  - `RacesFloatingHeader` (`components/races/RacesFloatingHeader.tsx`)
  - `RaceListSection` (`components/races/RaceListSection.tsx`)
    - Card rendering via shared card system (`components/cards/*`)
    - Summary card path includes `RaceSummaryCard` (`components/cards/content/RaceSummaryCard.tsx`)
      - Artifact/detail drawer: `ModuleDetailBottomSheet` (`components/races/ModuleDetailBottomSheet.tsx`)
      - Collaboration UI: `CrewHub`, `RaceChatDrawer`, `CollaborationPopover`
  - Optional grid mode: `TimelineGridView` (`components/cards/TimelineGridView.tsx`)

### Data sources used by timeline
- Main timeline list and ownership/collab merging:
  - `hooks/useRaceResults.ts`
    - Reads from `regattas`, `race_events`, `race_timer_sessions`, `race_collaborators`, `race_results`.
- Guest timeline data:
  - `hooks/useGuestRaces.ts`
- Enrichment layer:
  - `hooks/useEnrichedRaces.ts`
    - Reads `sailing_venues` for coordinate fallback.
- Derived list state:
  - `hooks/useRaceListData.ts` (normalization/next race/past ids)
- Layout derivation:
  - `hooks/useRaceLayoutData.ts`

### State management patterns in timeline
- Local React state in `app/(tabs)/races.tsx` for view mode, modal states, quick-start, selection, etc.
- Hook-computed memoized derivatives (`useMemo`, `useCallback`).
- Auth/interest/org context via providers:
  - `providers/AuthProvider.tsx`
  - `providers/InterestProvider.tsx`
  - `providers/OrganizationProvider.tsx`
- Data fetching/mutations use Supabase directly + custom hooks.
- TanStack Query is used in the app (root provider exists), but `races.tsx` timeline flow is still largely hook/service driven rather than a single consolidated query module.

---

## 3) Current domain model for Term / Step / Artifact

### Term
- No explicit `Term` type/interface found by name in `types/`, `app/`, `services/`, or `hooks/`.
- Closest existing concept: `Season` in `types/season.ts` (+ `useSeason*` hooks in timeline).

### Step
There are two active step models in-repo:

1. Race/Event-backed step model (currently driving Timeline UI)
- In `app/(tabs)/races.tsx` and `hooks/useRaceResults.ts`.
- Backed by `regattas` and `race_events` rows (with source fallback logic).

2. Generic timeline step model (parallel model)
- Types: `types/timeline-steps.ts` (`TimelineStepRecord`, create/update inputs, map feed types).
- Service: `services/TimelineStepService.ts`.
- Backed by `betterat_timeline_steps` table.

### Artifact (Gibbs, Clinical Reasoning, Self-Assessment, Notes)
- Artifact/module ids and config contracts:
  - `types/raceCardContent.ts`
  - `types/interestEventConfig.ts`
  - `configs/nursing.ts` (nursing module lists include `gibbs_reflection`, `clinical_reasoning`, `self_assessment`, `learning_notes`)
- Artifact rendering/workspace:
  - `components/races/ModuleDetailBottomSheet.tsx`
  - Tool registry binds module ids to tool components (`gibbs_reflection`, `clinical_reasoning`, `self_assessment`, `learning_notes`).

What is not fully confirmed from this audit pass:
- Exact persistence schema path for each artifact’s in-module content save operation from `ModuleDetailBottomSheet` into DB tables.

---

## 4) Supabase setup, auth flow, timeline DB usage, RPC/edge

### Supabase client setup
- `services/supabase.ts`
  - `createClient(...)`
  - env resolution: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - storage adapters for web/native session persistence.

### Auth flow
- `providers/AuthProvider.tsx`
  - Session bootstrapping, auth state changes, profile fetch, persona/capability context.
  - Uses `supabase.auth` and profile/user table lookups.

### Timeline-related tables currently used
From `app/(tabs)/races.tsx` + `hooks/useRaceResults.ts` + related timeline hooks/services:
- `regattas`
- `race_events`
- `race_results`
- `race_timer_sessions`
- `race_collaborators`
- `race_marks`
- `sailing_venues` (enrichment support)
- `users` (timeline owner display reads in `races.tsx`)

Parallel/new timeline model:
- `betterat_timeline_steps` (`services/TimelineStepService.ts`)

Catalog/templating used by Learn + add-step suggestion flow:
- `betterat_activity_templates`
- `betterat_activity_enrollments`

Competency model tables already present:
- `betterat_competencies`
- `betterat_competency_progress`
- `betterat_competency_attempts`
- `betterat_competency_reviews`

### Timeline-collaboration RPCs found
- `create_race_collaborator_invite` (`services/RaceCollaborationService.ts`)
- `join_race_by_invite_code` (`services/RaceCollaborationService.ts`)
- `create_direct_invite` (`services/RaceCollaborationService.ts`)

### Edge functions
- Supabase functions directory: `supabase/functions/*`
- Relevant deployed function folders include (examples):
  - `race-analysis`
  - `race-coaching-chat`
  - `refresh-race-suggestions`
  - `send-email`
  - `extract-race-details`
  - `create-checkout-session`
- This audit did not find a timeline-specific edge function directly invoked from `app/(tabs)/races.tsx`.

---

## 5) Styling system

### UI component system
- Primary UI kit location: `components/ui/*`
  - Includes primitives and composed controls (button/input/modal/toast/card/etc).

### Theming/tokens
- `components/ui/gluestack-ui-provider/config.ts`
  - Theme variable definitions (light/dark) via NativeWind `vars(...)`.
- `tailwind.config.js`
  - NativeWind + gluestack plugin integration; color token mappings.
- `global.css`
  - global web styles.
- Additional design token files:
  - `lib/design-tokens.ts`
  - `lib/design-tokens-ios.ts`

---

## 6) Recommended integration points (competencies, evidence links, progress)

### (a) Competencies catalog integration
- Existing competency data layer is ready:
  - `services/competencyService.ts`
  - `types/competency.ts`
  - `hooks/useCompetencyProgress.ts`
- Timeline integration seam:
  - `components/races/ModuleDetailBottomSheet.tsx` (artifact tool context per step)
  - `configs/nursing.ts` (module availability and phase module sets)
- Learn/org integration seam:
  - `app/(tabs)/learn.tsx` + `services/activityCatalog.ts`
  - `app/organization/[slug].tsx` for org-level public/member surfaces.

### (b) Evidence links integration
- Artifact/tool execution point:
  - `components/races/ModuleDetailBottomSheet.tsx`
- Content model/config seam:
  - `types/raceCardContent.ts`
  - `types/interestEventConfig.ts`
  - `configs/nursing.ts`
- Step-level persistence seam:
  - `app/(tabs)/races.tsx` update/create pathways
  - `hooks/useRaceResults.ts` source-table handling (`regattas` vs `race_events`)
  - optional migration seam: `services/TimelineStepService.ts` (`betterat_timeline_steps`).

### (c) Progress calculation integration
- Existing progress implementation surfaces:
  - timeline ordering/status in `app/(tabs)/races.tsx`
  - competency summary in `services/competencyService.ts` + `hooks/useCompetencyProgress.ts`
  - reflection/progress UI in `app/(tabs)/reflect.tsx`
- Likely consolidation seam:
  - standardize step completion/progress semantics across:
    - race/event timeline model (`regattas`/`race_events`)
    - competency progression (`betterat_competency_*`)
    - optional unified timeline table (`betterat_timeline_steps`).

---

## Key files to touch
app/(tabs)/races.tsx
components/cards/content/RaceSummaryCard.tsx
components/races/ModuleDetailBottomSheet.tsx
configs/nursing.ts
types/interestEventConfig.ts
types/raceCardContent.ts
hooks/useRaceResults.ts
hooks/useEnrichedRaces.ts
hooks/useRaceListData.ts
services/competencyService.ts
hooks/useCompetencyProgress.ts
types/competency.ts
app/(tabs)/learn.tsx
services/activityCatalog.ts
types/activities.ts
app/organization/[slug].tsx
providers/AuthProvider.tsx
providers/InterestProvider.tsx
providers/OrganizationProvider.tsx
services/supabase.ts
lib/navigation-config.ts

---

## Missing pieces / ambiguities (questions)
1. Should nursing Timeline remain on `regattas`/`race_events`, or be migrated to `betterat_timeline_steps` as the single Step source?
2. What is the canonical `Term` entity for nursing (semester/cohort/block), since no explicit `Term` type exists today?
3. What is the canonical persistence target for artifact payloads from `ModuleDetailBottomSheet` (which table(s) should be source of truth)?
4. For competency progress, should completion be driven by artifact submissions per step, faculty reviews, or both?
5. Should org-published templates in Learn auto-materialize into Timeline steps, or remain opt-in via enroll action?
6. For evidence links (files/notes/media), what relationship model is expected: per-step, per-artifact, or per-competency-attempt?
