# Debugging Onboarding Issues - Logging Added

## Problems Identified

### **Problem 1: Profile data tally not populating during chat**
### **Problem 2: Dashboard shows no data after onboarding completes**

## Root Cause Analysis

### Most Likely Causes:
1. **Context not being dynamically updated** - The `ConversationalContext` is static and doesn't extract data from AI responses
2. **AI not calling save_sailor_profile** - The tool may not be getting invoked at the end
3. **Save failing silently** - RLS policies or missing data causing failures

## Comprehensive Logging Added

### 1. Context Tracking (`useStreamingChat.ts:28-37`)
```typescript
React.useEffect(() => {
  console.log('🔍 [useStreamingChat] Context updated:', {
    sailorId: context.sailorId,
    hasVenue: !!context.detectedVenue,
    venueName: context.detectedVenue?.name,
    boatClass: context.selectedBoatClass,
    clubs: context.selectedClubs,
    fleets: context.selectedFleets,
  });
}, [context]);
```

**What to look for:**
- Context should update as AI collects data
- If context never changes, we need to extract data from AI responses

### 2. AI Tool Execution (`ConversationalOnboardingAgent.ts:293-318`)
```typescript
console.log('🔧 [ConversationalAgent] AI wants to use tools:', [...tool names]);
console.log(`🔧 [ConversationalAgent] Executing tool: ${toolUse.name}`, input);
console.log(`✅ [ConversationalAgent] Tool ${toolUse.name} result:`, result);
console.error(`❌ [ConversationalAgent] Tool ${toolUse.name} ERROR:`, error);
```

**What to look for:**
- Are tools being called?
- Which tools are executed?
- Is `save_sailor_profile` called at the end?
- Are there any errors?

### 3. Save Profile Tool (`EnhancedOnboardingTools.ts:215-320`)
```typescript
console.log('💾 Saving sailor profile:', { sailor_id, profile_data });
console.log('✅ Marked onboarding complete');
console.log('✅ Saved sailor profile');
console.log('💾 Saving boats:', profile_data.boats);
console.log('✅ Saved boats');
console.log('❌ Boats save error:', boatsError);
// ... similar for clubs, fleets
```

**What to look for:**
- Is save_sailor_profile being called?
- Is sailor_id present?
- Which tables succeed/fail?
- RLS errors?

### 4. Dashboard Data Loading (`useData.ts:455-473`)
```typescript
console.log('🏠 [useDashboardData] Fetching dashboard for user:', user?.id);
console.log('🏠 [useDashboardData] Data loaded:', {
  profile: profile.data,
  boats: boats.data,
  boatsCount: boats.data?.length,
  fleets: fleets.data,
  fleetsCount: fleets.data?.length,
  ...errors
});
```

**What to look for:**
- Does user ID match?
- Are queries returning data?
- Any RLS errors?

## How to Use These Logs

### Step 1: Start Fresh Onboarding
1. Clear browser console
2. Navigate to sailor onboarding
3. Answer AI questions

### Step 2: Monitor Console for:

**Context Updates:**
```
🔍 [useStreamingChat] Context updated: { sailorId: "...", venueName: "Victoria Harbor", ... }
```
**Expected:** Context should update as you provide information

**Tool Executions:**
```
🔧 [ConversationalAgent] AI wants to use tools: ["detect_venue_from_gps_with_intel"]
🔧 [ConversationalAgent] Executing tool: detect_venue_from_gps_with_intel
✅ [ConversationalAgent] Tool detect_venue_from_gps_with_intel result: {...}
```
**Expected:** Multiple tools should execute throughout conversation

**Save at End:**
```
🔧 [ConversationalAgent] Executing tool: save_sailor_profile
💾 Saving sailor profile: { sailor_id: "...", profile_data: {...} }
✅ Marked onboarding complete
✅ Saved sailor profile
✅ Saved boats
✅ Saved clubs
✅ Saved fleets
```
**Expected:** All saves should succeed with ✅

### Step 3: Check Dashboard
```
🏠 [useDashboardData] Fetching dashboard for user: "..."
🏠 [useDashboardData] Data loaded: {
  boats: [{...}],
  boatsCount: 2,
  fleets: [{...}],
  fleetsCount: 1
}
```
**Expected:** Data should be present

## Expected Log Flow (Happy Path)

```
1. 🔍 [useStreamingChat] Context updated: { sailorId: "abc-123", hasVenue: false }
2. 🔧 [ConversationalAgent] Executing tool: detect_venue_from_gps_with_intel
3. ✅ [ConversationalAgent] Tool result: { venue: "Victoria Harbor" }
4. 🔍 [useStreamingChat] Context updated: { venueName: "Victoria Harbor" }
5. 🔧 [ConversationalAgent] Executing tool: find_yacht_clubs_at_venue
6. ✅ [ConversationalAgent] Tool result: { clubs: [...] }
7. ... (more tools)
8. 🔧 [ConversationalAgent] Executing tool: save_sailor_profile
9. 💾 Saving sailor profile: { sailor_id: "abc-123", profile_data: {...} }
10. ✅ Marked onboarding complete
11. ✅ Saved boats
12. ✅ Saved clubs
13. ✅ Saved fleets
14. [Redirect to dashboard]
15. 🏠 [useDashboardData] Data loaded: { boatsCount: 2, fleetsCount: 1 }
```

## Next Steps

### If Context Never Updates:
- The `ConversationalContext` needs to dynamically extract data from AI messages
- Need to parse AI tool results and update context state

### If save_sailor_profile Not Called:
- AI doesn't think it has enough data
- System prompt needs clarification
- AI encountering errors preventing save

### If Save Fails:
- Check RLS policies in Supabase
- Verify sailor_id is correct UUID
- Check foreign key constraints

### If Dashboard Empty:
- Check user ID matches
- Verify data was actually saved
- Check RLS policies on sailor_boats, fleet_members tables

## Quick Test Commands

```bash
# Check if data was saved in Supabase
# Use MCP Supabase to query:
SELECT * FROM sailor_boats WHERE sailor_id = '<your-user-id>';
SELECT * FROM fleet_members WHERE sailor_id = '<your-user-id>';
SELECT onboarding_completed FROM users WHERE id = '<your-user-id>';
```

---

**Status:** Logging infrastructure complete. Refresh page and test onboarding to analyze logs.
