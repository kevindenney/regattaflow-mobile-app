# Conversation Flow Optimization

## Changes Made

Updated the AI's conversation flow to ask questions in a more logical order for sailors.

### New Question Order

**Before:**
1. GPS Detection → Venue
2. Owner vs Crew ← *Asked too early*
3. Boat class
4. Sail numbers
5. ... (many questions)
9. Yacht clubs ← *Asked too late*

**After (Optimized):**
1. **GPS Detection → Venue** ✅
2. **Yacht Clubs** ✅ *Moved up - clubs are fundamental to racing*
3. **Boat Class** ✅ *Asked early to provide context*
4. **Owner vs Crew** ✅ *Moved after boat - makes more sense*
5. **Sail Numbers** ✅
6. Equipment makers
7. Coaches
8. Crew members
9. Additional boats
10. Fleets (filtered by club + boat class)
11. Social connections
12. Class associations
13. Racing areas
14. Racing series
15. Race calendar
16. Summary & Save

### Why This Order is Better

**1. Venue → Clubs (Immediate Context)**
- After GPS detects Hong Kong - Victoria Harbor, immediately ask about clubs
- Shows available clubs at the venue
- Establishes racing context early

**2. Boats Before Role (More Natural)**
- "What do you sail?" feels more natural than "Are you owner or crew?"
- Boat class provides context for follow-up questions
- Role becomes clear through conversation (asking for sail number implies ownership)

**3. Fleets After Club + Boat (Better Filtering)**
- Can now filter fleets by: club + boat class
- More relevant fleet suggestions
- Better social connection opportunities

### AI Prompt Changes

Updated `ConversationalOnboardingAgent.ts` lines 86-123:

```typescript
COMPREHENSIVE CONVERSATION FLOW:
1. **Welcome & GPS Detection** - Detect venue automatically
2. **Find Yacht Clubs** - Immediately ask: "Which yacht club do you race with?" (show clubs at venue)
3. **Primary Boat** - "What's your main boat class?" (with venue-specific suggestions)
4. **Owner vs Crew** - "Are you a boat owner, crew, or both?"
5. **Sail Numbers** - ALWAYS ask "What's your sail number..."
...
```

### Data Extraction Updates

Updated `useStreamingChat.ts` to extract clubs and fleets from context:

```typescript
// Extract clubs from context or messages
if (context.selectedClubs && context.selectedClubs.length > 0) {
  newData.clubs = context.selectedClubs;
}

// Extract fleets from context
if (context.selectedFleets && context.selectedFleets.length > 0) {
  newData.fleets = context.selectedFleets;
}
```

### Expected New Flow

**Example conversation:**

```
AI: "I found you near Hong Kong - Victoria Harbor!
     7 yacht clubs race here. Which one do you race with?"
     [Shows: RHKYC, ABC, HKRNVR, etc.]

User: "RHKYC"
[Profile tally shows: Yacht Clubs • RHKYC]

AI: "What's your main boat class? Popular here: Dragon, Etchells, J/70"

User: "Dragon"
[Profile tally shows: Boats • Dragon]

AI: "Are you a boat owner, crew, or both?"

User: "owner"
[Profile tally shows: Sailor Role • Owner]

AI: "What's your sail number for the Dragon?"

User: "123"
[Profile tally shows: Boats • Dragon #123]
```

## Benefits

1. ✅ **Faster Context Building** - Club establishes racing context immediately
2. ✅ **More Natural Flow** - Boat before role feels conversational
3. ✅ **Better Filtering** - Fleets can be filtered by club + class
4. ✅ **Early Validation** - Can check if club/boat combo exists in database
5. ✅ **Profile Sidebar Populates Faster** - Key info (club, boat) collected early

## Files Changed

- ✅ `src/services/agents/ConversationalOnboardingAgent.ts` - Updated conversation flow
- ✅ `src/hooks/useStreamingChat.ts` - Added club/fleet extraction

## Testing

Refresh onboarding and verify new question order:
1. GPS → Venue detected
2. **"Which yacht club do you race with?"** ← Should be second question
3. **"What's your main boat class?"** ← Should be third
4. **"Are you a boat owner, crew, or both?"** ← Should be fourth

---

**Status:** ✅ Implemented
**Impact:** More logical, natural conversation flow
