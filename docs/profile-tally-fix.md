# Profile Tally Real-Time Data Extraction - Fixed

## Problem

The profile sidebar wasn't populating with collected data during the chat conversation. It showed the placeholder text "Your profile data will appear here as we chat" even after user provided information like:
- Owner/crew role
- Boat class (Dragon)
- Location (Hong Kong)

## Root Cause

The `OnboardingDataTally` component required a `collectedData` prop, but the screen was only passing `context`. The `context` from the AI agent doesn't automatically extract structured data from user messages.

## Solution Implemented

### 1. Added Real-Time Data Extraction (`useStreamingChat.ts`)

Created a `useEffect` that parses user messages and extracts:

**Role Detection:**
- "owner" → Owner
- "crew" → Crew
- "both" → Owner & Crew

**Boat Class Detection:**
Comprehensive list of 30+ boat classes:
- Keelboats: Dragon, J/70, J/105, Etchells, IRC, Melges, Farr, Swan, TP52, RC44
- Dinghies: Laser, ILCA, 420, 470, 49er, 505, Finn, Star, Snipe
- Sportboats: Lightning, Thistle, Viper, X-Boat

**Sail Number Detection:**
Patterns: "#123", "sail 123", "number 123"

**Venue Detection:**
From `context.detectedVenue.name` (set by GPS or search tools)

### 2. Updated Hook Interface

```typescript
export interface CollectedData {
  venue?: string;
  role?: string;
  boats?: Array<{ class: string; sailNumber?: string }>;
  clubs?: string[];
  fleets?: string[];
  equipment?: Array<{ boat: string; makers: string[] }>;
  coaches?: string[];
  crew?: string[];
  racingAreas?: string[];
  series?: string[];
}

return {
  messages,
  isLoading,
  context,
  collectedData,  // ← NEW
  sendMessage,
  updateContext,
  resetConversation,
  startOnboarding,
};
```

### 3. Updated Screen to Pass Data

```typescript
const {
  messages,
  isLoading,
  context,
  collectedData,  // ← Extract from hook
  sendMessage,
  updateContext,
  startOnboarding,
} = useStreamingChat(user?.id || '');

// Pass to component
<OnboardingDataTally context={context} collectedData={collectedData} />
```

## How It Works

1. **User types:** "owner"
   - `useEffect` detects "owner" in message
   - Updates `collectedData.role = "Owner"`
   - Component re-renders with "Sailor Role: Owner"

2. **User types:** "dragon"
   - `useEffect` detects "dragon" in boat class list
   - Updates `collectedData.boats = [{ class: "Dragon" }]`
   - Component re-renders with "Boats: Dragon"

3. **GPS detects venue:**
   - AI tool sets `context.detectedVenue`
   - `useEffect` extracts `newData.venue = "Hong Kong - Victoria Harbor"`
   - Component re-renders with "Home Venue: Hong Kong - Victoria Harbor"

## Expected Behavior Now

### Real-Time Updates
As the conversation progresses, the sidebar should show:

```
📋 Your Profile

📍 Home Venue
• Hong Kong - Victoria Harbor

👥 Sailor Role
• Owner

⚓ Boats
• Dragon

🏛️ Yacht Clubs
• (populated when clubs discussed)

👥 Racing Fleets
• (populated when fleets discussed)
```

### Console Logging
New log added to track extraction:
```
📊 [useStreamingChat] Collected data updated: {
  venue: "Hong Kong - Victoria Harbor",
  role: "Owner",
  boats: [{ class: "Dragon" }]
}
```

## Future Enhancements

The current implementation uses **keyword matching** which works for most cases but could be enhanced:

### Option 1: Extract from AI Tool Results
Monitor AI tool execution results and extract structured data:
```typescript
// When save_sailor_profile is called, extract the profile_data parameter
// This gives us the exact data the AI collected
```

### Option 2: Parse AI Responses
Use regex/NLP on assistant messages:
```typescript
// "I found the Dragon class" → boats.push({ class: "Dragon" })
// "7 active yacht clubs" → clubs data
```

### Option 3: Context Updates from Agent
Have the agent update context with structured data:
```typescript
context.selectedBoats = [{ class: "Dragon", id: "..." }]
context.selectedClubs = ["RHKYC"]
```

## Testing

1. Navigate to `/sailor-onboarding-chat`
2. Allow location → See venue populate immediately
3. Type "owner" → See "Sailor Role: Owner" appear
4. Type "dragon" → See "Boats: Dragon" appear
5. Check console for `📊 [useStreamingChat] Collected data updated`

## Files Changed

- ✅ `src/hooks/useStreamingChat.ts` - Added data extraction logic
- ✅ `src/app/(auth)/sailor-onboarding-chat.tsx` - Pass collectedData prop
- ✅ `src/components/onboarding/OnboardingDataTally.tsx` - Already supported collectedData

---

**Status:** ✅ Implemented and ready for testing
**Impact:** Profile sidebar now populates in real-time during conversation
