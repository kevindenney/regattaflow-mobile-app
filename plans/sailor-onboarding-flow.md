# Sailor Onboarding Flow & Enhanced Dashboard

**Status**: Planning
**Created**: October 2, 2025
**Last Updated**: October 2, 2025

## Overview

Comprehensive sailor onboarding system that captures all essential sailing information (locations, boats, fleets, clubs) and delivers a powerful, context-aware dashboard showing upcoming races, weather, course predictions, and AI-powered analysis.

## User Story

**Primary Persona**: Bram Van Olsen - Dragon sailor based in Hong Kong

### Onboarding Journey
1. **User Type Selection** → Selects "Sailor"
2. **Location Detection** → Auto-detects Hong Kong via GPS, confirms or types to search
3. **Multi-Location Support** → Can add Chicago for winter racing circuit
4. **Boat Selection** → Types "dragon", sees Dragon sailboats, adds multiple boats (owner/crew selection)
5. **Fleet Discovery** → Auto-suggests Hong Kong Dragon Fleet based on location + boat
6. **Fleet Communication** → Option to notify fleet they're on RegattaFlow
7. **Club/Association Selection** → Auto-suggests RHKYC (home of HK Dragon Fleet), adds Hebe Haven YC, International Dragon Association
8. **Race Auto-Import** → Automatically adds races/series/regattas from selected clubs/associations
9. **Dashboard Launch** → Taken to personalized sailor dashboard

### Dashboard Experience
**Prominent Features:**
- **Next Race Card**: Starting sequence, start time, # of races, VHF channel, likely race courses (based on wind forecast)
- **Weather Intelligence**: Current wind, wave, tide forecast for venue
- **Strategy Summary**: Upwind/downwind AI-generated strategy preview
- **Race Analysis**: Most recent race analysis by AI coach + real coach
- **Performance Tracking**: Race tracking via countdown timer (start → stop)
- **Standings Integration**: Scraped standings from Racing Rules of Sailing for each club

## Technical Architecture

### 1. Database Schema

#### New Tables Required

```sql
-- Sailor Locations (Multi-location support)
CREATE TABLE sailor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES sailing_venues(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- {season: 'winter', frequency: 'monthly'}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sailor_id, location_id)
);

-- Sailor Boats (Enhanced from existing sailor_boats)
-- Already exists in 20251003_sailor_boats_separation.sql
-- Needs additions:
ALTER TABLE sailor_boats
  ADD COLUMN IF NOT EXISTS ownership_type TEXT CHECK (ownership_type IN ('owner', 'crew')) DEFAULT 'owner';

-- Sailor Fleets (Track fleet memberships - already exists in fleet_members)
-- Just need to add notification preference
ALTER TABLE fleet_members
  ADD COLUMN IF NOT EXISTS notify_fleet_on_join BOOLEAN DEFAULT false;

-- Sailor Clubs & Associations
CREATE TABLE sailor_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE, -- yacht clubs
  association_id UUID, -- International Dragon Association, etc. (future table)
  club_type TEXT CHECK (club_type IN ('yacht_club', 'class_association')) NOT NULL,
  membership_status TEXT CHECK (membership_status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  membership_number TEXT,
  joined_date DATE,
  auto_import_races BOOLEAN DEFAULT true, -- Auto-add races from this club
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sailor_id, club_id),
  UNIQUE(sailor_id, association_id)
);

-- Class Associations (International Dragon Association, etc.)
CREATE TABLE class_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  class_id UUID REFERENCES boat_classes(id) ON DELETE CASCADE,
  website TEXT,
  racing_rules_url TEXT, -- For scraping standings
  region TEXT, -- 'international', 'north_america', 'europe', etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Race Courses (Pre-populated from club websites)
CREATE TABLE race_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Course A", "Olympic Triangle", "Windward-Leeward"
  description TEXT,
  course_type TEXT CHECK (course_type IN ('windward_leeward', 'olympic', 'trapezoid', 'custom')),

  -- GeoJSON course data
  marks JSONB NOT NULL, -- Array of marks with lat/lng
  layout JSONB, -- Course layout diagram data

  -- Wind conditions this course is used for
  min_wind_direction INTEGER, -- 0-360 degrees
  max_wind_direction INTEGER,
  min_wind_speed DECIMAL(5,2),
  max_wind_speed DECIMAL(5,2),

  -- Metadata
  typical_length_nm DECIMAL(5,2),
  estimated_duration_minutes INTEGER,
  last_used_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, name)
);

-- Race Predictions (AI-powered course prediction based on forecast)
CREATE TABLE race_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  predicted_course_id UUID REFERENCES race_courses(id) ON DELETE SET NULL,

  -- Forecast data used for prediction
  forecast_wind_direction INTEGER,
  forecast_wind_speed DECIMAL(5,2),
  forecast_confidence INTEGER, -- 0-100

  -- AI prediction
  prediction_confidence INTEGER, -- 0-100
  prediction_reasoning TEXT,
  alternative_courses JSONB, -- [{course_id, probability}]

  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  predicted_for_date TIMESTAMPTZ NOT NULL
);

-- Countdown Timer Sessions (Race tracking)
CREATE TABLE race_timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER,

  -- Timer data
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- GPS Track (if available)
  track_points JSONB, -- [{lat, lng, timestamp, speed, heading}]

  -- Race conditions
  wind_direction INTEGER,
  wind_speed DECIMAL(5,2),
  wave_height DECIMAL(5,2),
  current_direction INTEGER,
  current_speed DECIMAL(5,2),

  -- Result
  position INTEGER,
  fleet_size INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach Analysis (Real coach feedback)
CREATE TABLE coach_race_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_session_id UUID REFERENCES race_timer_sessions(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Analysis
  overall_performance TEXT,
  start_analysis TEXT,
  upwind_analysis TEXT,
  downwind_analysis TEXT,
  tactical_decisions TEXT,
  boat_handling TEXT,
  recommendations TEXT,

  -- Rating
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(timer_session_id)
);
```

