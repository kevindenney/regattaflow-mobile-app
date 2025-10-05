# Product Requirements Document: Post-Onboarding Sailor Experience

## Overview
**Product**: RegattaFlow Sailor Application (Post-Onboarding)
**Target User**: Competitive sailors (Primary Persona: Bram Van Olsen - Dragon class, international competitor)
**Goal**: Deliver "OnX Maps for Sailing" - a globally-aware racing intelligence platform with AI-powered strategy, venue adaptation, and performance tracking
**Platform**: React Native (iOS/Android/Web via Expo)
**Vision**: Transform sailing from scattered PDFs and manual tracking into unified racing intelligence with OnX Maps-level strategic planning

---

## Navigation Structure & Information Architecture

### Bottom Tab Navigation (Sailor Mode)
```typescript
interface SailorTabNavigation {
  visibleTabs: [
    'Dashboard',   // Home - Racing command center
    'Calendar',    // Events - Race calendar and registrations
    'Courses',     // Races - Race course visualization and strategy
    'Boats',       // Boats - Equipment management and setup
    'Fleets',      // Fleets - Team and fleet management
    'Clubs',       // Clubs - Yacht club connections
    'More'         // Hamburger menu - Additional features
  ];

  hamburgerMenuItems: [
    'Profile',         // User profile and settings
    'Settings',        // App preferences and configuration
    'Venue',          // Global venue intelligence and switching
    'Crew',           // Crew management and coordination
    'Tuning Guides',  // Boat-specific tuning matrices
    'Strategy',       // AI race strategy planning
    'Map'             // OnX-style full-screen map view
  ];
}
```

### User Journey Architecture
```
Post-Onboarding Entry → Dashboard (Racing Command Center)
├── Venue Auto-Detection (GPS) → Regional Adaptation
├── Next Race Preparation Workflow
├── Performance Insights & Trends
└── Quick Actions (Upload Documents, Plan Strategy, Check Weather)

Daily Use Patterns:
1. Morning: Check weather → Review upcoming races → Update crew
2. Pre-Race: Upload docs → Generate strategy → Confirm venue
3. Race Day: Load course → Tactical timer → GPS tracking
4. Post-Race: Upload results → Analyze performance → Share with crew
5. Travel: Venue switch → Cultural briefing → Local intelligence
```

---

## Screen-by-Screen Specifications

## 1. Dashboard Tab - Racing Command Center

### Purpose
Central hub for race preparation, performance insights, and quick access to all sailing activities. Adapts to current venue and displays global venue intelligence.

### Layout Structure
```typescript
interface DashboardScreen {
  header: {
    greeting: 'Welcome back, [Name]';
    currentVenue: {
      display: '[Venue Name], [Country] 🌍';
      confidence: 'GPS Detected (95% confidence)';
      action: 'Tap to change venue';
    };
    quickStats: {
      totalRaces: number;
      venuesVisited: number;
      avgPosition: number;
      globalRanking: number;
    };
  };

  sections: [
    'Next Race Card',
    'Recent Race Analysis',
    'Venue Intelligence',
    'Fleet Activity',
    'Quick Actions',
    'Performance Summary'
  ];
}
```

### Next Race Card (Top Priority)
**Visual Design**: Hero card with race imagery, countdown timer, and action buttons

**Content**:
- **Race Name & Class**: "RHKYC Spring Series R1 - Dragon Class"
- **Venue**: Royal Hong Kong Yacht Club with flag icon
- **Countdown**: "3 days, 14 hours until start" with visual countdown
- **Status Indicators**:
  - ✅ Documents uploaded and processed
  - ⚠️ Strategy pending (AI can generate)
  - ✅ Weather confidence: 85%
  - ⚠️ Crew: 2 of 3 confirmed
  - ✅ Tuning guide loaded for conditions

**Action Buttons**:
- **Primary**: "Plan Race Strategy" (AI workflow)
- **Secondary**: "View Course Details"
- **Tertiary**: "Upload Documents" / "Check Weather" / "Confirm Crew"

**Smart Recommendations** (AI-powered):
- "Conditions forecast: Light air 8-12kt - Review light wind setup"
- "Similar race in 2023: You finished 3rd with medium jib"
- "2 new tactical insights available for this venue"

### Recent Race Analysis Card
**Visual**: Performance trend graph with key insights

**Content**:
- **Last Race**: "Dragon Winter Series R5"
  - Position: 3rd of 12
  - Trend: ↑ Improved from 5th (previous race)
  - AI Insight: "Start execution improved by 40%"
  - Equipment: "Light air setup correlation: 92% effective"

**Quick Stats**:
- Last 5 races average: 4.2 position
- Improvement trend: +1.8 positions (vs season start)
- Strategy win rate: 73% (when AI strategy followed)

**Actions**:
- "View Full Race Analysis"
- "Compare with Fleet"
- "Share with Coach"

### Venue Intelligence Card (Global Awareness)
**Visual**: Map preview with venue marker, cultural flag, weather icon

**Content**:
- **Current Venue**: Royal Hong Kong Yacht Club
- **Region**: Asia-Pacific (Monsoon Zone)
- **Your Stats Here**: 23 races, 4.2 avg position
- **Conditions Today**:
  - Wind: 15kt NE (HK Observatory live)
  - Tide: Flood 0.8kt (next change 14:30)
  - Temp: 22°C, Clear skies

**Cultural Intelligence**:
- Languages: English/Cantonese/Mandarin
- Currency: HKD (auto-converted from USD)
- Racing Culture: "British sailing traditions with Asian hospitality"
- Local Tip: "Victoria Harbour ferry schedule affects afternoon wind"

**Actions**:
- "View Full Venue Intelligence"
- "Switch to Another Venue" (for travel planning)
- "Offline Download" (cache venue data)

### Fleet Activity Card
**Visual**: Activity feed showing recent fleet member activity

**Content**:
- "Sarah posted new Dragon tuning guide for heavy air"
- "Michael logged race from ABC Regatta (2nd place!)"
- "3 fleet members checked in at RHKYC today"
- "New Dragon World Championship qualifying event announced"

**Actions**:
- "View Fleet Feed"
- "Post Update"
- "Invite Fleet Members"

### Quick Actions Grid
```
┌─────────────────┬─────────────────┬─────────────────┐
│ 📄 Upload       │ 🗺️ Plan         │ 🌤️ Weather      │
│ Documents       │ Strategy        │ Forecast        │
├─────────────────┼─────────────────┼─────────────────┤
│ ⚓ Check         │ 🎯 Race         │ 👥 Manage       │
│ Equipment       │ Timer           │ Crew            │
└─────────────────┴─────────────────┴─────────────────┘
```

### Performance Summary (Bottom Section)
**Content**:
- Season progress toward World Championship qualification
- Equipment effectiveness analysis (sails, setup correlation)
- Skill development recommendations from AI
- Coach session recommendations (if applicable)

---

## 2. Calendar Tab - Race Calendar & Event Management

### Purpose
Unified calendar showing all regattas, races, training sessions, and sailing commitments with automatic venue detection and intelligence loading.

### Layout Structure
```typescript
interface CalendarScreen {
  views: ['Month', 'List', 'Map'];
  filters: ['All Events', 'My Races', 'Travel Events', 'Fleet Events', 'Available Regattas'];

  eventTypes: {
    myRaces: 'Events I\'m registered for';
    available: 'Open registration nearby';
    travelEvents: 'International regattas requiring travel';
    training: 'Training sessions and coaching';
    club: 'Yacht club events and socials';
  };
}
```

### Month View (Default)
**Visual**: Calendar grid with color-coded event types

**Event Indicators**:
- **Blue**: My registered races
- **Green**: Available regattas (open registration)
- **Orange**: Travel events requiring planning
- **Purple**: Training/coaching sessions
- **Gray**: Club social events

