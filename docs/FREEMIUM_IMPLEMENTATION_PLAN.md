# RegattaFlow Freemium Implementation Plan

> **Goal:** Dawn Patrol-style freemium experience where users land on /races tab without signup, explore with demo races, and can add ONE race for free.

## Progress Tracker

### Phase 1: Guest Mode Architecture ✅ COMPLETE
- [x] **1.1** Add `isGuest` state to `providers/AuthProvider.tsx`
- [x] **1.2** Create `services/GuestStorageService.ts`
  - [x] `getGuestRace()` method
  - [x] `saveGuestRace()` method
  - [x] `clearGuestData()` method
  - [x] `hasGuestRace()` method
  - [x] `migrateToAccount()` method

### Phase 2: Routing Changes ✅ COMPLETE
- [x] **2.1** Modify `app/(auth)/_layout.tsx` to allow races tab for guests
- [x] **2.2** Update `app/(tabs)/_layout.tsx` for limited guest tabs
- [x] **2.3** Add "Sign Up" button in header for guests
- [x] **2.4** Auto-enter guest mode on landing (`app/index.tsx`) - Dawn Patrol-style

### Phase 3: Demo Races with Full Data ✅ COMPLETE
- [x] **3.1** Create `lib/demo/demoRaceData.ts`
  - [x] Upcoming demo race (Four Peaks Race - ~3 days ahead)
    - [x] Pre-race metadata (venue, class, course)
    - [x] Weather forecast data
    - [x] Tide data
    - [x] Strategy brief
    - [x] Checklist progress
  - [x] Past demo race (Rolex Fastnet Race - ~7 days ago)
    - [x] Race metadata
    - [x] Historical weather
    - [x] Race results
    - [x] AI analysis (full)
    - [x] Session/track data
    - [x] Completed checklist
- [x] **3.2** Create `services/DemoRaceService.ts`
  - [x] `getDemoRaces()` method
  - [x] `adjustDates()` helper
  - [x] `getDemoRaceById()` method
  - [x] `isDemoRace()` helper

### Phase 4: Races Tab Guest Experience ✅ COMPLETE
- [x] **4.1** Create `hooks/useGuestRaces.ts` for guest mode
  - [x] Combine demo races + guest race
  - [x] Sort by date
- [x] **4.2** Modify `hooks/useAddRace.ts` for guest handling
  - [x] Check `hasGuestRace()` before adding
  - [x] Show signup prompt for 2nd race
  - [x] Save to local storage for guests

### Phase 5: Paywall Triggers ✅ COMPLETE
- [x] **5.1** Create `components/auth/SignupPromptModal.tsx`
  - [x] "Create Free Account" CTA
  - [x] Benefits list
  - [x] "Continue as Guest" option
  - [x] Sign in link
- [x] **5.2** Add paywall gates
  - [x] Gate 2nd race behind signup

### Phase 6: Account Migration ✅ COMPLETE
- [x] **6.1** Update `app/(auth)/callback.tsx` for migration
- [x] **6.2** Implement migration in `GuestStorageService.ts`
- [x] **6.3** Clear guest data after migration

### Phase 7: Onboarding Tips
- [ ] **7.1** Create `components/onboarding/GuestOnboardingTooltips.tsx`
- [ ] **7.2** Implement first launch detection
- [ ] **7.3** Add contextual tips
  - [ ] "Add your first race" tip
  - [ ] "Sign up for AI analysis" tip
  - [ ] "Sync across devices" tip

---

## Files Reference

### Files Modified ✅
| File | Status | Notes |
|------|--------|-------|
| `providers/AuthProvider.tsx` | ✅ Done | Added `isGuest` state, `enterGuestMode()` |
| `app/(auth)/_layout.tsx` | ✅ Done | Allow races tab for guests |
| `app/(tabs)/_layout.tsx` | ✅ Done | Limited tabs for guests (Races only) |
| `hooks/useAddRace.ts` | ✅ Done | Guest race saving, paywall trigger |
| `app/(auth)/callback.tsx` | ✅ Done | Migration on OAuth signup |
| `app/(tabs)/races.tsx` | ✅ Done | Uses guest races when isGuest |
| `app/index.tsx` | ✅ Done | Auto-enter guest mode (Dawn Patrol-style) |

