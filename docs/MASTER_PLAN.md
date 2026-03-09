# MASTER Plan (JHSON-First Multi-Org Demo)

## 1) North-Star Outcomes

Primary objective: ship a stable, repeatable, investor/demo-ready **JHSON-first multi-org experience** where:
- JHSON (nursing) and RHKYC (sail-racing) both function in one account.
- Join mode behavior is correct per org (`open_join` + domain gate vs `request_to_join`).
- Admin approval actions propagate in realtime without refresh.
- Learner recommendations prioritize cohort-linked templates.
- Activity notifications are deduped and useful.
- Demo can be validated quickly via smoke + minimal persona QA.

Success bar:
- Deterministic active-org behavior.
- No user-facing debug noise.
- Route-level admin gating and safe leave behavior.
- Clean migration path + reproducible reset flow.

## 2) Persona Journeys

### A) Learner / Requester (jhu2)
1. Sign in, open `/learn`, discover orgs.
2. Attempt JHSON join: domain gate enforced.
3. Request RHKYC access: `Request sent` appears.
4. Receive approval in realtime (membership + Activity feed).
5. Consume recommendations with cohort-first ordering (`Recommended for your cohort`).

### B) Coach
1. Access programs workspace and retention loop surfaces.
2. Review assigned learners/sessions and artifacts.
3. Use artifact queue/review actions and competency-linked evidence.
4. Observe retention signals (weekly recap/signature insights) for follow-up.

### C) Org Admin (Kevin)
1. Open Learn admin tools shortcuts.
2. Review `/organization/access-requests`, approve/reject pending users.
3. Manage `/organization/members` (role, reset-to-pending, remove access).
4. Create/manage `/organization/cohorts` and cohort members.
5. Create/manage `/organization/templates` and assign cohorts.

## 3) Architecture Summary

### Core Data Model
- `organizations`
- `organization_memberships`
- `betterat_org_cohorts`
- `betterat_org_cohort_members`
- `betterat_org_step_templates`
- `betterat_org_step_template_cohorts`
- `social_notifications`

### Join + Access Control
- Join mode and domain rules checked in org discovery/join service paths.
- Membership status canonicalization supports legacy schema fallbacks.
- Admin actions are role-gated with RLS-backed writes.

### Realtime + Notifications
- Membership + notifications subscriptions in provider/screens.
- Access requests and requester state update without hard refresh.
- Activity feed supports grouped/all view and dedupe paths.

### Recommendation Pipeline
- Org templates loaded by `org_id + interest_slug`.
- Cohort-linked templates resolved from template/cohort link table.
- Learn renders cohort section first, then program/org recommendations.

### Coach/Programs Surface (parallel track)
- Programs core schema + service + screens present.
- Coach retention loop + realtime hooks + API smoke checks present.
- Artifact review queue/workflows exist and connect to competency attempts.

## 4) Feature Inventory

| Feature | Status | Commit | Notes |
|---|---|---|---|
| Org interest slug + context pill | DONE | `37cb200`, `ed90fc9`, `5fdcd21` | Interest resolved and rendered as `Context: <Domain>`; fallback handling included. |
| JHSON identity dedupe/merge | DONE | `781b7db`, `bed625e`, `9e685fe` | Duplicate JHSON rows consolidated and cleaned from Learn. |
| Join modes in Learn | DONE | `1cab4df`, `5fe9580` | Supports `Join` and `Request access`, with open-join domain gate. |
| Domain gating (JHSON) | DONE | `5fe9580`, `20260309091500` migration | Non-`@jhu.edu` blocked for JHSON open join flow. |
| Re-request after rejected/pending transitions | DONE | `1e6f898`, `bfa9c79` | Re-request flow preserved with safe status transitions. |
| Access requests admin screen + approve/reject | DONE | `416e877`, `4276541`, `2dde1ab` | Admin-gated queue with decision writes + notification dispatch. |
| Realtime membership + notification updates | DONE | `350d030`, `1f6b965`, `2dde1ab` | Requester and admin both receive live updates. |
| Activity dedupe + grouped/all toggle | DONE | `76bcef5`, `a3807af` | Reduced duplicate notification noise and toggled grouping modes. |
| Members admin (search/status/role/actions) | DONE | `38127c8`, `9ef619e`, `0dc8e6d`, `a7f9719` | Role update, remove access, reset pending with admin guardrails. |
| Cohorts v1 | DONE | `92902b8`, `a8ec461` | Cohort CRUD + member management route in place. |
| Templates + cohort assignment | DONE | `83bce4d`, `6786b23` | Org templates constrained by interest + cohort linking. |
| Learn cohort-first recommendations | DONE | `39402ac`, `6786b23` | `Recommended for your cohort` rendered before program recommendations. |
| Learn admin tools + safe leave | DONE | `bd67dec`, `03df37d`, `381acae`, `88feb39` | Admin shortcuts + orphan-guard for leave flow. |
| Demo smoke harness | DONE | `f3bbb0e` | `scripts/smoke-multi-org-demo.mjs` validates key routes and signals. |
| Organization invites data/service stack | PARTIAL | `20260302160000`..`20260302223000`, app `org-invite.tsx` | Token + RPC/service paths exist; operational QA and admin UX hardening gaps remain. |
| Multi-persona automated E2E | PARTIAL | `f3bbb0e` | Current smoke is single-session and route/assertion oriented; dual-user decision automation remains. |
| Demo reset automation | PARTIAL | `a7f9719`, existing seed/cleanup scripts | Manual reset path exists; no single canonical reset script for JHSON/RHKYC demo personas. |
| Programs core workspace | PARTIAL | `20260302110000`, `20260302113000`, multiple contracts | Strong schema/service/tests exist; full QA convergence with multi-org demo still incomplete. |
| Coach retention + recap payload guards | PARTIAL | `3c52fb3`, `cb0fd48`, `ea8ed73` | Core loop exists; some roadmap docs still flag pending depth in persisted insight loop behavior. |
| Artifact review workflow | PARTIAL | `20260306121500`, `20260306150000` | Queue/detail screens exist; broader role/process QA and runbook integration pending. |
| End-to-end org invite-to-active flow in smoke harness | TODO | N/A | Add invitation issuance, acceptance, and role issuance checks to automated smoke. |
| Deterministic demo data bootstrap/reset for JHSON-first | TODO | N/A | One-command reset/seed pipeline for repeatable demos still missing. |
| Multi-org observability dashboard for demo incidents | TODO | N/A | Need machine-readable post-run summary across smoke + API + realtime checks. |

