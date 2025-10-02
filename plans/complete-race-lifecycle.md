# Complete Race Lifecycle System Implementation Plan
*Living Document - Created: September 30, 2025*

**Status:** 🟡 In Progress
**Progress:** 2/45 features complete (4%)

## Quick Links
- [Master Plan](./regattaflow-master-plan.md)
- [Sailor Experience](./sailor-experience.md)
- [Race Strategy Planning](./race-strategy-planning.md)
- [OnX Maps Advanced Mapping](./onx-maps-advanced-mapping-system.md)

## Overview

This plan implements the complete race lifecycle for sailors from Notice of Race receipt through post-race coaching analysis. Integrates existing services into a seamless "OnX Maps for Sailing" experience.

### User Flow
```
NOR/SI Upload → AI Course Extraction → 3D Strategy Visualization
  ↓
Weather/Conditions → Auto-Strategy Updates → Boat Tuning → Crew Selection
  ↓
Race Day: GPS Tracking + Real-Time AI Tactical Guidance
  ↓
Post-Race: Track Analysis → AI Debrief → Coach Report
```

---

## Phase 1: Pre-Race Planning 🔵
**Objective:** Transform documents and conditions into actionable race strategy

### 1.1 Document Upload & AI Parsing
**File:** `src/app/race/[id].tsx` → Documents Tab

- [ ] Add document upload button to Documents tab
- [ ] Integrate `expo-document-picker` for PDF/image selection
- [ ] Wire up `RaceCourseExtractor` service
- [ ] Display parsing progress (stages: uploading → parsing → extracting)
- [ ] Show extraction results:
  - [ ] Course layout (windward-leeward, triangle, custom)
  - [ ] Mark positions and names
  - [ ] Start sequences and times
  - [ ] VHF channels
  - [ ] Special flags and rules
  - [ ] Racing boundaries
- [ ] Display confidence score for extraction
- [ ] Allow manual correction of extracted data
- [ ] Auto-populate race metadata from extraction
- [ ] Store document with race_id linkage

**Dependencies:** `RaceCourseExtractor` (✅ exists), `DocumentStorageService` (✅ exists)

**Success Metrics:**
- Can upload PDF/image and see extracted course data
- Auto-fills race name, venue, schedule
- >85% extraction accuracy on test documents

---

### 1.2 3D Course Visualization & Strategy (OnX Maps Style)
**File:** `src/app/race/[id].tsx` → Strategy Tab

- [ ] Convert Strategy tab to full-screen map interface
- [ ] Integrate `OnXMapsInterface` component
- [ ] Display extracted course on 3D map
- [ ] Implement OnX-style layer controls:
  - [ ] **Base Layer**: Course with marks, start/finish lines
  - [ ] **Weather Layer**: Animated wind arrows, forecast overlay
  - [ ] **Tide/Current Layer**: Flow visualization with timing
  - [ ] **Tactical Layer**: Laylines, favored sides, zones
  - [ ] **Bathymetry Layer**: Depth shading
  - [ ] **Satellite Layer**: High-res imagery
- [ ] Layer toggle controls (bottom-left, OnX style)
- [ ] Zoom/pan controls (right side)
- [ ] Course mark info popups
- [ ] Integrate `RaceStrategyEngine` for AI strategy
- [ ] Display strategy panel (collapsible overlay):
  - [ ] Overall approach summary
  - [ ] Start strategy with confidence
  - [ ] Upwind tactical plan
  - [ ] Mark approach recommendations
  - [ ] Downwind strategy
  - [ ] Key decision points on map
- [ ] Strategy confidence scoring
- [ ] Save/version strategies

**Dependencies:**
- `OnXMapsInterface` (✅ exists)
- `RaceStrategyEngine` (✅ exists)
- `MapLibreService` (✅ exists)
- Course extraction from 1.1

**Success Metrics:**
- Full-screen map with course overlay
- 6 layer types toggleable
- AI strategy generated with >0.7 confidence
- Strategy updates when layers toggle

