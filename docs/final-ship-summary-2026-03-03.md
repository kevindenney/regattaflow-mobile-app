# Final Ship Summary (2026-03-03)

## Shipped
- Route/API domain gating for race-only AI endpoints and non-sailing behavior hardening (unauthenticated probes now return controlled `401`/`405`, not runtime `500`).
- Migration conflict sweep with canonical ownership/order for `20260302*` migrations, including duplicate policy/function reconciliation and readiness documentation.
- Nursing/institution `assessment_records` SELECT RLS hardening with role-scoped visibility logic (learner self-only, assigned faculty/preceptor/coordinator scope, owner/admin org-wide).
- Domain-specific onboarding route guards to prevent institution/nursing users from landing on sailing-first onboarding screens.
- Strict deployment API smoke tooling with endpoint diagnostics and Vercel runtime-failure detection:
  - `scripts/run-api-smoke-deploy.mjs`
  - `docs/api-smoke-deploy.md`
- CI deployment-smoke workflow hardening:
  - strict integration validation against production base URL
  - strict deploy API smoke execution
  - artifact uploads for integration and deploy smoke reports/logs
  - explicit concurrency and permissions hardening
- Mandatory retention loop shipped end-to-end:
  - streaks
  - reminders
  - weekly recap
  - scheduled cron generation/delivery logging + in-app dispatch + push/email fanout + retry-safe per-channel dispatch tracking
- Coach/program navigation and drill-down improvements already merged in the same lane (communications/assessments/program scoping slices).
- Integration-gate reliability hardening:
  - strict integration mode now uses deterministic production fallback base URL when `INTEGRATION_BASE_URL` is unset.
  - generated validation reports are excluded from default working-tree noise via `.gitignore`.
- Post-summary hardening/consistency updates merged on `main`:
  - normalized strict DB assertion skip behavior to canonical `db-assertions-availability` id.
  - aligned pre-ship expected skip policy with strict fallback behavior.
  - synchronized integration runbook with actual pre-ship bundle step order.
  - reconciled migration/readiness docs (mandatory retention gate explicit, canonical migration ordering/list completeness, No-Go checklist semantics).

## Deferred
- No additional blockers deferred from the migration/CI hardening lane as of 2026-03-03.
- Broader product-roadmap checklist items outside this lane (for example long-horizon concept/plan docs) remain out of scope for this ship summary.

## Residual Risks
- Vercel deployment checks are consistently slow (passes eventually, but adds merge latency and can delay parallel lane throughput).
- Strict API smoke validates public unauthenticated behavior and runtime stability; it does not replace authenticated functional E2E coverage for all domain permutations.
- Retention push/email fanout depends on external provider/runtime configuration (for example SendGrid key presence and edge-function availability); fallback in-app dispatch still preserves core loop delivery.

## Validation Snapshot (2026-03-03)
- `npm run typecheck`: PASS
- `npm run test:ci:gates`: PASS
- `npm run validate:integration:strict`: PASS (latest run; current snapshot: `26 pass, 0 fail, 0 skip`)
- `npm run validate:pre-ship:bundle`: PASS (`steps=6/6`)
