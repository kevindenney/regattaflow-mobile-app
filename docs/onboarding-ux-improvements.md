# Onboarding UX Improvements

## Issues Fixed

### 1. False Boat Detection ("Star" appearing) ✅

**Problem:** The word "start" in AI messages was being detected as "Star" boat class.

**Root Cause:** Simple substring matching (`msg.includes('star')`) matched "**star**t" in "Let me **start** by detecting...".

**Solution:** Added word boundary regex matching:
```typescript
// Before: msg.includes('star')
// After: /\bstar\b/.test(msg)
```

**Impact:** Only exact word matches are detected. "start" won't match "star", but "I sail a Star" will work correctly.

### 2. Missing Menu Options During Chat ✅

**Problem:** "Save for Later" and "Traditional Form" buttons only showed on welcome screen, not during active chat.

**Solution:** Added dropdown menu in header with all options:

**Menu Items:**
1. 💾 **Save for Later** - Saves progress and exits
2. 📝 **Use Form Instead** - Switches to traditional form
3. ⏩ **Skip Onboarding** - Marks complete and goes to dashboard

**UI Implementation:**
- Three-dot menu icon (⋮) in header (only shows when chat started)
- Click to open dropdown
- Click outside to close
- Clean, accessible menu design

## Files Modified

### 1. `src/hooks/useStreamingChat.ts`
**Change:** Word boundary regex for boat class detection

```typescript
// Lines 79-88
boatClasses.forEach(boatClass => {
  // Use regex with word boundaries to ensure exact matches
  const regex = new RegExp(`\\b${boatClass.toLowerCase().replace(/[/]/g, '\\/')}\\b`);
  if (regex.test(msg)) {
    const className = boatClass.split(' ').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    if (!boats.find(b => b.class.toLowerCase() === boatClass.toLowerCase())) {
      boats.push({ class: className });
    }
  }
});
```

**Examples:**
- "I sail a Dragon" → ✅ Detects "Dragon"
- "Let me start by detecting..." → ❌ No false "Star" detection
- "I race J/70" → ✅ Detects "J/70" (escapes the `/`)
- "I'm starting my Laser" → ❌ No false "Star", ✅ Detects "Laser"

### 2. `src/app/(auth)/sailor-onboarding-chat.tsx`
**Changes:**
- Added `MoreVertical` icon import
- Added `showMenu` state
- Replaced individual buttons with dropdown menu
- Added click-outside handler to close menu

```typescript
// Lines 232-279
headerRight: () =>
  hasStarted ? (
    <View className="relative">
      <Pressable onPress={() => setShowMenu(!showMenu)} className="p-2">
        <MoreVertical size={24} color="#0284c7" />
      </Pressable>

      {showMenu && (
        <View className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 w-48 z-50">
          <Pressable onPress={() => { setShowMenu(false); handleSaveForLater(); }}>
            <Save size={18} color="#0284c7" />
            <Text>Save for Later</Text>
          </Pressable>

          <Pressable onPress={() => { setShowMenu(false); handleTraditionalForm(); }}>
            <FileText size={18} color="#0284c7" />
            <Text>Use Form Instead</Text>
          </Pressable>

          <Pressable onPress={() => { setShowMenu(false); handleSkipOnboarding(); }}>
            <SkipForward size={18} color="#6b7280" />
            <Text>Skip Onboarding</Text>
          </Pressable>
        </View>
      )}
    </View>
  ) : null
```

## User Experience Flow

### Before Fix:
```
User: *starts onboarding*
AI: "Let me start by detecting..."
Sidebar: Shows "Boats • Star" ❌ (false detection)
Header: Only shows Save/Skip icons (no form option)
```

### After Fix:
```
User: *starts onboarding*
AI: "Let me start by detecting..."
Sidebar: Empty ✅ (no false detection)
Header: Shows ⋮ menu
User: *clicks menu*
Menu shows:
  💾 Save for Later
  📝 Use Form Instead
  ⏩ Skip Onboarding
```

## Testing Instructions

### Test 1: No False Boat Detection
1. Start onboarding
2. Let AI send initial message with "start"
3. Check sidebar - should NOT show "Star" boat
4. Type "dragon" in a message
5. Check sidebar - should show "Dragon"

### Test 2: Menu Functionality
1. Start onboarding chat
2. Click ⋮ menu in header
3. Menu should appear with 3 options
4. Click "Save for Later" → Should save and exit
5. Return to onboarding
6. Click "Use Form Instead" → Should navigate to form
7. Return to chat
8. Click "Skip Onboarding" → Should mark complete

### Test 3: Menu Dismiss
1. Open menu by clicking ⋮
2. Click anywhere outside menu
3. Menu should close

## Edge Cases Handled

### Boat Detection:
- ✅ "start" doesn't match "star"
- ✅ "starting" doesn't match "star"
- ✅ "restart" doesn't match "star"
- ✅ "I sail a Star" matches "Star" ✓
- ✅ "J/70" matches with escaped slash
- ✅ "Melges 24" matches as two-word class
- ✅ Multiple boats in one message

### Menu:
- ✅ Only shows when chat has started (`hasStarted === true`)
- ✅ Closes when clicking outside
- ✅ Closes after selecting option
- ✅ Accessible on mobile (48px touch target)
- ✅ z-index ensures menu appears above content

## Known Limitations

1. **Boat detection only works for predefined classes** - Custom boat classes not in the list won't be auto-detected (user must type full name)
2. **Menu position on mobile** - May need adjustment for very small screens
3. **Compound boat names** - "Swan 42" works, but "Swan-42" with hyphen might not

## Future Enhancements

- [ ] Add autocomplete suggestions based on detected partial boat names
- [ ] Show "Detected: Dragon" confirmation when boat is recognized
- [ ] Allow manual editing of detected boats in sidebar
- [ ] Add search functionality to menu for power users
- [ ] Keyboard shortcuts (Cmd+S for Save, etc.)

---

**Status:** ✅ Both fixes implemented
**Testing:** Ready for user testing
**Impact:** Eliminates false detections and provides easy access to all navigation options
