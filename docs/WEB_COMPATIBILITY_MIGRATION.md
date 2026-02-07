# Web Compatibility Migration Checklist

This document tracks the migration from `Alert.alert()` to `crossPlatformAlert` utility functions.

## Migration Statistics

| Metric | Count |
|--------|-------|
| **Total files with Alert.alert** | ~250 |
| **Total Alert.alert usages** | ~1,200 |
| **Files migrated (Tier 1 + Tier 2)** | 8 |
| **Usages migrated** | ~87 |

---

## Priority Tiers

### Tier 1: Critical - Authentication Flows ✅ COMPLETED

These files are in the core authentication path and affect all users.

| File | Alerts | Status |
|------|--------|--------|
| `components/account/AccountModalContent.tsx` | 5 | ✅ Done |
| `app/onboarding/auth-choice-new.tsx` | 2 | ✅ Done |
| `app/(auth)/signup.tsx` | 3 | ✅ Already platform-gated |

---

### Tier 2: High Priority - Core User Flows

These files handle primary user interactions that most users encounter regularly.

#### Race Management (Most Users)

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(tabs)/races.tsx` | 15 | Main races tab | ✅ Done |
| `app/(tabs)/race/[id].tsx` | 19 | Race detail view | ✅ Done |
| `components/races/edit/EditRaceForm.tsx` | 15 | Edit race | ✅ Done |
| `app/(tabs)/race/add-tufte.tsx` | 12 | Add race | ⬜ Pending |
| `components/races/ComprehensiveRaceEntry.tsx` | 40 | Race entry | ⬜ Pending |
| `app/(tabs)/race/timer.tsx` | 9 | Race timer | ⬜ Pending |
| `hooks/useRaceDocuments.ts` | 21 | Race documents | ⬜ Pending |

#### Boat Management

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(tabs)/boat/edit/[id].tsx` | 13 | Edit boat | ✅ Done |
| `app/(tabs)/boat/add.tsx` | 8 | Add boat | ⬜ Pending |
| `components/boats/QuickAddBoatForm.tsx` | 7 | Quick add boat | ⬜ Pending |

#### Settings & Profile

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(tabs)/settings.tsx` | 16 | Main settings | ✅ Done |
| `app/settings/change-password.tsx` | 10 | Change password | ⬜ Pending |
| `app/settings/notifications.tsx` | 4 | Notifications | ⬜ Pending |
| `app/settings/delete-account.tsx` | 5 | Delete account | ⬜ Pending |

#### Subscription & Payments

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `components/subscription/SubscriptionManager.tsx` | 14 | Subscription UI | ⬜ Pending |
| `components/subscription/TeamInviteSheet.tsx` | 10 | Team invites | ⬜ Pending |
| `app/subscription.tsx` | 4 | Subscription page | ⬜ Pending |

**Tier 2 Total: ~217 alerts across 17 files**

---

### Tier 3: Medium Priority - Secondary Features

Features used frequently but not on critical paths.

#### Venue & Location

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `components/venue/post/PostComposer.tsx` | 3 | Venue posts | ⬜ Pending |
| `components/venue/AddVenueModal.tsx` | 4 | Add venue | ⬜ Pending |
| `components/venue/AddRacingAreaSheet.tsx` | 4 | Racing areas | ⬜ Pending |
| `components/venue/DiscussionComposer.tsx` | 3 | Discussions | ⬜ Pending |

#### Crew & Social

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `components/crew/CrewThreadChat.tsx` | 3 | Crew chat | ⬜ Pending |
| `components/crew/tabs/RosterTab.tsx` | 14 | Crew roster | ⬜ Pending |
| `components/crew/AddMemberModal.tsx` | 3 | Add member | ⬜ Pending |
| `components/sailor/CrewManagement.tsx` | 15 | Crew mgmt | ⬜ Pending |
| `components/follow/ActivityCommentSection.tsx` | 3 | Activity comments | ⬜ Pending |

#### Learning & Academy

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(tabs)/learn/[courseId]/index.tsx` | 15 | Course detail | ⬜ Pending |
| `app/(tabs)/learn/[courseId]/player.tsx` | 5 | Course player | ⬜ Pending |
| `app/(tabs)/learn.tsx` | 5 | Learn tab | ⬜ Pending |

#### Reflection & Analysis

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(tabs)/reflect.tsx` | 28 | Reflect tab | ⬜ Pending |
| `app/review.tsx` | 8 | Race review | ⬜ Pending |
| `components/races/PostRaceAnalysisSection.tsx` | 4 | Analysis | ⬜ Pending |

**Tier 3 Total: ~131 alerts across 15 files**

---

### Tier 4: Lower Priority - Admin & Club Features

Features primarily used by club administrators and race officers.

#### Club Management

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(tabs)/clubs.tsx` | 22 | Clubs tab | ⬜ Pending |
| `app/club/event/[id]/entries.tsx` | 21 | Event entries | ⬜ Pending |
| `app/club/event/[id]/documents.tsx` | 12 | Event docs | ⬜ Pending |
| `app/club/event/[id]/index.tsx` | 10 | Event detail | ⬜ Pending |
| `app/club/scoring/[regattaId].tsx` | 11 | Scoring | ⬜ Pending |
| `app/club/starts/[scheduleId].tsx` | 14 | Start times | ⬜ Pending |
| `app/club/check-in/[raceId].tsx` | 10 | Check-in | ⬜ Pending |
| `app/club/handicap/[regattaId].tsx` | 9 | Handicaps | ⬜ Pending |
| `app/club/safety/[regattaId].tsx` | 8 | Safety | ⬜ Pending |
| `app/club/log/[regattaId].tsx` | 8 | Race log | ⬜ Pending |
| `app/club/results/entry.tsx` | 7 | Results entry | ⬜ Pending |
| `app/club/protests/hearing/[hearingId].tsx` | 8 | Protests | ⬜ Pending |

