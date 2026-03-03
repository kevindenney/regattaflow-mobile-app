# Race-Management Alias Removal Checklist

Owner: Platform
Last updated: 2026-03-03

## Purpose

Track deprecation readiness for `/race-management` alias while `/programs` remains canonical.

## Date Gate

- Earliest redirect-only start date: 2026-04-01
- Earliest alias removal date: 2026-05-01
- Minimum runway: 30 days after redirect-only starts

## Prerequisites

- [ ] Alias usage telemetry is active (`race_management_alias_hit`).
- [ ] 14 consecutive days with alias usage under 5% of program entry traffic.
- [ ] Redirect-only flag enabled in production (`RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY=true`).
- [ ] Redirect-only soak period completed (>= 30 days) with no P0/P1 routing incidents.
- [ ] Release note callout drafted and approved.

## Removal Steps

1. Remove `race-management` screen registration in `app/(tabs)/_layout.tsx`.
2. Remove alias route file `app/(tabs)/race-management.tsx`.
3. Remove alias references from navigation/runtime contracts and integration checks.
4. Keep a migration note in deployment-readiness docs for one full release cycle.

## Rollback

- If redirect-only causes regressions, set `RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY=false`.
- If hard-removal causes regressions, restore alias route and tab registration from previous release tag.
