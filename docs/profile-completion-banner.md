# Profile Completion Banner

## Problem
Users who skip onboarding or have incomplete profiles end up on an empty dashboard with no clear way to complete their setup.

## Solution
Added a prominent **Profile Completion Banner** on the dashboard that appears when the user has no boats (indicating incomplete profile).

## Implementation

### File Modified
`src/app/(tabs)/dashboard.tsx` (lines 294-319)

### Visual Design

**Banner Appearance:**
```
┌─────────────────────────────────────────────┐
│ ⚠️  Complete Your Profile                   │
│                                              │
│ Set up your sailing profile to unlock       │
│ personalized race tracking, performance     │
│ analytics, and AI-powered insights.         │
│                                              │
│ ┌──────────────────┐  ┌──────────────────┐ │
│ │ AI Setup         │  │ Manual Form      │ │
│ │ (Recommended)    │  │                  │ │
│ └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────┘
```

### Styling
- **Background:** Blue gradient (`bg-blue-600`)
- **Position:** Below header, above main content
- **Spacing:** Margin top 16px, padding 16px
- **Icons:** AlertTriangle (24px, white)
- **Text:** White on blue, clear hierarchy

### Detection Logic
```typescript
{!loading && (!boats || boats.length === 0) && (
  // Show banner
)}
```

**Conditions:**
1. Dashboard data has loaded (not loading)
2. No boats exist in profile (primary indicator of incomplete setup)

### Button Actions

**AI Setup Button (Primary):**
- **Style:** White background, blue text
- **Action:** `router.push('/sailor-onboarding-chat')`
- **Label:** "AI Setup (Recommended)"
- **Purpose:** Start conversational AI onboarding

**Manual Form Button (Secondary):**
- **Style:** Blue background with white border, white text
- **Action:** `router.push('/sailor-onboarding-form')`
- **Label:** "Manual Form"
- **Purpose:** Traditional form-based onboarding

## User Flow

### Scenario 1: New User (First Login)
1. User logs in for first time
2. Completes persona selection (Sailor)
3. **Skips onboarding** or encounters error
4. Lands on empty dashboard
5. **Sees profile completion banner** ← NEW
6. Clicks "AI Setup (Recommended)"
7. Starts conversational onboarding

### Scenario 2: Returning User (Incomplete Profile)
1. User logged in previously but didn't complete profile
2. Dashboard loads with no boats data
3. **Banner appears automatically** ← NEW
4. User can choose AI or Manual form
5. Completes profile setup
6. Banner disappears (boats now exist)

### Scenario 3: Complete Profile
1. User has boats and profile data
2. Dashboard loads normally
3. **No banner shown** (boats exist)
4. Full dashboard experience available

## Benefits

### User Experience
- ✅ **Clear call-to-action** - No confusion about what to do next
- ✅ **Prominent placement** - Can't be missed at top of dashboard
- ✅ **Two options** - Users can choose their preferred method
- ✅ **Informative** - Explains benefits of completing profile
- ✅ **Non-intrusive** - Doesn't block dashboard access

### Technical
- ✅ **Simple detection** - Uses existing `boats` array
- ✅ **No extra queries** - Leverages existing dashboard data
- ✅ **Automatic hiding** - Disappears when profile complete
- ✅ **Accessible** - Clear text hierarchy and touch targets

## Edge Cases Handled

1. **Loading State:** Banner hidden while data loads (prevents flash)
2. **No Boats:** Primary trigger - most reliable indicator
3. **Multiple Refresh:** Banner persists until profile complete
4. **Navigation:** Proper routing to both onboarding options

## Alternative Approaches Considered

### 1. Modal Popup (Rejected)
- ❌ Too intrusive
- ❌ Forces immediate action
- ❌ Can't see dashboard state

### 2. Toast Notification (Rejected)
- ❌ Too subtle, easy to miss
- ❌ Temporary, disappears quickly
- ❌ No persistent reminder

### 3. Empty State Only (Rejected)
- ❌ Only shows when scrolling to empty sections
- ❌ Not immediately visible
- ❌ Less actionable

### 4. Settings Menu Item (Rejected)
- ❌ Hidden in menu
- ❌ Requires user to explore
- ❌ Not prominent enough

## Testing Checklist

- [x] Banner appears when boats array is empty
- [x] Banner hidden when boats exist
- [x] Banner hidden during loading state
- [x] AI Setup button navigates to chat onboarding
- [x] Manual Form button navigates to form onboarding
- [ ] Banner disappears after completing onboarding
- [ ] Banner accessible on mobile and desktop
- [ ] Touch targets meet accessibility standards (44x44px minimum)

## Future Enhancements

1. **Progress Indicator:** Show which fields are missing
2. **Dismissible:** Add "Remind me later" option
3. **Profile Score:** Display completion percentage
4. **Personalization:** Different messages based on user type
5. **Animation:** Slide-in effect on first appearance

---

**Status:** ✅ Implemented
**Priority:** HIGH - Critical for user retention
**Impact:** Reduces onboarding abandonment