---

### 1.3 Environmental Intelligence & Auto-Updates
**File:** `src/app/race/[id].tsx` → Weather/Conditions Panel

- [ ] Add weather panel to Strategy tab (collapsible bottom)
- [ ] Integrate `RegionalWeatherService`
- [ ] Integrate `WorldTidesProService`
- [ ] Display current conditions:
  - [ ] Wind speed, direction, gusts
  - [ ] Wave height, period
  - [ ] Tide phase, current strength
  - [ ] Visibility, temperature
- [ ] Show forecast timeline for race window
- [ ] Multiple weather model comparison
- [ ] Forecast confidence indicators
- [ ] Timeline scrubber (select time, see map update)
- [ ] **Auto-Strategy Updates:**
  - [ ] Background polling for forecast changes
  - [ ] Detect significant condition changes (>5kt wind, >10° shift)
  - [ ] Auto-regenerate strategy
  - [ ] Show notification: "Strategy updated - conditions changed"
  - [ ] Compare old vs new strategy
- [ ] Manual refresh button
- [ ] Forecast accuracy tracking

**Dependencies:**
- `RegionalWeatherService` (✅ exists)
- `WorldTidesProService` (✅ exists)
- `VenueDetectionService` (✅ exists)
- Strategy from 1.2

**Success Metrics:**
- Weather updates every 15 minutes
- Strategy auto-regenerates on significant change
- Timeline scrubber shows conditions at any time
- 3+ weather models compared

---

### 1.4 Boat Tuning & Equipment Setup
**File:** `src/app/race/[id].tsx` → Equipment Tab

- [ ] Replace empty state with tuning interface
- [ ] Integrate `EquipmentAIService`
- [ ] Display boat/class info (from selected class)
- [ ] Generate AI tuning recommendations:
  - [ ] Shroud tension (lbs)
  - [ ] Forestay length
  - [ ] Mast rake (degrees)
  - [ ] Spreader angle
  - [ ] Sail selection (heavy/medium/light)
  - [ ] Reef points if applicable
- [ ] Show tuning for current conditions
- [ ] Compare to past races in similar conditions
- [ ] Link to class tuning guide (if available)
- [ ] Save tuning settings
- [ ] Add to Next Race Card rig settings
- [ ] Manual override controls
- [ ] Notes section for custom setup

**Dependencies:**
- `EquipmentAIService` (✅ exists)
- `TuningGuideService` (✅ exists)
- Weather data from 1.3
- Class selection from dashboard

**Success Metrics:**
- AI-generated tuning for race conditions
- Compares to 3+ past races
- Tuning guide linked if available
- Settings appear on Next Race Card

---

### 1.5 Crew Selection & Management
**File:** `src/app/race/[id].tsx` → Crew Tab

- [ ] Replace empty state with crew manager
- [ ] Integrate `CrewManagementService`
- [ ] Display crew roster interface:
  - [ ] Add crew from contacts
  - [ ] Assign positions (helm, main, jib, bow, etc.)
  - [ ] Role-specific notes
  - [ ] Contact info (phone, email)
  - [ ] Availability status
- [ ] Send race details to crew:
  - [ ] Race info, venue, time
  - [ ] Weather forecast
  - [ ] Strategy summary
  - [ ] What to bring
- [ ] Crew confirmation tracking
- [ ] Substitute suggestions if unavailable
- [ ] Crew experience/skills tracking
- [ ] Past races together stats
- [ ] Share strategy with crew (optional)

**Dependencies:**
- `CrewManagementService` (✅ exists)
- Race data from creation
- Strategy from 1.2 (for sharing)

**Success Metrics:**
- Can assign crew to positions
- Send race info via SMS/email/WhatsApp
- Track confirmations
- Stats show past crew performance

---

### 1.6 Special Rules & Flags Highlighting
**File:** `src/app/race/[id].tsx` → Strategy Tab → Rules Panel