#### Enhanced Existing Tables

```sql
-- Add onboarding completion flags to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT CHECK (onboarding_step IN (
    'user_type_selected',
    'locations_added',
    'boats_added',
    'fleets_joined',
    'clubs_added',
    'completed'
  )) DEFAULT 'user_type_selected',
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'; -- Store onboarding selections

-- Enhance regattas table for dashboard features
ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS vhf_channel TEXT,
  ADD COLUMN IF NOT EXISTS number_of_races INTEGER,
  ADD COLUMN IF NOT EXISTS starting_sequence TEXT, -- "5-4-1-0" or "10-5-4-1-0"
  ADD COLUMN IF NOT EXISTS predicted_course_id UUID REFERENCES race_courses(id),
  ADD COLUMN IF NOT EXISTS upwind_strategy_summary TEXT,
  ADD COLUMN IF NOT EXISTS downwind_strategy_summary TEXT;
```

### 2. Component Architecture

```
src/app/(auth)/onboarding/
├── _layout.tsx                 # Onboarding navigation wrapper
├── user-type.tsx               # EXISTING - Step 1: User type selection
├── locations.tsx               # NEW - Step 2: Location selection (GPS + search)
├── boats.tsx                   # NEW - Step 3: Boat selection (autocomplete)
├── fleets.tsx                  # NEW - Step 4: Fleet selection (auto-suggest)
├── clubs.tsx                   # NEW - Step 5: Club/Association selection
└── complete.tsx                # NEW - Step 6: Review & confirm

src/components/onboarding/
├── LocationSelector.tsx        # GPS detection + search autocomplete
├── BoatTypeSelector.tsx        # Boat autocomplete with owner/crew toggle
├── FleetDiscovery.tsx          # Fleet auto-suggestions
├── ClubAssociationPicker.tsx   # Club search with auto-suggestions
├── OnboardingProgress.tsx      # Progress indicator component
└── OnboardingReview.tsx        # Final review screen

src/components/dashboard/sailor/
├── NextRaceCard.tsx            # Prominent race card with all details
├── WeatherIntelligence.tsx     # Wind/wave/tide forecast display
├── CoursePredictor.tsx         # AI-powered course prediction
├── StrategyPreview.tsx         # Upwind/downwind strategy summary
├── RecentRaceAnalysis.tsx      # AI + coach analysis display
└── RaceCountdownTimer.tsx      # Timer for tracking races

src/services/
├── OnboardingService.ts        # Orchestrates onboarding flow
├── LocationDetectionService.ts # GPS + venue matching
├── FleetDiscoveryService.ts    # Auto-suggest fleets based on location/boat
├── ClubDiscoveryService.ts     # Auto-suggest clubs based on location/fleet
├── CoursePredictionService.ts  # AI course prediction from weather
├── RaceScrapingService.ts      # Scrape races from club websites
├── StandingsScraperService.ts  # Scrape standings from Racing Rules of Sailing
└── RaceTimerService.ts         # Race timer and GPS tracking
```