**Event Card (on tap)**:
```
┌─────────────────────────────────────────┐
│ RHKYC Spring Series R1                  │
│ 📍 Royal Hong Kong Yacht Club          │
│ 🏴󠁧󠁢󠁷󠁬󠁳󠁿 Hong Kong                             │
│ 📅 March 15, 2025 • 13:00 HKT          │
│                                         │
│ Status:                                 │
│ ✅ Registered (Confirmed)               │
│ ⚠️ Strategy Pending                     │
│ ✅ Documents Uploaded                   │
│                                         │
│ [Plan Strategy] [View Details]         │
└─────────────────────────────────────────┘
```

### List View
**Visual**: Chronological list with intelligent grouping

**Grouping Logic**:
- "This Weekend" (next 7 days)
- "This Month" (current month)
- "Upcoming Travel" (events >50km away)
- "Season Qualifier Events" (World Championship path)

**Each Event Shows**:
- Date and time with timezone (auto-adjusted)
- Venue name and distance from current location
- Class/boat type
- Registration status
- Preparation status (documents, strategy, crew, equipment)
- Weather confidence for event date
- Quick actions: Register, Plan, Details

### Map View (Global Venue Discovery)
**Visual**: OnX Maps-style full-screen map with venue markers

**Features**:
- **Current Location**: Blue dot (GPS)
- **Home Venue**: House icon (green)
- **Upcoming Events**: Numbered pins (blue) with countdown
- **Available Regattas**: Open pins (green) with registration info
- **Saved Venues**: Star pins (yellow)

**Layer Controls** (OnX-style):
- Events (my races, available, travel)
- Venues (147+ sailing venues)
- Weather (wind/current overlays)
- Cultural regions (language/currency zones)

**Tap on Venue Pin**:
```
┌─────────────────────────────────────────┐
│ San Francisco Bay                       │
│ 🇺🇸 California, USA                     │
│                                         │
│ 📊 Your Stats: Never visited            │
│ 🌍 Distance: 7,215 miles from HK        │
│                                         │
│ Upcoming Events:                        │
│ • St. Francis YC Big Boat Series       │
│ • Rolex Big Boat Series                │
│                                         │
│ [View Intelligence] [Plan Trip]        │
└─────────────────────────────────────────┘
```

### Global Circuit Planning Feature
**Purpose**: Plan multi-venue racing campaigns (Mediterranean Circuit, Asian Tour, etc.)

**Interface**:
- Select multiple venues on map
- System suggests optimal order (dates, logistics, costs)
- Shows travel requirements:
  - Equipment shipping vs charter analysis
  - Visa requirements
  - Accommodation recommendations
  - Cultural preparation checklists
  - Budget estimates (entry fees, travel, lodging)

**Example Circuit**:
```
Hong Kong → Japan → Australia Circuit (Spring 2025)
├── RHKYC Spring Series (March 15-17)
│   └── Equipment: Ship Dragon to Japan ($3,200)
├── Hiroshima Dragon Cup (April 5-7)
│   └── Travel: 4 days prep time, visa not required
└── Sydney Gold Cup (May 10-14)
    └── Cultural: English-speaking, AUD currency

Total Cost Estimate: $12,500 USD
Qualification Impact: +15% toward World Championship
```

---

## 3. Courses Tab - Race Course Visualization & Strategy

### Purpose
OnX Maps for Sailing - Full-screen map interface with race course visualization, AI-powered strategy, and layered environmental intelligence.

### OnX-Style Map Interface

**Base Map Options**:
- Nautical Chart (default) - Official navigation charts with depth
- Satellite - High-resolution imagery
- Hybrid - Satellite with nautical overlay
- 3D Bathymetry - Underwater terrain visualization

**Layer System** (Toggle on/off like OnX Maps):

**Environmental Layers**:
```typescript
interface EnvironmentalLayers {
  wind: {
    currentVectors: 'Real-time wind arrows with speed';
    forecastAnimation: '48-hour animated wind forecast';
    historicalPatterns: 'Venue-specific wind pattern analysis';
  };

  current: {
    tidalFlow: 'Tidal current direction and strength';
    tidalPredictions: 'Tide height and timing for race window';
    surfaceCurrent: 'Wind-driven surface currents';
  };

  waves: {
    significantHeight: 'Wave height visualization';
    period: 'Wave period and frequency';
    direction: 'Wave propagation arrows';
  };

  weather: {
    pressure: 'Barometric pressure contours';
    precipitation: 'Rain radar and forecasts';
    temperature: 'Air and water temperature';
  };
}
```

**Racing Layers**:
```typescript
interface RacingLayers {
  course: {
    marks: '3D mark positioning with descriptions';
    boundaries: 'Racing area limits and restricted zones';
    startLine: 'Start line with bias indicator';
    finishLine: 'Finish line positioning';
  };

  tactical: {
    laylines: 'Wind-dependent tactical laylines';
    favoredSide: 'AI-identified advantaged areas (heat map)';
    windShadows: 'Land effect and wind hole mapping';
    currentAdvantage: 'Areas with favorable current';
  };

  historical: {
    pastRaces: 'GPS tracks from previous races at venue';
    winningRoutes: 'Routes taken by top finishers';
    commonMistakes: 'Areas where positions were lost';
  };
}
```

**Social Layers**:
- Other RegattaFlow users at venue (privacy-controlled)
- Fleet member check-ins and condition reports
- Community photos and tactical tips
- Coach locations (if connected)

### Course Builder & AI Strategy Workflow

#### Step 1: Document Upload
```
┌─────────────────────────────────────────┐
│ Upload Sailing Instructions             │
│                                         │
│ Methods:                                │
│ 📄 Upload PDF (tap to browse)          │
│ 🔗 Paste URL (club website)            │
│ 📷 Photo/Scan (OCR processing)         │
│ 📧 Forward email to                     │
│    race@regattaflow.app                 │
│                                         │
│ Recent Documents:                       │
│ • RHKYC Spring Series (uploaded)       │
│ • Dragon Worlds NOR (processing...)    │
│                                         │
│ [Upload New Document]                  │
└─────────────────────────────────────────┘
```

#### Step 2: AI Course Extraction
```
Processing: RHKYC Spring Series R1 Instructions
🤖 AI Document Analysis (Google Gemini)

Extracted Information:
✅ Course Type: Windward-Leeward (2 laps)
✅ Start Line: 22°16.5'N 114°10.2'E ↔ 22°16.5'N 114°10.4'E
✅ Mark 1 (Windward): 22°17.2'N 114°10.3'E
✅ Mark 2 (Leeward): 22°16.0'N 114°10.3'E
✅ Racing Area: Victoria Harbour East
⚠️ Boundaries: Ferry exclusion zone (see map)
✅ Start Time: 13:00 HKT (5 hours from now)

Confidence: 94%

[Approve Course] [Manual Adjustment] [Re-Process]
```

#### Step 3: 3D Course Visualization (MapLibre GL)
**Visual**: Full-screen interactive 3D map with course overlay

**Course Elements**:
- Start line: Green line with bias indicator (arrow showing favored end)
- Windward mark: Red buoy with approach zones
- Leeward mark: Yellow buoy with gybe zones
- Boundaries: Orange dashed lines with hazard warnings
- Laylines: Purple dashed lines (calculated from forecast wind)

**Interactive Tools**:
- Measurement tool: Distance and bearing between any two points
- Bearing tool: Calculate wind angles and sailing angles
- Route simulator: Draw potential routes, see time estimates
- What-if scenarios: Change wind direction, see course impact

