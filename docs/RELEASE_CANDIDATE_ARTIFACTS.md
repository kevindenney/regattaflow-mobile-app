# Release Candidate Artifacts

- Generated: 2026-03-09T00:48:30.159Z
- Overall: **PASS**
- Summary: 2 PASS, 0 FAIL, 3 SKIP (5 total)

## Validation Results

| ID | Category | Status | Command | Detail |
|---|---|---|---|---|
| typecheck | quality | PASS | `npm run typecheck` | npm run typecheck (4907ms) |
| qa_matrix_coverage | quality | PASS | `node scripts/qa-matrix-coverage.mjs` | node scripts/qa-matrix-coverage.mjs (21ms) |
| smoke_multi_org_demo | smoke | SKIP | `node scripts/smoke-multi-org-demo.mjs` | Skipped via --skip-smoke |
| api_smoke_deploy | api | SKIP | `node scripts/run-api-smoke-deploy.mjs` | Skipped via --skip-api |
| integration_validation | integration | SKIP | `node scripts/run-integration-validation.mjs` | Skipped via --skip-integration |

## Artifact Index

- [x] `docs/QA_MATRIX.md` - Matrix rows + automation hook IDs
- [x] `docs/MILESTONES.md` - Milestone acceptance/manual log
- [x] `docs/release-candidate-latest.json` - Machine-readable release gate output
- [ ] `docs/RELEASE_CANDIDATE_ARTIFACTS.md` - Human-readable artifact index and command outcomes
- [x] `docs/api-smoke-deploy.md` - API smoke details (when API smoke runs)
- [x] `docs/integration-validation-latest.md` - Integration validation report (when integration validation runs)
- [x] `/tmp/multi-org-smoke.png` - Browser smoke screenshot artifact (when smoke runs with browser)

## Command

```bash
node scripts/release-candidate-gate.mjs
```

Optional flags:
- `--skip-smoke`
- `--skip-api`
- `--skip-integration`
