# Onboarding: Save for Later & Traditional Form

## Features Added

### 1. Save for Later ✅

Allows users to pause AI chat onboarding and resume later.

**How it works:**
1. User clicks "Save for Later" icon in header
2. System saves:
   - Last 10 conversation messages (for context)
   - Collected data (venue, role, boats, clubs, fleets)
   - Context (venue ID, club IDs, fleet IDs)
   - Timestamp
3. User redirected to dashboard
4. When returning to onboarding, prompt to resume or start fresh

**Implementation:**

```typescript
// Save progress to users.onboarding_progress (JSONB column)
const progressData = {
  messages: messages.slice(-10),
  collectedData: {
    venue: "Hong Kong - Victoria Harbor",
    role: "Owner",
    boats: [{ class: "Dragon", sailNumber: "123" }],
    clubs: ["club-id"],
    fleets: ["fleet-id"]
  },
  context: {
    venue: "Hong Kong - Victoria Harbor",
    venueId: "venue-id",
    clubs: ["club-id"],
    fleets: ["fleet-id"]
  },
  savedAt: "2025-01-20T10:30:00Z"
};

await supabase
  .from('users')
  .update({
    onboarding_step: 'in_progress',
    onboarding_progress: progressData
  })
  .eq('id', user.id);
```

**Resume Flow:**

When user returns:
```
Alert: "Resume Onboarding?"
"You have saved progress from Jan 20, 2025. Continue where you left off?"

[Start Fresh] [Resume]
```

- **Start Fresh**: Clears `onboarding_progress`, starts new conversation
- **Resume**: Loads saved `collectedData` into sidebar (full message restoration TODO)

### 2. Traditional Form Alternative ✅

Provides a traditional form-based onboarding for users who prefer not to use AI chat.

**Route:** `/sailor-onboarding-form`

**Features:**
- ✅ GPS-based venue detection (auto-loads nearby venues)
- ✅ Venue selection dropdown
- ✅ Dynamic club loading (based on selected venue)
- ✅ Role selection (Owner / Crew / Both)
- ✅ Multi-boat entry (add/remove boats)
- ✅ Sail number fields (optional)
- ✅ Dynamic fleet loading (based on boat class)
- ✅ Multi-select clubs and fleets
- ✅ Direct Supabase saves (bypasses AI)

**Form Fields:**

1. **Home Sailing Venue*** (required)
   - Auto-populated with GPS-nearby venues
   - Fallback: All venues alphabetically
   - Shows: Venue name, City, Country

2. **Yacht Clubs** (optional, multi-select)
   - Dynamically loaded when venue selected
   - Checkbox selection

3. **I am a...*** (required)
   - Owner / Crew / Both
   - Button selection

4. **Boats*** (required, dynamic)
   - Boat class text input
   - Sail number text input (optional)
   - "Add Another Boat" button
   - "Remove" button for each boat

5. **Racing Fleets** (optional, multi-select)
   - Dynamically loaded when boat class entered
   - Shows fleet name + associated club
   - Checkbox selection

**Submit Flow:**

```typescript
1. Validation:
   - Venue selected ✓
   - At least one boat ✓

2. Save to Supabase:
   - Mark onboarding_completed = true
   - Save boats → sailor_boats table
   - Save clubs → club_members table
   - Save fleets → fleet_members table
   - Save venue → saved_venues table

3. Redirect to dashboard
```

**Data Saved:**

```sql
-- Users table
UPDATE users
SET onboarding_completed = true
WHERE id = 'user-id';

-- Sailor boats
INSERT INTO sailor_boats (sailor_id, class_id, sail_number, role)
VALUES ('user-id', 'dragon-class-id', '123', 'owner');

-- Club members
INSERT INTO club_members (sailor_id, club_id, membership_type)
VALUES ('user-id', 'rhkyc-id', 'member');

-- Fleet members
INSERT INTO fleet_members (sailor_id, fleet_id)
VALUES ('user-id', 'dragon-fleet-id');

-- Saved venues
INSERT INTO saved_venues (sailor_id, venue_id)
VALUES ('user-id', 'victoria-harbor-id');
```

## User Flow Comparison