### Files Created ✅
| File | Status | Notes |
|------|--------|-------|
| `lib/demo/demoRaceData.ts` | ✅ Done | Two demo races with full data |
| `services/DemoRaceService.ts` | ✅ Done | Demo race service with date adjustment |
| `services/GuestStorageService.ts` | ✅ Done | Guest storage + migration |
| `components/auth/SignupPromptModal.tsx` | ✅ Done | Beautiful signup prompt |
| `hooks/useGuestRaces.ts` | ✅ Done | Combines demo + guest races |
| `components/onboarding/GuestOnboardingTooltips.tsx` | ⬜ Not Started | Onboarding tips (Phase 7) |

---

## Demo Race Data Requirements

### Upcoming Demo Race (Cowes Week Day 3)
```
Race Type: Fleet (J/70)
Date: 3 days from now @ 10:30
Venue: Cowes, Isle of Wight (50.7604, -1.2986)
Course: Windward-leeward, 3 laps
Fleet Size: 24 boats

Weather: SW 14kts, gusts 18, partly cloudy
Tide: High 08:45, Low 15:20, range 3.2m

Strategy: Favor right side, pin end start
Tactical: Current pushes right upwind, expect 15° right shift

Checklist: 8/12 days-before complete
```

### Past Demo Race (Round the Island)
```
Race Type: Distance (IRC Class 3)
Date: 7 days ago @ 06:00
Distance: 50nm circumnavigation
Route: Start → Bembridge → St. Catherine's → The Needles → Finish

Results: 8th of 42 boats
Elapsed: 6:34:22 | Corrected: 5:12:45
Max Speed: 14.2 kts | Avg: 7.9 kts

AI Analysis Score: 78/100
Highlights:
- Excellent start execution
- Good tactical decision at St. Catherine's
- Strong downwind VMG

Improvements:
- Lost positions on beat to Bembridge
- More aggressive at The Needles transition

Performance vs Fleet:
- Beat: Top 25%
- Reach: Top 15%
- Run: Top 10%
```

---

## Feature Matrix

| Feature | Guest | Free Account | Pro |
|---------|-------|--------------|-----|
| Demo races | ✅ 2 | ✅ 2 | - |
| Add races | ✅ 1 (local) | ✅ Unlimited | ✅ Unlimited |
| Weather | ✅ Basic | ✅ Full | ✅ Enhanced |
| AI Analysis | 📋 Demo only | ❌ | ✅ |
| Cloud Sync | ❌ | ✅ | ✅ |
| Multi-device | ❌ | ✅ | ✅ |

---

## Testing Checklist

### Guest Mode
- [x] Fresh install lands on /races tab (auto-enter guest mode)
- [x] Demo races visible (upcoming + past)
- [x] Can browse demo race details
- [x] Can view AI analysis on past demo
- [x] Can add ONE race
- [x] Paywall shown on 2nd race attempt

### Account Migration
- [x] Guest race migrates on signup
- [ ] Success toast shown
- [x] Guest data cleared after migration
- [ ] Migrated race visible in account (needs verification)

### Web Experience
- [x] Web lands on /races tab (not landing page)
- [x] Demo races work on web
- [x] Guest race storage works on web (AsyncStorage)

---

## Notes

### Implementation Notes

**January 14, 2026 - Dawn Patrol Auto-Guest Mode**
- Modified `app/index.tsx` to automatically enter guest mode for first-time visitors
- Users now land directly on `/races` tab without seeing the landing page
- Landing page can still be accessed via `?view=landing` query parameter
- Skeleton is shown during auth loading to prevent flash of content

**January 13-14, 2026 - Core Implementation**
- Created full demo race data with Four Peaks Race (upcoming) and Rolex Fastnet (past)
- Demo races include weather, tide, strategy, and AI analysis data
- GuestStorageService handles local storage and migration
- SignupPromptModal provides beautiful paywall experience
- Migration happens automatically on OAuth callback

### Remaining Work
- Phase 7: Onboarding tooltips (nice-to-have)
- Success toast after migration
- Verify migrated race appears correctly in account

---

**Last Updated:** January 14, 2026
