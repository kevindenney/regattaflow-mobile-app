# Migration Merge Readiness

## Purpose
Use this file as the integration lane checklist while parallel Codex terminals implement plan blocks.

## Current Parallel Streams
| Stream | Scope | Owner/Terminal | Status | Notes |
|---|---|---|---|---|
| 1 | Route/API domain gating + mixed-domain cleanup | Terminal 1 | In progress | Focus on sailing-only surfaces and non-sailing redirects |
| 2 | Invite token flow end-to-end | Terminal 2 | In progress | Token deep link, opened/accepted/declined, membership activation |
| 3 | Role preset persistence via `domain_catalog` | Terminal 3 | In progress | `role_key` propagation + preset resolution |
| 4 | Programs/assessments/invites review pass | Terminal 4 | In progress | Bugs/security/regression findings |
| 5 | Coach shell next slice | Terminal 5 | In progress | Coach Home + assessments + unread threads + progress |

## File Overlap Watchlist
These are high-risk conflict hotspots. Resolve intentionally, not by last-writer-wins.

- `app/settings/organization-access.tsx`
- `services/OrganizationInviteService.ts`
- `services/ProgramService.ts`
- `app/programs/assign.tsx`
- `app/members/requests.tsx`
- `app/(tabs)/events.tsx`
- `app/(tabs)/race-management.tsx`
- `app/(tabs)/_layout.tsx`
- `hooks/useWorkspaceDomain.ts`
- `providers/OrganizationProvider.tsx`
- `supabase/migrations/*` (timestamp ordering + policy collisions)

## Rolling Conflict Scan (every 10-15 min)
```bash
git status --short
git diff --name-only
git diff --name-only | rg "organization-access|OrganizationInviteService|ProgramService|/migrations/"
```

## Migration Safety Checklist
For every new migration:

1. Timestamp is monotonic and later than existing local files.
2. No duplicate object names across migrations:
   - policies
   - indexes
   - triggers
   - functions
3. Uses `IF NOT EXISTS`/`DROP ... IF EXISTS` where practical.
4. RLS policy changes preserve expected roles:
   - admin/staff management paths
   - invitee self-service constraints
5. Any seed upserts use deterministic unique keys.
6. Header includes explicit `Canonical ownership` + `Override intent`.

## Canonical 20260302 Migration Order
1. `20260302110000_programs_core_model.sql`
2. `20260302113000_seed_jhu_programs.sql`
3. `20260302160000_create_organization_invites.sql`
4. `20260302173000_communication_thread_reads.sql`
5. `20260302190000_invite_tokens_and_role_presets.sql`
6. `20260302193000_org_invite_invitee_status_updates.sql`
7. `20260302200000_org_invite_completion_flow.sql`
8. `20260302203000_harden_assessment_records_select_rls.sql`
9. `20260302213000_harden_org_invite_rls.sql`
10. `20260302220000_enforce_org_invite_role_issuance.sql`

## Canonical Header Contract (20260302*)
- Every `20260302*` migration header must declare:
  - canonical symbol ownership for that file
  - override intent (none, transitional, or final replacement target)
- Explicit compatibility-retained symbols:
  - `organization_invites_insert_org_staff_base_v1` (`20260302160000...`)
  - `organization_invites_update_org_staff_base_v1` (`20260302160000...`)
  - `map_org_invite_role_v1(...)` (`20260302200000...`)
  - `respond_to_organization_invite_v1(...)` (`20260302200000...`)

## Canonical Override Map
- `organization_invites_insert_org_staff`:
  - base/staging policy is `organization_invites_insert_org_staff_base_v1` from `20260302160000...`
  - canonical final policy is `organization_invites_insert_org_staff` from `20260302213000...`
- `organization_invites_update_org_staff`:
  - base/staging policy is `organization_invites_update_org_staff_base_v1` from `20260302160000...`
  - invitee transition policy is `organization_invites_update_org_staff_invitee_transition_v2` from `20260302193000...`
  - canonical final policy is `organization_invites_update_org_staff` from `20260302213000...`
