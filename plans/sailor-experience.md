# Sailor Experience Plan
*Living Document - Last Updated: September 25, 2025*

## Overview
Complete user journey and feature set for sailors using RegattaFlow, based on our primary persona Bram Van Olsen.

## User Persona: Bram Van Olsen

### Profile
- **Class**: Dragon sailor
- **Location**: Hong Kong (RHKYC, Heebie Haven YC)
- **Competition Level**: International (Japan, Europe, Australia)
- **Goal**: Dragon World Championships November 2026
- **Boat**: Borsboom hull #1247 (Netherlands)
- **Sails**: North Sails (Main DNM-2024, Jib DNJ-2024, Spin DNS-2023)
- **Mast**: Seldén D-Section
- **Crew**: Team of 3 including himself

### Current Pain Points
1. Information scattered across multiple yacht club PDFs
2. No unified racing calendar
3. Manual performance tracking
4. Equipment service tracking in spreadsheets
5. Crew coordination via multiple WhatsApp groups
6. Different registration systems per venue
7. No integrated tuning guide application

## Core Features

### 1. AI Race Strategy Planning (OnX Maps for Sailing)

#### Intelligent Race Course Builder
```typescript
interface RaceCourseBuilder {
  documentParsing: {
    ai: 'Google AI Gemini for sailing instruction analysis';
    extraction: {
      course_layout: 'Windward-leeward, triangle, custom';
      mark_positions: 'GPS coordinates from descriptions';
      boundaries: 'Racing area limits and hazards';
      schedule: 'Start times and sequences';
    };
    confidence: 'Scoring system for extraction accuracy';
  };
  visualization: {
    engine: 'MapLibre GL JS for 3D course rendering';
    layers: {
      bathymetry: 'Depth visualization with shading';
      nautical: 'Official navigation charts';
      satellite: 'High-resolution imagery overlay';
    };
    marks: 'Accurate 3D mark positioning';
    boundaries: 'Visual racing area definition';
  };
}
```

#### Multi-Layer Environmental Intelligence
```typescript
interface EnvironmentalLayers {
  wind: {
    current: 'Real-time wind vectors with arrows';
    forecast: 'Multi-model predictions with confidence';
    historical: 'Venue-specific pattern analysis';
    animation: 'Smooth wind flow visualization';
  };
  current: {
    tidal: 'Tidal current flow and timing';
    surface: 'Wind-driven surface currents';
    predictions: 'Precise timing for race window';
  };
  tactical: {
    laylines: 'Wind-dependent sailing angles';
    startLine: 'Line bias and approach analysis';
    favoredSides: 'Statistical advantage zones';
    windShadows: 'Land effect and wind hole mapping';
  };
}
```

#### AI Strategic Planning Engine
```typescript
interface StrategyEngine {
  analysis: {
    courseOptimization: 'Fastest routes for conditions';
    equipmentRecommendations: 'Borsboom + North Sails optimization';
    tacticalZones: 'Key decision points identified';
    riskAssessment: 'Strategy robustness scoring';
  };
  simulation: {
    monteCarlo: '1000+ race outcome simulations';
    variableModeling: 'Weather and fleet behavior';
    probabilistic: 'Finish position probabilities';
    sensitivity: 'Impact of tactical decisions';
  };
  recommendations: {
    startStrategy: 'Line position and timing';
    beatStrategy: 'Upwind tactical plan';
    markStrategy: 'Approach and rounding tactics';
    runStrategy: 'Downwind sailing plan';
  };
}
```

### 2. Document Management System

#### Upload Methods
```typescript
interface DocumentUpload {
  methods: {
    pdf: 'Direct PDF upload',
    link: 'Website URL for scraping',
    photo: 'OCR from printed documents',
    email: 'Forward to regatta@regattaflow.app'
  };
  processing: 'AI-powered extraction';
  storage: 'Organized by event/venue/type';
}
```

