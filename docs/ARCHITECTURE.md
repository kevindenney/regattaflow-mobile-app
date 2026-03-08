# BetterAt Architecture (Org-Based)

## Data Model Overview
- `public.organizations`
- Canonical org identity (`id`, `name`, `slug`, `is_active`, `join_mode`, `allowed_email_domains`, `interest_slug`, `metadata`).
- `public.organization_memberships`
- User/org relationship (`organization_id`, `user_id`, `role`, `status`, `membership_status`, verification fields).
- `public.betterat_org_cohorts`
- Cohort container at org level (`org_id`, `name`, `interest_slug`).
- `public.betterat_org_cohort_members`
- Cohort membership (`cohort_id`, `user_id`, optional role).
- `public.betterat_org_step_templates`
- Org template library (`org_id`, `interest_slug`, content fields, published flag).
- `public.betterat_org_step_template_cohorts`
- Template-to-cohort assignment bridge.
- `public.social_notifications`
- In-app notifications for social + org membership decisions.

## Realtime Strategy
- Provider-level org membership subscription keeps active org/membership state fresh.
- Access Requests screen subscribes to `organization_memberships` for target org to auto-refresh pending queue.
- Notifications hook subscribes to social notifications channel and updates query cache.
- Realtime updates should prefer cache-upsert + targeted invalidation, not full app reload.

## RLS Strategy
- Membership and org data access gates through authenticated checks and org role helpers (`is_active_org_member`, `has_org_role`, `is_org_admin_member` where available).
- App logic does not use service-role credentials.
- Org-sensitive writes are done through RLS-compliant client operations and RPCs.
- Schema fallback paths in client code must remain read-safe for older environments without bypassing RLS.

## JHSON-First Constraints
- JHSON should be represented by one active canonical org.
- Open join for JHSON requires email domain gating (`jhu.edu`) enforced server-side and UI-side.
- Interest context must be deterministic for admin and Learn surfaces.
