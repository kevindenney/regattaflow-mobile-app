# Club Workspace Connection Issue - Debugging Report

## Issue Summary

User `kdenney@icouldyou` (club3kdenney) was seeing "Connect Your Club Workspace" screen when attempting to create an event at `localhost:8081/club/event/create`.

## Root Causes Identified

### 1. Database Query Error (400 Error)
**Location:** `providers/AuthProvider.tsx:304`

**Problem:** Code was querying a non-existent column
```typescript
// BEFORE (BROKEN)
const { data: byUserId, error: byUserIdError } = await supabase
  .from('club_profiles')
  .select('*')
  .eq('user_id', user.id)  // ❌ club_profiles doesn't have user_id column
  .maybeSingle()
```

**Database Schema:** The `club_profiles` table has these columns:
- `id` (uuid, primary key)
- `organization_name`, `club_type`, `acronym`, etc.
- **NO `user_id` column**

**Impact:** This caused a 400 Bad Request error visible in the network panel

### 2. Missing User-Club Relationship
**Database Structure:**
- `club_profiles` - stores club information (no direct user reference)
- `club_staff` - links users to clubs as staff (has `user_id` and `club_id`)
- `club_members` - links users to clubs as members (has `user_id` and `club_id`)

**Problem:** User `kdenney` has:
- ✅ User profile in `users` table
- ❌ NO entry in `club_staff` table
- ❌ NO entry in `club_members` table
- ❌ No `club_id` on user profile

**Result:** User legitimately doesn't have a club association

## Fixes Implemented

### 1. Fixed Database Query Logic
**File:** `providers/AuthProvider.tsx`

**Changes:**
- ✅ Removed broken `user_id` query
- ✅ Added proper query through `club_staff` table
- ✅ Added proper query through `club_members` table
- ✅ Added comprehensive debug logging
- ✅ Changed error handling to log but not throw (graceful degradation)

**New Query Flow:**
1. Try: Get club from `user.profile.club_id` → query `club_profiles` by id
2. Try: Query `club_staff` by `user_id` → get `club_id` → query `club_profiles`
3. Try: Query `club_members` by `user_id` → get `club_id` → query `club_profiles`
4. If none found: Set clubProfile to null (user needs onboarding)

### 2. Enhanced Logging

**Added comprehensive logging to:**

1. **AuthProvider.tsx** (`providers/AuthProvider.tsx`)
   - Logs each query attempt with results
   - Logs errors with full details (message, code, details, hint)
   - Logs final resolution with club data

2. **useClubWorkspace hook** (`hooks/useClubWorkspace.ts`)
   - Logs auth context state
   - Logs clubId resolution path
   - Logs profile fallback logic
   - Logs final return values

3. **CreateEventScreen** (`app/club/event/create.tsx`)
   - Logs workspace state on mount and updates
   - Logs when showing connection screen
   - Logs user actions (retry, open onboarding)

## Expected Console Output (Debug Mode)

When user loads `/club/event/create`, you should now see:

```
[AuthProvider] [loadPersonaContext] Loading club profile with user.id: xxx
[AuthProvider] [loadPersonaContext] User profile club_id: null
[AuthProvider] [loadPersonaContext] Attempting query 2: club_staff relationship
[AuthProvider] [loadPersonaContext] Query 2 result: {hasData: false, ...}
[AuthProvider] [loadPersonaContext] Attempting query 3: club_members relationship
[AuthProvider] [loadPersonaContext] Query 3 result: {hasData: false, ...}
[AuthProvider] [loadPersonaContext] ✅ Club profile resolution complete: {hasClubData: false}
[useClubWorkspace] Auth context: {hasClubProfile: false, ...}
[useClubWorkspace] ⚠️ No clubId found
[useClubWorkspace] ⚠️ No profile available
[CreateEventScreen] Workspace state: {clubId: null, isConnected: false, ...}
[CreateEventScreen] ❌ No clubId - showing connection screen
```

## Next Steps for User

The user needs to complete club onboarding by either:

1. **Option A:** Click "Retry Connection" (if they have club association in database)
2. **Option B:** Click "Open Club Onboarding" to create a club profile
3. **Option C (Manual):** Insert a record in `club_staff` or `club_members` linking their user to a club

## Testing Instructions

1. Open browser DevTools console
2. Navigate to `localhost:8081/club/event/create`
3. Check console for debug logs showing the query flow
4. Verify network panel no longer shows 400 error on club_profiles
5. Click "Retry Connection" - should see refresh attempt in logs
6. Click "Open Club Onboarding" - should navigate to onboarding

## Database Fix Example

To manually link user to a club:

```sql
-- Find user ID
SELECT id, email FROM users WHERE email LIKE '%kdenney%';

-- Find or create club
SELECT id, organization_name FROM club_profiles;

-- Link user to club as staff
INSERT INTO club_staff (club_id, user_id, role, active)
VALUES (
  '<club-id>',
  '<user-id>',
  'admin',
  true
);
```

## Files Modified

1. ✅ `providers/AuthProvider.tsx` - Fixed query logic + logging
2. ✅ `hooks/useClubWorkspace.ts` - Added comprehensive logging
3. ✅ `app/club/event/create.tsx` - Added debug logging

## Technical Debt Removed

- Removed legacy query for `club_profiles.user_id` (column doesn't exist)
- Removed legacy query for `club_profiles.id = user.id` (wrong relationship)
- Improved error handling to not throw on missing club profile