#### AI Document Processing
- **Extracts**: Dates, times, courses, requirements
- **Highlights**: Amendments and changes
- **Organizes**: By event, venue, document type
- **Notifies**: Updates and deadline reminders

### 2. Enhanced Race Tracking & Strategic Execution

#### Pre-Race Strategic Preparation
```typescript
interface PreRaceStrategy {
  strategyLoading: {
    aiGenerated: 'Load pre-planned race strategy';
    weatherUpdate: 'Real-time condition adjustments';
    equipmentCheck: 'Confirm boat setup matches plan';
    crewBriefing: 'Share tactical plan with crew';
  };
  liveIntelligence: {
    startLineBias: 'Real-time line bias calculation';
    windTrends: 'Live wind shift detection';
    fleetAnalysis: 'Competitor positioning analysis';
    tacticalAlerts: 'Strategy deviation warnings';
  };
  raceData: {
    radioChannels: 'VHF channels with auto-reminders';
    startSequence: 'Visual and audio countdown';
    courseData: 'Mark positions and tactical notes';
    contingencyPlans: 'Backup strategies ready';
  };
}
```

#### Tactical Race Timer Interface
```typescript
interface TacticalTimer {
  strategyIntegration: {
    currentPlan: 'Active tactical plan display';
    nextDecision: 'Upcoming tactical decision points';
    recommendations: 'AI tactical suggestions';
    confidence: 'Strategy performance indicators';
  };
  raceExecution: {
    voiceCommands: 'Hands-free operation';
    eventLogging: 'Tacks, gybes, mark roundings';
    performanceTracking: 'Real-time vs target analysis';
    strategyDeviations: 'Track when plan changes';
  };
}
```

#### Post-Race Strategic Analysis
```typescript
interface StrategyValidation {
  performanceCorrelation: {
    planExecution: 'How well was strategy followed?';
    decisionImpact: 'Which calls made the difference?';
    equipmentEffect: 'Setup impact on performance';
    conditionAccuracy: 'Forecast vs actual analysis';
  };
  learningIntegration: {
    strategyDatabase: 'Update venue-specific knowledge';
    aiImprovement: 'Refine recommendation algorithms';
    personalPatterns: 'User-specific performance insights';
    equipmentOptimization: 'Setup refinement suggestions';
  };
}

### 3. Equipment & Setup Management

#### Boat Configuration
```typescript
interface BoatSetup {
  hull: {
    builder: 'Borsboom',
    number: 1247,
    year: 2019,
    characteristics: 'Excellent upwind, sweet spot 10-18kt'
  };
  mast: {
    manufacturer: 'Seldén',
    type: 'D-Section',
    settings: {
      rake: '23\'6"',
      bend: '125mm',
      shroudTension: '350kg'
    }
  };
  sails: {
    main: { model: 'DNM-2024', races: 16, condition: 'Excellent' },
    jib: { model: 'DNJ-2024', races: 9, condition: 'Excellent' },
    spinnaker: { model: 'DNS-2023', races: 33, condition: 'Service needed' }
  };
}
```

#### Tuning Guide Integration
- North Sails Dragon tuning matrix
- Condition-specific recommendations
- Historical setup database
- Performance correlation analysis

#### Maintenance Tracking
- Service schedules and reminders
- Equipment location tracking
- Usage statistics
- Vendor integration (North Sails)

### 4. Performance Analytics

#### Race Performance Metrics
```typescript
interface RaceMetrics {
  results: {
    finish: number,
    fleet: number,
    elapsed: string,
    handicap: number
  };
  performance: {
    upwindSpeed: 'Fleet avg + 0.2kt',
    vmg: number,
    maneuvers: { tacks: 8, gybes: 4 },
    gains: 'Position changes by leg'
  };
  tactical: {
    startPosition: number,
    keyDecisions: Decision[],
    windShifts: 'Detection and response'
  };
}
```

#### Season Analytics
- Performance trends over time
- Venue-specific statistics
- Condition-based analysis
- World Championship readiness tracking

### 5. Crew Management

#### Crew Database
```typescript
interface CrewMember {
  name: string;
  position: 'Bow' | 'Mid' | 'Helm';
  availability: Calendar;
  experience: 'Races together';
  contact: ContactInfo;
}
```

#### Features
- Crew availability calendar
- Event invitations
- Performance history together
- Travel coordination for international events

### 6. Global Venue Intelligence & Location Awareness

#### Automatic Venue Detection & Adaptation
```typescript
interface LocationAwareExperience {
  venueDetection: {
    gps: 'Automatic detection within 50m radius';
    venueDatabase: '147+ major sailing venues worldwide';
    offlineCache: 'Last 10 visited venues cached';
    manualOverride: 'User venue selection available';
  };

