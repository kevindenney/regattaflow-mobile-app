# Feature Flag Rollback Runbook

Owner: Platform
Last updated: 2026-03-03

## Scope

This runbook defines rollback actions for Blueprint v2 gating flags:

- `PROGRAM_DATA_MODEL_V1`
- `COACH_SHELL_V1`
- `DOMAIN_GATE_AI_STRICT_V1`
- `SECONDARY_PACKS_V1`

## Rollback Triggers

- P0/P1 production incident linked to a gated surface.
- Sustained error-rate increase (>2x baseline for 10+ minutes).
- Critical user path blocked by policy/routing/gating regression.

## Rollback Procedure

1. Identify the failing lane and corresponding flag.
2. Toggle only the affected flag to `false` in runtime configuration.
3. Verify core smoke checks:
   - auth middleware path health
   - programs shell navigation path health
   - AI endpoint controlled failure behavior (401/403/405, no runtime crash)
4. Post incident note with:
   - flag toggled
   - start/end timestamps
   - observed impact and mitigation

## Flag-Specific Notes

### `PROGRAM_DATA_MODEL_V1`
- Expected rollback effect: programs UI should avoid new model-only behavior.
- Verify: `/programs`, `/programs/assign`, `/programs/templates` render without hard failures.

### `COACH_SHELL_V1`
- Expected rollback effect: coach home shell cards/retention blocks can be disabled.
- Verify: `/clients` renders and refresh works without coach-shell derivation errors.

### `DOMAIN_GATE_AI_STRICT_V1`
- Expected rollback effect: strict domain gate behavior can be relaxed for emergency recovery.
- Verify: affected AI endpoints return controlled responses and avoid invocation failures.

### `SECONDARY_PACKS_V1`
- Expected rollback effect: secondary packs hidden from shared skeleton.
- Verify: drawing/fitness pack routes and API surfaces are not presented.

## Restore Procedure

1. Patch root cause in code and validate in CI.
2. Re-enable the flag in staging.
3. Run strict integration validation.
4. Re-enable in production with monitoring.
