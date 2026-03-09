# QA Matrix (JHSON + RHKYC, Requester + Admin)

## Scope
Minimal browser QA for:
- Requester persona
- Admin persona
Across:
- JHSON (nursing, domain-gated open join)
- RHKYC (request-to-join)

## Preconditions
- App running at local URL (default `http://localhost:8081`).
- Two signed-in browser sessions: requester and admin.
- Demo org data present.

## Matrix

| Area | Persona | Org | Route | Action | Expected |
|---|---|---|---|---|---|
| Org discovery | Requester | JHSON | `/learn` | Search JHSON | Row visible and deduped |
| Domain gating | Requester | JHSON | `/learn` | Attempt join as non-`@jhu.edu` | `Restricted` shown |
| Request access | Requester | RHKYC | `/learn` | Click `Request access` | `Request sent` shown |
| Invite-only discovery | Requester | Invite-only org | `/learn` | View invite-only row | `Invite required` + `Use invite token` action shown |
| Pending queue update | Admin | RHKYC | `/organization/access-requests` | Watch queue after requester action | Pending row appears without refresh |
| Approve request | Admin | RHKYC | `/organization/access-requests` | Approve requester | Pending row removed; success state visible |
| Realtime membership | Requester | RHKYC | `/learn` | Keep page open during approval | Membership becomes active without refresh |
| Approval notification | Requester | RHKYC | `/social-notifications` | Open feed after approval | Contains `Membership approved` or `organization access is now active` |
| Grouped toggle | Requester | Any | `/social-notifications` | Switch Grouped/All | Both modes render; no duplicate spam cards |
| Admin tools presence | Admin | Active org | `/learn` | Check shortcuts | `Admin tools` with links to Access requests/Members/Cohorts/Templates |
| Members search/filter | Admin | Active org | `/organization/members` | Search + status/role filters | Correct filtered rows |
| Members role update | Admin | Active org | `/organization/members` | Change role | Row updates and persists |
| Members reset pending | Admin | Active org | `/organization/members` | Click Reset to pending | Status transitions and can be re-approved |
| Cohort create | Admin | Active org | `/organization/cohorts` | Create cohort | New cohort appears in list |
| Cohort membership | Admin | Active org | `/organization/cohort/[cohortId]` | Add requester | Member count/row updates |
| Template create/publish | Admin | Active org | `/organization/templates` | Create template | Template row appears/published |
| Template-cohort assign | Admin | Active org | `/organization/templates` | Link cohort to template | Assignment persists after refresh |
| Invite issuance path | Admin | Active org | `/learn` -> `/settings/organization-access` | Open Organization access admin tool | Invite composer + invite history available |
| Context pill | Both | JHSON | org admin routes | Check top context | `Context: Nursing` |
| Cohort-first recommendation | Requester | Active org | `/learn` | Open recommendations | `Recommended for your cohort` appears before program section |
| Safe leave guard | Requester | Active org | `/learn` | Try leaving only active org | Guard blocks orphaned state |

## Realtime Checks (No Refresh)
- Requester `Request sent` appears immediately after action.
- Admin access request list receives new pending row without page reload.
- Requester membership state flips to active after approval without reload.
- Requester notification card appears for approval event without reload.

## Smoke Harness
Run:

```bash
node scripts/smoke-multi-org-demo.mjs
```

Dual-session DB-backed mode (recommended):

```bash
SMOKE_DB_URL="postgres://..." \
SMOKE_ADMIN_EMAIL="kevin@oceanflow.io" \
SMOKE_REQUESTER_EMAIL="jhu2@jhu.edu" \
node scripts/smoke-multi-org-demo.mjs
```

Operator-assist mode control:
- `SMOKE_AUTO_CONTINUE=1` skips Enter prompts.
- `SMOKE_SKIP_BROWSER=1` runs only dual-session DB checks.

Expected PASS line IDs:
- `dual_db_prereq|PASS|...`
- `dual_context_resolve|PASS|...`
- `dual_pending_state|PASS|...`
- `dual_active_state|PASS|...`
- `dual_decision_notification|PASS|...`
- `learn_load|PASS|...`
- `learn_admin_tools|PASS|...`
- `learn_jhson_visible|PASS|...`
- `learn_membership_first|PASS|...`
- `activity_approval_notification|PASS|...`
- `members_route|PASS|...`
- `cohorts_route|PASS|...`
- `templates_route|PASS|...`
- `templates_interest_locked|PASS|...`
- `cleanup_no_dev_text|PASS|...`

Expected artifact line:
- `artifact|INFO|/tmp/multi-org-smoke.png`

## Evidence to Capture
- Screenshot of `/learn` with org actions.
- Screenshot/video of pending->approved realtime transition.
- Screenshot of Activity grouped/all toggle state.
- Screenshot of cohort recommendation section ordering.
- Smoke harness raw output + screenshot artifact path.
