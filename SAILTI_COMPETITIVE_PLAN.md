# RegattaFlow vs SAILTI: Competitive Feature Plan

**Version**: 1.0  
**Created**: December 2, 2025  
**Goal**: Match SAILTI's comprehensive regatta management while exceeding with AI-powered intelligence

---

## Executive Summary

**SAILTI** (sailti.com) is a well-established Spanish regatta management platform used by major federations (RYA, RFEV, FFVoile) and international classes (470, IODA, iQFoil). Their modular approach includes:

1. **SAILTI Scoring Soft** - Results calculation
2. **SAILTI Race/Club** - Event operations  
3. **SAILTI Web** - Professional event websites
4. **SAILTI App** - Mobile notifications

**RegattaFlow's Strategy**: Match their operational excellence, then leapfrog with AI-powered intelligence that SAILTI doesn't offer.

---

## Feature Gap Analysis

### SAILTI Has, We Need ✅ → 🚧

| SAILTI Feature | RegattaFlow Status | Priority | Gap |
|----------------|-------------------|----------|-----|
| Scoring Software | 🚧 Basic | High | Need proper scoring engine |
| Jury Web (Protests) | ❌ Missing | High | Major gap |
| Rule 42 Tracking | ❌ Missing | Medium | Competitive advantage |
| Official Notice Board (TOA) | ✅ Basic | Medium | Need enhancement |
| Live Race Signals | 🚧 Partial | High | Need real-time signals |
| Sailor Private Account | ✅ Partial | Medium | Need "My Events" dashboard |
| Federation Rankings | ❌ Missing | Low | Phase 2 feature |
| Sponsor Banner Mgmt | ❌ Missing | Low | Monetization feature |
| Press Accreditation | ❌ Missing | Low | Premium feature |
| Social Wall | ❌ Missing | Low | Nice to have |

### We Have, SAILTI Doesn't (Competitive Advantages) 🚀

| RegattaFlow Feature | SAILTI | Our Advantage |
|---------------------|--------|---------------|
| AI Race Strategy | ❌ | **Major differentiator** |
| AI Post-Race Coaching | ❌ | **Unique value** |
| 3D Bathymetry | ❌ | Premium visualization |
| Weather Intelligence | Basic | StormGlass integration |
| Tidal Analysis | ❌ | AI-powered recommendations |
| GPS Track Recording | ❌ | Performance analytics |
| Venue Intelligence (147+) | Similar | Our 3D + AI enhancement |
| Claude Skills (15+) | ❌ | **Unmatched AI depth** |
| Tactical Zone Mapping | ❌ | Unique feature |

---

## Strategic Phases

### Phase 1: Match SAILTI Core (Weeks 1-4)
**Goal**: Close critical gaps in regatta operations

### Phase 2: Exceed with Intelligence (Weeks 5-8)  
**Goal**: AI-powered features SAILTI can't match

### Phase 3: Federation Scale (Weeks 9-12)
**Goal**: Multi-organization features for federations & classes

### Phase 4: Ecosystem Dominance (Months 4-6)
**Goal**: Become the complete sailing intelligence platform

---

## Phase 1: Match SAILTI Core

### 1.1 Professional Scoring Engine
**Priority**: 🔴 Critical  
**Timeline**: Week 1-2

#### Features
- [ ] Low Point scoring system (default)
- [ ] High Point scoring system
- [ ] Bonus Point system
- [ ] Custom scoring rules (from NOR)
- [ ] Status codes: DNF, DSQ, OCS, DNS, RAF, BFD, DNC, RDG, SCP, NSC
- [ ] Penalty point entry
- [ ] Drop races calculation (configurable)
- [ ] Tie-breaking rules (World Sailing standard)
- [ ] Provisional vs Final results
- [ ] One-click publish to notice board

#### Technical Implementation
```typescript
// services/ScoringEngine.ts
export class ScoringEngine {
  // Scoring systems
  calculateLowPoint(results: RaceResult[]): ScoredResult[];
  calculateHighPoint(results: RaceResult[]): ScoredResult[];
  calculateBonusPoint(results: RaceResult[], config: BonusConfig): ScoredResult[];
  
  // Status code handling
  getStatusPoints(statusCode: StatusCode, boatsInRace: number): number;
  
  // Series calculation
  calculateSeriesStandings(
    races: Race[],
    dropCount: number,
    tieBreakRules: TieBreakRule[]
  ): SeriesStanding[];
  
  // Tie-breaking (World Sailing A8)
  breakTies(standings: SeriesStanding[]): SeriesStanding[];
}
```

