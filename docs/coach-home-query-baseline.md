# Coach Home Query Baseline

Generated: 2026-03-03
Scope: `hooks/useCoachHomeData.ts` refresh path

## Budget

- P95 target for Coach Home refresh: `<= 600ms`

## Profiled Steps

| Step | Description | Target |
|---|---|---|
| `core_queries` | Assigned programs, due summary, unread counts, trends, recent assessments | <= 350ms |
| `assigned_program_preview` | Program preview row hydration for top assigned programs | <= 120ms |
| `derive_retention_metrics` | Reminder/streak/recap derivation from fetched records | <= 80ms |
| `state_commit` | React state commit for counts/previews/trends/retention | <= 50ms |

## Notes

- Runtime profiling currently emits warnings only in `__DEV__` when total refresh time exceeds budget.
- Steps are captured by `lib/coach/coachHomeProfiling.ts`.
- JSON export helper `toCoachHomeBaselineInput(...)` can convert in-app profile summaries to the report script input shape.
- This baseline is deterministic and intended as a starting guardrail, not a production latency SLA report.
