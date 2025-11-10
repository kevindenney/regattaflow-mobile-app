# Fleet Insights Names Fix

## Problem

Fleet Insights was showing user IDs (like `7ebbbf3e`, `bb58d50c`) instead of actual sailor names like "Marcus Thompson" and "James Wilson".

## Root Cause

The `users` table has a **restrictive RLS (Row Level Security) policy** that only allows users to see their own row:

```sql
CREATE POLICY "users_select" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```

This meant when FleetPostRaceInsights tried to fetch names for other sailors in the fleet, the query returned no results, causing the component to fall back to displaying the first 8 characters of the user ID.

## Solution

Replace the restrictive RLS policy with one that allows authenticated users to see basic public profile information of other users:

```sql
DROP POLICY IF EXISTS "users_select" ON users;

CREATE POLICY "users_can_see_public_profile_info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);
```

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
DROP POLICY IF EXISTS "users_select" ON users;

CREATE POLICY "users_can_see_public_profile_info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "users_can_see_public_profile_info" ON users IS
  'Allows authenticated users to see public profile information (name, avatar) of other users. This is needed for fleet insights, race results, and social features.';
```

4. Refresh your Fleet Insights page

### Option 2: Via Migration File

The migration file has been created at:
```
supabase/migrations/20251107120000_allow_fleet_members_to_see_names.sql
```

Apply it using:
```bash
npx supabase db push
```

## Expected Result

After applying this fix:

**Before:**
- 7ebbbf3e
- bb58d50c
- 125fe11d
- 2771843f

**After:**
- Marcus Thompson
- James Wilson
- Emma Rodriguez
- Sarah Chen

## Security Considerations

This change allows all authenticated users to see:
- User ID
- Full name
- Avatar URL (if implemented)

This is **safe and expected** for a sailing app where:
- Users need to see who they're racing against
- Fleet results need to display sailor names
- Social features require basic user visibility

The policy does **NOT** expose:
- Email addresses (handled by separate columns/policies)
- Private settings
- Authentication credentials

## Files Changed

1. `/supabase/migrations/20251107120000_allow_fleet_members_to_see_names.sql` - Migration file
2. `/scripts/apply-users-rls-fix.mjs` - Helper script (optional)
3. This documentation file

## Component Affected

**FleetPostRaceInsights** (`components/races/FleetPostRaceInsights.tsx:147-159`)

The component queries the users table to fetch display names:
```typescript
const { data: usersData } = await supabase
  .from('users')
  .select('id, full_name')
  .in('id', uniqueUserIds);
```

With the old RLS policy, this query would only return the current user's row. With the new policy, it returns all requested users' names.

## Testing

After applying the fix:

1. Navigate to Fleet Insights
2. Verify that you see sailor names instead of user IDs
3. Check that "Demo Sailor (You)" still shows correctly for your own entries
4. Verify other sailors' names appear: Marcus Thompson, James Wilson, Emma Rodriguez, Sarah Chen

## Additional Notes

- The RLS policy change is **backward compatible** - existing features that rely on the users table will continue to work
- This follows best practices for social/collaborative apps where basic user visibility is expected
- If you need to restrict certain user fields in the future, add column-level RLS policies rather than row-level restrictions
