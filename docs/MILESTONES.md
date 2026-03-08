# Milestones (JHSON-First)

## M1 — Data Hygiene + Org Identity Stability
Scope:
- Keep a single canonical JHSON org identity active.
- Ensure inactive orgs do not appear in org discovery.
- Ensure org interest context defaults are present for key orgs.

Acceptance Criteria:
- JHSON search returns one visible row in Learn.
- All `organizations` search paths filter to `is_active=true`.
- JHSON and core sailing orgs have deterministic `interest_slug` values.

Manual Test Steps (Web):
1. Learn > Find organization > search `Johns Hopkins School of Nursing`.
2. Confirm only one active row is shown.
3. Open admin pages and confirm context pill/labels reflect interest slug.

Rollback / Safety Notes:
- Migration is idempotent and only updates targeted org patterns.
- Soft-merge behavior deactivates duplicates rather than deleting org rows.

## M2 — Membership Lifecycle Hardening
Scope:
- Standardize approve/reject payload fields.
- Reduce noisy missing-row/missing-column errors (400/406) in admin flows.
- Keep requester/admin state updates reliable with realtime and notification hooks.

Acceptance Criteria:
- Approve/reject writes set a consistent membership field set.
- No avoidable `.single()` 406 in cohort/member admin flow.
- Pending requests list updates after realtime membership changes.

Manual Test Steps (Web):
1. Approve a pending request and verify requester becomes active without full page reload.
2. Reject a pending request and verify status transitions cleanly.
3. Open cohort detail with invalid/non-existent row and verify graceful handling.

Rollback / Safety Notes:
- Changes are additive and can be reverted at component/service level without schema rollback.

## M3 — Learn Tab JHSON-First Polish
Scope:
- Preserve domain-gated open join behavior.
- Ensure membership-first action rendering in org search.
- Keep recommendation ordering deterministic (cohort first, then program).

Acceptance Criteria:
- Existing member sees `Member` state only.
- Non-jhu user sees `Restricted` for JHSON open-join row.
- Cohort recommendations render above organization program recommendations.

Manual Test Steps (Web):
1. Validate non-jhu and jhu user action states for JHSON.
2. Verify one row per org display and no mixed action states.
3. Verify recommendation sections order.

Rollback / Safety Notes:
- UI-only logic; low-risk rollback via component revert.

## M4 — Members Admin: Search/Filters/Roles
Scope:
- Interest-aware role bucket labels.
- Search and status filters stable and predictable.
- Safe member actions for role/status updates.

Acceptance Criteria:
- Filters return expected cohorts of users.
- Role labels are humanized and interest-aware.
- Update actions do not break active-org constraints.

Manual Test Steps (Web):
1. Apply status and role filters.
2. Change role and verify immediate UI update.
3. Validate reject/reset flows.

Rollback / Safety Notes:
- No destructive writes beyond existing member update paths.

## M5 — Cohorts UX + Stability
Scope:
- Cohort create defaults to org interest.
- Cohort member management robust with stable fetch patterns.
- Learn displays cohort chips and cohort recommendations first.

Acceptance Criteria:
- New cohort defaults interest slug from org.
- Add/remove cohort members without brittle join errors.
- Learn cohort context appears for eligible users.

Manual Test Steps (Web):
1. Create cohort from org admin page.
2. Add/remove members from cohort detail page.
3. Verify Learn cohort chip + recommendations.

Rollback / Safety Notes:
- Cohort write paths guarded by org admin role checks.

## M6 — Templates Interest + Cohort Assignment UX
Scope:
- Templates bound to org interest context.
- Cohort assignment controls stable and reflected in Learn.

Acceptance Criteria:
- Template creation uses org interest slug.
- Cohort assignment persists and impacts Learn recommendations.

Manual Test Steps (Web):
1. Create template and assign cohort.
2. Confirm template appears under cohort recommendations.
3. Toggle publish and verify visibility behavior.

Rollback / Safety Notes:
- Assignment changes isolated to bridge table rows.

## M7 — Cleanup + Consistency
Scope:
- Remove stale debug text.
- Consolidate status normalization helpers.
- Keep diagnostics guarded behind non-production checks only where needed.

Acceptance Criteria:
- No dev-proof/debug text in user-facing rows.
- Shared helper usage is consistent.

Manual Test Steps (Web):
1. Review org search rows for user-facing cleanliness.
2. Smoke-test members/cohorts/templates views.

Rollback / Safety Notes:
- Mostly refactor/cleanup; low-risk.

## Manual Verification Log (Implemented Milestones)
- M1:
  - `supabase db push` applied `20260309152000_seed_org_interest_slug_defaults.sql`.
  - Confirmed migration idempotence via NOTICE output (`nursing rows=0 sailing rows=0` in current env).
  - `npm run typecheck` passed after migration.
- M2: pending
- M2:
  - `supabase db push` confirmed remote database up to date for this code-only milestone.
  - Standardized access-request approve/reject writes with fallback-safe payloads.
  - Replaced cohort detail `.single()` with `.maybeSingle()` and graceful not-found handling.
  - `npm run typecheck` passed.
- M3: pending