### AI Chat Onboarding
```
1. GPS detection
2. AI asks: "Which yacht club?"
3. AI asks: "What boat class?"
4. AI asks: "Owner or crew?"
5. AI asks: "Sail number?"
6. AI asks: "Equipment makers?"
7. AI asks: "Coaches?"
8. AI asks: "Crew members?"
9. AI asks: "Save profile?"
10. ✅ Saved → Dashboard
```

**Pros:**
- Conversational, guided
- Can ask follow-up questions
- Intelligent suggestions
- Searches internet for sail numbers

**Cons:**
- Slower for experienced users
- Requires reading/responding to AI

### Traditional Form Onboarding
```
1. GPS detection
2. Select venue from list
3. Check clubs
4. Select role
5. Enter boats + sail numbers
6. Check fleets
7. Click "Complete Setup"
8. ✅ Saved → Dashboard
```

**Pros:**
- Fast for experienced users
- See all fields at once
- Direct data entry
- No reading AI responses

**Cons:**
- Less guidance
- No intelligent suggestions
- Must know what to enter

## Navigation Between Methods

**From Chat → Form:**
```
Welcome screen → "Traditional Form" button → Form screen
Chat screen → Alert → "Traditional form entry will be available soon!"
```

**From Form → Chat:**
```
Form screen → "Back to AI Chat" link → Chat screen
```

## Database Schema Requirements

### Users Table (existing)
```sql
-- Add JSONB column for saving progress
ALTER TABLE users
ADD COLUMN onboarding_progress JSONB DEFAULT NULL;

-- Existing columns used:
-- onboarding_completed BOOLEAN
-- onboarding_step TEXT
```

### Supporting Tables (already exist)
- `sailor_boats` - Boats owned/crewed
- `club_members` - Yacht club memberships
- `fleet_members` - Racing fleet memberships
- `saved_venues` - Preferred sailing venues
- `boat_classes` - Boat class definitions
- `yacht_clubs` - Yacht club definitions
- `fleets` - Racing fleet definitions

## Files Created/Modified

### Created:
- ✅ `src/app/(auth)/sailor-onboarding-form.tsx` - Traditional form screen

### Modified:
- ✅ `src/app/(auth)/sailor-onboarding-chat.tsx`:
  - Enhanced "Save for Later" with progress saving
  - Added "Resume Onboarding" prompt
  - Connected "Traditional Form" button to route

## Testing Instructions

### Test Save for Later:
1. Start onboarding chat
2. Answer 2-3 questions (venue, club, boat)
3. Click Save icon in header
4. Confirm "Save & Exit"
5. Navigate back to `/sailor-onboarding-chat`
6. Should see "Resume Onboarding?" alert
7. Click "Resume" → Should show collected data in sidebar
8. Click "Start Fresh" → Should clear progress

### Test Traditional Form:
1. Navigate to `/sailor-onboarding-chat`
2. Click "Traditional Form" button on welcome screen
3. Should navigate to form screen
4. Select venue → Clubs should load
5. Enter boat class → Fleets should load
6. Fill all fields
7. Click "Complete Setup"
8. Should redirect to dashboard
9. Check Supabase:
   - `users.onboarding_completed = true`
   - `sailor_boats` has entries
   - `club_members` has entries
   - `fleet_members` has entries

## Known Limitations

1. **Resume Onboarding**: Currently only restores `collectedData` to sidebar, not full conversation history
2. **Form boat classes**: Requires manual text entry (no autocomplete yet)
3. **Form validation**: Basic validation only (venue + boats required)
4. **Venue search**: Form doesn't have search/filter for large venue lists

## Future Enhancements

### Save for Later:
- [ ] Full conversation restoration (not just sidebar data)
- [ ] Multiple save points
- [ ] Progress percentage indicator
- [ ] "Continue from dashboard" button

### Traditional Form:
- [ ] Boat class autocomplete/dropdown
- [ ] Venue search/filter
- [ ] "Import from sailing resume" feature
- [ ] Bulk sail number import
- [ ] Equipment makers fields
- [ ] Coaches/crew fields
- [ ] Racing areas fields
- [ ] Form validation improvements

---

**Status:** ✅ Both features implemented and ready for testing
**Routes:**
- AI Chat: `/sailor-onboarding-chat`
- Form: `/sailor-onboarding-form`