#### Database Schema
```sql
CREATE TABLE scoring_configs (
  id UUID PRIMARY KEY,
  championship_id UUID REFERENCES championships(id),
  scoring_system TEXT DEFAULT 'low_point',
  dnf_points TEXT DEFAULT 'boats_plus_one',
  dsq_points TEXT DEFAULT 'boats_plus_two',
  drop_races INTEGER DEFAULT 0,
  drop_after_race INTEGER DEFAULT 4,
  tie_break_rules JSONB,
  custom_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 1.2 Jury Web System (Protests & Rule 42)
**Priority**: 🔴 Critical  
**Timeline**: Week 2-3

#### Features

**Protest Management**
- [ ] Protest time limit countdown (from race finish)
- [ ] Digital protest form (World Sailing standard)
- [ ] Protest list with status tracking
- [ ] Hearing schedule management  
- [ ] Decision entry and publication
- [ ] Appeal workflow
- [ ] Protest committee member management

**Rule 42 (Propulsion) Tracking**
- [ ] Infraction logging (boat, race, infraction type)
- [ ] Yellow flag (warning) tracking
- [ ] Penalty application (automatic scoring)
- [ ] Umpire/observer entry interface
- [ ] Rule 42 report generation

**Request for Redress**
- [ ] Redress request form
- [ ] Hearing workflow
- [ ] Result amendment capability
- [ ] Audit trail for all changes

#### Technical Implementation
```typescript
// services/JuryService.ts
export class JuryService {
  // Protest Time Limits
  setProtestTimeLimit(raceId: string, finishTime: Date, minutes: number): void;
  getTimeRemaining(raceId: string): { minutes: number; expired: boolean };
  
  // Protests
  createProtest(data: ProtestFormData): Promise<Protest>;
  scheduleHearing(protestId: string, time: Date, room: string): Promise<void>;
  recordDecision(protestId: string, decision: ProtestDecision): Promise<void>;
  
  // Rule 42
  logRule42Infraction(data: Rule42Infraction): Promise<void>;
  getRule42Summary(championshipId: string): Rule42Summary[];
  
