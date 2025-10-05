# Product Requirements Document: Club/Race Committee Experience (Post-Onboarding)

## Overview
**Product**: RegattaFlow Club & Race Management Platform (Post-Onboarding)
**Target User**: Race committees, club managers, regatta organizers (Primary Persona: John Smith - PRO, RHKYC, 30+ years race management)
**Goal**: Deliver professional race management platform for creating events, managing entries, running races, scoring, and publishing results
**Platform**: React Native (iOS/Android/Web via Expo) - **Desktop-optimized for race office**
**Vision**: Transform race management from scattered spreadsheets and manual processes into unified digital race operations

---

## Navigation Structure & Information Architecture

### Bottom Tab Navigation (Club/RC Mode)
```typescript
interface ClubTabNavigation {
  visibleTabs: [
    'Dashboard',      // Home - RC command center
    'Calendar',       // Events - Regatta calendar
    'Entries',        // Entry - Registration management
    'Races',          // Races - Active race management
    'Results',        // Results - Scoring and standings
    'More'            // Hamburger menu - Additional features
  ];

  hamburgerMenuItems: [
    'Club Profile',         // Club information and branding
    'Members',              // Member database management
    'Fleets',               // Fleet and class management
    'Officials',            // Race committee roster
    'Documents',            // NORs, SIs, course diagrams
    'Communications',       // Email/SMS to sailors
    'Analytics',            // Race stats and insights
    'Settings',             // Club configuration
    'Billing'               // Subscription and payments
  ];
}
```

### User Journey Architecture
```
Post-Onboarding Entry → Dashboard (Race Committee Command Center)
├── Upcoming Regatta Management
├── Active Race Control (race day)
├── Results Processing & Publishing
└── Fleet Analytics & Reports

Typical Race Management Workflow:
1. Pre-Regatta: Create event → Publish NOR → Manage entries → Assign marks
2. Race Week: Publish SIs → Final entries → Weather briefing → Course setup
3. Race Day: Launch race → Monitor progress → Record finishes → Resolve protests
4. Post-Race: Score results → Publish standings → Email sailors → Analytics review
5. Series Management: Track cumulative standings → Apply drops → Crown champions
```

---

## Screen-by-Screen Specifications

## 1. Dashboard Tab - Race Committee Command Center

### Purpose
Central hub for race management with upcoming regattas, active races, recent results, and quick actions.

### Layout Structure
```typescript
interface ClubDashboardScreen {
  header: {
    clubName: string;
    venueLocation: string;
    quickStats: {
      upcomingRaces: number;
      pendingEntries: number;
      activeRaces: number;
      unpublishedResults: number;
    };
  };

  sections: [
    'Next Regatta Card',
    'Active Races (if race day)',
    'Pending Tasks',
    'Recent Results',
    'Fleet Activity Summary',
    'Quick Actions Grid'
  ];
}
```

### Next Regatta Card (Top Priority)
**Visual Design**: Hero card with regatta details and preparation checklist

**Content**:
```
┌─────────────────────────────────────────┐
│ UPCOMING REGATTA                        │
│ RHKYC Spring Series 2025 - Race 1       │
│                                         │
│ 📅 Saturday, March 15, 2025             │
│ 🏁 First Warning: 13:00 HKT            │
│ 📍 Victoria Harbour East                │
│ ⛵ Classes: Dragon (15 entries)         │
│                                         │
│ ⏰ 2 days, 14 hours until start         │
│                                         │
│ PREPARATION STATUS:                     │
│ ┌───────────────────────────────────┐  │
│ │ ✅ NOR Published (Feb 28)          │  │
│ │ ✅ SIs Published (March 10)        │  │
│ │ ✅ Online Registration Open        │  │
│ │ ⚠️ Course Set (needs assignment)   │  │
│ │ ⚠️ Mark Boat Assigned (pending)    │  │
│ │ ✅ Weather Forecast Ready          │  │
│ │ ⚠️ Protests Committee (2 of 3)     │  │
│ │ ❌ Results Template (not set)      │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ENTRIES: 15 of 20 (75% capacity)        │
│ • 3 new entries today                   │
│ • Entry deadline: March 13 (tomorrow!)  │
│ • 2 pending payments                    │
│                                         │
│ CONDITIONS FORECAST:                    │
│ Wind: 12-15kt NE (ideal)                │
│ Tide: Flood 0.8kt @ 13:00               │
│ Temp: 22°C, Clear skies                 │
│ Confidence: 85% ✅                       │
│                                         │
│ QUICK ACTIONS:                          │
│ [Review Entries] [Set Course]          │
│ [Send Briefing Email] [Race Day Prep]  │
│                                         │
│ [View Full Regatta Details]            │
└─────────────────────────────────────────┘
```

### Active Races Card (Race Day Only)
**Visual**: Real-time race status with live updates

