# Multi-Org Demo Script (JHSON Prioritized)

## Personas
- Requester (learner)
- Org Admin

## Orgs
- JHSON (`nursing`, `open_join`, domain-gated `jhu.edu`)
- RHKYC (`sail-racing`, `request_to_join`)

## Pre-check
1. Open web app in two browser sessions (admin + requester).
2. Ensure both users are signed in.
3. Ensure requester is not yet active in target org for approval flow.

## Walkthrough

### 1) Learn org discovery and join-mode behavior
1. In requester session, open Learn > Find an organization.
2. Search `Johns Hopkins School of Nursing`.
3. Expected:
- Non-`@jhu.edu` requester sees `Restricted`.
- `@jhu.edu` requester sees `Join`.
4. Search `Royal Hong Kong Yacht Club`.
5. Expected: `Request access` button (request-to-join).

### 2) Request-to-join and realtime pending state
1. Requester clicks `Request access` for RHKYC.
2. Expected immediately:
- Requester sees `Request sent` in Learn.
- Admin session Access Requests list updates without full refresh.

### 3) Admin decision and realtime requester updates
1. In admin session, open Admin tools > Access requests.
2. Approve requester.
3. Expected in requester session without refresh:
- Membership flips to active (`Member`/org membership active state).
- Activity/Bell feed receives org membership approval notification.
4. Repeat with reject/reset-to-pending for a second requester if available.

### 4) Members admin controls
1. In admin session, open Members.
2. Validate:
- Search works.
- Status filter pills and role filters are present and interest-aware.
- Sort controls work.
3. Update requester role.
4. Remove access or reset-to-pending (not self).
5. Expected: state changes persist and UI updates.

### 5) Cohorts and templates
1. In admin session, open Cohorts and create a cohort (interest defaults to org context).
2. Add requester to cohort.
3. Open Templates.
4. Create/publish template and assign cohort.
5. In requester Learn session:
- `Recommended for your cohort` appears above program recommendations.

### 6) Learn admin tools and safe leave
1. In admin session Learn tab, verify Admin tools links:
- Access requests
- Members
- Cohorts
- Templates
2. In requester session, test `Leave` behavior:
- Leaving is blocked if it would leave user with zero active orgs.
- Leaving current org switches to another active org when available.

## Expected Demo Outcome
- Multi-org experience works end-to-end with realtime membership and notification updates.
- Interest context drives labels and content (Nursing vs Sail Racing).
- JHSON remains clean, unique, and domain-gated.
