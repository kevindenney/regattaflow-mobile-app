# Deployment API Smoke

- Generated: 2026-03-03T03:20:00.866Z
- Base URL: https://regattaflow-app.vercel.app
- Overall: **PASS**
- Checks: 4 total (4 pass, 0 fail)

| Check | Status | Method | Endpoint | HTTP | x-vercel-error | x-vercel-id | x-vercel-request-id | Body Snippet |
|---|---|---|---|---|---|---|---|---|
| ai-race-comms-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/races/integration-smoke/comms/draft | 405 | - | pdx1::iad1::nd88g-1772507997246-733fbf2df21c | - | {"error":"Method not allowed"} |
| ai-event-doc-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/events/integration-smoke/documents/draft | 405 | - | pdx1::iad1::f2hxk-1772507999320-ba4ba325f00d | - | {"error":"Method not allowed"} |
| ai-club-support-get | PASS | GET | https://regattaflow-app.vercel.app/api/ai/club/support | 405 | - | pdx1::iad1::nd88g-1772508000355-17a5fee19e21 | - | {"error":"Method not allowed"} |
| cron-coach-retention-get | PASS | GET | https://regattaflow-app.vercel.app/api/cron/coach-retention-loop | 401 | - | pdx1::iad1::h4ssb-1772508000749-38c8ff259c18 | - | {"error":"Unauthorized"} |

## Notes

- Any `HTTP 500` with `x-vercel-error=FUNCTION_INVOCATION_FAILED` is a hard FAIL.
- Started: 2026-03-03T03:19:54.483Z
- Finished: 2026-03-03T03:20:00.866Z