### 3. Agent-Based Service Layer (Using Anthropic Agent SDK)

RegattaFlow uses **autonomous AI agents** instead of manual orchestration for complex workflows.

#### OnboardingAgent (NEW - Priority 1)
**Purpose**: Autonomously orchestrate entire sailor onboarding flow

**Custom Tools**:
- `detect_venue_from_gps` - GPS → venue matching with confidence
- `search_sailing_venues` - Text search for manual selection
- `suggest_boats_by_popularity` - Prioritize boats popular at venue
- `discover_fleets_smart` - Auto-suggest fleets by location + boat
- `suggest_clubs_for_context` - Auto-suggest clubs from fleet/venue
- `import_races_from_clubs` - Scrape and import races
- `finalize_onboarding` - Save all data, set completion flag

**Usage**:
```typescript
const onboardingAgent = new OnboardingAgent();
const result = await onboardingAgent.run({
  userMessage: "I'm a Dragon sailor in Hong Kong, help me get started",
  context: {
    sailorId: user.id,
    gpsCoordinates: { lat: 22.28, lng: 114.16 }
  }
});

// Agent autonomously:
// 1. Detects Hong Kong from GPS
// 2. Suggests Dragon (popular there)
// 3. Finds Hong Kong Dragon Fleet
// 4. Suggests RHKYC + Hebe Haven
// 5. Imports races from both clubs
// 6. Completes onboarding
```

#### VenueIntelligenceAgent (EXISTING - Reuse for onboarding)
- Already has GPS detection
- Already has venue switching logic
- Use for Step 2 (Location Detection) of onboarding

#### Supporting Services (Traditional - for agent tools)
These services provide tools that agents call:

##### LocationDetectionService.ts
```typescript
// Called BY OnboardingAgent's tools
interface LocationDetectionService {
  detectCurrentLocation(): Promise<SailingVenue | null>;
  searchLocations(query: string): Promise<SailingVenue[]>;
  addSailorLocation(sailorId: string, venueId: string, isPrimary: boolean): Promise<void>;
  getSailorLocations(sailorId: string): Promise<SailorLocation[]>;
}
```

##### FleetDiscoveryService.ts
```typescript
// Called BY OnboardingAgent's tools
interface FleetDiscoveryService {
  discoverFleets(venueId: string, classId: string): Promise<Fleet[]>;
  joinFleet(sailorId: string, fleetId: string, notifyFleet: boolean): Promise<void>;
  getSuggestedFleets(sailorId: string): Promise<Fleet[]>;
}
```

##### ClubDiscoveryService.ts
```typescript
// Called BY OnboardingAgent's tools
interface ClubDiscoveryService {
  discoverClubs(venueId: string, fleetId?: string): Promise<YachtClub[]>;
  searchClubs(query: string): Promise<YachtClub[]>;
  addClubMembership(sailorId: string, clubId: string, autoImportRaces: boolean): Promise<void>;
  getClubRaces(clubId: string): Promise<Regatta[]>;
}
```

#### CoursePredictionAgent (NEW - Priority 1 for Dashboard)
**Purpose**: Autonomously predict race courses from weather using AI reasoning

**Custom Tools**:
- `get_venue_race_courses` - Fetch all courses for venue
- `get_weather_forecast_for_race` - Get wind/wave forecast
- `match_courses_to_conditions` - Filter by wind range
- `analyze_course_suitability` - AI reasoning for best choice
- `save_prediction_to_database` - Store prediction with confidence

