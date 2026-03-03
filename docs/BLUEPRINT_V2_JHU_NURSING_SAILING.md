# Blueprint v2 (JHU Nursing + Sailboat First)

Generated: 2026-03-03
Status: Execution-ready

## 1) Platform Architecture

- Core layer: users, personas, organizations, memberships, roles, programs, sessions, enrollments, assessments, messaging.
- Domain layer: sailing and nursing packs provide vocabulary, templates, role presets, metrics, action menus.
- Presentation layer: shared route skeleton with domain-specific labels/components resolved from org + interest context.

### Domain Resolution Contract (Hard Rule)

1. Authorization and API domain gating are controlled by `organizations.organization_type` (authoritative).
2. Vocabulary, labels, and recommendations are controlled by `active_interest_id` (presentation).
3. If values disagree:
   - Security behavior follows `organization_type`.
   - UI may personalize copy via `active_interest_id` only where not security-sensitive.
4. Non-club orgs must never access sailing-only endpoints/tools.

## 2) Core Data Model

- Existing: `organizations`, `organization_memberships`.
- New core entities:
  - `programs`: `id, organization_id, domain, title, type, status, start_at, end_at, metadata, domain_pack_version`.
  - `program_sessions`: program meeting/rotation/race/sim blocks.
  - `program_participants`: learner/staff assignments in program scope.
  - `competencies`: normalized skill outcomes by domain.
  - `assessment_records`: evaluator, participant, competency, score/rubric snapshot, notes, evidence refs.
  - `communication_threads`: cohort/program announcements + comments + read state.
  - `templates`: reusable program/session/checklist/assessment definitions.
  - `domain_catalog`: vocabulary/labels/allowed role types/versioning.

### Assessment Record Normalization Contract

- Store immutable rubric snapshot at evaluation time.
- Store score payload separately from rubric text.
- Store evidence refs (attachment ids/urls) separately from narrative notes.
- Keep evaluator free-text and action plan as distinct fields.

## 3) Role Matrix (Core)

- `owner/admin`: policy, staffing, template governance, org-wide visibility.
- `manager/coordinator`: scheduling, assignments, communications.
- `coach/faculty/preceptor/instructor`: delivery, assessment, feedback.
- `learner/member/student`: participation, reflection/evidence submission.
- `guest`: scoped read-only.

## 4) Route Map (Shared Skeleton)

- `/events`: workspace dashboard.
- `/members`: people directory + assignments.
- `/race-management`: compatibility alias.
- `/programs`: canonical route.
- `/profile`: organization profile/governance.
- `/settings/organization-access`: access policy + invite flow.
- `/account`: personal settings.

### Route Alias Deprecation Plan (`/race-management`)

1. Phase now: keep full alias support.
2. Trigger to redirect-only: when `<5%` of program-entry navigation uses alias for 14 consecutive days.
3. Trigger to remove alias: 30 days after redirect-only, with release-note callout.

## 5) Domain Pack: Nursing (Primary)

- Replace race entities with cohorts/rotations/sim/evaluations.
- Ops toolkit: safety checklist, assessment templates, rotation templates, roster import.
- Invite roles: persisted role presets + invite-token flow.
- Faculty/preceptor views: queue, competency sign-off, cadence, remediation flags.

## 6) Domain Pack: Sailing (Primary)

- Preserve race workflows as true sailing pack.
- Sailing AI endpoints callable only in sailing org context.
- Sailwave/weather/course tools visible/executable only in sailing mode.

## 7) Coach Experience (Cross-Domain Shell)

- Coach Home: assigned groups/programs, due assessments, unread threads.
- Session Builder: objectives, checklist, attendance, quick notes.
- Feedback Loop: rubric + narrative + action plan.
- Progress View: competency trend by learner/time.

### Performance/SLO Guardrails

- Coach Home P95 API latency target: <= 600ms for orgs up to 5k participants.
- Required indexes and query plans must be documented for:
  - due assessments
  - unread threads
  - program-scoped participant summaries

## 8) Secondary Validation Packs

- Canonical secondary packs for this plan: `drawing`, `golf`.
- Reuse core tables with domain templates/vocabulary.
- Add `fitness` only via explicit blueprint revision, not ad hoc.

## 9) Execution Plan with Acceptance Gates

### Phase 1 (In Flight)

- Remove mixed-domain nursing/institution UI copy.
- Gate race-only APIs/components for non-sailing domains.

Acceptance:
- No nursing route contains sailing-first copy in contract tests.
- Unauthenticated probes to AI endpoints return `401/405/403`, never `500`.

### Phase 2

- Introduce `programs`, `program_sessions`, `program_participants`.
- Migrate mock program UI to real data.

Acceptance:
- Program CRUD + assignment flow backed by real tables.
- RLS enforced for read/write by role and org type.

### Phase 3

- Implement coach shell + assessment records for nursing and sailing.

Acceptance:
- Program-scoped coach dashboards and drill-downs working.
- Assessment visibility matrix enforced (learner self; assigned staff; owner/admin org-wide).

### Phase 4

- Add drawing and golf domain packs.

Acceptance:
- Domain packs use shared skeleton/routes and pass domain-gating contracts.

## 10) RLS Contract Matrix (Minimum)

- `programs`: org members scoped by role and org.
- `program_sessions`: scoped to program visibility + session ownership rules.
- `program_participants`: learner self + assigned staff + admin governance.
- `assessment_records`: shipped hardened matrix retained.
- `communication_threads`: membership/program-scope read, role-scoped write.
- `templates`: read by program scope, write by governance roles.

Every table above must have:
- policy-name ownership in canonical migration files,
- contract tests for critical role paths,
- integration validation signature checks.

## 11) Feature Flags and Rollback

- Flags:
  - `program_data_model_v1`
  - `coach_shell_v1`
  - `domain_gate_ai_strict_v1`
  - `secondary_packs_v1`
- Rollback rule:
  - disable flag first,
  - preserve data shape,
  - keep read-only access path if write path disabled.

## 12) Ownership and Runbook

- Product owner: domain-pack prioritization and deprecation dates.
- Platform owner: schema, RLS, migration ordering.
- App owner: route parity, copy integrity, onboarding guards.
- CI owner: gate coverage, smoke reliability, artifact quality.

Release requires:
1. `npm run typecheck`
2. `npm run test:ci:gates`
3. `npm run validate:integration:strict`
4. `npm run validate:pre-ship:bundle`
