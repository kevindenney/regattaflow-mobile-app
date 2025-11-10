# Fleet Race Prep Dashboard Feature

## Overview

The Fleet Race Prep section provides a centralized view of upcoming races and recent race results for fleet members, enabling better pre-race coordination and post-race knowledge sharing.

## Implementation Summary

### Key Components

**Location:** `app/(tabs)/fleet/index.tsx`

#### 1. Derived Data (Lines 107-135)

Pre-computed values cached with `useMemo` to prevent unnecessary re-renders:

```typescript
// Set of fleet IDs the user has joined (for filtering suggestions)
const membershipFleetIds = useMemo(() =>
  new Set(fleets.map(item => item.fleet.id)), [fleets]
);

// Next upcoming race sorted by start time
const nextSharedRace = useMemo(() => {
  if (!sharedRaces.length) return null;
  const sorted = [...sharedRaces].sort((a, b) => {
    const aTime = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
  return sorted[0] ?? null;
}, [sharedRaces]);

// Live countdown label (e.g., "2d 5h", "45m")
const nextRaceCountdown = useMemo(
  () => (nextSharedRace?.startTime ? formatRaceCountdown(nextSharedRace.startTime) : null),
  [nextSharedRace?.startTime]
);

// Latest 3 race_result posts
const recentResultPosts = useMemo(
  () => posts.filter(post => post.postType === 'race_result').slice(0, 3),
  [posts]
);
```

#### 2. Race Prep Section UI (Lines 514-534)

```tsx
<DashboardSection
  title="Race Prep"
  subtitle="Upcoming starts and latest results for this fleet"
  showBorder={false}
>
  <View style={styles.racePrepGrid}>
    <NextRaceCard
      fleetName={summaryFleet?.name}
      race={nextSharedRace}
      countdown={nextRaceCountdown}
      loading={sharedContentLoading}
      onOpenSchedule={handleOpenRaces}
      onShareUpdate={() => setShowPostComposer(true)}
    />
    <ResultsColumn
      posts={recentResultPosts}
      loading={postsLoading}
      onShareResult={handleShareResult}
    />
  </View>
</DashboardSection>
```

#### 3. NextRaceCard Component (Lines 992-1072)

Displays the next upcoming race with contextual states:

**Loading State:**
```tsx
<View style={styles.nextRaceCard}>
  <Text style={styles.placeholderText}>Loading next start…</Text>
</View>
```

**Empty State (no races):**
```tsx
<View style={styles.nextRaceCard}>
  <Text style={styles.nextRaceTitle}>No races on the board</Text>
  <Text style={styles.nextRaceMeta}>
    {fleetName
      ? `Share the next start for ${fleetName} so your crew can prep together.`
      : 'Share your next start so the fleet can prep together.'}
  </Text>
  <View style={styles.nextRaceActions}>
    <TouchableOpacity style={styles.summaryAction} onPress={onShareUpdate}>
      <MaterialCommunityIcons name="flag-plus" size={18} color="#2563EB" />
      <Text style={styles.summaryActionText}>Share update</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.nextRacePrimary} onPress={onOpenSchedule}>
      <Text style={styles.nextRacePrimaryText}>Open races</Text>
    </TouchableOpacity>
  </View>
</View>
```