**Usage**:
```typescript
const coursePredictionAgent = new CoursePredictionAgent();
const result = await coursePredictionAgent.run({
  userMessage: "Predict the race course for tomorrow's regatta",
  context: {
    regattaId: "regatta-123",
    venueId: "hong-kong-rhkyc"
  }
});

// Agent autonomously:
// 1. Fetches venue's available courses
// 2. Gets weather forecast (15kts SW wind)
// 3. Matches courses by wind range
// 4. Reasons: "Course A best for SW, Course B backup"
// 5. Saves prediction with 90% confidence
```

#### RaceAnalysisAgent (NEW - Priority 1 for Dashboard)
**Purpose**: Autonomously analyze race timer sessions and generate coach feedback

**Custom Tools**:
- `get_race_timer_session` - Fetch timer data + GPS track
- `analyze_start_performance` - Compare start to fleet
- `identify_tactical_decisions` - Extract key moments
- `compare_to_pre_race_strategy` - Match actual vs planned
- `generate_ai_coach_feedback` - Create analysis summary
- `save_analysis_to_database` - Store AI analysis

**Usage**:
```typescript
const raceAnalysisAgent = new RaceAnalysisAgent();
const result = await raceAnalysisAgent.run({
  userMessage: "Analyze my race performance from today",
  context: {
    timerSessionId: "session-789",
    sailorId: user.id
  }
});

// Agent autonomously:
// 1. Loads GPS track and timer data
// 2. Analyzes start (port tack, 5 seconds early)
// 3. Identifies upwind tactics (2 tacks, right bias)
// 4. Compares to strategy (matched upwind plan)
// 5. Generates: "Strong start, good upwind. Improve downwind gybing."
// 6. Saves analysis with 85% confidence
```

#### Supporting Services (Traditional - tools for agents)

##### RaceScrapingService.ts
```typescript
// Called BY OnboardingAgent and dashboard
interface RaceScrapingService {
  scrapeClubCalendar(clubId: string): Promise<Regatta[]>;
  importClubRaces(sailorId: string, clubId: string): Promise<void>;
  syncAllClubRaces(sailorId: string): Promise<void>;
}
```

##### StandingsScraperService.ts
```typescript
// Called BY dashboard
interface StandingsScraperService {
  scrapeStandings(clubId: string): Promise<Standing[]>;
  updateSailorStandings(sailorId: string): Promise<void>;
  getLatestStandings(sailorId: string, clubId: string): Promise<Standing[]>;
}
```

##### RaceTimerService.ts
```typescript
// Called BY RaceAnalysisAgent and timer component
interface RaceTimerService {
  startTimer(sailorId: string, regattaId: string, raceNumber: number): Promise<string>;
  stopTimer(sessionId: string, position?: number): Promise<void>;
  recordGPSPoint(sessionId: string, point: GPSPoint): Promise<void>;
  getTimerSession(sessionId: string): Promise<RaceTimerSession>;
  getRecentRaces(sailorId: string, limit: number): Promise<RaceTimerSession[]>;
}
```

### 4. Onboarding Flow Implementation

#### Step 1: User Type Selection (EXISTING)
- File: `src/app/(auth)/onboarding.tsx`
- **Action**: User selects "Sailor"
- **Next**: Redirect to `/(auth)/onboarding/locations`

#### Step 2: Location Selection (NEW)
- File: `src/app/(auth)/onboarding/locations.tsx`
- **Features**:
  - Auto-detect location via GPS
  - Display detected venue with confidence score
  - Search bar with autocomplete from `sailing_venues`
  - Multi-selection support
  - Primary location designation
- **Data Saved**: `sailor_locations` table
- **Next**: `/(auth)/onboarding/boats`

#### Step 3: Boat Selection (NEW)
- File: `src/app/(auth)/onboarding/boats.tsx`
- **Features**:
  - Autocomplete from `boat_classes`
  - Filter suggestions by selected locations (if Dragon popular in HK, show it first)
  - Owner vs Crew toggle for each boat
  - Multi-boat support
- **Data Saved**: `sailor_boats` table (with `ownership_type`)
- **Next**: `/(auth)/onboarding/fleets`

