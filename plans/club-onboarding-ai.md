# AI-Powered Club Onboarding Implementation Plan

*Created: January 6, 2025*
*Status: Planning*

## Executive Summary

Transform club onboarding from a 45-minute form-filling experience into a 5-minute conversational setup using Anthropic's Agent SDK. The ClubOnboardingAgent will autonomously research venue intelligence, configure multi-venue operations, benchmark pricing, and set up complete organizational structures through natural conversation.

## Problem Statement

### Current Club Onboarding (Traditional)
- **Time**: 45+ minutes of manual form-filling
- **Experience**: Multi-page forms with static questions
- **Configuration**: Manual research and guesswork
- **Multi-Venue**: Complex setup requiring deep platform knowledge
- **Errors**: Incorrect pricing, missing features, suboptimal setup
- **Context**: No awareness of regional sailing culture or venue specifics

### Desired Club Onboarding (AI-Powered)
- **Time**: 5-10 minutes of natural conversation
- **Experience**: Talking to an experienced sailing administrator
- **Configuration**: Autonomous venue intelligence loading
- **Multi-Venue**: Automatic detection and orchestration
- **Optimization**: Data-driven pricing and feature recommendations
- **Context**: Full regional awareness with cultural adaptation

## Business Impact

### Time to Value
- **Before**: 45 minutes → **After**: 5 minutes (89% reduction)
- **Setup Accuracy**: Generic → Regionally optimized
- **Feature Discovery**: Manual → AI-suggested
- **Multi-Venue Support**: Complex → Seamless
- **Conversion Rate**: Higher (frictionless onboarding)

### Success Metrics
- Onboarding completion rate: 90%+ (up from ~60%)
- Time to first event: <24 hours (down from 3-5 days)
- Feature utilization: 85%+ (up from ~40%)
- Setup errors: <5% (down from ~30%)
- Club satisfaction (NPS): 70+ (up from ~45)

## Architecture Overview

### Agent Design Pattern

```typescript
export class ClubOnboardingAgent extends BaseAgentService {
  constructor() {
    super({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: `You are an expert sailing club administrator and business consultant...`
    });

    // Register 8 autonomous tools
    this.registerTool(this.createVenueAnalysisTool());
    this.registerTool(this.createClubTypeAnalysisTool());
    this.registerTool(this.createDocumentGenerationTool());
    this.registerTool(this.createVenueIntelligenceTool());
    this.registerTool(this.createPricingBenchmarkTool());
    this.registerTool(this.createMultiVenueSetupTool());
    this.registerTool(this.createStaffConfigurationTool());
    this.registerTool(this.createFinalizationTool());
  }

  // Streaming conversation interface
  async *streamClubSetup(
    userMessage: string,
    context: ClubOnboardingContext
  ): AsyncGenerator<string, void, unknown> {
    // Real-time conversational setup with autonomous tool orchestration
  }
}
```

### System Prompt Design

```
You are an expert sailing club administrator and business consultant helping yacht clubs,
class associations, and regatta organizers set up their operations on RegattaFlow.

PERSONALITY:
- Warm, professional, and demonstrate sailing industry expertise
- Anticipate club needs before asking
- Make data-driven recommendations based on regional context
- Use sailing terminology naturally (race committee, PRO, OOD, etc.)
- Be concise but thorough (2-4 sentences per response)
- Never be robotic or formulaic

CONVERSATION FLOW:
1. Welcome warmly and ask for club location/name
2. Detect venue(s) automatically via GPS or name lookup
3. Analyze club type (yacht club, class association, regatta organizer)
4. For multi-venue clubs: "I see you operate across [X] locations. Let me set those up."
5. Research regional sailing context (popular classes, weather sources, customs)
6. Recommend optimal pricing tier based on event volume and region
7. Suggest staff structure based on club size
8. Generate race document templates (NOR, SI) with venue-specific data
9. Configure venue-specific weather integrations
10. Set up cultural/language preferences
11. Summarize complete setup and confirm
12. Finalize with celebration and next steps

CRITICAL RULES:
- Always explain WHY you're recommending something using data
- Proactively research club's sailing environment
- Configure systems automatically when possible
- Learn from similar successful clubs in the region
- For multi-venue operations, set up unified management automatically
- Ask for confirmation before finalizing critical decisions
- Make it feel like talking to an experienced sailing administrator
```

