# QUICK FIX: Apply Migrations via Supabase Dashboard

Your CLI is timing out due to connection pool exhaustion. Here's the **fastest workaround**:

## Step 1: Kill Hanging Connections

Go to https://supabase.com/dashboard/project/qavekrwdbsobecwrfxwu/editor and run:

```sql
-- Kill old connections (except your own)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes'
  AND pid != pg_backend_pid()
  AND usename != 'supabase_admin';
```

## Step 2: Check Migration Status

```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
```

## Step 3: Remove Bad Migration Entries

The problem is you have a migration with incomplete timestamp `20251104` (without HHMMSS). Remove it:

```sql
-- Remove the problematic migration entry
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20251104';
```

## Step 4: Add Correct Migration Entries

Now add the correctly-named migrations:

```sql
-- Insert all migrations with proper timestamps
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20251104110000'),  -- cleanup_all_duplicate_race_marks
  ('20251104120000'),  -- cleanup_duplicate_race_events
  ('20251104180000'),  -- fix_sailor_profiles_rls
  ('20251105000000'),  -- seed_demo_race_analysis
  ('20251106000000'),  -- add_strategy_planning_fields
  ('20251106000100'),  -- add_execution_evaluation_fields
  ('20251106120000'),  -- allow_fleet_insights_visibility
  ('20251106121000'),  -- create_mock_coach_data (renamed from 120000)
  ('20251106130000'),  -- add_coach_feedback_columns
  ('20251106131000'),  -- create_race_suggestions_system (renamed from 130000)
  ('20251106140000'),  -- add_coach_profiles_rls
  ('20251106141000'),  -- fix_fleets_club_id_fkey (renamed from 140000)
  ('20251107000000'),  -- add_nor_document_fields
  ('20251107120000')   -- allow_fleet_members_to_see_names
ON CONFLICT (version) DO NOTHING;
```

## Step 5: Verify

```sql
SELECT * FROM supabase_migrations.schema_migrations
WHERE version LIKE '202511%'
ORDER BY version DESC;
```

You should see all migrations from Nov 4-7 listed.

## Step 6: Try CLI Again

Once the migrations table is fixed, try the CLI again:

```bash
npx supabase db pull
```

This should now work because the local migration file names match the database.

---

## Alternative: Wait 10 Minutes

The connection pool will clear idle connections after 10 minutes. You can just wait and try again:

```bash
# Wait 10 minutes, then:
npx supabase db push
```

## Why This Happened

1. **Duplicate migration timestamps** - You had multiple files with same timestamp
2. **Incomplete timestamp** - `20251104` instead of `20251104HHMMSS`
3. **Connection pool exhaustion** - Too many CLI connection attempts + Edge Functions + other clients

## Prevention

- **Always use full timestamps** in migration filenames: `YYYYMMDDHHMMSS_description.sql`
- **Check for duplicates** before committing: `ls supabase/migrations/ | awk -F_ '{print $1}' | sort | uniq -d`
- **Use transaction mode** for pooler if you need more connections