  // Redress
  requestRedress(data: RedressRequest): Promise<void>;
  amendResult(resultId: string, newPosition: number, reason: string): Promise<void>;
}
```

#### Database Schema
```sql
-- Protests
CREATE TABLE protests (
  id UUID PRIMARY KEY,
  championship_id UUID REFERENCES championships(id),
  race_id UUID REFERENCES races(id),
  protestor_id UUID REFERENCES race_participants(id),
  protestee_id UUID REFERENCES race_participants(id),
  incident_time TIME,
  incident_location TEXT,
  rules_alleged TEXT[],
  description TEXT,
  witnesses TEXT[],
  status TEXT DEFAULT 'pending', -- pending, scheduled, heard, decided, withdrawn
  hearing_time TIMESTAMPTZ,
  hearing_room TEXT,
  decision TEXT,
  penalty TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  filed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rule 42 Infractions
CREATE TABLE rule42_infractions (
  id UUID PRIMARY KEY,
  championship_id UUID REFERENCES championships(id),
  race_id UUID REFERENCES races(id),
  competitor_id UUID REFERENCES race_participants(id),
  infraction_type TEXT, -- pumping, rocking, ooching, sculling, repeated_tacks
  infraction_time TIME,
  is_warning BOOLEAN DEFAULT false, -- Yellow flag
  penalty_applied TEXT, -- none, 720, scoring_penalty, dsq
  observer_id UUID,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protest Time Limits
CREATE TABLE protest_time_limits (
  id UUID PRIMARY KEY,
  race_id UUID REFERENCES races(id),
  finish_time TIMESTAMPTZ,
  time_limit_minutes INTEGER DEFAULT 60,
  expires_at TIMESTAMPTZ,
  is_extended BOOLEAN DEFAULT false,
  extension_reason TEXT
);
```

#### UI Components
```
/app/club/jury/
├── index.tsx          # Jury dashboard
├── protests/
│   ├── index.tsx      # Protest list
│   ├── [id].tsx       # Protest detail
│   └── new.tsx        # File protest form
├── hearings/
│   └── schedule.tsx   # Hearing schedule
├── rule42/
│   ├── index.tsx      # Rule 42 log
│   └── report.tsx     # Rule 42 report
└── time-limits.tsx    # Time limit manager
```

---

### 1.3 Enhanced Official Notice Board (TOA)
**Priority**: 🟡 High  
**Timeline**: Week 3

#### Features
- [ ] Categorized notices (General, Schedule, Course, Safety, Results)
- [ ] Priority levels (Urgent, Important, Standard)
- [ ] Push notification on new urgent notices
- [ ] Read receipts / acknowledgments
- [ ] Document attachments
- [ ] Amendment tracking (version history)
- [ ] Multi-language support (per notice)
- [ ] Scheduled publishing (future notices)
- [ ] Notice templates (standard announcements)

#### Enhancement to Existing System
```typescript
// Enhance existing notice board
interface EnhancedNotice {
  id: string;
  championship_id: string;
  category: 'general' | 'schedule' | 'course' | 'safety' | 'results' | 'protest';
  priority: 'urgent' | 'important' | 'standard';
  title: string;
  body: string;
  attachments: Attachment[];
  version: number;
  supersedes_id?: string; // Links to previous version
  languages: { [locale: string]: { title: string; body: string } };
  publish_at: Date;
  expires_at?: Date;
  requires_acknowledgment: boolean;
  acknowledgments: Acknowledgment[];
  posted_by: string;
  posted_at: Date;
}
```

---

### 1.4 Live Race Signals System
**Priority**: 🟡 High  
**Timeline**: Week 3-4

#### Features
- [ ] Race committee signal console
- [ ] Standard racing signals (AP, N, Y, X, 1st Sub, etc.)
- [ ] Signal sequence timing (5-4-1-0 countdown)
- [ ] Custom signal definitions
- [ ] Real-time push to competitors
- [ ] Signal history log
- [ ] Course board changes
- [ ] Wind direction/speed updates
- [ ] Start sequence management
- [ ] Recall signals (Individual, General, Black Flag)

#### Signal Types
```typescript
enum RaceSignal {
  // Postponement
  AP = 'ap',           // Postponed
  AP_A = 'ap_a',       // Postponed, no racing today
  AP_NUMERAL = 'ap_num', // Postponed, hours
  
  // Start
  WARNING = 'warning',  // Class flag
  PREPARATORY = 'prep', // P flag (or alternatives)
  ONE_MINUTE = 'one_min',
  START = 'start',
  
  // Recalls
  INDIVIDUAL_RECALL = 'x_flag',
  GENERAL_RECALL = 'first_sub',
  BLACK_FLAG = 'black_flag',
  
  // Course
  SHORTENED_COURSE = 's_flag',
  CHANGE_COURSE = 'c_flag',
  MARK_MISSING = 'mark_missing',
  
  // Safety
  ALL_COME_IN = 'n_flag',
  ABANDON = 'n_over_a',
  
  // Other
  PROTEST_FLAG = 'red_flag',
  FINISH = 'blue_flag'
}
```

#### Race Committee Console
```
/app/club/race/control/
├── [id].tsx           # Race control dashboard (enhance existing)
├── signals.tsx        # Signal management
├── start-sequence.tsx # Start sequence wizard
└── course-board.tsx   # Course configuration
```

---

### 1.5 Sailor Dashboard ("My Events")
**Priority**: 🟡 High  
**Timeline**: Week 4

#### Features
- [ ] Unified view of all registered events
- [ ] Registration status per event
- [ ] My results across events
- [ ] Personal ranking/standings
- [ ] Document download (NOR, SI, Amendments)
- [ ] Protest time limit notifications
- [ ] Hearing schedule (if involved)
- [ ] My Rule 42 history
- [ ] Performance trends
- [ ] Favorite competitors tracking
- [ ] Calendar integration

#### UI Structure
```
/app/(tabs)/my-events/
├── index.tsx          # Event list
├── [eventId]/
│   ├── index.tsx      # Event overview
│   ├── results.tsx    # My results
│   ├── documents.tsx  # Event documents
│   └── protests.tsx   # My protests (if any)
└── stats.tsx          # Personal statistics
```

---

## Phase 2: Exceed with Intelligence

### 2.1 AI-Powered Jury Assistant
**Priority**: 🟢 Differentiator  
**Timeline**: Week 5

#### Features
- [ ] Protest form validation (rules citation check)
- [ ] Similar case lookup (precedent finder)
- [ ] Rules interpretation assistant
- [ ] Decision writing assistance
- [ ] Penalty calculation suggestions
- [ ] Fair hearing checklist

#### New Claude Skill
```markdown
# Skill: rules-protest-assistant

You are an expert on World Sailing Racing Rules of Sailing (RRS 2025-2028).

## Capabilities
- Analyze protest descriptions and suggest applicable rules
- Find similar case precedents from World Sailing case book
- Validate protest form completeness
- Suggest questions for protest committee
- Help draft decisions with proper rule citations

## Example Uses
- "Boat A on port tacked in front of B on starboard, forcing B to alter course to avoid collision. What rules apply?"
- "Is this protest form complete? [form details]"
- "Draft a decision for a Rule 10 port/starboard incident"
```

---

### 2.2 Smart Race Results Prediction
**Priority**: 🟢 Differentiator  
**Timeline**: Week 5-6

#### Features
- [ ] Predict race results based on conditions
- [ ] Identify upset potential
- [ ] Weather impact analysis on fleet positions
- [ ] Historical performance vs conditions correlation
- [ ] Form guide (recent results analysis)

#### New Claude Skill
```markdown
# Skill: race-results-predictor

Analyze competitor historical data and current conditions to predict likely race outcomes.

## Inputs
- Fleet list with historical results
- Current weather conditions
- Venue characteristics
- Recent form (last 5 races)

## Outputs
- Predicted finishing positions (with confidence)
- Key matchups to watch
- Upset potential indicators
- Weather advantage analysis
```

---

### 2.3 AI Post-Race Debrief Generator
**Priority**: 🟢 Differentiator  
**Timeline**: Week 6

#### Features
- [ ] Automatic debrief from race results + conditions
- [ ] Wind shift analysis
- [ ] Start analysis
- [ ] Key decision points identification
- [ ] What went right/wrong
- [ ] Actionable improvements for next race

#### Enhancement to Existing Skill
Enhance `race-learning-analyst` to generate automatic debriefs:

```typescript
// Auto-trigger after race results published
async function generateAutoDebrief(raceId: string, userId: string) {
  const raceData = await getRaceData(raceId);
  const userResult = await getUserResult(raceId, userId);
  const conditions = await getConditions(raceId);
  
  const debrief = await claudeClient.generateWithSkill(
    'race-learning-analyst',
    {
      race: raceData,
      result: userResult,
      conditions: conditions,
      mode: 'auto_debrief'
    }
  );
  
  await saveDebrief(raceId, userId, debrief);
  await notifyUser(userId, 'Your race debrief is ready!');
}
```

---

### 2.4 Intelligent Schedule Optimization
**Priority**: 🟢 Differentiator  
**Timeline**: Week 6-7

#### Features
- [ ] Weather-aware race scheduling
- [ ] Optimal race time suggestions
- [ ] Tide/current window optimization
- [ ] Fleet rotation optimization (multi-fleet events)
- [ ] Course area conflict detection
- [ ] Automated postponement recommendations

#### New Service
```typescript
// services/ScheduleOptimizer.ts
export class ScheduleOptimizer {
  async suggestRaceTimes(
    championshipId: string,
    dateRange: DateRange,
    constraints: ScheduleConstraints
  ): Promise<ScheduleSuggestion[]> {
    // Get weather forecast
    const weather = await this.weatherService.getForecast(venueId, dateRange);
    
    // Get tidal data
    const tides = await this.tidalService.getTides(venueId, dateRange);
    
    // Get venue characteristics
    const venue = await this.venueService.getVenue(venueId);
    
    // AI optimization
    return await this.claudeClient.generateWithSkill(
      'schedule-optimizer',
      { weather, tides, venue, constraints }
    );
  }
}
```

---

### 2.5 Real-Time Tactical Recommendations
**Priority**: 🟢 Differentiator  
**Timeline**: Week 7-8

#### Features
- [ ] Live tactical suggestions during race (based on GPS + conditions)
- [ ] Wind shift predictions
- [ ] Optimal tacking/jibing points
- [ ] Layline calculations
- [ ] Current advantage zones
- [ ] Mark rounding suggestions

This builds on existing `racing-console` but adds AI layer:

```typescript
// Real-time tactical engine
export class TacticalEngine {
  // Called every GPS update
  async getTacticalSuggestion(
    position: GPSPosition,
    heading: number,
    courseConfig: CourseConfig,
    currentConditions: WeatherConditions
  ): Promise<TacticalSuggestion> {
    // Quick, low-latency suggestions (cached patterns)
    const quickSuggestion = this.getQuickSuggestion(position, heading);
    
    // Background AI analysis (richer but slower)
    this.queueAIAnalysis(position, conditions);
    
    return quickSuggestion;
  }
}
```

---

## Phase 3: Federation Scale

### 3.1 Multi-Organization Hierarchy
**Timeline**: Week 9-10

#### Features
- [ ] Federation → Class → Club hierarchy
- [ ] National license integration
- [ ] Cross-event sailor rankings
- [ ] World Sailing ID integration (future)
- [ ] Sailor database with career history
- [ ] Class ranking systems (custom formulas)
- [ ] Regional/national/world championship levels

#### Database Schema
```sql
-- Organizations hierarchy
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- federation, class, club
  parent_id UUID REFERENCES organizations(id),
  country TEXT,
  logo_url TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sailor licenses
CREATE TABLE sailor_licenses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  license_number TEXT,
  license_type TEXT, -- competitor, coach, race_officer
  valid_from DATE,
  valid_until DATE,
  status TEXT DEFAULT 'active',
  metadata JSONB
);

-- Rankings
CREATE TABLE rankings (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT, -- "World Ranking", "National Ranking"
  boat_class TEXT,
  calculation_method JSONB,
  updated_at TIMESTAMPTZ
);

CREATE TABLE ranking_entries (
  id UUID PRIMARY KEY,
  ranking_id UUID REFERENCES rankings(id),
  user_id UUID REFERENCES auth.users(id),
  position INTEGER,
  points DECIMAL(10,2),
  events_counted INTEGER,
  last_event_date DATE,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.2 Championship Series Management
**Timeline**: Week 10-11

#### Features
- [ ] Multi-event series (e.g., "National Tour 2026")
- [ ] Points accumulation across events
- [ ] Qualification tracking
- [ ] Wild card entries management
- [ ] Series leaderboards
- [ ] Promotional/relegation rules

---

### 3.3 Advanced Analytics Dashboard
**Timeline**: Week 11-12

#### Features
- [ ] Event participation trends
- [ ] Fleet growth analysis
- [ ] Geographic distribution
- [ ] Demographics (age groups, experience levels)
- [ ] Retention metrics
- [ ] Revenue analytics (for paid events)
- [ ] Competitor engagement scores

---

## Phase 4: Ecosystem Dominance

### 4.1 Sponsor Management System
**Timeline**: Month 4

#### Features
- [ ] Sponsor tier management (Title, Gold, Silver, etc.)
- [ ] Logo placement automation
- [ ] Sponsor analytics (impressions, clicks)
- [ ] Sponsor portal (upload assets, view reports)
- [ ] Prize sponsorship tracking
- [ ] Event branding guidelines enforcement

---

### 4.2 Media & Press Center
**Timeline**: Month 4-5

#### Features
- [ ] Press accreditation system
- [ ] Media kit distribution
- [ ] Photo gallery with tagging
- [ ] Results embeds for media websites
- [ ] Press release templates
- [ ] Social media auto-posting
- [ ] Live commentary integration

---

### 4.3 Video Analysis Platform
**Timeline**: Month 5-6

#### Features
- [ ] Race video upload
- [ ] AI-powered video analysis
- [ ] Tactical replay with annotations
- [ ] Multi-boat comparison views
- [ ] GPS track overlay on video
- [ ] Shareable clips
- [ ] Coaching feedback on video

---

### 4.4 Marketplace & Discovery
**Timeline**: Month 6

#### Features
- [ ] Event discovery by location/class/level
- [ ] Coach marketplace
- [ ] Equipment marketplace (boats for sale/charter)
- [ ] Crew finder
- [ ] Training camps directory
- [ ] Club membership signup

---

## Implementation Priority Matrix

| Phase | Feature | SAILTI Parity | RegattaFlow Advantage | Effort | Priority |
|-------|---------|---------------|----------------------|--------|----------|
| 1 | Scoring Engine | ✅ Match | - | Medium | 🔴 P0 |
| 1 | Jury/Protest System | ✅ Match | AI assistance | High | 🔴 P0 |
| 1 | Enhanced TOA | ✅ Match | Push + AI | Low | 🟡 P1 |
| 1 | Live Signals | ✅ Match | - | Medium | 🟡 P1 |
| 1 | My Events Dashboard | ✅ Match | - | Medium | 🟡 P1 |
| 2 | AI Jury Assistant | ❌ Exceed | **Unique** | Medium | 🟢 Differentiator |
| 2 | Results Prediction | ❌ Exceed | **Unique** | Medium | 🟢 Differentiator |
| 2 | Auto Debrief | ❌ Exceed | **Unique** | Low | 🟢 Differentiator |
| 2 | Schedule Optimizer | ❌ Exceed | **Unique** | Medium | 🟢 Differentiator |
| 2 | Real-time Tactics | ❌ Exceed | **Unique** | High | 🟢 Differentiator |
| 3 | Multi-Org Hierarchy | ✅ Match | - | High | 🟡 P1 |
| 3 | Series Management | ✅ Match | - | Medium | 🟡 P1 |
| 3 | Analytics Dashboard | ✅ Match | AI insights | Medium | 🟡 P1 |
| 4 | Sponsor Management | ✅ Match | - | Medium | 🟠 P2 |
| 4 | Media Center | ✅ Match | - | Medium | 🟠 P2 |
| 4 | Video Analysis | ❌ Exceed | AI-powered | High | 🟠 P2 |
| 4 | Marketplace | ❌ New | Ecosystem | High | 🟠 P2 |

---

## Competitive Positioning

### Our Unique Value Proposition

```
SAILTI: "Complete regatta management"
RegattaFlow: "AI-powered sailing intelligence + Complete regatta management"
```

### Marketing Messages

**To Sailors**:
> "Not just see your results—understand why and how to improve with AI coaching."

**To Race Officers**:
> "Every feature SAILTI has, plus AI that helps you run better regattas."

**To Federations**:
> "Modern, API-first platform with AI insights your members will love."

---

## Success Metrics

### Phase 1 Success (Match SAILTI)
- [ ] Scoring engine handles 100+ boat fleets accurately
- [ ] Protest system used by 3+ events
- [ ] Notice board has 90%+ acknowledgment rate
- [ ] Race signals delivered <1 second latency

### Phase 2 Success (Exceed SAILTI)
- [ ] AI features rated 4.5+ stars by users
- [ ] 50% of users engage with AI debrief
- [ ] Schedule optimizer saves 2+ hours per event
- [ ] Real-time tactics used by 30%+ of competitors

### Phase 3 Success (Federation Scale)
- [ ] 2+ national federations onboarded
- [ ] 5+ class associations using rankings
- [ ] 50+ events per month on platform

---

## Resource Requirements

### Development Team
- **Phase 1**: 2 developers × 4 weeks = 40 dev-days
- **Phase 2**: 2 developers × 4 weeks = 40 dev-days  
- **Phase 3**: 2 developers × 4 weeks = 40 dev-days
- **Phase 4**: 3 developers × 8 weeks = 120 dev-days

### AI/ML Investment
- **New Claude Skills**: 5-8 new skills needed
- **Fine-tuning**: Consider domain-specific model tuning
- **Token Budget**: ~$500/month for development, scale with usage

### External Integrations
- **World Sailing API** (future): For sailor ID validation
- **Stripe**: Already integrated
- **StormGlass**: Already integrated
- **Video Processing**: Cloud service (AWS/GCP) for video analysis

---

## Timeline Summary

```
Week 1-2:   Scoring Engine
Week 2-3:   Jury/Protest System  
Week 3:     Enhanced Notice Board
Week 3-4:   Live Race Signals
Week 4:     My Events Dashboard
────────────────────────────────
Week 5:     AI Jury Assistant
Week 5-6:   Results Prediction
Week 6:     AI Auto Debrief
Week 6-7:   Schedule Optimizer
Week 7-8:   Real-time Tactics
────────────────────────────────
Week 9-10:  Multi-Org Hierarchy
Week 10-11: Series Management
Week 11-12: Analytics Dashboard
────────────────────────────────
Month 4:    Sponsor Management
Month 4-5:  Media Center
Month 5-6:  Video Analysis
Month 6:    Marketplace
```

---

## Next Steps

1. **Immediate**: Start Phase 1.1 (Scoring Engine)
2. **This Week**: Design Jury system database schema
3. **Next Week**: Prototype AI Jury Assistant skill
4. **Ongoing**: Monitor SAILTI for new features

---

**Document Owner**: Product Team  
**Last Updated**: December 2, 2025  
**Review Cadence**: Bi-weekly

