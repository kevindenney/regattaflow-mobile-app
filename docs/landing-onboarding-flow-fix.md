# Landing Page to Onboarding Flow Fix

## Problem
When clicking "Get Started Free" on the landing page, authenticated users were being sent directly to `/dashboard` without checking if they had completed onboarding. This caused:
- Dashboard showing loading skeletons indefinitely
- No user data displayed
- Poor user experience for new signups

## Root Cause
In `src/components/landing/HeroPhones.tsx`, the "Get Started Free" button had hardcoded routing logic:

```tsx
<Link href={user ? '/(tabs)/dashboard' : '/(auth)/signup'} asChild>
```

This bypassed the onboarding check logic that exists in:
- `src/app/index.tsx` (landing page)
- `src/app/(tabs)/dashboard.tsx` (dashboard redirect)
- `src/lib/utils/userTypeRouting.ts` (routing utilities)

## Solution

### Updated `HeroPhones.tsx`

**Added proper routing utilities:**
```tsx
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/src/lib/utils/userTypeRouting';
```

**Added userProfile to auth hook:**
```tsx
const { user, userProfile } = useAuth();
```

**Fixed handleGetStarted function:**
```tsx
const handleGetStarted = () => {
  if (user && userProfile) {
    // Check if onboarding is needed
    if (shouldCompleteOnboarding(userProfile)) {
      router.push(getOnboardingRoute());
    } else {
      router.push(getDashboardRoute(userProfile.user_type));
    }
  } else {
    router.push('/(auth)/signup');
  }
};
```

**Updated button to use function:**
```tsx
<TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
  <Text style={styles.primaryButtonText}>Get Started Free</Text>
  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
</TouchableOpacity>
```

## User Flow (Fixed)

### New User:
1. Click "Get Started Free"
2. → `/signup` (create account)
3. → `/persona-selection` (choose sailor/coach/club)
4. → Appropriate onboarding route:
   - Sailor: `/(auth)/sailor-onboarding-chat`
   - Coach: `/(auth)/coach-onboarding`
   - Club: `/(auth)/club-onboarding-chat`
5. → Dashboard (after onboarding complete)

### Existing User (Incomplete Onboarding):
1. Click "Get Started Free"
2. → Appropriate onboarding route (based on user_type)
3. → Dashboard (after completion)

### Existing User (Complete Profile):
1. Click "Get Started Free"
2. → Dashboard (direct access)

## Testing Checklist

- [x] Unauthenticated user → Goes to signup
- [ ] New signup without persona → Goes to persona selection
- [ ] User with persona, no onboarding → Goes to onboarding
- [ ] User with complete onboarding → Goes to dashboard
- [ ] Dashboard properly redirects incomplete users back to onboarding

## Related Files

### Modified:
- `src/components/landing/HeroPhones.tsx` - Fixed button routing logic

### Referenced (Already Working):
- `src/app/index.tsx` - Landing page onboarding redirect
- `src/app/(tabs)/dashboard.tsx` - Dashboard onboarding check
- `src/lib/utils/userTypeRouting.ts` - Routing utility functions
- `src/providers/AuthProvider.tsx` - Auth state and userProfile

## Notes
- The dashboard already has robust onboarding checking (lines 83-117)
- The index.tsx landing page also has proper redirect logic (lines 18-31)
- The issue was only in the HeroPhones component bypassing these checks
- This fix aligns all entry points to use the same routing logic
