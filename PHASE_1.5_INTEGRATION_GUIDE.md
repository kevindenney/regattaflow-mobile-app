# Phase 1.5 Integration Guide
## Organizing PLAN Mode Content into Collapsible Sections

**Status:** Ready for Implementation
**Date:** 2025-11-03

---

## Overview

This guide provides step-by-step instructions for integrating the new `PlanModeContent` component into `races.tsx`. The goal is to organize the existing race detail content into priority-based collapsible sections.

---

## Content Mapping

### What Stays OUTSIDE PlanModeContent (Always Visible)

These items remain in the main ScrollView, not wrapped in sections:

1. **RaceBriefHero** (lines ~2398-2407)
2. **PhaseStepper** (lines ~2409-2413)
3. **Demo Profile Banner** (lines ~2415-2431)
4. **Race Cards** (lines ~2433-2492) - Horizontal scroll
5. **Race Selection Loading** (lines ~2495-2500)

### What Goes INSIDE PlanModeContent (Organized Sections)

Only visible when `selectedRaceData` exists (lines ~2502-2872):

#### Priority 2: Quick Actions Section (Always Visible)
**Location:** Lines 2504-2578

**Content:**
```tsx
sections.quickActions = (
  <>
    {/* Edit/Delete Buttons */}
    <View className="flex-row gap-3">
      <Button action="secondary"... >Edit Race</Button>
      <Button action="negative"... >Delete Race</Button>
    </View>

    {/* Course Template Selector */}
    <View className="mt-3">
      <CourseSelector ... />
      <Button ... >Save Template</Button>
    </View>
  </>
)
```

#### Priority 3: Conditions & Environment (Expanded by Default)
**Location:** Lines 2700-2766

**Content:**
```tsx
sections.conditions = (
  <>
    <WindWeatherCard ... />

    {!selectedRaceClassId && (
      <View className="... bg-amber-50">
        {/* Class not set warning */}
      </View>
    )}

    <CurrentTideCard ... />

    <ContingencyPlansCard ... />
  </>
)
```

**Note:** RigTuningCard moved to Boat Setup section

#### Priority 4: Course & Strategy (Expanded by Default)
**Location:** Lines 2580-2699, 2936-3026

**Content:**
```tsx
sections.courseAndStrategy = (
  <>
    {/* Tactical Race Map */}
    <RaceDetailMapHero ... />

    {/* AI Venue Insights (conditional) */}
    {showInsights && venueInsights && (
      <Card ... >
        {/* Venue intelligence content */}
      </Card>
    )}
  </>
)
```

#### Priority 5: Boat Setup (Collapsed by Default)
**Location:** Lines 2736-2743, 2805-2812

**Content:**
```tsx
sections.boatSetup = (
  <>
    <RigTuningCard
      raceId={selectedRaceData.id}
      boatClassName={selectedRaceClassName}
      recommendation={selectedRaceTuningRecommendation}
      loading={selectedRaceTuningLoading}
      onRefresh={selectedRaceClassId ? refreshSelectedRaceTuning : undefined}
    />

    <RigPlannerCard
      presets={rigPresets}
      selectedBand={selectedRigBand}
      onSelectBand={(bandId) => setSelectedRigBand(bandId)}
      notes={rigNotes}
      onChangeNotes={setRigNotes}
      onOpenChat={handleOpenChatFromRigPlanner}
    />
  </>
)
```

#### Priority 6: Team & Logistics (Collapsed by Default)
**Location:** Lines 2814-2849

**Content:**
```tsx
sections.teamAndLogistics = (
  <>
    <CrewEquipmentCard
      raceId={selectedRaceData.id}
      classId={selectedRaceData.class_id || selectedRaceData.metadata?.class_id}
      raceDate={selectedRaceData.start_date}
      onManageCrew={() => handleManageCrewNavigation(...)}
    />

    <FleetRacersCard
      raceId={selectedRaceData.id}
      classId={selectedRaceData.metadata?.class_name}
      venueId={selectedRaceData.metadata?.venue_id}
      onJoinFleet={(fleetId) => logger.debug('Joined fleet:', fleetId)}
    />

    <RaceDocumentsCard
      raceId={selectedRaceData.id}
      onUpload={() => logger.debug('Upload document tapped')}
      onDocumentPress={(doc) => logger.debug('Document pressed:', doc)}
      onShareWithFleet={(docId) => logger.debug('Share document with fleet:', docId)}
    />
  </>
)
```

#### Priority 7: Regulatory & Rules (Collapsed by Default)
**Location:** Lines 2864-2871

