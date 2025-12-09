# Fleet Insights Debug Summary

## Problem
Fleet Insights panel shows "Demo Sailor (You)" twice instead of displaying the 4 mock fleet members (Sarah Chen, Marcus Thompson, Emma Rodriguez, James Wilson).

## Root Causes Identified

### Root Cause #1: Schema Mismatch (FIXED ✅)
**Issue**: `FleetPostRaceInsights.tsx` was querying a non-existent column `sailor_profiles.display_name`

**Evidence**:
```
[warn] [FleetPostRaceInsights] Unable to load sailor profiles
{"code":"42703","details":null,"hint":null,"message":"column sailor_profiles.display_name does not exist"}
```

**Database Schema Reality**:
- `sailor_profiles` table has: `user_id, home_club, boat_class_preferences, experience_level, sailing_since, achievements`
- `sailor_profiles` table does NOT have: `display_name`
- User names are stored in `users.full_name`, not `sailor_profiles.display_name`

**Fix Applied**:
File: `components/races/FleetPostRaceInsights.tsx`
- Line 131: Changed from `select('id, user_id, display_name, home_club')`
- To: `select('id, user_id, home_club, boat_class_preferences')`
- Line 224: Changed from `profile?.display_name || userNameById.get(...)`
- To: `userNameById.get(...)`

### Root Cause #2: Data Mismatch (NEEDS ATTENTION ⚠️)
**Issue**: Demo Sailor and the 4 fleet members have race sessions for DIFFERENT regattas

**Evidence from Database**:
```sql
-- Demo Sailor (demo-sailor@regattaflow.io) has sessions for:
- Regatta: "1"
- Regatta: "Corinthian 3 & 4" (ID: 2972ea48-6893-4833-950c-ce8f78d073f0)

-- Fleet members have sessions for:
- Regatta: "Phyloong 5 & 6" (ID: 758d5a82-d6ce-40d7-b6a8-fb98d2c82f2d)
  - 12 sessions total from 4 unique sailors:
    - sarah.chen@demo.regattaflow.com
    - marcus.thompson@demo.regattaflow.com
    - emma.rodriguez@demo.regattaflow.com
    - james.wilson@demo.regattaflow.com
```

**Why This Causes the Problem**:
- User selects "Corinthian 3 & 4" race (which Demo Sailor has sessions for)
- Fleet Insights queries: `WHERE regatta_id = '2972ea48-6893-4833-950c-ce8f78d073f0'`
- Only Demo Sailor has sessions for this regatta
- Result: Shows only "Demo Sailor (You)" multiple times

## Solutions

### Solution A: Add Demo Sailor Session to Phyloong 5 & 6 ✅ RECOMMENDED
Create a race session for Demo Sailor for the "Phyloong 5 & 6" regatta so they can see the fleet members' data.

**SQL to Execute**:
```sql
INSERT INTO race_timer_sessions (
  id,
  sailor_id,
  regatta_id,
  start_time,
  end_time,
  duration_seconds,
  track_points,
  notes,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'f6f6a7f6-7755-412b-a87b-3a7617721cc7', -- Demo Sailor user_id
  '758d5a82-d6ce-40d7-b6a8-fb98d2c82f2d', -- Phyloong 5 & 6 regatta_id
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '30 minutes',
  5400, -- 90 minutes
  '[{"lat": 22.283611, "lon": 114.156944, "timestamp": "2024-11-04T10:00:00Z", "speed": 6.5}]'::jsonb,
  'Good race, strong start on port tack. Wind was shifty in the second beat.',
  NOW(),
  NOW()
);
```

### Solution B: Navigate to Phyloong 5 & 6 Race
If you want to test Fleet Insights with existing data, select the "Phyloong 5 & 6" race instead of "Corinthian 3 & 4".

**Note**: Currently "Phyloong 5 & 6" may not be visible in Demo Sailor's race list since they have no sessions for it. Solution A is required to make it show up.

## Verification Steps

After applying Solution A:

1. **Refresh the app**: Reload http://localhost:8081/races
2. **Find "Phyloong 5 & 6"** in the race list (should now appear since Demo Sailor has a session)
3. **Select it** and expand "Post-Race Analysis"
4. **Check Fleet Insights** - should show:
   - Demo Sailor (You)
   - Sarah Chen (RHKYC, Dragon/J70)
   - Mike Thompson (SFYC, Dragon/420)
   - Emma Wilson (RSYS, Laser/Opti)
   - James Rodriguez (MYC, J70)

## Logging Added

Enhanced logging in `FleetPostRaceInsights.tsx` for future debugging:

```typescript
// Line 89: Log query start
logger.log('[FleetPostRaceInsights] 🔍 Querying race_timer_sessions for regatta_id:', raceId);

// Line 98: Log query errors
logger.error('[FleetPostRaceInsights] ❌ Query error:', sessionsError);

// Line 103: Log results count
logger.log('[FleetPostRaceInsights] 📊 Found', sessions.length, 'race sessions');

// Line 106: Log when no sessions found
logger.warn('[FleetPostRaceInsights] ⚠️ No sessions found for regatta:', raceId);

// Line 128: Log profile query
logger.log('[FleetPostRaceInsights] 🔍 Querying sailor_profiles for', uniqueUserIds.length, 'sailors');

// Line 137: Log profile results
logger.log('[FleetPostRaceInsights] ✅ Loaded', profileData.length, 'sailor profiles');
```

## Files Modified

1. **components/races/FleetPostRaceInsights.tsx** (Lines 89-248)
   - Fixed `display_name` column reference
   - Added comprehensive logging
   - Changed to query correct columns from `sailor_profiles`
   - Updated display name logic to use `users.full_name`

## Status

- ✅ Schema fix applied and working
- ⚠️ Data mismatch requires SQL insert (Solution A) or manual navigation (Solution B)
- ✅ Logging in place for future debugging
- ✅ RLS policies correct (allowing authenticated users to view all sessions)

## Recommended Next Step

Execute Solution A SQL to add Demo Sailor session to "Phyloong 5 & 6", then test Fleet Insights.