#### Step 4: AI Strategy Generation
```
🧠 AI Race Strategy Generation
Venue: Royal Hong Kong Yacht Club
Conditions: 12-15kt NE, Flood tide 0.8kt

Analyzing:
✓ Weather forecast (HK Observatory + ECMWF)
✓ Tidal predictions (Victoria Harbour)
✓ Historical data (23 races at this venue)
✓ Your performance patterns
✓ Equipment configuration (Borsboom + North DNM-2024)
✓ Fleet competitive analysis

Strategy Confidence: 87%

Recommendations:
┌─────────────────────────────────────────┐
│ START STRATEGY                          │
│ Pin End Favored: +5° bias              │
│ Approach: Port tack, 30 sec to gun     │
│ Risk: Moderate (ferry traffic)         │
│ Confidence: 82%                         │
├─────────────────────────────────────────┤
│ BEAT STRATEGY (Leg 1 & 3)             │
│ Favored Side: RIGHT (60% probability)  │
│ Reason: Current assistance + lift      │
│ Tack Plan: Start right, tack on shift  │
│ Mark Approach: Starboard layline +10   │
│ Confidence: 89%                         │
├─────────────────────────────────────────┤
│ RUN STRATEGY (Leg 2 & 4)              │
│ Gybe Early: YES (inside track favored) │
│ Reason: Current advantage inshore      │
│ VMG Target: 5.2kt downwind             │
│ Mark Approach: Port gybe preferred     │
│ Confidence: 76%                         │
├─────────────────────────────────────────┤
│ EQUIPMENT SETUP                         │
│ Main: DNM-2024 (perfect for 12-15kt)  │
│ Jib: DNJ-2024 (medium trim)            │
│ Mast Rake: 23'6" (standard)           │
│ Shroud Tension: 350kg                   │
│ Setup Confidence: 95%                   │
└─────────────────────────────────────────┘

[Save Strategy] [Run Simulation] [Adjust]
```

#### Step 5: Monte Carlo Simulation (Championship Tier)
```
Running 1,000 Race Simulations...
Variables: Wind shifts (±15°), current variation, fleet behavior

Results:
┌─────────────────────────────────────────┐
│ Predicted Finish Position Distribution  │
│                                         │
│ 1st Place:  ████████░░░░ 15%           │
│ 2nd Place:  ████████████ 23%           │
│ 3rd Place:  ██████████░░ 19%           │
│ 4th Place:  ████████░░░░ 14%           │
│ 5th Place:  ██████░░░░░░ 11%           │
│ 6th+ Place: ████████░░░░ 18%           │
│                                         │
│ Expected Finish: 3.2 (median: 3rd)     │
│ Podium Probability: 57%                 │
│                                         │
│ Key Success Factors:                    │
│ • Start execution (30% impact)         │
│ • Right side commitment (25% impact)    │
│ • Mark rounding precision (20% impact)  │
│ • Equipment optimization (15% impact)   │
│ • Fleet position management (10%)      │
└─────────────────────────────────────────┘

Alternative Strategies:
├── Conservative (start safe): 3.8 avg, 45% podium
├── Aggressive (pin start): 2.9 avg, 62% podium, 12% risk >6th
└── Current-focused (left side): 4.1 avg, 38% podium

[Load Strategy to Race Timer] [Share with Crew]
```

### Race Day Tactical Interface

**Pre-Race Mode** (1 hour before start):
```
┌─────────────────────────────────────────┐
│ RACE DAY READY CHECK                    │
│ RHKYC Spring Series R1 • 58 min to start│
│                                         │
│ Strategy Loaded: ✅                      │
│ Weather Update: ⚠️ Conditions changed   │
│   Wind now 10-12kt (was forecast 12-15kt)│
│   → AI re-optimizing strategy...        │
│   → Light air setup recommended         │
│                                         │
│ Equipment Checklist:                    │
│ ✅ Sails: Light air jib selected         │
│ ⚠️ Shroud tension: Reduce to 320kg      │
│ ✅ Crew: All 3 confirmed and briefed    │
│                                         │
│ Start Line Analysis (Live):             │
│ • Pin end now favored +8° (was +5°)    │
│ • Current: 0.9kt flood (stronger)       │
│ • Fleet: 11 boats checked in           │
│                                         │
│ [Update Strategy] [Start Race Timer]   │
└─────────────────────────────────────────┘
```

**Race Execution Mode** (Simplified for racing):
```
┌─────────────────────────────────────────┐
│ ⏱️  START SEQUENCE: -05:00              │
│                                         │
│ 🎯 Pin End +8° → Port Tack Approach    │
│ 🌊 Current: 0.9kt Flood ↗              │
│ 💨 Wind: 11kt @ 045° (NE)              │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │   [Live Map - Full Screen]        │  │
│ │   • Your position (blue dot)      │  │
│ │   • Start line (green)            │  │
│ │   • Fleet positions (AIS)         │  │
│ │   • Laylines (purple dashed)      │  │
│ │   • Recommended route (blue line) │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Next Decision: Start approach (3 min)  │
│ AI Tip: "Fleet bunching at pin -       │
│          consider boat end for clear air"│
│                                         │
│ [Log Event] [Voice Note] [Mark Rounding]│
└─────────────────────────────────────────┘
```

**Voice Commands** (hands-free racing):
- "Mark tack" - Logs tack with timestamp
- "Mark gybe" - Logs gybe with timestamp
- "Note wind shift right" - Voice memo saved
- "Start timer" - Initiates countdown
- "Protest red boat" - Flags incident

**Automatic GPS Tracking**:
- 1Hz GPS sampling (1 position per second)
- Track smoothing and accuracy filtering
- Speed, heading, VMG calculations
- Wind angle estimation (if no instruments)
- Position relative to fleet (if AIS available)
- Mark rounding detection (automatic)

### Post-Race Analysis

**Immediate Analysis** (on finish):
```
┌─────────────────────────────────────────┐
│ 🏁 RACE COMPLETE                        │
│ Position: 3rd of 12 boats               │
│                                         │
│ Quick Stats:                            │
│ • Finish Time: 1:23:45 (elapsed)       │
│ • Avg Speed: 5.8kt                      │
│ • Distance Sailed: 6.2nm                │
│ • Tacks: 8 | Gybes: 4                   │
│                                         │
│ Strategy Execution: 85%                 │
│ ✅ Start: Excellent (pin end, clear)    │
│ ✅ Beat: Good (right side paid off)     │
│ ⚠️ Run: Missed early gybe opportunity   │
│ ✅ Equipment: Perfect setup             │
│                                         │
│ AI Insights:                            │
│ • Start timing: +0.5 boat lengths vs plan│
│ • Gained 2 positions on beat (as predicted)│
│ • Lost 1 position on run (late gybe)   │
│ • Overall: Beat strategy prediction     │
│   (predicted 3.2, actual 3rd)           │
│                                         │
│ [View Full Analysis] [Share] [Save]    │
└─────────────────────────────────────────┘
```

**Detailed Analysis Screen**:

**GPS Track Replay**:
- Animated replay of your track vs fleet
- Speed colorization (red = slow, green = fast)
- Tack/gybe markers with efficiency scores
- Wind shift annotations (AI-detected)
- Position gains/losses by leg

**Tactical Decision Analysis**:
```
Decision Point Analysis:

Start (13:00:00):
├── Your Position: 3 boat lengths from pin, port tack
├── AI Recommendation: Pin end approach (followed ✅)
├── Outcome: Clean start, 2nd position off line
└── Impact: +2 positions vs mid-line starters

First Beat - Tack Decision (13:05:30):
├── Your Action: Tacked to starboard after 5 min on port
├── AI Recommendation: Continue on port for right shift
├── Outcome: Right shift arrived, but you tacked early
└── Impact: -0.5 positions (minor strategic error)

Windward Mark Approach (13:18:00):
├── Your Action: Starboard layline +8 boat lengths
├── AI Recommendation: Starboard layline +10 boat lengths
├── Outcome: Tight rounding, good exit
└── Impact: Neutral (good execution)

First Run - Gybe Decision (13:19:30):
├── Your Action: Delayed gybe by 1:30
├── AI Recommendation: Early gybe for inside track
├── Outcome: Lost inside position to competitor
└── Impact: -1 position (largest strategic error)

Performance Summary:
• Strategy Adherence: 85%
• Tactical Decisions: 7 of 9 optimal
• Equipment Setup: 100% optimal for conditions
• Start Execution: Excellent (95% score)
• Overall Grade: A- (strong execution, minor improvements)
```

