# Club Role Migration Guide

## Overview

This migration aligns the database schema with the TypeScript ClubRole taxonomy defined in `types/club.ts`. It creates a PostgreSQL enum type, updates the `club_members` table, adds RLS policies, and creates helper functions for role-based access control.

## Migration File

**File**: `migrations/20251030_add_club_role_enum_and_policies.sql`

## What This Migration Does

### 1. Creates `club_role` Enum Type
Defines 13 standardized roles:
- **Management**: `admin`, `sailing_manager`, `secretary`
- **Race Operations**: `race_officer`, `scorer`, `race_committee`
- **Finance**: `treasurer`
- **Membership**: `membership_manager`
- **Communications**: `communications`
- **Instruction**: `instructor`
- **General**: `member`, `guest`

### 2. Migrates Legacy 'owner' Role
- Updates any existing `'owner'` roles to `'admin'`
- The legacy 'owner' role concept is replaced by the standardized 'admin' role
- This happens before the type conversion to ensure data consistency

### 3. Drops Dependent Policies Temporarily
The migration must drop policies on these tables before changing the column type:
- `club_classes` (insert, update, delete policies)
- `club_facilities` (insert, update, delete policies)
- `club_fleets` (insert, update, delete policies)
- `club_race_calendar` (insert, update, delete policies)
- `club_services` (insert, update, delete policies)

These policies reference `club_members.role` and must be recreated after the type change.

### 4. Updates `club_members` Table
- Converts `role` column from TEXT to `club_role` enum
- Sets NOT NULL constraint
- Adds indexes for performance:
  - `idx_club_members_role` - Role lookups
  - `idx_club_members_club_role` - Club + role queries
  - `idx_club_members_active_role` - Active members by role

### 5. Creates Helper Functions

#### `has_admin_access(role)`
Returns true for: `admin`, `sailing_manager`, `race_officer`

#### `is_management_role(role)`
Returns true for all core management roles

#### `user_has_club_role(user_id, club_id, role)`
Check if user has specific role in a club

#### `user_has_any_club_role(user_id, club_id, roles[])`
Check if user has any of the specified roles

#### `get_user_club_role(user_id, club_id)`
Get user's role in a club

### 7. Creates RLS Policies for club_members

1. **Members can view club members** - View other members in same club
2. **Members can view own membership** - Always see your own record
3. **Admins can manage members** - Full CRUD for admin roles
4. **Membership managers can manage members** - Manage non-admin members
5. **Users can request membership** - Self-insert as guest (pending approval)

### 8. Recreates Dependent Policies with Enum Type

All previously dropped policies are recreated using the enum type:
- **Club classes**: Admin and sailing_manager can insert/update, only admin can delete
- **Club facilities**: Admin and sailing_manager can insert/update, only admin can delete
- **Club fleets**: Admin and sailing_manager can insert/update, only admin can delete
- **Club race calendar**: Admin, race_officer, and race_committee can insert/update
- **Club services**: Admin and sailing_manager can insert/update, only admin can delete

**Important**: The legacy 'owner' role has been replaced with 'admin' in all policies.

## How to Apply This Migration

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migrations/20251030_add_club_role_enum_and_policies.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute
6. Check the output for success notices:
   - "club_role enum type created successfully"
   - "club_members.role column successfully converted to enum"
   - "5 RLS policies on club_members created successfully"
   - "15 dependent policies recreated successfully"

**Expected behavior**: The migration will drop and recreate several policies. This is normal and expected.

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### Option 3: Direct SQL Execution

If you have direct PostgreSQL access:

```bash
psql YOUR_DATABASE_URL -f migrations/20251030_add_club_role_enum_and_policies.sql
```

## Verification

After applying the migration, run these queries to verify:

### 1. Check Enum Was Created
```sql
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'club_role'
ORDER BY enumsortorder;
```

Should return 13 role values.

### 2. Check Column Type
```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'club_members' AND column_name = 'role';
```

Should show `data_type = 'USER-DEFINED'` and `udt_name = 'club_role'`.

### 3. Check RLS Policies
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'club_members'
ORDER BY policyname;
```

Should return 5 policies.

### 4. Check Helper Functions
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN (
  'has_admin_access',
  'is_management_role',
  'user_has_club_role',
  'user_has_any_club_role',
  'get_user_club_role'
);
```

Should return 5 functions.

