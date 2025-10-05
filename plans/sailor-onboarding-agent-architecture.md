# Sailor Onboarding & Dashboard - Agent-Based Architecture

**Status**: Planning
**Created**: October 2, 2025

## Executive Summary

The sailor onboarding and dashboard features will use **Anthropic's Agent SDK** for autonomous AI orchestration instead of manual service orchestration. This reduces code complexity by 80% and enables self-healing, adaptive workflows.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React Native)                  │
│  - Onboarding screens (location, boats, fleets, clubs)      │
│  - Dashboard (next race, weather, course prediction)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Invokes agents with high-level intent
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Agent Layer (NEW)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  OnboardingAgent                                    │    │
│  │  - detect_venue_from_gps                            │    │
│  │  - suggest_boats_by_popularity                      │    │
│  │  - discover_fleets_smart                            │    │
│  │  - suggest_clubs_for_context                        │    │
│  │  - import_races_from_clubs                          │    │
│  │  - finalize_onboarding                              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CoursePredictionAgent                              │    │
│  │  - get_venue_race_courses                           │    │
│  │  - get_weather_forecast_for_race                    │    │
│  │  - match_courses_to_conditions                      │    │
│  │  - analyze_course_suitability (AI reasoning)        │    │
│  │  - save_prediction_to_database                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  RaceAnalysisAgent                                  │    │
│  │  - get_race_timer_session                           │    │
│  │  - analyze_start_performance                        │    │
│  │  - identify_tactical_decisions                      │    │
│  │  - compare_to_pre_race_strategy                     │    │
│  │  - generate_ai_coach_feedback                       │    │
│  │  - save_analysis_to_database                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  VenueIntelligenceAgent (EXISTING - reuse)         │    │
│  │  - GPS detection and venue switching               │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Calls supporting services
                       │
