# Milestones (Multi-Org Demo, JHSON First)

## M1 — Org Interest + Identity Hygiene
Acceptance:
- `interest_slug` available (column or metadata fallback).
- JHSON resolves to `nursing`, RHKYC resolves to `sail-racing`.
- Learn org search dedupes and membership-first row behavior is stable.
- Org context pill loads without avoidable schema errors.

Manual:
1. Search JHSON and confirm one visible row.
2. Open org admin screens and verify context pill matches org interest.

## M2 — Join Modes + Domain Gating
Acceptance:
- Join mode respected in UI and server path.
- JHSON non-jhu blocked server-side and UI-side.
- RHKYC request-to-join creates pending membership.

Manual:
1. Non-jhu tries JHSON and sees blocked path.
2. RHKYC request creates pending state.

## M3 — Approval Workflow + Realtime + Notifications
Acceptance:
- Approve/reject writes consistent membership fields.
- Admin pending list updates live.
- Requester receives realtime membership + notification updates.

Manual:
1. Admin approves request; requester sees active state without refresh.
2. Requester sees approval notification in Activity feed.

## M4 — Members Admin: Filters/Search/Roles/Actions
Acceptance:
- Search and status filter pills are usable.
- Role filters/labels are interest-aware.
- Role update/remove/reset actions are admin-gated and safe.

Manual:
1. Filter members by status and role.
2. Update role and verify reflected label.
3. Perform remove/reset action on non-self member.

## M5 — Cohorts v1
Acceptance:
- Cohort list/detail are stable and role-gated.
- Admin can add/remove cohort members.
- Learner sees cohort context where applicable.

Manual:
1. Create cohort.
2. Add and remove a member.

## M6 — Templates + Cohort Recommendations
Acceptance:
- Templates are org-interest locked.
- Cohort assignment works.
- Learn dedupes and orders recommendations (cohort first, then program).

Manual:
1. Create template and assign cohort.
2. Verify Learn recommendation ordering and dedupe.

## M7 — Learn: Admin Tools + Leave Polish
Acceptance:
- Admin tools shortcuts visible for admins.
- Leave action blocks orphaned user state.
- Current org switching is safe and deterministic.

Manual:
1. Verify admin links render.
2. Attempt leave when only one active org remains (blocked).

## M8 — Cleanup + Consistency
Acceptance:
- No noisy dev-proof text in user-facing rows.
- Shared helpers for status/admin/interest are consistent.
- No `supabase/.temp/cli-latest` commits.

Manual:
1. Smoke test Learn + members + cohorts + templates + notifications.
2. Confirm clean git status except local temp artifacts.

## Manual Verification Log
- M1 completed (migration + typecheck).
- M2 completed (domain-gated join modes).
- M3 completed (approval write hardening + realtime admin/requester updates).
- M4 completed (members fetch fallback for legacy membership schema + filters/actions verified in code path).
- M5 completed (cohort create now derives `interest_slug` from active org context instead of free-text input).
- M6 completed (template cohort assignment list now filters to org-interest-compatible cohorts).
- M7 completed (Learn already shows admin tool shortcuts for admins and enforces safe leave/orphan guards).
- M8 completed (removed remaining org-admin dev diagnostic text from members/cohorts/cohort detail surfaces).
