# Sailing Excellence Framework - Implementation Plan

> A comprehensive system for tracking and improving sailing performance through unified checklists, adaptive learning, and excellence metrics.

**Started:** January 2026
**Status:** Planning Complete

---

## Overview

### Vision
Transform RegattaFlow into a comprehensive excellence tracking platform where every race makes the sailor smarter. The system operates through four modes (Prep → Launch → Race → Review) with a unified checklist model that learns from outcomes and surfaces personalized recommendations.

### Key Features
- [ ] Per-race timeline with 4 modes
- [ ] Unified checklist model across all phases
- [ ] Adaptive learning from race feedback
- [ ] Excellence tracking dashboard (new Progress tab)
- [ ] AI-powered personalized recommendations

---

## Milestone 1: Database Foundation

### 1.1 Migration File
- [x] Create `supabase/migrations/20260110100000_create_excellence_framework.sql`

### 1.2 Core Tables

#### race_checklist_items (Unified checklist)
- [x] Create table with columns:
  - [x] id, sailor_id, race_event_id
  - [x] phase (prep/launch/race/review)
  - [x] title, description, category
  - [x] status (pending/in_progress/completed/skipped)
  - [x] outcome_rating (1-5), outcome_notes
  - [x] source (template/ai_generated/manual/learning_nudge)
  - [x] is_personalized, personalization_reason, confidence_score
- [x] Add indexes for performance
- [x] Add RLS policies

#### learnable_events (Extracted insights)
- [x] Create table with columns:
  - [x] id, sailor_id, race_event_id, venue_id
  - [x] event_type, phase, category
  - [x] original_text, title, action_text, outcome
  - [x] conditions_context (JSONB)
  - [x] ai_confidence, sailor_confirmed
  - [x] nudge_eligible, times_surfaced
- [x] Add indexes
- [x] Add RLS policies

#### excellence_metrics (Progress tracking)
- [x] Create table with columns:
  - [x] id, sailor_id, season_id
  - [x] Phase mastery scores (prep, launch, start, upwind, downwind, marks, finish, review)
  - [x] framework_scores (JSONB)
  - [x] races_completed, average_position, position_trend, best_finish
  - [x] focus_recommendations (JSONB)
- [x] Add indexes
- [x] Add RLS policies

### 1.3 Run Migration
- [x] `npx supabase db push`
- [x] Verify tables created
- [ ] Test RLS policies

---

## Milestone 2: Type Definitions (COMPLETED)

### 2.1 Excellence Framework Types
- [x] Create `types/excellenceFramework.ts`
  - [x] RacePhase type ('prep' | 'launch' | 'race' | 'review')
  - [x] ChecklistCategory type
  - [x] ChecklistItemSource type
  - [x] RaceChecklistItem interface
  - [x] PhaseMasteryScores interface
  - [x] FrameworkScores interface
  - [x] OutcomeMetrics interface
  - [x] ExcellenceMetrics interface
  - [x] FocusRecommendation interface
  - [x] RaceTimeline interface
  - [x] PhaseStatus interface

### 2.2 Adaptive Learning Types
- [x] Create `types/adaptiveLearning.ts`
  - [x] LearnableEventType type
  - [x] LearnableEvent interface
  - [x] ConditionsContext interface

### 2.3 Export from index
- [ ] Update `types/index.ts` if exists

---

## Milestone 3: Core Services (COMPLETED)

### 3.1 RaceChecklistService
- [x] Create `services/RaceChecklistService.ts`
  - [x] getChecklistForRace(sailorId, raceEventId, phase?)
  - [x] createChecklistItem(item)
  - [x] updateChecklistStatus(itemId, status)
  - [x] rateChecklistOutcome(itemId, rating, notes)
  - [x] getPhaseProgress(sailorId, raceEventId)
  - [x] injectPersonalizedItems(sailorId, raceEventId, phase)

### 3.2 ExcellenceMetricsService
- [x] Create `services/ExcellenceMetricsService.ts`
  - [x] calculatePhaseMastery(sailorId, seasonId?)
  - [x] calculateFrameworkScores(sailorId, seasonId?)
  - [x] calculateOutcomeMetrics(sailorId, seasonId?)
  - [x] generateFocusRecommendations(metrics)
  - [x] getExcellenceMetrics(sailorId, seasonId?)
  - [x] refreshMetrics(sailorId)

### 3.3 Hooks for Services
- [x] Create `hooks/useExcellenceChecklist.ts`
- [x] Create `hooks/useExcellenceMetrics.ts`

---

## Milestone 4: AI Learning System (COMPLETED)

### 4.1 Learning Event Extractor Skill
- [x] Create `skills/learning-event-extractor/SKILL.md`
  - [x] Define extraction categories (rig_adjustment, forgotten_item, etc.)
  - [x] Define input/output contract
  - [x] Write extraction rules and examples
- [x] Create `skills/learning-event-extractor/skillContent.ts`

### 4.2 Register Skill
- [x] Update `services/ai/SkillManagementService.ts`
  - [x] Add skill to SKILL_REGISTRY
  - [x] Add initialization method

### 4.3 AdaptiveLearningService
- [x] Create `services/AdaptiveLearningService.ts`
  - [x] extractEventsFromText(text, sourceType, context)
  - [x] processRaceCompletion(sailorId, raceId, feedback)
  - [x] generatePersonalizedItems(sailorId, raceEventId, phase, context)
  - [x] matchLearnableEvents(sailorId, context)
  - [x] recordNudgeSurfaced(eventId)
  - [x] dismissNudge(eventId)
  - [x] rateNudgeHelpfulness(eventId, rating)