- [ ] Extract special rules from sailing instructions
- [ ] Create rules reference panel (overlay)
- [ ] Highlight key rules:
  - [ ] Starting penalties (P, I, Z, Black Flag)
  - [ ] Protest time limits
  - [ ] Scoring system (Low point, bonus points)
  - [ ] Course length/time limits
  - [ ] Equipment restrictions
  - [ ] Safety requirements
- [ ] Flag meaning quick reference
- [ ] Rule changes from standard RRS
- [ ] Searchable rule text
- [ ] Bookmark important rules
- [ ] Share with crew

**Dependencies:**
- Document parsing from 1.1
- Course extraction data

**Success Metrics:**
- Special rules automatically extracted
- Flag reference accessible
- Rule changes highlighted in red
- Quick search finds rules

---

## Phase 2: During Race ⚡
**Objective:** Real-time GPS tracking with AI tactical guidance

### 2.1 Full-Screen Race Mode
**File:** `src/app/race/[id].tsx` → Overview Tab → Start Race Button

- [ ] Add "Start Race" button to Overview tab
- [ ] Create full-screen race mode screen
- [ ] Show 3D map with course
- [ ] Display current position (GPS)
- [ ] Show countdown timer (move from NextRaceCard)
- [ ] Real-time wind/conditions overlay
- [ ] Competitor positions (if available from AIS)
- [ ] Mark distances and bearings
- [ ] VMG display
- [ ] Speed, heading, COG
- [ ] Exit race mode button
- [ ] Minimize to continue tracking in background

**Dependencies:**
- GPS tracking from `NextRaceCard` (✅ partially exists)
- `Location` services (✅ exists)
- Map from 1.2
- Course data from 1.1

**Success Metrics:**
- Full-screen map with boat position
- Timer, distance to marks visible
- Can minimize and continue tracking
- Battery-optimized GPS sampling

---

### 2.2 Real-Time AI Tactical Guidance
**File:** Race Mode → Tactical Overlay

- [ ] Integrate `AITacticalService`
- [ ] Real-time tactical analysis:
  - [ ] Layline calculations (port/starboard)
  - [ ] Wind shift detection
  - [ ] Optimal tack/jibe points
  - [ ] Mark approach recommendations
  - [ ] Crossing opportunities
  - [ ] Risk assessment
- [ ] Display tactical advice cards:
  - [ ] Priority (critical/high/medium/low)
  - [ ] Action items
  - [ ] Reasoning
  - [ ] Time-sensitive indicators
- [ ] Voice notifications (optional):
  - [ ] "Approaching port layline"
  - [ ] "Wind shift detected - 10° right"
  - [ ] "Tack recommended in 30 seconds"
- [ ] Tactical overlay on map:
  - [ ] Laylines (dashed lines)
  - [ ] Optimal course (green path)
  - [ ] Wind shifts (arrows)
  - [ ] Competitor vectors
- [ ] Log AI advice with timestamps

**Dependencies:**
- `AITacticalService` (✅ exists)
- GPS position from 2.1
- Weather data (live)
- Course marks from 1.1

**Success Metrics:**
- Laylines update every 10 seconds
- Tactical advice relevant to race phase
- Voice notifications configurable
- Advice logged for post-race review

---

### 2.3 GPS Track Recording & Live Data
**File:** Race Mode → Track Recording

