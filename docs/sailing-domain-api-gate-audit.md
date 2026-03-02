# Sailing-Domain API Gate Audit

Date: 2026-03-02

Scope audited:
- All `api/ai/**` endpoints
- Race-related public endpoints under `api/public/**`

## Summary

- Added missing server-side `organization_type` gates with `DOMAIN_GATED` 403 responses to:
  - `POST /api/ai/club/support`
  - `POST /api/ai/events/[id]/documents/draft`
- Confirmed existing gate in:
  - `POST /api/ai/races/[id]/comms/draft`
- Public race endpoints (`/api/public/**`) are intentionally unauthenticated and do not have an `organization_type` context for `DOMAIN_GATED` checks.

## Endpoint Matrix

| Endpoint | Gate Status | Code Reference | Notes |
|---|---|---|---|
| `POST /api/ai/club/support` | `GATED` | `api/ai/club/support.ts:30-41` | Added `organizations.organization_type !== 'club'` check; returns `403` + `code: 'DOMAIN_GATED'`. |
| `POST /api/ai/events/[id]/documents/draft` | `GATED` | `api/ai/events/[id]/documents/draft.ts:27-40` | Added `organizations.organization_type !== 'club'` check; returns `403` + `code: 'DOMAIN_GATED'`. |
| `POST /api/ai/races/[id]/comms/draft` | `GATED` | `api/ai/races/[id]/comms/draft.ts:29-42` | Existing server-side `organization_type` gate already present. |
| `POST /api/ai/cron/cron.disabled/daily-summary` | `N/A (disabled)` | `api/ai/cron/cron.disabled/daily-summary.ts:1-134` | Disabled cron endpoint; processes `club_profiles` with cron secret. No active runtime route in current deployment path. |
| `GET /api/public/regattas/[regattaId]` | `N/A (public)` | `api/public/regattas/[regattaId].ts:164-245` | Public, no-auth endpoint by design; no authenticated org context to gate on. |
| `GET /api/public/clubs/[clubId]/events` | `N/A (public)` | `api/public/clubs/[clubId]/events.ts:52-240` | Public, no-auth endpoint by design; no authenticated org context to gate on. |
| `GET /api/public/strategies/[token]` | `N/A (public)` | `api/public/strategies/[token].ts:161-260` | Public share-token endpoint by design; visibility controlled by `share_enabled` token lookup. |
| `GET/POST /api/public/widgets/[token]` | `N/A (public)` | `api/public/widgets/[token].ts:16-191` | Public embed endpoint; access controlled by token, widget `active`, and allowed-domain checks. |

## Changes Applied

- `api/ai/club/support.ts`
  - Added `organizations.organization_type` lookup and `DOMAIN_GATED` 403 response.
- `api/ai/events/[id]/documents/draft.ts`
  - Added `organizations.organization_type` lookup and `DOMAIN_GATED` 403 response.

