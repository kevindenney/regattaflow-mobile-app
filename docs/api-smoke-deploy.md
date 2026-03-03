# Deployment API Smoke

- Base URL: https://regattaflow-app.vercel.app
- Overall: **PASS**
- Checks: 5 total (5 pass, 0 fail)
- Sailing auth probe token: not set
- Institution auth probe token: not set

| Check | Status | Method | Endpoint | HTTP | x-vercel-error | x-vercel-id | x-vercel-request-id | Body Snippet |
|---|---|---|---|---|---|---|---|---|
| ai-race-comms-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/races/integration-smoke/comms/draft | 405 | - | - | - | {"error":"Method not allowed"} |
| ai-event-doc-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/events/integration-smoke/documents/draft | 405 | - | - | - | {"error":"Method not allowed"} |
| ai-club-support-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/club/support | 405 | - | - | - | {"error":"Method not allowed"} |
| cron-coach-retention-get | PASS | GET | https://regattaflow-app.vercel.app/api/cron/coach-retention-loop | 401 | - | - | - | {"error":"Unauthorized"} |
| cron-coach-retention-post | PASS | POST | https://regattaflow-app.vercel.app/api/cron/coach-retention-loop | 401 | - | - | - | {"error":"Unauthorized"} |

## Notes

- Any `HTTP 500` with `x-vercel-error=FUNCTION_INVOCATION_FAILED` is a hard FAIL.
- Authenticated probe rows are included only when bearer token env vars are provided.
