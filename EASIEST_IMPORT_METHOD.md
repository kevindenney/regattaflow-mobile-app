# ✅ Easiest Way to Import 5,000 Marinas

## Problem
Supabase SQL Editor rejects large queries. We need to import via command line.

## ✅ Solution: Use psql Command (2 minutes)

### Step 1: Get Your Database Connection String

1. **Go to Supabase Dashboard**
2. **Project Settings → Database**
3. **Copy the "Connection string" under "Connection pooling"**
   - It looks like: `postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

### Step 2: Run the Import

```bash
# Navigate to your project
cd /Users/kevindenney/Developer/RegattaFlow/regattaflow-app

# Import all 5,000 marinas at once
psql "YOUR_CONNECTION_STRING_HERE" -f data/osm-import-5000.sql
```

**That's it!** The import will complete in ~30 seconds.

---

## Alternative: Import Small Batches via Supabase Dashboard

If you don't have psql installed, use the small batch files:

### Files Created:
- `data/batches/batch-001.sql` through `batch-100.sql`
- Each file = 50 marinas
- Small enough for Supabase SQL Editor

### How to Import:

1. **Open Supabase SQL Editor**
2. **Copy batch 1**:
   ```bash
   cat data/batches/batch-001.sql | pbcopy
   ```
3. **Paste into SQL Editor → RUN**
4. **Repeat for batches 2-100**

This is tedious (100 times) but works if you don't have psql.

---

## Fastest Method: psql with All Batches

If you have psql installed, run this ONE command:

```bash
# Import all 5,000 marinas in one command
psql "YOUR_CONNECTION_STRING" -f data/osm-import-5000.sql
```

**Time**: 30 seconds
**Batches**: All 5,000 marinas at once
**Cost**: $0

---

## After Import - Verify

```sql
-- Check count
SELECT COUNT(*) FROM sailing_venues WHERE data_source = 'osm';
-- Expected: 5000

-- View samples
SELECT name, coordinates_lat, coordinates_lng, region
FROM sailing_venues
WHERE data_source = 'osm'
LIMIT 10;
```

---

## If You Don't Have psql

### Install psql (Mac):
```bash
brew install postgresql
```

### Install psql (Linux):
```bash
sudo apt-get install postgresql-client
```

### Install psql (Windows):
Download from: https://www.postgresql.org/download/windows/

---

## 🎯 Summary

**Best method**: psql command (30 seconds total)
**Backup method**: Import 100 small batches via dashboard (30 minutes total)
**Result**: 5,000 marinas on your map
**Cost**: $0

Choose your method and let me know if you need help!
