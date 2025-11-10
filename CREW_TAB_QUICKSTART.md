# Crew Tab - Quick Start Guide

## What Was Fixed

The Crew tab was showing **"Add a boat class..."** even when boats existed. This is now fixed!

## The Fix

When you add a boat, the app now automatically:
1. Creates the boat in `sailor_boats` ✓
2. **NEW**: Registers the class in `sailor_classes` ✓
3. Makes the Crew tab work immediately ✓

## How to Use

### For Existing Users (One-Time Setup)

Your existing boats have been migrated! Just **restart the app** and:
- ✅ Crew tab will show your boat classes
- ✅ You can start adding crew members
- ✅ Race Crew panels will work

### For New Boats

1. **Add a boat** (as you normally would)
2. **That's it!** The class is automatically registered
3. Check the **Crew tab** → your class will be there
4. Start **adding crew members**

## Crew Management Flow

### Adding Crew to a Class

1. Go to **Crew tab**
2. You'll see your boat classes (e.g., "Dragon", "Etchells")
3. Tap **"Invite Crew"** or **"Add Crew Member"**
4. Fill in crew details
5. Crew member is now assigned to that class

### Managing Crew for a Race

**Option 1: From Race View**
1. Open a race details page
2. Scroll to **"Crew & Equipment"** card
3. Tap **"Manage"** button
4. This opens the Crew tab filtered to that race's class

**Option 2: From Crew Tab**
1. Go to **Crew tab**
2. Select the boat class
3. Crew assignments apply to all races in that class

## Files Reference

### Where the fix lives:
- **Main code**: `services/SailorBoatService.ts` (lines 261-533)
- **Migration**: `scripts/sync-sailor-boats-to-classes.mjs`
- **Full docs**: `CREW_TAB_FIX_SUMMARY.md`

### Components that use this:
- **Crew tab**: `app/(tabs)/crew.tsx`
- **Dashboard data**: `hooks/useSailorDashboardData.ts`
- **Race crew card**: `components/race-detail/CrewEquipmentCard.tsx`

## Troubleshooting

### Still seeing "Add a boat class..."?

1. **Check you have boats**:
   - Go to Settings → Boats
   - Verify at least one boat exists

2. **Restart the app** (hard refresh if on web)

3. **Run migration manually** (if needed):
   ```bash
   node scripts/sync-sailor-boats-to-classes.mjs
   ```

### Crew not showing in race view?

1. **Verify the race has a class assigned**
   - Edit race → check "Boat Class" field

2. **Check crew is assigned to that class**
   - Go to Crew tab → verify crew exists for that class

3. **Ensure race class matches crew class**
   - Race must be in the same class as your assigned crew

## Technical Details

The app uses two tables:

- **`sailor_boats`**: Your actual boats (hulls, sail numbers, etc.)
- **`sailor_classes`**: Which classes you compete in

These are now **automatically synced** when you:
- ✅ Add a boat
- ✅ Update a boat
- ✅ Delete a boat
- ✅ Change primary boat

## Migration Results

From the migration that just ran:
```
📊 Found 10 boats in sailor_boats table
📊 Found 6 existing entries in sailor_classes
✅ Successfully inserted 6 new sailor_classes entries
📊 Final count: 12 entries in sailor_classes
```

All your boats are now properly registered! 🎉
