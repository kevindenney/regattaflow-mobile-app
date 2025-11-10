# Phase 2: RACE Mode Implementation Plan

**Status:** Planning
**Date:** 2025-11-03
**Estimated Time:** 4-6 hours
**Dependencies:** Phase 1.5 Complete ✅

---

## 🎯 Objective

Implement a live racing interface that provides real-time tactical information, GPS tracking, and race timing in a full-screen, distraction-free layout optimized for active racing.

---

## 📋 Core Requirements

### 1. Live Racing Interface
- **Full-screen map view** with GPS position
- **Minimalist UI** - only essential info visible
- **One-tap access** to key functions
- **Auto-rotate** map to boat heading (optional)
- **Night mode** for low-light racing

### 2. Race Timer
- **Pre-start countdown** (10, 5, 4, 3, 2, 1, GO!)
- **Race elapsed time** (running clock)
- **Split times** at each mark rounding
- **Visual alerts** (color changes at key times)
- **Audio alerts** (configurable)

### 3. GPS Tracking & Position
- **Current position** marker on map
- **Breadcrumb trail** (last 30 seconds)
- **Speed over ground** (SOG) display
- **Course over ground** (COG) display
- **Distance to next mark**
- **VMG** (velocity made good) to mark

### 4. Real-time Tactical Data
- **Wind direction** (true & apparent)
- **Wind speed** (current)
- **Current direction/strength** overlay
- **Laylines** to windward mark
- **Favored side** indicator
- **Tactical zones** (if pre-calculated)

### 5. Quick Actions
- **Mark rounding** checklist (one-tap)
- **Voice notes** (hands-free recording)
- **Return to PLAN** mode
- **Emergency protocols** (one-tap)

---

## 🏗️ Implementation Steps

### Step 1: Create RaceModeLayout Component
**File:** `components/races/modes/RaceModeLayout.tsx`

**Purpose:** Container layout for RACE mode with full-screen map and overlay panels

**Features:**
- Full-screen map view (100vh minus header)
- Floating timer overlay (top)
- Compact info cards (bottom drawer, swipe up to expand)
- Quick action buttons (floating, right side)
- Orientation-aware layout

**Estimated Time:** 1.5 hours

---

### Step 2: Race Timer Component
**File:** `components/races/RaceTimer.tsx` (enhance existing)

**Purpose:** Visual countdown/elapsed timer with alerts

**Features:**
- Large, readable numbers
- Color changes (red at T-1min, yellow at T-30sec, green at GO)
- Pre-start sequence (10-5-4-3-2-1-GO)
- Split time recording at marks
- Pause/resume capability
- Sync with device time

**Estimated Time:** 1 hour

---

### Step 3: Live GPS Tracking Component
**File:** `components/races/LivePositionTracker.tsx`

**Purpose:** Display current position and track on map

**Features:**
- Real-time GPS position update (1Hz or configurable)
- Breadcrumb trail with fade effect
- Speed/heading indicators
- Accuracy indicator (GPS signal strength)
- Battery-efficient updates

**Integration:**
- Use existing `gpsService.ts`
- Add to RaceDetailMapHero (racing mode)

**Estimated Time:** 2 hours

---

### Step 4: Real-time Data Overlays
**File:** `components/races/TacticalDataOverlay.tsx`

**Purpose:** Display wind, current, and tactical info on map

**Features:**
- Wind arrow (direction & speed)
- Current arrows (grid or vectors)
- Laylines to windward mark (dashed lines)
- Favored side indicator (shaded region)
- Distance/bearing to next mark

**Data Sources:**
- Wind: Weather API + onboard sensors
- Current: Tidal service + observed drift
- Laylines: Calculated from boat polars + wind

**Estimated Time:** 2 hours

---

### Step 5: Quick Action Drawer
**File:** `components/races/QuickActionDrawer.tsx`

**Purpose:** Swipe-up drawer with compact racing info

**Features:**
- Swipe gesture to reveal/hide
- Mark rounding checklist
- Fleet positions (if available)
- Voice note recording
- Quick strategy reminders
- Emergency protocols button

**Estimated Time:** 1.5 hours

---

### Step 6: Mode Switching Logic
**File:** `components/races/RaceModeSelector.tsx` (enhance existing)

**Purpose:** Smooth transition between PLAN ↔ RACE modes

**Features:**
- Auto-switch to RACE mode at T-10min (optional)
- Manual mode toggle (top bar)
- Preserve map zoom/position between modes
- Different layouts for each mode
- Save last mode preference

**Estimated Time:** 1 hour

---

## 🎨 Design Specifications

### Layout Structure (RACE Mode)

```
┌─────────────────────────────────┐
│ ⏱️ 00:05:30  📍 SOG: 6.2kt     │ ← Timer + Speed Overlay
├─────────────────────────────────┤
│                                 │
│                                 │
│        🗺️ Full-Screen Map       │
│     (with GPS position,         │
│      wind/current overlays)     │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│ 🎯 Mark 1: 0.3nm @ 045°        │ ← Compact Info Strip
│ 💨 Wind: 12kt @ 270°  ⬆️ Flood  │   (swipe up to expand)
└─────────────────────────────────┘
│ [🎙️] [📋] [⚠️] [📊]            │ ← Quick Actions (floating)
```

### Color Scheme (Racing)
- **Background:** Dark gray/navy (reduce glare)
- **Timer:**
  - Green: Race in progress
  - Yellow: T-30sec warning
  - Red: T-1min warning
  - White: Pre-race (>1min)
