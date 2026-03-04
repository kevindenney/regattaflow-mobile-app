# Final Ship Summary (2026-03-03)

## Shipped
- Route/API domain gating for race-only AI endpoints and non-sailing behavior hardening (unauthenticated probes now return controlled `401`/`405`, not runtime `500`).
- Migration conflict sweep with canonical ownership/order for `20260302*` migrations, including duplicate policy/function reconciliation and readiness documentation.
- Nursing/institution `assessment_records` SELECT RLS hardening with role-scoped visibility logic (learner self-only, assigned faculty/preceptor/coordinator scope, owner/admin org-wide).
- Domain-specific onboarding route guards to prevent institution/nursing users from landing on sailing-first onboarding screens.
- Strict deployment API smoke tooling with endpoint diagnostics and Vercel runtime-failure detection:
  - `scripts/run-api-smoke-deploy.mjs`
  - `docs/api-smoke-deploy.md`
  - `docs/api-smoke-deploy-history.json` (rolling distinct-run trend summary support)
  - optional authenticated probes for sailing + institution domains when CI secrets are present
- CI deployment-smoke workflow hardening:
  - strict integration validation against production base URL
  - strict deploy API smoke execution
  - migration header convention lint gate for `20260302*` files
  - artifact uploads for integration and deploy smoke reports/logs
  - explicit concurrency and permissions hardening
  - deploy-smoke history artifact lifecycle hardening (`reset`/`ensure`/`upload`)
- Mandatory retention loop shipped end-to-end:
  - streaks
  - reminders
  - weekly recap
  - scheduled cron generation/delivery logging + in-app dispatch + push/email fanout + retry-safe per-channel dispatch tracking
- BetterAt plan integration update shipped:
  - mandatory Signature Insight Moment added to plan contracts
  - trigger: timeline step completion + AI analysis availability
  - output: evidence-backed "getting better at" insight + persisted evolving principles
- Coach/program navigation and drill-down improvements already merged in the same lane (communications/assessments/program scoping slices).
- Integration-gate reliability hardening:
  - strict integration mode now uses deterministic production fallback base URL when `INTEGRATION_BASE_URL` is unset.
  - optional token-backed authenticated smoke probes added to strict integration/deploy smoke runners (`INTEGRATION_AUTH_SAILING_BEARER`, `INTEGRATION_AUTH_INSTITUTION_BEARER`).
  - migration convention lint automation added (`scripts/lint-20260302-migration-conventions.mjs`) and wired into pre-ship/deployment CI gates.
  - explicit auth-probe availability reporting enforced in strict integration reports (`api-smoke-auth-probe-configuration`) with schema-level required-check validation.
  - deployment-smoke artifact set expanded and hardened:
    - guaranteed fallbacks for integration markdown/json + deploy smoke + deployment readiness docs
    - upload of integration markdown+json bundle and deployment readiness artifact
    - reset step clears generated report files pre-run to prevent stale artifact reuse.
  - gate strictness strengthened for JSON-first parsing:
    - blocks when JSON `overall` is not `PASS`
    - blocks on JSON/markdown mismatch (rows and/or overall)
    - self-test workflow expanded to include JSON failure/mismatch fixtures.
  - generated validation reports are excluded from default working-tree noise via `.gitignore`.
- Post-summary hardening/consistency updates merged on `main`:
  - normalized strict DB assertion skip behavior to canonical `db-assertions-availability` id.
  - aligned pre-ship expected skip policy with strict fallback behavior.
  - synchronized integration runbook with actual pre-ship bundle step order.
  - reconciled migration/readiness docs (mandatory retention gate explicit, canonical migration ordering/list completeness, No-Go checklist semantics).
  - retention delivery confidence checks expanded:
    - per-channel retry/idempotency test coverage for `in_app`/`push`/`email`
    - strict integration assertion for weekly recap payload completeness/guard path.
  - assessment RLS regression prevention strengthened:
    - integration semantic assertion (`assessment-rls-policy-semantics`)
    - dedicated SQL security matrix test (`services/__tests__/AssessmentRecordsRls.sql-security.test.ts`).
  - deployment smoke contract coverage expanded:
    - script contract test added (`scripts/__tests__/run-api-smoke-deploy.contract.test.ts`)
    - CI gates now include dedicated SQL security suite (`npm run test:security:sql`) as part of `npm run test:ci:gates`.
- Signature Insight Moment productionization completed across the active-interest lanes:
  - persistence + event outcomes:
    - migration `20260303153000_signature_insight_memory.sql`
    - tables: `user_principle_memory`, `signature_insight_events`
    - RPC: `apply_signature_insight_outcome_v1(...)`
  - runtime trigger hardening:
    - timeline-step completion emits insight only when AI analysis is available
    - unchanged dismissed principles are suppressed from resurfacing
  - UI/experience:
    - Coach Home Signature Insight card with `Keep` / `Edit` / `Dismiss` actions
    - Progress `My Principles` history section with reinforcement/challenge indicators
  - reuse loop:
    - accepted principles are fed back into adaptive reminder generation
  - cross-interest threading:
    - interest/domain is threaded through checklist completion and adaptive nudge generation (not sailing-hardcoded)
  - CI coverage:
    - behavior-level trigger test added and wired into `test:ci:gates:unit`
    - integration validation contract rows extended for signature-insight migration/service/trigger/reuse/gate wiring

## Deferred
- No additional blockers deferred from the migration/CI hardening lane as of 2026-03-03.
- Broader product-roadmap checklist items outside this lane (for example long-horizon concept/plan docs) remain out of scope for this ship summary.

## Residual Risks
- Vercel deployment checks are consistently slow (passes eventually, but adds merge latency and can delay parallel lane throughput).
- Strict API smoke validates public unauthenticated behavior and runtime stability; it does not replace authenticated functional E2E coverage for all domain permutations.
- Authenticated probe checks require CI secret configuration to activate; until configured they are intentionally omitted (not reported as `SKIP`).
- Retention push/email fanout depends on external provider/runtime configuration (for example SendGrid key presence and edge-function availability); fallback in-app dispatch still preserves core loop delivery.

## Validation Snapshot (2026-03-03)
- `npm run typecheck`: PASS
- `npm run test:ci:gates`: PASS
- `npm run validate:integration:strict`: PASS (latest run; current snapshot: `29 pass, 0 fail, 0 skip`)
- `npm run validate:pre-ship:bundle`: PASS (`steps=7/7`)

## Validation Snapshot (2026-03-04)
- `npm run test:ci:gates`: PASS
- `npm run validate:integration:strict`: PASS
- `npm run validate:pre-ship:bundle`: PASS (`steps=7/7`)
- `npm run typecheck`: PASS
