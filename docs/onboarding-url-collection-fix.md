# Onboarding URL Collection Fix

## Problem
The AI onboarding agent was not asking for club and boat class website URLs because:

1. **Flow Position**: URLs were positioned at step 6 (after boat name/sail number)
2. **Early Save**: The mandatory save procedure interrupted at step 5, before reaching URL collection
3. **Result**: URLs were never collected during onboarding

## Solution

### 1. Repositioned URL Collection
Moved URL requests to immediately follow their relevant context:

**New Flow Order:**
1. Welcome & GPS Detection
2. Find Yacht Clubs
3. **Club Website URL** ← NEW POSITION (right after club selection)
4. Primary Boat Class
5. **Boat Class Website URL** ← NEW POSITION (right after class selection)
6. Owner vs Crew
7. Boat Name & Sail Number
8. Equipment Makers
9. Coaches
10. Crew Members
... (rest of flow)

### 2. Updated Save Procedure
Modified the mandatory save checkpoint to include URLs:

**Old checkpoint** (too early):
```
After: venue, role, boats, clubs, fleets
```

**New checkpoint** (includes URLs):
```
After: venue, club, club URL, boat class, class URL, role, boat name, sail number
```

### 3. User Experience

**Expected Conversation:**
```
AI: "Which yacht club do you race with?"
User: "Royal Hong Kong Yacht Club"

AI: "Great! Do you have a link to Royal Hong Kong Yacht Club's website?
     I can scan it for race calendars and documents."
User: "https://rhkyc.org.hk"

[AI scrapes website]

AI: "🎯 I found 12 race links and 8 documents from your club. Does this look right?"
User: "Yes"

AI: "Perfect! What's your main boat class?"
User: "Dragon"

AI: "Perfect! Do you have a link to the Dragon association or class website?"
User: "https://intdragon.net"

[AI scrapes website]

AI: "🎯 I found 8 championships and 5 documents for Dragon. Want me to add these?"
User: "Yes"

[Flow continues...]
```

## Benefits

1. **Natural Context**: URLs requested immediately when relevant (right after club/class selection)
2. **Early Discovery**: Race calendars and documents found before completing basic profile
3. **No Interruption**: Save checkpoint moved to include URL collection
4. **Optional Skip**: Users can skip URLs if they don't have them

## Technical Changes

**File**: `src/services/agents/ConversationalOnboardingAgent.ts`

**Changes**:
- Steps 3 & 5: Added URL collection immediately after club/class selection
- Step 242-257: Updated mandatory save procedure checkpoint
- Flow ensures URLs are collected before first save opportunity

## Testing

To test the fix:

1. Start sailor onboarding
2. Select yacht club
3. **Expected**: AI should immediately ask for club website URL
4. Select boat class
5. **Expected**: AI should immediately ask for class website URL
6. Continue through flow
7. **Expected**: Save prompt should appear after sail number (step 7), not before URLs

## Notes

- URLs are **optional** - users can skip if unknown
- Scraping is **lightweight** - simple pattern matching, no AI required
- Data is **verified** - user confirms before import
- Works **client-side** - no server infrastructure needed
