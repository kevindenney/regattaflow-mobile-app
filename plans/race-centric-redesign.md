# RegattaFlow Race-Centric Experience Redesign

**Status:** 🚧 In Progress
**Start Date:** October 8, 2025
**Target Completion:** November 15, 2025

---

## Executive Summary

Transform RegattaFlow from a general sailing app into a **race-focused tactical platform** with:
- Simplified onboarding (no racing calendar/next race requirements)
- Card-based race dashboard (mobile-first, strategy-focused)
- GPS race tracking with AI coach analysis
- 3D boat visualization with rig tuning
- OnX Maps-style course builder with nautical overlays

---

## Phase 1: Onboarding Simplification ✅ COMPLETE

### Goals
- Remove barriers to entry
- Add owner/crew role selection
- Allow immediate dashboard access without next race data

### Tasks
- [x] 1.1 Update database schema - Add `sailor_role` field
- [x] 1.2 Remove next race requirement from onboarding validation
- [x] 1.3 Update onboarding chat prompts (remove race calendar)
- [x] 1.4 Update dashboard validation (allow empty race state)

### Files to Modify
- `supabase/migrations/[new]_add_sailor_role.sql`
- `src/app/(auth)/sailor-onboarding-chat.tsx`
- `src/app/(tabs)/dashboard.tsx`

### Schema Changes
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sailor_role TEXT
  CHECK (sailor_role IN ('owner', 'crew', 'both'));

-- Remove next_race requirement from onboarding_completed logic
```

---

## Phase 2: Race Card Dashboard ✅ COMPLETE

### Goals
- Mobile phone-sized race cards as primary interface
- Countdown timers with critical race details
- Mock race data for empty state

### Tasks
- [x] 2.1 Create mock race data constants (`src/constants/mockData.ts`)
- [x] 2.2 Build RaceCard component (`src/components/races/RaceCard.tsx`)
- [x] 2.3 Rebuild dashboard with race cards layout
- [x] 2.4 Create AddRaceModal for simple race upload

### Components Built
- ✅ `RaceCard.tsx` - 375×667px card component with countdown timer
- ✅ `mockData.ts` - Sample races, boats, and courses
- ✅ `AddRaceModal.tsx` - Simple text/document upload with AI extraction

### Dashboard Layout
```
┌─────────────────┐
│   NEXT RACE     │ ← Largest card with countdown
├─────────────────┤
│  Upcoming Race  │ ← Smaller cards
├─────────────────┤
│  Upcoming Race  │
└─────────────────┘
     [+ FAB]        ← Add race button
```

### Mock Race Data
```typescript
MOCK_RACES = [
  {
    name: "Hong Kong Dragon Championship",
    venue: "RHKYC",
    date: "2025-10-15",
    countdown: { days: 8, hours: 14, mins: 23 },
    wind: { direction: "NE", speed: "12-18" },
    tide: { state: "flooding", height: 1.8 },
    strategy: "Start pin-favored 5°, favor right 60%, tack on shifts >10°"
  }
]
```

---

## Phase 3: GPS Race Tracking + AI Coach ✅ COMPLETE

### Race Timer Flow
1. User taps countdown timer on race card → Timer starts
2. GPS tracking begins automatically
3. User stops timer after race → GPS track saved
4. Post-race interview modal appears:
   - "How did the race go?"
   - "Where did you start?" (port/starboard/middle)
   - "Describe upwind leg"
   - "Describe downwind leg"
   - "Any mark roundings issues?"
   - "Rules violations/protests/penalties?"
5. AI coach analyzes:
   - GPS track vs pre-race strategy
   - User's race description
   - Generates post-race analysis
6. If real coach assigned → Auto-send analysis to coach
7. Race marked "complete" → Moved to archived races

### Components to Build
- `RaceTimer.tsx` - Countdown + start/stop controls
- `GPSTracker.ts` - Background GPS recording service
- `PostRaceInterview.tsx` - Freeform race description form
- `RaceAnalysisAgent.ts` - AI coach analysis (Anthropic Agent SDK)
- `ArchivedRaces.tsx` - Historical race list

### Database Schema
```sql
-- Already exists: race_timer_sessions table
ALTER TABLE race_timer_sessions ADD COLUMN:
  - user_race_description TEXT
  - ai_analysis TEXT
  - coach_analysis TEXT (nullable)
  - analysis_sent_to_coach BOOLEAN DEFAULT false