#### Race Management (Admin)

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(tabs)/race-management.tsx` | 18 | Race mgmt | ⬜ Pending |
| `app/race-committee/console.tsx` | 8 | RC console | ⬜ Pending |
| `app/(tabs)/members.tsx` | 8 | Members | ⬜ Pending |
| `app/(tabs)/fleets.tsx` | 7 | Fleets | ⬜ Pending |

#### Club Onboarding

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(auth)/club-onboarding-website-verification.tsx` | 12 | Website verify | ⬜ Pending |
| `app/(auth)/club-onboarding-payment.tsx` | 9 | Payment setup | ⬜ Pending |
| `app/(auth)/club-onboarding/step-3-contact.tsx` | 8 | Contact info | ⬜ Pending |
| `components/onboarding/EnhancedClubOnboarding.tsx` | 7 | Club onboard | ⬜ Pending |

**Tier 4 Total: ~227 alerts across 20 files**

---

### Tier 5: Lowest Priority - Developer & Niche Features

Features used rarely or primarily by developers.

#### Coaching Features

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `components/coaching/StrategySharingModal.tsx` | 18 | Strategy share | ⬜ Pending |
| `components/coach/CoachDashboard.tsx` | 6 | Coach dashboard | ⬜ Pending |
| `components/coach/SessionManagement.tsx` | 5 | Sessions | ⬜ Pending |
| `components/coach/CoachProfile.tsx` | 5 | Coach profile | ⬜ Pending |

#### AI Features

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `components/ai/StrategyChatInterface.tsx` | 5 | AI chat | ⬜ Pending |
| `components/ai/VoiceNoteRecorder.tsx` | 4 | Voice notes | ⬜ Pending |
| `components/races/AIValidationScreen.tsx` | 4 | AI validation | ⬜ Pending |

#### Developer/Debug

| File | Alerts | Impact | Status |
|------|--------|--------|--------|
| `app/(auth)/dev-login.tsx` | 5 | Dev login | ⬜ Pending |
| `components/developer/DeveloperDocumentUploader.tsx` | 4 | Dev upload | ⬜ Pending |

**Tier 5 Total: ~56 alerts across 9 files**

---

## Migration Progress Summary

| Tier | Files | Alerts | Status |
|------|-------|--------|--------|
| **Tier 1** | 3 | 10 | ✅ Complete |
| **Tier 2** | 17 | ~217 | 🔄 5/17 Done (~78 alerts) |
| **Tier 3** | 15 | ~131 | ⬜ Pending |
| **Tier 4** | 20 | ~227 | ⬜ Pending |
| **Tier 5** | 9 | ~56 | ⬜ Pending |
| **Other** | ~186 | ~558 | ⬜ Pending |
| **Total** | ~250 | ~1,199 | ~7% Complete |

---

## Top 10 Files by Alert Count

Priority should be given to these high-usage files:

| Rank | File | Alerts | Status |
|------|------|--------|--------|
| 1 | `components/races/ComprehensiveRaceEntry.tsx` | 40 | ⬜ Pending |
| 2 | `app/(tabs)/reflect.tsx` | 28 | ⬜ Pending |
| 3 | `app/(tabs)/clubs.tsx` | 22 | ⬜ Pending |
| 4 | `hooks/useRaceDocuments.ts` | 21 | ⬜ Pending |
| 5 | `app/club/event/[id]/entries.tsx` | 21 | ⬜ Pending |
| 6 | `app/(tabs)/race/[id].tsx` | 19 | ✅ Done |
| 7 | `components/coaching/StrategySharingModal.tsx` | 18 | ⬜ Pending |
| 8 | `app/(tabs)/race-management.tsx` | 18 | ⬜ Pending |
| 9 | `app/(tabs)/settings.tsx` | 16 | ✅ Done |
| 10 | `components/sailor/CrewManagement.tsx` | 15 | ⬜ Pending |

---

## How to Migrate a File

1. **Find Alert.alert usages:**
   ```bash
   grep -n "Alert\.alert" path/to/file.tsx
   ```

2. **Add import:**
   ```typescript
   import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
   ```

3. **Convert each usage** (see [WEB_COMPATIBILITY.md](./WEB_COMPATIBILITY.md) for examples)

4. **Remove unused Alert import:**
   ```typescript
   // Remove Alert from this import if no longer used
   import { View, Text, Alert } from 'react-native';
   ```

5. **Test on web and native**

6. **Update this file** - Mark as ✅ Done

---

## Quick Commands

```bash
# Find all Alert.alert usages in a file
grep -n "Alert\.alert" path/to/file.tsx

# Count Alert.alert in a directory
grep -r "Alert\.alert" --include="*.tsx" -c | sort -t: -k2 -nr

# Find files that import Alert but don't use crossPlatformAlert
grep -l "import.*Alert.*from 'react-native'" --include="*.tsx" -r | \
  xargs grep -L "crossPlatformAlert"
```

---

## See Also

- [WEB_COMPATIBILITY.md](./WEB_COMPATIBILITY.md) - API documentation and examples
