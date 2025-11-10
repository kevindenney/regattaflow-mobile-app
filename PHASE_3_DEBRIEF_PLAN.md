# Phase 3: DEBRIEF Mode - Planning Document

**Date:** 2025-11-04
**Status:** Planning
**Goal:** Complete post-race analysis interface to finish PLAN → RACE → DEBRIEF workflow

---

## Overview

DEBRIEF mode provides post-race analysis and insights for sailors to review performance, identify improvements, and learn from their racing.

---

## Core Components (5 Total)

### 1. **DebriefModeLayout**
**Purpose:** Container for post-race analysis interface
**Location:** `components/races/modes/DebriefModeLayout.tsx`

**Features:**
- Clean analysis-focused layout
- Split-screen option (map + metrics)
- Export/share functionality
- Print-friendly format

**Props:**
```typescript
interface DebriefModeLayoutProps {
  raceId: string;
  raceData: RaceData;
  gpsTrack: GPSPoint[]; // Recorded GPS track from race
  splitTimes: SplitTime[]; // Times at each mark
  children?: ReactNode;
}
```

---

### 2. **RaceReplayMap**
**Purpose:** Interactive GPS track playback with time controls
**Location:** `components/races/RaceReplayMap.tsx`

**Features:**
- Full GPS track display with colored gradient (speed)
- Playback controls (play/pause, speed: 1x, 2x, 5x, 10x)
- Time slider to scrub through race
- Show boat position at specific time
- Mark positions and rounding analysis
- Wind/current overlay at different times
- Compare multiple tracks (if available)

**Props:**
```typescript
interface RaceReplayMapProps {
  gpsTrack: GPSPoint[];
  marks: Mark[];
  startTime: Date;
  endTime: Date;
  onTimeChange?: (time: Date) => void;
  weather?: WeatherData[];
}

interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed: number; // SOG in knots
  heading: number; // COG in degrees
  accuracy?: number;
}
```

**Visual Design:**
- Track colored by speed (slow = blue → fast = red)
- Animated boat icon moves along track
- Mark approach/departure analysis circles
- Tacking/jibing indicators
- Wind arrows at key moments

---

### 3. **PerformanceMetrics**
**Purpose:** Statistical analysis of race performance
**Location:** `components/races/PerformanceMetrics.tsx`

**Features:**
- **Speed Analysis:**
  - Avg speed
  - Max speed
  - Speed by leg (upwind/downwind/reaching)
  - Speed percentile vs fleet
- **VMG Analysis:**
  - Upwind VMG
  - Downwind VMG
  - VMG efficiency %
- **Distance:**
  - Total distance sailed
  - Extra distance vs optimal
  - Distance by leg
- **Time Analysis:**
  - Total race time
  - Time on port vs starboard
  - Time spent tacking/jibing

**Props:**
```typescript
interface PerformanceMetricsProps {
  gpsTrack: GPSPoint[];
  splitTimes: SplitTime[];
  weather: WeatherData;
  fleetData?: FleetPerformance; // For comparison
}
```

**Visual Design:**
- Card-based metrics grid
- Charts: Line graphs, bar charts, pie charts
- Traffic light indicators (good/average/poor)
- Percentile badges vs fleet

---

### 4. **SplitTimesAnalysis**
**Purpose:** Mark-by-mark timing breakdown
**Location:** `components/races/SplitTimesAnalysis.tsx`

**Features:**
- Table of split times at each mark
- Leg times (mark to mark)
- Fleet position at each mark
- Gain/loss analysis per leg
- Rounding efficiency scores
- Fastest/slowest legs highlighted

**Props:**
```typescript
interface SplitTimesAnalysisProps {
  splitTimes: SplitTime[];
  marks: Mark[];
  fleetSplits?: FleetSplitData[];
}

interface SplitTime {
  markId: string;
  markName: string;
  time: Date;
  position: number; // Fleet position
  roundingType: 'port' | 'starboard';
  roundingTime: number; // Seconds spent in rounding
}
```

**Visual Design:**
- Timeline visualization
- Color-coded gain/loss (green/red)
- Mark icons with timestamps
- Expandable leg details

---

### 5. **TacticalInsights**
**Purpose:** AI-powered tactical analysis and recommendations
**Location:** `components/races/TacticalInsights.tsx`

**Features:**
- **Automated Insights:**
  - "You gained 3 places on the first upwind leg"
  - "Starboard tack was 15% faster than port"
  - "You rounded Mark 2 wide, costing ~8 seconds"
- **What Worked:**
  - Best decisions
  - Successful tactics
- **Areas for Improvement:**
  - Missed opportunities
  - Tactical errors
  - Boat handling issues
- **Recommendations:**
  - "Practice port roundings"
  - "Work on downwind speed"
  - "Study wind shifts at this venue"