### 5. Check Dependent Policies Were Recreated
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('club_classes', 'club_facilities', 'club_fleets', 'club_race_calendar', 'club_services')
ORDER BY tablename, policyname;
```

Should return 15 policies (3 per table: insert, update, delete).

### 6. Test Helper Functions
```sql
-- Test admin access check
SELECT has_admin_access('admin'::club_role);  -- Should return true
SELECT has_admin_access('member'::club_role); -- Should return false

-- Test management role check
SELECT is_management_role('treasurer'::club_role);  -- Should return true
SELECT is_management_role('guest'::club_role);      -- Should return false
```

### 7. Verify No 'owner' Roles Remain
```sql
-- This should return 0 rows (all migrated to 'admin')
SELECT COUNT(*) FROM club_members WHERE role::text = 'owner';
```

## Post-Migration Steps

1. **Update Application Code** (Already complete)
   - ✓ TypeScript types defined in `types/club.ts`
   - ✓ Service layer using `ClubRole` type in `services/ClubMemberService.ts`
   - ✓ Club service using helper guards in `lib/clubs/clubService.ts`

2. **Implement UI Role Gates**
   - Update club admin screens to check `hasAdminAccess()`
   - Show/hide features based on `isManagementRole()`
   - Add role selection dropdowns using `CLUB_ROLE_DEFINITIONS`

3. **Test Role-Based Access**
   - Create test members with different roles
   - Verify RLS policies prevent unauthorized access
   - Test permission boundaries (e.g., membership_manager can't modify admins)

## Rollback Instructions

If you need to rollback this migration:

```sql
-- WARNING: This will lose role data granularity

-- Drop policies
DROP POLICY IF EXISTS "Members can view club members" ON public.club_members;
DROP POLICY IF EXISTS "Members can view own membership" ON public.club_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.club_members;
DROP POLICY IF EXISTS "Membership managers can manage members" ON public.club_members;
DROP POLICY IF EXISTS "Users can request membership" ON public.club_members;

-- Drop functions
DROP FUNCTION IF EXISTS has_admin_access(club_role);
DROP FUNCTION IF EXISTS is_management_role(club_role);
DROP FUNCTION IF EXISTS user_has_club_role(UUID, UUID, club_role);
DROP FUNCTION IF EXISTS user_has_any_club_role(UUID, UUID, club_role[]);
DROP FUNCTION IF EXISTS get_user_club_role(UUID, UUID);

-- Revert column to text
ALTER TABLE public.club_members
  ALTER COLUMN role TYPE TEXT;

ALTER TABLE public.club_members
  ALTER COLUMN role SET DEFAULT 'member';

-- Drop enum
DROP TYPE IF EXISTS club_role;

-- Drop indexes
DROP INDEX IF EXISTS idx_club_members_role;
DROP INDEX IF EXISTS idx_club_members_club_role;
DROP INDEX IF EXISTS idx_club_members_active_role;
```

## Next Steps

After this migration lands:

1. **Implement Role-Based UI Components**
   - Create `<RequireRole>` wrapper component
   - Add role badges to member lists
   - Build role selection interface for admins

2. **Add Permission System**
   - Implement fine-grained permissions based on `defaultPermissions` in role definitions
   - Create permission checking middleware
   - Add audit logging for role changes

3. **Build Member Management UI**
   - Member approval workflow (guest → member)
   - Role assignment interface (admins only)
   - Bulk member operations

4. **Payment Integration**
   - Connect roles to payment requirements
   - Implement member dues tracking
   - Build entry fee management (from backlog)

## Related Files

- `types/club.ts` - TypeScript role definitions
- `services/ClubMemberService.ts` - Member management service
- `lib/clubs/clubService.ts` - Club operations service
- `CLUB_AND_SAILOR_EXECUTION_BACKLOG.md` - Implementation roadmap
- `CLUB_AND_SAILOR_PRODUCT_PLAYBOOK.md` - Product strategy

## Support

If you encounter issues:

1. Check Supabase logs for detailed error messages
2. Verify RLS is enabled: `SELECT relrowsecurity FROM pg_class WHERE relname = 'club_members';`
3. Check for conflicting policies or functions
4. Ensure your database user has `CREATE TYPE` privileges

---

**Migration Status**: ✅ Ready to apply
**Last Updated**: 2025-10-30
**Author**: Claude Code
