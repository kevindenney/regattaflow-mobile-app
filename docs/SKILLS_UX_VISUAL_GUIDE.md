# Claude Skills UX Integration - Visual Guide

## User Journey with AI Coach

```
┌─────────────────────────────────────────────────────────────┐
│                    REGATTAFLOW USER JOURNEY                  │
└─────────────────────────────────────────────────────────────┘

📱 PRE-RACE PLANNING (1-3 days before)
   ├── User opens Race Details screen
   ├── 🤖 AI Coach automatically appears
   ├── Skill: starting-line-mastery
   └── Shows: Line bias analysis, start strategy, timing plan

       ┌────────────────────────────────────┐
       │ 💡 AI Race Coach                   │
       │ Pre-Race Planning                  │
       ├────────────────────────────────────┤
       │ Quick Take:                        │
       │ "Pin end favored by 7°. Start     │
       │  middle-left for strategic access  │
       │  to left shift."                   │
       │                                    │
       │ ✓ Action Items:                    │
       │ 1. Enter starting area 3min before │
       │ 2. Set up 5 boat lengths from pin  │
       │ 3. Use port approach, tack 30sec   │
       │                                    │
       │ 📊 Key Numbers:                    │
       │ Line bias: 7° (pin favored)        │
       │ Fleet size: 45 boats               │
       │ Wind: Oscillating 8-12kt           │
       └────────────────────────────────────┘

⏰ START SEQUENCE (10 min before - 0)
   ├── User on water, approaching line
   ├── 🤖 AI Coach updates automatically
   ├── Skill: starting-line-mastery
   └── Shows: Speed control, space defense, final approach

       ┌────────────────────────────────────┐
       │ 💡 AI Race Coach                   │
       │ Starting Soon (5:23 to start)      │
       ├────────────────────────────────────┤
       │ "Hold position 2 lengths from line.│
       │  Luff jib first to slow, keep main │
       │  trimmed for weather helm control."│
       │                                    │
       │ Speed Control:                     │
       │ • 3min: Enter area, establish lane │
       │ • 1min: Accelerate to full speed   │
       │ • 30sec: Commit to final position  │
       │ • 10sec: Maximum acceleration      │
       └────────────────────────────────────┘

⛵ FIRST BEAT (0 - 15 min)
   ├── Race started, sailing upwind
   ├── 🤖 AI Coach detects "first-beat" phase
   ├── Skill: upwind-strategic-positioning
   └── Shows: Wind pattern, side selection, tacking strategy

       ┌────────────────────────────────────┐
       │ 💡 AI Race Coach                   │
       │ First Beat                         │
       ├────────────────────────────────────┤
       │ "Oscillating wind, 10° range.      │
       │  Tack on 5° headers. Favor middle  │
       │  60% of course."                   │
       │                                    │
       │ Tacking Strategy:                  │
       │ Starboard: 170-185° (avg 177°)     │
       │ Port: 260-275° (avg 267°)          │
       │                                    │
       │ IF starboard >185° → TACK (headed) │
       │ IF port <260° → TACK (headed)      │
       │                                    │
       │ Risk: MEDIUM - Stay in middle 60%  │
       └────────────────────────────────────┘

🎯 WEATHER MARK (Approaching)
   ├── GPS detects: 50m from windward mark
   ├── 🤖 AI Coach switches to mark-rounding-execution
   └── Shows: Approach angle, inside/outside, layline

       ┌────────────────────────────────────┐
       │ 💡 AI Race Coach                   │
       │ Weather Mark (4 lengths away)      │
       ├────────────────────────────────────┤
       │ "Approach on port layline. Tack to │
       │  starboard 2 lengths before mark.  │
       │  Wide entry, tight exit."          │
       │                                    │
       │ Inside Overlap: NO                 │
       │ Boats nearby: 3                    │
       │ Strategy: Outside, clean rounding  │
       │                                    │
       │ Entry width: 2 boat lengths        │
       │ Exit: <1 foot from mark            │
       │ Next: Set spinnaker during turn    │
       └────────────────────────────────────┘

🌊 REACHING (After weather mark)
   ├── GPS detects: heading downwind
   ├── 🤖 AI Coach switches to downwind-speed-and-position
   └── Shows: Rhumb line, puff/lull tactics, jibing plan

       ┌────────────────────────────────────┐
       │ 💡 AI Race Coach                   │
       │ Reaching                           │
       ├────────────────────────────────────┤
       │ "Bear off in puffs, head up in     │
       │  lulls. Stay below rhumb line in   │
       │  pressure."                        │
       │                                    │
       │ VMG Strategy:                      │
       │ Puff: Bear off 10° below rhumb     │
       │ Lull: Head up 5° toward rhumb      │
       │ Never sail above rhumb line        │
       │                                    │
       │ Jibing Plan:                       │
       │ • One jibe at mid-leg              │
       │ • Approach mark on starboard jibe  │
       └────────────────────────────────────┘

🏁 FINISH (Final approach)
   ├── GPS detects: near finish line
   ├── 🤖 AI Coach switches to mark-rounding-execution (finish tactics)
   └── Shows: Favored end, approach angle

       ┌────────────────────────────────────┐
       │ 💡 AI Race Coach                   │
       │ Finish Line                        │
       ├────────────────────────────────────┤
       │ "RC end favored by 4°. Approach on │
       │  starboard tack for right-of-way." │
       │                                    │
       │ Finish Strategy:                   │
       │ • Sail to RC end                   │
       │ • Starboard approach               │
       │ • Cross at full speed              │
       │                                    │
       │ Estimated gain: 2-3 positions      │
       └────────────────────────────────────┘
```