**Content:**
```tsx
sections.regulatory = (
  <>
    <RegulatoryDigestCard
      digest={regulatoryDigest}
      acknowledgements={regattaAcknowledgements}
      onToggle={handleToggleAcknowledgement}
    />

    <CourseOutlineCard groups={courseOutlineGroups} />
  </>
)
```

#### Priority 8: Post-Race Analysis (Collapsed by Default)
**Location:** Lines 2768-2782

**Content:**
```tsx
sections.postRaceAnalysis = (
  <>
    <PostRaceAnalysisCard
      raceId={selectedRaceData.id}
      raceName={selectedRaceData.name}
      raceStartTime={selectedRaceData.start_date}
    />
  </>
)
```

---

## Implementation Steps

### Step 1: Add Import
**File:** `app/(tabs)/races.tsx`
**Location:** Top of file (around line 20)

```typescript
import { PlanModeContent } from '@/components/races/plan';
```

### Step 2: Replace Selected Race Content

**Find:** The block starting at line ~2502:
```typescript
{selectedRaceData && (
  <View className="mt-2 gap-4">
    {/* All the race detail content */}
  </View>
)}
```

**Replace with:**
```typescript
{selectedRaceData && (
  <PlanModeContent
    raceData={selectedRaceData}
    raceId={selectedRaceData.id}
    raceStatus={getRaceStatus(selectedRaceData.start_date)}
    contingencyCount={3} // TODO: Calculate from contingency plans
    regulatoryAcknowledged={regattaAcknowledgements?.filter(a => a.acknowledged).length || 0}
    regulatoryTotal={regattaAcknowledgements?.length || 0}
    sections={{
      quickActions: (
        <>
          {/* Priority 2 content from lines 2504-2578 */}
        </>
      ),
      conditions: (
        <>
          {/* Priority 3 content from lines 2700-2766 */}
        </>
      ),
      courseAndStrategy: (
        <>
          {/* Priority 4 content from lines 2580-2699, 2936-3026 */}
        </>
      ),
      boatSetup: (
        <>
          {/* Priority 5 content from lines 2736-2743, 2805-2812 */}
        </>
      ),
      teamAndLogistics: (
        <>
          {/* Priority 6 content from lines 2814-2849 */}
        </>
      ),
      regulatory: (
        <>
          {/* Priority 7 content from lines 2864-2871 */}
        </>
      ),
      postRaceAnalysis: (
        <>
          {/* Priority 8 content from lines 2768-2782 */}
        </>
      ),
    }}
  />
)}
```

### Step 3: Handle AI Venue Insights

The AI Venue Insights card (lines 2936-3026) should be moved INTO the `courseAndStrategy` section rather than staying outside PlanModeContent.

### Step 4: Remove Logistics/Regulatory Section Headers

**Remove:** The `<RacePhaseHeader>` components at lines:
- 2771-2777 (Post-Race Analysis header)
- 2798-2803 (Logistics header)
- No header for regulatory section

These are replaced by the CollapsibleSection headers.

### Step 5: Remove onLayout Handlers

**Remove:** The `onLayout` props from:
- Line 2788-2796 (logisticsSectionY)
- Line 2853-2862 (regulatorySectionY)

These were for scrolling to sections, which is now handled by expand/collapse.

---

## Testing Checklist

After integration:

- [ ] App builds without errors
- [ ] PLAN mode loads without crashes
- [ ] All 8 sections visible when race selected
- [ ] Priority 3-4 sections expanded by default
- [ ] Priority 5-8 sections collapsed by default
- [ ] Sections expand/collapse smoothly
- [ ] All cards render correctly within sections
- [ ] Edit/Delete buttons still work
- [ ] Course selector still works
- [ ] Weather/tide cards update correctly
- [ ] Rig tuning recommendations work
- [ ] Crew/fleet/documents cards functional
- [ ] Regulatory acknowledgements work
- [ ] Post-race analysis accessible
- [ ] AI venue insights appear in Course section
- [ ] No TypeScript errors
- [ ] No console warnings

---

## Risk Mitigation

**Backup:** `races.tsx.backup` already exists from Phase 1

**Incremental Approach:**
1. Add import first - test build
2. Add empty PlanModeContent - test render
3. Move one section at a time - test after each
4. Test thoroughly before committing

**Rollback Plan:**
If issues arise, restore from backup:
```bash
cp app/(tabs)/races.tsx.backup app/(tabs)/races.tsx
```

---

## Estimated Time

- Step 1 (Import): 5 minutes
- Step 2 (Integration): 90 minutes
- Step 3-5 (Cleanup): 30 minutes
- Testing: 30 minutes

**Total:** ~2.5 hours

---

## Next Phase

After successful integration:
- **Phase 1.6:** Comprehensive device testing
- Test on iPhone, iPad, Android
- Test orientation changes
- Test section state persistence
- Performance testing
