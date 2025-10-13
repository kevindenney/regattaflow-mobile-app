# Onboarding: Boat Name & Menu Visibility Fixes

## Changes Made

### 1. ✅ Added Boat Name to Conversation Flow

**Problem:** AI only asked for sail number, not boat name.

**Solution:** Updated conversation flow to ask for BOTH boat name and sail number.

**File:** `src/services/agents/ConversationalOnboardingAgent.ts` (lines 91-96)

```typescript
5. **Boat Name & Sail Number** - ALWAYS ask BOTH:
   - "What's your boat's name?" (e.g., "Blue Lightning", "Dragon Lady")
   - "What's your sail number for the [boat class]?" (e.g., "D59")
   - After getting sail number, call lookup_sail_number_and_import_results
   - If found, ask "Is this your boat, [Owner Name]?"
   - Import race results automatically
```

**Expected Behavior:**
```
AI: "What's your main boat class?"
User: "Dragon"
AI: "Great! What's your boat's name?"
User: "Blue Lightning"
AI: "And what's your sail number for the Dragon?"
User: "D59"
```

### 2. ✅ Added Boat Name Field to Data Structure

**File:** `src/hooks/useStreamingChat.ts` (line 27)

```typescript
boats?: Array<{
  class: string;
  name?: string;      // NEW: Boat name field
  sailNumber?: string
}>;
```

### 3. ✅ Fixed Menu Visibility

**Problem:** Three-dot menu (⋮) not appearing during active conversations.

**Solution:** Added logic to automatically set `hasStarted = true` when messages appear.

**File:** `src/app/(auth)/sailor-onboarding-chat.tsx` (lines 90-95)

```typescript
// Mark as started when messages appear
useEffect(() => {
  if (messages.length > 0 && !hasStarted) {
    setHasStarted(true);
  }
}, [messages, hasStarted]);
```

**Menu Options:**
- 💾 **Save for Later** - Saves progress and exits
- 📝 **Use Form Instead** - Switches to traditional form
- ⏩ **Skip Onboarding** - Marks complete and goes to dashboard

### 4. ✅ Removed "Your Profile" Heading

**Problem:** Redundant "📋 Your Profile" heading in sidebar.

**Solution:** Removed the heading from OnboardingDataTally component.

**File:** `src/components/onboarding/OnboardingDataTally.tsx` (line 65)

**Before:**
```tsx
<View className="p-4">
  <Text className="text-lg font-bold text-gray-900 mb-4">📋 Your Profile</Text>
  {/* data sections */}
</View>
```

**After:**
```tsx
<View className="p-4">
  {/* data sections - no heading */}
</View>
```

## Files Modified

1. **src/services/agents/ConversationalOnboardingAgent.ts**
   - Updated conversation flow to ask for boat name before sail number

2. **src/hooks/useStreamingChat.ts**
   - Added `name?: string` to boat data structure

3. **src/app/(auth)/sailor-onboarding-chat.tsx**
   - Added automatic `hasStarted` tracking when messages appear
   - Ensures menu appears during active conversations

4. **src/components/onboarding/OnboardingDataTally.tsx**
   - Removed "Your Profile" heading

## User Experience Improvements

### Before:
- ❌ AI only asked for sail number, not boat name
- ❌ Menu hidden during conversations
- ❌ Redundant "Your Profile" heading

### After:
- ✅ AI asks for both boat name and sail number
- ✅ Menu (⋮) visible throughout conversation
- ✅ Clean sidebar without redundant heading

## Testing Instructions

### Test Boat Name Question:
1. Start onboarding
2. Answer venue, club, and boat class questions
3. Verify AI asks: "What's your boat's name?"
4. Answer with boat name (e.g., "Blue Lightning")
5. Verify AI then asks: "What's your sail number?"
6. Check sidebar shows boat name in chronological display

### Test Menu Visibility:
1. Start onboarding conversation
2. As soon as first AI message appears, check header
3. Should see three-dot menu (⋮) in top-right corner
4. Click menu to verify options appear:
   - 💾 Save for Later
   - 📝 Use Form Instead
   - ⏩ Skip Onboarding

### Test Traditional Form Navigation:
1. During conversation, click ⋮ menu
2. Click "Use Form Instead"
3. Should navigate to `/sailor-onboarding-form`
4. Form should show all fields for manual entry

### Test Save for Later:
1. During conversation, click ⋮ menu
2. Click "Save for Later"
3. Confirm save prompt
4. Should save progress and navigate to dashboard
5. Return to onboarding - should see "Resume Onboarding?" prompt

## Expected Conversation Flow

```
AI: "I've found you near Hong Kong - Victoria Harbor. Which yacht club do you race with?"
User: "RHKYC"

AI: "Great! What's your main boat class?"
User: "Dragon"

AI: "What's your boat's name?"
User: "Blue Lightning"

AI: "And what's your sail number for the Dragon?"
User: "D59"

AI: "Let me search online for your Dragon D59... I've recorded your Dragon sail number D59."
```

## Sidebar Display (Chronological)

```
📍 Home Venue
  • Hong Kong - Victoria Harbor

👥 Yacht Club
  • RHKYC

⚓ Boat
  • Dragon - Blue Lightning #D59

👥 Sailor Role
  • Owner
```

**Note:** Boat name will appear inline with class and sail number once AI processes the response.

---

**Status:** ✅ All changes implemented
**Ready for Testing:** Yes (requires Anthropic API credits)