#### Step 4: Fleet Discovery (NEW)
- File: `src/app/(auth)/onboarding/fleets.tsx`
- **Features**:
  - Auto-suggest fleets based on location + boat type
  - Example: Hong Kong + Dragon = "Hong Kong Dragon Fleet"
  - Search all fleets if auto-suggestion not found
  - Option to create fleet if doesn't exist
  - Toggle: "Let this fleet know I'm on RegattaFlow" (notify_fleet_on_join)
- **Data Saved**: `fleet_members` table
- **Next**: `/(auth)/onboarding/clubs`

#### Step 5: Club/Association Selection (NEW)
- File: `src/app/(auth)/onboarding/clubs.tsx`
- **Features**:
  - Auto-suggest clubs based on location/fleet
  - Example: HK Dragon Fleet → RHKYC (home club)
  - Search for additional clubs (Hebe Haven YC)
  - Class associations section (International Dragon Association)
  - Multi-selection support
  - Toggle: "Auto-import races from this club"
- **Data Saved**: `sailor_clubs` table
- **Next**: `/(auth)/onboarding/complete`

#### Step 6: Review & Complete (NEW)
- File: `src/app/(auth)/onboarding/complete.tsx`
- **Features**:
  - Summary of all selections
  - Race import status (if enabled)
  - Edit links to go back to any step
  - "Complete Setup" button
- **Action**: Set `onboarding_completed = true`, redirect to `/(tabs)/dashboard`

### 5. Dashboard Implementation

#### NextRaceCard.tsx
```typescript
interface NextRaceCardProps {
  race: {
    id: string;
    title: string;
    startDate: string;
    startTime: string;
    vhfChannel: string;
    numberOfRaces: number;
    startingSequence: string;
    predictedCourse: {
      name: string;
      confidence: number;
      reasoning: string;
    };
  };
  onStartTimer: () => void;
  onViewDetails: () => void;
}
```

#### WeatherIntelligence.tsx
```typescript
interface WeatherIntelligenceProps {
  venue: SailingVenue;
  forecast: {
    wind: { speed: number; direction: number; gusts?: number };
    waves: { height: number; period?: number; direction?: number };
    tide: { type: 'high' | 'low' | 'rising' | 'falling'; time: string; height: number };
    current: { speed: number; direction: number };
  };
  confidence: number;
}
```

#### CoursePredictor.tsx
```typescript
interface CoursePredictorProps {
  prediction: {
    course: RaceCourse;
    confidence: number;
    reasoning: string;
    alternatives: Array<{
      course: RaceCourse;
      probability: number;
    }>;
  };
  onViewCourseMap: (courseId: string) => void;
}
```

#### StrategyPreview.tsx
```typescript
interface StrategyPreviewProps {
  strategy: {
    upwind: string; // AI-generated summary
    downwind: string; // AI-generated summary
    confidence: number;
  };
  onViewFullStrategy: () => void;
}
```

#### RecentRaceAnalysis.tsx
```typescript
interface RecentRaceAnalysisProps {
  analyses: Array<{
    id: string;
    raceDate: string;
    aiAnalysis: {
      summary: string;
      strengths: string[];
      improvements: string[];
      confidence: number;
    };
    coachAnalysis?: {
      summary: string;
      rating: number;
      recommendations: string;
      coach: {
        name: string;
        avatar: string;
      };
    };
  }>;
  onViewDetails: (analysisId: string) => void;
}
```

#### RaceCountdownTimer.tsx
```typescript
interface RaceCountdownTimerProps {
  regattaId: string;
  raceNumber: number;
  onStart: () => void;
  onStop: (position?: number) => void;
  onRecordGPS: (point: GPSPoint) => void;
  isRunning: boolean;
  elapsedTime: number;
}
```

### 6. Data Flow

#### Onboarding Flow
```
User selects "Sailor"
  ↓
GPS detects Hong Kong → Suggests "Hong Kong"
  ↓
User types "dragon" → Shows Dragon class (popular in HK)
  ↓
Auto-suggests "Hong Kong Dragon Fleet"
  ↓
Auto-suggests "RHKYC" (fleet home), "Hebe Haven YC" (common in HK)
  ↓
Auto-suggests "International Dragon Association"
  ↓
Auto-imports races from RHKYC, Hebe Haven, IDA
  ↓
Complete setup → Navigate to Dashboard
```

