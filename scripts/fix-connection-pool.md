# Fix Supabase Connection Pool Exhaustion

## Problem
Your Supabase connection pool is exhausted, preventing migrations from running.

## Quick Fixes

### 1. **Check Active Connections in Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/qavekrwdbsobecwrfxwu
2. Click **Database** → **Connection pooling**
3. Look for:
   - Active connections count
   - Long-running queries
   - Connection pool size

### 2. **Kill Hanging Connections via SQL Editor**
In the Supabase Dashboard SQL Editor, run:

```sql
-- See all active connections
SELECT pid, usename, application_name, client_addr, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Kill specific hanging connections (replace PID)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '10 minutes'
  AND pid != pg_backend_pid();
```

### 3. **Use Direct Connection String (Bypass Pooler)**

Instead of using the pooler, use the **direct connection**:

1. Get your **direct database URL** from Supabase Dashboard:
   - Go to **Settings** → **Database**
   - Copy the **Direct Connection** string (port 5432, not 6543)

2. Set it in your config:
```bash
npx supabase link --project-ref qavekrwdbsobecwrfxwu
```

3. Then try again:
```bash
npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.qavekrwdbsobecwrfxwu.supabase.co:5432/postgres"
```

### 4. **Manually Apply Migrations via SQL Editor**

If CLI keeps failing, manually run the migration SQL:

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order:
   - `20251104110000_cleanup_all_duplicate_race_marks.sql`
   - `20251104120000_cleanup_duplicate_race_events.sql`
   - etc.

3. Update the migration history table:
```sql
-- Mark migrations as applied
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20251104110000'),
  ('20251104120000'),
  ('20251104180000'),
  ('20251105000000'),
  ('20251106000000'),
  ('20251106000100'),
  ('20251106120000'),
  ('20251106121000'),
  ('20251106130000'),
  ('20251106131000'),
  ('20251106140000'),
  ('20251106141000'),
  ('20251107000000'),
  ('20251107120000')
ON CONFLICT (version) DO NOTHING;
```

## Root Cause Analysis

**Why is the pool exhausted?**
- Too many open database connections
- Slow queries holding connections
- Connection leaks in your application
- Edge Functions not properly closing connections

## Prevention

1. **Review your database connection code** - ensure all connections are closed
2. **Check Edge Functions** - use Supabase client properly with connection pooling
3. **Upgrade your Supabase plan** if you need more connections
4. **Use pgBouncer pooling mode** - set in Supabase Dashboard

## Next Steps After Fix

Once connections are cleared:
```bash
npx supabase migration repair --status reverted 20251104
npx supabase db push
```
