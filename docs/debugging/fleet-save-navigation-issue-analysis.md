# Fleet Save Navigation Issue - Analysis & Fix

**Date**: November 2, 2025
**Issue**: User selects fleet → clicks save → redirected back to empty fleet discovery page instead of seeing saved fleet

## Investigation Summary

### 1. Initial Hypotheses (7 potential issues identified)

1. **Race Condition/Timing Issue** - 300ms timeout insufficient for database sync
2. **useFocusEffect Timing** - Hook fires before database has synced
3. **Cache Invalidation** - Supabase client returning cached/stale data
4. **Database Constraint/RLS Policy** - Upsert failing silently or RLS blocking reads
5. **User ID Consistency** - Mismatch between save and fetch operations
6. **Status Field Mismatch** - Default or trigger changing status value
7. **Navigation State Issue** - `router.back()` causing stale state rendering

### 2. Root Cause Discovered

**CRITICAL DATABASE SCHEMA ISSUE**: The `fleet_members` table was **missing the `role` column** and several other required columns!

#### Missing Columns
- `role` - Required for fleet membership role (member, owner, captain, etc.)
- `invited_by` - Foreign key to track who invited the member
- `metadata` - JSONB field for additional metadata
- `notify_fleet_on_join` - Boolean flag for notification preferences

#### Missing Constraints
- Unique constraint on `(fleet_id, user_id)` - Prevents duplicate memberships
- Check constraint on `role` - Validates role values
- Check constraint on `status` - Validates status values
- Performance indexes on commonly queried columns

### 3. How This Caused the Bug

The save flow in `app/(tabs)/fleet/select.tsx` was attempting to:

```typescript
await supabase
  .from('fleet_members')
  .upsert({
    fleet_id: fleetId,
    user_id: user.id,
    role: 'member',  // ❌ This column didn't exist!
    status: 'active',
  }, {
    onConflict: 'fleet_id,user_id',  // ❌ This constraint didn't exist!
  })
```

**What happened**:
1. The `upsert` operation **silently failed** to save the `role` field (column didn't exist)
2. Without the unique constraint, the `onConflict` parameter was ignored
3. The query in `fleetService.ts` tried to SELECT the `role` column that didn't exist
4. This caused the fetch to **return empty results** or fail silently
5. The UI showed the empty state because no fleets were returned

### 4. Diagnosis Process

#### Phase 1: Added Comprehensive Logging
Added timestamped logging to track the entire save→navigate→refresh flow:

1. **select.tsx** - `saveSelections()` function
   - Log save start timestamp
   - Log each upsert operation with duration
   - Log delete operations for unselected fleets
   - Log navigation timing

2. **index.tsx** - Fleet overview page
   - Log component render timestamp
   - Log useFocusEffect trigger
   - Log empty state checks with reasons

3. **useFleetData.ts** - Data fetching hook
   - Log refresh start/end with duration
   - Log service call timing
   - Log fleet count and IDs returned

4. **fleetService.ts** - Database service layer
   - Log query execution with user ID
   - Log raw Supabase response
   - Log filtered and mapped results

#### Phase 2: Database Investigation
```sql
-- Discovered the actual table schema
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'fleet_members';

-- Result: Only had id, fleet_id, joined_at, status, user_id
-- Missing: role, invited_by, metadata, notify_fleet_on_join
```

### 5. The Fix

Created migration `20251102120000_fix_fleet_members_schema.sql`:

```sql
-- Add missing columns
ALTER TABLE fleet_members ADD COLUMN role TEXT DEFAULT 'member';
ALTER TABLE fleet_members ADD COLUMN invited_by UUID REFERENCES auth.users(id);
ALTER TABLE fleet_members ADD COLUMN metadata JSONB;
ALTER TABLE fleet_members ADD COLUMN notify_fleet_on_join BOOLEAN DEFAULT false;

-- Add constraints
ALTER TABLE fleet_members
  ADD CONSTRAINT fleet_members_fleet_id_user_id_key UNIQUE (fleet_id, user_id);

ALTER TABLE fleet_members
  ADD CONSTRAINT fleet_members_role_check
  CHECK (role IN ('member', 'owner', 'captain', 'coach', 'support'));

ALTER TABLE fleet_members
  ADD CONSTRAINT fleet_members_status_check
  CHECK (status IN ('active', 'pending', 'invited', 'inactive'));

-- Add performance indexes
CREATE INDEX idx_fleet_members_user_id ON fleet_members(user_id);
CREATE INDEX idx_fleet_members_status ON fleet_members(status);
CREATE INDEX idx_fleet_members_user_status ON fleet_members(user_id, status);
```

### 6. Secondary Benefits of the Investigation

The comprehensive logging added during debugging will now help with:

1. **Performance monitoring** - Track query durations across the stack
2. **Race condition detection** - Timestamps show exact timing of operations
3. **Cache behavior analysis** - See when stale data is returned
4. **User experience debugging** - Understand navigation and render timing

### 7. Verification Steps

After applying the fix, verify:

1. ✅ Schema has all required columns
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'fleet_members';
   ```

2. ✅ Constraints are in place
   ```sql
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'fleet_members';
   ```

3. 🔄 **Test the save flow** - User should now see their saved fleets after clicking save

4. 🔄 **Check console logs** - Verify the timestamped logs show:
   - Save completing successfully
   - Navigation happening
   - Refresh fetching correct data
   - Fleets displaying in UI

### 8. Files Modified

**Logging enhancements** (for debugging and future monitoring):
- `app/(tabs)/fleet/select.tsx` - Added detailed save operation logging
- `app/(tabs)/fleet/index.tsx` - Added render and focus event logging
- `hooks/useFleetData.ts` - Added data fetch timing logging
- `services/fleetService.ts` - Added database query logging

**Schema fix** (resolves the bug):
- `supabase/migrations/20251102120000_fix_fleet_members_schema.sql` - New migration

### 9. Lessons Learned

1. **Schema assumptions are dangerous** - Always verify database schema matches code expectations
2. **Silent failures are hard to debug** - Supabase doesn't error on missing columns in some cases
3. **Logging saves time** - Comprehensive logging helped us quickly identify the real issue
4. **Race conditions weren't the problem** - The timing issue was a red herring; the real problem was missing schema

### 10. Recommended Next Steps

1. **Test the complete flow** with the schema fix applied
2. **Monitor the new logs** in production to catch any remaining edge cases
3. **Add schema validation** to catch missing columns early in development
4. **Document expected schema** for all tables used by the fleet system
5. **Consider adding database schema tests** to prevent regression

## Status

- ✅ Root cause identified: Missing `role` column and constraints
- ✅ Migration created and applied
- ✅ Comprehensive logging added
- 🔄 Pending: User acceptance testing
- 🔄 Pending: Verification that fleets now save and display correctly

---

**Next Action**: Test the save flow in the app and verify that:
1. Fleets save successfully
2. User is redirected back to fleet overview
3. Saved fleets are displayed (not empty state)
4. Console logs show the complete flow with timestamps
