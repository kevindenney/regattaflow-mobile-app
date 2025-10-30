# Profiles to Users Migration Guide

## The Problem

Race creation (and other operations) is failing with **HTTP 409 Conflict** errors:

```
Supabase is rejecting the insert because the row you try to add to public.regattas
fails the regattas_created_by_fkey check: Key is not present in table "profiles"
```

### Root Cause

Your app has migrated user data to the `users` table, but **7 database tables** still have foreign key constraints pointing to the old `profiles` table:

| Table | Column | Current FK | Should Reference |
|-------|--------|-----------|------------------|
| regattas | created_by | profiles(id) | users(id) |
| race_participants | user_id | profiles(id) | users(id) |
| race_documents | user_id | profiles(id) | users(id) |
| ai_analyses | user_id | profiles(id) | users(id) |
| ai_usage_logs | user_id | profiles(id) | users(id) |
| subscriptions | user_id | profiles(id) | users(id) |
| weather_insights | user_id | profiles(id) | users(id) |

When you try to create a race with `created_by: user.id`, Supabase checks if that ID exists in `profiles` (it doesn't - your user is in `users`), and rejects the insert with a 409 error.

## The Solution

Run the migration SQL file to update all foreign key constraints from `profiles` to `users`.

### Migration File

📄 **Location**: `/migrations/20251029_migrate_all_profiles_fk_to_users.sql`

**What it does**:
1. Drops old FK constraints pointing to `profiles`
2. Creates new FK constraints pointing to `users`
3. Adds performance indexes
4. Documents the changes with comments

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `/migrations/20251029_migrate_all_profiles_fk_to_users.sql`
4. Copy the entire file contents
5. Paste into the SQL Editor
6. Click **"Run"**
7. Verify success (see Verification section below)

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
cd /Users/kdenney/Developer/RegattaFlow/regattaflow-app

# Run the migration
supabase db push migrations/20251029_migrate_all_profiles_fk_to_users.sql
```

### Option 3: Direct SQL Execution

If you have direct database access:

```bash
psql [your-database-url] < migrations/20251029_migrate_all_profiles_fk_to_users.sql
```

## Verification

After running the migration, verify it worked:

### 1. Check FK Constraints

Run this query in SQL Editor:

```sql
SELECT
  r.relname AS table_name,
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class r ON c.conrelid = r.oid
WHERE c.conname IN (
  'regattas_created_by_fkey',
  'race_participants_user_id_fkey',
  'race_documents_user_id_fkey',
  'ai_analyses_user_id_fkey',
  'ai_usage_logs_user_id_fkey',
  'subscriptions_user_id_fkey',
  'weather_insights_user_id_fkey'
)
ORDER BY r.relname;
```

**Expected result**: All constraints should reference `users(id)` instead of `profiles(id)`.

### 2. Test Race Creation

Try creating a race in your app:

```typescript
// In your app
const { data, error } = await supabase
  .from('regattas')
  .insert({
    name: 'Test Race',
    start_date: new Date().toISOString(),
    created_by: user.id, // This should work now!
  });

if (error) {
  console.error('Race creation failed:', error);
} else {
  console.log('✅ Race created successfully!', data);
}
```

**Expected result**: No 409 error, race created successfully!

## What About Existing Data?

### If You Have Data in `profiles`

The migration **only updates FK constraints** - it doesn't migrate data. If you have existing rows in the `profiles` table that need to be preserved:

1. **Option A**: Manually copy profile data to `users` table
   ```sql
   -- Example: Copy profiles to users
   INSERT INTO users (id, email, full_name, created_at, updated_at)
   SELECT id, email, full_name, created_at, updated_at
   FROM profiles
   ON CONFLICT (id) DO NOTHING;
   ```

2. **Option B**: Keep both tables and use application logic to sync them

3. **Option C**: Create a view or function to abstract the difference

### If `profiles` Table is Empty

Great! The migration will work perfectly. Your users are all in the `users` table, and now FKs point to the correct location.

## Safety Considerations

### Migration is Safe Because:

✅ **No data loss**: Only updates FK constraints, doesn't delete data
✅ **Idempotent**: Uses `IF EXISTS` - safe to run multiple times
✅ **Cascades preserved**: All `ON DELETE CASCADE` behaviors maintained
✅ **Indexes added**: Improves query performance

### Rollback Plan

If you need to rollback (unlikely), run this:

```sql
-- Rollback: Revert FKs back to profiles
-- (Only run if you need to rollback for some reason)

ALTER TABLE public.regattas
  DROP CONSTRAINT IF EXISTS regattas_created_by_fkey;
ALTER TABLE public.regattas
  ADD CONSTRAINT regattas_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Repeat for other tables...
```

## After Migration

Once the migration is complete:

1. ✅ **Test race creation** - Should work without 409 errors
2. ✅ **Test race participants** - Adding participants should work
3. ✅ **Test race documents** - Document uploads should work
4. ✅ **Test subscriptions** - Subscription creation should work

## Related Files

- **Migration SQL**: `/migrations/20251029_migrate_all_profiles_fk_to_users.sql`
- **Quick Fix (regattas only)**: `/migrations/20251029_fix_regattas_fk_to_users.sql`
- **This guide**: `/PROFILES_TO_USERS_MIGRATION.md`

## Affected Code Files

These files reference `created_by` when creating races:

- `app/(tabs)/race/add.tsx:377` - Sends `created_by: user.id`
- `components/races/AddRaceModal.tsx:88` - Sends `created_by: user.id`

After migration, these will work correctly!

## FAQ

**Q: Will this break existing races?**
A: No! The migration only changes FK constraints, not data. Existing races remain unchanged.

**Q: Do I need to update my application code?**
A: No! Your code already uses `user.id` which is correct. The issue was database-side.

**Q: What if I'm still getting 409 errors after migration?**
A: Check that your user exists in the `users` table:
```sql
SELECT id, email, full_name FROM users WHERE id = 'your-user-id';
```

**Q: Can I run the migration on production?**
A: Yes, but test in staging/dev first. The migration is safe and non-destructive.

**Q: Should I delete the `profiles` table?**
A: Not yet. Keep it until you've verified everything works. You can drop it later if unused.

## Support

If you encounter issues:

1. Check the verification queries above
2. Review Supabase logs for FK constraint errors
3. Ensure your user exists in the `users` table
4. Check RLS policies (they may also reference profiles)

## Next Steps

After successfully running this migration, you may want to:

1. ✅ Update any RLS policies that reference `profiles` to use `users`
2. ✅ Update any views or functions that query `profiles`
3. ✅ Eventually drop the `profiles` table if no longer needed
4. ✅ Update documentation to reflect the users table as source of truth

---

**Migration Status**: Ready to run ✅

Run the migration, test race creation, and enjoy error-free sailing! ⛵
