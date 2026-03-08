# BetterAt Goals (JHSON-First)

## North-Star Outcomes
- Johns Hopkins School of Nursing (JHSON) is the reference org experience for BetterAt nursing workflows.
- A learner can join the right organization safely and see interest-specific Learn content without manual refresh.
- Org admins can manage access, members, cohorts, and templates with predictable status transitions and no duplicate org identity confusion.
- Notifications and realtime updates make membership decisions visible quickly to both admins and requesters.

## Core User Journeys

### Learner Journey (JHSON)
1. Search organization from Learn.
2. See a single JHSON row with the correct action state (Member, Request sent, Restricted, Join, Request access, Invite required).
3. Join/request based on join mode + domain gating.
4. Learn tab shows interest-aware content:
- Program recommendations.
- Cohort recommendations first when applicable.
- Courses aligned to active org interest.

### Coach/Instructor Journey
1. Open Learn > Coaches/People with active org context.
2. Find members via searchable, role-aware directory.
3. Receive notifications for org access decisions and collaboration updates.

### Org Admin Journey
1. Review access requests and approve/reject with consistent membership writes.
2. Manage members with role/status controls.
3. Create cohorts and assign members.
4. Create org templates scoped by org interest and assign to cohorts.

## V1 Success Metrics
- 0 duplicate visible rows for JHSON in Learn org search.
- 100% of JHSON membership joins/requests follow join mode + domain policy.
- <1 manual refresh required for requester/admin membership status visibility after decisions.
- Admin pages (Members/Cohorts/Templates/Access Requests) load without schema-related 400/406 console spam in normal flows.
- Active org context is stable across app tabs and reflected in role labels/content.