## Tool Specifications

### 1. detect_venue_and_analyze_operations

**Purpose**: Autonomous venue detection and operational intelligence gathering

**Input Schema**:
```typescript
z.object({
  clubLocation: z.string().describe('GPS coordinates, address, or club name'),
  clubName: z.string().optional().describe('Official club name if known'),
})
```

**Agent Actions**:
1. Detect sailing venue(s) from location data
2. Research regional racing customs and traditions
3. Analyze local weather patterns and optimal API sources
4. Identify popular boat classes in the region
5. Discover competitive clubs nearby for benchmarking
6. Detect multi-venue operations (e.g., RHKYC's 3 locations)

**Output**:
```typescript
{
  venues: Array<{
    venue_id: string;
    name: string;
    role: 'headquarters' | 'racing' | 'marina' | 'social';
    coordinates: { lat: number; lng: number };
    popular_classes: string[];
    regional_intelligence: {
      weather_sources: string[];
      cultural_context: string;
      primary_language: string;
      currency: string;
      racing_traditions: string[];
    };
  }>;
  nearby_clubs: Array<{
    name: string;
    distance_km: number;
    annual_events: number;
    classes: string[];
  }>;
  confidence: number;
}
```

**Implementation**:
```typescript
private createVenueAnalysisTool(): AgentTool {
  return {
    name: 'detect_venue_and_analyze_operations',
    description: 'Detect sailing venues and gather complete operational intelligence including regional customs, weather sources, and popular boat classes. Use this immediately after getting club location.',
    input_schema: z.object({
      clubLocation: z.string().describe('GPS coordinates, address, or club name'),
      clubName: z.string().optional().describe('Official club name if known'),
    }),
    execute: async (input) => {
      // 1. Geocode location
      // 2. Query sailing_venues table with radius search
      // 3. Load regional_intelligence and cultural_profiles
      // 4. Query nearby clubs for benchmarking
      // 5. Detect multi-venue operations (same organization, different locations)
      // 6. Return complete venue intelligence package
    },
  };
}
```

---

### 2. analyze_club_type_and_recommend_setup

**Purpose**: Classify club type and recommend optimal configuration

**Input Schema**:
```typescript
z.object({
  clubDescription: z.string().describe('Brief description of club operations'),
  venueData: z.any().describe('Output from detect_venue_and_analyze_operations'),
})
```

**Agent Actions**:
1. Classify club type (yacht club, class association, regatta organizer, mixed)
2. Research similar successful clubs in the region
3. Recommend racing formats based on regional preferences
4. Suggest optimal scoring systems (low-point, handicap, etc.)
5. Identify required integrations (PHRF, IRC, class associations)
6. Recommend subscription tier based on event volume

**Output**:
```typescript
{
  club_type: 'yacht_club' | 'class_association' | 'regatta_organizer' | 'sailing_school';
  characteristics: {
    annual_events: number;
    event_types: string[];
    racing_formats: string[];
    average_fleet_size: number;
  };
  recommendations: {
    subscription_tier: 'club_basic' | 'club_pro' | 'championship';
    scoring_systems: string[];
    required_integrations: string[];
    recommended_features: string[];
  };
  similar_clubs: Array<{
    name: string;
    setup: string;
    success_metrics: any;
  }>;
  reasoning: string;
}
```

**Implementation**:
```typescript
private createClubTypeAnalysisTool(): AgentTool {
  return {
    name: 'analyze_club_type_and_recommend_setup',
    description: 'Classify club type and recommend optimal setup based on similar successful clubs. Use after venue detection to personalize configuration.',
    input_schema: z.object({
      clubDescription: z.string(),
      venueData: z.any(),
    }),
    execute: async (input) => {
      // 1. Analyze club description for type classification
      // 2. Query database for similar clubs by region/type
      // 3. Benchmark event volumes and formats
      // 4. Calculate recommended tier based on projected usage
      // 5. Return data-driven recommendations with reasoning
    },
  };
}
```

---

### 3. generate_race_documents_from_templates

**Purpose**: Auto-generate World Sailing-compliant race documents

**Input Schema**:
```typescript
z.object({
  eventType: z.enum(['series', 'regatta', 'championship']),
  venueId: z.string(),
  boatClasses: z.array(z.string()),
  eventDates: z.object({
    start: z.string(),
    end: z.string(),
  }),
})
```

**Agent Actions**:
1. Select appropriate World Sailing-compliant templates
2. Auto-populate venue-specific fields (coordinates, courses, facilities)
3. Apply regional racing rules and customs
4. Generate Notice of Race (NOR)
5. Create Sailing Instructions (SI) template
6. Include venue-specific safety protocols

**Output**:
```typescript
{
  notice_of_race: {
    content: string; // Markdown format
    sections: {
      rules: string[];
      schedule: any;
      courses: any;
      scoring: string;
      entries: any;
    };
  };
  sailing_instructions: {
    content: string;
    amendments: any[];
    venue_specific: {
      course_marks: any[];
      safety_protocols: string[];
      local_regulations: string[];
    };
  };
  templates_used: string[];
}
```

---

### 4. discover_and_import_venue_intelligence

**Purpose**: Load complete venue intelligence package

**Input Schema**:
```typescript
z.object({
  venueIds: z.array(z.string()),
})
```

**Agent Actions**:
1. Load regional intelligence (weather patterns, tactical knowledge)
2. Import standard course configurations for the venue
3. Set up local weather API integrations (HKO, NOAA, etc.)
4. Configure cultural/language settings
5. Cache offline racing data for mobile race committees
6. Import historical race data for course optimization

**Output**:
```typescript
{
  venues: Array<{
    venue_id: string;
    intelligence: {
      weather_apis: string[];
      typical_conditions: any;
      tactical_knowledge: string[];
      course_library: any[];
    };
    cultural_settings: {
      primary_language: string;
      secondary_languages: string[];
      currency: string;
      customs: string[];
    };
    offline_cache: {
      size_mb: number;
      includes: string[];
    };
  }>;
  integrations_configured: string[];
}
```

---

### 5. benchmark_and_optimize_pricing

**Purpose**: Data-driven pricing strategy recommendation

**Input Schema**:
```typescript
z.object({
  venueId: z.string(),
  clubType: z.string(),
  estimatedMemberCount: z.number().optional(),
  estimatedEventFrequency: z.number().optional(),
})
```

**Agent Actions**:
1. Research regional pricing norms for similar events
2. Analyze currency and economic context
3. Benchmark against comparable clubs in the region
4. Recommend competitive entry fees by event type
5. Suggest discount structures (early bird, series, member)
6. Consider venue-specific cost factors

**Output**:
```typescript
{
  regional_benchmarks: {
    average_entry_fee: { amount: number; currency: string };
    range: { min: number; max: number };
    typical_discounts: string[];
  };
  recommendations: {
    base_entry_fee: number;
    series_discount: number;
    early_bird_discount: { percentage: number; deadline_days: number };
    member_discount: number;
  };
  pricing_strategy: string;
  comparable_clubs: Array<{
    name: string;
    pricing: any;
  }>;
}
```

---

### 6. configure_multi_venue_operations

**Purpose**: Unified multi-venue management setup

**Input Schema**:
```typescript
z.object({
  venues: z.array(z.object({
    venue_id: z.string(),
    role: z.enum(['headquarters', 'racing', 'marina', 'social']),
  })),
})
```

**Agent Actions**:
1. Map venue relationships (HQ, racing, marina)
2. Set up cross-venue race calendar coordination
3. Configure resource allocation (boats, equipment, staff)
4. Establish transportation logistics between venues
5. Create unified communication system across locations
6. Set up venue-specific course libraries

**Output**:
```typescript
{
  venue_network: {
    headquarters: string;
    racing_venues: string[];
    support_facilities: string[];
  };
  unified_systems: {
    calendar: 'integrated across all venues';
    communications: 'single notification system';
    resources: 'shared equipment allocation';
    staff: 'cross-venue scheduling';
  };
  logistics: {
    transportation_routes: any[];
    equipment_allocation: any;
  };
}
```

---

### 7. setup_staff_and_permissions_intelligently

**Purpose**: Organizational structure recommendation

**Input Schema**:
```typescript
z.object({
  clubSize: z.enum(['small', 'medium', 'large', 'premier']),
  annualEvents: z.number(),
  multiVenue: z.boolean(),
})
```

**Agent Actions**:
1. Recommend role structures based on club size
2. Assign appropriate permission levels
3. Configure race committee workflows
4. Set up volunteer management system
5. Create training recommendations for each role
6. For multi-venue: suggest venue-specific PROs

**Output**:
```typescript
{
  recommended_roles: Array<{
    title: string;
    count: number;
    permissions: string[];
    responsibilities: string[];
  }>;
  organizational_structure: {
    sailing_manager: { full_access: boolean };
    principal_race_officers: { count: number; venue_specific: boolean };
    race_officers: { count: number; rotating: boolean };
    volunteers: { count: number; limited_access: boolean };
  };
  training_recommendations: string[];
}
```

---

### 8. finalize_club_onboarding_with_celebration

**Purpose**: Complete setup and generate next steps

**Input Schema**:
```typescript
z.object({
  allSetupData: z.any().describe('Compiled data from all previous tools'),
})
```

**Agent Actions**:
1. Validate configuration completeness
2. Generate comprehensive setup summary
3. Create initial race calendar template
4. Send welcome communications to staff
5. Trigger staff invitation flows
6. Generate onboarding checklist for next steps

**Output**:
```typescript
{
  setup_complete: boolean;
  club_profile_id: string;
  summary: {
    venues_configured: number;
    staff_invited: number;
    features_enabled: string[];
    integrations_active: string[];
  };
  next_steps: Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    estimated_time: string;
  }>;
  celebration_message: string;
}
```

---

## Conversational Flow Example

### Scenario: Royal Hong Kong Yacht Club Onboarding

```
Agent: "Welcome to RegattaFlow! I'll help set up your club. Where is your club located?"

User: "Royal Hong Kong Yacht Club"

Agent: [Calls detect_venue_and_analyze_operations]

Agent: "Perfect! I see RHKYC operates across 3 venues:
       ✓ Kellett Island (HQ & social hub)
       ✓ Middle Island (primary racing)
       ✓ Shelter Cove (marina & cruising)

       I've configured multi-venue operations with Hong Kong Observatory weather
       integration, support for Dragon, Etchells, IRC, and HKPN classes, and
       typhoon safety protocols.

       Your club typically runs 200+ race days annually. Should I proceed with
       setting this up for high-volume racing operations?"

User: "Yes, and we need staff management across all locations"

Agent: [Calls analyze_club_type_and_recommend_setup]
       [Calls configure_multi_venue_operations]
       [Calls setup_staff_and_permissions_intelligently]

Agent: "I've set up multi-venue operations and created your staff structure:

       **Recommended Team:**
       - 1 Sailing Manager (full access across all venues)
       - 3 Principal Race Officers (one per venue)
       - 8 Rotating Race Officers
       - 12 Volunteer Timing Assistants

       I recommend our **Championship plan** ($999/mo) which includes:
       - Unlimited events across all venues
       - Multi-venue unified calendar
       - Advanced timing systems
       - Custom branding
       - API access for your existing systems

       Would you like to invite your staff now, or configure this later?"

User: "Yes, invite the staff"

Agent: [Calls finalize_club_onboarding_with_celebration]

Agent: "✅ Setup complete! I've:
       ✓ Configured 3 venues with unified management
       ✓ Sent invitations to your sailing manager role
       ✓ Set up HKO weather integration
       ✓ Created course libraries for Middle Island racing
       ✓ Enabled Dragon, Etchells, IRC, and HKPN scoring
       ✓ Generated World Sailing-compliant document templates

       **Next Steps:**
       1. Your Sailing Manager will receive login credentials
       2. Complete payment setup for Championship plan
       3. Upload your club logo and branding
       4. Create your first event

       Welcome to RegattaFlow! 🎉"
```

---

## Implementation Checklist

### ✅ Phase 1: Core Agent Infrastructure (Week 1) - COMPLETED
- [x] Create `ClubOnboardingAgent.ts` extending `BaseAgentService`
- [x] Define `ClubOnboardingContext` interface
- [x] Implement system prompt with club-specific personality
- [ ] Set up streaming conversation interface (TODO: implement streaming)
- [x] Add conversation history tracking (in UI component)
- [x] Create conversation reset functionality (in UI component)

### ✅ Phase 2: Tool Implementation (Week 2-3) - COMPLETED

#### Tool 1: Venue Analysis ✅
- [x] Implement `detect_venue_and_analyze_operations` tool
- [x] Geocoding integration (location parsing from club name)
- [x] Venue database query with radius search
- [x] Regional intelligence loading (cultural profiles, venue conditions)
- [x] Multi-venue detection algorithm
- [x] Nearby club benchmarking query

#### Tool 2: Club Type Analysis ✅
- [x] Implement `analyze_club_type_and_recommend_setup` tool
- [x] Club type classification logic
- [x] Similar club query and analysis
- [x] Tier recommendation algorithm
- [x] Integration requirement detection

#### Tool 3: Document Generation ✅
- [x] Implement `generate_race_documents_from_templates` tool
- [x] World Sailing template library (NOR/SI templates)
- [x] Venue-specific field population
- [x] Regional rule application
- [x] Document versioning system (basic)

#### Tool 4: Venue Intelligence ✅
- [x] Implement `discover_and_import_venue_intelligence` tool
- [x] Regional intelligence data loading (via VenueIntelligenceAgent)
- [x] Weather API configuration (HKO, NOAA, ECMWF)
- [x] Cultural settings application
- [x] Offline cache preparation

#### Tool 5: Pricing Optimization ✅
- [x] Implement `benchmark_and_optimize_pricing` tool
- [x] Regional pricing database query
- [x] Economic context analysis
- [x] Discount structure generation

#### Tool 6: Multi-Venue Configuration ✅
- [x] Implement `configure_multi_venue_operations` tool
- [x] Venue relationship mapping
- [x] Cross-venue calendar integration (unified calendar flag)
- [x] Resource allocation system
- [x] Logistics planning

#### Tool 7: Staff Setup ✅
- [x] Implement `setup_staff_and_permissions_intelligently` tool
- [x] Role recommendation algorithm
- [x] Permission structure generation
- [x] Training content recommendation

#### Tool 8: Finalization ✅
- [x] Implement `finalize_club_onboarding_with_celebration` tool
- [x] Configuration validation
- [x] Summary generation
- [x] Staff invitation system (placeholder)
- [x] Next steps checklist

### ✅ Phase 3: UI Integration (Week 4) - COMPLETED

#### Chat Interface ✅
- [x] Create `ClubOnboardingChat.tsx` component
- [ ] Message display with streaming support (TODO: streaming)
- [x] User input handling
- [x] Tool execution indicators (progress tracking)
- [x] Error handling and retry UI
- [x] Progress tracking visualization

#### Navigation Integration ✅
- [x] Create club onboarding route `/club/onboarding/chat`
- [x] Integration with authentication flow
- [ ] Redirect logic after completion (TODO)
- [x] Save/resume functionality (start over button)

### ✅ Phase 4: Database Schema (Week 4) - COMPLETED

#### New Tables ✅
- [x] `club_profiles` - Organization information (UUID id, TEXT primary_venue_id)
- [x] `club_venues` - Multi-venue relationships (UUID club_id, TEXT venue_id)
- [x] `club_staff` - Staff roles and permissions (UUID club_id, UUID user_id)
- [x] `club_ai_documents` - AI-generated NOR/SI templates (renamed to avoid conflict)
- [x] `club_onboarding_sessions` - AI conversation history (UUID club_id, TEXT[] venue_ids)

#### Migrations ✅
- [x] Create migration for club tables (20251106_club_onboarding_ai.sql)
- [x] Set up RLS policies (simple policies for MVP)
- [x] Create indexes for performance
- [x] Add foreign key constraints
- [x] Applied via Supabase MCP successfully

**Migration Notes:**
- Fixed data type mismatches: `sailing_venues.id` is TEXT, so all foreign keys use TEXT
- Renamed `club_documents` to `club_ai_documents` to avoid conflict with existing table
- Applied simplified RLS policies for MVP to avoid type casting complexity
- All tables created successfully with proper indexes and triggers
- Migration file: `supabase/migrations/20251106_club_onboarding_ai.sql`

### Phase 5: Testing (Week 5)

#### Unit Tests
- [ ] Test each tool in isolation
- [ ] Verify Zod schema validation
- [ ] Test error handling
- [ ] Mock Supabase queries

#### Integration Tests
- [ ] Test complete onboarding flow
- [ ] Multi-venue scenario testing
- [ ] Different club types (yacht club, class association, etc.)
- [ ] Error recovery scenarios

#### User Acceptance Testing
- [ ] Test with real club administrators
- [ ] Gather feedback on conversation flow
- [ ] Validate recommendations accuracy
- [ ] Performance testing

### Phase 6: Documentation (Week 6)
- [ ] Update `CLAUDE.md` with club onboarding patterns
- [ ] Create club administrator guide
- [ ] API documentation for club endpoints
- [ ] Video walkthrough of onboarding experience

---

## Database Schema

### club_profiles
```sql
CREATE TABLE club_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  club_type TEXT NOT NULL CHECK (club_type IN ('yacht_club', 'class_association', 'regatta_organizer', 'sailing_school')),
  established DATE,
  website TEXT,
  logo_url TEXT,
  subscription_tier TEXT NOT NULL,

  -- Primary venue
  primary_venue_id UUID REFERENCES sailing_venues(id),

  -- Multi-venue support
  is_multi_venue BOOLEAN DEFAULT false,

  -- Racing configuration
  annual_events INTEGER,
  racing_classes TEXT[],
  scoring_systems TEXT[],

  -- Onboarding metadata
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_session_id UUID,
  setup_by_ai BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_club_profiles_venue ON club_profiles(primary_venue_id);
CREATE INDEX idx_club_profiles_type ON club_profiles(club_type);
```

### club_venues
```sql
CREATE TABLE club_venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES sailing_venues(id),

  -- Venue role in multi-venue setup
  role TEXT CHECK (role IN ('headquarters', 'racing', 'marina', 'social', 'training')),
  is_primary BOOLEAN DEFAULT false,

  -- Facility information
  facilities JSONB, -- { committeeBoats: 3, markBoats: 2, safetyBoats: 1 }

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_club_venues_club ON club_venues(club_id);
CREATE INDEX idx_club_venues_venue ON club_venues(venue_id);
```

### club_staff
```sql
CREATE TABLE club_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Role information
  role TEXT NOT NULL CHECK (role IN ('admin', 'sailing_manager', 'race_officer', 'secretary', 'volunteer')),
  title TEXT, -- e.g., "Principal Race Officer - Middle Island"

  -- Multi-venue assignment
  assigned_venues UUID[], -- Array of venue IDs

  -- Permissions
  permissions JSONB,

  -- Status
  invitation_sent BOOLEAN DEFAULT false,
  invitation_accepted BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_club_staff_club ON club_staff(club_id);
CREATE INDEX idx_club_staff_user ON club_staff(user_id);
```

### club_onboarding_sessions
```sql
CREATE TABLE club_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES club_profiles(id),

  -- Conversation tracking
  conversation_history JSONB,
  tools_used TEXT[],

  -- Setup data
  detected_venues JSONB,
  recommended_tier TEXT,
  staff_structure JSONB,
  pricing_recommendations JSONB,

  -- Completion status
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_club_onboarding_club ON club_onboarding_sessions(club_id);
```

---

## Performance Considerations

### Agent Response Times
- **Venue detection**: 3-8 seconds (database + intelligence loading)
- **Club type analysis**: 5-10 seconds (benchmarking queries)
- **Document generation**: 8-15 seconds (template processing)
- **Complete onboarding**: 30-60 seconds total

### Optimization Strategies
1. **Parallel Tool Execution**: Execute independent tools concurrently
2. **Venue Intelligence Caching**: Pre-load popular venue data
3. **Template Pre-compilation**: Cache document templates
4. **Streaming Responses**: Stream agent responses for better UX
5. **Database Query Optimization**: Proper indexing on venue/club lookups

---

## Success Criteria

### Quantitative Metrics
- [ ] Onboarding completion rate: 90%+ (target)
- [ ] Average completion time: <10 minutes
- [ ] Setup accuracy: 95%+ (validated configurations)
- [ ] Feature utilization: 85%+ (recommended features used)
- [ ] Tier selection accuracy: 90%+ (clubs stay on recommended tier)

### Qualitative Metrics
- [ ] Club administrator satisfaction: NPS 70+
- [ ] "Felt like talking to an expert": 90%+ agreement
- [ ] "Setup was easy and fast": 95%+ agreement
- [ ] "Recommendations were helpful": 85%+ agreement
- [ ] "Multi-venue setup was seamless": 90%+ agreement

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect venue detection | High | Multi-venue detection algorithm with confirmation step |
| Wrong tier recommendation | Medium | Conservative recommendations + easy upgrade path |
| Staff invitation errors | Medium | Validation step before sending invitations |
| Multi-venue complexity | High | Clear visualization + confirmation at each step |
| Regional pricing errors | Medium | Benchmark against 10+ similar clubs |
| Agent conversation loops | High | Max iteration limits + fallback to manual forms |

---

## Future Enhancements

### Short-term (1-3 months)
- [ ] Integration with club management systems (Regatta Network, etc.)
- [ ] Automatic member import from existing systems
- [ ] Historical event data migration tools
- [ ] Custom branding setup within conversation

### Medium-term (3-6 months)
- [ ] Multi-language support for international clubs
- [ ] Advanced analytics during onboarding (show potential ROI)
- [ ] Automated competitive analysis reports
- [ ] Integration with national sailing authority databases

### Long-term (6+ months)
- [ ] Fully autonomous event setup agent
- [ ] Predictive event planning based on historical data
- [ ] AI-powered volunteer scheduling
- [ ] Automated sponsorship opportunity identification

---

## Related Documents
- [Club Management Plan](./club-management.md) - Feature specifications
- [Anthropic Agent SDK Integration](./anthropic-agent-sdk-integration.md) - Agent architecture
- [Global Sailing Venues](./global-sailing-venues.md) - Venue intelligence system
- [Technical Architecture](./technical-architecture.md) - System design

---

*This is a living document following RegattaFlow's planning methodology. Update as implementation progresses.*
