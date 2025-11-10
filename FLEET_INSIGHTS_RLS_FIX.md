# Fleet Insights RLS Fix - Manual Application Required

## Problem
Fleet Insights panel shows "Demo Sailor (You)" twice instead of displaying the 4 mock fleet members (Sarah Chen, Marcus Thompson, Emma Rodriguez, James Wilson).

**Root Cause**: RLS (Row Level Security) policies on `race_timer_sessions` are blocking authenticated users from viewing other sailors' sessions.

## Solution
Apply new RLS policies to allow sailors to view all race timer sessions (for fleet visibility) while restricting write operations to their own sessions only.

## Steps to Fix

### 1. Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/qavekrwdbsobecwrfxwu
2. Navigate to: **SQL Editor** (left sidebar)
3. Click: **New Query**

### 2. Execute This SQL

```sql
-- Allow authenticated sailors to view other sailors' race timer sessions
-- This enables the Fleet Insights feature to show other fleet members' race data

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view their own race timer sessions" ON race_timer_sessions;

-- Create policy allowing sailors to view all race timer sessions
-- This is safe because race data is meant to be shared within the fleet/regatta
CREATE POLICY "Sailors can view all race timer sessions"
ON race_timer_sessions
FOR SELECT
TO authenticated
USING (true);

-- Sailors can only insert/update/delete their own sessions
CREATE POLICY "Sailors can insert their own race timer sessions"
ON race_timer_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update their own race timer sessions"
ON race_timer_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = sailor_id)
WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can delete their own race timer sessions"
ON race_timer_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = sailor_id);
```

### 3. Run the Query
Click the **Run** button (or press Cmd+Enter)

### 4. Verify Success
You should see: "Success. No rows returned"

### 5. Test Fleet Insights
1. Open RegattaFlow app
2. Login as Demo Sailor (demo-sailor@regattaflow.app)
3. Go to Races tab
4. Select "Phyloong 5 & 6" race
5. Expand "Post-Race Analysis" section
6. Click "Fleet Insights" tab

**Expected Result**: You should now see 4 fleet member cards:
- Sarah Chen (RHKYC, Dragon/J70)
- Mike Thompson (SFYC, Dragon/420)
- Emma Wilson (RSYS, Laser/Opti)
- James Rodriguez (MYC, J70)

Each card should show:
- ✅ GPS track indicator (green checkmark)
- 📝 Race notes indicator
- Profile details (club, boat classes)

## Why This Fix is Safe

- **Read Access**: Allowing sailors to view all race sessions is intentional - race data is meant to be shared within the fleet for competitive analysis
- **Write Protection**: INSERT/UPDATE/DELETE operations are still restricted to the session owner only
- **Authentication Required**: Only authenticated users can view sessions (public/anonymous cannot)

## Troubleshooting

If Fleet Insights still shows incorrect data after applying:

1. **Clear browser cache** and reload the app
2. **Check the console** for any errors related to race_timer_sessions queries
3. **Verify RLS policies** in Supabase Dashboard → Authentication → Policies → race_timer_sessions

## Related Files

Migration SQL: `supabase/migrations/20251106120000_allow_fleet_insights_visibility.sql`
Component: `components/races/FleetPostRaceInsights.tsx:91`
Query: `.from('race_timer_sessions').select(...).eq('race_id', raceId)`