**Equipment Correlation**:
```
Setup Performance Analysis:

Your Setup Today:
├── Main: North DNM-2024 (16 races)
├── Jib: North DNJ-2024 Light (9 races)  ← Changed for conditions
├── Mast Rake: 23'6" (standard)
└── Shroud Tension: 320kg (light air)   ← Adjusted pre-race

Effectiveness vs Fleet:
┌─────────────────────────────────────────┐
│ Upwind Speed:                           │
│ You: 5.2kt avg │ Fleet: 5.0kt avg      │
│ Advantage: +0.2kt (4% faster) ✅        │
│                                         │
│ Downwind Speed:                         │
│ You: 6.4kt avg │ Fleet: 6.5kt avg      │
│ Disadvantage: -0.1kt (2% slower) ⚠️     │
│                                         │
│ VMG Upwind:                             │
│ You: 4.9kt │ Fleet: 4.7kt              │
│ Advantage: +4.3% ✅                      │
└─────────────────────────────────────────┘

AI Recommendations:
• Keep light air jib for similar conditions (performed well)
• Downwind trim needs adjustment - analyze with coach
• Your upwind setup is optimal - replicate in future
• Consider North DNS-2023 spinnaker service (33 races old)
```

**Venue Performance Tracking**:
```
Your Performance at RHKYC:
├── Total Races: 24 (now)
├── Average Position: 4.1 → 4.0 (improving ✅)
├── Best Finish: 1st (Spring 2024 R3)
├── Worst Finish: 9th (Winter 2024 R1)
├── Podium Rate: 42% (10 of 24 races)

Conditions Correlation:
├── Light Air (6-12kt): 3.2 avg ✅ Strong
├── Medium Air (12-18kt): 4.0 avg → Consistent
├── Heavy Air (18+kt): 5.8 avg ⚠️ Needs work

Tactical Patterns:
├── Right side bias: 65% success rate
├── Pin starts: 78% clean starts
├── Current awareness: High effectiveness
└── Venue knowledge: Expert level (top 10%)

Comparison to Fleet:
Your improvement rate at RHKYC: +0.8 positions/year
Fleet average improvement: +0.3 positions/year
You're learning this venue faster than average ✅
```

---

## 4. Boats Tab - Equipment Management & Setup Optimization

### Purpose
Comprehensive boat equipment tracking, setup optimization, maintenance scheduling, and performance correlation analysis.

### Boat Overview Screen

**My Boats List**:
```
┌─────────────────────────────────────────┐
│ Dragon #1247 "Fire Dragon" ⭐ PRIMARY   │
│ Borsboom (2019) • Excellent condition  │
│                                         │
│ Quick Stats:                            │
│ • 23 races this season                  │
│ • Avg position: 4.2                     │
│ • Last maintenance: 12 days ago         │
│ • Next service due: Spinnaker (soon)    │
│                                         │
│ Current Setup: Light Air Config         │
│ Venue Optimized for: RHKYC             │
│                                         │
│ [View Details] [Log Service] [Setup]   │
├─────────────────────────────────────────┤
│ Swan 47 "Windward Bound" (Crew)        │
│ Owner: John Smith Racing               │
│ Your Role: Tactician                    │
│                                         │
│ • 5 races this season                   │
│ • Avg position: 2.8                     │
│                                         │
│ [View Details] [My Role]               │
└─────────────────────────────────────────┘

[+ Add Boat] [Compare Performance]
```

### Boat Detail Screen (Dragon #1247)

**Tabs**: Overview | Sails | Rigging | Equipment | Maintenance | Performance

#### Overview Tab
```
┌─────────────────────────────────────────┐
│ Boat Information                        │
│                                         │
│ Name: Fire Dragon                       │
│ Class: International Dragon             │
│ Hull Number: 1247                       │
│ Builder: Borsboom (Netherlands)         │
│ Year: 2019                              │
│ Material: Fiberglass                    │
│ Ownership: I own this boat              │
│                                         │
│ Performance Profile:                    │
│ • Sweet Spot: 10-18kt wind              │
│ • Strength: Excellent upwind            │
│ • Characteristic: Stable, predictable   │
│                                         │
│ Venue Configuration:                    │
│ Current: RHKYC (Hong Kong)              │
│ • Light-medium air setup loaded         │
│ • HK monsoon conditions optimized       │
│ • Victoria Harbour current setup        │
│                                         │
│ [Edit Details] [Venue Presets]         │
└─────────────────────────────────────────┘
```

#### Sails Tab (Sail Inventory Management)
```
┌─────────────────────────────────────────┐
│ Sail Inventory - Dragon #1247          │
│                                         │
│ MAINSAILS:                              │
│ ┌───────────────────────────────────┐  │
│ │ North DNM-2024 ⭐ PRIMARY          │  │
│ │ • Races: 16 | Condition: Excellent │  │
│ │ • Best in: 10-20kt                 │  │
│ │ • Service Due: 34 races (good)     │  │
│ │ • Performance: 92% effectiveness   │  │
│ │ [View Details] [Log Race]         │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ North DNM-2022 (Backup)            │  │
│ │ • Races: 78 | Condition: Good      │  │
│ │ • Best in: 8-15kt (stretched)      │  │
│ │ • Service Due: Overdue 8 races ⚠️  │  │
│ │ [Schedule Service]                 │  │
│ └───────────────────────────────────┘  │
│                                         │
│ JIBS:                                   │
│ ┌───────────────────────────────────┐  │
│ │ North DNJ-2024 ⭐ PRIMARY          │  │
│ │ • Races: 9 | Condition: Excellent  │  │
│ │ • Wind Range: 12-25kt (all-purpose)│  │
│ │ [View Details]                     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ North DNJ-2024 Light               │  │
│ │ • Races: 3 | Condition: New        │  │
│ │ • Wind Range: 6-12kt (light air)   │  │
│ │ • Performance: 95% effectiveness   │  │
│ │ [View Details]                     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ SPINNAKERS:                             │
│ ┌───────────────────────────────────┐  │
│ │ North DNS-2023 ⚠️                  │  │
│ │ • Races: 33 | Condition: Fair      │  │
│ │ • Service: OVERDUE (call North)    │  │
│ │ • Performance: 78% (declining)     │  │
│ │ • AI Alert: Service in next 7 days │  │
│ │ [Schedule Service] [Find Sailmaker]│  │
│ └───────────────────────────────────┘  │
│                                         │
│ [+ Add Sail] [Performance Analysis]    │
└─────────────────────────────────────────┘
```

**AI Sail Recommendations**:
```
🤖 Equipment Intelligence

Upcoming Race: RHKYC Spring R2 (4 days)
Forecast: 8-12kt NE, building to 15kt

Recommended Sails:
✅ Main: North DNM-2024 (optimal)
✅ Jib: North DNJ-2024 Light (start) → All-purpose (if builds)
⚠️ Spinnaker: North DNS-2023 (service recommended before race)

Alternative if spinnaker not serviced:
→ Use North DNS-2023 conservatively
→ Service immediately after race
→ Budget: $450 USD for spinnaker service

Performance Impact if not serviced: -0.5 positions estimated
```

