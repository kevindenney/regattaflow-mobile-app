# Integration Validation Runbook

## Goal
Single validation path for the integration terminal after parallel branches/patches land.

## 1) Fast Sanity Checks
```bash
git status --short
git diff --name-only
npm run -s typecheck
```

Pass criteria:
- Typecheck clean
- No obvious unresolved conflict markers

## 2) Migration Integrity
```bash
ls -1 supabase/migrations | tail -n 30
rg -n "CREATE POLICY|DROP POLICY|CREATE INDEX|CREATE TRIGGER|CREATE OR REPLACE FUNCTION" supabase/migrations | sed -n '1,260p'
```

Validate:
- New migrations are in correct chronological order.
- No accidental duplicate policy/index/trigger/function names with conflicting logic.

## 3) Invite Flow Smoke
Manual checks in app:

1. Send invite from Organization Access.
2. Confirm invite history row created (`sent`) and token present.
3. Open token link route (`/org-invite?token=...`).
4. Confirm status transitions:
   - `sent`/`draft` -> `opened` on view
   - `accepted` on accept
   - `declined` on decline
5. On accept, verify org membership activation for invited user.

## 4) Domain Gating Smoke
Manual checks:

1. In non-sailing workspace:
   - race deep links redirect away from sailing screens
   - race-only edge flows do not execute
2. In sailing workspace:
   - race routes remain available
   - race AI/extraction flows still work

## 5) Programs/Nursing Surface Smoke
Manual checks:

1. Institution tabs/routes use program wording where intended.
2. `/settings/organization-access` role presets resolve from `domain_catalog` (fallback still works).
3. `/programs/assign` invite deep links carry `inviteRoleKey`.

## 6) Optional Test/Lint (if available in this repo state)
```bash
npm run -s test || true
npm run -s lint || true
```

If skipped/failing, record explicitly in ship summary.

## 7) Ship Summary Template
Use this in final integration message:

1. Shipped
2. Migration changes
3. Validations run
4. Deferred items
5. Residual risks

## 8) Integration Validator Gate Semantics (Prompt #8 Sync)

### Strict mode semantics (`--strict-api-smoke`)
- Command flag: `node scripts/run-integration-validation.mjs --strict-api-smoke`
- Script alias: `npm run validate:integration:strict`
- Behavior changes in strict mode:
  - API smoke includes unauthenticated `POST` probes for AI endpoints (not only `GET`).
  - `HTTP 500` + `x-vercel-error=FUNCTION_INVOCATION_FAILED` is `FAIL` (not `SKIP`).
- Non-strict mode (`npm run validate:integration`):
  - keeps GET-only AI probes
  - treats `FUNCTION_INVOCATION_FAILED` as `SKIP`

### Expected `SKIP` policy (gate behavior)
`scripts/check-integration-validation-gate.mjs` blocks when either of these is true:
1. Any check row has `Status=FAIL`.
2. Any check row has `Status=SKIP` and its check id is not listed in `EXPECTED_SKIP_IDS`.

Allowed skip ids by environment:
- CI deployment smoke (`.github/workflows/deployment-smoke.yml`):
  - `EXPECTED_SKIP_IDS=db-assertions-availability`
- Local pre-ship bundle (`npm run validate:pre-ship:bundle`):
  - `EXPECTED_SKIP_IDS=db-assertions-availability`
  - strict validator uses production fallback base URL when `INTEGRATION_BASE_URL` is unset, so `api-smoke-availability` is not expected in strict mode.

### Check row examples: BLOCK vs PASS
Example report table rows (`| Check | Category | Status | Details | Reference |`):

BLOCK examples:
```md
| api-smoke-domain-gate-race-comms-post | API Smoke | FAIL | ... x-vercel-error=FUNCTION_INVOCATION_FAILED ... treated as FAIL in strict API smoke mode. | https://regattaflow-app.vercel.app/api/ai/races/integration-smoke/comms/draft |
| db-invite-rpc-lookup | DB Assertions | FAIL | get_organization_invite_by_token RPC failed: ... | rpc:get_organization_invite_by_token |
```
- First two rows block because `Status=FAIL`.

PASS examples:
```md
| db-assertions-availability | DB Assertions | SKIP | Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. DB assertions skipped. | - |
| api-smoke-domain-gate-club-support-post | API Smoke | PASS | ... Received HTTP 401 ... | https://regattaflow-app.vercel.app/api/ai/club/support |
| api-smoke-public-regatta | API Smoke | PASS | ... Received HTTP 404 ... | https://regattaflow-app.vercel.app/api/public/regattas/integration-smoke-regatta |
```
- These pass when `db-assertions-availability` is explicitly allowed in `EXPECTED_SKIP_IDS` and no other `FAIL`/unexpected `SKIP` exists.

### Exact command examples used in CI and local pre-ship

CI (`.github/workflows/deployment-smoke.yml`):
```bash
npm run validate:integration:strict \
  > >(tee artifacts/validate-integration-strict.stdout.log) \
  2> >(tee artifacts/validate-integration-strict.stderr.log >&2)
npm run gate:integration-validation
```
With CI env:
```bash
INTEGRATION_BASE_URL=https://regattaflow-app.vercel.app
EXPECTED_SKIP_IDS=db-assertions-availability
```

Local pre-ship (bundle script used by team flow):
```bash
npm run validate:pre-ship:bundle
```
Bundle executes:
1. `npm run typecheck`
2. `npm run validate:imports:tracked`
3. `npm run validate:ai-domain-gates`
4. `npm run test:jest:key`
5. `npm run report:migration-object-collision-audit`
6. `npm run validate:integration:strict`