┌──────────────────────▼───────────────────────────────────────┐
│              Supporting Services Layer                       │
│  - LocationDetectionService                                  │
│  - FleetDiscoveryService                                     │
│  - ClubDiscoveryService                                      │
│  - RaceTimerService                                          │
│  - RaceScrapingService                                       │
│  - StandingsScraperService                                   │
│  - Supabase queries                                          │
│  - Weather APIs                                              │
└───────────────────────────────────────────────────────────────┘
```

## Code Comparison: Manual vs Agent-Based

### Onboarding Flow

#### ❌ Manual Orchestration (100+ lines)
```typescript
async function onboardSailor(userId: string, gpsLocation: GPSCoords) {
  // Step 1: Detect venue
  const venues = await LocationDetectionService.searchNearby(gpsLocation);
  const venue = venues[0];

  // Step 2: Get popular boats
  const boats = await BoatClassService.getByVenue(venue.id);
  const popularBoats = boats.filter(b => b.popularity > 0.7);

  // Step 3: Find fleets
  const fleets = await FleetDiscoveryService.findFleets(venue.id, popularBoats[0].id);

  // Step 4: Find clubs
  const clubs = await ClubDiscoveryService.findClubs(venue.id);
  const homeClub = fleets[0].club_id;

  // Step 5: Import races
  for (const club of clubs) {
    const races = await RaceScrapingService.scrapeClubCalendar(club.id);
    await importRaces(userId, races);
  }

  // Step 6: Save everything
  await saveOnboardingData(userId, {venue, boats, fleets, clubs});

  // Error handling, retries, validation... (50+ more lines)
}
```

#### ✅ Agent-Based Orchestration (10 lines)
```typescript
async function onboardSailor(userId: string, gpsLocation: GPSCoords) {
  const onboardingAgent = new OnboardingAgent();

  const result = await onboardingAgent.run({
    userMessage: "Help this Dragon sailor in Hong Kong get started",
    context: { sailorId: userId, gpsCoordinates: gpsLocation }
  });

  if (result.success) {
    // Agent autonomously: detected venue → suggested boats →
    // found fleets → suggested clubs → imported races → saved
    return result.result;
  }
}
```

### Course Prediction

#### ❌ Manual Orchestration (80+ lines)
```typescript
async function predictRaceCourse(regattaId: string) {
  // Get regatta details
  const regatta = await getRegatta(regattaId);

  // Get venue courses
  const courses = await getRaceCourses(regatta.venue_id);

  // Get weather forecast
  const weather = await getWeatherForecast(regatta.venue_id, regatta.start_date);

  // Match courses to conditions
  const matchingCourses = courses.filter(c =>
    c.min_wind_direction <= weather.windDirection &&
    c.max_wind_direction >= weather.windDirection &&
    c.min_wind_speed <= weather.windSpeed &&
    c.max_wind_speed >= weather.windSpeed
  );

  // Use AI to reason (manual prompt engineering)
  const prompt = `Given these courses: ${JSON.stringify(matchingCourses)}
                  and weather: ${JSON.stringify(weather)},
                  which course is most likely?`;
  const aiResponse = await gemini.generateContent(prompt);

  // Parse response, handle errors, save prediction... (40+ more lines)
}
```

#### ✅ Agent-Based Prediction (8 lines)
```typescript
async function predictRaceCourse(regattaId: string) {
  const coursePredictionAgent = new CoursePredictionAgent();

  const result = await coursePredictionAgent.run({
    userMessage: "Predict the race course for tomorrow's regatta",
    context: { regattaId }
  });

  // Agent autonomously: fetched courses → got weather →
  // matched conditions → reasoned about best choice → saved prediction
  return result.result; // { course, confidence: 0.9, reasoning: "..." }
}
```

### Race Analysis

#### ❌ Manual Orchestration (120+ lines)
```typescript
async function analyzeRace(timerSessionId: string) {
  // Get timer session
  const session = await getTimerSession(timerSessionId);

  // Analyze start
  const startAnalysis = analyzeStartTiming(session.track_points.slice(0, 10));

  // Analyze upwind
  const upwindPoints = session.track_points.filter(p => p.heading < 180);
  const upwindAnalysis = analyzeTacks(upwindPoints);

  // Analyze downwind
  const downwindPoints = session.track_points.filter(p => p.heading >= 180);
  const downwindAnalysis = analyzeGybes(downwindPoints);

  // Compare to strategy
  const strategy = await getPreRaceStrategy(session.regatta_id);
  const comparison = compareActualToPlanned(session, strategy);

  // Generate AI feedback (manual prompt)
  const prompt = `Analyze this race:
    Start: ${JSON.stringify(startAnalysis)}
    Upwind: ${JSON.stringify(upwindAnalysis)}
    Downwind: ${JSON.stringify(downwindAnalysis)}
    Strategy Match: ${JSON.stringify(comparison)}`;
  const aiFeedback = await gemini.generateContent(prompt);

  // Parse, save, handle errors... (60+ more lines)
}
```

#### ✅ Agent-Based Analysis (8 lines)
```typescript
async function analyzeRace(timerSessionId: string) {
  const raceAnalysisAgent = new RaceAnalysisAgent();

  const result = await raceAnalysisAgent.run({
    userMessage: "Analyze this race performance",
    context: { timerSessionId }
  });

  // Agent autonomously: loaded GPS → analyzed start →
  // identified tactics → compared to strategy → generated feedback → saved
  return result.result;
}
```

## Key Benefits

### 1. Massive Code Reduction
- **Onboarding**: 100+ lines → 10 lines (90% reduction)
- **Course Prediction**: 80+ lines → 8 lines (90% reduction)
- **Race Analysis**: 120+ lines → 8 lines (93% reduction)
- **Total**: ~300 lines → ~26 lines (91% reduction)

### 2. Self-Healing Workflows
```typescript
// Agent automatically retries failed tools
const result = await onboardingAgent.run({...});

// If GPS detection fails, agent tries:
// 1. Retry GPS with different radius
// 2. Ask user for manual location entry
// 3. Use IP-based location as fallback
// All without explicit error handling code!
```

### 3. Adaptive Intelligence
```typescript
// Agent adapts to data availability
const result = await coursePredictionAgent.run({...});

// If venue has no pre-defined courses:
// Agent autonomously switches to analyzing historical races
// and suggests course layout based on typical patterns
```

### 4. Better Error Messages
```typescript
// ❌ Manual: "JSON parsing failed at line 42"
// ✅ Agent: "I couldn't extract course marks because the sailing
//           instructions don't include GPS coordinates. I recommend
//           using the course diagram upload instead."
```

### 5. Transparent Operations
```typescript
const result = await onboardingAgent.run({...});

console.log(result.toolsUsed);
// ['detect_venue_from_gps', 'suggest_boats_by_popularity',
//  'discover_fleets_smart', 'suggest_clubs_for_context',
//  'import_races_from_clubs', 'finalize_onboarding']

// See exactly what the agent did!
```

## New Agents to Build

### 1. OnboardingAgent
**File**: `src/services/agents/OnboardingAgent.ts`

**Tools**:
- `detect_venue_from_gps` - Reuse VenueIntelligenceAgent
- `suggest_boats_by_popularity` - Query boat_classes with venue filter
- `discover_fleets_smart` - Match fleets by venue + boat class
- `suggest_clubs_for_context` - Auto-suggest clubs from fleet/venue
- `import_races_from_clubs` - Scrape and import races
- `finalize_onboarding` - Save all data, set completion flag

**System Prompt**:
```
You are an expert sailing onboarding assistant. Your goal is to help sailors
set up their RegattaFlow profile by detecting their location, suggesting
appropriate boats, finding their fleets, and importing relevant races.