- Invite role issuance ceiling:
  - enforced by `trigger_enforce_org_invite_role_issuance` + `can_inviter_issue_org_invite_role(...)` in `20260302220000...`
  - canonical function names owned by `20260302220000...`:
    - `map_org_invite_role(...)`
    - `respond_to_organization_invite(...)`
  - legacy compatibility names retained in `20260302200000...`:
    - `map_org_invite_role_v1(...)`
    - `respond_to_organization_invite_v1(...)`
- `assessment_records` SELECT:
  - broad baseline in `20260302110000...`
  - replaced by scoped institutional/non-institution policies in `20260302203000...` (final behavior)
- Removed duplicate migration:
  - `20260302214000_harden_assessment_records_select_rls.sql` intentionally removed in favor of `20260302203000...`

## 2026-03-02 Conflict Sweep (20260302*)
- Scope: all `supabase/migrations/20260302*` files.
- Symbols checked: `CREATE POLICY`, `CREATE FUNCTION`, `CREATE OR REPLACE FUNCTION`.
- Result: duplicate policy/function names were reconciled into single canonical owners.
- Post-fix verification: no duplicate policy/function names remain across this timestamp group.

## Pre-Merge Assembly Order
1. Merge schema migrations first (resolve ordering/name conflicts).
2. Merge shared services (`OrganizationInviteService`, `ProgramService`).
3. Merge route/UI patches.
4. Run integration validation runbook (`docs/integration-validation.md`).
5. Produce final ship summary:
   - Shipped
   - Deferred
   - Risks

## Blockers / Escalations
- If two streams both changed the same RLS policy, stop and reconcile logic manually.
- If multiple streams added migrations touching same table/policy, consolidate before push.
- If typecheck passes but behavior diverges, prefer service-level tests + manual route smoke checks.

## 2026-03-02 Invite Flow Reconciliation
- Reviewed migrations:
  - `20260302160000_create_organization_invites.sql`
  - `20260302190000_invite_tokens_and_role_presets.sql`
  - `20260302193000_org_invite_invitee_status_updates.sql`
  - `20260302200000_org_invite_completion_flow.sql`
  - `20260302203000_harden_assessment_records_select_rls.sql`
  - `20260302213000_harden_org_invite_rls.sql`
  - `20260302220000_enforce_org_invite_role_issuance.sql`
- New migration `20260302200000_org_invite_completion_flow.sql` is additive and should be kept:
  - expands `organization_memberships.role` check to include domain roles
  - adds security-definer RPCs: `get_organization_invite_by_token`, `mark_organization_invite_opened`, `respond_to_organization_invite_v1`
  - keeps invite response atomic by creating/updating membership inside DB transaction
- Policy/function overlap decision:
  - keep canonical final invite policies in `20260302213000...`
  - keep canonical final role-issuance functions in `20260302220000...`
  - retain earlier implementations under explicit versioned names only (`_base_v1`, `_invitee_transition_v2`, `_v1`)
- App-side merge decision applied:
  - `app/settings/organization-access.tsx` now uses token-only accept/decline RPC calls; removed fallback `inviteId` path that depended on direct table reads under RLS.
  - `services/ComputerVisionService.ts` and `services/ai/SailAnalysisAIService.ts` now call `sail-analysis-chat` through `invokeSailingEdgeFunction` so race/sailing AI remains domain-gated.
- RLS hardening applied:
  - `20260302213000_harden_org_invite_rls.sql` restricts invite creation to management roles (`owner/admin/manager/coordinator`) and removes invitee direct table `UPDATE` path, forcing invitee response through RPC token flow.
  - `20260302203000_harden_assessment_records_select_rls.sql` replaces broad `assessment_records` org-member read policy with institution-scoped learner/staff/admin visibility while preserving non-institution org-member behavior.
