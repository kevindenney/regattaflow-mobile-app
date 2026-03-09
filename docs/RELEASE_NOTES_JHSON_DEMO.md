# Release Notes: JHSON-First Multi-Org Demo

## Scope
This release packages the current end-to-end multi-org demo flow with **JHSON (nursing)** and **RHKYC (sail-racing)** as the primary test orgs.

## Shipped Capabilities

### 1) Multi-org identity + context
- Active organization context is resolved deterministically.
- Organization interest context is normalized and surfaced via context pill (for example: `Context: Nursing`).
- Learn org discovery dedupes duplicate org rows and prefers membership-aware ordering.

### 2) Join modes + domain gating
- Per-org join mode behavior in Learn:
- `open_join` orgs can be joined immediately unless domain restricted.
- `request_to_join` orgs create pending membership requests.
- Domain-gated open join enforced for JHSON (for `@jhu.edu` users).

### 3) Approval workflow + realtime
- Admin can approve/reject pending membership requests.
- Requester receives realtime membership state updates.
- Access-request lists update live for admins.

### 4) Notifications + activity dedupe
- Membership decision notifications are emitted and surfaced in Activity.
- Activity feed dedupe and unread badge improvements reduce duplicate/noisy events.

### 5) Members admin tools
- Members page includes search, status filters, role filters, and sort options.
- Admin actions: role change, remove access, reset to pending.
- Interest-aware role labels and grouping (nursing vs sail-racing).

### 6) Cohorts v1
- Admin can create cohorts and manage cohort membership.
- Cohort screens are role-gated and respect active org context.

### 7) Templates + cohort assignment
- Organization templates are interest-locked.
- Admin can assign templates to cohorts.
- Cohort assignment links to Learn recommendation ordering.

### 8) Learn recommendations + admin shortcuts
- Learn shows cohort-first recommendations (`Recommended for your cohort`) before program/org recommendations.
- Admin shortcuts available in Learn: Access requests, Members, Cohorts, Templates.
- Safe leave behavior prevents orphaned users with zero active org memberships.

### 9) Demo smoke harness
- Added repeatable browser smoke test:
- `node scripts/smoke-multi-org-demo.mjs`
- Emits machine-readable `id|PASS/FAIL|detail` lines and screenshot artifact `/tmp/multi-org-smoke.png`.

## Key Routes
- `/learn`: org discovery, join/request actions, recommendations, admin tools.
- `/social-notifications`: approval/activity feed verification.
- `/organization/access-requests`: pending access queue, approve/reject.
- `/organization/members`: member search/filter/role/admin actions.
- `/organization/cohorts`: cohort list/create.
- `/organization/cohort/[cohortId]`: cohort detail and membership management.
- `/organization/templates`: org template creation/publish and cohort assignment.

## Milestone Commits
From `docs/MILESTONES.md` and recent git history:
- `37cb200` M1: stabilize org identity and interest context
- `5fe9580` JHSON: open_join with domain gating
- `2dde1ab` Org: realtime approval + notifications
- `0dc8e6d` Org: members admin filters + actions
- `a8ec461` Org: cohorts v1
- `6786b23` Org: templates + cohort recommendations
- `381acae` Learn: admin tools + leave polish
- `e4f8478` Chore: cleanup + consistency
- `f3bbb0e` Plan: implement demo smoke harness

Additional recent related commits (short hashes):
- `bfa9c79` Org join: fix re-request pending transition
- `1e6f898` Org join: allow re-request after review
- `a7f9719` Org admin: reset member to pending
- `76bcef5` Notifications: dedupe activity + unread badge
- `350d030` Realtime: org membership + notifications live updates

## Known Limitations
- Demo assumes seeded org/user data exists (JHSON, RHKYC, test personas).
- Domain gating outcome depends on requester email domain.
- Learn recommendations are interest/org scoped; wrong active org or interest can appear as “missing data.”
- Cohort recommendations require requester to be assigned to at least one cohort and template links to that cohort.
- Admin actions are role-gated; non-admins will see read-only/blocked paths.
- Realtime behavior depends on active session and network connectivity.

## How To Run Smoke Harness
- Start app locally and sign into a session with relevant demo memberships.
- Run:

```bash
node scripts/smoke-multi-org-demo.mjs
```

- Optional env vars:
- `SMOKE_BASE_URL` (default `http://localhost:8081`)
- `SMOKE_PROFILE_DIR` (default `.chrome-devtools`)

- Expect output lines like:
- `learn_load|PASS|...`
- `activity_approval_notification|PASS|...`
- `artifact|INFO|/tmp/multi-org-smoke.png`

## How To Reset Demo State
Recommended manual reset workflow (non-destructive to app code):
1. Ensure both personas are signed in and switch to target org in `/learn`.
2. In `/organization/members`, use **Reset to pending** or **Remove access** for requester rows as needed.
3. In `/organization/access-requests`, re-approve or reject to replay decision flow.
4. In `/organization/cohorts` and `/organization/cohort/[cohortId]`, remove/re-add requester to cohort to replay recommendation flow.
5. In `/organization/templates`, unassign/reassign cohort links or publish/unpublish templates to validate recommendation ordering.
6. Re-run smoke harness:

```bash
node scripts/smoke-multi-org-demo.mjs
```
