# Onboarding Routing Fix

**Issue**: Sailors were being routed to the complex conversational onboarding (`sailor-onboarding-chat.tsx`) instead of the simpler form-based onboarding.

**Date**: October 10, 2025

## Changes Made

### 1. Updated Persona Selection Routing
**File**: `src/app/(auth)/persona-selection.tsx`

**Before**:
```typescript
if (role === 'sailor') {
  router.replace('/(auth)/sailor-onboarding-chat');
}
```

**After**:
```typescript
if (role === 'sailor') {
  router.replace('/(auth)/onboarding');
}
```

### 2. Updated Dashboard Onboarding Check
**File**: `src/app/(tabs)/dashboard.tsx`

**Before**:
```typescript
if (userData.user_type === 'sailor') {
  router.replace('/(auth)/sailor-onboarding-chat');
}
```

**After**:
```typescript
if (userData.user_type === 'sailor') {
  router.replace('/(auth)/onboarding');
}
```

## Result

Now when users select "Sailor" as their persona, they will see the simpler form-based onboarding (`onboarding.tsx`) instead of the AI-powered conversational onboarding.

The form-based onboarding is:
- Simpler to use
- Faster to complete
- More straightforward for new users
- Doesn't require complex AI interactions
- Has clear form fields for boat details, clubs, and next race

## Testing

To test:
1. Navigate to http://localhost:8081/persona-selection
2. Click "⛵ Sailor"
3. Should see form-based onboarding with clear input fields
4. NOT the conversational "Hi! I'm your sailing assistant..." interface

---

**Status**: ✅ Complete
