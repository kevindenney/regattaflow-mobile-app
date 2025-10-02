# Anthropic Agent SDK Integration

*Created: October 1, 2025*
*Status: In Progress*

## Executive Summary

Integrate Anthropic's Agent SDK to enable autonomous AI workflows for RegattaFlow's most complex features. This replaces manual orchestration of Google Gemini API calls with self-orchestrating agents that make multi-step decisions autonomously.

## Problem Statement

**Current Approach (Google Gemini):**
- Manual orchestration: Developer writes explicit step-by-step logic
- No self-correction: If a step fails, the whole workflow fails
- Rigid workflows: Can't adapt to unexpected scenarios
- Code-heavy: Lots of glue code to chain AI calls together

**Example Current Code:**
```typescript
// Developer must hardcode every step
const parsed = await gemini.generateContent("Extract marks");
const marks = JSON.parse(parsed.text);
const venue = await getVenueData(venueId);
const strategy = await gemini.generateContent("Generate strategy");
await saveToDatabase(strategy);
```

**Desired Approach (Anthropic Agent SDK):**
- Autonomous orchestration: AI decides what steps to take
- Self-correcting: AI retries failed steps or tries alternative approaches
- Adaptive: AI handles unexpected scenarios dynamically
- Clean code: Agent handles complexity internally

**Example Agent Code:**
```typescript
// AI figures out the steps autonomously
const result = await documentAgent.run({
  userMessage: "Process Newport regatta sailing instructions",
  documents: [uploadedSI]
});
// Agent internally decides: Extract marks → Get venue → Generate strategy → Save
```

## Benefits

### 1. Reduced Code Complexity
- **Before:** 50-100 lines of orchestration logic per workflow
- **After:** 5-10 lines to invoke agent with intent
- **Savings:** ~80% reduction in workflow code

### 2. Self-Healing Workflows
- Agent automatically retries failed tool calls
- Agent tries alternative approaches when tools fail
- Agent explains failures in natural language

### 3. Adaptive Intelligence
- Agent adjusts strategy based on available data
- Agent handles edge cases without explicit programming
- Agent learns from tool results to optimize next steps

