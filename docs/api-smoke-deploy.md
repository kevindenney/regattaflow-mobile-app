# Deployment API Smoke

- Generated: 2026-03-03T03:41:27.642Z
- Base URL: https://regattaflow-app.vercel.app
- Overall: **PASS**
- Checks: 5 total (5 pass, 0 fail)

| Check | Status | Method | Endpoint | HTTP | x-vercel-error | x-vercel-id | x-vercel-request-id | Body Snippet |
|---|---|---|---|---|---|---|---|---|
| ai-race-comms-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/races/integration-smoke/comms/draft | 405 | - | pdx1::iad1::dvrwx-1772509285273-8f306f65f2bc | - | {"error":"Method not allowed"} |
| ai-event-doc-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/events/integration-smoke/documents/draft | 405 | - | pdx1::iad1::97mts-1772509286152-bd8399a8a4fc | - | {"error":"Method not allowed"} |
| ai-club-support-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/club/support | 405 | - | pdx1::iad1::528xj-1772509286710-43ab5f0b2e90 | - | {"error":"Method not allowed"} |
| cron-coach-retention-get | PASS | GET | https://regattaflow-app.vercel.app/api/cron/coach-retention-loop | 401 | - | pdx1::iad1::cfb5f-1772509287209-ff4b0e863fdc | - | {"error":"Unauthorized"} |
| cron-coach-retention-post | PASS | POST | https://regattaflow-app.vercel.app/api/cron/coach-retention-loop | 401 | - | pdx1::iad1::bnzpt-1772509287789-fb38e04c1552 | - | {"error":"Unauthorized"} |

## Notes

- Any `HTTP 500` with `x-vercel-error=FUNCTION_INVOCATION_FAILED` is a hard FAIL.
- Started: 2026-03-03T03:41:24.280Z
- Finished: 2026-03-03T03:41:27.642Z

