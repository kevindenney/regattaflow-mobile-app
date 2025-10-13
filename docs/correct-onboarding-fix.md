# Correct Onboarding File Fix

**Issue**:
1. Boats added during onboarding weren't appearing in the Boats tab
2. Wrong onboarding file was being used - `onboarding.tsx` instead of `onboarding-redesign.tsx`

**Date**: October 10, 2025

## Root Cause

The app was routing sailors to `onboarding.tsx`, which:
- **DOES NOT save boat data** - Has TODO comment instead of actual save logic
- **DOES NOT save race data** - Just navigates to dashboard without saving
- **Incomplete implementation** - Missing all database insert logic

The correct file `onboarding-redesign.tsx`:
- ✅ **DOES save boats** to `sailor_boats` table (line 53-72)
- ✅ **DOES save races** to `regattas` table (line 125-147)
- ✅ **DOES save racing calendar** CSV data (line 74-122)
- ✅ **Complete implementation** - Full database integration

## Changes Made

### 1. Updated Persona Selection
**File**: `src/app/(auth)/persona-selection.tsx`

**Before**:
```typescript
router.replace('/(auth)/onboarding');
```

**After**:
```typescript
router.replace('/(auth)/onboarding-redesign');
```

### 2. Updated Dashboard Onboarding Check
**File**: `src/app/(tabs)/dashboard.tsx`

**Before**:
```typescript
router.replace('/(auth)/onboarding');
```

**After**:
```typescript
router.replace('/(auth)/onboarding-redesign');
```

## What `onboarding-redesign.tsx` Does

### Boat Creation (Lines 52-72)
```typescript
await supabase
  .from('sailor_boats')
  .insert({
    sailor_id: user.id,
    boat_name: data.boatName || `My ${data.boatClass}`,
    boat_class_name: data.boatClass,
    sail_number: data.sailNumber || '',
    hull_manufacturer: data.hullMaker,
    sail_manufacturer: data.sailMaker,
    is_primary: true,
  });
```

### Next Race Creation (Lines 125-147)
```typescript
await supabase
  .from('regattas')
  .insert({
    name: data.nextRaceName,
    start_date: data.nextRaceDate,
    created_by: user.id,
    status: 'upcoming',
    metadata: {
      venue: data.nextRaceLocation || 'TBD',
      class_name: data.boatClass || 'TBD',
      start_time: data.nextRaceTime || '00:00',
      source: 'onboarding'
    }
  });
```

### Racing Calendar CSV Import (Lines 74-122)
Parses tab-separated calendar data and creates multiple race records.

## Result

Now when sailors complete onboarding:
- ✅ Boats are saved to `sailor_boats` table
- ✅ Next race is saved to `regattas` table
- ✅ Racing calendar is imported
- ✅ All data appears in respective tabs (Boats, Calendar, Dashboard)
- ✅ Database foreign keys properly linked to user

## Testing

1. Sign up as new user
2. Select "Sailor" persona
3. Fill in onboarding form:
   - Boat Class: Dragon
   - Sail Number: D123
   - Boat Name: Phoenix
4. Complete onboarding
5. Navigate to Boats tab
6. **Expected**: Boat "Phoenix" appears in list
7. **Previous behavior**: Empty "No boats yet" screen

---

**Status**: ✅ Complete

**Files Changed**:
- `src/app/(auth)/persona-selection.tsx`
- `src/app/(tabs)/dashboard.tsx`
