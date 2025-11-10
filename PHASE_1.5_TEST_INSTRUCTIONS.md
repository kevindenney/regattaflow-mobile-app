# Phase 1.5 Component Testing Instructions

**Status:** Ready for Manual Testing
**Date:** 2025-11-03

---

## Test Page Created

**File:** `app/test-sections.tsx`
**Route:** `/test-sections`

This page provides a comprehensive test of the CollapsibleSection component before full integration into races.tsx.

---

## How to Access

1. **Ensure Dev Server is Running:**
   - Port 8081 should be active
   - If not, run: `npx expo start --web`

2. **Open the Test Page:**
   - Navigate to: `http://localhost:8081/test-sections`
   - Or from the app, manually navigate to the `/test-sections` route

---

## What to Test

### 1. Expand/Collapse Functionality ✓
- **Test:** Tap on each section header
- **Expected:** Section content smoothly expands/collapses
- **Expected:** Chevron icon rotates from right-pointing to down-pointing
- **Expected:** Animation is smooth (200ms duration)

### 2. Default States ✓
- **Priority 1-2:** Always visible (no section wrapper)
- **Priority 3 (Conditions):** Expanded by default
- **Priority 4 (Course & Strategy):** Expanded by default
- **Priority 5 (Boat Setup):** Collapsed by default
- **Priority 6 (Team & Logistics):** Collapsed by default
- **Priority 7 (Regulatory):** Collapsed by default
- **Priority 8 (Post-Race):** Collapsed by default

### 3. Badge Variants ✓
Check badge colors are correct:
- **Info Badge (blue):** Conditions section - "3 plans"
- **Default Badge (gray):** Team & Logistics - "15 items"
- **Warning Badge (yellow):** Regulatory - "2/5 ack'd"
- **Success Badge (green):** Post-Race - "Available"

### 4. State Persistence ✓
- **Test:** Expand/collapse several sections
- **Test:** Close the app completely
- **Test:** Reopen the app and navigate back to `/test-sections`
- **Expected:** Sections remember their expanded/collapsed state
- **Storage Key:** `@regattaflow:section:{id}`

### 5. Force-Expanded Section ✓
- **Test:** Try to collapse the "Force-Expanded Section" at the bottom
- **Expected:** Header tap does nothing (cannot collapse)
- **Expected:** This simulates post-race completion behavior

### 6. Icons ✓
Verify each section has the correct icon:
- 🌬️ Conditions: Wind icon (blue)
- 🗺️ Course: Map icon (green)
- ⚙️ Boat Setup: Settings icon (purple)
- 👥 Team: Users icon (orange)
- 📋 Regulatory: FileText icon (indigo)
- 🏆 Post-Race: Trophy icon (red)

### 7. Content Rendering ✓
- **Expected:** All mock cards render within sections
- **Expected:** No visual glitches or overlapping content
- **Expected:** Proper spacing between sections (12px margin-bottom)
- **Expected:** Content has proper padding within sections

### 8. Accessibility ✓
If you have a screen reader:
- **Test:** Enable VoiceOver (iOS) or TalkBack (Android)
- **Expected:** Section headers announce as buttons
- **Expected:** Expanded state is announced
- **Expected:** Hint says "Expand to show" or "Collapse to hide"

---

## Test Results

### Visual Tests
- [ ] All sections render correctly
- [ ] Expand/collapse animations smooth
- [ ] Badge colors correct
- [ ] Icons display properly
- [ ] Spacing and padding look good
- [ ] No visual glitches

### Functional Tests
- [ ] Sections expand when tapped
- [ ] Sections collapse when tapped again
- [ ] Default states correct (3-4 expanded, 5-8 collapsed)
- [ ] State persists across app restarts
- [ ] Force-expanded section cannot be collapsed

### Performance Tests
- [ ] No lag when expanding/collapsing
- [ ] Smooth scrolling with sections
- [ ] App doesn't crash with many sections

---

## Known Limitations

1. **Test Page Only:** This is a demonstration page with mock data
2. **No Real Integration:** Not yet integrated into races.tsx
3. **Static Content:** Badges and counts are hardcoded for testing

---

## Next Steps After Testing

Once testing confirms components work correctly:

1. ✅ Components verified functional
2. 📝 Integration into races.tsx
3. 🧪 Full regression testing
4. 🚀 Production deployment

---

## Troubleshooting

### Section Won't Expand
- **Issue:** Tapping header does nothing
- **Check:** Is `forceExpanded` set to a value?
- **Check:** Look for console errors

### State Not Persisting
- **Issue:** Sections reset on app restart
- **Check:** AsyncStorage permissions
- **Check:** Storage keys in logs

### Animation Glitchy
- **Issue:** Expand/collapse looks janky
- **Platform:** Android may need `UIManager.setLayoutAnimationEnabledExperimental(true)`
- **Check:** LayoutAnimation configuration

---

## Build Status

✅ **TypeScript:** No compilation errors
✅ **Metro:** Bundled successfully
✅ **Components:** CollapsibleSection.tsx (230 lines)
✅ **Components:** PlanModeContent.tsx (120 lines)
✅ **Test Page:** test-sections.tsx (400 lines)

---

## Screenshots/Videos

*To be added after manual testing*

---

**Testing completed by:** _________________
**Date:** _________________
**Status:** _________________