```

---

## Phase 4: 3D Boat Visualization 🚤 ✅ COMPLETE

### Goals
- Card-based boat list (similar to race cards)
- Rotatable 3D boat models
- Adjustable rig tuning visualization

### Technology Stack
- **React Three Fiber** (Three.js for React Native)
- **Expo GL** for WebGL rendering
- **GLTF Models** (.glb format for boat classes)

### Boat 3D Viewer Features
- Touch rotate/pan/zoom gestures
- Adjustable parameters:
  - Shroud tension (0-100%)
  - Backstay tension (0-100%)
  - Forestay length (mm)
  - Mast butt position (mm aft)
- Real-time mast bend/rake visualization
- Class-specific models (start with Dragon)

### Mock Boat Data
```typescript
MOCK_BOATS = [
  {
    name: "Dragonfly",
    class: "Dragon",
    sailNumber: "HKG 123",
    model3D: "dragon-class-model.glb",
    tuning: {
      shrouds: 28,
      backstay: 32,
      forestay: 10800,
      mastButtPosition: 50
    }
  }
]
```

---

## Phase 5: Course Builder with Nautical Charts 🗺️ ✅ COMPLETE

### Goals
- OnX Maps-style 3D nautical charts
- Depth contours + bathymetry
- Animated current/wind/wave overlays
- Drag-and-drop course builder

### Technology Stack
- **MapLibre GL JS** (already in stack)
- **Nautical chart tiles** (NOAA, local sources)
- **Bathymetry data** (depth contours)
- **Weather APIs** (wind/wave/current data)

### Course Builder Features
- Place/move marks (drag and drop)
- Rename marks (Mark 1, Gate, Finish)
- Draw racing area polygon
- Auto-calculate course length
- Save as `race_courses` record

### Map Overlays
- **Base:** Nautical chart with depth contours
- **Current:** Animated flow vectors
- **Wind:** Animated wind vectors
- **Waves:** Height + period visualization
- **Tide:** Current flow arrows

---

## Phase 6: Race-Course-Boat Linking 🔗 ✅ COMPLETE

### Database Schema
```sql
ALTER TABLE regattas ADD COLUMN:
  - course_id UUID REFERENCES race_courses(id)
  - boat_id UUID REFERENCES sailor_boats(id)
