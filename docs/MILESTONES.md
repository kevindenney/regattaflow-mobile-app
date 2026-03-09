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

## M9 — Demo Smoke Harness (Unbuilt -> Built)
Acceptance:
- Repeatable browser smoke script exists for JHSON-first multi-org demo.
- Script checks Learn, Activity notifications, Members/Cohorts/Templates routes, and cleanup signals.
- Output is machine-readable (`id|PASS/FAIL|detail`) for quick triage.

Manual:
1. Run `node scripts/smoke-multi-org-demo.mjs`.
2. Confirm `/tmp/multi-org-smoke.png` is generated and review any FAIL rows.

## M10 — Canonical Demo Reset Script
Acceptance:
- `scripts/reset-multi-org-demo.mjs` resets demo org/persona state deterministically.
- Script is idempotent and prints machine-readable `PASS/FAIL` lines by step.
- Works in auto mode with `psql` + DB URL, and has deterministic SQL fallback packet.
- Ensures:
  - JHSON `open_join`, `allowed_email_domains=['jhu.edu']`, `interest_slug='nursing'`
  - RHKYC `request_to_join`, `interest_slug='sail-racing'`
  - Admin active `admin` membership in both orgs
  - Requester active in JHSON and pending in RHKYC
  - One cohort + one template linked to cohort in each org
  - Optional bounded cleanup of old membership-decision notifications for requester

Manual:
1. Run:
   `DEMO_ADMIN_EMAIL=\"kevin@oceanflow.io\" DEMO_REQUESTER_EMAIL=\"jhu2@jhu.edu\" DEMO_RESET_DB_URL=\"postgres://...\" node scripts/reset-multi-org-demo.mjs`
2. Confirm script outputs `reset_verify|PASS|ok` and `reset_complete|PASS|...`.
3. If DB URL/`psql` is unavailable, execute fallback steps from `docs/RESET_SQL.md`.

## M11 — Dual-Session Smoke Harness
Acceptance:
- `scripts/smoke-multi-org-demo.mjs` supports two-persona operator flow (requester + admin).
- Harness verifies pending -> approved -> active transition using DB reads (not browser action simulation).
- Harness emits machine-readable `PASS/FAIL` step lines for dual-session checks and route checks.
- QA matrix documents dual-session invocation and expected IDs.

Manual:
1. Run:
   `SMOKE_DB_URL=\"postgres://...\" SMOKE_ADMIN_EMAIL=\"kevin@oceanflow.io\" SMOKE_REQUESTER_EMAIL=\"jhu2@jhu.edu\" node scripts/smoke-multi-org-demo.mjs`
2. Follow prompts:
   - Open requester session, perform Request Access.
   - Open admin session, approve request.
3. Confirm:
   - `dual_pending_state|PASS|...`
   - `dual_active_state|PASS|...`
   - `dual_decision_notification|PASS|...`
4. Confirm existing route smoke checks still pass (unless `SMOKE_SKIP_BROWSER=1`).

## M12 — Invite Flow Hardening
Acceptance:
- Invite-only org rows in Learn provide a requester path (`Use invite token`) instead of passive label-only state.
- Learn admin tools expose direct invite-management entry (`Organization access`) for admin/manager users.
- QA matrix includes invite-only requester and admin invite-issuance checks.

Manual:
1. In `/learn`, find an `invite_only` organization.
2. Confirm row shows `Invite required` and `Use invite token`.
3. Click `Use invite token` and confirm navigation to `/org-invite`.
4. In admin session, open `/learn` and confirm `Organization access` appears in Admin tools.
5. Click `Organization access` and confirm invite composer/history render in `/settings/organization-access`.

## M13 — Notification Contract Stabilization
Acceptance:
- Membership decision notifications normalize to canonical types (`org_membership_approved` / `org_membership_rejected`) even when legacy rows use `org_membership_decision`.
- Grouped/all notification modes avoid duplicate semantic buckets caused by legacy vs canonical type mismatch.
- Contract test coverage explicitly checks canonical membership decision notification handling in service layer.

Manual:
1. Trigger an org membership approval and rejection flow.
2. Open `/social-notifications` and switch between `Grouped` and `All`.
3. Verify decision notifications do not fork into duplicate type buckets for the same semantic event.
4. Confirm legacy decision rows (if present) render as approved/rejected semantics, not an unknown type.

## M14 — Members/Cohorts/Templates Load-Time Budget
Acceptance:
- Route-load budget harness exists for admin surfaces:
  - `/organization/members`
  - `/organization/cohorts`
  - `/organization/templates`
- Baseline metrics captured in docs with explicit scoring rule and thresholds.
- Local demo p95 stays within agreed threshold (`<= 3500ms`) using the documented run method.

Manual:
1. Run:
   `node scripts/measure-admin-route-loads.mjs`
2. Confirm per-route `route_<id>_p95|PASS|...` lines.
3. Confirm `route_budget_overall|PASS|...`.
4. Validate latest values in `docs/ADMIN_ROUTE_LOAD_BASELINE.md`.

## Manual Verification Log
- M1 completed (migration + typecheck).
- M2 completed (domain-gated join modes).
- M3 completed (approval write hardening + realtime admin/requester updates).
- M4 completed (members fetch fallback for legacy membership schema + filters/actions verified in code path).
- M5 completed (cohort create now derives `interest_slug` from active org context instead of free-text input).
- M6 completed (template cohort assignment list now filters to org-interest-compatible cohorts).
- M7 completed (Learn already shows admin tool shortcuts for admins and enforces safe leave/orphan guards).
- M8 completed (removed remaining org-admin dev diagnostic text from members/cohorts/cohort detail surfaces).
- M9 completed (added `scripts/smoke-multi-org-demo.mjs` and documented usage).
- M10 completed (added canonical reset wrapper `scripts/reset-multi-org-demo.mjs` and deterministic SQL packet `docs/RESET_SQL.md`).
- M11 completed (enhanced smoke harness with dual-session DB-backed pending->active verification and updated QA matrix).
- M12 completed (hardened invite-only UX with requester token path and admin invite-management shortcut from Learn).
- M13 completed (normalized legacy org membership decision notification types and added service contract checks).
- M14 completed (added route-load budget harness and captured passing local p95 baseline in `docs/ADMIN_ROUTE_LOAD_BASELINE.md`).
