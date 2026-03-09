# Autonomous Execution Runbook

## Operating Rules
- One milestone per commit.
- Run `npm run typecheck` before each commit.
- Run `supabase db push` after any migration.
- Update `docs/MILESTONES.md` after each milestone.
- Stop only when a command fails or a decision is required.
- Do not commit secrets or credentials.
- Do not change unrelated application code while executing a single milestone.

## Default Milestone Loop

1. Confirm scope
- Identify one milestone from `docs/MASTER_PLAN.md`.
- Declare expected artifacts (code/docs/migrations/tests).

2. Implement
- Apply minimal changes for the milestone only.
- Keep schema + app logic + tests coherent.

3. Validate locally
- `npm run typecheck`
- If migration touched:
  - `supabase db push`
- Run targeted checks for changed surfaces:
  - UI/route checks
  - script checks
  - smoke or contract tests where applicable

4. Update tracking
- Append milestone result to `docs/MILESTONES.md`:
  - status
  - acceptance result
  - notable risks/gaps

5. Commit
- Commit only milestone-scoped files.
- Commit message pattern:
  - `<Area>: <Milestone summary>`

6. Report
- Return concise report:
  - milestone ID/title
  - files changed
  - validation commands + outcomes
  - rollback notes
  - next milestone recommendation

## Command Recipes

### A) Baseline checks
```bash
npm run typecheck
git status --short
```

### B) Migration milestone
```bash
# create/edit migration file(s)
npm run typecheck
supabase db push
```

### C) Multi-org smoke
```bash
node scripts/smoke-multi-org-demo.mjs
```
Expected structure:
- `id|PASS|detail`
- `artifact|INFO|/tmp/multi-org-smoke.png`

### D) Integration validation (when milestone impacts programs/retention/contracts)
```bash
node scripts/run-integration-validation.mjs
```

### E) Pre-commit milestone checklist
```bash
npm run typecheck
git add <milestone-scoped-files>
git commit -m "<Area>: <Milestone summary>"
```

## Failure / Stop Conditions
Stop and request decision when:
- `supabase db push` fails with non-trivial schema conflict.
- RLS policy behavior is ambiguous or risks data exposure.
- Conflicting product behavior is discovered (for example invite semantics vs request-to-join semantics).
- Required credentials/service endpoints are unavailable.

## Reporting Template (Use Every Milestone)
- Milestone: `Mx — <title>`
- Status: `DONE | PARTIAL | BLOCKED`
- Files: `<list>`
- Commands run:
  - `<cmd>` => `<result>`
- Acceptance criteria:
  - `[x] ...`
  - `[ ] ...` (if partial)
- Rollback:
  - `<how to revert safely>`
- Next:
  - `<next milestone id + 1-line reason>`