#### Rigging Tab
```
┌─────────────────────────────────────────┐
│ Rigging Configuration - Dragon #1247    │
│                                         │
│ MAST:                                   │
│ • Manufacturer: Seldén                  │
│ • Type: D-Section                       │
│ • Length: 8.6m                          │
│ • Material: Aluminum                    │
│ • Condition: Excellent                  │
│                                         │
│ CURRENT SETUP (RHKYC Light Air):        │
│ ┌───────────────────────────────────┐  │
│ │ Mast Rake: 23'6" (standard)        │  │
│ │ Mast Bend: 125mm (medium)          │  │
│ │ Shroud Tension: 320kg (light air)  │  │
│ │ Forestay Tension: 280kg            │  │
│ │ Spreader Angle: 12° (standard)     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ VENUE PRESETS:                          │
│ • RHKYC Light (6-12kt) ⭐ Active        │
│ • RHKYC Medium (12-18kt)               │
│ • RHKYC Heavy (18+kt)                  │
│ • Travel Default (conservative)         │
│                                         │
│ [Load Preset] [Save Current Setup]     │
│ [North Sails Tuning Guide]             │
└─────────────────────────────────────────┘
```

#### Equipment Tab (Electronics, Safety, Misc)
```
┌─────────────────────────────────────────┐
│ Equipment Inventory                     │
│                                         │
│ ELECTRONICS:                            │
│ • GPS/Chartplotter: Garmin GPSMAP 943   │
│ • Wind Instruments: B&G Triton² Display │
│ • Depth Sounder: Raymarine i50          │
│ • Radio: Standard Horizon HX870         │
│                                         │
│ SAFETY GEAR:                            │
│ • Life Jackets: 3x Spinlock Deckvest (✅)│
│ • Flares: Expire Mar 2026 (11 months)  │
│ • Fire Extinguisher: Serviced Jan 2025  │
│ • First Aid Kit: Complete               │
│                                         │
│ DECK GEAR:                              │
│ • Anchor: 10kg Bruce (with 50m chain)   │
│ • Fenders: 6x (good condition)          │
│ • Lines: Dock lines replaced Dec 2024   │
│                                         │
│ AI ALERTS:                              │
│ ⚠️ Flares expire in 11 months - order soon│
│ ✅ All safety gear compliant for racing │
│                                         │
│ [+ Add Item] [Service Schedule]        │
└─────────────────────────────────────────┘
```

#### Maintenance Tab
```
┌─────────────────────────────────────────┐
│ Maintenance History & Schedule          │
│                                         │
│ UPCOMING SERVICES:                      │
│ ⚠️ OVERDUE:                              │
│ • Spinnaker service (8 races overdue)   │
│   → North Sails Hong Kong               │
│   → Est. cost: $450 USD                 │
│   → Est. time: 5-7 days                 │
│   [Schedule Now]                        │
│                                         │
│ DUE SOON (Next 30 Days):                │
│ • Hull antifouling (due in 18 days)     │
│   → RHKYC Marine Services               │
│   → Est. cost: $800 USD                 │
│   → Est. time: 2 days                   │
│   [Schedule]                            │
│                                         │
│ SCHEDULED:                              │
│ • Annual safety inspection (Mar 30)     │
│   → RHKYC Race Committee                │
│   → Confirmed                           │
│                                         │
│ RECENT SERVICES:                        │
│ ✅ Rigging inspection (Feb 15, 2025)     │
│ ✅ Bottom cleaning (Feb 1, 2025)         │
│ ✅ Main halyard replacement (Jan 10)     │
│                                         │
│ [+ Log Service] [Find Service Provider] │
└─────────────────────────────────────────┘
```

#### Performance Tab (Equipment Correlation Analysis)
```
┌─────────────────────────────────────────┐
│ Equipment Performance Analysis          │
│                                         │
│ SAIL PERFORMANCE (Last 10 Races):       │
│ ┌───────────────────────────────────┐  │
│ │ DNM-2024 + DNJ-2024 Light:         │  │
│ │ • Races: 3                         │  │
│ │ • Avg Position: 3.0                │  │
│ │ • Conditions: 8-12kt               │  │
│ │ • Effectiveness: 95% ⭐             │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ DNM-2024 + DNJ-2024 (all-purpose): │  │
│ │ • Races: 5                         │  │
│ │ • Avg Position: 4.2                │  │
│ │ • Conditions: 12-18kt              │  │
│ │ • Effectiveness: 88%               │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ DNM-2022 + DNJ-2024:               │  │
│ │ • Races: 2                         │  │
│ │ • Avg Position: 6.5                │  │
│ │ • Conditions: 15-20kt              │  │
│ │ • Effectiveness: 68% ⚠️             │  │
│ │ → Recommendation: Retire DNM-2022  │  │
│ └───────────────────────────────────┘  │
│                                         │
│ SETUP OPTIMIZATION:                     │
│ Best performing configuration:          │
│ • DNM-2024 + DNJ-2024 Light (light air) │
│ • 3.0 avg finish vs 4.2 fleet avg       │
│ • Continue using in 6-12kt conditions   │
│                                         │
│ [View Detailed Analysis] [Compare Sails]│
└─────────────────────────────────────────┘
```

---

## 5. Fleets Tab - Team & Fleet Management

### Purpose
Manage sailing teams, coordinate with fleet members, share performance data, and access fleet-specific resources (tuning guides, strategies, group coaching).

### Fleet Overview Screen
```
┌─────────────────────────────────────────┐
│ My Fleets                               │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ RHKYC Dragon Fleet ⭐ PRIMARY       │  │
│ │ 47 members • Royal Hong Kong YC    │  │
│ │                                    │  │
│ │ Your Stats:                        │  │
│ │ • Fleet Ranking: 8th of 47         │  │
│ │ • Season Avg: 4.2 (fleet: 5.8)     │  │
│ │ • Improvement: +3 positions ↑      │  │
│ │                                    │  │
│ │ Recent Activity:                   │  │
│ │ • 3 members posted today           │  │
│ │ • New tuning guide (heavy air)     │  │
│ │ • Upcoming: Fleet social (Mar 20)  │  │
│ │                                    │  │
│ │ [View Fleet] [Post Update]        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Asia-Pacific Dragon Circuit        │  │
│ │ 214 members • Regional network     │  │
│ │                                    │  │
│ │ • Circuit Ranking: 47th            │  │
│ │ • Venues Raced: 3 of 12            │  │
│ │ • Next Event: Hiroshima (Apr 5)    │  │
│ │                                    │  │
│ │ [View Fleet] [Plan Travel]        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [+ Join Fleet] [Create Fleet]          │
└─────────────────────────────────────────┘
```

### Fleet Detail Screen (RHKYC Dragon Fleet)

**Tabs**: Feed | Members | Tuning | Events | Leaderboard

#### Feed Tab
```
┌─────────────────────────────────────────┐
│ RHKYC Dragon Fleet Feed                 │
│                                         │
│ Sarah Johnson • 2h ago                  │
│ Posted new tuning guide: Heavy Air Setup│
│ "After yesterday's breeze, here's what  │
│ worked for me in 22kt+ conditions..."   │
│ 📄 North_Dragon_Heavy_Setup_2025.pdf   │
│ 💬 5 comments • 👍 12 likes             │
│                                         │
│ ├─────────────────────────────────────┤ │
│ Michael Chen • 5h ago                   │
│ Logged race: ABC Regatta R2             │
│ 🏆 2nd place! • Dragon Class            │
│ "Right side paid off big time on beat 3"│
│ 📊 View full analysis                   │
│ 💬 8 comments • 👍 24 likes             │
│                                         │
│ ├─────────────────────────────────────┤ │
│ Fleet Admin • 1 day ago                 │
│ 📅 Upcoming: Spring Series R3 (Mar 22)  │
│ • 12 fleet members registered           │
│ • Weather: Looking good (12-15kt)       │
│ • Social: Post-race BBQ at club        │
│ [Register] [Details]                    │
│                                         │
│ ├─────────────────────────────────────┤ │
│ Dragon Fleet HQ • 2 days ago            │
│ 🌍 World Championship Qualifier Update  │
│ "New qualifying event added in Japan..." │
│ [Read More]                             │
└─────────────────────────────────────────┘

[+ Post Update] [Filter Feed]
```