### 4. Better Error Messages
- **Before:** "JSON parsing failed at line 42"
- **After:** "I couldn't extract course marks because the sailing instructions don't include GPS coordinates. I recommend using the course diagram upload instead."

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RegattaFlow UI Layer                     │
│  (React Native Components - DocumentUploadCard, etc.)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Invokes agent with high-level intent
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Agent Service Layer                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  DocumentProcessingAgent                            │    │
│  │  - extract_race_course                              │    │
│  │  - generate_3d_visualization                        │    │
│  │  - analyze_strategy                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  VenueIntelligenceAgent                             │    │
│  │  - detect_venue_from_gps                            │    │
│  │  - load_regional_intelligence                       │    │
│  │  - fetch_regional_weather                           │    │
│  │  - apply_cultural_settings                          │    │
│  │  - cache_offline_data                               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CoachMatchingAgent                                 │    │
│  │  - analyze_sailor_performance                       │    │
│  │  - identify_skill_gaps                              │    │
│  │  - search_coaches                                   │    │
│  │  - calculate_compatibility                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  BaseAgentService (Foundation)                      │    │
│  │  - Tool registration                                │    │
│  │  - Anthropic API client                             │    │
│  │  - Tool execution framework                         │    │
│  │  - Error handling & retries                         │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Calls custom tools (type-safe via Zod)
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                  Existing Service Layer                      │
│                                                               │
│  - Supabase queries (venues, intelligence, coaches)          │
│  - Weather API calls (HKO, NOAA, WeatherAPI)                 │
│  - MapLibre visualization generation                         │
│  - Document storage operations                               │
└───────────────────────────────────────────────────────────────┘
```

## Implementation Checklist

### ✅ Phase 1: Setup & Core Infrastructure

- [x] Install `@anthropic-ai/sdk` and `zod` packages
- [x] Create `BaseAgentService.ts` with:
  - [x] Anthropic client initialization
  - [x] Tool registration system
  - [x] Zod → JSON Schema conversion
  - [x] Tool execution framework
  - [x] Agent run loop with iteration limits
  - [x] Error handling and retry logic
- [ ] Add `EXPO_PUBLIC_ANTHROPIC_API_KEY` to `.env.example`
- [ ] Document API key setup in README

### ⬜ Phase 2: Document Processing Agent

- [ ] Create `DocumentProcessingAgent.ts`
- [ ] Implement custom tools:
  - [ ] `extract_race_course_from_si` - Parse sailing instructions
    - Input: PDF text content, venue hint
    - Output: Course marks with GPS coordinates
  - [ ] `generate_3d_course_visualization` - Create MapLibre GeoJSON
    - Input: Course marks array
    - Output: GeoJSON for 3D rendering
  - [ ] `analyze_document_with_ai` - Extract strategic insights
    - Input: Document content, venue context
    - Output: Tactical recommendations
  - [ ] `save_to_knowledge_base` - Store processed documents
    - Input: Document analysis, course data
    - Output: Database IDs
- [ ] Refactor `DocumentProcessingService.ts` to use agent
- [ ] Test agent with sample sailing instructions

### ⬜ Phase 3: Venue Intelligence Agent

- [ ] Create `VenueIntelligenceAgent.ts`
- [ ] Implement custom tools:
  - [ ] `detect_venue_from_gps` - Location → venue mapping
    - Input: GPS coordinates (lat, lng)
    - Output: Matched venue ID and confidence score
  - [ ] `load_regional_intelligence` - Fetch venue data from Supabase
    - Input: Venue ID
    - Output: Complete regional intelligence data
  - [ ] `fetch_regional_weather` - Call appropriate weather APIs
    - Input: Venue ID, coordinates, region
    - Output: Current conditions + forecast
  - [ ] `apply_cultural_settings` - Update UI language/currency
    - Input: Cultural profile data
    - Output: UI configuration updates
  - [ ] `cache_offline_data` - Prepare offline racing data
    - Input: Venue intelligence data
    - Output: Cached data confirmation
  - [ ] `update_venue_context` - Switch app context
    - Input: Complete venue switch data
    - Output: Context update confirmation
- [ ] Integrate with `VenueDetectionService.ts`
- [ ] Integrate with `RegionalIntelligenceService.ts`
- [ ] Test agent with GPS venue detection scenario
- [ ] Test agent with manual venue selection

### ⬜ Phase 4: Coach Matching Agent

- [ ] Create `CoachMatchingAgent.ts`
- [ ] Implement custom tools:
  - [ ] `analyze_sailor_performance` - Query race results
    - Input: Sailor ID, date range
    - Output: Performance metrics and trends
  - [ ] `identify_skill_gaps` - Analyze weaknesses
    - Input: Performance data
    - Output: Specific skill gaps with priority
  - [ ] `search_coaches_by_expertise` - Match venue/class expertise
    - Input: Venue, boat class, skill gaps
    - Output: Filtered coach list
  - [ ] `calculate_compatibility_scores` - Multi-factor matching
    - Input: Sailor profile, coach profiles, criteria
    - Output: Compatibility scores with reasoning
  - [ ] `generate_session_recommendations` - Personalized plans
    - Input: Sailor-coach match, skill gaps
    - Output: Session plan with focus areas
- [ ] Refactor `AICoachMatchingService.ts` to use agent
- [ ] Test agent with sailor → coach matching flow

### ⬜ Phase 5: Campaign Planning Agent (Optional)

- [ ] Create `CampaignPlanningAgent.ts`
- [ ] Implement custom tools:
  - [ ] `query_all_venues` - Get intelligence for venue list
  - [ ] `calculate_travel_routes` - Optimize logistics
  - [ ] `estimate_costs_by_region` - Multi-currency budgeting
  - [ ] `aggregate_weather_patterns` - Seasonal forecasting
  - [ ] `compile_equipment_requirements` - Venue-specific gear
- [ ] Create UI for campaign planning feature
- [ ] Test agent with multi-venue campaign scenario

### ⬜ Phase 6: Testing & Integration

- [ ] Create `__tests__/AgentIntegration.test.ts`
  - [ ] Test document processing workflow
  - [ ] Test venue switching workflow
  - [ ] Test coach matching workflow
  - [ ] Test error handling and retries
  - [ ] Test max iteration limits
- [ ] Update UI components:
  - [ ] `DocumentUploadCard.tsx` → use DocumentProcessingAgent
  - [ ] `VenueSelector.tsx` → use VenueIntelligenceAgent
  - [ ] Coach search UI → use CoachMatchingAgent
- [ ] Integration testing with production data
- [ ] Performance testing (agent response times)

### ⬜ Phase 7: Documentation

- [x] Create this plan document
- [ ] Update `CLAUDE.md`:
  - [ ] Add Agent SDK to technology stack
  - [ ] Document agent-based workflows
  - [ ] Add development patterns
  - [ ] Add troubleshooting guide
- [ ] Create developer guide for adding new agents
- [ ] Create developer guide for adding new tools to existing agents

## Custom Tool Specifications

### Document Processing Tools

#### `extract_race_course_from_si`
```typescript
Input: {
  documentText: string;        // Extracted PDF/OCR text
  filename: string;            // Original filename
  venueHint?: string;          // Optional venue context
}