  dynamicAdaptation: {
    weatherSources: 'Regional weather services (NOAA, ECMWF, JMA)';
    culturalContext: 'Language, currency, customs adaptation';
    localServices: 'Marina, rigging, accommodation directory';
    racingIntelligence: 'Venue-specific tactical knowledge';
  };
}
```

#### Home Venue vs Traveling Sailor Mode
```typescript
interface VenueExperience {
  homeVenue: {
    familiarityLevel: 'Expert knowledge with full historical data';
    personalStats: 'Races: 23 completed, 4.2 avg finish';
    localNetwork: 'Club contacts, crew, service providers';
    performanceOptimization: 'Setup correlation with conditions';
  };

  travelingMode: {
    venueIntelligence: 'Comprehensive briefing package';
    culturalAdaptation: 'Language, customs, protocols guide';
    localContacts: 'Recommended services and connections';
    equipmentAdvice: 'Shipping vs charter recommendations';
  };
}
```

#### Global Sailing Venue Categories
- **🏆 Championship Venues (23)**: America's Cup, Olympics, World Championships
- **🌟 Premier Racing Centers (45)**: SF Bay, Cowes, Mediterranean Circuit
- **🌍 Regional Hubs (79)**: Great Lakes, Caribbean, Baltic Sea, Asia-Pacific
- **🏛️ Historic Venues**: Traditional sailing locations with heritage protocols

#### Regional Weather Intelligence
```typescript
interface RegionalWeatherSources {
  northAmerica: {
    primary: 'NOAA/NWS - Official marine forecasts';
    local: 'Weather stations and buoy network';
    specialty: 'Great Lakes thermal modeling';
  };

  europe: {
    primary: 'ECMWF - Highest accuracy global model';
    regional: 'Met Office (UK), Météo-France, DWD (Germany)';
    specialty: 'Mediterranean mistral prediction';
  };

  asiaPacific: {
    primary: 'JMA (Japan), Hong Kong Observatory';
    specialty: 'Typhoon tracking and local conditions';
    southern: 'Bureau of Meteorology (Australia)';
  };
}
```

#### Cultural & Economic Intelligence
```typescript
interface CulturalAdaptation {
  languageSupport: {
    interface: 'Auto-switch based on venue location';
    sailingTerms: 'Regional terminology variations';
    emergency: 'Critical phrases in local language';
  };

  economicIntelligence: {
    currency: 'Automatic currency detection/conversion';
    costs: 'Entry fees, accommodation, dining estimates';
    tipping: 'Local customs and expected rates';
    payment: 'Preferred payment methods by region';
  };

  socialProtocols: {
    racingEtiquette: 'Venue-specific customs and traditions';
    clubProtocols: 'Royal Yacht Squadron vs casual club differences';
    networking: 'International sailing community connections';
  };
}
```

### 7. International Racing Calendar Intelligence

#### Global Circuit Optimization
```typescript
interface GlobalRacingPlanner {
  circuitPlanning: {
    mediterranean: 'Monaco → Porto Cervo → Palma optimization';
    asiaPacific: 'Hong Kong → Japan → Australia pathway';
    championship: 'World Championship qualifying events';
    budget: 'Cost optimization across international events';
  };

