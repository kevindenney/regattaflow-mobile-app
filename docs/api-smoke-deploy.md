# Deployment API Smoke

- Generated: 2026-03-03T05:16:16.846Z
- Base URL: https://regattaflow-app.vercel.app
- Overall: **PASS**
- Checks: 5 total (5 pass, 0 fail)

| Check | Status | Method | Endpoint | HTTP | x-vercel-error | x-vercel-id | x-vercel-request-id | Body Snippet |
|---|---|---|---|---|---|---|---|---|
| ai-race-comms-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/races/integration-smoke/comms/draft | 405 | - | pdx1::iad1::qmpr7-1772514974493-57ad5bf22737 | - | {"error":"Method not allowed"} |
| ai-event-doc-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/events/integration-smoke/documents/draft | 405 | - | pdx1::iad1::5xqzb-1772514975502-3c91850afe6c | - | {"error":"Method not allowed"} |
| ai-club-support-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/club/support | 405 | - | pdx1::iad1::qmpr7-1772514976185-e9ec236fe11d | - | {"error":"Method not allowed"} |
| cron-coach-retention-get | PASS | GET | https://regattaflow-app.vercel.app/api/cron/coach-retention-loop | 401 | - | pdx1::iad1::5xqzb-1772514976518-76d8ee9d039d | - | {"error":"Unauthorized"} |
| cron-coach-retention-post | PASS | POST | https://regattaflow-app.vercel.app/api/cron/coach-retention-loop | 401 | - | pdx1::iad1::m4zcn-1772514976821-2dbfa0b17359 | - | {"error":"Unauthorized"} |

## Notes

- Any `HTTP 500` with `x-vercel-error=FUNCTION_INVOCATION_FAILED` is a hard FAIL.
- Started: 2026-03-03T05:16:13.653Z
- Finished: 2026-03-03T05:16:16.846Z