#### Members Tab
```
┌─────────────────────────────────────────┐
│ Fleet Members (47)                      │
│ Sort: [Ranking] Season Avg | Alphabetical│
│                                         │
│ 1. 🥇 David Lee                         │
│    Season Avg: 2.1 • Dragon #892       │
│    Boat: Borsboom 2021                 │
│    [View Profile] [Message]            │
│                                         │
│ 2. 🥈 Emma Wilson                       │
│    Season Avg: 2.8 • Dragon #1104      │
│    Boat: Petticrows 2020               │
│    [View Profile] [Message]            │
│                                         │
│ ...                                     │
│                                         │
│ 8. 🔵 You (Bram Van Olsen)              │
│    Season Avg: 4.2 • Dragon #1247      │
│    Boat: Borsboom 2019                 │
│    Improvement: +3 positions ↑          │
│                                         │
│ ...                                     │
│                                         │
│ Filter:                                 │
│ [ ] Show only active (raced this month) │
│ [ ] Similar performance level           │
│ [ ] Available for crew exchanges        │
└─────────────────────────────────────────┘
```

#### Tuning Tab (Shared Fleet Knowledge)
```
┌─────────────────────────────────────────┐
│ Fleet Tuning Library                    │
│ Curated guides for Dragon class         │
│                                         │
│ OFFICIAL GUIDES:                        │
│ ┌───────────────────────────────────┐  │
│ │ North Sails Dragon Tuning Matrix   │  │
│ │ Complete guide for all conditions  │  │
│ │ Updated: Jan 2025                  │  │
│ │ 📥 Downloads: 1,247 • ⭐ 4.9/5      │  │
│ │ [View] [Download]                  │  │
│ └───────────────────────────────────┘  │
│                                         │
│ FLEET CONTRIBUTIONS:                    │
│ ┌───────────────────────────────────┐  │
│ │ Sarah Johnson's Heavy Air Setup    │  │
│ │ "What worked in 22kt+ at RHKYC"   │  │
│ │ Posted: 2h ago • 👍 12 likes        │  │
│ │ [View Guide]                       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ David Lee's Light Air Secrets      │  │
│ │ "Victoria Harbour sub-10kt tips"   │  │
│ │ Posted: 1 week ago • 👍 34 likes    │  │
│ │ [View Guide]                       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ VENUE-SPECIFIC:                         │
│ • RHKYC Monsoon Season Setup (18)      │
│ • Victoria Harbour Current Guide (24)   │
│ • Typhoon Season Prep Checklist (9)    │
│                                         │
│ [+ Share Your Guide] [Request Guide]   │
└─────────────────────────────────────────┘
```

#### Events Tab
```
┌─────────────────────────────────────────┐
│ Fleet Events & Championships            │
│                                         │
│ UPCOMING:                               │
│ ┌───────────────────────────────────┐  │
│ │ RHKYC Spring Series R3              │  │
│ │ 📅 March 22, 2025                   │  │
│ │ 👥 12 of 47 members registered      │  │
│ │ 🏆 Fleet championship points        │  │
│ │ [Register] [Leaderboard]           │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Fleet Social: Post-Race BBQ         │  │
│ │ 📅 March 22, 2025 @ 18:00           │  │
│ │ 📍 RHKYC Terrace                    │  │
│ │ 👥 23 members attending             │  │
│ │ [RSVP] [Details]                   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ QUALIFYING EVENTS:                      │
│ • Hiroshima Dragon Cup (Apr 5-7)       │
│   → 5 fleet members planning to attend │
│ • Dragon Gold Cup Australia (May 10-14)│
│   → Travel group forming               │
│                                         │
│ [View Calendar] [Plan Group Travel]    │
└─────────────────────────────────────────┘
```

#### Leaderboard Tab
```
┌─────────────────────────────────────────┐
│ RHKYC Dragon Fleet Leaderboard          │
│ 2025 Season (Jan 1 - Mar 15)            │
│                                         │
│ Overall Standings:                      │
│ ┌────┬──────────────────┬─────┬─────┐  │
│ │Pos │ Sailor           │Races│ Avg │  │
│ ├────┼──────────────────┼─────┼─────┤  │
│ │ 1  │🥇 David Lee      │ 18  │ 2.1 │  │
│ │ 2  │🥈 Emma Wilson    │ 16  │ 2.8 │  │
│ │ 3  │🥉 Tom Zhang      │ 20  │ 3.0 │  │
│ │... │                  │     │     │  │
│ │ 8  │🔵 Bram Van Olsen │ 23  │ 4.2 │  │
│ │... │                  │     │     │  │
│ └────┴──────────────────┴─────┴─────┘  │
│                                         │
│ Your Position:                          │
│ • Current: 8th of 47                    │
│ • Season Start: 11th of 47              │
│ • Progress: +3 positions ↑              │
│ • Next Goal: Break into Top 5           │
│                                         │
│ Performance Insights:                   │
│ • Races needed to reach 5th: 8-10       │
│ • Target avg position: 3.5              │
│ • Your current trend: +0.1 per race     │
│                                         │
│ [View Detailed Stats] [Compare]        │
└─────────────────────────────────────────┘
```

---

## 6. Clubs Tab - Yacht Club Connections

### Purpose
Connect with yacht clubs, view club events, access member benefits, and manage club-specific racing calendars.

### Club Connections Screen
```
┌─────────────────────────────────────────┐
│ My Yacht Clubs                          │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Royal Hong Kong Yacht Club ⭐      │  │
│ │ 🇭🇰 Hong Kong                       │  │
│ │                                    │  │
│ │ Member Since: 2019                 │  │
│ │ Member #: 4782                     │  │
│ │ Status: Full Sailing Member        │  │
│ │                                    │  │
│ │ Your Activity:                     │  │
│ │ • 23 races this season             │  │
│ │ • 8th in Dragon fleet              │  │
│ │ • Last visit: Yesterday            │  │
│ │                                    │  │
│ │ Upcoming Events:                   │  │
│ │ • Spring Series R3 (Mar 22)        │  │
│ │ • AGM (Apr 15)                     │  │
│ │ • Dragon Clinic (May 1)            │  │
│ │                                    │  │
│ │ [View Club] [Facilities] [Events]  │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Hebe Haven Yacht Club              │  │
│ │ 🇭🇰 Hong Kong                       │  │
│ │                                    │  │
│ │ Member Since: 2020                 │  │
│ │ Status: Reciprocal Member          │  │
│ │                                    │  │
│ │ • 5 races this season              │  │
│ │ • Next event: Summer Series (Jun)  │  │
│ │                                    │  │
│ │ [View Club]                        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [+ Add Club Connection] [Find Clubs]   │
└─────────────────────────────────────────┘
```

### Club Detail Screen (RHKYC)
```
┌─────────────────────────────────────────┐
│ Royal Hong Kong Yacht Club              │
│ 🇭🇰 Kellett Island, Hong Kong           │
│                                         │
│ ABOUT:                                  │
│ Founded 1849 • Royal Charter 1894       │
│ One of Asia's premier yacht clubs      │
│ 2,400+ members • 200+ boats            │
│                                         │
│ FACILITIES:                             │
│ ⚓ Marina: 150 berths (20m max)         │
│ 🏋️ Fitness center & changing rooms      │
│ 🍽️ Restaurant & bar (harbor views)      │
│ 🛠️ Chandlery & boat services            │
│ 📚 Library & race committee room        │
│                                         │
│ YOUR BENEFITS:                          │
│ ✅ Priority race entry                   │
│ ✅ Discounted sailing courses            │
│ ✅ Guest privileges (6 per year)         │
│ ✅ Reciprocal access to partner clubs    │
│                                         │
│ UPCOMING EVENTS (Next 30 Days):         │
│ • Spring Series R3 (Mar 22) [Registered]│
│ • Dragon Clinic with World Champion     │
│   (May 1) [Register]                    │
│ • Club BBQ & Sailing Social (Mar 28)    │
│   [RSVP]                                │
│                                         │
│ [Racing Calendar] [Facilities] [Contact]│
└─────────────────────────────────────────┘
```