#### Dashboard Data Flow
```
On Dashboard Mount:
  1. Fetch sailor profile with locations, boats, fleets, clubs
  2. Fetch next race for each class
  3. Fetch weather forecast for venue
  4. Run AI course prediction based on forecast
  5. Fetch/generate race strategy summaries
  6. Fetch recent race timer sessions
  7. Fetch AI analyses for recent races
  8. Fetch coach analyses for recent races
  9. Fetch standings from Racing Rules of Sailing
  10. Display all in unified dashboard
```

## Implementation Plan (Agent-Based Architecture)

### Phase 1: Database Schema (Priority 1)
- [ ] Create migration for sailor onboarding tables
- [ ] Create migration for race tracking tables
- [ ] Create migration for course prediction tables
- [ ] Update existing tables with new fields
- [ ] Set up RLS policies for all new tables

### Phase 2: Agent Implementation (Priority 1) ⭐ NEW
- [ ] Create OnboardingAgent extending BaseAgentService
  - [ ] Tool: detect_venue_from_gps (reuse VenueIntelligenceAgent)
  - [ ] Tool: suggest_boats_by_popularity
  - [ ] Tool: discover_fleets_smart
  - [ ] Tool: suggest_clubs_for_context
  - [ ] Tool: import_races_from_clubs
  - [ ] Tool: finalize_onboarding
- [ ] Create CoursePredictionAgent extending BaseAgentService
  - [ ] Tool: get_venue_race_courses
  - [ ] Tool: get_weather_forecast_for_race
  - [ ] Tool: match_courses_to_conditions
  - [ ] Tool: analyze_course_suitability (AI reasoning)
  - [ ] Tool: save_prediction_to_database
- [ ] Create RaceAnalysisAgent extending BaseAgentService
  - [ ] Tool: get_race_timer_session
  - [ ] Tool: analyze_start_performance
  - [ ] Tool: identify_tactical_decisions
  - [ ] Tool: compare_to_pre_race_strategy
  - [ ] Tool: generate_ai_coach_feedback
  - [ ] Tool: save_analysis_to_database

### Phase 3: Supporting Services (Priority 1)
- [ ] Implement LocationDetectionService (called BY agents)
- [ ] Implement FleetDiscoveryService (called BY agents)
- [ ] Implement ClubDiscoveryService (called BY agents)
- [ ] Implement RaceTimerService with GPS tracking
- [ ] Implement RaceScrapingService for club calendars

### Phase 3: Onboarding UI (Priority 1)
- [ ] Create onboarding navigation layout
- [ ] Build LocationSelector component with GPS + search
- [ ] Build BoatTypeSelector with autocomplete
- [ ] Build FleetDiscovery with auto-suggestions
- [ ] Build ClubAssociationPicker with auto-suggestions
- [ ] Build OnboardingReview summary screen
- [ ] Connect all steps with data persistence

### Phase 4: Dashboard Components (Priority 2)
- [ ] Build NextRaceCard with all race details
- [ ] Build WeatherIntelligence display
- [ ] Build CoursePredictor with AI reasoning
- [ ] Build StrategyPreview component
- [ ] Build RaceCountdownTimer with GPS
- [ ] Build RecentRaceAnalysis with AI + coach

### Phase 5: AI & Scraping Services (Priority 2)
- [ ] Implement CoursePredictionService with AI
- [ ] Implement RaceScrapingService for club calendars
- [ ] Implement StandingsScraperService for rankings
- [ ] Create strategy summary generation
- [ ] Create AI race analysis generation

### Phase 6: Integration & Testing (Priority 3)
- [ ] Test complete onboarding flow
- [ ] Test GPS detection and venue matching
- [ ] Test fleet/club auto-suggestions
- [ ] Test race auto-import
- [ ] Test dashboard data loading
- [ ] Test race timer and GPS tracking
- [ ] Test AI predictions and analysis

