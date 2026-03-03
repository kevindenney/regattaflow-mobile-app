# Blueprint v2 Execution Backlog

Generated: 2026-03-03
Source: `docs/BLUEPRINT_V2_JHU_NURSING_SAILING.md`

## Scope

- Convert Blueprint v2 into an execution checklist with clear acceptance criteria.
- Prioritize Phase 2 and Phase 3 deliverables first (program model + coach shell).

## Epic A: Domain Resolution Contract Enforcement

Status: In progress

- [ ] Add explicit resolver utility contract tests for precedence (`organization_type` over `active_interest_id` for auth/gating).
- [ ] Audit and patch remaining API handlers to use resolver consistently.
- [ ] Audit and patch UI-only copy paths to use `active_interest_id` where safe.
- [ ] Add integration check row for resolver precedence assumptions.

Acceptance:
- Security-sensitive paths always follow `organization_type`.
- UX labeling can vary by `active_interest_id` without cross-domain access leaks.

## Epic B: Program Data Model Completion (Phase 2)

Status: Pending

- [ ] Confirm migration coverage for:
  - `programs`
  - `program_sessions`
  - `program_participants`
- [ ] Add missing indexes for assignment and due-work queries.
- [ ] Implement/verify service layer CRUD and assignment APIs.
- [ ] Remove remaining mock fallbacks from program UI paths.
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
- [ ] Add integration semantic checks for each table’s critical role clauses.
- [ ] Add CI script alias for full SQL security matrix suite.

Acceptance:
- Role-scoped access is contract-tested and enforced in CI.

## Epic D: Coach Shell Productionization (Phase 3)

Status: Pending

- [ ] Coach Home data endpoint performance profiling.
- [ ] Add P95 timing instrumentation and report hooks.
- [ ] Optimize queries/indexes for:
  - due assessments
  - unread threads
  - program-scoped participant trend summaries
- [ ] Add regression tests for drill-down links and program scoping.

Acceptance:
- Coach Home and drill-down flows meet agreed P95 budget.

## Epic E: Route Alias Lifecycle

Status: Pending

- [ ] Add telemetry event for `/race-management` alias usage.
- [ ] Add redirect-only feature flag for alias path.
- [ ] Add removal checklist/date gate in release notes doc.

Acceptance:
- Alias deprecation is measurable and reversible.

## Epic F: Feature Flags and Rollback

Status: Pending

- [ ] Add flags:
  - `program_data_model_v1`
  - `coach_shell_v1`
  - `domain_gate_ai_strict_v1`
  - `secondary_packs_v1`
- [ ] Add rollback runbook for each flag.
- [ ] Add smoke checks per flag state where applicable.

Acceptance:
- Any major lane can be disabled without data loss or lockout.

## Epic G: Secondary Packs Validation (Phase 4 Prep)

Status: Pending

- [ ] Lock canonical secondary packs list (`drawing`, `golf`) in docs/contracts.
- [ ] Create pack templates and vocabulary stubs in `domain_catalog`.
- [ ] Add one route-level and one API-level contract test per secondary pack.

Acceptance:
- Secondary packs can be enabled on shared skeleton without auth/gating regressions.

## CI / Validation Gate Matrix

- [ ] `npm run typecheck`
- [ ] `npm run test:ci:gates`
- [ ] `npm run validate:integration:strict`
- [ ] `npm run validate:pre-ship:bundle`
- [ ] `npm run report:migration-object-collision-audit`

## Suggested Next Autonomous Slice

1. Epic C: add SQL security tests for `programs`, `program_sessions`, `program_participants`.
2. Epic B: add/verify DB signature assertions for those tables in integration validation.
3. Epic D: add coach-home query profiling helper + baseline report.