---

## 7. More Menu (Hamburger) - Additional Features

### Menu Structure
```
┌─────────────────────────────────────────┐
│ More Options                            │
│                                         │
│ 👤 Profile                              │
│    Edit profile, achievements, stats    │
│                                         │
│ ⚙️ Settings                              │
│    App preferences, notifications       │
│                                         │
│ 📍 Venue Intelligence                   │
│    Global venue system, switch venues   │
│                                         │
│ 👥 Crew Management                      │
│    Coordinate with crew members         │
│                                         │
│ 📖 Tuning Guides                        │
│    Boat-specific setup matrices         │
│                                         │
│ 🧠 AI Strategy Center                   │
│    Advanced strategy planning & sims    │
│                                         │
│ 🗺️ Full-Screen Map                      │
│    OnX-style map with all layers        │
│                                         │
│ 💬 Messages                             │
│    Crew, fleet, and coach communication │
│                                         │
│ 🎓 Coaching                             │
│    Find coaches, book sessions          │
│                                         │
│ 📊 Advanced Analytics                   │
│    Deep performance insights            │
│                                         │
│ 💳 Subscription                         │
│    Manage plan, billing, features       │
│                                         │
│ ❓ Help & Support                        │
│    Tutorials, FAQs, contact support     │
└─────────────────────────────────────────┘
```

---

## Global Venue Intelligence System

### Automatic Venue Detection & Switching

**GPS-Based Detection**:
```
┌─────────────────────────────────────────┐
│ 🌍 VENUE SWITCH DETECTED                │
│                                         │
│ Previous: Royal Hong Kong Yacht Club    │
│ 🇭🇰 Hong Kong                            │
│                                         │
│          ↓                              │
│                                         │
│ New Location: San Francisco Bay         │
│ 🇺🇸 California, USA                      │
│ Confidence: 95% (GPS)                   │
│                                         │
│ Actions Taken:                          │
│ ✅ Weather source: NOAA/NWS activated    │
│ ✅ Currency: HKD → USD                   │
│ ✅ Language: English (US)                │
│ ✅ Timezone: HKT → PST (-16 hours)      │
│ ✅ Cultural profile: North America       │
│ ✅ Local intelligence: SF Bay loaded     │
│ ✅ Offline data: Cached for 30 days     │
│                                         │
│ Venue Briefing Ready:                   │
│ • Wind patterns (cityfront 25-35kt)     │
│ • Current intelligence (4kt ebb tides)  │
│ • Local services & contacts             │
│ • Cultural protocols & etiquette        │
│                                         │
│ [View Full Briefing] [Confirm] [Revert] │
└─────────────────────────────────────────┘
```

### Venue Intelligence Briefing Package

**Example: Traveling from Hong Kong → San Francisco Bay**

```
┌─────────────────────────────────────────┐
│ 📋 VENUE TRANSITION BRIEFING            │
│ Hong Kong → San Francisco Bay           │
│                                         │
│ WIND & WEATHER:                         │
│ • HK: Monsoon (predictable NE/SW)       │
│   → SF: Thermal (variable, strong)      │
│ • HK: 10-18kt typical                   │
│   → SF: 18-30kt cityfront typical       │
│ • Wind builds afternoon (vs morning HK) │
│ • Cold water (12°C vs 22°C HK) - layer! │
│                                         │
│ CURRENTS & TIDES:                       │
│ • HK: 0.5-1.2kt typical                 │
│   → SF: 2-4kt extreme (major factor!)   │
│ • Tidal range: 1.2m (HK) → 1.8m (SF)    │
│ • Strategy impact: CRITICAL (vs moderate)│
│ • Race timing around tidal gates crucial│
│                                         │
│ TACTICAL DIFFERENCES:                   │
│ • Right side bias typical (vs HK left)  │
│ • Current knowledge > wind (opposite HK)│
│ • Conservative starts (traffic, current)│
│ • Equipment: Stronger gear needed       │
│                                         │
│ CULTURAL ADAPTATION:                    │
│ • Racing style: Aggressive (vs conservative)│
│ • Post-race: Casual (vs formal HK)      │
│ • Language: English (sailing slang)     │
│ • Costs: Higher (budget +40%)           │
│                                         │
│ EQUIPMENT RECOMMENDATIONS:              │
│ • Heavier shroud tension (+20%)         │
│ • Flatter sails (strong breeze bias)    │
│ • Consider chartering (shipping $8k+)   │
│                                         │
│ LOCAL CONTACTS:                         │
│ • St. Francis YC: +1-555-SAIL-SF        │
│ • Spinnaker Sailing: Coaching/charters  │
│ • West Marine: Chandlery (24hr)         │
│ • SF Bay Dragon Fleet: [Contact]        │
│                                         │
│ [Download Offline] [Connect Fleet]     │
└─────────────────────────────────────────┘
```

---

## AI Strategy Features (Championship Tier)

### Advanced AI Capabilities

**Monte Carlo Race Simulation**:
- 1,000+ race outcome simulations
- Probabilistic finish position distributions
- Sensitivity analysis for tactical decisions
- Alternative strategy comparisons
- Risk/reward trade-off analysis

**Multi-Model Weather Ensemble**:
- NOAA, ECMWF, GFS model aggregation
- Venue-specific accuracy calibration
- Confidence scoring for each model
- Microclimate modeling for major venues
- Real-time weather station integration

**Equipment Optimization AI**:
- Sail selection recommendations
- Boat setup optimization for conditions
- Performance correlation analysis
- Service scheduling predictions
- Cost-benefit analysis for upgrades

**Competitor Analysis** (if AIS available):
- Fleet strength assessment
- Tactical positioning analysis
- Speed comparison in real-time
- Historical performance patterns
- Strategic opportunities identification

---

## Offline Functionality

### Offline-First Racing Architecture

**Pre-Cached Data**:
- Home venue: Full intelligence (permanent)
- Last 10 visited venues: 30-day cache
- Upcoming race courses: Auto-downloaded
- Weather: Last-known conditions snapshot
- Tuning guides: Offline access
- Fleet rosters: Synced

**Race Day Offline Capabilities**:
- ✅ GPS tracking (full functionality)
- ✅ Race timer and countdown
- ✅ Course visualization
- ✅ Tactical laylines (from cached wind)
- ✅ Voice notes and logging
- ✅ Basic performance metrics
- ⚠️ AI recommendations (cached only)
- ❌ Real-time weather updates
- ❌ Fleet AIS tracking

**Sync Strategy**:
- Automatic sync when online
- Differential updates (changed data only)
- Priority sync: Race results → Performance data → Photos
- Conflict resolution: Client timestamp wins
- Background sync: Low-power mode compatible

---

## Performance Metrics & Analytics