  conflictDetection: {
    overlapping: 'Event date conflicts and travel time';
    logistics: 'Equipment shipping deadlines';
    preparation: 'Adequate preparation time between venues';
  };

  recommendations: {
    skillDevelopment: 'Venue variety for different conditions';
    networking: 'Events for international connections';
    qualification: 'Optimal path to World Championships';
  };
}
```

#### Travel Planning Intelligence
```typescript
interface TravelPlanningSystem {
  logistics: {
    equipmentShipping: 'Cost analysis: shipping vs charter vs purchase';
    accommodation: 'Sailor-friendly lodging recommendations';
    transportation: 'Airport transfers, local transport options';
    documentation: 'Visa requirements, health certificates';
  };

  preparation: {
    culturalBriefing: 'Language basics, customs, protocols';
    venueIntelligence: 'Local conditions, hazards, opportunities';
    networkIntroductions: 'Local sailing community connections';
    practiceRecommendations: 'Acclimatization schedule';
  };

  onArrival: {
    localOrientation: 'Venue familiarization checklist';
    serviceProviders: 'Rigging, sail repair, chandlery contacts';
    emergencyInfo: 'Medical, marine emergency contacts';
    socialCalendar: 'Racing community events and gatherings';
  };
}
```

### 8. World Championship Preparation

#### Progress Tracking
- Racing experience requirements
- International event participation
- Performance benchmarks across different venues
- Equipment readiness for various conditions
- Budget tracking for global racing campaign

#### Global Qualification Strategy
```typescript
interface ChampionshipStrategy {
  qualificationPath: {
    currentRanking: 'Global ranking position: 47th';
    targetRanking: 'Top 20 for World Championship qualification';
    requiredResults: 'Average 3rd place finishes needed';
    optimalEvents: '8 remaining qualifiers, 5 strategically chosen';
  };

  venueStrategy: {
    homeAdvantage: 'Maximize results at familiar venues';
    internationalExperience: 'Build experience at championship-level venues';
    conditionVariety: 'Experience in varied wind/water conditions';
    culturalAdaptation: 'International racing protocol experience';
  };
}

## User Journey Map