Output: {
  marks: Array<{
    name: string;              // "Mark 1", "Start Pin", etc.
    coordinates?: {
      lat: number;
      lng: number;
    };
    description: string;       // From sailing instructions
  }>;
  courseLayout: {
    type: 'windward-leeward' | 'triangle' | 'coastal' | 'custom';
    description: string;
  };
  confidence: number;          // 0-1 extraction confidence
}
```

### Venue Intelligence Tools

#### `detect_venue_from_gps`
```typescript
Input: {
  latitude: number;
  longitude: number;
  radiusKm?: number;           // Search radius (default: 50km)
}

Output: {
  venueId: string;
  venueName: string;
  distance: number;            // km from GPS point
  confidence: number;          // 0-1 match confidence
  alternatives?: Array<{       // Other nearby venues
    venueId: string;
    name: string;
    distance: number;
  }>;
}
```

#### `fetch_regional_weather`
```typescript
Input: {
  venueId: string;
  coordinates: { lat: number; lng: number };
  region: 'north-america' | 'europe' | 'asia-pacific' | 'other';
}

Output: {
  currentConditions: {
    windSpeed: number;
    windDirection: number;
    temperature: number;
    // ... more fields
  };
  forecast: Array<{
    time: Date;
    windSpeed: number;
    // ... more fields
  }>;
  provider: 'HKO' | 'NOAA' | 'WeatherAPI' | 'other';
}
```

### Coach Matching Tools

#### `analyze_sailor_performance`
```typescript
Input: {
  sailorId: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  venueId?: string;           // Filter by venue
}

Output: {
  recentResults: Array<{
    eventName: string;
    position: number;
    totalBoats: number;
    percentile: number;
  }>;
  trends: {
    improving: boolean;
    averagePosition: number;
    consistency: number;      // 0-1
  };
  weakAreas: string[];        // Identified from results
}
```

#### `calculate_compatibility_scores`
```typescript
Input: {
  sailorProfile: {
    experience: number;
    boatClasses: string[];
    goals: string;
    learningStyle: string;
  };
  coaches: Array<CoachProfile>;
  targetSkills: string[];
}

Output: {
  scores: Array<{
    coachId: string;
    overallScore: number;     // 0-100
    breakdown: {
      experienceMatch: number;
      teachingStyleMatch: number;
      specialtyAlignment: number;
      // ... more factors
    };
    reasoning: string;        // AI explanation
    recommendations: string[];
  }>;
}
```

## Development Workflow

### Adding a New Agent

1. **Extend BaseAgentService:**
```typescript
import { BaseAgentService, AgentTool } from './BaseAgentService';
import { z } from 'zod';

export class MyNewAgent extends BaseAgentService {
  constructor() {
    super({
      systemPrompt: 'You are an expert at [domain]. Your goal is to [objective].',
      temperature: 0.7,
    });

    // Register custom tools
    this.registerTool(this.createMyTool());
  }

  private createMyTool(): AgentTool {
    return {
      name: 'my_custom_tool',
      description: 'What this tool does and when to use it',
      input_schema: z.object({
        param1: z.string().describe('First parameter'),
        param2: z.number().describe('Second parameter'),
      }),
      execute: async (input) => {
        // Tool implementation
        return { result: 'tool output' };
      },
    };
  }

  // Convenience wrapper for running this specific agent
  async processMyTask(data: any) {
    return this.run({
      userMessage: `Process this task: ${JSON.stringify(data)}`,
      context: { additionalInfo: 'value' },
    });
  }
}
```

2. **Use the Agent:**
```typescript
const agent = new MyNewAgent();
const result = await agent.processMyTask(inputData);

