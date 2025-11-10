# Phase 2: RACE Mode - Testing Documentation

**Date:** 2025-11-03
**Status:** Ready for Testing
**Components:** 5 new components, 1 verified existing

---

## Testing Checklist

### 1. Component Unit Testing

#### RaceModeLayout (components/races/modes/RaceModeLayout.tsx)
- [ ] Renders full-screen layout correctly
- [ ] Timer overlay displays at top
- [ ] Map container fills available space
- [ ] Info strip expands/collapses smoothly on tap
- [ ] Quick action buttons float over map
- [ ] Drawer expansion animates at 60fps
- [ ] Dark theme (#1F2937) applied correctly
- [ ] Responsive to different screen sizes

#### LiveRaceTimer (components/races/LiveRaceTimer.tsx)
- [ ] Countdown starts from race start time (ISO 8601)
- [ ] Background color changes at T-60s (blue), T-30s (orange), T-10s (red)
- [ ] Visual alerts trigger at T-60s, T-30s, T-10s, T-5s, GO
- [ ] Timer displays MM:SS format correctly
- [ ] Timer switches to H:MM:SS for races > 1 hour
- [ ] Manual play/pause controls work
- [ ] Stop button resets timer
- [ ] "GO!" displays at race start
- [ ] Elapsed time tracks accurately during race
- [ ] Audio alerts callback fires (ready for expo-av)

#### LivePositionTracker (components/races/LivePositionTracker.tsx)
- [ ] Requests GPS permission on mount
- [ ] Shows permission denied error if rejected
- [ ] Displays "Acquiring GPS signal..." while waiting
- [ ] Updates position at 1Hz (1 second intervals)
- [ ] SOG (Speed Over Ground) displays in knots
- [ ] COG (Course Over Ground) displays in degrees
- [ ] Compass icon rotates with heading
- [ ] Accuracy indicator shows correct color:
  - Green: ≤5m
  - Blue: ≤10m
  - Yellow: ≤20m
  - Red: >20m
- [ ] Breadcrumb trail maintains last 30 seconds
- [ ] Old trail positions auto-prune correctly
- [ ] Distance to target mark calculates accurately (Haversine)
- [ ] Bearing to target mark calculates accurately
- [ ] Converts m/s to knots correctly (×1.94384)
- [ ] Converts meters to nautical miles correctly (÷1852)
- [ ] onPositionUpdate callback fires with correct data
- [ ] onTrailUpdate callback fires with filtered trail
- [ ] Debug coordinates display in dev mode only

#### TacticalDataOverlay (components/races/TacticalDataOverlay.tsx)
- [ ] Wind data displays speed (knots) and direction (degrees)
- [ ] Wind gust displays if > base wind speed
- [ ] Current data shows speed, direction, type (flood/ebb/slack)
- [ ] Current effect calculates helping/hindering correctly
- [ ] VMG (Velocity Made Good) calculates accurately
- [ ] VMG shows angle off course
- [ ] Laylines calculate port and starboard tack angles
- [ ] Favored side indicator shows correct tack
- [ ] Favored side calculates degree advantage
- [ ] Port tack favored: red background
- [ ] Starboard tack favored: green background
- [ ] Data cards use correct color coding
- [ ] All calculations use correct formulas

#### QuickActionDrawer (components/races/QuickActionDrawer.tsx)
- [ ] Drawer expands/collapses on tap
- [ ] Drag handle visual present
- [ ] Collapsed summary shows next mark and task count
- [ ] Expanded view shows all sections
- [ ] Mark rounding checklist displays 5 items
- [ ] Checklist items toggle completed state
- [ ] Progress bar updates with completion percentage
- [ ] Progress badge shows percentage
- [ ] Fleet position displays ahead/behind/total
- [ ] Voice note button triggers callback
- [ ] Emergency button triggers callback with red styling
- [ ] Strategy reminders display with colored dots
- [ ] ScrollView works smoothly with content
- [ ] maxHeight constraint (80% of screen) works

#### RaceModeSelector (components/races/RaceModeSelector.tsx)
- [ ] Displays 3 modes: Plan, Race, Debrief
- [ ] Current mode highlighted with color
- [ ] Active mode shows underline bar
- [ ] onModeChange callback fires with correct mode
- [ ] Icons render correctly (Calendar, Navigation, TrendingUp)
- [ ] Smooth transitions between modes

---

### 2. Integration Testing

#### RACE Mode Flow
1. [ ] Start from races.tsx with race selected
2. [ ] Switch to RACE mode via RaceModeSelector
3. [ ] RaceModeLayout renders full-screen
4. [ ] LiveRaceTimer starts countdown automatically
5. [ ] LivePositionTracker requests GPS permission
6. [ ] GPS position updates display in info strip
7. [ ] TacticalDataOverlay shows wind/current (if available)
8. [ ] Tap info strip to expand drawer
9. [ ] QuickActionDrawer slides up smoothly
10. [ ] Checklist items toggle correctly
11. [ ] Swipe down to collapse drawer
12. [ ] Quick action buttons remain accessible
13. [ ] Timer countdown reaches GO! at race start
14. [ ] Timer switches to elapsed time
15. [ ] GPS trail builds up over 30 seconds
16. [ ] Distance to mark updates in real-time
17. [ ] Mode switch back to PLAN preserves data

#### Component Communication
- [ ] LivePositionTracker → RaceModeLayout position updates
- [ ] LivePositionTracker → TacticalDataOverlay position data
- [ ] LiveRaceTimer → RaceModeLayout timer state
- [ ] QuickActionDrawer → Parent quick action callbacks
- [ ] RaceModeSelector → Parent mode change callbacks

---

### 3. Performance Testing

#### Frame Rate
- [ ] UI renders at 60fps during normal use
- [ ] Drawer animation smooth (no stuttering)
- [ ] GPS updates don't cause frame drops
- [ ] Timer countdown smooth (no visible jitter)
- [ ] Map rendering maintains 60fps

#### Battery Efficiency
- [ ] GPS updates at 1Hz (not higher frequency)
- [ ] No excessive re-renders (use React DevTools)
- [ ] Trail pruning prevents memory leaks
- [ ] Timers clean up on unmount
- [ ] GPS subscription removed on unmount

#### Memory Usage
- [ ] Trail array limited to 30 seconds (~30 positions)
- [ ] No memory leaks after 10 minutes of use
- [ ] Component unmount cleans up subscriptions
- [ ] AsyncStorage doesn't accumulate stale data

---

### 4. Device Testing

#### iOS Physical Device
- [ ] GPS accuracy within 10 meters
- [ ] Location permission dialog appears
- [ ] Compass heading accurate
- [ ] Dark theme readable in sunlight
- [ ] Touch targets large enough (44×44pt minimum)
- [ ] Haptic feedback works (if implemented)

#### Android Physical Device
- [ ] GPS accuracy within 10 meters
- [ ] Location permission dialog appears
- [ ] Compass heading accurate
- [ ] Dark theme readable in sunlight
- [ ] Touch targets large enough (48×48dp minimum)
- [ ] Material Design guidelines followed

#### Outdoor Testing (Critical!)
- [ ] Screen readable in direct sunlight
- [ ] GPS signal acquired within 30 seconds
- [ ] GPS maintains lock during movement
- [ ] Speed readings accurate (compare to known device)
- [ ] Distance calculations accurate (measure against known course)
- [ ] Timer visible at arm's length (on boat)

---

### 5. Edge Cases

#### GPS Edge Cases
- [ ] GPS permission denied → shows error message
- [ ] GPS signal lost → maintains last known position
- [ ] GPS accuracy poor (>50m) → shows warning
- [ ] No GPS on device (web) → graceful degradation
- [ ] GPS updates delayed → doesn't crash app

#### Timer Edge Cases
- [ ] Race start time in past → starts immediately
- [ ] Race start time far future → shows countdown
- [ ] System time changes → recalculates correctly
- [ ] App backgrounded during countdown → resumes correctly
- [ ] App killed and restarted → timer resyncs

#### Data Edge Cases
- [ ] No wind data available → overlay hides wind section
- [ ] No current data → overlay hides current section
- [ ] No target mark → position tracker shows position only
- [ ] Invalid coordinates → doesn't crash
- [ ] Null/undefined props → graceful fallbacks

#### UI Edge Cases
- [ ] Small screens (iPhone SE) → layout adapts
- [ ] Large screens (iPad) → uses space well
- [ ] Landscape orientation → maintains usability
- [ ] Notch/safe area → respects insets
- [ ] Keyboard appearance → doesn't break layout

---

### 6. Accessibility Testing

- [ ] VoiceOver (iOS) announces timer changes
- [ ] TalkBack (Android) announces timer changes
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets meet minimum size (44×44pt / 48×48dp)
- [ ] Interactive elements have accessible labels
- [ ] Status changes announced to screen readers

---

### 7. Error Handling

- [ ] Network errors don't crash app
- [ ] Invalid race data shows error message
- [ ] Missing props have sensible defaults
- [ ] AsyncStorage errors logged but don't break UI
- [ ] Permission errors show user-friendly messages

---

## Test Scenarios

### Scenario 1: Pre-Race Preparation (T-10 minutes)
**Goal:** Sailor reviews course and checks GPS before race

1. Open race detail page
2. Switch to RACE mode
3. Verify GPS acquires signal
4. Check wind/current data displays
5. Tap info strip to expand drawer
6. Review mark rounding checklist
7. Verify distance to start line displays
8. Confirm timer shows countdown

**Expected Result:** All data displays correctly, GPS locked, timer countdown accurate

---

### Scenario 2: Race Start Sequence (T-60s to GO)
**Goal:** Timer provides accurate countdown with visual alerts

1. Wait for timer to reach T-60s
2. Verify background turns blue
3. Wait for T-30s → background turns orange
4. Wait for T-10s → background turns red
5. Watch countdown: 10-9-8-7-6-5-4-3-2-1-GO!
6. Verify timer switches to elapsed time
7. Verify background turns green (racing)

**Expected Result:** Color changes smooth, countdown accurate to ±1 second, visual alerts clear

---

### Scenario 3: Active Racing (First 5 minutes)
**Goal:** Track position, speed, and tactical data in real-time

1. Race has started (timer shows elapsed time)
2. Verify GPS position updates every second
3. Check SOG displays current boat speed
4. Check COG displays heading with rotating compass
5. Verify distance to first mark updates
6. Tap drawer to view wind/current overlay
7. Check VMG calculation displays
8. Verify favored side indicator shows correct tack

**Expected Result:** All data updates in real-time, no lag, calculations accurate

---

### Scenario 4: Mark Rounding (Approaching Mark 1)
**Goal:** Use checklist and quick actions during maneuver

1. Expand QuickActionDrawer
2. Check "Check mark identification" item
3. Check "Plan rounding maneuver" item
4. Verify progress bar updates to 40%
5. Check distance to mark < 0.1nm
6. Complete remaining checklist items
7. Verify progress bar reaches 100%

**Expected Result:** Checklist items toggle smoothly, progress updates accurately

---

### Scenario 5: Emergency Situation
**Goal:** Quick access to emergency actions

1. During race, need to signal emergency
2. Tap red emergency button (floating)
3. Verify emergency callback triggers
4. (Future: emergency protocol displays)

**Expected Result:** Emergency button easily accessible, callback fires immediately

---

### Scenario 6: Mode Switching
**Goal:** Switch between PLAN and RACE modes smoothly

1. Start in PLAN mode (map with course overview)
2. Switch to RACE mode → full-screen racing interface appears
3. GPS tracking starts automatically
4. Timer displays correctly
5. Switch back to PLAN mode → course planning interface returns
6. GPS data preserved
7. Switch to RACE mode again → resumes where left off

**Expected Result:** Mode transitions smooth, no data loss, UI responds immediately

---

### Scenario 7: Battery Endurance Test
**Goal:** Verify app can run for 2-hour race

1. Start GPS tracking
2. Run app for 2 hours (or simulated time)
3. Monitor battery drain
4. Verify GPS updates continue at 1Hz
5. Verify trail doesn't cause memory issues
6. Verify timer remains accurate

**Expected Result:** Battery usage acceptable (< 20%/hour), no memory leaks, timer accurate

---

## Automated Testing Commands

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Expected:** Zero errors

### Build Verification
```bash
npm run web
# or
npx expo start
```
**Expected:** Builds successfully, no runtime errors

### Component Imports
```bash
# Verify all components export correctly
npx tsx -e "
import { RaceModeLayout } from './components/races/modes/RaceModeLayout';
import { LiveRaceTimer } from './components/races/LiveRaceTimer';
import { LivePositionTracker } from './components/races/LivePositionTracker';
import { TacticalDataOverlay } from './components/races/TacticalDataOverlay';
import { QuickActionDrawer } from './components/races/QuickActionDrawer';
import { RaceModeSelector } from './components/races/RaceModeSelector';
console.log('✅ All imports successful');
"
```

---

## Known Limitations

1. **Audio Alerts**: Framework in place, needs expo-av integration
2. **Web Platform**: GPS less accurate, not recommended for actual racing
3. **Offline Maps**: Not implemented yet (requires tile caching)
4. **AIS Integration**: Not in Phase 2 scope
5. **Mark Auto-Detection**: Not in Phase 2 scope
6. **Voice Notes**: Button present, recording logic not implemented

---

## Integration Instructions

### To Integrate into races.tsx:

```typescript
// 1. Import components
import { RaceModeLayout } from './components/races/modes/RaceModeLayout';
import { LiveRaceTimer } from './components/races/LiveRaceTimer';
import { LivePositionTracker } from './components/races/LivePositionTracker';
import { TacticalDataOverlay } from './components/races/TacticalDataOverlay';
import { QuickActionDrawer } from './components/races/QuickActionDrawer';

// 2. Add state for GPS position
const [gpsPosition, setGpsPosition] = useState(null);
const [gpsTrail, setGpsTrail] = useState([]);

// 3. Add state for drawer
const [drawerExpanded, setDrawerExpanded] = useState(false);

// 4. Render RACE mode
{currentMode === 'race' && (
  <RaceModeLayout
    raceId={selectedRaceId}
    raceData={selectedRace}
    raceTimer={
      <LiveRaceTimer
        raceStartTime={selectedRace.start_time}
        onAlert={(type) => console.log('Alert:', type)}
      />
    }
    mapComponent={
      <>
        {/* Your existing map component */}
        <LivePositionTracker
          onPositionUpdate={setGpsPosition}
          onTrailUpdate={setGpsTrail}
          targetMark={selectedRace.course?.marks?.[0]}
        />
        <TacticalDataOverlay
          wind={weatherData?.wind}
          current={weatherData?.current}
          position={gpsPosition}
          heading={gpsPosition?.heading}
          speed={gpsPosition?.speed}
          nextMark={selectedRace.course?.marks?.[0]}
        />
      </>
    }
    gpsPosition={gpsPosition}
    onQuickAction={(action) => {
      if (action === 'voice') {
        // TODO: Start voice recording
      } else if (action === 'emergency') {
        // TODO: Show emergency protocol
      }
    }}
  >
    <QuickActionDrawer
      isExpanded={drawerExpanded}
      onToggle={() => setDrawerExpanded(!drawerExpanded)}
      nextMark={selectedRace.course?.marks?.[0]}
      onVoiceNote={() => console.log('Voice note')}
      onEmergency={() => console.log('Emergency!')}
    />
  </RaceModeLayout>
)}
```

---

## Performance Benchmarks

**Target Metrics:**
- UI rendering: 60fps sustained
- GPS update latency: < 100ms
- Timer accuracy: ±1 second over 2 hours
- Battery usage: < 20% per hour
- Memory usage: < 100MB for 2-hour race
- App launch time: < 2 seconds

---

## Sign-Off Criteria

Phase 2 is considered **COMPLETE** when:
- [x] All 7 components implemented
- [ ] TypeScript compilation clean (zero errors)
- [ ] All unit tests pass (when written)
- [ ] Manual testing scenarios 1-7 completed
- [ ] GPS accuracy validated on physical device
- [ ] Timer countdown sequence verified accurate
- [ ] UI rendering at 60fps confirmed
- [ ] Battery usage acceptable (< 20%/hour)
- [ ] Integration instructions tested

---

**Last Updated:** 2025-11-03
**Ready for Testing:** YES
**Recommended Test Device:** iOS/Android physical device with GPS

---

**Next Steps:**
1. Run TypeScript compilation check
2. Test on physical device outdoors
3. Validate GPS accuracy
4. Measure battery usage over 30-minute test
5. Verify timer countdown sequence
6. Test mode switching
7. Sign off on Phase 2
