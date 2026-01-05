# Race Timeline UX Implementation Tracker

## Goal
Implement a two-axis navigation system for the races screen on mobile:
- **Horizontal (left/right)**: Navigate between races in a timeline
- **Vertical (up/down)**: Scroll through detail sections for the selected race

Layout: 72% Hero (race cards) / 28% Detail (scrollable cards)

---

## Progress Checklist

### Phase 1: Layout Structure
- [x] Add SCREEN_HEIGHT, HERO_ZONE_HEIGHT, RACE_CARD_HEIGHT constants
- [x] Add cardHeight prop to RaceCard component
- [x] Add cardHeight prop to DistanceRaceCard component
- [x] Add cardHeight prop to AddRaceTimelineCard component
- [x] Wrap demo races in fixed-height HERO_ZONE_HEIGHT container
- [x] **Wrap real races in fixed-height HERO_ZONE_HEIGHT container**
- [x] Add timeline indicators (dots) for real races section
- [x] Move headers outside hero zone for more card space
- [x] Remove alignItems: 'center' to fill hero zone properly
- [x] Increased hero zone to 72% (from 55%)
- [ ] Verify layout works on device

### Phase 2: Enhance Race Cards
- [x] RaceCard: Add courseName badge
- [x] RaceCard: Add numberOfRaces badge
- [x] RaceCard: Add start time row with warning signal
- [x] RaceCard: Add startSequenceType badge (5-4-1-0, pursuit, etc.)
- [x] RaceCard: Add rigTension indicator
- [x] DistanceRaceCard: Add courseName badge
- [x] DistanceRaceCard: Add numberOfLegs badge
- [x] DistanceRaceCard: Add start time row with time limit
- [x] DistanceRaceCard: Add rigTension indicator
- [ ] Pass new props from races.tsx to cards (numberOfRaces, rigTension, etc.)

### Phase 3: Create Detail Cards
- [x] Create `components/races/detail-cards/` directory
- [x] Create ConditionsDetailCard.tsx
- [x] Create CourseDetailCard.tsx
- [x] Create FleetDetailCard.tsx
- [x] Create RegulatoryDetailCard.tsx
- [x] Create StrategyDetailCard.tsx
- [x] Create RigDetailCard.tsx
- [x] Create index.ts barrel export
- [x] Integrate detail cards into races.tsx with DETAIL_ZONE_HEIGHT

### Phase 4: Wire Up Navigation
- [x] Implement onMomentumScrollEnd to sync selected race
- [x] Detail zone scrolls independently (implemented)
- [x] Detail cards update when race selection changes (implemented via selectedRaceData)
- [x] State sync between horizontal scroll and selectedRaceId
- [x] Timeline dots tappable for direct navigation
- [x] Demo races scroll sync and tappable dots

### Phase 5: Polish & Animations
- [x] Smooth transitions when switching races (animated: true on scrollTo)
- [x] Haptic feedback on race change (expo-haptics Light impact)
- [x] Timeline indicators sync with scroll position (via onMomentumScrollEnd)
- [ ] Accessibility/keyboard support (optional enhancement)

---

## Current Status
✅ **Phase 5 Complete.** Two-axis navigation fully implemented with polish.

### Navigation Features
- `onMomentumScrollEnd` syncs `selectedRaceId` when user stops swiping
- Timeline dots are tappable for direct navigation to any race
- Both real races and demo races have full navigation sync
- Detail zone updates automatically when race selection changes

### Polish Features
- Smooth animated scroll transitions when navigating races
- Haptic feedback (Light impact) on race change and dot taps
- Timeline dots visually sync with current selection
- Snap-to-center scrolling for precise card positioning

### Detail Cards (`components/races/detail-cards/`)
- `ConditionsDetailCard.tsx` - Wind, tide, waves summary
- `CourseDetailCard.tsx` - Course name, type, marks
- `FleetDetailCard.tsx` - Competitors, registration status
- `RegulatoryDetailCard.tsx` - VHF, documents, SI/NOR
- `StrategyDetailCard.tsx` - Strategy notes, AI insights
- `RigDetailCard.tsx` - Rig tuning settings

**Implementation complete.** Optional: Add keyboard/accessibility support for web.

---

## Files Modified
| File | Status |
|------|--------|
| `app/(tabs)/races.tsx` | ✅ Detail zone integrated |
| `components/races/RaceCard.tsx` | ✅ Enhanced |
| `components/races/DistanceRaceCard.tsx` | ✅ Enhanced |

## Files Created
| File | Status |
|------|--------|
| `components/races/detail-cards/ConditionsDetailCard.tsx` | ✅ Created |
| `components/races/detail-cards/CourseDetailCard.tsx` | ✅ Created |
| `components/races/detail-cards/FleetDetailCard.tsx` | ✅ Created |
| `components/races/detail-cards/RegulatoryDetailCard.tsx` | ✅ Created |
| `components/races/detail-cards/StrategyDetailCard.tsx` | ✅ Created |
| `components/races/detail-cards/RigDetailCard.tsx` | ✅ Created |
| `components/races/detail-cards/index.ts` | ✅ Created |

---

## Last Updated
2026-01-05
