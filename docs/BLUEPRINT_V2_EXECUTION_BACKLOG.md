# Blueprint v2 Execution Backlog

Generated: 2026-03-03
Source: `docs/BLUEPRINT_V2_JHU_NURSING_SAILING.md`

## Scope

- Convert Blueprint v2 into an execution checklist with clear acceptance criteria.
- Prioritize Phase 2 and Phase 3 deliverables first (program model + coach shell).

## Epic A: Domain Resolution Contract Enforcement

Status: In progress

- [x] Add explicit resolver utility contract tests for precedence (`organization_type` over `active_interest_id` for auth/gating).
  - Shipped via `api/middleware/domain.ts` + `api/__tests__/domain-resolution.contract.test.ts`.
- [x] Audit and patch remaining API handlers to use resolver consistently.
  - Shipped for active AI routes in:
    - `api/ai/races/[id]/comms/draft.ts`
    - `api/ai/events/[id]/documents/draft.ts`
    - `api/ai/club/support.ts`
- [x] Audit and patch UI-only copy paths to use `active_interest_id` where safe.
  - Shipped presentation-domain copy overrides in:
    - `app/settings/notifications.tsx`
    - `app/(tabs)/clients.tsx`
    - `app/(tabs)/programs-experience.tsx`
  - Backed by integration contract row: `ui-copy-presentation-domain-contract`.
- [x] Add integration check row for resolver precedence assumptions.
  - Shipped via `domain-resolver-precedence-contract` in `scripts/run-integration-validation.mjs`.

Acceptance:
- Security-sensitive paths always follow `organization_type`.
- UX labeling can vary by `active_interest_id` without cross-domain access leaks.

## Epic B: Program Data Model Completion (Phase 2)

Status: Pending

- [x] Confirm migration coverage for:
  - `programs`
  - `program_sessions`
  - `program_participants`
  - Shipped via integration check row `programs-core-migration-coverage` referencing `supabase/migrations/20260302110000_programs_core_model.sql`.
- [x] Add missing indexes for assignment and due-work queries.
  - Shipped via `supabase/migrations/20260303133000_add_coach_home_query_indexes.sql`.
- [x] Implement/verify service layer CRUD and assignment APIs.
  - Verified via `program-service-crud-assignment-contract` and `services/__tests__/ProgramService.contract.test.ts`.
- [x] Remove remaining mock fallbacks from program UI paths.
  - Verified institution program path wiring via `programs-ui-real-data-contract` in `app/(tabs)/programs-experience.tsx`.
- [x] Add DB signature assertions in integration validation for program tables/columns.

Acceptance:
- Program UI reads/writes real data only.
- Table signatures pass in strict integration checks.

## Epic C: RLS Matrix Expansion

Status: In progress

- [x] Add SQL security tests for:
  - `programs`
  - `program_sessions`
  - `program_participants`
  - `communication_threads`
  - `templates`
- Note: shipped in:
  - `services/__tests__/ProgramsCoreRls.sql-security.test.ts`
  - `services/__tests__/CommunicationTemplatesRls.sql-security.test.ts`
- [x] Add integration semantic checks for each table’s critical role clauses.
- [x] Add CI script alias for full SQL security matrix suite.

Acceptance:
- Role-scoped access is contract-tested and enforced in CI.

## Epic D: Coach Shell Productionization (Phase 3)

Status: Pending

- [x] Coach Home data endpoint performance profiling.
  - Shipped via `scripts/report-coach-home-endpoint-profile.mjs` + `docs/coach-home-endpoint-profile.md`.
- [x] Add P95 timing instrumentation and report hooks.
  - Shipped via `lib/coach/coachHomeProfiling.ts`, `hooks/useCoachHomeData.ts`, and `docs/coach-home-query-baseline.md`.
- [x] Add deterministic baseline report generator for coach-home profile sample input.
  - Shipped via `scripts/report-coach-home-query-baseline.mjs` and contract test coverage.
- [x] Add profile-summary export helper for real in-app sample capture to report input shape.
  - Shipped via `toCoachHomeBaselineInput(...)` in `lib/coach/coachHomeProfiling.ts`.
- [x] Add baseline budget gate script for repeatable budget checks from latest report artifact.
  - Shipped via `scripts/check-coach-home-baseline-budget.mjs` and `gate:coach-home-baseline-budget`.
- [x] Optimize queries/indexes for:
  - due assessments
  - unread threads
  - program-scoped participant trend summaries
  - Shipped index coverage in `20260303133000_add_coach_home_query_indexes.sql` with contract lock in `scripts/__tests__/coach-home-index-migration.contract.test.ts`.
- [x] Add regression tests for drill-down links and program scoping.
  - Locked in CI via:
    - `app/__tests__/coach-home-assessments-drilldown-route.e2e.test.ts`
    - `app/__tests__/programs-experience-assessment-scope.contract.test.ts`
    - `app/__tests__/communications-route.contract.test.ts`

Acceptance:
- Coach Home and drill-down flows meet agreed P95 budget.

## Epic E: Route Alias Lifecycle

Status: Pending

- [x] Add telemetry event for `/race-management` alias usage.
  - Shipped via `trackRaceManagementAliasUsage()` in `lib/navigation/raceManagementAlias.ts`.
- [x] Add redirect-only feature flag for alias path.
  - Shipped via `RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY` in `lib/featureFlags.ts` and alias routing logic in `app/(tabs)/race-management.tsx`.
- [x] Add removal checklist/date gate in release notes doc.
  - Shipped via `docs/release-notes-race-management-alias-removal.md`.

Acceptance:
- Alias deprecation is measurable and reversible.

## Epic F: Feature Flags and Rollback

Status: Pending

- [x] Add flags:
  - `program_data_model_v1`
  - `coach_shell_v1`
  - `domain_gate_ai_strict_v1`
  - `secondary_packs_v1`
- [x] Add rollback runbook for each flag.
  - Shipped via `docs/feature-flag-rollback-runbook.md`.
- [x] Add smoke checks per flag state where applicable.
  - Shipped via integration check row `feature-flag-rollback-contract` and CI contract `scripts/__tests__/feature-flag-rollbacks.contract.test.ts`.

Acceptance:
- Any major lane can be disabled without data loss or lockout.

## Epic G: Secondary Packs Validation (Phase 4 Prep)

Status: Pending

- [x] Lock canonical secondary packs list (`drawing`, `golf`) in docs/contracts.
  - Shipped via `docs/secondary-packs-canonical.md` + `secondary-packs-canonical-contract`.
- [x] Create pack templates and vocabulary stubs in `domain_catalog`.
  - Shipped via `supabase/migrations/20260303143000_seed_secondary_pack_domain_catalog_stubs.sql`.
- [x] Add one route-level and one API-level contract test per secondary pack.
  - Shipped via `app/__tests__/secondary-packs-route-api.contract.test.ts`.

Acceptance:
- Secondary packs can be enabled on shared skeleton without auth/gating regressions.

## CI / Validation Gate Matrix

- [x] `npm run typecheck`
- [x] `npm run test:ci:gates`
- [x] `npm run validate:integration:strict`
- [x] `npm run validate:pre-ship:bundle`
- [x] `npm run report:migration-object-collision-audit`

## Suggested Next Autonomous Slice

1. Epic C: add SQL security tests for `programs`, `program_sessions`, `program_participants`.
2. Epic B: add/verify DB signature assertions for those tables in integration validation.
3. Epic D: add coach-home query profiling helper + baseline report.
