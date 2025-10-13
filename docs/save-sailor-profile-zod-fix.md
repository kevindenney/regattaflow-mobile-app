# Save Sailor Profile - Zod Validation Fix

## Problem

The `save_sailor_profile` tool was failing with Zod validation errors:

```
Tool save_sailor_profile failed: ZodError: [
  {
    "expected": "object",
    "code": "invalid_type",
    "path": ["profile_data", "boats", 0],
    "message": "Invalid input: expected object, received string"
  }
]
```

**Root Cause:** The AI was passing `boats` as a string or incorrectly formatted data instead of an array of objects.

## Solution

### 1. Added Explicit Format Instructions to System Prompt

**File:** `src/services/agents/ConversationalOnboardingAgent.ts` (lines 167-186)

Added a complete example showing the exact format expected by `save_sailor_profile`:

```typescript
SAVE_SAILOR_PROFILE FORMAT EXAMPLE:
{
  "sailor_id": "user-id-here",
  "profile_data": {
    "role": "owner",
    "primary_venue_id": "venue-id",
    "primary_boat_class": "Dragon",
    "boats": [                              // ← MUST be an ARRAY
      {
        "class_id": "boat-class-id",       // ← MUST be string
        "sail_number": "D59",               // ← Optional string
        "is_owner": true,                   // ← MUST be boolean
        "is_primary": true                  // ← MUST be boolean
      }
    ],
    "clubs": ["club-id-1", "club-id-2"],   // ← MUST be array of strings
    "fleets": ["fleet-id-1"],               // ← MUST be array of strings
    "class_associations": ["association-id"]
  }
}
```

### 2. Added Explicit Validation Rules

**File:** `src/services/agents/ConversationalOnboardingAgent.ts` (lines 196-199)

```typescript
CRITICAL RULES:
- **IMPORTANT**: When calling save_sailor_profile, boats MUST be an ARRAY of OBJECTS, not a string or single object
- **IMPORTANT**: Each boat object MUST have: class_id (string), is_owner (boolean), is_primary (boolean), sail_number (optional string)
- **IMPORTANT**: clubs and fleets MUST be ARRAYS of strings (IDs), not single strings
- Track all boat_class IDs, club IDs, and fleet IDs from tool responses to use in save_sailor_profile
```

## Expected Tool Schema

From `EnhancedOnboardingTools.ts` (lines 194-210):

```typescript
input_schema: z.object({
  sailor_id: z.string().describe('User ID'),
  profile_data: z.object({
    role: z.enum(['owner', 'crew', 'both']).describe('Owner or crew role'),
    primary_venue_id: z.string().optional(),
    primary_boat_class: z.string().optional(),
    boats: z.array(z.object({
      class_id: z.string(),
      sail_number: z.string().optional(),
      is_owner: z.boolean(),
      is_primary: z.boolean(),
    })).optional(),
    clubs: z.array(z.string()).optional(),
    fleets: z.array(z.string()).optional(),
    class_associations: z.array(z.string()).optional(),
  }),
})
```

## Correct vs Incorrect Examples

### ❌ Incorrect (What was happening):
```json
{
  "sailor_id": "user-id",
  "profile_data": {
    "role": "owner",
    "boats": "Dragon",           // ← WRONG: string instead of array
    "clubs": "club-id-1",        // ← WRONG: string instead of array
    "fleets": 0                  // ← WRONG: number instead of array
  }
}
```

### ✅ Correct (What should happen):
```json
{
  "sailor_id": "eba4ca77-9a1d-4a85-835c-1d972ba4c3fc",
  "profile_data": {
    "role": "owner",
    "primary_venue_id": "hong-kong-victoria-harbor",
    "primary_boat_class": "Dragon",
    "boats": [
      {
        "class_id": "dragon-class-id",
        "sail_number": "D59",
        "is_owner": true,
        "is_primary": true
      }
    ],
    "clubs": ["rhkyc-id"],
    "fleets": ["dragon-fleet-id"]
  }
}
```

## Data Flow

### 1. Tool Calls Store IDs

When AI calls tools like `find_yacht_clubs_at_venue`, it receives:
```json
{
  "success": true,
  "clubs": [
    { "id": "rhkyc-id", "name": "RHKYC" },
    { "id": "abc-id", "name": "Aberdeen Boat Club" }
  ]
}
```

### 2. AI Must Track IDs

The AI should store:
- `boat_class.id` from `find_fleets_by_boat_class` response
- `club.id` from user's club selection
- `fleet.id` from user's fleet selection

### 3. AI Constructs Save Call

Using tracked IDs:
```json
{
  "sailor_id": "user-uuid",
  "profile_data": {
    "boats": [
      {
        "class_id": "tracked-boat-class-id",  // ← From tool response
        "sail_number": "D59",                  // ← From user input
        "is_owner": true,                      // ← From role question
        "is_primary": true                     // ← First boat = primary
      }
    ],
    "clubs": ["tracked-club-id"],              // ← From tool response
    "fleets": ["tracked-fleet-id"]             // ← From tool response
  }
}
```

## Testing After Fix

### Test Conversation Flow:
1. Start onboarding
2. Detect venue
3. Select club
4. Enter boat class
5. Enter boat name and sail number
6. Confirm role (owner/crew)
7. **AI should call `save_sailor_profile` with correct format**
8. Check console for successful save:
   ```
   💾 Saving sailor profile: { sailor_id: '...', profile_data: {...} }
   ✅ Marked onboarding complete
   ✅ Saved sailor profile
   ✅ Saved boats
   ✅ Saved clubs
   ✅ Saved fleets
   ```

### Verify in Supabase:

```sql
-- Check users table
SELECT onboarding_completed FROM users WHERE id = 'user-id';
-- Should return: true

-- Check sailor_boats table
SELECT * FROM sailor_boats WHERE sailor_id = 'user-id';
-- Should return: Row with class_id, sail_number, is_owner, is_primary

-- Check club_members table
SELECT * FROM club_members WHERE sailor_id = 'user-id';
-- Should return: Rows for each club

-- Check fleet_members table
SELECT * FROM fleet_members WHERE sailor_id = 'user-id';
-- Should return: Rows for each fleet
```

## Files Modified

1. **src/services/agents/ConversationalOnboardingAgent.ts**
   - Added `SAVE_SAILOR_PROFILE FORMAT EXAMPLE` (lines 167-186)
   - Added explicit validation rules (lines 196-199)

## Impact

- ✅ AI will now correctly format `save_sailor_profile` calls
- ✅ Onboarding will successfully persist data to Supabase
- ✅ Users can complete onboarding without Zod validation errors
- ✅ Dashboard will show saved profile data after onboarding

---

**Status:** ✅ Fixed
**Testing Required:** Yes (requires Anthropic API credits)
**Priority:** HIGH - Blocks onboarding completion
