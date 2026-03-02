# Merge Readiness Checklist

- Generated: 2026-03-02
- Context: parallel multi-terminal integration for domain packs, invite hardening, coach shell, and CI validation

## Current Signal Snapshot

- Pre-ship bundle: PASS (`npm run validate:pre-ship:bundle`)
- Integration validation strict: PASS (15 PASS, 0 FAIL, 1 SKIP)
- Integration gate: PASS (JSON-first parsing path)
- Integration report schema check: PASS
- Migration object collision audit (`20260302*`, indexes/triggers/constraints): PASS (0 duplicates)
- Targeted gate/domain tests: PASS

## Blocking Conditions Before Merge

- [ ] Reduce/organize working tree into mergeable scope. Current state is heavily mixed (hundreds of modified/untracked files).
- [ ] Decide whether `api-smoke-availability` SKIP is acceptable for this merge (requires `INTEGRATION_BASE_URL` for live smoke).
- [ ] Confirm intended inclusion/exclusion for generated docs artifacts:
  - `docs/integration-validation-latest.md`
  - `docs/integration-validation-latest.json`
  - `docs/deployment-readiness.md`
  - `docs/migration-object-collision-audit.md`

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
  - [ ] No unexpected FAIL in integration validation/gates
  - [ ] SKIPs are explicitly accepted/documented
  - [ ] Merge scope is isolated to intended files
  - [ ] Required tests pass in the target branch context

- No-Go when:
  - [ ] Worktree remains unsliced/mixed across unrelated areas
  - [ ] New unexpected SKIP/FAIL appears in strict validation or gate checks

