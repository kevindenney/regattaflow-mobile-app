# Phase 1.5: PLAN Mode Content Organization

**Status:** Planning
**Date:** 2025-11-03

---

## Current Content Analysis

The races.tsx PLAN mode currently contains these major sections:

### Always Visible (Header Level)
1. **Header** - Venue selector, notifications
2. **RaceBriefHero** - Quick race overview with regulatory/rig buttons
3. **PhaseStepper** - Progress indicator
4. **Demo Banner** - For demo users

### Race Selection
5. **Race Cards** - Horizontal scrollable race list

### Selected Race Detail (All currently visible)
6. **Race Actions** - Edit/Delete buttons
7. **Course Selector** - Template picker + save
8. **Tactical Map** - RaceDetailMapHero
9. **Weather** - WindWeatherCard
10. **Rig Tuning** - RigTuningCard + class selection
11. **Tide** - CurrentTideCard
12. **Contingency Plans** - ContingencyPlansCard
13. **Post-Race Analysis** - PostRaceAnalysisCard
14. **Logistics Section**
    - RigPlannerCard
    - CrewEquipmentCard
    - FleetRacersCard
    - RaceDocumentsCard
15. **Regulatory Section**
    - RegulatoryDigestCard
    - CourseOutlineCard

### Optional/Conditional
16. **AI Venue Insights** - Venue intelligence card

### Outside ScrollView
- FAB (Floating Action Button) menu
- Calendar Import Modal
- Post-Race Interview Modal

---

## Problems with Current Organization

1. **Information Overload**: Everything is visible at once (~700+ lines of content)
2. **No Priority Hierarchy**: Critical pre-race info mixed with post-race analysis
3. **Poor Mobile UX**: Excessive scrolling to find relevant information
4. **Temporal Confusion**: Post-race content visible before race even starts
5. **No Progressive Disclosure**: Can't focus on "what matters right now"

---

## Proposed PLAN Mode Organization

Organize around **sailor's shore planning workflow** with **collapsible sections**:

### 🎯 Priority 1: Race Selection (Always Visible)
```
┌─────────────────────────────────────────┐
│ [Race1] [Race2] [Race3] [Race4] ─────→ │ ← Horizontal scroll
└─────────────────────────────────────────┘
```
- Race cards remain at top
- Quick access to switch between races
- Clear indication of selected race

### ⚡ Priority 2: Quick Actions & Overview (Always Visible)
```
┌─────────────────────────────────────────┐
│ [Edit Race]  [Delete Race]              │
│                                         │
│ 📋 Race Brief: Tomorrow • Victoria      │
│    [View NoR] [Rig Planner] [Calendar]  │
└─────────────────────────────────────────┘
```
- RaceBriefHero (condensed)
- Quick action buttons
- Essential race metadata

### 🌊 Priority 3: Conditions & Environment (Expandable)
**Default: Expanded** (most important for shore planning)

```
┌─────────────────────────────────────────┐
│ ▼ Conditions & Environment              │
│                                         │
│   🌬️  Wind: 15-18kt NE                 │
│   🌊  Tide: Flooding +2.1m              │
│   ⚠️  Contingency Plans (3)             │
└─────────────────────────────────────────┘
```
- WindWeatherCard
- CurrentTideCard
- ContingencyPlansCard

### 🗺️ Priority 4: Course & Strategy (Expandable)
**Default: Expanded**

```
┌─────────────────────────────────────────┐
│ ▼ Course & Strategy                     │
│                                         │
│   🗺️  Tactical Map                     │
│   📍  Course Template Selector          │
│   💡  AI Venue Insights (if available)  │
└─────────────────────────────────────────┘
```
- RaceDetailMapHero (hero size)
- Course template picker
- AI Venue Insights (when available)

### ⚙️ Priority 5: Boat Setup (Expandable)
**Default: Collapsed** (expand when needed)

```
┌─────────────────────────────────────────┐
│ ▶ Boat Setup                            │
└─────────────────────────────────────────┘

When expanded:
┌─────────────────────────────────────────┐
│ ▼ Boat Setup                            │
│                                         │
│   ⚙️  Rig Tuning for 15-18kt          │
│   🔧  Rig Planner (Band C)             │
└─────────────────────────────────────────┘
```
- RigTuningCard
- RigPlannerCard