---

## Integration Points in RegattaFlow App

```
┌─────────────────────────────────────────────────────────────┐
│                    APP SCREEN INTEGRATION                    │
└─────────────────────────────────────────────────────────────┘

1️⃣  RACE ENTRY / PLANNING SCREEN
    app/(tabs)/races.tsx → RaceDetailScreen

    ┌──────────────────────────────────┐
    │ Race: Spring Championship       │
    │ Date: May 15, 2025              │
    │ Course: Windward-Leeward        │
    ├──────────────────────────────────┤
    │                                  │
    │  [SmartRaceCoach Component]      │  ← ADD HERE
    │  Shows: Pre-race strategy        │
    │                                  │
    ├──────────────────────────────────┤
    │ Strategy Notes:                  │
    │ [Auto-filled from AI advice]     │
    └──────────────────────────────────┘


2️⃣  PRE-RACE PREPARATION SCREEN
    app/race/prepare/[id].tsx

    ┌──────────────────────────────────┐
    │ ☰ Race Preparation               │
    ├──────────────────────────────────┤
    │ 🏁 Start Strategy                │  ← Quick Skill Buttons
    │ ⛵ Upwind Plan                    │
    │ 🌊 Downwind Plan                 │
    │ 🎯 Mark Tactics                  │
    ├──────────────────────────────────┤
    │                                  │
    │  [SmartRaceCoach - Expanded]     │  ← Main AI coach
    │                                  │
    ├──────────────────────────────────┤
    │ Course Map                       │
    │ Weather Forecast                 │
    │ Competitors                      │
    └──────────────────────────────────┘


3️⃣  LIVE RACE SCREEN
    app/race/live/[id].tsx

    ┌──────────────────────────────────┐
    │                                  │
    │                                  │
    │       [Race Map View]            │
    │                                  │
    │                                  │
    ├──────────────────────────────────┤
    │ [SmartRaceCoach - Minimal]       │  ← Floating bottom
    │ 💡 "Tack on 5° header"           │     Or minimized FAB
    │ [Tap to expand]                  │
    └──────────────────────────────────┘


4️⃣  RACE TIMER SCREEN
    app/(tabs)/race/timer.tsx

    ┌──────────────────────────────────┐
    │        5:00 to Start             │
    │                                  │
    │     ⏱ Countdown Timer            │
    │                                  │
    ├──────────────────────────────────┤
    │ [SmartRaceCoach - Start Focus]   │  ← Start-specific
    │ Speed control, timing, position  │
    └──────────────────────────────────┘


5️⃣  POST-RACE DEBRIEF
    app/race/debrief/[id].tsx

    ┌──────────────────────────────────┐
    │ Race Results: 12th / 45          │
    ├──────────────────────────────────┤
    │ Splits by Leg:                   │
    │ Start: -3 positions              │
    │ Beat 1: +2 positions             │
    │ Run 1: -1 position               │
    ├──────────────────────────────────┤
    │ [AI Analysis]                    │  ← Post-race AI
    │ "Lost positions at start due to  │
    │  late entry. Strong upwind but   │
    │  missed pressure on run."        │
    │                                  │
    │ Recommendations:                 │
    │ • Practice start timing drills   │
    │ • Study downwind pressure        │
    └──────────────────────────────────┘
```

