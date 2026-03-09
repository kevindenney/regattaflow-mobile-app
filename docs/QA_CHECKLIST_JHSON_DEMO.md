# QA Checklist: JHSON-First Multi-Org Demo

Use two signed-in sessions:
- Persona A: **Requester (jhu2)**
- Persona B: **Admin (Kevin)**

## Preconditions
1. App is running locally and reachable (default `http://localhost:8081`).
2. Both users can sign in.
3. JHSON and RHKYC orgs are present.
4. Admin has active admin role in target org.

## Persona A: Requester (jhu2)
1. Open `/learn` and confirm org list renders.
2. Search `Johns Hopkins School of Nursing`.
3. Verify context cue includes `Context: Nursing` when JHSON is active.
4. If requester email is non-`@jhu.edu`, verify JHSON shows `Restricted`.
5. Search `Royal Hong Kong Yacht Club` and click `Request access`.
6. Confirm immediate UI cue: `Request sent`.
7. Keep session open and wait for admin decision.
8. After approval, verify membership state flips to active without hard refresh.
9. Open `/social-notifications`.
10. Verify notification cue contains `Membership approved` or `organization access is now active`.
11. Return to `/learn` and verify `Recommended for your cohort` appears after cohort/template assignment.
12. Verify recommendations under cohort section appear before program/org recommendations.

## Persona B: Admin (Kevin)
13. Open `/learn` and verify `Admin tools` section appears.
14. Click `Access requests` and open `/organization/access-requests`.
15. Approve requester pending request; verify row exits pending list.
16. Open `/organization/members` and find requester via search.
17. Change requester role; verify save cue (`Saved`) and updated role label.
18. Trigger `Reset to pending`; verify status transitions correctly.
19. Re-approve requester from `/organization/access-requests` (if reset created pending state).
20. Open `/organization/cohorts`; create cohort if none exists.
21. Open cohort detail (`/organization/cohort/[cohortId]`) and add requester.
22. Open `/organization/templates`; create/publish template if needed.
23. Assign cohort to template; verify assignment persists after refresh.

## Smoke Harness
24. Run:

```bash
node scripts/smoke-multi-org-demo.mjs
```

25. Verify PASS lines for learn/activity/members/cohorts/templates and screenshot artifact output.

## Expected UI Text Cues
- `Context: Nursing`
- `Request access`
- `Request sent`
- `Restricted`
- `Admin tools`
- `Access requests`
- `Members`
- `Cohorts`
- `Templates`
- `Recommended for your cohort`
- `Membership approved`
- `organization access is now active`

## Troubleshooting
- Wrong active org: switch active org in `/learn` before validating role-gated screens.
- Wrong interest context: verify organization interest slug and context pill text.
- Not signed in: role-gated routes show empty/blocked states.
- Request button unavailable: existing membership may already be active/pending/rejected.
- No cohort recommendations: requester not in cohort, or template not linked to requester cohort.
- No admin tools: Kevin session lacks active admin role for current org.
- Notifications missing: refresh `/social-notifications`, confirm approval action completed, verify realtime/session connectivity.