**Props:**
```typescript
interface TacticalInsightsProps {
  gpsTrack: GPSPoint[];
  splitTimes: SplitTime[];
  weather: WeatherData;
  marks: Mark[];
  raceResult?: {
    position: number;
    totalBoats: number;
  };
}
```

**Visual Design:**
- Insight cards with icons
- Expandable sections
- Priority badges (high/medium/low impact)
- Action buttons ("Practice this skill")

---

## Data Requirements

### GPS Track Recording
**Challenge:** RACE mode needs to record GPS trail to storage
**Solution:**
- Save GPS points to database during race
- Table: `race_gps_tracks`
- Columns: `race_id`, `sailor_id`, `timestamp`, `lat`, `lng`, `speed`, `heading`

### Split Time Recording
**Challenge:** Need to detect mark roundings automatically
**Solution:**
- Auto-detect when sailor enters mark proximity (e.g., 50m radius)
- Record timestamp, position, rounding side
- Table: `race_split_times`

---

## Technical Architecture

### Component Hierarchy
```
DebriefModeLayout
├─ RaceReplayMap (top half or full screen)
├─ PerformanceMetrics (tabs/cards)
├─ SplitTimesAnalysis (table view)
└─ TacticalInsights (bottom drawer or sidebar)
```

### State Management
```typescript
// In races.tsx
const [replayTime, setReplayTime] = useState<Date | null>(null);
const [selectedMetric, setSelectedMetric] = useState<'speed' | 'vmg' | 'distance'>('speed');
const [showInsights, setShowInsights] = useState(true);
```

### Data Flow
```
Database (GPS track + splits)
    ↓
races.tsx (fetch on mode switch)
    ↓
DebriefModeLayout (distribute data)
    ↓
├─→ RaceReplayMap (visualization)
├─→ PerformanceMetrics (calculations)
├─→ SplitTimesAnalysis (table display)
└─→ TacticalInsights (AI analysis)
```

---

## Implementation Steps

### Step 1: Create Components (4 files)
1. `components/races/modes/DebriefModeLayout.tsx`
2. `components/races/RaceReplayMap.tsx`
3. `components/races/PerformanceMetrics.tsx`
4. `components/races/SplitTimesAnalysis.tsx`
5. `components/races/TacticalInsights.tsx`

### Step 2: Add Mock Data
Since we don't have real GPS tracks yet, create mock data:
- Sample GPS track (100 points)
- Sample split times (4 marks)
- Sample performance metrics

### Step 3: Integrate into races.tsx
Add DEBRIEF mode rendering in the mode switch:
```typescript
) : currentMode === 'debrief' ? (
  <DebriefModeLayout
    raceId={selectedRaceId}
    raceData={selectedRaceData}
    gpsTrack={mockGPSTrack}
    splitTimes={mockSplitTimes}
  >
    {/* Components rendered inside */}
  </DebriefModeLayout>
) : (
```

### Step 4: Test Functionality
- Switch to DEBRIEF tab
- Verify map replay works
- Check metrics calculations
- Test split times display
- Review tactical insights

---

## MVP Features (Phase 3.1)

**Must Have:**
- ✅ RaceReplayMap with basic playback
- ✅ PerformanceMetrics (speed, distance, time)
- ✅ SplitTimesAnalysis table
- ✅ Basic TacticalInsights (static for now)

**Nice to Have (Future):**
- AI-generated insights
- Fleet comparison
- Multiple race comparison
- Export to PDF/CSV
- Share with coach

---

## Design References

**Inspiration:**
- Strava activity analysis
- TrainingPeaks workout review
- RaceQs race analysis
- Expedition navigation software

**Color Scheme:**
- Analysis theme: Clean white/light gray background
- Charts: Professional blue/green palette
- Highlights: Orange for important insights

---

## Success Criteria

1. ✅ User can switch to DEBRIEF mode after race
2. ✅ GPS track displays correctly on map
3. ✅ Playback controls work smoothly
4. ✅ Performance metrics calculate accurately
5. ✅ Split times show clearly
6. ✅ At least 3 tactical insights display

---

## Timeline Estimate

- **Component Creation:** 2-3 hours
- **Integration:** 30 minutes
- **Testing:** 30 minutes
- **Total:** ~4 hours

---

## Next Session

After Phase 3 is complete, the full race workflow will be functional:
1. **PLAN** - Pre-race strategy and course setup ✅
2. **RACE** - Live racing with GPS tracking ✅
3. **DEBRIEF** - Post-race analysis and learning 🚧

Then we can focus on enhancements:
- Real GPS recording in RACE mode
- AI tactical analysis
- Fleet tracking
- Coach sharing
- Physical device testing

---

**Status:** Ready to begin implementation
**Next Step:** Create DebriefModeLayout component