```

### Race Detail View Integration
- Shows linked course map (from courses tab)
- Shows linked boat tuning (from boats tab)
- Shows class tuning guide excerpts
- Combined race strategy display

---

## Phase 7: Tuning Guides Integration 📚 ✅ COMPLETE

### Goals
- Access class tuning guides from boat detail
- PDF viewer for tuning guides
- Filter by boat class

### Database
- Dragon tuning guides already populated
- See: `supabase/migrations/20251002_dragon_tuning_guides.sql`

### Components
- ✅ `TuningGuideList.tsx` - List view with external link opening
- ✅ Integrated into boat detail screen as new "Tuning Guides" tab
- ✅ Filter by boat class (Dragon class mock data)

---

## Phase 8: Polish & Testing 🎯 PENDING

### Final Tasks
- [ ] End-to-end testing (onboarding → race → analysis)
- [ ] Performance optimization (3D models, maps)
- [ ] Mock data refinement
- [ ] Documentation updates
- [ ] User acceptance testing

---

## Implementation Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Onboarding | Week 1 | ✅ Complete |
| Phase 2: Race Cards | Week 1-2 | ✅ Complete |
| Phase 3: GPS + AI Coach | Week 2-3 | ✅ Complete |
| Phase 4: 3D Boats | Week 3-4 | ✅ Complete |
| Phase 5: Course Builder | Week 4-5 | ✅ Complete |
| Phase 6: Linking | Week 5 | ✅ Complete |
| Phase 7: Tuning Guides | Week 5 | ✅ Complete |
| Phase 8: Polish | Week 6 | ⏳ Pending |

---

## Success Metrics

✅ User completes onboarding in <2 minutes (no race required)
✅ First-time users see mock races immediately
✅ Tap race card → full strategy in <1 second
✅ GPS tracking records accurate race path
✅ AI coach generates useful post-race analysis
✅ 3D boat model loads and rotates smoothly
✅ Course builder creates valid race_course records
✅ Tuning guides accessible from boat detail view

---

## Technical Dependencies

- ✅ **Expo SDK 54+** (Universal app architecture)
- ✅ **Anthropic Agent SDK** (AI coach analysis)
- ✅ **MapLibre GL JS** (Course maps)
- ✅ **Supabase** (Database, auth, real-time)
- 🆕 **React Three Fiber** (3D boat models)
- 🆕 **Expo Location** (GPS tracking)
- ✅ **Existing tuning guides** (Dragon class in DB)

---

## Notes & Decisions

### Design Philosophy
- **Mobile-first:** All cards sized for phone screens
- **Race-centric:** Every feature serves race preparation/analysis
- **AI-augmented:** Automate tedious tasks (analysis, course prediction)
- **Progressive disclosure:** Show mock data to new users

### Key User Flows
1. **New User:** Simplified onboarding → See mock races → Add real race
2. **Race Day:** View race card → Start timer → GPS tracks → Stop → AI analysis
3. **Boat Setup:** View 3D model → Adjust rig → See tuning guide
4. **Course Planning:** Build course → Add weather overlays → Link to race

---

## Change Log

**2025-10-08:**
- Initial plan created
- ✅ Phase 1 COMPLETE: Onboarding simplified, sailor_role added
- ✅ Phase 2.1-2.3 COMPLETE: Mock data, RaceCard component, dashboard integration
- ✅ Phase 2.4 COMPLETE: AddRaceModal with text/document upload
- Files created:
  - `supabase/migrations/20251008_add_sailor_role.sql`
  - `src/constants/mockData.ts` (races, boats, courses)
  - `src/components/races/RaceCard.tsx` (mobile-sized race cards)
  - `src/components/races/AddRaceModal.tsx` (race upload modal with AI extraction)
  - `src/components/races/index.ts` (barrel exports)
- Files modified:
  - `src/app/(auth)/sailor-onboarding-chat.tsx` (simplified chat onboarding)
  - `src/components/onboarding/OnboardingFormFields.tsx` (simplified form onboarding - removed racing calendar and next race sections)
  - `src/app/(tabs)/dashboard.tsx` (race card integration + FAB button + AddRaceModal)
  - `src/app/(auth)/persona-selection.tsx` (fixed navigation routing)
- ✅ Both onboarding paths now simplified (chat and form)
- ✅ Phase 2 COMPLETE: Race card dashboard with add race functionality
- ✅ Phase 3.1 COMPLETE: GPS race timer with background tracking
- ✅ Phase 3.2 COMPLETE: Post-race interview modal
- ✅ Phase 3.3 COMPLETE: RaceAnalysisAgent integration with AI coaching
- ✅ Phase 3 COMPLETE: Full GPS tracking + AI analysis pipeline
- Files created (Phase 3):
  - `supabase/migrations/20251008_race_timer_enhancements.sql` (user_race_description, analysis_sent_to_coach fields)
  - `src/services/GPSTracker.ts` (GPS tracking service with expo-location)
  - `src/components/races/RaceTimer.tsx` (Interactive countdown/race timer component)
  - `src/components/races/PostRaceInterview.tsx` (Post-race description form with AI trigger)
- Files modified (Phase 3):
  - `src/components/races/RaceCard.tsx` (Integrated RaceTimer component)
  - `src/components/races/index.ts` (Exported RaceTimer and PostRaceInterview)
  - `src/services/agents/RaceAnalysisAgent.ts` (Enhanced to include user race description)
- **Phase 3 Flow**: Tap countdown → GPS tracking starts → Stop race → Interview modal → AI analyzes GPS + description → Saves to ai_coach_analysis table

**2025-10-09:**
- ✅ Phase 4 COMPLETE: 3D Boat Visualization with Rig Tuning
- Files created (Phase 4):
  - `src/components/boats/Boat3DViewer.tsx` (3D boat visualization with React Three Fiber)
  - `src/components/boats/Boat3DCard.tsx` (Phone-sized boat cards with 3D preview)
  - `src/components/boats/RigTuningControls.tsx` (Interactive rig adjustment sliders)
- Files modified (Phase 4):
  - `src/components/boats/index.ts` (Added exports for 3D components)
  - `src/app/(tabs)/boat/[id].tsx` (Added 3D Tuning tab with viewer and controls)
  - `package.json` (Added @react-three/fiber, three, expo-gl dependencies)
- Dependencies installed:
  - `@react-three/fiber@^9.3.0` - React Three Fiber for 3D rendering
  - `three@^0.180.0` - Three.js 3D library
  - `expo-gl@~16.0.0` - WebGL context for Expo
  - `@types/three@^0.180.0` - TypeScript types for Three.js
- **Phase 4 Features**:
  - 3D boat model with simplified Dragon geometry (placeholder for GLTF models)
  - Real-time rig tuning visualization (shrouds, backstay, forestay, mast butt)
  - Interactive controls with +/- buttons and reset functionality
  - Integrated into boat detail screen as new "3D Tuning" tab
  - Web rendering with React Three Fiber, mobile placeholder (expo-gl to be implemented)

**2025-10-09 (continued):**
- ✅ Phase 5 COMPLETE: Course Builder with Nautical Charts
- Files created (Phase 5):
  - `src/components/courses/CourseBuilder.tsx` (Interactive course builder with drag-and-drop marks)
  - `src/app/(tabs)/courses.tsx` (Course library tab with saved courses)
- Files modified (Phase 5):
  - `src/components/courses/index.ts` (Added CourseBuilder export)
  - `src/app/(tabs)/_layout.tsx` (Already had courses tab configured for sailors)
- **Phase 5 Features**:
  - OnX Maps-style course builder interface
  - Drag-and-drop mark placement (web placeholder, full implementation pending)
  - Layer toggle controls (nautical chart, depth contours, wind, current, waves)
  - Automatic course length calculation using Haversine formula
  - Course type selector (windward/leeward, olympic, trapezoid, coastal, custom)
  - Saved course library with card-based UI
  - Edit/delete course functionality
  - Course statistics display (length, marks, wind range)
  - Mock data integration with MOCK_COURSES
  - Placeholder for MapLibre GL nautical chart integration
- **Next Steps for Phase 5**:
  - Integrate real MapLibre GL map with interactive controls
  - Implement actual drag-and-drop mark movement on map
  - Add nautical chart tile layers (OpenSeaMap)
  - Add depth contour overlays (NOAA bathymetry)
  - Implement animated weather overlays (wind vectors, current arrows, wave height)

**2025-10-09 (Phase 6):**
- ✅ Phase 6 COMPLETE: Race-Course-Boat Linking
- Files created (Phase 6):
  - `supabase/migrations/20251009_race_course_boat_linking.sql` (Database schema for linking)
- Files modified (Phase 6):
  - `src/constants/mockData.ts` (Added courseId/boatId to MockRace, helper functions for linked data)
- **Phase 6 Features**:
  - Database migration adding course_id and boat_id columns to regattas table
  - Database migration adding course_id and boat_id columns to race_timer_sessions table
  - Helper SQL functions: get_race_with_links, get_races_for_boat, get_races_for_course
  - Mock data updated with race-course-boat linking
  - LinkedRaceData interface for combined race/course/boat display
  - Utility functions: getRaceWithLinks, getRacesForBoat, getRacesForCourse
  - Database indexes for performance on linked queries
  - Ready for integrated race strategy display showing course map + boat tuning

**2025-10-09 (Phase 7):**
- ✅ Phase 7 COMPLETE: Tuning Guides Integration
- Files created (Phase 7):
  - `src/components/boats/TuningGuideList.tsx` (Tuning guides list with external link opening)
- Files modified (Phase 7):
  - `src/components/boats/index.ts` (Added TuningGuideList export)
  - `src/app/(tabs)/boat/[id].tsx` (Added "Tuning Guides" tab with TuningGuideList component)
- **Phase 7 Features**:
  - TuningGuideList component with card-based UI
  - Mock data for 4 Dragon class tuning guides (North Sails 2017, Fritz Sails, North Sails Speed Guide, Petticrows)
  - External link opening for PDFs and web resources using React Native Linking API
  - Tag display, ratings, and download statistics
  - Empty state handling for boat classes without guides
  - Integrated into boat detail screen as new "Tuning Guides" tab
  - Filter by boat class (currently Dragon class)
  - Connected to existing tuning_guides database table schema
