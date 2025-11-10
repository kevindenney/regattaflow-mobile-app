# Crew Tab "Add a boat class..." Fix

## Problem

The Crew tab was showing "Add a boat class..." even after boats were added, and the Crew panel in race views was empty. This happened because:

1. `SailorBoatService.createBoat()` only creates records in `sailor_boats`
2. The Crew tab uses `useSailorDashboardData()` which reads from `sailor_classes` (not `sailor_boats`)
3. Without a `sailor_classes` record, the tab thinks no classes are registered

## Root Cause

The app has two tables for managing boats/classes:

- **`sailor_boats`**: Individual boat records (hulls) with metadata like sail numbers, names, etc.
- **`sailor_classes`**: Class registration table that tracks which boat classes a sailor competes in

These tables were not being kept in sync. Adding a boat only updated `sailor_boats`, leaving `sailor_classes` empty.

## Solution

### Code Changes (services/SailorBoatService.ts)

Updated four methods to automatically sync `sailor_boats` ↔ `sailor_classes`:

#### 1. `createBoatDirect()` (lines 261-309)
- **What**: When creating a new boat
- **Action**: Automatically creates/updates the `sailor_classes` entry with boat metadata
- **Behavior**: Uses `upsert` to avoid duplicates if class already registered

#### 2. `updateBoatDirect()` (lines 340-380)
- **What**: When updating boat details
- **Action**: Syncs changes to `boat_name`, `sail_number`, and `is_primary` to `sailor_classes`
- **Behavior**: Only updates if these specific fields changed

#### 3. `setPrimaryBoat()` (lines 434-456)
- **What**: When marking a boat as primary
- **Action**: Updates the `is_primary` flag in both tables
- **Behavior**: Ensures primary status is consistent across tables

#### 4. `deleteBoatDirect()` (lines 482-533)
- **What**: When deleting a boat
- **Action**: If it's the last boat in that class, removes the `sailor_classes` entry
- **Behavior**: Keeps the class registration if other boats exist in that class

### Migration Files

Created two migration approaches:

#### SQL Migration
**File**: `supabase/migrations/20251109150000_sync_sailor_boats_to_classes.sql`

```sql
-- Automatically syncs existing boats to sailor_classes
INSERT INTO sailor_classes (sailor_id, class_id, is_primary, boat_name, sail_number)
SELECT DISTINCT ON (sb.sailor_id, sb.class_id)
  sb.sailor_id, sb.class_id, ...
FROM sailor_boats sb
WHERE NOT EXISTS (...)
```

**To apply**:
```bash
npx supabase db push
```

#### JavaScript Migration
**File**: `scripts/sync-sailor-boats-to-classes.mjs`

More verbose with progress reporting. To run:

```bash
node scripts/sync-sailor-boats-to-classes.mjs
```

## How It Works Now

### Adding a Boat (New Flow)

1. User adds boat via "Add Boat" screen
2. `SailorBoatService.createBoat()` is called
3. ✅ Creates `sailor_boats` record
4. ✅ **NEW**: Creates `sailor_classes` record with boat metadata
5. Result: Crew tab immediately shows the new class

### Viewing Crew Tab

1. `useSailorDashboardData()` reads from `sailor_classes`
2. Finds classes → renders crew management UI
3. Each class can have crew members assigned
4. Race Crew panel shows same data (scoped to race's class)

### Crew Panel in Race View

Located in `CrewEquipmentCard` component:
- Loads via `crewManagementService.getCrewForClass(classId)`
- "Manage" button opens Crew tab with class context
- Now works because `sailor_classes` is populated

## Testing the Fix

### For Existing Data

1. Run the migration:
   ```bash
   npx supabase db push
   ```

2. Restart the app

3. Navigate to Crew tab → Should show your boat classes

### For New Boats

1. Go to "Add Boat" screen
2. Fill in details and select a class
3. Save the boat
4. Check Crew tab → Class should appear immediately
5. Check race view → Crew panel should work

## Database Schema Reference

### sailor_classes Table

| Column | Type | Description |
|--------|------|-------------|
| `sailor_id` | uuid | Foreign key to users/sailors |
| `class_id` | uuid | Foreign key to boat_classes |
| `is_primary` | boolean | Whether this is the sailor's primary class |
| `boat_name` | text | Name of the boat (from sailor_boats) |
| `sail_number` | text | Sail number (from sailor_boats) |
| `joined_at` | timestamp | When the class was registered |

**Primary Key**: `(sailor_id, class_id)`

### Data Flow

```
User adds boat
     ↓
sailor_boats table ← SailorBoatService.createBoatDirect()
     ↓
sailor_classes table ← (NEW) Auto-sync in createBoatDirect()
     ↓
useSailorDashboardData() ← Reads sailor_classes
     ↓
Crew tab shows classes ✓
```

## Files Changed

1. **services/SailorBoatService.ts** (lines 261-533)
   - Added automatic syncing in create/update/delete/setPrimary methods

2. **supabase/migrations/20251109150000_sync_sailor_boats_to_classes.sql**
   - SQL migration to fix existing data

3. **scripts/sync-sailor-boats-to-classes.mjs**
   - JavaScript migration script with progress reporting

## Future Considerations

### Database Triggers (Optional Enhancement)

Instead of application-level syncing, could use PostgreSQL triggers:

```sql
CREATE OR REPLACE FUNCTION sync_sailor_boats_to_classes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update sailor_classes when boat is added/updated
  INSERT INTO sailor_classes (sailor_id, class_id, is_primary, boat_name, sail_number)
  VALUES (NEW.sailor_id, NEW.class_id, NEW.is_primary, NEW.name, NEW.sail_number)
  ON CONFLICT (sailor_id, class_id) DO UPDATE
  SET boat_name = EXCLUDED.boat_name,
      sail_number = EXCLUDED.sail_number,
      is_primary = EXCLUDED.is_primary;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_boats_to_classes_trigger
AFTER INSERT OR UPDATE ON sailor_boats
FOR EACH ROW EXECUTE FUNCTION sync_sailor_boats_to_classes();
```

**Pros**: Automatic, database-level consistency
**Cons**: Harder to debug, requires DB migration management

Current approach (application-level) is preferred for now as it's more explicit and easier to trace.

## Related Files & Components

- **Crew Tab**: `app/(tabs)/crew.tsx` (lines 116-124 show the warning)
- **Dashboard Data Hook**: `hooks/useSailorDashboardData.ts` (lines 191-246)
- **Crew Management**: `crewManagementService.getCrewForClass()`
- **Race Crew Card**: `components/race-detail/CrewEquipmentCard.tsx`
- **Race View Integration**: `app/(tabs)/races.tsx` (lines 640-679, 4378-4390)

## Summary

✅ **Fixed**: Boat creation now automatically registers classes
✅ **Fixed**: Crew tab shows classes when boats exist
✅ **Fixed**: Race Crew panel displays assigned crew
✅ **Backward Compatible**: Migration available for existing data
✅ **Maintainable**: All sync logic centralized in SailorBoatService
