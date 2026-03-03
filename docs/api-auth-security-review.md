# API Auth Security Review

- Date: 2026-03-02
- Scope: `api/ai/**`, `api/club/**`

## Findings

1. `PASS` `api/ai/club/support.ts`
- Uses `withAuth(...)` with `{ requireClub: true }`.
- Applies explicit sailing domain gate (`organization_type === 'club'`) with `DOMAIN_GATED` `403`.

2. `PASS` `api/ai/events/[id]/documents/draft.ts`
- Uses `withAuth(...)` with `{ requireClub: true }`.
- Applies explicit sailing domain gate (`organization_type === 'club'`) with `DOMAIN_GATED` `403`.

3. `PASS` `api/ai/races/[id]/comms/draft.ts`
- Uses `withAuth(...)` with `{ requireClub: true }`.
- Applies explicit sailing domain gate (`organization_type === 'club'`) with `DOMAIN_GATED` `403`.

4. `PASS` `api/club/workspace.ts`
- Uses `withAuth(handler)` (no `requireClub`).
- This is intentional so authenticated users without an existing club workspace can bootstrap via this endpoint.

## Guard-order check

- AI endpoints enforce method guard (`POST` only) before invoking auth wrapper.
- This prevents auth-wrapper/runtime failures from surfacing as `500` on unsupported methods.

## Regression coverage added

- `api/__tests__/ai-club-auth-contract.test.ts`
  - Enforces `withAuth + requireClub` on AI endpoints.
  - Enforces `withAuth` presence and `requireClub` absence for `api/club/workspace.ts`.
  - Enforces method-guard-before-auth pattern on AI endpoints.

## Residual risk

- `api/ai/cron/cron.disabled/daily-summary.ts` is outside active endpoint set in this review and remains disabled by path convention. If re-enabled, it should be reviewed for equivalent auth/secret guards before deploy.