**Populated State:**
- Dark theme card (#0F172A background)
- Race name, datetime, venue
- Countdown pill with timer icon (yellow #FACC15 background)
- Action buttons: "Post briefing" and "View schedule"

#### 4. ResultsColumn Component (Lines 1074-1106)

Displays recent race_result posts:

**Features:**
- Header with "Share result" CTA button
- Empty state: "No race recaps yet. Post finishes or lessons learned after the next start."
- List of `ResultPostCard` components (up to 3)

#### 5. ResultPostCard Component (Lines 1108-1130)

Individual result post display:

```tsx
<View style={styles.resultCard}>
  <View style={styles.resultCardHeader}>
    <MaterialCommunityIcons name="trophy" size={18} color="#F97316" />
    <Text style={styles.resultAuthor}>{post.author?.name ?? 'Fleet member'}</Text>
    <Text style={styles.resultDate}>{formatRelativeDate(post.createdAt)}</Text>
  </View>
  {post.content && (
    <Text style={styles.resultContent} numberOfLines={3}>
      {post.content}
    </Text>
  )}
  {post.metadata?.finish_position && (
    <View style={styles.resultMetaRow}>
      <InfoPill
        icon="medal"
        text={`Finish: ${post.metadata.finish_position}/${post.metadata.fleet_size ?? '—'}`}
        highlight
      />
    </View>
  )}
</View>
```

### Helper Functions (Lines 1142-1188)

**formatRaceDateTime(iso: string)**
- Converts ISO timestamp to "Fri, Dec 6, 2:30 PM" format
- Handles null/invalid dates gracefully

**formatRaceCountdown(iso: string)**
- Calculates time remaining from now until race start
- Returns format: "Xd Yh" for days/hours or "Xh Ym" for hours/minutes
- Returns "In progress" if race has started
- Returns null for invalid timestamps

**formatRelativeDate(iso: string)**
- Formats as "Dec 6" for post timestamps
- Used in result post headers

### Contextual Empty States (Lines 292-298, 545-582)

All placeholder messages now reference the fleet name for better context:

```typescript
const racesEmptyMessage = summaryFleet?.name
  ? `No upcoming races shared for ${summaryFleet.name} yet. Add race days from the Races tab.`
  : 'No upcoming races shared yet. Add race days from the Races tab.';

const coursesEmptyMessage = summaryFleet?.name
  ? `No favorite courses saved for ${summaryFleet.name}. Save one from the Course Library to surface it here.`
  : 'No shared courses yet. Save a course from the Course Library to surface it here.';
```

Shared Resources section also references fleet name in empty state (lines 547-551).

### Styling (Lines 1504-1658)

**`.racePrepGrid`** - Responsive flex layout with gap
**`.nextRaceCard`** - Dark theme card with specific dimensions
**`.nextRaceCountdownPill`** - Yellow highlight pill (#FACC15)
**`.resultsColumn`** - Light background card
**`.resultCard`** - Individual result post styling

## Data Requirements

### Database Tables

1. **fleet_posts** - Stores race result posts
   - `post_type: 'race_result'`
   - `metadata.finish_position` - Placement in race
   - `metadata.fleet_size` - Total boats
   - `metadata.race_name` - Race identifier
   - `metadata.conditions` - Weather/wind description

2. **races** - Stores upcoming race events
   - `name` - Race title
   - `start_time` - ISO timestamp
   - `venue_name` - Location name
   - `racing_area_name` - Course area
   - `race_series` - Series/regatta name

3. **fleet_members** - Links users to fleets
   - Required for RLS policies on posts/races

### Hooks Used

- `useFleetSharedContent()` - Fetches shared races and courses
- `useFleetPosts()` - Fetches fleet posts including race_result type
- `useUserFleets()` - Gets user's fleet memberships

## Seed Scripts

### Created Files

1. **scripts/seed-fleet-race-prep.mjs**
   - Automated seed script (requires schema access)
   - Adds demo users to fleet
   - Creates 4 upcoming races (2, 3, 6, 9 days out)
   - Creates 4 race_result posts (2, 5, 7, 10 days ago)

2. **scripts/apply-fleet-race-prep-seed.mjs**
   - Fallback script with individual inserts
   - Handles RLS and schema cache issues

3. **supabase/migrations/20251109000000_seed_fleet_race_prep_data.sql**
   - SQL migration for direct database seeding
   - Uses PL/pgSQL for robust insertion

## Testing Checklist

### Manual Testing

- [ ] **Empty State - No Fleets**
  - Navigate to Fleet tab with no fleet memberships
  - Verify hero banner shows "Join fleets to unlock shared planning"
  - Verify CTAs: "Find Fleets" and "Create Fleet"

- [ ] **Empty State - No Upcoming Races**
  - Join a fleet with no shared races
  - Verify NextRaceCard shows "No races on the board"
  - Verify CTAs: "Share update" and "Open races"

- [ ] **Empty State - No Results**
  - Verify ResultsColumn shows "No race recaps yet"
  - Verify "Share result" button is visible

- [ ] **Populated State - Next Race**
  - Add a race with `start_time` in the future
  - Verify race name, datetime, and venue display correctly
  - Verify countdown updates (note: currently static, not live-updating)
  - Verify "Post briefing" and "View schedule" buttons work

- [ ] **Populated State - Results**
  - Create 1-3 `race_result` posts via Fleet composer
  - Verify posts display with author, date, and content
  - Verify finish position pill displays when `metadata.finish_position` exists
  - Verify only 3 most recent results show

- [ ] **Responsive Layout**
  - Test on mobile (narrow viewport)
  - Test on tablet (medium viewport)
  - Verify cards wrap appropriately in `racePrepGrid`

### Automated Testing (Future)

```typescript
// Example Jest test structure
describe('FleetRacePrepSection', () => {
  it('shows loading state while fetching races', () => {});
  it('shows empty state when no races exist', () => {});
  it('displays next race with countdown', () => {});
  it('limits results to 3 most recent posts', () => {});
  it('formats countdown correctly for various time ranges', () => {});
});
```

## Integration Points

### Current Hooks

The section relies on these hooks returning data:

```typescript
const { races: sharedRaces, loading: sharedContentLoading } =
  useFleetSharedContent({ clubId, classId });

const { posts, loading: postsLoading } =
  useFleetPosts(fleetId, { limit: 10 });
```

### Future Enhancements

1. **Deep Linking**
   - "View schedule" should navigate to specific race detail: `router.push(`/race/${nextSharedRace.id}`)`
   - Currently routes to generic `/(tabs)/races`

2. **Live Countdown**
   - Add `useInterval` to update countdown every minute
   - Or use React Native `setInterval` in `useEffect`

3. **Race Attendance RSVP**
   - Add "Going" / "Maybe" / "Can't make it" buttons
   - Display attendee count: "12 sailors confirmed"

4. **Result Interactions**
   - Like/comment on race_result posts
   - Expand to full post detail on tap

5. **Race Reminders**
   - Push notifications 24h, 1h before start
   - In-app bell icon for race day alerts

## File References

### Primary Implementation
- **app/(tabs)/fleet/index.tsx:107-135** - Derived data with useMemo
- **app/(tabs)/fleet/index.tsx:514-534** - Race Prep section render
- **app/(tabs)/fleet/index.tsx:992-1072** - NextRaceCard component
- **app/(tabs)/fleet/index.tsx:1074-1106** - ResultsColumn component
- **app/(tabs)/fleet/index.tsx:1108-1130** - ResultPostCard component
- **app/(tabs)/fleet/index.tsx:1142-1188** - Helper functions
- **app/(tabs)/fleet/index.tsx:1504-1658** - Styles

### Supporting Files
- **services/fleetService.ts** - FleetRaceSummary type definition
- **services/FleetSocialService.ts** - FleetPost type and race_result handling
- **hooks/useFleetSharedContent.ts** - Hook for fetching shared races
- **hooks/useFleetPosts.ts** - Hook for fetching fleet posts

### Seed Scripts
- **scripts/seed-fleet-race-prep.mjs**
- **scripts/apply-fleet-race-prep-seed.mjs**
- **supabase/migrations/20251109000000_seed_fleet_race_prep_data.sql**

## Notes

- All empty states are contextual and reference the fleet name when available
- Countdown calculation is client-side and does not auto-update (static after render)
- Race results are filtered by `post_type === 'race_result'` and sliced to 3 items
- Dark theme for NextRaceCard provides visual contrast with light ResultsColumn
- Uses existing `DashboardSection` component for consistent layout patterns
- No automated tests yet - ready for Jest/React Native Testing Library implementation

## Development Server

The web development server is running at:
- **URL:** http://localhost:8081
- **Status:** ✅ Active
- **Command:** `npm run web` (running in background)

Access the Fleet dashboard at `/fleet` route to see the Race Prep section live.
