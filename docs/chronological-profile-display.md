# Chronological Profile Display

## Overview

Enhanced the onboarding profile sidebar to display collected data in the **order it was collected** rather than grouped by category. This creates a more natural, conversation-following experience.

## Problem Solved

**Before:** Profile data was displayed in predefined sections (Venue → Role → Boats → Clubs → Fleets), regardless of the order the user provided information.

**After:** Profile data appears in the exact order collected during the conversation (e.g., Venue → Club → Boat → Role).

## Implementation

### 1. Enhanced Data Structure

Added chronological tracking to `CollectedData` interface:

```typescript
// src/hooks/useStreamingChat.ts

export interface CollectedDataItem {
  type: 'venue' | 'club' | 'boat' | 'role' | 'fleet' | 'equipment' | 'coach' | 'crew' | 'racingArea' | 'series';
  label: string;
  value: string;
  timestamp: number;
}

export interface CollectedData {
  // Legacy fields (still populated for backward compatibility)
  venue?: string;
  role?: string;
  boats?: Array<{ class: string; sailNumber?: string }>;
  clubs?: string[];
  fleets?: string[];

  // NEW: Chronological order tracking
  items?: CollectedDataItem[];
}
```

### 2. Enhanced Club Detection

Improved club name extraction from user messages:

```typescript
// src/hooks/useStreamingChat.ts (lines 164-227)

// Pattern 1: Abbreviations (2-6 capital letters)
// Detects: "RHKYC", "ABC", "RBYC", etc.
const abbrevMatch = content.match(/\b([A-Z]{2,6})\b/g);

// Pattern 2: Full club names
// Detects: "Hebe Haven Yacht Club", "Hong Kong Sailing Club", etc.
const fullNameMatch = content.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Yacht|Sailing)\s+Club)\b/gi);

// Filters out common abbreviations (GPS, AI, OK, YES, NO, USA, UK)
```

**Examples:**
- "I sail with RHKYC" → ✅ Detects "RHKYC"
- "Royal Hong Kong Yacht Club" → ✅ Detects "Royal Hong Kong Yacht Club"
- "I use GPS to navigate" → ❌ Filters out "GPS" (not a club)

### 3. Chronological Item Building

Each detected data point is added to `chronologicalItems` array with timestamp:

```typescript
// Venue detection
chronologicalItems.push({
  type: 'venue',
  label: 'Home Venue',
  value: 'Hong Kong - Victoria Harbor',
  timestamp: msg.timestamp.getTime(),
});

// Club detection
chronologicalItems.push({
  type: 'club',
  label: 'Yacht Club',
  value: 'RHKYC',
  timestamp: msg.timestamp.getTime(),
});

// Boat detection
chronologicalItems.push({
  type: 'boat',
  label: 'Boat',
  value: 'Dragon',
  timestamp: msg.timestamp.getTime(),
});

// Role detection
chronologicalItems.push({
  type: 'role',
  label: 'Sailor Role',
  value: 'Owner',
  timestamp: msg.timestamp.getTime(),
});

// Sort by timestamp and add to collectedData
chronologicalItems.sort((a, b) => a.timestamp - b.timestamp);
newData.items = chronologicalItems;
```

### 4. Updated Display Component

Modified `OnboardingDataTally.tsx` to use chronological display:

```typescript
// src/components/onboarding/OnboardingDataTally.tsx

export function OnboardingDataTally({ context, collectedData }: OnboardingDataTallyProps) {
  const hasChronologicalData = collectedData?.items && collectedData.items.length > 0;

  return (
    <ScrollView>
      {hasChronologicalData ? (
        // NEW: Chronological display (items appear in order collected)
        collectedData!.items!.map((item, idx) => (
          <View key={idx}>
            <View className="flex-row items-center">
              {getIcon(item.type)}
              <Text>{item.label}</Text>
            </View>
            <Text>• {item.value}</Text>
          </View>
        ))
      ) : (
        // LEGACY: Old display method (grouped by category)
        // Falls back for old saved progress data
      )}
    </ScrollView>
  );
}
```

## User Experience Flow

### Example Conversation Flow