You should be proactive but always confirm critical decisions with the user.
When suggesting boats or fleets, prioritize popular options at the detected venue.
```

### 2. CoursePredictionAgent
**File**: `src/services/agents/CoursePredictionAgent.ts`

**Tools**:
- `get_venue_race_courses` - Fetch all courses for venue
- `get_weather_forecast_for_race` - Get wind/wave forecast
- `match_courses_to_conditions` - Filter courses by wind range
- `analyze_course_suitability` - AI reasoning for best course
- `save_prediction_to_database` - Store prediction with confidence

**System Prompt**:
```
You are an expert race course predictor. Your goal is to predict which race
course the race committee will use based on weather conditions, typical
patterns, and course characteristics.

Consider wind direction, wind speed, wave conditions, and venue-specific
preferences. Provide clear reasoning and confidence scores.
```

### 3. RaceAnalysisAgent
**File**: `src/services/agents/RaceAnalysisAgent.ts`

**Tools**:
- `get_race_timer_session` - Fetch timer data + GPS track
- `analyze_start_performance` - Compare start to fleet
- `identify_tactical_decisions` - Extract key moments from GPS
- `compare_to_pre_race_strategy` - Match actual vs planned
- `generate_ai_coach_feedback` - Create personalized analysis
- `save_analysis_to_database` - Store AI analysis

**System Prompt**:
```
You are an expert sailing coach analyzing race performance. Your goal is to
provide constructive, actionable feedback that helps sailors improve.

Focus on starts, upwind tactics, downwind tactics, and strategic decisions.
Compare actual performance to pre-race strategy. Be specific and encouraging.
```

## Implementation Checklist

### Phase 1: Agent Creation
- [ ] Create `OnboardingAgent.ts` extending `BaseAgentService`
- [ ] Register 6 onboarding tools
- [ ] Test onboarding flow with sample sailor

- [ ] Create `CoursePredictionAgent.ts` extending `BaseAgentService`
- [ ] Register 5 course prediction tools
- [ ] Test course prediction with weather forecasts

- [ ] Create `RaceAnalysisAgent.ts` extending `BaseAgentService`
- [ ] Register 6 race analysis tools
- [ ] Test race analysis with GPS timer data

### Phase 2: UI Integration
- [ ] Integrate OnboardingAgent with onboarding screens
- [ ] Integrate CoursePredictionAgent with dashboard CoursePredictor component
- [ ] Integrate RaceAnalysisAgent with RecentRaceAnalysis component

### Phase 3: Testing
- [ ] E2E test: GPS → venue → fleet → club → races
- [ ] E2E test: Weather → course prediction with reasoning
- [ ] E2E test: Timer session → AI analysis → coach feedback

## Cost Considerations

### Agent API Costs (Anthropic Claude)
- **OnboardingAgent**: ~10,000 tokens per run (~$0.015 per onboarding)
- **CoursePredictionAgent**: ~5,000 tokens per run (~$0.008 per prediction)
- **RaceAnalysisAgent**: ~15,000 tokens per run (~$0.023 per analysis)

### Monthly Estimates (1000 active sailors)
- Onboarding: 100 new sailors/month × $0.015 = **$1.50/month**
- Course Predictions: 1000 sailors × 4 races/month × $0.008 = **$32/month**
- Race Analysis: 1000 sailors × 4 races/month × $0.023 = **$92/month**

**Total AI Costs**: ~$125/month for 1000 active sailors = **$0.125 per user/month**

Compare to development time saved: 80% code reduction = **months of dev time**

## Success Metrics

### Code Metrics
- [ ] Orchestration code reduced by 80%+
- [ ] Error handling code reduced by 90%+
- [ ] Less than 15 lines per agent invocation

### Performance Metrics
- [ ] Onboarding completion time < 2 minutes
- [ ] Course prediction latency < 10 seconds
- [ ] Race analysis latency < 15 seconds

### Quality Metrics
- [ ] Agent decision accuracy > 85%
- [ ] User satisfaction with AI suggestions > 80%
- [ ] Retry success rate > 90%

## References

- [Anthropic Agent SDK Integration Plan](./anthropic-agent-sdk-integration.md)
- [Sailor Onboarding Flow Plan](./sailor-onboarding-flow.md)
- [Existing BaseAgentService](../src/services/agents/BaseAgentService.ts)
- [Existing VenueIntelligenceAgent](../src/services/agents/VenueIntelligenceAgent.ts)

---

**Next Steps**: Start with Phase 1 database schema, then immediately build OnboardingAgent to prove the architecture.