## 5) Next 10 Milestones (Dependency Ordered)

### M10 — Canonical Demo Reset Script
- Goal: one command to reset requester/admin membership, cohort links, and template assignments for JHSON + RHKYC.
- Acceptance:
  - `node scripts/reset-jhson-demo-state.mjs` returns success summary.
  - Produces deterministic starting state for requester/admin journey.
  - No destructive operations beyond scoped demo rows.
- Rollback:
  - Re-run previous seed scripts (`seed-demo-users-simple`, `seed-rhkyc-demo`) and restore backup SQL snapshot.

### M11 — Dual-Session Smoke Harness (Requester + Admin)
- Goal: automate pending->approve->active verification in realtime using two browser contexts.
- Acceptance:
  - Smoke output includes decision and requester realtime assertions.
  - Fails fast with clear step IDs and screenshot artifacts per failure.
- Rollback:
  - Keep existing single-session smoke harness as fallback (`smoke-multi-org-demo.mjs`).

### M12 — Invite Flow Hardening (Org Admin to Invitee)
- Goal: complete operational path for invite token issuance, open/accept, and role assignment.
- Acceptance:
  - Admin can issue invite from organization-access flow.
  - Invitee can accept token and land in correct org/status.
  - Security tests remain green for invite RLS + token RPC semantics.
- Rollback:
  - Disable invite entry points in UI and keep request-to-join as default path.

### M13 — Notification Contract Stabilization
- Goal: standardize membership decision notification payloads and grouped/all rendering expectations.
- Acceptance:
  - Contract test coverage for approval/rejection event shape.
  - No duplicate membership approval cards in grouped or all views.
- Rollback:
  - Revert to prior notification type union and disable grouping transform for membership events.

### M14 — Members/Cohorts/Templates Load-Time Budget
- Goal: set and enforce response/render budgets for admin routes under demo data volume.
- Acceptance:
  - Baseline metrics captured in docs.
  - p95 route load within agreed threshold on local demo env.
- Rollback:
  - Remove new aggressive query/index paths and retain current stable queries.

### M15 — Program Workspace + Org Context Alignment
- Goal: ensure Programs experience respects active org + domain context in the same way Learn does.
- Acceptance:
  - Active org mismatch is surfaced and recoverable.
  - Program assignment paths behave correctly for institution org types.
- Rollback:
  - Route fallback to existing canonical programs tab behavior without org-specific overlays.

### M16 — Coach Artifact Review QA Completion
- Goal: finish artifact queue/detail acceptance matrix for coach persona with role/rules checks.
- Acceptance:
  - Queue/list/detail/review states verified against competency attempts.
  - Error and empty states documented and tested.
- Rollback:
  - Hide artifact review actions behind feature flag while preserving read-only artifacts.

### M17 — Realtime Resilience (Reconnect + Ordering)
- Goal: harden membership/notification realtime handling for reconnect/order anomalies.
- Acceptance:
  - Simulated disconnect/reconnect does not lose final state.
  - Decision ordering remains consistent across requester/admin sessions.
- Rollback:
  - Temporarily add explicit refresh-on-focus fallback for critical admin/requester screens.

### M18 — Demo QA Matrix Automation Hooks
- Goal: map QA matrix rows to scriptable checks where possible.
- Acceptance:
  - QA matrix rows include command/test IDs.
  - At least 60% of matrix steps covered by scripted assertions.
- Rollback:
  - Keep matrix manual with explicit evidence screenshot checklist.

### M19 — Release Candidate Gate + Evidence Pack
- Goal: produce one command that emits release readiness report for JHSON-first demo.
- Acceptance:
  - Bundles typecheck, smoke, API validation, key route checks.
  - Generates machine-readable report + artifact index in `docs/`.
- Rollback:
  - Use existing `run-integration-validation.mjs` + manual checklist bundle.