if (result.success) {
  console.log('Agent completed:', result.result);
  console.log('Tools used:', result.toolsUsed);
} else {
  console.error('Agent failed:', result.error);
}
```

### Tool Design Best Practices

1. **Single Responsibility:** Each tool does ONE thing well
2. **Clear Naming:** Tool names should be action-oriented verbs
3. **Good Descriptions:** Agent uses descriptions to decide when to call tools
4. **Type Safety:** Always use Zod schemas for input validation
5. **Error Messages:** Return helpful error messages the agent can understand
6. **Idempotency:** Tools should be safe to retry if they fail

### Example: Well-Designed Tool

```typescript
{
  name: 'search_coaches_by_venue_expertise',  // Clear action
  description: 'Search for sailing coaches who have expertise at a specific venue. Use this when the sailor needs coaching for an upcoming regatta at a known venue. Returns coaches sorted by expertise level.',  // When to use it
  input_schema: z.object({
    venueId: z.string().describe('The ID of the sailing venue'),
    boatClass: z.string().optional().describe('Filter by boat class (e.g., "Dragon", "J/24")'),
    maxResults: z.number().optional().default(10).describe('Maximum number of coaches to return'),
  }),  // Type-safe inputs
  execute: async (input) => {
    // Single responsibility: search coaches
    // Return structured data the agent can use
    // Include error handling with helpful messages
  },
}
```

## Testing Strategy

### Unit Tests (Per Agent)
- Test each tool in isolation
- Verify Zod schema validation
- Test error handling
- Mock external services (Supabase, weather APIs)

### Integration Tests (Agent Workflows)
- Test complete agent runs with real tools
- Verify multi-step workflows
- Test retry behavior
- Verify tool sequencing

### Example Test:
```typescript
describe('DocumentProcessingAgent', () => {
  it('should extract race course from sailing instructions', async () => {
    const agent = new DocumentProcessingAgent();

    const result = await agent.run({
      userMessage: 'Extract race course from this sailing instruction document',
      context: {
        documentText: sampleSIText,
        venue: 'Newport RI',
      },
    });

    expect(result.success).toBe(true);
    expect(result.toolsUsed).toContain('extract_race_course_from_si');
    expect(result.result).toContain('course marks');
  });

  it('should retry on tool failure', async () => {
    // Mock tool to fail first time, succeed second time
    // Verify agent retries automatically
  });
});
```

## Performance Considerations

### Agent Response Times
- **Document Processing:** 10-30 seconds (PDF parsing + AI extraction)
- **Venue Intelligence:** 5-15 seconds (database queries + weather API)
- **Coach Matching:** 8-20 seconds (performance analysis + matching)

### Optimization Strategies
1. **Tool Caching:** Cache frequently used data (venues, coaches)
2. **Parallel Tool Calls:** Execute independent tools concurrently
3. **Streaming:** Stream agent responses for better UX
4. **Max Iterations:** Set appropriate limits (default: 10)

### Cost Management
- Monitor Anthropic API usage
- Set appropriate max_tokens limits
- Use caching for repeated queries
- Consider Claude Sonnet vs Opus tradeoffs

## Migration Strategy

### Phase 1: Parallel Implementation
- Keep existing Gemini-based services running
- Implement agent versions alongside
- Feature flag to switch between implementations

### Phase 2: Gradual Rollout
- Enable agents for internal testing
- Beta test with select users
- Monitor performance and errors

### Phase 3: Full Migration
- Switch default to agent-based workflows
- Remove old Gemini orchestration code
- Update documentation

### Rollback Plan
- Feature flags allow instant rollback
- Keep Gemini code until agents proven stable
- Maintain compatibility layers during transition

## Success Metrics

### Quantitative
- [ ] Code reduction: 80% less orchestration code
- [ ] Error recovery: 90% of transient failures auto-recover
- [ ] Response quality: User satisfaction scores (measure via surveys)
- [ ] Performance: Response times within acceptable ranges

### Qualitative
- [ ] Developer experience: Easier to add new AI workflows
- [ ] User experience: Better error messages and recovery
- [ ] Maintainability: Simpler codebase to understand and modify

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Anthropic API costs higher than Gemini | Medium | Monitor usage, set budgets, use caching |
| Agent makes incorrect tool choices | High | Thorough testing, good tool descriptions, user confirmation for critical actions |
| Response times too slow | Medium | Parallel tool execution, caching, streaming responses |
| Lock-in to Anthropic | Low | Abstraction layer allows switching providers |

## Future Enhancements

### Short-term (1-3 months)
- [ ] Add streaming responses for better UX
- [ ] Implement agent memory across sessions
- [ ] Add user feedback to improve agent performance

### Medium-term (3-6 months)
- [ ] Multi-agent collaboration (e.g., Document + Venue agents working together)
- [ ] Agent learning from user corrections
- [ ] Custom agent training for RegattaFlow domain

### Long-term (6+ months)
- [ ] Fully autonomous race strategy generation
- [ ] AI-powered coaching session facilitation
- [ ] Predictive venue recommendations based on sailor history

## References

- [Anthropic Agent SDK Documentation](https://docs.claude.com/en/api/agent-sdk)
- [Claude Agent SDK TypeScript Examples](https://github.com/anthropics/claude-agent-sdk-typescript)
- [RegattaFlow Master Plan](./regattaflow-master-plan.md)
- [RegattaFlow Technical Architecture](./technical-architecture.md)

---

*This plan follows RegattaFlow's living document methodology. Update this file as implementation progresses.*