- [ ] ✅ Start/stop GPS tracking (already in NextRaceCard)
- [ ] Enhance tracking:
  - [ ] Record every 1 second or 5 meters
  - [ ] Store position, speed, heading, timestamp
  - [ ] Record conditions (wind, current) at each point
  - [ ] Tag key events:
    - [ ] Start gun
    - [ ] Tacks/jibes
    - [ ] Mark roundings
    - [ ] Finish
  - [ ] Manual event tagging during race
  - [ ] Background tracking (don't stop if app minimized)
- [ ] Live track on map (breadcrumb trail)
- [ ] Distance sailed counter
- [ ] Average speed, VMG stats
- [ ] Save track to race record

**Dependencies:**
- GPS from `NextRaceCard` (✅ exists)
- `Location` watchPosition (✅ exists)
- Weather services for conditions

**Success Metrics:**
- ✅ GPS points recorded (already working)
- Track continues in background
- Events tagged automatically and manually
- Conditions stored with each point

---

## Phase 3: Post-Race 📊
**Objective:** AI-powered analysis, debrief, and coaching

### 3.1 GPS Track Analysis & Visualization
**File:** `src/app/race/[id].tsx` → Tracks Tab

- [ ] Replace empty state with track viewer
- [ ] Display list of recorded tracks:
  - [ ] Race date/time
  - [ ] Duration
  - [ ] Distance sailed
  - [ ] Conditions
  - [ ] Result (if entered)
- [ ] Track playback on 3D map:
  - [ ] Play/pause controls
  - [ ] Speed controls (1x, 2x, 5x, 10x)
  - [ ] Timeline scrubber
  - [ ] Show boat position animated
- [ ] Overlay actual conditions during race:
  - [ ] Wind arrows at intervals
  - [ ] Current flows
  - [ ] Tide phase changes
- [ ] Performance analysis:
  - [ ] VMG calculations (upwind/downwind)
  - [ ] Tack angles and efficiency
  - [ ] Mark approach analysis
  - [ ] Speed in different conditions
  - [ ] Course optimization (compare to optimal)
- [ ] Compare to pre-race strategy:
  - [ ] Planned vs actual course
  - [ ] Strategy adherence score
  - [ ] Decision point review
- [ ] Highlight key moments:
  - [ ] Good decisions (green markers)
  - [ ] Missed opportunities (yellow markers)
  - [ ] Errors/issues (red markers)
- [ ] Export track (GPX format)
- [ ] Share track with crew/coach

**Dependencies:**
- GPS track from 2.3
- Map from 1.2
- Strategy from 1.2
- Weather/condition data

**Success Metrics:**
- Track playback smooth and accurate
- VMG analysis shows upwind/downwind
- Comparison to strategy quantified
- Key moments automatically identified

---

### 3.2 AI Debrief Conversation
**File:** `src/app/race/[id].tsx` → Tracks Tab → Debrief Button

- [ ] Add "Start Debrief" button to track view
- [ ] Integrate `StrategyChatInterface`
- [ ] Integrate `VoiceNoteService`
- [ ] Create debrief conversation flow:
  - [ ] AI asks about key moments
  - [ ] "How was the start?"
  - [ ] "Why did you tack at mark 1?"
  - [ ] "Conditions vs expected?"
  - [ ] Text or voice responses
  - [ ] Follow-up questions based on responses
- [ ] Show track context during conversation:
  - [ ] Map highlights moment being discussed
  - [ ] Conditions at that time
  - [ ] What strategy recommended
- [ ] Generate structured debrief document:
  - [ ] Start performance
  - [ ] Key decisions and reasoning
  - [ ] What went well
  - [ ] What to improve
  - [ ] Conditions analysis
  - [ ] Lessons learned
- [ ] Save debrief with race
- [ ] Tag learnings for future races
- [ ] Export debrief (PDF, text)

**Dependencies:**
- `StrategyChatInterface` (✅ exists)
- `VoiceNoteService` (✅ exists)
- Track data from 3.1
- AI analysis results

**Success Metrics:**
- Voice and text input both work
- AI asks relevant questions about race
- Debrief document structured and useful
- Learnings tagged for future reference

---

### 3.3 AI Coach Analysis & Report
**File:** `src/app/race/[id].tsx` → Tracks Tab → Coach Analysis

- [ ] Integrate `AICoachingAssistant`
- [ ] Generate comprehensive coaching report:
  - [ ] **Start Analysis:**
    - [ ] Line bias assessment
    - [ ] Position at gun
    - [ ] Acceleration and pointing
    - [ ] Traffic management
  - [ ] **Upwind Performance:**
    - [ ] Tacking decisions
    - [ ] Layline approach
    - [ ] Wind shift response
    - [ ] Boat speed vs conditions
  - [ ] **Mark Roundings:**
    - [ ] Approach angle
    - [ ] Speed through rounding
    - [ ] Exit strategy
  - [ ] **Downwind Performance:**
    - [ ] Jibing decisions
    - [ ] VMG optimization
    - [ ] Wave riding
  - [ ] **Strategic Decisions:**
    - [ ] Course side selection
    - [ ] Risk management
    - [ ] Competitor interactions
  - [ ] **Areas for Improvement:**
    - [ ] Technical skills
    - [ ] Tactical awareness
    - [ ] Speed optimization
    - [ ] Mental game
  - [ ] **Action Items:**
    - [ ] Specific drills to practice
    - [ ] Video/resources to study
    - [ ] Focus areas for next race
- [ ] Scoring system (1-10 for each area)
- [ ] Comparison to past races
- [ ] Trend analysis (improving/declining areas)
- [ ] Visual charts and graphs
- [ ] Export report (PDF)

**Dependencies:**
- `AICoachingAssistant` (✅ exists)
- Track analysis from 3.1
- Debrief from 3.2
- Historical race data

**Success Metrics:**
- Report covers all race phases
- Scores quantify performance
- Trends show improvement over time
- Actionable recommendations provided

---

### 3.4 Coach Sharing & Feedback
**File:** Coach Analysis → Share Button

- [ ] Check if coach is attached to sailor
- [ ] Integrate `CoachService`
- [ ] Auto-send report to coach:
  - [ ] Race summary
  - [ ] Track playback link
  - [ ] AI analysis
  - [ ] Debrief notes
- [ ] Coach feedback interface:
  - [ ] Coach can add comments on report
  - [ ] Video markup (if video uploaded)
  - [ ] Text/voice feedback
  - [ ] Schedule follow-up session
- [ ] Notification to sailor when coach responds
- [ ] Threaded conversation
- [ ] Session booking integration
- [ ] Payment if session booked

**Dependencies:**
- `CoachService` (✅ exists)
- Coach marketplace functionality
- Report from 3.3
- Messaging system

**Success Metrics:**
- Report auto-sent to coach if attached
- Coach can add feedback
- Sailor notified of coach response
- Can book session from feedback

---

### 3.5 Results Entry & External Linking
**File:** `src/app/race/[id].tsx` → Results Tab

- [ ] Replace empty state with results form
- [ ] Manual results entry:
  - [ ] Finish position
  - [ ] Fleet size
  - [ ] Points scored
  - [ ] Time (elapsed, corrected)
  - [ ] Notes about race
  - [ ] Conditions rating (1-5)
  - [ ] Strategy effectiveness (1-5)
- [ ] Integrate `ExternalResultsService`
- [ ] Link to external results:
  - [ ] Show imported results from Sailwave/RN
  - [ ] "Claim this result" button
  - [ ] Auto-match by sail number, name, venue
  - [ ] Confirm match
  - [ ] Pull in full results data
- [ ] Results display:
  - [ ] Position badge (podium colors)
  - [ ] Points breakdown
  - [ ] Corrected time if applicable
  - [ ] Full race results (where finished vs others)
- [ ] Update performance stats
- [ ] Link result to track if available
- [ ] Share result with crew

**Dependencies:**
- `ExternalResultsService` (✅ exists)
- Race data from creation
- Track from 3.1 (optional)

**Success Metrics:**
- Can manually enter results
- External results auto-matched
- "Claim result" links to race entry
- Results appear in performance history

---

## Phase 4: Discovery & Import 🔍
**Objective:** Make race entry frictionless, enable network effects

### 4.1 Document-First Race Creation
**File:** `src/app/race/add.tsx` → Add Upload Option

- [ ] Add "Upload Document" as race creation method
- [ ] Document upload flow:
  - [ ] Select PDF/image/URL
  - [ ] AI extracts race info (via `RaceCourseExtractor`)
  - [ ] Show preview of extracted data:
    - [ ] Race name
    - [ ] Venue
    - [ ] Dates (start/end)
    - [ ] Class (if detected)
  - [ ] Edit extracted fields
  - [ ] Confirm and create race
- [ ] Auto-link document to race
- [ ] Course already parsed for strategy
- [ ] Redirect to race detail → strategy tab

**Dependencies:**
- `RaceCourseExtractor` (✅ exists)
- Add race form (✅ exists)
- Document upload from 1.1

**Success Metrics:**
- PDF upload creates race in <30 seconds
- 85%+ extraction accuracy
- Faster than manual entry
- Course pre-loaded for strategy

---

### 4.2 Venue-Based Smart Suggestions
**File:** `src/app/(tabs)/dashboard.tsx` → Race Calendar

- [ ] Integrate venue intelligence
- [ ] Build annual race calendar per venue
- [ ] Detect upcoming races at current venue:
  - [ ] Use `VenueDetectionService` for location
  - [ ] Check venue race history (same event annually)
  - [ ] Predict race dates (±1 week from last year)
- [ ] Show notification:
  - [ ] "RHKYC Dragon Championship in 42 days"
  - [ ] "Add to calendar?" button
  - [ ] Pre-filled with historical data
- [ ] One-tap race creation
- [ ] Community validation:
  - [ ] Show if other sailors added it
  - [ ] "5 sailors racing this event"
  - [ ] Confidence indicator

**Dependencies:**
- `VenueDetectionService` (✅ exists)
- `GlobalVenueDatabase` (✅ exists)
- Historical race data
- GPS location

**Success Metrics:**
- Suggests races 30+ days in advance
- 70%+ accuracy on predictions
- Shows community participation
- One-tap adds race

---

### 4.3 External Calendar Integration
**File:** Settings → Calendar Sync

- [ ] Add calendar sync settings
- [ ] Support iCal/Google Calendar URLs
- [ ] Background sync:
  - [ ] Poll calendar every 24 hours
  - [ ] Detect new sailing events
  - [ ] Match to venues in database
  - [ ] Suggest race creation
- [ ] Show discovered races:
  - [ ] "3 races found in RHKYC calendar"
  - [ ] Import individually or bulk
  - [ ] Auto-sync toggle
- [ ] Two-way sync (optional):
  - [ ] Add RegattaFlow races to external calendar
  - [ ] Update external calendar with results

**Dependencies:**
- Calendar API integration
- Venue matching
- Event parsing

**Success Metrics:**
- Can subscribe to club calendars
- Auto-discovers sailing events
- Bulk import works
- Bidirectional sync optional

---

### 4.4 Community Race Discovery
**File:** New screen: Browse Races

- [ ] Create race discovery screen
- [ ] Search interface:
  - [ ] By venue
  - [ ] By class
  - [ ] By date range
  - [ ] By location (nearby)
- [ ] Show races other sailors added:
  - [ ] Race name, venue, date
  - [ ] Class
  - [ ] Number of participants
  - [ ] Distance from user
- [ ] Race detail view:
  - [ ] Full race info
  - [ ] Venue intelligence
  - [ ] Weather outlook
  - [ ] Sailors registered
  - [ ] "Add to my calendar" button
- [ ] Join race:
  - [ ] Creates race entry for user
  - [ ] Copies documents if shared
  - [ ] Links to community instance
- [ ] Social features:
  - [ ] See who's racing
  - [ ] Chat with participants
  - [ ] Share crew needs

**Dependencies:**
- Race database with privacy settings
- Community/social features
- Venue data

**Success Metrics:**
- Can find races within 50 miles
- Shows 100+ races globally
- "Add to calendar" creates race entry
- Can connect with other sailors

---

### 4.5 Photo Results Import (OCR)
**File:** Results Tab → Add from Photo

- [ ] Add "Scan Results" button
- [ ] Integrate `ComputerVisionService`
- [ ] Camera capture:
  - [ ] Take photo of results board
  - [ ] Crop to results table
  - [ ] OCR extract
- [ ] Parse results table:
  - [ ] Column detection (position, name, sail #, points)
  - [ ] Row extraction
  - [ ] Find user's result (by name/sail number)
- [ ] Confidence scoring
- [ ] Manual correction interface
- [ ] Save result to race
- [ ] Offer to create race if not exists

**Dependencies:**
- `ComputerVisionService` (✅ exists)
- OCR library
- Camera access

**Success Metrics:**
- Can extract results from photo
- Finds user's result automatically
- 80%+ OCR accuracy
- Correction UI for errors

---

### 4.6 Smart Race Templates
**File:** Add Race → Templates

- [ ] Create race template system
- [ ] Common race types:
  - [ ] Club series race
  - [ ] Championship regatta
  - [ ] Practice session
  - [ ] Training day
- [ ] Templates include:
  - [ ] Typical course layout
  - [ ] Standard schedule
  - [ ] Equipment requirements
  - [ ] Pre-filled crew
- [ ] Class-specific templates:
  - [ ] Dragon: Typical windward-leeward
  - [ ] J/70: Reaching courses
  - [ ] Optimist: Short course
- [ ] Venue templates:
  - [ ] RHKYC: Standard courses
  - [ ] Common race formats
- [ ] One-tap race creation from template
- [ ] Edit before saving

**Dependencies:**
- Template data structure
- Class and venue associations

**Success Metrics:**
- 10+ templates available
- Templates reduce entry time by 50%
- Class-specific defaults correct
- Venue templates match common formats

---

## Technical Integration Map

### Service Dependencies
```
RaceCourseExtractor ─┬→ Strategy Generation
                     ├→ Course Visualization
                     └→ Rules Extraction

RaceStrategyEngine ──┬→ Pre-Race Planning
                     ├→ Auto-Updates
                     └→ Post-Race Comparison

AITacticalService ───→ During-Race Guidance

AICoachingAssistant ─→ Post-Race Analysis

RegionalWeatherService ─┬→ Strategy Input
                        ├→ Auto-Updates
                        └→ Track Overlay

EquipmentAIService ──→ Boat Tuning

CrewManagementService → Crew Tab

VoiceNoteService ────→ Debrief

ExternalResultsService → Results Linking
```

### State Management Approach
- Race lifecycle state: `useRaceLifecycle()` hook
- Phases: `planning | live | post-race | complete`
- Transitions trigger UI changes
- Background jobs: weather polling, strategy updates
- Real-time: GPS during race, coach feedback

### Data Schema Extensions
```sql
-- Race lifecycle tracking
ALTER TABLE regattas ADD COLUMN lifecycle_phase TEXT;
ALTER TABLE regattas ADD COLUMN strategy_id UUID;
ALTER TABLE regattas ADD COLUMN course_extraction_id UUID;

-- Track storage
CREATE TABLE race_tracks (
  id UUID PRIMARY KEY,
  race_id UUID REFERENCES regattas,
  recorded_at TIMESTAMP,
  track_data JSONB, -- GPS points array
  conditions_data JSONB, -- Weather at intervals
  events JSONB -- Tagged events
);

-- Debrief and coaching
CREATE TABLE race_debriefs (
  id UUID PRIMARY KEY,
  race_id UUID REFERENCES regattas,
  conversation JSONB, -- Chat history
  insights JSONB, -- Extracted learnings
  coach_feedback JSONB
);
```

---

## Testing Strategy

### Unit Tests
- [ ] RaceCourseExtractor: test extraction accuracy
- [ ] RaceStrategyEngine: strategy quality
- [ ] AITacticalService: layline calculations
- [ ] GPS tracking: accuracy and battery

### Integration Tests
- [ ] Document upload → strategy flow
- [ ] Weather updates → auto-strategy
- [ ] Race mode → track recording
- [ ] Track → analysis → debrief

### E2E Tests
- [ ] Complete race lifecycle (upload to coach report)
- [ ] Multi-race scenarios
- [ ] Offline functionality during race

---

## Performance Targets
- Document parsing: <10 seconds
- Strategy generation: <15 seconds
- Map rendering: 60fps
- GPS sampling: 1 second intervals
- Background updates: <5% battery/hour

---

## Implementation Sprint Planning

### Sprint 1 (Week 1-2): Document to Strategy
- 1.1 Document parsing
- 1.2 3D map + AI strategy
- 1.3 Weather integration
- **Goal:** NOR upload → visualized strategy

### Sprint 2 (Week 3-4): Pre-Race Completion
- 1.4 Boat tuning
- 1.5 Crew management
- 1.6 Rules highlighting
- **Goal:** Complete pre-race planning

### Sprint 3 (Week 5-6): Live Race Mode
- 2.1 Full-screen race mode
- 2.2 Real-time AI tactics
- 2.3 Enhanced GPS tracking
- **Goal:** Functional race mode with guidance

### Sprint 4 (Week 7-8): Post-Race Analysis
- 3.1 Track visualization + analysis
- 3.2 AI debrief conversation
- **Goal:** Track playback with insights

### Sprint 5 (Week 9-10): Coaching Integration
- 3.3 AI coach report
- 3.4 Coach sharing
- 3.5 Results entry/linking
- **Goal:** Complete analysis with coach feedback

### Sprint 6 (Week 11-12): Discovery Features
- 4.1 Document-first creation
- 4.2 Smart venue suggestions
- 4.3 External calendar sync
- **Goal:** Frictionless race entry

### Sprint 7 (Week 13-14): Community & Polish
- 4.4 Community discovery
- 4.5 Photo OCR
- 4.6 Templates
- Performance optimization
- **Goal:** Network effects, polish

---

## Success Metrics (Overall)

### User Engagement
- [ ] 80% of races have uploaded documents
- [ ] 70% of races have AI strategy generated
- [ ] 60% of races use GPS tracking
- [ ] 50% of tracked races have debrief completed

### Quality Indicators
- [ ] Document extraction >85% accurate
- [ ] Strategy confidence >0.7 average
- [ ] GPS track <5m accuracy
- [ ] AI advice rated useful >4/5 by sailors

### Performance
- [ ] All AI operations <20 seconds
- [ ] Map renders at 60fps
- [ ] Battery drain during race <8%/hour
- [ ] App stays responsive throughout

### Business Impact
- [ ] Race creation time reduced 60% (vs manual)
- [ ] Coach engagement up 3x (automatic sharing)
- [ ] Sailor retention +25% (complete lifecycle)
- [ ] Premium conversion +15% (AI value clear)

---

## Notes & Decisions

### Architecture Decisions
- **OnX Maps Style**: Full-screen map is primary interface, not embedded
- **Living Strategy**: Background updates as conditions change
- **Offline-First**: Race mode works without connectivity
- **AI Throughout**: Not just strategy - every phase AI-enhanced

### UX Principles
- **Progressive Disclosure**: Don't overwhelm - reveal features as needed
- **Guided Flow**: Lead sailor through lifecycle
- **Quick Wins**: Show value immediately (document upload)
- **Celebration**: Animations/rewards for completing phases

### Future Enhancements (Post-V1)
- Multi-boat fleet management
- Coach spectator mode (live tracking)
- Weather routing optimization
- Virtual race replay multiplayer
- AR course preview on-water

---

*Last Updated: September 30, 2025*
*Progress tracked here - check off items as completed*