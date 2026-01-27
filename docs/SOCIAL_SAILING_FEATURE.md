# Social Sailing Feature - Timeline-Based Discovery

> **Status**: ✅ Implemented (Feature Flag: `ENABLE_SOCIAL_TIMELINE`)
> **Created**: January 2026
> **Last Updated**: January 23, 2026

## Overview

This feature transforms RegattaFlow from a personal race management app into a **social sailing network** where sailors can:
- **Follow** other sailors to see their race timelines
- **Discover** similar sailors based on shared characteristics
- **Share** races by adding them to your own timeline
- **Subscribe** to fleets to follow all members at once

## Core Concepts

### Follow vs Crew
- **Follow** = Subscribe to another sailor's race timeline (one-way, like social media)
- **Crew** = People assigned to YOUR race who can edit/contribute (collaborative)

### Timeline
Each user has a race timeline - their chronological list of races. When you follow someone, you can swipe through their timeline to see what they're racing.

---

## Architecture

### Navigation Model (TikTok-style)

```
┌─────────────────────────────────────┐
│  ← KYLE DENNEY →                    │  ← User header with avatar
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │Race1│ │Race2│ │Race3│  →        │  ← Horizontal scroll (swipe L/R)
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  [●○○○○] 5 people you follow        │  ← Timeline indicator dots
└─────────────────────────────────────┘
           ↑ Swipe UP for next person
           ↓ Swipe DOWN for previous
```

**Navigation**:
- **Swipe LEFT/RIGHT** = Scrub through current person's races
- **Swipe UP** = Next followed user's timeline (full screen transition)
- **Swipe DOWN** = Previous user / back to your timeline
- **Your timeline is always index 0** (swipe down from anyone returns home)

### Data Flow

```
user_follows table
       │
       ▼
useFollowedTimelines hook
       │
       ├── myTimeline (current user's races)
       │
       └── followedTimelines[]
              │
              └── { user, races, isLoading }
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `TimelineFeed.tsx` | Gesture container, manages vertical swipe between timelines |
| `TimelineScreen.tsx` | Single timeline view with header and horizontal race cards |
| `useFollowedTimelines.ts` | Fetches followed users and their races |

---

## Database Schema

### Existing Tables Used
- `user_follows` - follower_id → following_id relationships
- `regattas` - Race data
- `profiles` - User info for headers
- `fleets` - Fleet groups with `is_public` column
- `fleet_members` - Fleet membership

### New Columns
```sql
-- Track copied races
ALTER TABLE regattas ADD COLUMN source_regatta_id UUID REFERENCES regattas(id);
ALTER TABLE regattas ADD COLUMN is_copy BOOLEAN DEFAULT false;
```

---

## Implementation Phases

### Phase 1: Multi-Timeline Navigation ✅
- Swipe-based navigation between timelines
- User header with avatar for each timeline
- Timeline indicator dots
- **Files**: `TimelineFeed.tsx`, `TimelineScreen.tsx`, `SocialTimelineView.tsx`
- **Hook**: `useFollowedTimelines.ts`

### Phase 2: Race Sharing ✅
- "Add to My Timeline" action on others' races
- "Request to Join" for crew collaboration
- Copy vs reference handling
- **Files**: `RaceShareActions.tsx`
- **Service Methods**: `copyRaceToTimeline()`, `requestToJoin()`, `approveJoinRequest()`
- **Migration**: `20260123200000_add_race_copy_columns.sql`

### Phase 3: Discovery Algorithm ✅
- Similarity scoring based on:
  - Same boat class (+5)
  - Same club (+4)
  - Same fleet (+3)
  - Raced together (+3)
  - Same region (+2)
- **Service Method**: `getSimilarSailors()`
- **UI**: "Similar Sailors" section in CrewMemberFinderModal

### Phase 4: Fleet Subscriptions ✅
- Batch follow all fleet members
- Fleet preview modal
- Unsubscribe options
- **Files**: `FleetPreviewModal.tsx`
- **Service Method**: `subscribeToFleet()`

---

## API Methods

### CrewFinderService

```typescript
// Get races from followed users
getFollowedUsersRaces(userId: string): Promise<FollowedTimeline[]>

// Get similar sailors for discovery
getSimilarSailors(userId: string): Promise<SimilarSailor[]>

// Subscribe to a fleet (batch follow)
subscribeToFleet(userId: string, fleetId: string): Promise<void>

// Copy a race to user's timeline
copyRaceToTimeline(userId: string, sourceRaceId: string): Promise<Race>
```

---

## Privacy Considerations

- Users can make their timeline private (future enhancement)
- Follow requests for private timelines (future enhancement)
- Public fleets can be discovered; private fleets require invitation

---

## Related Files

### Core Components
- `components/races/TimelineFeed.tsx` - Multi-timeline gesture container
- `components/races/TimelineScreen.tsx` - Single user timeline view
- `components/races/SocialTimelineView.tsx` - Integration wrapper
- `components/races/RaceShareActions.tsx` - Copy/join race actions
- `components/crew/FleetPreviewModal.tsx` - Fleet subscription modal
- `components/crew/CrewMemberFinderModal.tsx` - Discovery UI with similar sailors

### Hooks
- `hooks/useFollowedTimelines.ts` - Fetch followed users' timelines

### Services
- `services/CrewFinderService.ts` - Social sailing service methods
- `services/RaceCollaborationService.ts` - Join request handling

### Integration
- `app/(tabs)/races.tsx` - Main races screen (feature flagged)
- `lib/featureFlags.ts` - `ENABLE_SOCIAL_TIMELINE` flag

### Database
- `supabase/migrations/20260123200000_add_race_copy_columns.sql` - Copy tracking columns