**Content** (shown only on race day):
```
┌─────────────────────────────────────────┐
│ 🏁 RACE IN PROGRESS                     │
│ Dragon Class - Race 1                   │
│                                         │
│ STATUS: Racing ⏱️                       │
│ Elapsed Time: 00:43:21                  │
│                                         │
│ FLEET STATUS:                           │
│ • On course: 15 boats                   │
│ • Finished: 0 boats                     │
│ • DNF: 0 boats                          │
│ • Retired: 0 boats                      │
│                                         │
│ CURRENT LEADERS (estimated):            │
│ 1. Dragon #892 (David Lee)              │
│ 2. Dragon #1104 (Emma Wilson)           │
│ 3. Dragon #1247 (Bram Van Olsen)        │
│                                         │
│ COURSE: Windward-Leeward (2 laps)       │
│ Leg: Beat to Mark 1 (Lap 2)             │
│                                         │
│ CONDITIONS (Live):                      │
│ Wind: 14kt @ 045° NE                    │
│ Current: 0.9kt Flood ↗                  │
│                                         │
│ [View Race Control] [Record Finish]     │
│ [Emergency Stop] [Abandon Race]         │
└─────────────────────────────────────────┘
```

### Pending Tasks Card
**Visual**: To-do list style with urgency indicators

**Content**:
```
┌─────────────────────────────────────────┐
│ ⚠️ PENDING TASKS (8)                    │
│                                         │
│ URGENT (Due Today):                     │
│ 🔴 Respond to 2 entry payment issues    │
│ 🔴 Assign mark boat for tomorrow        │
│ 🔴 Publish Spring Series R2 SIs         │
│                                         │
│ THIS WEEK:                              │
│ 🟡 Review 3 pending race entries        │
│ 🟡 Score and publish last week's results│
│ 🟡 Send reminder email (R2 entry closes)│
│                                         │
│ UPCOMING:                               │
│ 🟢 Create NOR for Summer Championship   │
│ 🟢 Update fleet rosters (annual review) │
│                                         │
│ [View All Tasks] [Delegate]            │
└─────────────────────────────────────────┘
```

### Recent Results Card
```
┌─────────────────────────────────────────┐
│ 📊 RECENT RESULTS                       │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Spring Series R5 (March 8)         │  │
│ │ Dragon Class • 12 boats            │  │
│ │                                    │  │
│ │ Winner: David Lee (#892)           │  │
│ │ Status: ✅ Published               │  │
│ │ Views: 127 • Downloads: 23         │  │
│ │                                    │  │
│ │ [View Results] [Edit] [Archive]    │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Spring Series R4 (March 1)         │  │
│ │ Dragon Class • 12 boats            │  │
│ │                                    │  │
│ │ Winner: Emma Wilson (#1104)        │  │
│ │ Status: ✅ Published               │  │
│ │                                    │  │
│ │ [View Results]                     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [View All Results]                      │
└─────────────────────────────────────────┘
```

### Fleet Activity Summary
```
┌─────────────────────────────────────────┐
│ 📈 CLUB STATISTICS (Last 30 Days)       │
│                                         │
│ RACING ACTIVITY:                        │
│ • Regattas: 12 events                   │
│ • Total Races: 47 individual races      │
│ • Participants: 142 unique sailors      │
│ • Avg Fleet Size: 11.2 boats/race       │
│                                         │
│ FLEET GROWTH:                           │
│ • New Members: 8 (+5% vs last month)    │
│ • Active Sailors: 89 (63% participation)│
│ • Retention Rate: 94% ✅                │
│                                         │
│ TOP PERFORMERS:                         │
│ • Dragon: David Lee (2.1 avg)           │
│ • J/70: Sarah Kim (1.8 avg)             │
│ • Etchells: Michael Chen (3.2 avg)      │
│                                         │
│ [View Detailed Analytics]               │
└─────────────────────────────────────────┘
```

