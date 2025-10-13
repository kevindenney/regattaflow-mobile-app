# Critical Fix: Zod Schema Type Coercion for AI Tool Parameters

## Problem Identified

**Root Cause:** AI onboarding was failing silently because Claude's Anthropic API returns all tool parameters as **strings**, but our Zod schemas expected **numbers**.

### Console Errors Found:
```
❌ Tool detect_venue_from_gps_with_intel failed: {
  "expected": "number",
  "path": ["radius_km"],
  "message": "Invalid input: expected number, received string"
}

❌ Tool search_venues_with_context failed: {
  "expected": "number",
  "path": ["limit"],
  "message": "Invalid input: expected number, received string"
}
```

**Impact:** AI tools were failing validation, causing:
1. No venue detection working
2. No data being saved (save_sailor_profile never reached)
3. Empty dashboard after onboarding
4. Silent failures (errors logged but conversation continued)

## Solution: Type Coercion with `z.coerce.number()`

Changed all numeric input schemas from `z.number()` to `z.coerce.number()`, which automatically converts string numbers to actual numbers.

### Files Fixed:

#### 1. `ConversationalOnboardingTools.ts` ✅
- ✅ `detect_venue_from_gps_with_intel`: `latitude`, `longitude`, `radius_km`
- ✅ `search_venues_with_context`: `limit`
- ✅ `suggest_boats_with_reasoning`: `limit`
- ✅ `discover_fleets_with_social_proof`: `limit`

#### 2. `EnhancedOnboardingTools.ts` ✅
- ✅ `find_sailors_in_fleet`: `limit`

#### 3. `ComprehensiveOnboardingTools.ts` ✅
- ✅ `find_public_sailors_in_fleet`: `limit`
- ✅ `find_racing_series_and_regattas`: `year`

#### 4. `WebSearchTools.ts` ✅
- ✅ `search_racing_calendar_online`: `year`

#### 5. `OnboardingAgent.ts` ✅ (legacy, but fixed)
- ✅ `detect_venue_from_gps`: `latitude`, `longitude`, `radius_km`
- ✅ `search_sailing_venues`: `limit`
- ✅ `suggest_boats_by_popularity`: `limit`
- ✅ `discover_fleets_smart`: `limit`

### Before Fix:
```typescript
input_schema: z.object({
  latitude: z.number().describe('GPS latitude'),
  radius_km: z.number().optional().default(50),
})
```

### After Fix:
```typescript
input_schema: z.object({
  latitude: z.coerce.number().describe('GPS latitude'),
  radius_km: z.coerce.number().optional().default(50),
})
```

## Testing Required

### 1. Fresh Onboarding Test
1. Navigate to `/sailor-onboarding-chat`
2. Allow location access
3. Wait for GPS venue detection
4. Verify in console:
   ```
   ✅ [ConversationalAgent] Tool detect_venue_from_gps_with_intel result: {...}
   ```
5. Answer AI questions about boats, clubs, fleets
6. When AI asks to save, confirm YES
7. Verify in console:
   ```
   🔧 [ConversationalAgent] Executing tool: save_sailor_profile
   💾 Saving sailor profile: { sailor_id: "...", profile_data: {...} }
   ✅ Marked onboarding complete
   ✅ Saved boats
   ✅ Saved clubs
   ✅ Saved fleets
   ```
8. Check dashboard shows data

### 2. Expected Console Logs (Happy Path)

**Step 1: GPS Detection**
```
🔧 [ConversationalAgent] AI wants to use tools: ["detect_venue_from_gps_with_intel"]
🔧 [ConversationalAgent] Executing tool: detect_venue_from_gps_with_intel
✅ [ConversationalAgent] Tool detect_venue_from_gps_with_intel result: {...}
```

**Step 2: Venue Search**
```
🔧 [ConversationalAgent] Executing tool: search_venues_with_context
✅ Tool search_venues_with_context completed successfully
```

**Step 3: Save Profile**
```
🔧 [ConversationalAgent] Executing tool: save_sailor_profile
💾 Saving sailor profile: { sailor_id: "abc-123", profile_data: {...} }
✅ Marked onboarding complete
✅ Saved boats
✅ Saved clubs
✅ Saved fleets
```

**Step 4: Dashboard Data**
```
🏠 [useDashboardData] Data loaded: {
  boats: [{...}],
  boatsCount: 2,
  fleets: [{...}],
  fleetsCount: 1
}
```

## Additional Fixes Still Needed

### 1. Dashboard Query Error
**Issue:** `fleet_members.user_id` does not exist - should be `sailor_id`
**File:** `src/hooks/useData.ts` or API service
**Status:** Identified but not fixed

### 2. Dynamic Context Updates
**Issue:** Context sidebar not populating during chat
**Cause:** Context is static - not extracting data from AI responses
**Status:** Logging added, extraction logic not implemented

### 3. Conversation Completion Detection
**Issue:** Dashboard redirect may fire too early
**File:** `sailor-onboarding-chat.tsx:151-163`
**Status:** Needs testing with new save flow

## Related Documentation
- [debugging-onboarding-issues.md](./debugging-onboarding-issues.md) - Logging infrastructure
- [EnhancedOnboardingTools.ts](../src/services/agents/EnhancedOnboardingTools.ts) - Save profile implementation
- [ConversationalOnboardingAgent.ts](../src/services/agents/ConversationalOnboardingAgent.ts) - Conversation flow

## Verification Commands

```bash
# Check if user data was saved
# Use Supabase MCP to query after onboarding:
SELECT * FROM sailor_boats WHERE sailor_id = '<user-id>';
SELECT * FROM fleet_members WHERE sailor_id = '<user-id>';
SELECT onboarding_completed FROM users WHERE id = '<user-id>';
```

---

**Status:** ✅ Fix implemented, ready for testing
**Next Step:** Test fresh onboarding session and verify all tools execute successfully
