# Execution Guide

## Running Migrations Safely
1. Ensure local branch is clean enough to isolate intended migration files.
2. Add a timestamped migration under `supabase/migrations/`.
3. Prefer idempotent SQL patterns:
- `CREATE ... IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `DO $$` blocks with `information_schema` checks for optional columns/tables.
4. Apply with:
- `supabase db push`
5. Read output for NOTICE/ERROR and stop on failure.

## Verifying Locally
1. Type safety:
- `npm run typecheck`
2. Open web app:
- `npm run web`
3. Validate key flows:
- Learn org search and actions.
- Access requests approve/reject.
- Members filters/role changes.
- Cohort create + member management.
- Templates create + assignment.

## Resetting Test Data
- Reset member to pending (example pattern):
```sql
update public.organization_memberships
set
  membership_status = 'pending',
  status = 'pending',
  is_verified = false,
  verification_source = 'invite',
  verified_at = null,
  joined_at = null
where organization_id = '<org-id>'
  and user_id = '<user-id>';
```

- Soft-reset duplicate org visibility (if needed for testing):
```sql
update public.organizations
set is_active = true
where name ilike '%Johns Hopkins School of Nursing%';
```
Only use this in controlled test environments.
