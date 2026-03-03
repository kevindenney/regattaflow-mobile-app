# API Auth Inventory

- Generated: 2026-03-02T11:07:40.957Z
- Scope: `api/**/*.ts` excluding `api/__tests__/**` and `api/middleware/**`
- Rows: 12
- Notes: Static text scan heuristics (non-AST).

| Endpoint | Source | Auth Wrapper | requireClub | Method Guards | Domain Gate Markers |
|---|---|---|---|---|---|
| /api/ai/club/support | api/ai/club/support.ts | withAuth(requireClub: true) | required | if (req.method !== 'POST') { ; res.setHeader('Allow', 'POST'); | organization_type !== 'club', code: 'DOMAIN_GATED', select('organization_type') |
| /api/ai/cron/cron.disabled/daily-summary (disabled) | api/ai/cron/cron.disabled/daily-summary.ts | none | n/a | if (req.method !== 'POST') { ; res.setHeader('Allow', 'POST'); | none detected |
| /api/ai/events/[id]/documents/draft | api/ai/events/[id]/documents/draft.ts | withAuth(requireClub: true) | required | if (req.method !== 'POST') { ; res.setHeader('Allow', 'POST'); | organization_type !== 'club', code: 'DOMAIN_GATED', select('organization_type') |
| /api/ai/races/[id]/comms/draft | api/ai/races/[id]/comms/draft.ts | withAuth(requireClub: true) | required | if (req.method !== 'POST') { ; res.setHeader('Allow', 'POST'); | organization_type !== 'club', code: 'DOMAIN_GATED', select('organization_type') |
| /api/club/workspace | api/club/workspace.ts | withAuth(options not explicit) | not specified (default behavior) | if (method !== 'GET' && method !== 'POST') { ; res.setHeader('Allow', 'GET,POST'); | none detected |
| /api/cron/expire-booking-requests | api/cron/expire-booking-requests.ts | none | n/a | if (req.method !== 'GET' && req.method !== 'POST') { ; res.setHeader('Allow', 'GET, POST'); | none detected |
| /api/cron/session-reminders | api/cron/session-reminders.ts | none | n/a | if (req.method !== 'GET' && req.method !== 'POST') { ; res.setHeader('Allow', 'GET, POST'); | none detected |
| /api/privacy | api/privacy.ts | none | n/a | none detected | none detected |
| /api/public/clubs/[clubId]/events | api/public/clubs/[clubId]/events.ts | none | n/a | res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); ; if (req.method === 'OPTIONS') { ; if (req.method !== 'GET') { | none detected |
| /api/public/regattas/[regattaId] | api/public/regattas/[regattaId].ts | none | n/a | res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); ; if (req.method === 'OPTIONS') { ; if (req.method !== 'GET') { | none detected |
| /api/public/strategies/[token] | api/public/strategies/[token].ts | none | n/a | res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); ; if (req.method === 'OPTIONS') { ; if (req.method !== 'GET') { | none detected |
| /api/public/widgets/[token] | api/public/widgets/[token].ts | none | n/a | res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); ; if (req.method === 'OPTIONS') { ; if (req.method === 'GET') { ; if (req.method === 'POST') { | none detected |

