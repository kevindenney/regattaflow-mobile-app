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

| Area | Persona | Org | Route | Action | Expected | Automation Hook | Run |
|---|---|---|---|---|---|---|---|
| Org discovery | Requester | JHSON | `/learn` | Search JHSON | Row visible and deduped | `smoke:learn_jhson_visible` | `node scripts/smoke-multi-org-demo.mjs` |
| Domain gating | Requester | JHSON | `/learn` | Attempt join as non-`@jhu.edu` | `Restricted` shown | `test:qa-matrix-hooks.contract#learn-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Request access | Requester | RHKYC | `/learn` | Click `Request access` | `Request sent` shown | `test:qa-matrix-hooks.contract#learn-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Invite-only discovery | Requester | Invite-only org | `/learn` | View invite-only row | `Invite required` + `Use invite token` action shown | `test:qa-matrix-hooks.contract#learn-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Pending queue update | Admin | RHKYC | `/organization/access-requests` | Watch queue after requester action | Pending row appears without refresh | `smoke:dual_pending_state` | `SMOKE_DB_URL=... node scripts/smoke-multi-org-demo.mjs` |
| Approve request | Admin | RHKYC | `/organization/access-requests` | Approve requester | Pending row removed; success state visible | `smoke:dual_active_state` | `SMOKE_DB_URL=... node scripts/smoke-multi-org-demo.mjs` |
| Realtime membership | Requester | RHKYC | `/learn` | Keep page open during approval | Membership becomes active without refresh | `smoke:dual_active_state` | `SMOKE_DB_URL=... node scripts/smoke-multi-org-demo.mjs` |
| Approval notification | Requester | RHKYC | `/social-notifications` | Open feed after approval | Contains `Membership approved` or `organization access is now active` | `smoke:dual_decision_notification` | `SMOKE_DB_URL=... node scripts/smoke-multi-org-demo.mjs` |
| Grouped toggle | Requester | Any | `/social-notifications` | Switch Grouped/All | Both modes render; no duplicate spam cards | `smoke:activity_view_toggle_controls` | `node scripts/smoke-multi-org-demo.mjs` |
| Admin tools presence | Admin | Active org | `/learn` | Check shortcuts | `Admin tools` with links to Access requests/Members/Cohorts/Templates | `smoke:learn_admin_tools` | `node scripts/smoke-multi-org-demo.mjs` |
| Members search/filter | Admin | Active org | `/organization/members` | Search + status/role filters | Correct filtered rows | `test:qa-matrix-hooks.contract#members-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Members role update | Admin | Active org | `/organization/members` | Change role | Row updates and persists | `test:qa-matrix-hooks.contract#members-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Members reset pending | Admin | Active org | `/organization/members` | Click Reset to pending | Status transitions and can be re-approved | `test:qa-matrix-hooks.contract#members-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Cohort create | Admin | Active org | `/organization/cohorts` | Create cohort | New cohort appears in list | `test:qa-matrix-hooks.contract#cohort-template-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Cohort membership | Admin | Active org | `/organization/cohort/[cohortId]` | Add requester | Member count/row updates | `test:qa-matrix-hooks.contract#cohort-template-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Template create/publish | Admin | Active org | `/organization/templates` | Create template | Template row appears/published | `test:qa-matrix-hooks.contract#cohort-template-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Template-cohort assign | Admin | Active org | `/organization/templates` | Link cohort to template | Assignment persists after refresh | `test:qa-matrix-hooks.contract#cohort-template-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Invite issuance path | Admin | Active org | `/learn` -> `/settings/organization-access` | Open Organization access admin tool | Invite composer + invite history available | `smoke:org_access_invite_panel` | `node scripts/smoke-multi-org-demo.mjs` |
| Context pill | Both | JHSON | org admin routes | Check top context | `Context: Nursing` | `smoke:templates_context_hint` | `node scripts/smoke-multi-org-demo.mjs` |
| Cohort-first recommendation | Requester | Active org | `/learn` | Open recommendations | `Recommended for your cohort` appears before program section | `test:qa-matrix-hooks.contract#learn-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |
| Safe leave guard | Requester | Active org | `/learn` | Try leaving only active org | Guard blocks orphaned state | `test:qa-matrix-hooks.contract#learn-cues` | `npm test -- app/__tests__/qa-matrix-hooks.contract.test.ts` |

## Realtime Checks (No Refresh)
- Requester `Request sent` appears immediately after action.
- Admin access request list receives new pending row without page reload.
- Requester membership state flips to active after approval without reload.
- Requester notification card appears for approval event without reload.

## Coach Artifact Review Checks
- Route: `/coach/artifact-queue`
- Signed-out behavior:
  - Expected: `Sign in to view assigned artifact reviews.`
- Queue behavior:
  - Expected summary chips for `requested` and `in review` counts.
  - `Review` action opens `/coach/artifact-review/[artifactId]`.
- Detail route: `/coach/artifact-review/[artifactId]`
  - For `requested` status:
    - Expected cue: `Next step: start review to unlock completion.`
    - `Mark completed` must be disabled.
  - After `Start review`:
    - Status becomes `in_review`.
    - `Mark completed` enabled.
  - Completing review:
    - Request status transitions to `completed`.
    - For `clinical_reasoning` artifacts, competency-attempt validation runs; if fallback schema blocks this, warning text is shown instead of silent failure.
  - Not-assigned artifact:
    - Expected card: `Not assigned`.

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
- `activity_view_toggle_controls|PASS|...`
- `members_route|PASS|...`
- `cohorts_route|PASS|...`
- `templates_route|PASS|...`
- `templates_interest_locked|PASS|...`
- `templates_context_hint|PASS|...`
- `org_access_invite_panel|PASS|...`
- `cleanup_no_dev_text|PASS|...`

Expected artifact line:
- `artifact|INFO|/tmp/multi-org-smoke.png`

## Matrix Automation Coverage
Coverage command:

```bash
node scripts/qa-matrix-coverage.mjs
```

Expected line:
- `qa_matrix_automation_ratio|PASS|...` (threshold: `>= 60%`)

## Evidence to Capture
- Screenshot of `/learn` with org actions.
- Screenshot/video of pending->approved realtime transition.
- Screenshot of Activity grouped/all toggle state.
- Screenshot of cohort recommendation section ordering.
- Smoke harness raw output + screenshot artifact path.