### Phase 7: Polish & Optimization (Priority 3)
- [ ] Add loading states and skeletons
- [ ] Add error handling and retry logic
- [ ] Add offline support for race timer
- [ ] Add push notifications for race reminders
- [ ] Optimize database queries
- [ ] Add analytics tracking

## Success Metrics

### Onboarding Completion Rate
- **Target**: >85% of users complete full onboarding
- **Measure**: Track step completion in `users.onboarding_step`

### Auto-Suggestion Accuracy
- **Target**: >70% of users accept auto-suggestions
- **Measure**: Track suggestion acceptance vs manual entry

### Dashboard Engagement
- **Target**: >60% daily active users view dashboard
- **Measure**: Track dashboard views and interactions

### Race Timer Usage
- **Target**: >40% of races tracked with timer
- **Measure**: Track timer sessions vs total races

### AI Analysis Accuracy
- **Target**: >75% confidence on race analysis
- **Measure**: Track `ai_analyses.confidence_score`

## Technical Notes

### GPS Venue Detection Algorithm
1. Get device GPS coordinates
2. Query `sailing_venues` with PostGIS radius search (50km)
3. Rank by distance and venue prominence
4. Return top match with confidence score

### Fleet Auto-Suggestion Algorithm
1. Match sailor's locations with fleet regions
2. Match sailor's boat classes with fleet class_id
3. Filter for public or club-visible fleets
4. Rank by member count and activity
5. Return top 5 suggestions

### Club Auto-Suggestion Algorithm
1. Get fleet's club_id (direct association)
2. Get yacht_clubs at sailor's venues
3. Filter by prestige_level (international/national first)
4. Rank by membership alignment with fleet
5. Return top 5 suggestions

### Course Prediction Algorithm
1. Get venue's race_courses
2. Get weather forecast (wind direction + speed)
3. Match courses by wind_direction and wind_speed ranges
4. Use AI to reason about best course selection
5. Return prediction with confidence and alternatives

### Race Scraping Strategy
1. Identify club website structure
2. Use web scraping (Cheerio/Playwright) to extract calendar
3. Parse race details (date, title, class, venue)
4. Create regatta entries with auto_imported flag
5. Schedule daily scraper jobs for active clubs

## Dependencies

### New NPM Packages
- `expo-location` - GPS detection (already installed)
- `@react-native-async-storage/async-storage` - Onboarding state (already installed)
- `fuse.js` - Fuzzy search for autocomplete
- `cheerio` - Web scraping for race calendars
- `node-cron` - Schedule scraping jobs

### Supabase Functions
- Edge function for course prediction (calls Anthropic Claude)
- Edge function for race scraping (calls club websites)
- Edge function for standings scraping
- Edge function for AI analysis generation

### External APIs
- Google Geocoding API - Location search enhancement
- Weather APIs - Already integrated (NOAA, HKO, etc.)
- Racing Rules of Sailing API - Standings (if available, else scrape)

## Testing Strategy

### Unit Tests
- LocationDetectionService matching logic
- FleetDiscoveryService suggestion algorithm
- ClubDiscoveryService suggestion algorithm
- CoursePredictionService AI prompts

### Integration Tests
- Full onboarding flow from user type to dashboard
- GPS detection → venue match → fleet suggestion chain
- Race auto-import from multiple clubs
- Timer session → AI analysis → coach analysis flow

### E2E Tests
- Complete sailor onboarding (Playwright)
- Dashboard data loading and display
- Race timer start → stop → analysis workflow
- Multi-location sailor experience

## Future Enhancements

### v1.1
- Crew invite system (invite crew members from onboarding)
- Fleet chat/messaging
- Social race results sharing

### v1.2
- Onboarding templates by boat class (pre-select common clubs)
- Smart notifications (race reminders based on venue distance)
- Performance benchmarking across venues

### v1.3
- Onboarding import from SailFlow/Sailing Scuttlebutt profiles
- Multi-boat class dashboard views
- Advanced race analytics with ML insights

## References

- [Global Sailing Venues Plan](./global-sailing-venues.md)
- [Sailor Experience Plan](./sailor-experience.md)
- [Race Strategy Planning](./race-strategy-planning.md)
- [Technical Architecture](./technical-architecture.md)