### Cross-Venue Performance Comparison
```
┌─────────────────────────────────────────┐
│ 🌍 GLOBAL PERFORMANCE SUMMARY           │
│                                         │
│ Venues Raced (2025 Season):             │
│ 1. RHKYC (Hong Kong) - 23 races, 4.2 avg│
│ 2. Hebe Haven YC (HK) - 5 races, 5.0 avg│
│ 3. Hiroshima Bay (Japan) - 3 races, 6.5 avg│
│                                         │
│ Venue Performance Ranking:              │
│ 🏆 Best: RHKYC (home advantage)         │
│ 📊 Average: Hebe Haven (familiar)       │
│ 📉 Learning: Hiroshima (new venue)      │
│                                         │
│ Conditions Analysis:                    │
│ • Light Air (6-12kt): 3.2 avg ✅        │
│ • Medium Air (12-18kt): 4.5 avg         │
│ • Heavy Air (18+kt): 6.8 avg ⚠️         │
│                                         │
│ Equipment Effectiveness:                │
│ • DNM-2024 + Light Jib: 95% (6-12kt)    │
│ • DNM-2024 + Standard: 88% (12-18kt)    │
│ • Older sails: 68% (needs upgrade)      │
│                                         │
│ World Championship Progress:            │
│ • Qualifying Events: 5 of 8 completed   │
│ • Current Ranking: 47th (target: top 20)│
│ • Required Avg: 3.0 (current: 4.2)      │
│ • Events Remaining: 3 strategic choices │
│                                         │
│ [View Detailed Analytics]              │
└─────────────────────────────────────────┘
```

---

## Revenue Model & Subscription Tiers

### Free Tier
**Features**:
- Basic GPS race tracking (5 races/month)
- Simple weather conditions (current only)
- Local venue information (1 venue)
- Basic performance metrics
- Community features access

**Limitations**:
- No AI strategy generation
- No document processing
- No offline functionality
- No global venue intelligence
- No advanced analytics

### Sailor Pro ($29/month or $199/year)
**Everything in Free, plus**:
- ✅ Unlimited GPS race tracking
- ✅ AI race strategy recommendations
- ✅ Document processing (unlimited)
- ✅ Professional weather forecasting (48hr)
- ✅ Global venue intelligence (147+ venues)
- ✅ Offline functionality (10 venues cached)
- ✅ Equipment optimization AI
- ✅ Advanced performance analytics
- ✅ Coach marketplace access
- ✅ Fleet management tools

### Championship ($49/month or $399/year)
**Everything in Pro, plus**:
- ✅ Advanced AI simulation (Monte Carlo)
- ✅ Multi-model weather ensemble
- ✅ International venue intelligence (unlimited)
- ✅ Priority offline caching (20 venues)
- ✅ Custom equipment profiles
- ✅ Advanced fleet analytics
- ✅ Priority coach booking
- ✅ White-label club integration
- ✅ Competitor analysis (AIS)
- ✅ Custom tuning matrices
- ✅ Export race data (CSV, GPX)

---

## Technical Requirements

### Data Models

**Sailor Profile**:
```typescript
{
  id: uuid;
  name: string;
  email: string;
  sailing_experience: enum;
  primary_boat_class: string;
  boat_classes: string[];
  racing_goals: string[];
  home_venue_id: uuid;
  current_venue_id: uuid;
  subscription_tier: 'free' | 'pro' | 'championship';
  created_at: timestamp;
}
```

**Venue Intelligence**:
```typescript
{
  id: uuid;
  name: string;
  country: string;
  region: 'north-america' | 'europe' | 'asia-pacific' | 'other';
  coordinates: { lat: number; lng: number };
  weather_sources: string[];
  cultural_profile_id: uuid;
  tactical_intelligence: json;
  offline_data_package: string; // S3 URL
}
```

**Race Strategy**:
```typescript
{
  id: uuid;
  sailor_id: uuid;
  race_id: uuid;
  venue_id: uuid;
  strategy_type: 'ai_generated' | 'manual' | 'coach_recommended';
  confidence: number; // 0-100
  start_strategy: json;
  beat_strategy: json;
  run_strategy: json;
  equipment_recommendations: json;
  simulation_results: json; // Monte Carlo data
  created_at: timestamp;
}
```

**Race Performance**:
```typescript
{
  id: uuid;
  sailor_id: uuid;
  race_id: uuid;
  position: number;
  fleet_size: number;
  gps_track: json; // GeoJSON LineString
  strategy_adherence: number; // 0-100
  equipment_used: json;
  conditions_actual: json;
  ai_analysis: json;
  created_at: timestamp;
}
```

### API Endpoints

**Venue System**:
- `GET /api/venues/detect?lat={lat}&lng={lng}` - GPS venue detection
- `GET /api/venues/{id}/intelligence` - Load venue intelligence
- `GET /api/venues/{id}/offline-package` - Download offline data
- `POST /api/venues/switch` - Manual venue switching

**AI Strategy**:
- `POST /api/ai/strategy/generate` - Generate race strategy
- `POST /api/ai/strategy/simulate` - Run Monte Carlo simulation
- `POST /api/ai/document/process` - Process sailing instructions
- `GET /api/ai/weather/ensemble` - Multi-model weather forecast

**Performance Analytics**:
- `GET /api/performance/cross-venue` - Compare performance across venues
- `GET /api/performance/equipment` - Equipment effectiveness analysis
- `GET /api/performance/trends` - Performance trends over time
- `POST /api/performance/upload` - Upload race GPS track

### RLS Policies (Supabase)

- Sailors can only view/edit their own data
- Venue data is public (read-only)
- Fleet data visible to fleet members only
- Race results public (if race is public)
- Strategy data private (sailor + coaches only)
- GPS tracks private unless shared

---

## Success Metrics

### User Engagement
- **Daily Active Users**: 40% of subscribers
- **Races Tracked**: 5+ per month per active sailor
- **Venue Switches**: 2+ per traveling sailor per season
- **AI Strategy Usage**: 80% of races have pre-generated strategy
- **Document Uploads**: 10+ per sailor per month

### Performance Impact
- **Position Improvement**: +1.5 positions average vs baseline
- **Strategy Win Rate**: 75%+ when AI strategy followed
- **Venue Adaptation**: 50% faster improvement at new venues
- **Equipment Optimization**: 15% better setup effectiveness

### Business Metrics
- **Free → Pro Conversion**: 25% within 30 days
- **Pro → Championship Upgrade**: 15% within 90 days
- **Annual Retention**: 85%+
- **NPS Score**: 70+
- **App Store Rating**: 4.7+

---

## RapidNative Integration Notes

**To implement in RapidNative**:

1. **Navigation**: Create 7-tab bottom navigation + hamburger menu with 10 menu items
2. **Dashboard**: Start with hero "Next Race Card" + venue intelligence + performance summary
3. **Calendar**: Month/List/Map views with color-coded events
4. **Courses**: Full-screen OnX-style map with multi-layer system
5. **Boats**: Equipment inventory with maintenance tracking
6. **Fleets**: Social feed + leaderboard + shared resources
7. **Clubs**: Club connections + facilities + events

**Key Design Patterns**:
- **Cards**: Rounded, shadowed containers (OnX Maps aesthetic)
- **Maps**: MapLibre GL JS for 3D visualization
- **Forms**: Clean, single-column layouts with validation
- **Navigation**: Smooth tab transitions, breadcrumb navigation in detail views
- **Colors**: Ocean blues (#2563EB primary), sailing whites, nautical accent colors
- **Typography**: Clear hierarchy, readable in sunlight, sailing-specific terms

**Data Flow**:
- Venue detection triggers regional adaptation
- AI processes documents → generates strategy → loads to race timer
- GPS tracks uploaded → AI analyzes → performance insights generated
- Cross-venue comparison shows global sailing intelligence

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: RegattaFlow Product Team

**Related Documents**:
- [Sailor Onboarding PRD](./PRD-SAILOR-ONBOARDING.md)
- [Master Plan](./plans/regattaflow-master-plan.md)
- [Sailor Experience](./plans/sailor-experience.md)
- [Race Strategy Planning](./plans/race-strategy-planning.md)
- [Mobile App Experience](./plans/mobile-app-experience.md)
- [Global Sailing Venues](./plans/global-sailing-venues.md)