- **GPS Track:** Bright cyan (high contrast)
- **Marks:** Orange with labels
- **Wind:** Blue arrows
- **Current:** Green arrows

### Typography (Racing)
- **Timer:** 48px bold, high contrast
- **Speed/SOG:** 36px medium
- **Info cards:** 16px regular (compact)
- **Quick actions:** Icons (24px) + small labels

---

## 📊 Data Flow

### GPS Position Updates
```
gpsService.ts
  ↓ (1Hz updates)
LivePositionTracker
  ↓ (update map marker)
RaceDetailMapHero
  ↓ (calculate VMG, bearing)
TacticalDataOverlay
```

### Race Timer Flow
```
RaceTimer
  ↓ (time updates)
RaceModeLayout
  ↓ (trigger alerts)
AlertService
  ↓ (visual + audio)
User Feedback
```

### Mode Switching
```
User Taps "Race" Mode
  ↓
RaceModeSelector
  ↓
ResponsiveRaceLayout
  ↓
RaceModeLayout (full render)
  ↓
Start GPS tracking
Start timer (if race started)
```

---

## 🧪 Testing Requirements

### Functional Testing
- [ ] GPS position updates smoothly (no jitter)
- [ ] Timer counts down/up accurately
- [ ] Audio alerts work at correct times
- [ ] Quick actions accessible with one tap
- [ ] Mode switching preserves map state
- [ ] Battery usage acceptable (< 10%/hour)

### Performance Testing
- [ ] 60fps rendering on map with overlays
- [ ] GPS updates don't block UI
- [ ] Memory usage stable over 2+ hours
- [ ] Works with screen locked (audio alerts)

### Edge Cases
- [ ] GPS signal lost/regained
- [ ] Timer paused/resumed
- [ ] App backgrounded during race
- [ ] Low battery mode
- [ ] Device orientation changes

---

## 🚨 Potential Challenges

### 1. GPS Accuracy
**Challenge:** Consumer GPS accuracy ±5-10m
**Mitigation:**
- Kalman filtering for smoothing
- Show accuracy indicator
- Don't rely on hyper-precise positioning

### 2. Battery Life
**Challenge:** Continuous GPS + screen-on drains battery
**Mitigation:**
- Optimize update frequency (1Hz sufficient)
- Reduce map tile reloads
- Dim screen automatically
- Battery warning at 20%

### 3. Real-time Data Latency
**Challenge:** Wind/current data may lag
**Mitigation:**
- Cache last known values
- Show data timestamp
- Visual indicator for stale data

### 4. Distraction-Free Interface
**Challenge:** Too much info → cognitive overload
**Mitigation:**
- Only show essential data in RACE mode
- Use swipe-up drawer for secondary info
- Large touch targets (easy to hit while moving)

---

## 📱 Platform Considerations

### iOS
- Use CoreLocation for GPS
- Background location permission required
- Audio alerts via AVAudioPlayer
- Haptic feedback for timer alerts

### Android
- Use FusedLocationProvider
- Foreground service for GPS tracking
- Notification for background tracking
- Vibration for timer alerts

### Web
- Geolocation API (less accurate)
- No background tracking
- Desktop testing only (not for actual racing)

---

## 🔗 Integration Points

### Existing Services
- `gpsService.ts` - GPS position tracking
- `RaceWeatherService.ts` - Real-time wind data
- `TidalService.ts` - Current predictions
- `RaceTimerService.ts` - Timer logic

### Existing Components
- `RaceDetailMapHero` - Map base (enhance for RACE mode)
- `RaceTimer` - Timer display (enhance)
- `RaceModeSelector` - Mode switching (already exists)
- `ResponsiveRaceLayout` - Layout wrapper (already exists)

---

## 📈 Success Metrics

### Technical Goals
- [ ] GPS updates at 1Hz with <100ms latency
- [ ] Timer accurate to ±1 second
- [ ] UI rendering at 60fps
- [ ] Battery usage < 10%/hour
- [ ] Works offline (cached tiles)

### UX Goals
- [ ] One-tap access to essential functions
- [ ] Readable in bright sunlight
- [ ] Minimal distraction during racing
- [ ] Quick mode switching (<1 second)
- [ ] Intuitive layout (no learning curve)

---

## 🚀 Rollout Plan

### Phase 2a: Core Racing UI (This Phase)
- Create RaceModeLayout
- Enhance RaceTimer with alerts
- Add GPS tracking display
- Basic tactical overlays

### Phase 2b: Advanced Features (Future)
- Fleet tracking (AIS integration)
- Voice control ("Hey RegattaFlow, mark rounding")
- Automatic mark detection
- Post-race auto-debrief generation

---

## 🛠️ Development Order

1. **Create RaceModeLayout.tsx** (skeleton)
2. **Enhance RaceTimer.tsx** (countdown/alerts)
3. **Add LivePositionTracker.tsx** (GPS display)
4. **Create TacticalDataOverlay.tsx** (wind/current)
5. **Create QuickActionDrawer.tsx** (swipe-up panel)
6. **Integrate with RaceModeSelector** (mode switching)
7. **Test end-to-end** (full race simulation)
8. **Polish animations** & transitions

---

**Estimated Total Time:** 9-11 hours
**Target Completion:** 1-2 coding sessions

**Next Step:** Create `RaceModeLayout.tsx` component

---

**Ready to start building Phase 2?** 🏁