### Discovery & Onboarding
1. Downloads app from sailing media article
2. Creates account with sailing profile
3. **Global Location Setup**: GPS detects Hong Kong, auto-configures for Asia-Pacific region
4. Adds boat configuration (Dragon #1247, Borsboom hull)
5. **Venue Intelligence**: System recognizes RHKYC as home venue, loads local racing calendar
6. Uploads first race documents (RHKYC Spring Series)
7. **Cultural Adaptation**: Interface optimized for Hong Kong (English/Chinese, HKD currency)
8. Receives personalized dashboard with global venue awareness

### Regular Usage Pattern

#### Weekly Planning
- Reviews upcoming events
- Checks crew availability
- Plans equipment maintenance
- Reviews weather forecasts

#### Pre-Race (Day Before)
- Downloads race documents
- Reviews tactical notes
- Checks equipment setup guide
- Confirms crew attendance

#### Race Day Morning
- Final conditions check
- Radio channel reference
- Setup checklist review
- Timer preparation

#### During Race
- Start timer activation
- Event logging (voice/tap)
- Position tracking
- Minimal distraction interface

#### Post-Race
- Results review
- Performance analysis
- Setup notes for next race
- Share with crew/family

### Advanced Usage
- Coach session integration
- Video analysis upload
- Fleet comparison studies
- Equipment optimization

### Global Venue Travel Experience

#### Bram's Japan Trip Planning (Hong Kong → Hiroshima)
1. **Pre-Travel Intelligence**
   - System detects Japan Dragon Cup in calendar
   - Generates venue transition briefing: Hong Kong → Hiroshima Bay
   - Cultural adaptation guide: Cantonese → Japanese protocols
   - Equipment analysis: Shipping vs charter recommendation
   - Weather pattern comparison: Monsoon vs Variable conditions

2. **Travel Day Optimization**
   - Offline venue data synchronized for Hiroshima Bay
   - Time zone adjustment (HKT → JST) for race schedules
   - Cultural protocol reminders activated
   - Local emergency contacts loaded
   - Japanese sailing terminology available offline

3. **Arrival & Venue Transition**
   - GPS detects location change: Auto-switch to Japan mode
   - Interface adapts: Japanese elements, Yen currency
   - Hiroshima Bay tactical intelligence activated
   - JMA weather service integration enabled
   - Local Dragon Association contacts provided
   - Cultural etiquette reminders (bowing, gift protocols)

4. **Local Integration**
   - Venue-specific sailing conditions briefing
   - Tidal information (3.8m range vs 1.2m in Hong Kong)
   - Local hazards: Fish farming areas, shipping channels
   - Equipment optimization for lighter air conditions
   - Connection to local Dragon fleet and sailors

#### Mediterranean Circuit Experience (Monaco → Porto Cervo → Palma)
1. **Circuit Planning Intelligence**
   - Three-venue logistics optimization
   - Charter boat vs shipping cost analysis
   - Cultural transitions: French → Italian → Spanish
   - Budget optimization across luxury sailing destinations

2. **Venue-Specific Adaptations**
   - **Monaco**: Light air patience tactics, luxury protocols
   - **Porto Cervo**: Mistral variability, Sardinian culture
   - **Palma**: Consistent conditions, accessible environment

3. **Cultural Intelligence Integration**
   - Language adaptation at each venue
   - Dining customs and tipping protocols
   - Racing etiquette variations by region
   - Social networking opportunities

## Interface Design Principles

### Mobile-First
- One-handed operation during racing
- Large tap targets for gloved hands
- High contrast for sunlight readability
- Offline capability for racing areas

### Information Architecture
```
Dashboard
├── Next Race Card
├── Recent Updates
├── Quick Actions
└── Performance Summary

Documents
├── By Event
├── By Venue
├── By Type
└── Recently Added

Racing
├── Timer & Tracking
├── Conditions
├── Tactical Notes
└── Results

Equipment
├── Boat Setup
├── Maintenance
├── Tuning Guide
└── Service History

Analytics
├── Race Analysis
├── Season Progress
├── Fleet Comparison
└── Goals Tracking
```

## Integration Points

### With Club Systems
- Automatic entry submission
- Results synchronization
- Document updates
- Registration confirmation

### With Coach Platform
- Performance data sharing
- Session scheduling
- Progress tracking
- Video analysis

### External Services
- Weather services
- Tide and current data
- Marina/harbor information
- Equipment vendor systems

## Success Metrics

### Engagement
- Daily active users: 40% of subscribers
- Races tracked per month: 5+
- Documents uploaded: 10+ per month
- Setup configurations saved: 3+ variations

### Performance
- User performance improvement: +1.5 positions avg
- Setup optimization: 15% better correlation
- Time saved: 5 hours/week on admin

### Satisfaction
- NPS Score: 70+
- App Store rating: 4.7+
- Retention rate: 85% annual

## Development Priorities

### MVP Features (Phase 1)
1. Document upload and parsing
2. Basic race timer
3. Simple performance tracking
4. Equipment database

### Enhancement Features (Phase 2)
1. AI tactical analysis
2. Advanced setup correlation
3. Crew management system
4. International event tools

### Premium Features (Phase 3)
1. Video analysis integration
2. Real-time coaching
3. Fleet telemetry
4. Custom training plans

## Technical Requirements

### Performance
- GPS tracking: 1Hz minimum
- Document processing: <30 seconds
- Sync latency: <2 seconds
- Offline storage: 500MB minimum

### Data Management
- Encrypted storage
- GDPR compliance
- Data export capability
- Multi-device sync

## Related Documents
- [Master Plan](./regattaflow-master-plan.md)
- [Technical Architecture](./technical-architecture.md)
- [UI Component Library](./ui-components.md)

---
*This is a living document that evolves with user feedback and development progress*