# Admin Route Load Baseline (M14)

Scope: local demo environment route-load timings for:
- `/organization/members`
- `/organization/cohorts`
- `/organization/templates`

Measurement harness:
- `scripts/measure-admin-route-loads.mjs`

Run used for baseline:
- Generated at: `2026-03-09T00:33:00.889Z`
- Base URL: `http://localhost:8081`
- Iterations: `5`
- Scoring rule: discard first measured run per route (`MEASURE_DISCARD_RUNS=1`)
- Budget: `p95 <= 3500ms`

## Results

| Route | Avg (ms) | p95 (ms) | Budget (ms) | Status |
|---|---:|---:|---:|---|
| `/organization/members` | 1548 | 1599 | 3500 | PASS |
| `/organization/cohorts` | 1496 | 1534 | 3500 | PASS |
| `/organization/templates` | 1533 | 1554 | 3500 | PASS |

Overall: `PASS`

## Re-run Command

```bash
node scripts/measure-admin-route-loads.mjs
```

Optional knobs:
- `MEASURE_BASE_URL` (default `http://localhost:8081`)
- `MEASURE_PROFILE_DIR` (default `.chrome-devtools`)
- `MEASURE_ITERATIONS` (default `5`)
- `MEASURE_DISCARD_RUNS` (default `1`)
- `MEASURE_BUDGET_MS` (default `3500`)
- `MEASURE_OUTPUT_PATH` (default `/tmp/m14-route-budget.json`)

## Output Contract
The script prints machine-readable lines:
- `route_<id>_run_<n>|PASS/FAIL|...`
- `route_<id>_p95|PASS/FAIL|avg=... p95=...`
- `route_budget_overall|PASS/FAIL|...`

And writes JSON artifact:
- `/tmp/m14-route-budget.json`