### 👥 Priority 6: Team & Logistics (Expandable)
**Default: Collapsed**

```
┌─────────────────────────────────────────┐
│ ▶ Team & Logistics                      │
└─────────────────────────────────────────┘

When expanded:
┌─────────────────────────────────────────┐
│ ▼ Team & Logistics                      │
│                                         │
│   👥  Crew & Equipment                  │
│   ⛵  Fleet Racers (12)                 │
│   📄  Race Documents (3)                │
└─────────────────────────────────────────┘
```
- CrewEquipmentCard
- FleetRacersCard
- RaceDocumentsCard

### 📋 Priority 7: Regulatory (Expandable)
**Default: Collapsed**

```
┌─────────────────────────────────────────┐
│ ▶ Regulatory & Rules                    │
└─────────────────────────────────────────┘

When expanded:
┌─────────────────────────────────────────┐
│ ▼ Regulatory & Rules                    │
│                                         │
│   ✅  Regulatory Digest (2/5 ack'd)    │
│   📐  Course Outline                    │
└─────────────────────────────────────────┘
```
- RegulatoryDigestCard
- CourseOutlineCard

### 🏆 Priority 8: Post-Race Analysis (Expandable)
**Default: Collapsed** (not relevant until after race)
**Auto-expand: After race completion**

```
┌─────────────────────────────────────────┐
│ ▶ Post-Race Analysis                    │
└─────────────────────────────────────────┘

When expanded:
┌─────────────────────────────────────────┐
│ ▼ Post-Race Analysis                    │
│                                         │
│   🏆  Performance Review                │
│   📊  GPS Track Replay                  │
│   💬  AI Coaching Feedback              │
└─────────────────────────────────────────┘
```
- PostRaceAnalysisCard
- (This will move to DEBRIEF mode in Phase 5)

---

## Implementation Strategy

### Step 1: Create CollapsibleSection Component
**File:** `components/races/plan/CollapsibleSection.tsx`

**Features:**
- Expand/collapse animation
- Persistence (remember state across sessions)
- Badge indicators (e.g., "3 items", "2/5 complete")
- Smooth transitions
- Accessibility support

**Props:**
```typescript
interface CollapsibleSectionProps {
  id: string; // For state persistence
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  defaultExpanded?: boolean;
  priority?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  children: React.ReactNode;
}
```

### Step 2: Create PlanModeContent Component
**File:** `components/races/plan/PlanModeContent.tsx`

**Purpose:** Organize all selected race detail content into sections

**Features:**
- Receives selectedRaceData as prop
- Renders all cards within appropriate sections
- Handles section state (expanded/collapsed)
- Priority-based rendering order

### Step 3: Update PlanModeLayout
**Modify:** `components/races/modes/PlanModeLayout.tsx`

- Keep race cards and header outside sections (always visible)
- Use PlanModeContent for selected race detail
- Maintain existing props interface

### Step 4: Integrate into races.tsx
**Modify:** `app/(tabs)/races.tsx`

- Move selected race content into PlanModeContent
- Pass all necessary props
- Remove old structure
- Keep FAB, modals outside

---

## Success Criteria

- [ ] All content organized into 8 logical sections
- [ ] Sections can expand/collapse smoothly
- [ ] Section state persists across app sessions
- [ ] Priority 1-2 content always visible
- [ ] Priority 3-4 content expanded by default
- [ ] Priority 5-8 content collapsed by default
- [ ] Post-race section auto-expands after race completion
- [ ] Reduced initial scroll height by ~60%
- [ ] No functionality lost
- [ ] All existing cards still render correctly

---

## Time Estimate

- **Step 1 (CollapsibleSection):** 1 hour
- **Step 2 (PlanModeContent):** 1.5 hours
- **Step 3 (Update layout):** 30 minutes
- **Step 4 (Integration):** 1 hour

**Total:** 4 hours

---

## Next Phase Preview

**Phase 1.6:** Comprehensive Testing
- Test section expand/collapse on all devices
- Test state persistence
- Regression test all card functionality
- Performance testing (render time with large race lists)

**Phase 2:** RACE Mode Implementation
- Minimal on-water interface
- Large touch targets
- Phase-aware AI coach
- Quick reference cards
