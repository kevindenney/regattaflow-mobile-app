# Chat Action Buttons Fix

## Problem
User could not see or access the "Save for Later", "Use Form Instead", and "Exit" options during AI onboarding chat.

## Root Cause
The three-dot dropdown menu in the header was not appearing due to Metro cache issues and potentially unclear UI placement.

## Solution

### Moved Action Buttons Into Chat Interface
Instead of a dropdown menu in the header, action buttons are now **always visible** below the input field.

**File:** `src/components/onboarding/ChatOnboardingInterface.tsx`

**Changes Made:**

1. **Added new props** (lines 16-18):
```typescript
onSaveForLater?: () => void;
onUseForm?: () => void;
onExit?: () => void;
```

2. **Added imports** (line 8):
```typescript
import { Send, Anchor, MapPin, Save, FileText, LogOut } from 'lucide-react-native';
```

3. **Added action button row** (lines 116-149):
```typescript
{/* Action Buttons - Always visible when messages exist */}
{messages.length > 0 && (
  <View className="px-4 pb-3 flex-row gap-2">
    {onSaveForLater && (
      <Pressable onPress={onSaveForLater} className="flex-1 border border-blue-600 rounded-lg py-2 px-3 flex-row items-center justify-center">
        <Save size={16} color="#0284c7" />
        <Text className="ml-2 text-blue-600 text-sm">Save</Text>
      </Pressable>
    )}

    {onUseForm && (
      <Pressable onPress={onUseForm} className="flex-1 border border-gray-400 rounded-lg py-2 px-3 flex-row items-center justify-center">
        <FileText size={16} color="#6b7280" />
        <Text className="ml-2 text-gray-600 text-sm">Form</Text>
      </Pressable>
    )}

    {onExit && (
      <Pressable onPress={onExit} className="border border-gray-400 rounded-lg py-2 px-3 flex-row items-center justify-center">
        <LogOut size={16} color="#6b7280" />
        <Text className="ml-2 text-gray-600 text-sm">Exit</Text>
      </Pressable>
    )}
  </View>
)}
```

4. **Connected handlers in parent** (lines 341-343 in `sailor-onboarding-chat.tsx`):
```typescript
<ChatOnboardingInterface
  messages={messages}
  isLoading={isLoading}
  onSendMessage={sendMessage}
  onDetectLocation={handleDetectLocation}
  onSaveForLater={handleSaveForLater}      // ← NEW
  onUseForm={handleTraditionalForm}         // ← NEW
  onExit={handleSkipOnboarding}             // ← NEW
/>
```

## User Experience

### Before:
- ❌ Three-dot menu hidden or not visible
- ❌ No clear way to exit or save progress
- ❌ Users stuck in conversation with no escape

### After:
- ✅ **Three visible buttons** below input field
- ✅ **Always accessible** when conversation is active
- ✅ **Clear icons and labels**:
  - 💾 **Save** - Save progress and exit
  - 📝 **Form** - Switch to traditional form
  - 🚪 **Exit** - Skip onboarding entirely

## Button Behavior

### Save Button
- Saves last 10 messages for context
- Saves collected profile data
- Updates `onboarding_step` to "in_progress"
- Navigates to dashboard
- Shows "Resume Onboarding?" prompt on return

### Form Button
- Navigates to `/sailor-onboarding-form`
- Traditional form with all fields
- Direct Supabase saves (no AI)
- GPS venue detection

### Exit Button
- Shows confirmation dialog
- Marks `onboarding_completed = true`
- Navigates to dashboard
- Can complete profile later from Settings

## Visual Design

**Button Row Layout:**
```
┌─────────────────────────────────────────┐
│  [💾 Save]  [📝 Form]  [🚪 Exit]        │
└─────────────────────────────────────────┘
```

**Styling:**
- Save button: Blue border + blue text (primary action)
- Form/Exit buttons: Gray border + gray text (secondary actions)
- Icons: 16px size
- Text: Small (14px equivalent)
- Spacing: Evenly distributed with flex-1

## Files Modified

1. **src/components/onboarding/ChatOnboardingInterface.tsx**
   - Added action button props
   - Added button UI below input field
   - Added Save, FileText, LogOut icons

2. **src/app/(auth)/sailor-onboarding-chat.tsx**
   - Connected handler functions to chat interface
   - Removed reliance on header menu

## Testing Checklist

- [x] Buttons appear when conversation starts (messages.length > 0)
- [x] Buttons hidden before conversation starts
- [ ] Save button saves progress and navigates to dashboard
- [ ] Form button navigates to traditional form
- [ ] Exit button shows confirmation and marks onboarding complete
- [ ] Buttons are accessible and tappable on mobile
- [ ] Button layout works on desktop and tablet

---

**Status:** ✅ Implemented
**Ready for Testing:** Yes
**Priority:** HIGH - Critical for user experience
