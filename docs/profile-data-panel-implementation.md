# Profile Data Collection Panel - Implementation

## Overview

Added a real-time profile data collection panel to the sailor onboarding chat that displays collected information as the user progresses through the conversation.

## Features

### Desktop Experience (> 768px width)
- **Always Visible Sidebar**: 320px wide panel on the right side
- **Real-time Updates**: Data appears instantly as extracted from conversation
- **Chronological Display**: Shows data in the order it was collected
- **Categorized Icons**: Visual indicators for venue, club, boat, role, etc.

### Mobile Experience (≤ 768px width)
- **Toggle Button**: "Profile" button in bottom action bar
- **Overlay Panel**: Slides in from right with shadow
- **Close Button**: X button to dismiss panel
- **Same Data**: Identical content to desktop version

## UI Components

### OnboardingDataTally Component
Location: `src/components/onboarding/OnboardingDataTally.tsx`

**Features:**
- Chronological item display (primary)
- Legacy grouped display (fallback)
- Icon-based categorization
- Responsive scrolling

**Data Types Displayed:**
- 🗺️ Venue (MapPin icon)
- 👥 Club (Users icon)
- ⚓ Boat + Sail Number (Anchor icon)
- 👤 Role (Owner/Crew) (Users icon)
- 🏆 Equipment (Award icon)
- 📅 Racing Series (Calendar icon)
- 🌐 **NEW: Website URLs** (displayed with label)

### ChatOnboardingInterface Updates
Location: `src/components/onboarding/ChatOnboardingInterface.tsx`

**New Props:**
```typescript
onToggleTally?: () => void;      // Function to toggle panel on mobile
showTallyButton?: boolean;        // Whether to show toggle button
```

**New UI Elements:**
- "Profile" button (List icon) in action bar (mobile only)
- Button appears when messages exist and panel is hidden

### Main Screen Layout
Location: `src/app/(auth)/sailor-onboarding-chat.tsx`

**Layout Structure:**
```tsx
<View className="flex-1 flex-row">
  {/* Main Chat */}
  <View className="flex-1">
    <ChatOnboardingInterface ... />
  </View>

  {/* Profile Panel - Desktop OR Mobile Overlay */}
  {shouldShowPanel && (
    <View className={desktopStyle OR mobileOverlayStyle}>
      <OnboardingDataTally ... />
    </View>
  )}
</View>
```

**Responsive Logic:**
- Desktop (width > 768px): Always visible sidebar
- Mobile (width ≤ 768px): Controlled by `showTally` state
- Auto-show on desktop, hidden by default on mobile

## Data Extraction

### useStreamingChat Hook Updates
Location: `src/hooks/useStreamingChat.ts`

**NEW: URL Extraction (lines 242-276)**
```typescript
// Extract URLs from user messages
const urlRegex = /(https?:\/\/[^\s]+)/gi;
const urls = content.match(urlRegex);

// Categorize as club or class URL based on context
if (content.includes('club') || url.includes('yacht')) {
  label = 'Club Website';
} else if (content.includes('class') || url.includes('dragon')) {
  label = 'Class Website';
}
```

**Existing Extractions:**
- Venue (from GPS context or AI messages)
- Role (owner/crew/both from user messages)
- Boat classes (pattern matching against known classes)
- Sail numbers (regex: #123, sail 123, number 123)
- Clubs (abbreviations or full names)
- Fleets (from context)

**Chronological Tracking:**
All extracted data includes:
- `type`: Data category
- `label`: Display label
- `value`: Actual data
- `timestamp`: When it was mentioned

## User Experience Flow

### Desktop Flow:
1. User starts onboarding
2. Panel automatically appears on right side
3. Data populates in real-time as conversation progresses
4. Panel remains visible throughout onboarding

### Mobile Flow:
1. User starts onboarding
2. Panel hidden by default (more screen space for chat)
3. Blue "Profile" button appears in action bar
4. Tap "Profile" → Panel slides in from right
5. Tap X or tap outside → Panel dismisses
6. Data persists, can be viewed anytime

## Example Data Display

```
📍 Home Venue
• Hong Kong - Victoria Harbor

👥 Yacht Club
• Royal Hong Kong Yacht Club

🌐 Club Website
• https://rhkyc.org.hk

⚓ Boat
• Dragon #59

🌐 Class Website
• https://intdragon.net

👤 Sailor Role
• Owner

🏆 Equipment
• Dragon: North Sails
```

## Technical Details

### State Management
- `showTally` state in parent component
- Desktop: Auto-set to `true` when width > 768px
- Mobile: User-controlled via toggle button

### Styling Classes
**Desktop Panel:**
```tsx
className="w-80 border-l border-gray-200"
```

**Mobile Overlay:**
```tsx
className="absolute right-0 top-0 bottom-0 w-80 shadow-2xl z-50"
```

**Toggle Button:**
```tsx
className="border border-blue-600 rounded-lg py-2 px-3 flex-row items-center justify-center"
```

### Data Flow
1. User sends message → `useStreamingChat.sendMessage()`
2. Message added to `messages` state
3. `useEffect` monitors `messages` changes
4. Extracts data using pattern matching & regex
5. Updates `collectedData` state
6. `OnboardingDataTally` receives new data
7. Component re-renders with updated display

## Files Changed

1. **src/app/(auth)/sailor-onboarding-chat.tsx**
   - Added panel layout with responsive logic
   - Connected toggle state and handlers
   - Integrated OnboardingDataTally component

2. **src/components/onboarding/ChatOnboardingInterface.tsx**
   - Added toggle button props
   - Added "Profile" button to action bar
   - Imported List icon from lucide-react-native

3. **src/hooks/useStreamingChat.ts**
   - Added URL extraction logic (lines 242-276)
   - Categorizes URLs as club or class websites
   - Includes in chronological tracking

4. **src/components/onboarding/OnboardingDataTally.tsx**
   - No changes (already supported chronological display)

## Testing Checklist

- [x] Desktop view shows panel automatically
- [x] Mobile view hides panel by default
- [x] Toggle button appears on mobile
- [x] Panel slides in/out smoothly on mobile
- [x] Close button works on mobile overlay
- [x] Data updates in real-time
- [x] URLs are extracted and displayed
- [x] Chronological order is maintained
- [x] Icons display correctly for each data type

## Future Enhancements

1. **Editable Data**: Allow users to edit collected data directly in panel
2. **Data Validation**: Show validation status (✓ verified, ⚠️ needs review)
3. **Progress Indicator**: Show completion percentage
4. **Export Data**: Download collected data as JSON
5. **Saved State**: Persist panel visibility preference
6. **Animation**: Smooth transitions for new data items
7. **Grouping Toggle**: Switch between chronological and grouped views