### Quick Actions Grid
```
┌─────────────────┬─────────────────┬─────────────────┐
│ 📅 Create       │ 📝 Publish      │ 📊 Score        │
│ New Race        │ Documents       │ Results         │
├─────────────────┼─────────────────┼─────────────────┤
│ 📧 Email        │ 👥 Manage       │ 📈 View         │
│ Fleet           │ Entries         │ Analytics       │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## 2. Calendar Tab - Regatta & Event Management

### Purpose
Unified calendar showing all regattas, series, championships, and club events with full CRUD operations.

### Calendar View (Default)
```
┌─────────────────────────────────────────┐
│ RACING CALENDAR                         │
│ View: [Month] Week | Day | List         │
│ Filter: [All] Series | Championship | Club│
│                                         │
│        March 2025                       │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat     │
│                   1    2    3    4      │
│   5    6    7    8    9   10   11      │
│  12   13   14  [15] [16]  17   18      │
│  19   20   21  [22]  23   24   25      │
│  26   27   28   29   30   31           │
│                                         │
│ Legend:                                 │
│ 🔵 Confirmed regatta                    │
│ 🟡 Draft/Planning                       │
│ 🔴 Race day (today)                     │
│ 🟢 Completed with results               │
│                                         │
│ [+ Create Regatta] [Import Calendar]    │
└─────────────────────────────────────────┘
```

### Regatta Detail View
```
┌─────────────────────────────────────────┐
│ RHKYC SPRING SERIES 2025 - RACE 1       │
│ Status: Confirmed 🔵                     │
│                                         │
│ BASICS:                                 │
│ • Date: Saturday, March 15, 2025        │
│ • First Warning: 13:00 HKT             │
│ • Classes: Dragon (one-design)          │
│ • Type: Series Race (1 of 8)            │
│ • Format: Fleet Racing                  │
│                                         │
│ ENTRIES:                                │
│ • Registered: 15 boats                  │
│ • Limit: 20 boats                       │
│ • Entry Fee: $0 (club members)          │
│ • Registration: Open until March 13     │
│ • Pending Payments: 2                   │
│                                         │
│ COURSE:                                 │
│ • Type: Windward-Leeward                │
│ • Laps: 2                               │
│ • Marks: RC to assign                   │
│ • Distance: ~3.5nm estimated            │
│ • Time Limit: 90 minutes                │
│                                         │
│ OFFICIALS:                              │
│ • PRO: John Smith ✅                    │
│ • Assistant PRO: Sarah Lee ✅           │
│ • Mark Boat: (not assigned) ⚠️          │
│ • Protest Committee: 2 of 3 assigned ⚠️ │
│                                         │
│ DOCUMENTS:                              │
│ • NOR: Published Feb 28 ✅              │
│ • SIs: Published March 10 ✅            │
│ • Course Diagram: Uploaded ✅           │
│ • Entry List: Auto-generated            │
│                                         │
│ WEATHER:                                │
│ • Forecast: 12-15kt NE (85% confidence) │
│ • Tide: Flood 0.8kt @ start             │
│ • Conditions: Excellent for racing ✅   │
│                                         │
│ COMMUNICATIONS:                         │
│ • Last Email: Entry reminder (March 10) │
│ • Next Email: Race briefing (March 14)  │
│                                         │
│ [Edit Details] [Manage Entries]        │
│ [Publish Documents] [Cancel Race]       │
└─────────────────────────────────────────┘
```

### Create New Regatta Flow
```
┌─────────────────────────────────────────┐
│ CREATE NEW REGATTA                      │
│                                         │
│ QUICK START TEMPLATES:                  │
│ ┌───────────────────────────────────┐  │
│ │ 📋 Series Race                     │  │
│ │ Regular series race with standard  │  │
│ │ format and settings                │  │
│ │ [Use Template]                     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 🏆 Championship Event              │  │
│ │ Multi-day championship with        │  │
│ │ qualifying and finals              │  │
│ │ [Use Template]                     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 🎯 Custom Regatta                  │  │
│ │ Build from scratch with full       │  │
│ │ customization                      │  │
│ │ [Start Custom]                     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ OR COPY EXISTING:                       │
│ [Duplicate Last Regatta]                │
│ [Copy from Template Library]            │
└─────────────────────────────────────────┘
```

**Regatta Configuration Form** (Series Race Template):
```
┌─────────────────────────────────────────┐
│ SERIES RACE CONFIGURATION               │
│ Template: Spring Series Race            │
│                                         │
│ BASIC INFORMATION:                      │
│ Event Name: _______________________     │
│ Series: [Spring Series 2025 ▼]         │
│ Race Number in Series: [1 ▼]           │
│                                         │
│ DATE & TIME:                            │
│ Date: [March 15, 2025]                  │
│ First Warning: [13:00] HKT             │
│ Estimated Duration: [2 hours ▼]        │
│                                         │
│ CLASSES & DIVISIONS:                    │
│ ✅ Dragon (Fleet Racing)                 │
│ ☐ J/70 (Fleet Racing)                   │
│ ☐ Etchells (Fleet Racing)               │
│                                         │
│ COURSE:                                 │
│ Type: [Windward-Leeward ▼]             │
│ Laps: [2]                               │
│ Marks: [Auto-assign ▼] Manual          │
│ Time Limit: [90] minutes                │
│                                         │
│ ENTRY MANAGEMENT:                       │
│ ☐ Online registration enabled           │
│ Entry Fee: [$__] (0 for club members)  │
│ Entry Limit: [20] boats                 │
│ Late Entry Surcharge: [+$__]            │
│ Entry Deadline: [2 days before ▼]      │
│                                         │
│ SCORING:                                │
│ System: [Low Point (RRS Appendix A) ▼] │
│ Ties: [RRS A8 ▼]                        │
│ Protests: [Standard ▼]                  │
│                                         │
│ OFFICIALS (auto-filled from defaults):  │
│ PRO: [John Smith ▼]                     │
│ Assistant PRO: [Sarah Lee ▼]            │
│ Mark Boat: [Assign later ▼]            │
│                                         │
│ DOCUMENTS (auto-generate):              │
│ ✅ Use series NOR                        │
│ ✅ Generate standard SIs                 │
│ ☐ Custom course diagram needed          │
│                                         │
│ COMMUNICATIONS:                         │
│ ✅ Send entry confirmation emails        │
│ ✅ Send race day reminders (1 day before)│
│ ✅ Publish results to website            │
│ ☐ Send results email to fleet           │
│                                         │
│ [Save as Draft] [Create & Publish]      │
│ [Save as Template]                      │
└─────────────────────────────────────────┘
```

---

## 3. Entries Tab - Registration Management

### Purpose
Manage sailor registrations, payments, entry lists, and late entries for all regattas.

### Entry Overview Screen
```
┌─────────────────────────────────────────┐
│ ENTRY MANAGEMENT                        │
│ Filter: [All Regattas] Upcoming | Past  │
│ Search entries...                       │
│                                         │
│ SPRING SERIES R1 (March 15)             │
│ 15 entries • 2 pending • Entry open     │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Dragon #892 • David Lee            │  │
│ │ Status: ✅ Confirmed & Paid         │  │
│ │ Entered: March 1, 2025             │  │
│ │ Fee: $0 (club member)              │  │
│ │ [View] [Edit] [Remove]             │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Dragon #1247 • Bram Van Olsen      │  │
│ │ Status: ✅ Confirmed & Paid         │  │
│ │ Entered: March 3, 2025             │  │
│ │ Crew: Sarah Johnson (2), Mike Chen │  │
│ │ [View] [Edit] [Contact]            │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Dragon #555 • New Sailor ⚠️        │  │
│ │ Status: ⚠️ Payment Pending          │  │
│ │ Entered: March 12, 2025            │  │
│ │ Fee: $50 USD (guest entry)         │  │
│ │ [Send Payment Reminder] [Manual]   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ + 12 more entries                       │
│                                         │
│ ACTIONS:                                │
│ [+ Add Manual Entry] [Export List]      │
│ [Send Entry Confirmation] [Close Entry] │
└─────────────────────────────────────────┘
```

### Entry Detail View
```
┌─────────────────────────────────────────┐
│ ENTRY DETAILS                           │
│ Dragon #1247 • Bram Van Olsen           │
│                                         │
│ SAILOR INFORMATION:                     │
│ • Name: Bram Van Olsen                  │
│ • Email: bram@example.com               │
│ • Phone: +852-XXXX-XXXX                 │
│ • Club: RHKYC                           │
│ • Member #: 4783                        │
│                                         │
│ BOAT INFORMATION:                       │
│ • Class: International Dragon           │
│ • Sail Number: 1247                     │
│ • Boat Name: "Fire Dragon"              │
│ • Builder: Borsboom (2019)              │
│ • Country: Hong Kong 🇭🇰                │
│                                         │
│ CREW:                                   │
│ • Helmsman: Bram Van Olsen              │
│ • Crew 1: Sarah Johnson (Tactician)     │
│ • Crew 2: Michael Chen (Trimmer)        │
│                                         │
│ ENTRY DETAILS:                          │
│ • Entered: March 3, 2025                │
│ • Entry Fee: $0 (club member discount)  │
│ • Payment Status: ✅ Paid               │
│ • Payment Method: Member account        │
│                                         │
│ ADDITIONAL INFO:                        │
│ • Emergency Contact: Sarah Johnson      │
│   (+852-XXXX-XXXX)                      │
│ • Special Requirements: None            │
│ • Insurance: ✅ Verified                 │
│                                         │
│ RACE HISTORY AT CLUB:                   │
│ • Total Races: 23                       │
│ • Average Position: 4.2                 │
│ • Last Race: Spring R5 (3rd place)      │
│                                         │
│ [Edit Entry] [Send Email] [Remove]      │
│ [View Sailor Profile]                   │
└─────────────────────────────────────────┘
```

### Add Manual Entry Form
```
┌─────────────────────────────────────────┐
│ ADD MANUAL ENTRY                        │
│ Spring Series R1 (March 15)             │
│                                         │
│ SEARCH EXISTING SAILORS:                │
│ [Search by name, sail number, email...] │
│                                         │
│ Recent Sailors:                         │
│ • David Lee (#892) - Last entry: R5     │
│ • Emma Wilson (#1104) - Last entry: R4  │
│ • Bram Van Olsen (#1247) - Last: R5     │
│                                         │
│ OR ADD NEW SAILOR:                      │
│                                         │
│ SAILOR DETAILS:                         │
│ Full Name: _______________________      │
│ Email: ___________________________      │
│ Phone: ___________________________      │
│                                         │
│ BOAT DETAILS:                           │
│ Class: [Dragon ▼]                       │
│ Sail Number: _____                      │
│ Boat Name: ______________  (optional)   │
│ Country: [Hong Kong 🇭🇰 ▼]              │
│                                         │
│ CREW (optional):                        │
│ Crew 1: _______________ (Role: _____)   │
│ Crew 2: _______________ (Role: _____)   │
│ [+ Add Crew Member]                     │
│                                         │
│ PAYMENT:                                │
│ Entry Fee: [$0] (club member)           │
│ Payment Status:                         │
│ • ☐ Paid (mark as paid now)             │
│ • ☐ Pending (send payment link)         │
│ • ☐ Waived (RC discretion)              │
│                                         │
│ NOTES (optional):                       │
│ ___________________________________     │
│                                         │
│ [Add Entry] [Save & Add Another]        │
└─────────────────────────────────────────┘
```

### Entry List Export
```
┌─────────────────────────────────────────┐
│ EXPORT ENTRY LIST                       │
│ Spring Series R1 (15 entries)           │
│                                         │
│ FORMAT:                                 │
│ • ☐ PDF (formatted entry list)          │
│ • ☐ Excel/CSV (for external scoring)    │
│ • ☐ SailWave format (.blw)              │
│ • ☐ RegattaNetwork API                  │
│                                         │
│ INCLUDE:                                │
│ ✅ Sail number                           │
│ ✅ Boat name                             │
│ ✅ Helmsman name                         │
│ ✅ Crew names                            │
│ ✅ Country/Club                          │
│ ☐ Contact information                   │
│ ☐ Payment status                        │
│                                         │
│ SORT BY:                                │
│ • Sail number (ascending)               │
│ • Helmsman name (alphabetical)          │
│ • Entry date                            │
│                                         │
│ [Generate Export] [Preview]             │
└─────────────────────────────────────────┘
```

---

## 4. Races Tab - Active Race Management (Race Day)

### Purpose
Real-time race control interface for PROs and race committee during active racing.

**Note**: This tab is optimized for **desktop/tablet use in race office**

### Race Control Dashboard (Race Day)
```
┌─────────────────────────────────────────┐
│ 🏁 RACE CONTROL                         │
│ Spring Series R1 • Dragon Class         │
│                                         │
│ STATUS: Pre-Race Sequence               │
│ ⏰ Next Warning: 12:55:00 (T-5:00)      │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │   COURSE MAP (Live)                │  │
│ │                                    │  │
│ │   [Interactive Map View]           │  │
│ │   • Start line (green)             │  │
│ │   • Mark 1 (red) - windward        │  │
│ │   • Mark 2 (yellow) - leeward      │  │
│ │   • Finish line (blue)             │  │
│ │   • RC boat position (purple)      │  │
│ │   • Fleet positions (if AIS)       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ FLEET:                                  │
│ • Total Entered: 15 boats               │
│ • On Water: 15 boats ✅                 │
│ • DNS: 0                                │
│                                         │
│ CONDITIONS (Live):                      │
│ Wind: 14kt @ 045° NE                    │
│ Current: 0.9kt Flood ↗                  │
│ Temp: 22°C                              │
│ Start Line Bias: Pin favored +3°        │
│                                         │
│ RACE COMMITTEE:                         │
│ • PRO: John Smith (on RC boat) ✅       │
│ • Mark Boat: Deployed @ Mark 1 ✅       │
│ • Finish Boat: Standby                  │
│ • Safety Boat: On station ✅            │
│                                         │
│ [START SEQUENCE] [Postpone] [Abandon]   │
└─────────────────────────────────────────┘
```

### Start Sequence Interface
```
┌─────────────────────────────────────────┐
│ 🚦 START SEQUENCE                       │
│ Dragon Class                            │
│                                         │
│ COUNTDOWN TIMER:                        │
│ ┌───────────────────────────────────┐  │
│ │          -05:00                    │  │
│ │    [Huge digital countdown]        │  │
│ │                                    │  │
│ │    Warning Signal Next             │  │
│ └───────────────────────────────────┘  │
│                                         │
│ SEQUENCE:                               │
│ ✅ -5:00  Warning (Class flag + sound)  │
│ ⏳ -4:00  Preparatory (P flag + sound)  │
│ ⏳ -1:00  One minute (P flag down + long)│
│ ⏳  0:00  Start (Class flag down + sound)│
│                                         │
│ FLAGS DISPLAYED:                        │
│ 🏴 Dragon Class Flag (blue)             │
│ 🏴 Preparatory P (pending)              │
│                                         │
│ RECALLS (if needed):                    │
│ ☐ Individual Recall (X flag + sound)    │
│ ☐ General Recall (1st Substitute + 2 sounds)│
│                                         │
│ COURSE BOARD:                           │
│ Display: "W-L 2 laps"                   │
│ Marks: 1-2-1-2-Finish                   │
│                                         │
│ [▶️ Start Countdown] [⏸️ Postpone]       │
│ [⏹️ Abandon] [🔄 General Recall]        │
│                                         │
│ QUICK ACTIONS:                          │
│ [Black Flag] [U Flag] [Z Flag]         │
│ [Shorten Course] [Change Course]        │
└─────────────────────────────────────────┘
```

### Race in Progress Interface
```
┌─────────────────────────────────────────┐
│ ⏱️ RACE IN PROGRESS                     │
│ Dragon Class • Race 1                   │
│                                         │
│ RACE TIME: 00:43:21                     │
│ Status: Beat to Mark 1 (Lap 2)          │
│                                         │
│ FLEET TRACKING:                         │
│ ┌───────────────────────────────────┐  │
│ │   [Live Map with Boat Positions]   │  │
│ │   • 15 boats on course             │  │
│ │   • Leaders approaching Mark 1      │  │
│ │   • All boats accounted for        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ESTIMATED LEADERS:                      │
│ 1. #892 (David Lee) - near Mark 1       │
│ 2. #1104 (Emma Wilson) - 2 lengths back │
│ 3. #1247 (Bram Van Olsen) - 5 lengths  │
│                                         │
│ FINISHERS: 0 of 15                      │
│                                         │
│ INCIDENTS:                              │
│ • 00:12:45 - Boat #555 touched Mark 1   │
│   (protest potential)                   │
│ • No other incidents logged             │
│                                         │
│ CONDITIONS (Updated):                   │
│ Wind: 15kt @ 042° NE (↑ 1kt)           │
│ Current: 1.0kt Flood (↑ 0.1kt)         │
│                                         │
│ [Record Finish] [Log Incident]         │
│ [Shorten Course] [Abandon Race]         │
└─────────────────────────────────────────┘
```

### Finish Recording Interface
```
┌─────────────────────────────────────────┐
│ 🏁 RECORD FINISHES                      │
│ Dragon Class • Race 1                   │
│                                         │
│ METHOD:                                 │
│ • [Manual Entry] Sail # + Time          │
│ • [FinishLynx Integration] Auto-detect  │
│ • [Mobile App] Finish judge input       │
│                                         │
│ FINISHES RECORDED:                      │
│ ┌───────────────────────────────────┐  │
│ │ 1. #892 (David Lee)                │  │
│ │    Time: 01:23:45 ✅               │  │
│ │    [Edit] [Remove]                 │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 2. #1104 (Emma Wilson)             │  │
│ │    Time: 01:24:12 ✅               │  │
│ │    [Edit] [Remove]                 │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 3. #1247 (Bram Van Olsen)          │  │
│ │    Time: 01:24:38 ✅               │  │
│ │    [Edit] [Remove]                 │  │
│ └───────────────────────────────────┘  │
│                                         │
│ NEXT BOAT:                              │
│ Sail #: [____] Time: [01:__:__] [Add]   │
│                                         │
│ PENDING FINISHES: 12 boats              │
│                                         │
│ TIME LIMIT: 01:30:00 (6:15 remaining)   │
│                                         │
│ SCORING CODES:                          │
│ [DNS] [DNF] [DSQ] [OCS] [RAF]          │
│                                         │
│ [Save Finishes] [Provisional Results]   │
└─────────────────────────────────────────┘
```

### Post-Race Summary
```
┌─────────────────────────────────────────┐
│ ✅ RACE COMPLETE                        │
│ Dragon Class • Race 1                   │
│                                         │
│ RACE DETAILS:                           │
│ • Start Time: 13:00:00                  │
│ • Winner Finish: 14:23:45               │
│ • Duration: 1:23:45                     │
│ • Course: Windward-Leeward (2 laps)     │
│ • Distance: 3.8nm actual                │
│                                         │
│ FLEET RESULTS:                          │
│ • Finished: 14 boats                    │
│ • DNF: 1 boat (#777 - mechanical)       │
│ • DNS: 0                                │
│ • DSQ: 0                                │
│                                         │
│ CONDITIONS:                             │
│ • Wind: 12-16kt NE (variable)           │
│ • Current: 0.8-1.0kt Flood              │
│ • Weather: Clear, excellent racing      │
│                                         │
│ PROTESTS & INCIDENTS:                   │
│ • 1 protest filed: #555 vs #892         │
│   (mark touching incident)              │
│   Status: Hearing scheduled 16:00       │
│                                         │
│ PROVISIONAL RESULTS:                    │
│ 1. #892 David Lee (1:23:45)             │
│ 2. #1104 Emma Wilson (1:24:12)          │
│ 3. #1247 Bram Van Olsen (1:24:38)       │
│ ... (see full results)                  │
│                                         │
│ NEXT STEPS:                             │
│ ☐ Resolve protests (1 pending)          │
│ ☐ Score results (provisional ready)     │
│ ☐ Publish results to website            │
│ ☐ Send results email to fleet           │
│                                         │
│ [Score Results] [View Protests]         │
│ [Export Race Data] [Archive Race]       │
└─────────────────────────────────────────┘
```

---

## 5. Results Tab - Scoring & Standings

### Purpose
Score races, manage series standings, handle protests, and publish results.

### Results Overview
```
┌─────────────────────────────────────────┐
│ RESULTS & SCORING                       │
│ Filter: [All] Pending | Published | Series│
│                                         │
│ PENDING SCORING (2):                    │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Spring Series R1 (March 15) ⚠️     │  │
│ │ Dragon Class • 15 boats            │  │
│ │ Status: Provisional - 1 protest    │  │
│ │ [Score Results] [Resolve Protest]  │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Spring Series R2 (March 22) ⚠️     │  │
│ │ Dragon Class • 14 boats            │  │
│ │ Status: Ready to score             │  │
│ │ [Score Results]                    │  │
│ └───────────────────────────────────┘  │
│                                         │
│ SERIES STANDINGS:                       │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Spring Series 2025 (Dragon)        │  │
│ │ Races: 2 of 8 completed            │  │
│ │ Leader: David Lee (3 pts)          │  │
│ │ Last Updated: March 22             │  │
│ │ [View Standings] [Update]          │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [+ Score New Race] [Export Results]     │
└─────────────────────────────────────────┘
```

### Score Race Interface
```
┌─────────────────────────────────────────┐
│ SCORE RACE                              │
│ Spring Series R1 • Dragon Class         │
│                                         │
│ SCORING SYSTEM:                         │
│ Low Point (RRS Appendix A)              │
│ Ties: RRS A8 (last race tiebreaker)     │
│                                         │
│ RESULTS:                                │
│ ┌──┬───────┬─────────────────┬──────┐  │
│ │Pl│Sail # │ Helmsman        │Points│  │
│ ├──┼───────┼─────────────────┼──────┤  │
│ │1 │892    │David Lee        │  1   │  │
│ │2 │1104   │Emma Wilson      │  2   │  │
│ │3 │1247   │Bram Van Olsen   │  3   │  │
│ │4 │673    │Tom Zhang        │  4   │  │
│ │5 │445    │Sarah Kim        │  5   │  │
│ │6 │332    │Mike Roberts     │  6   │  │
│ │7 │221    │Lisa Chen        │  7   │  │
│ │8 │118    │Andy Wong        │  8   │  │
│ │9 │997    │Jane Smith       │  9   │  │
│ │10│854    │Chris Lee        │  10  │  │
│ │11│763    │Pat Johnson      │  11  │  │
│ │12│652    │Sam Wilson       │  12  │  │
│ │13│541    │Alex Kim         │  13  │  │
│ │14│430    │Casey Chen       │  14  │  │
│ │DNF│777   │Bob Martin       │  16  │  │
│ └──┴───────┴─────────────────┴──────┘  │
│                                         │
│ SCORING ADJUSTMENTS:                    │
│ ☐ Apply 20% penalty to #555 (OCS)       │
│ ☐ Apply DSQ to #__ (protest upheld)     │
│ ☐ Apply redress to #__ (give avg pts)   │
│                                         │
│ PROTESTS & REQUESTS:                    │
│ • #555 vs #892 - Resolved: No penalty   │
│                                         │
│ [Edit Results] [Apply Penalties]        │
│ [Save & Publish] [Save as Draft]        │
└─────────────────────────────────────────┘
```

### Series Standings View
```
┌─────────────────────────────────────────┐
│ SERIES STANDINGS                        │
│ Spring Series 2025 • Dragon Class       │
│                                         │
│ SERIES INFO:                            │
│ • Races Completed: 2 of 8               │
│ • Scoring: Low Point (1 drop after R4)  │
│ • Minimum Races: 4 to qualify           │
│                                         │
│ OVERALL STANDINGS:                      │
│ ┌──┬───────┬─────────────┬────────────┐│
│ │Pl│Sail # │ Helmsman    │Total (Drop)││
│ ├──┼───────┼─────────────┼────────────┤│
│ │1 │892    │David Lee    │3 pts (—)   ││
│ │  │       │ R1:1 R2:2   │            ││
│ ├──┼───────┼─────────────┼────────────┤│
│ │2 │1104   │Emma Wilson  │5 pts (—)   ││
│ │  │       │ R1:2 R2:3   │            ││
│ ├──┼───────┼─────────────┼────────────┤│
│ │3 │1247   │Bram V Olsen │7 pts (—)   ││
│ │  │       │ R1:3 R2:4   │            ││
│ ├──┼───────┼─────────────┼────────────┤│
│ │4 │673    │Tom Zhang    │8 pts (—)   ││
│ │  │       │ R1:4 R2:4   │            ││
│ ├──┼───────┼─────────────┼────────────┤│
│ │5 │445    │Sarah Kim    │6 pts (—)   ││
│ │  │       │ R1:5 R2:1   │            ││
│ └──┴───────┴─────────────┴────────────┘│
│ ... (15 boats total)                    │
│                                         │
│ RACE-BY-RACE VIEW:                      │
│ [View Each Race] [Compare Races]        │
│                                         │
│ [Export Standings] [Publish to Website] │
│ [Email to Fleet] [Print]                │
└─────────────────────────────────────────┘
```

### Publish Results Interface
```
┌─────────────────────────────────────────┐
│ PUBLISH RESULTS                         │
│ Spring Series R1 • Dragon Class         │
│                                         │
│ PUBLISHING OPTIONS:                     │
│                                         │
│ ✅ Club Website (regattaflow.app/rhkyc) │
│    → Results will appear on public page │
│                                         │
│ ✅ Email to Fleet (15 sailors)          │
│    → Send results email with PDF        │
│                                         │
│ ☐ Social Media (Facebook/Instagram)     │
│    → Auto-post results with image       │
│                                         │
│ ☐ SailRaceResults.com                   │
│    → Sync to global results database    │
│                                         │
│ ☐ RegattaNetwork.com                    │
│    → Share with broader sailing community│
│                                         │
│ FORMAT OPTIONS:                         │
│ ✅ PDF (formatted results sheet)         │
│ ✅ HTML (web display)                    │
│ ☐ Excel/CSV (download)                  │
│                                         │
│ EMAIL TEMPLATE:                         │
│ ┌───────────────────────────────────┐  │
│ │ Subject: Spring Series R1 Results  │  │
│ │                                    │  │
│ │ Dear Dragon Fleet,                 │  │
│ │                                    │  │
│ │ Thank you for racing in Spring     │  │
│ │ Series Race 1. Results are now     │  │
│ │ available (attached and online).   │  │
│ │                                    │  │
│ │ Winner: David Lee (#892)           │  │
│ │ Series Leader: David Lee (3 pts)   │  │
│ │                                    │  │
│ │ Next Race: March 22, 13:00         │  │
│ │                                    │  │
│ │ See you on the water!              │  │
│ │ RHKYC Race Committee               │  │
│ └───────────────────────────────────┘  │
│ [Edit Template]                         │
│                                         │
│ [Preview] [Publish Now] [Schedule]      │
└─────────────────────────────────────────┘
```

---

## Success Metrics

### Club Engagement
- **Daily Active Clubs**: 70% of subscribed clubs use weekly
- **Races Managed**: 10+ races/month per active club
- **Results Published**: <24 hours after race completion (avg)
- **Entry Management**: 80% online registrations vs manual
- **Document Publishing**: 95% of races have NOR/SIs

### Platform Performance
- **Race Day Uptime**: 99.9% availability
- **Entry Processing**: <2 seconds per entry
- **Results Publishing**: <1 minute to publish
- **Mobile Responsiveness**: Full functionality on tablet (race office)
- **Offline Support**: Race control works without internet

### Business Metrics
- **Free → Paid Conversion**: 50% within 60 days (trial period)
- **Annual Retention**: 90%+ (clubs rarely switch systems)
- **Average Club Revenue**: $3,600/year (Club Pro tier)
- **Support Tickets**: <5% of clubs need help per month
- **NPS Score**: 70+ (race committees recommend platform)

---

## Technical Requirements

### Race Day Performance
**Critical**: System must be reliable during live racing

- **Offline-first architecture**: Race control works without internet
- **Sync when online**: Results upload when connection restored
- **Local data caching**: All race data stored locally during race
- **Real-time updates**: WebSocket connections for multi-device sync
- **Backup systems**: Export race data to CSV/Excel at any time

### Integration APIs
- **SailWave**: Import/export race data
- **FinishLynx**: Auto-timing integration
- **RegattaNetwork**: Results syndication
- **Stripe**: Payment processing for entries
- **SendGrid**: Email notifications and results

### Data Models (Additional)

**Race**:
```typescript
{
  id: uuid,
  regatta_id: uuid (FK),
  race_number: number,
  class: string,
  start_time: timestamp,
  course_type: enum,
  laps: number,
  status: 'scheduled' | 'postponed' | 'in_progress' | 'finished' | 'abandoned',
  start_sequence_log: json,
  finish_times: json[],
  scoring_code: json,
  protests: json[],
  created_at: timestamp
}
```

**Results**:
```typescript
{
  id: uuid,
  race_id: uuid (FK),
  entry_id: uuid (FK),
  position: number,
  finish_time: timestamp | null,
  elapsed_time: interval | null,
  points: number,
  scoring_code: 'FIN' | 'DNF' | 'DNS' | 'DSQ' | 'OCS' | 'RAF' | 'RDG',
  penalty: number | null,
  created_at: timestamp
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: RegattaFlow Product Team

**Related Documents**:
- [Club Onboarding PRD](./PRD-CLUB-ONBOARDING.md)
- [Sailor Experience PRD](./PRD-POST-ONBOARDING-EXPERIENCE.md)
- [Master Plan](./plans/regattaflow-master-plan.md)
- [Club Management](./plans/club-management.md)