### 4.4 Integration Triggers
- [x] Modify `components/races/PostRaceInterview.tsx`
  - [x] Trigger extraction on save
- [x] Modify `components/races/MorningDecisionsReview.tsx`
  - [x] Trigger extraction on save

### 4.5 Adaptive Learning Hook
- [x] Create `hooks/useAdaptiveLearning.ts`
  - [x] getPersonalizedItems(raceEventId, phase)
  - [x] dismissNudge()
  - [x] rateNudge()

---

## Milestone 5: Progress Tab

### 5.1 Tab Navigation
- [ ] Modify `app/(tabs)/_layout.tsx`
  - [ ] Add "Progress" tab
  - [ ] Configure icon and label

### 5.2 Main Screen
- [ ] Create `app/(tabs)/progress.tsx`
  - [ ] Header with season info
  - [ ] Phase mastery section
  - [ ] Framework adoption section
  - [ ] Outcome trends section
  - [ ] Focus recommendations section
  - [ ] Recent learnings section

### 5.3 Progress Components
- [ ] Create `components/progress/PhaseMasteryChart.tsx`
  - [ ] Horizontal bar chart for each phase
  - [ ] Highlight focus areas
- [ ] Create `components/progress/FrameworkRadarChart.tsx`
  - [ ] Radar/spider chart for frameworks
  - [ ] Interactive labels
- [ ] Create `components/progress/OutcomeTrendCard.tsx`
  - [ ] Position statistics
  - [ ] Sparkline of recent results
  - [ ] Trend indicator
- [ ] Create `components/progress/FocusRecommendations.tsx`
  - [ ] AI-generated focus areas
  - [ ] Suggested drills
  - [ ] Links to learning modules
- [ ] Create `components/progress/RecentLearnings.tsx`
  - [ ] List of extracted learnings
  - [ ] Positive/negative indicators
  - [ ] Link to full learnings list

---

## Milestone 6: Unified Checklist UI

### 6.1 Phase Timeline Component
- [ ] Create `components/checklist/PhaseTimeline.tsx`
  - [ ] Visual indicator: Prep → Launch → Race → Review
  - [ ] Current phase highlight
  - [ ] Completion status per phase

### 6.2 Unified Checklist Component
- [ ] Create `components/checklist/UnifiedChecklist.tsx`
  - [ ] Render items for any phase
  - [ ] Group by category
  - [ ] Status toggle (checkbox)
  - [ ] Personalized item highlighting
  - [ ] Outcome rating UI (Review phase)

### 6.3 Personalized Item Badge
- [ ] Create `components/checklist/PersonalizedItemBadge.tsx`
  - [ ] "AI" or "From your notes" label
  - [ ] Expandable reasoning
  - [ ] Dismiss button

### 6.4 Integration
- [ ] Modify race detail screens to show phase timeline
- [ ] Update `RaceMorningContent.tsx` to use unified checklist
- [ ] Add personalized items injection

---

## Milestone 7: Notifications & Polish

### 7.1 Push Notification Setup
- [ ] Configure expo-notifications
- [ ] Create notification scheduling service
- [ ] Day-before briefing notification
- [ ] Morning reminder notification
- [ ] Conditions change alerts (optional)

### 7.2 Effectiveness Tracking
- [ ] Track nudge surfaces
- [ ] Record acknowledgments
- [ ] Collect outcome ratings
- [ ] Implement confidence adjustment algorithm
- [ ] Auto-deactivate ineffective nudges

### 7.3 Morning Briefing Compilation
- [ ] Create morning briefing aggregation
- [ ] Group nudges by type
- [ ] Generate AI summary (optional)

---

## Testing Checklist

### Database
- [ ] Tables create successfully
- [ ] RLS policies work correctly
- [ ] Indexes improve query performance

### Services
- [ ] Checklist CRUD operations work
- [ ] Excellence metrics calculate correctly
- [ ] Learning extraction produces valid events
- [ ] Personalized items match context appropriately

### UI
- [ ] Progress tab displays all sections
- [ ] Charts render correctly
- [ ] Checklist items toggle properly
- [ ] Personalized badges display
- [ ] Phase timeline updates

### Integration
- [ ] Post-race triggers extraction
- [ ] Morning review triggers extraction
- [ ] Personalized items appear in checklists
- [ ] Metrics update after races

---

## File Reference

### New Files
```
types/
  excellenceFramework.ts
  adaptiveLearning.ts

services/
  RaceChecklistService.ts
  ExcellenceMetricsService.ts
  AdaptiveLearningService.ts

skills/
  learning-event-extractor/
    SKILL.md
    skillContent.ts

hooks/
  useRaceChecklist.ts
  useExcellenceMetrics.ts
  useAdaptiveLearning.ts

components/
  progress/
    PhaseMasteryChart.tsx
    FrameworkRadarChart.tsx
    OutcomeTrendCard.tsx
    FocusRecommendations.tsx
    RecentLearnings.tsx
  checklist/
    PhaseTimeline.tsx
    UnifiedChecklist.tsx
    PersonalizedItemBadge.tsx

app/(tabs)/
  progress.tsx

supabase/migrations/
  YYYYMMDDHHMMSS_create_excellence_framework.sql
```

### Modified Files
```
app/(tabs)/_layout.tsx
components/races/PostRaceInterview.tsx
components/races/MorningDecisionsReview.tsx
components/cards/content/phases/RaceMorningContent.tsx
services/ai/SkillManagementService.ts
services/PostRaceLearningService.ts
hooks/useRacePreparation.ts
```

---

## Notes

_Add implementation notes, decisions, and learnings as we build:_

-

