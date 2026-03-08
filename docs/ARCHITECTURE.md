# Architecture Summary (Org-Centric)

## Core Entities
- `organizations`
- `organization_memberships`
- `betterat_org_cohorts`
- `betterat_org_cohort_members`
- `betterat_org_step_templates`
- `betterat_org_step_template_cohorts`
- `social_notifications`

## RLS Posture
- Client paths remain authenticated and RLS-gated.
- No service-role credentials in app logic.
- Admin actions use org role checks and member-state checks.

## Realtime Subscription Map
- Organization provider subscribes to membership changes for active user context.
- Access Requests screen subscribes to org membership changes to update pending queue.
- Notifications hook subscribes to social notifications channel and updates local query caches.

## Interest Resolution Strategy
- Primary source: `organizations.interest_slug`.
- Fallback source: `organizations.metadata.interest_slug` / `interestSlug`.
- UI context pill reflects resolved interest.

## Join/Approval Flow
- Discovery fetches active orgs only.
- Request join path enforces join mode and domain restrictions server-side.
- Approval/rejection writes consistent membership fields and triggers in-app notifications.
