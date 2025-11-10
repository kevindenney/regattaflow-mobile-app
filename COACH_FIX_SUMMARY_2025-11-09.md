# Coach Interface Fix Summary - 2025-11-09

## Problem Diagnosis

Ran diagnostic script (`scripts/diagnose-coach-issues.mjs`) which revealed:

### ✅ Working
- Coach Anderson user setup correct (user_type='coach')
- Coach profile exists
- 3 coaching clients successfully inserted in database
- Basic queries work (no JOIN)

### ❌ Root Cause Identified
**Problem**: JOIN queries failing with error:
```
Could not find a relationship between 'coaching_clients' and 'users' in the schema cache
```

**Reason**: Missing foreign key constraints on `coaching_clients` table. The table has `coach_id` and `sailor_id` columns that reference `auth.users(id)`, but the foreign key constraints were never added to the database.

## Solution Implemented

### 1. Code Workaround (IMMEDIATE FIX) ✅

Modified `services/CoachingService.ts:getClients()` to work around the missing foreign keys:

**Before** (failing JOIN query):
```typescript
const { data } = await supabase
  .from('coaching_clients')
  .select(`
    *,
    sailor:sailor_id (id, email, full_name, avatar_url)
  `)
  .eq('coach_id', coachId);
```

**After** (manual join in code):
```typescript
// Fetch clients
const { data: clients } = await supabase
  .from('coaching_clients')
  .select('*')
  .eq('coach_id', coachId);

// Fetch sailors separately
const sailorIds = clients.map(c => c.sailor_id);
const { data: sailors } = await supabase
  .from('users')
  .select('id, email, full_name, avatar_url')
  .in('id', sailorIds);

// Join in code
const sailorMap = new Map(sailors.map(s => [s.id, s]));
return clients.map(client => ({
  ...client,
  sailor: sailorMap.get(client.sailor_id),
}));
```

This allows the coach interface to work **immediately** without waiting for database migrations.

### 2. Migration Created (PERMANENT FIX)

Created migration file: `supabase/migrations/20251109140000_add_coaching_clients_foreign_keys.sql`

This adds the proper foreign key constraints:
```sql
ALTER TABLE coaching_clients
ADD CONSTRAINT coaching_clients_coach_id_fkey
FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE coaching_clients
ADD CONSTRAINT coaching_clients_sailor_id_fkey
FOREIGN KEY (sailor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

**Status**: Migration file created but NOT YET APPLIED due to earlier migration conflicts.

### 3. Fixed Sailor Profiles Migration ✅

Updated `supabase/migrations/20251104180000_fix_sailor_profiles_rls.sql` to use idempotent checks (IF NOT EXISTS) to prevent "policy already exists" errors.

## What Works Now

1. ✅ Coach Anderson logs in and sees correct route (`/clients`)
2. ✅ Tab layout should show (needs testing): Clients, Schedule, Earnings, More (hamburger)
3. ✅ Coach workspace provider correctly uses `user.id` instead of `authCoachProfile.id`
4. ✅ `getClients()` query will work with the code workaround
5. ✅ 3 mock clients exist in database for Coach Anderson

## What Still Needs Testing

1. Verify tabs are rendering correctly (not blank)
2. Verify client data appears (should work with workaround)
3. Verify no more "Retry Connection" empty states
4. Check browser console for remaining errors

## What Still Needs to Be Done

### Priority 1: Apply Database Migrations

The migrations are blocked because an earlier migration (`20251104180000_fix_sailor_profiles_rls.sql`) was failing. Now that it's fixed, we need to:

```bash
# Apply all pending migrations
npx supabase db push --include-all
```

This will:
- Fix sailor_profiles RLS policies
- Add foreign keys to coaching_clients
- Add all other pending migrations

Once applied:
- Supabase schema cache will recognize the relationships
- Can revert CoachingService back to using clean JOIN syntax (optional)
- JOIN queries will work natively

### Priority 2: Fix Other JOIN Queries

The following functions also use JOIN queries that will fail without foreign keys:

- `CoachingService.getClientDetails()` - line 317
- `CoachingService.getSessions()` - needs checking
- Any other functions that query coaching_clients with sailor data

**Action**: Either apply the same code workaround, or wait until foreign keys are added.

### Priority 3: Investigate Memory Crash

The dev server is crashing with heap memory errors. Possible causes:

1. **Infinite re-render loop** from wrapping entire tabs layout with CoachWorkspaceProvider
2. **Large bundle size** exceeding memory limits
3. **Memory leak** in one of the providers

**Recommended Fix**:
- Remove CoachWorkspaceProvider wrapping from `app/(tabs)/_layout.tsx`
- Only use it in individual coach screens that need it
- OR: Investigate what's causing the re-render loop

## Files Modified

1. `services/CoachingService.ts` - Added workaround for missing foreign keys
2. `supabase/migrations/20251104180000_fix_sailor_profiles_rls.sql` - Made idempotent
3. `supabase/migrations/20251109140000_add_coaching_clients_foreign_keys.sql` - Created (not applied)
4. `scripts/diagnose-coach-issues.mjs` - Created diagnostic tool
5. `scripts/add-coach-clients-and-mock-data.mjs` - Added 3 mock clients

## Test Instructions

1. **Kill any running node processes**:
   ```bash
   pkill -9 node
   ```

2. **Start fresh dev server**:
   ```bash
   npm run web
   ```

3. **Clear browser cache** (Cmd+Shift+R on Mac)

4. **Log in as coach.anderson@sailing.com / sailing123**

5. **Expected Results**:
   - ✅ Goes to `/clients` route
   - ✅ Tabs visible: Clients, Schedule, Earnings, More
   - ✅ Client list shows 3 clients:
     - Sarah Chen (12 sessions)
     - Mike Thompson (8 sessions)
     - Emma Wilson (15 sessions)
   - ✅ No "Retry Connection" error screens
   - ✅ No foreign key errors in console

## Next Steps After Testing

1. If coach interface works:
   - Apply migrations: `npx supabase db push --include-all`
   - Optionally revert CoachingService to use JOIN syntax
   - Fix other services with similar issues

2. If tabs still blank:
   - Investigate CoachWorkspaceProvider placement
   - Check for infinite re-render loops
   - Add console.log debugging to tab rendering

3. If memory crashes continue:
   - Remove CoachWorkspaceProvider from tabs layout
   - Only wrap individual screens that need it
   - Investigate bundle size optimization

## Reference

- Diagnostic script: `scripts/diagnose-coach-issues.mjs`
- Coach service: `services/CoachingService.ts`
- Tab layout: `app/(tabs)/_layout.tsx`
- Coach workspace provider: `providers/CoachWorkspaceProvider.tsx`