```
AI: "I've found you near **Hong Kong - Victoria Harbor**. Which yacht club do you race with?"
Sidebar:
  📍 Home Venue
    • Hong Kong - Victoria Harbor

User: "RHKYC"
Sidebar:
  📍 Home Venue
    • Hong Kong - Victoria Harbor
  👥 Yacht Club
    • RHKYC

AI: "Great! What's your main boat class?"
User: "Dragon"
Sidebar:
  📍 Home Venue
    • Hong Kong - Victoria Harbor
  👥 Yacht Club
    • RHKYC
  ⚓ Boat
    • Dragon

AI: "Are you a boat owner, crew, or both?"
User: "Owner"
Sidebar:
  📍 Home Venue
    • Hong Kong - Victoria Harbor
  👥 Yacht Club
    • RHKYC
  ⚓ Boat
    • Dragon
  👥 Sailor Role
    • Owner
```

**Notice:** Items appear in the exact order they were mentioned in the conversation.

## Files Modified

### `src/hooks/useStreamingChat.ts`
- Added `CollectedDataItem` interface
- Added `items?: CollectedDataItem[]` to `CollectedData` interface
- Enhanced venue extraction from AI messages (lines 55-79)
- Enhanced role detection with timestamps (lines 86-114)
- Enhanced boat detection with timestamps (lines 116-162)
- **NEW:** Enhanced club detection with pattern matching (lines 164-227)
- Added fleet tracking with timestamps (lines 229-240)
- Sort chronological items by timestamp (lines 242-249)

### `src/components/onboarding/OnboardingDataTally.tsx`
- Added `CollectedDataItem` interface
- Added `items?: CollectedDataItem[]` to props interface
- Added `getIcon()` helper function for dynamic icons
- Implemented chronological display mode (lines 60-74)
- Maintained legacy display for backward compatibility (lines 76-171)

## Benefits

1. **Natural Flow:** Profile builds in conversation order, making it easier to follow
2. **User Feedback Alignment:** Matches user's mental model of the conversation
3. **Real-time Transparency:** Users see exactly what data was extracted when
4. **Improved Club Detection:** Now catches both abbreviations ("RHKYC") and full names ("Royal Hong Kong Yacht Club")
5. **Backward Compatible:** Legacy saved progress still displays correctly

## Testing Instructions

### Test Chronological Order
1. Start onboarding
2. Note the order questions are asked: Venue → Club → Boat → Role
3. Provide answers in order
4. Verify sidebar shows items in the exact order collected
5. Items should appear as: Venue → Club → Boat → Role

### Test Club Detection
1. Type "RHKYC" → Should detect as yacht club ✅
2. Type "Royal Hong Kong Yacht Club" → Should detect as yacht club ✅
3. Type "I use GPS" → Should NOT detect "GPS" as club ❌
4. Type "ABC Sailing Club" → Should detect "Abc Sailing Club" ✅

### Test Backward Compatibility
1. Load old saved progress (from before chronological tracking)
2. Sidebar should display using legacy method (grouped by category)
3. No errors or crashes

## Console Logging

Added enhanced debug logging:

```typescript
console.log('📊 [useStreamingChat] Collected data updated:', newData);
console.log('🕐 [useStreamingChat] Chronological items:', chronologicalItems);
```

**Example output:**
```
🕐 [useStreamingChat] Chronological items: [
  { type: 'venue', label: 'Home Venue', value: 'Hong Kong - Victoria Harbor', timestamp: 1738022400000 },
  { type: 'club', label: 'Yacht Club', value: 'RHKYC', timestamp: 1738022410000 },
  { type: 'boat', label: 'Boat', value: 'Dragon', timestamp: 1738022420000 },
  { type: 'role', label: 'Sailor Role', value: 'Owner', timestamp: 1738022430000 }
]
```

## Edge Cases Handled

1. **Missing Timestamps:** Uses `Date.now()` for context-based data
2. **Duplicate Items:** Prevents duplicate boats/clubs from being added
3. **Mixed Case Club Names:** Properly capitalizes full club names
4. **Abbreviated Clubs:** Detects 2-6 letter abbreviations (filters out GPS, AI, etc.)
5. **Sail Numbers:** Updates boat item value to include sail number inline
6. **Legacy Data:** Falls back to grouped display if no chronological items

## Future Enhancements

- [ ] Add visual timeline with timestamps (e.g., "2 minutes ago")
- [ ] Allow reordering items via drag-and-drop
- [ ] Add edit/delete functionality per item
- [ ] Show "collected from" indicator (user vs AI detection)
- [ ] Add confidence scores for auto-detected data

---

**Status:** ✅ Implemented and ready for testing (requires Anthropic API credits)
**Impact:** Improves UX by showing profile data in natural conversation order
**Backward Compatible:** Yes, legacy data still displays correctly