---

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPONENT ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────┘

RaceScreen
├── RaceDetails
└── SmartRaceCoach ←──────────────── Main Component
    ├── useRacePhaseDetection ←────── Hook (auto-detect phase)
    ├── SkillManagementService ←───── Service (invoke skills)
    │   ├── SKILL_REGISTRY
    │   ├── PHASE_TO_SKILLS
    │   └── invokeSkillWithContext()
    └── UI Components
        ├── Header (phase label, controls)
        ├── QuickSummary (collapsed view)
        └── ExpandedView
            ├── PrimaryAdvice
            ├── ActionItems
            ├── KeyMetrics
            └── ConfidenceBadge

LiveRaceScreen
├── TacticalRaceMap
└── SmartRaceCoach (minimal mode)
    └── FloatingActionButton (when minimized)

PrepareScreen
├── QuickSkillButtons ←────────────── Quick access
│   ├── "Start Strategy"
│   ├── "Upwind Plan"
│   ├── "Downwind Plan"
│   └── "Mark Tactics"
└── SmartRaceCoach (expanded)
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        DATA FLOW                             │
└─────────────────────────────────────────────────────────────┘

User Action / GPS Update
          │
          ▼
   Race Phase Detection
    (useRacePhaseDetection)
          │
          ├── Time to start? → pre-race / start-sequence
          ├── GPS position? → detect leg (beat/reach/run)
          └── Distance to mark? → weather-mark / leeward-mark
          │
          ▼
   Skill Selection
    (PHASE_TO_SKILLS mapping)
          │
          ├── pre-race → starting-line-mastery
          ├── first-beat → upwind-strategic-positioning
          ├── weather-mark → mark-rounding-execution
          └── ... etc
          │
          ▼
   Context Building
    (buildContext function)
          │
          ├── Gather: GPS, wind data, fleet size, etc.
          └── Format for skill-specific prompt
          │
          ▼
   Skill Invocation
    (Anthropic API call)
          │
          ├── POST /v1/messages
          ├── Include: model, prompt, skill ID
          └── Receive: AI-generated advice
          │
          ▼
   Response Parsing
    (parseAdvice function)
          │
          ├── Extract: primary, details, actions, metrics
          └── Structure into Advice object
          │
          ▼
   UI Update
    (useState, re-render)
          │
          ├── Show advice in expanded view
          ├── Animate in
          └── Enable user interaction
```

---

## Quick Integration Checklist

```
✅ SETUP (15 minutes)
   □ Add SKILL_IDS to SkillManagementService.ts
   □ Add PHASE_TO_SKILL mapping
   □ Copy SmartRaceCoach.tsx to components/coaching/
   □ Copy useRacePhaseDetection.ts to hooks/

✅ BASIC INTEGRATION (30 minutes)
   □ Add SmartRaceCoach to RaceDetailScreen
   □ Pass raceData props (startTime, course, marks)
   □ Test in development mode
   □ Verify API calls working

