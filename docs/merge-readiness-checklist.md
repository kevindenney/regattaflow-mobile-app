# Merge Readiness Checklist

- Generated: 2026-03-03
- Context: parallel multi-terminal integration for domain packs, invite hardening, coach shell, and CI validation

## Current Signal Snapshot

- Pre-ship bundle: PASS (`npm run validate:pre-ship:bundle`)
- Integration validation strict: PASS (latest run; current snapshot: 26 PASS, 0 FAIL, 0 SKIP)
- Integration gate: PASS (JSON-first parsing path)
- Integration report schema check: PASS
- Migration object collision audit (`20260302*`, indexes/triggers/constraints): PASS (0 duplicates)
- Targeted gate/domain tests: PASS

## Blocking Conditions Before Merge

- [x] Reduce/organize working tree into mergeable scope (active merge lane now isolated/clean).
- [x] `api-smoke-availability` SKIP removed from strict path (strict smoke now has deterministic production fallback base URL).
- [x] Mandatory retention loop shipped end-to-end:
  - `streaks`
  - `reminders`
  - `weekly recap`
- [x] Confirm intended inclusion/exclusion for generated docs artifacts:
  - `docs/integration-validation-latest.md`
  - `docs/integration-validation-latest.json`
  - `docs/deployment-readiness.md`
  - `docs/migration-object-collision-audit.md`

## Mandatory Build Plan Gate (Retention Loop)

The build plan must include these three retention loops together as one required loop:

- `streaks`
- `reminders`
- `weekly recap`

Status: `Mandatory` and `Shipped`.

## Recommended Merge Order (Safe Slicing)

1. CI + gate infrastructure
   - `.github/workflows/deployment-smoke.yml`
   - `.github/workflows/integration-gate-self-test.yml`
   - `scripts/check-integration-validation-gate.mjs`
   - `scripts/validate-integration-report-schema.mjs`
   - `scripts/run-integration-validation.mjs`
   - `scripts/run-pre-ship-validation-bundle.mjs`
   - `scripts/smoke-integration-validation-gate.mjs`
   - `scripts/migration-object-collision-audit.mjs`
   - `package.json` script wiring

2. Security/domain/API contracts
   - `api/ai/**` domain-gated handlers
   - `api/middleware/auth.ts`
   - `api/__tests__/*.test.ts`

3. Invite/program/coach app flows + tests
   - `app/settings/organization-access.tsx`
   - `app/org-invite.tsx`
   - `app/(tabs)/programs*.tsx`
   - `app/assessments.tsx`
   - `app/programs/**`
   - `services/OrganizationInvite*.ts`
   - `services/ProgramService.ts`
   - `app/__tests__/*.test.ts`
   - `services/__tests__/*.test.ts`

4. SQL migrations/docs bundle
   - `supabase/migrations/20260302*.sql`
   - `docs/migration-merge-readiness.md`
   - `docs/migration-object-collision-audit.md`

## Final Pre-Merge Command Pack

```bash
npm run typecheck
npm run test:ci:gates
npm run validate:pre-ship:bundle
npm run report:migration-object-collision-audit
```

## Go/No-Go

- Go when:
  - [x] No unexpected FAIL in integration validation/gates
  - [x] SKIPs are explicitly accepted/documented (none present in strict run)
  - [x] Merge scope is isolated to intended files
  - [x] Required tests pass in the target branch context

- No-Go when:
  - [ ] Worktree remains unsliced/mixed across unrelated areas
  - [ ] New unexpected SKIP/FAIL appears in strict validation or gate checks

Current state: no active No-Go conditions observed.

## Autonomous Remaining Work Bundles (No Blocking Impact)

The merge lane is in `Go` state. Remaining follow-ups can run independently as grouped bundles without interim reporting:

1. Observability and deploy diagnostics hardening
   - Expand deploy smoke failure snippets for additional edge payload formats.
   - Add lightweight trend summary (pass rate over last N runs) to deployment docs.
   - Keep strict failure condition unchanged (`FAIL` or unexpected `SKIP` remains blocking).

2. Authenticated API smoke expansion
   - Add token-backed probes for one representative endpoint per domain (`sailing`, `nursing/institution`).
   - Preserve existing unauthenticated runtime-failure guard probes.
   - Record authenticated diagnostics in a separate report section to avoid mixing with public smoke semantics.

3. Retention loop delivery confidence
   - Add focused tests for per-channel dispatch idempotency (`in_app`, `push`, `email`) on retries.
   - Add one integration assertion for weekly recap payload field completeness.
   - Keep mandatory loop contract unchanged: `streaks`, `reminders`, `weekly recap`.

4. Migration/DDL hygiene automation
   - Extend collision audit to flag missing canonical header fields on new migrations.
   - Add CI guard so `20260302*` canonical ownership rules cannot regress silently.
   - Continue no-rewrite behavior for unchanged audit outputs to minimize churn.