✅ ADVANCED FEATURES (1-2 hours)
   □ Add GPS position tracking
   □ Implement auto phase detection
   □ Add QuickSkillButtons component
   □ Create GlanceableAdviceCard
   □ Add to LiveRaceScreen with minimal mode

✅ POLISH (1-2 hours)
   □ Add loading states
   □ Implement error handling
   □ Add haptic feedback
   □ Cache responses
   □ Add analytics tracking
```

---

## Example: Minimum Viable Integration

```typescript
// app/race/[id].tsx

import { SmartRaceCoach } from '@/components/coaching/SmartRaceCoach';

export default function RaceDetailScreen({ route }) {
  const { raceId } = route.params;
  const [race, setRace] = useState(null);

  useEffect(() => {
    // Load race data
    loadRace(raceId).then(setRace);
  }, [raceId]);

  return (
    <ScrollView>
      {/* Existing race details */}
      <RaceHeader race={race} />
      <RaceCourse course={race?.course} />

      {/* ADD THIS - that's it! */}
      <View className="p-4">
        <SmartRaceCoach
          raceId={raceId}
          raceData={{
            startTime: race?.date_time,
            fleetSize: race?.fleet_size,
            course: race?.course,
            marks: race?.course?.marks,
          }}
        />
      </View>

      {/* Rest of screen */}
      <StrategyNotes race={race} />
    </ScrollView>
  );
}
```

**That's it!** The SmartRaceCoach component handles:
- ✅ Race phase detection
- ✅ Skill selection
- ✅ API invocation
- ✅ UI presentation
- ✅ User interaction

---

## Visual Design Patterns

### Minimal Mode (Live Racing)
```
┌────────────────────────┐
│ 💡 Tack on 5° header   │ ← Floating card, bottom of screen
│ [Tap to expand]        │   Auto-dismiss after 30s
└────────────────────────┘
```

### Expanded Mode (Planning)
```
┌─────────────────────────────────┐
│ 💡 AI Race Coach                │
│ Pre-Race Planning               │
├─────────────────────────────────┤
│ Quick Take:                     │ ← Purple highlight box
│ "Pin end favored by 7°..."      │
│                                 │
│ ✓ Action Items:                 │ ← Numbered list
│ 1. Enter area 3min before       │
│ 2. Set up 5 lengths from pin    │
│                                 │
│ 📊 Key Numbers:                 │ ← Metrics table
│ Line bias: 7°                   │
│ Fleet: 45 boats                 │
│                                 │
│ [Refresh] [Dismiss]             │ ← Action buttons
└─────────────────────────────────┘
```

### Dismissed State
```
    [🤖 Ask AI Coach] ← Purple pill button
```

---

## Performance Optimization

```
CACHING STRATEGY:
├── Cache skill responses for 60 seconds
├── Don't re-invoke on minor GPS changes
├── Debounce phase changes (wait 3 seconds)
└── Use local storage for offline fallback

API CALL LIMITS:
├── Max 1 call per minute per skill
├── Max 5 calls per race
└── Show cached advice when limit hit

LOADING STATES:
├── Show skeleton UI while loading
├── Fallback to cached advice on error
└── Display "AI Coach unavailable" gracefully
```

---

## Summary

Your RegattaFlow Playbook Tactics skills are now integrated into a **smart, context-aware AI coach** that:

1. 🎯 **Detects race phase automatically** - knows when you're starting vs. upwind vs. rounding
2. 🧠 **Selects the right skill** - uses starting-line-mastery at start, upwind-tactical-combat on beats, etc.
3. 💬 **Provides actionable advice** - specific angles, times, and tactics formatted for quick consumption
4. 📱 **Works everywhere** - pre-race planning, live racing (minimal mode), post-race debrief
5. 🚀 **Easy to integrate** - drop in `<SmartRaceCoach />` component, it handles the rest!

Next step: Copy `SmartRaceCoach.tsx` into your app and add it to one screen to see it in action! 🏆
