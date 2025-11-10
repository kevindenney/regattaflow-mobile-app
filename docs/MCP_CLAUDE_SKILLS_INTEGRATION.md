# MCP and Claude Skills Integration Guide

This guide explains how RegattaFlow integrates **Model Context Protocol (MCP)** with **Claude Skills** to provide advanced AI-powered sailing analysis and race strategy capabilities.

## Overview

RegattaFlow uses a two-tier AI architecture:

1. **Claude Skills**: Domain-specific expertise packaged as reusable AI skills
   - Race Strategy Analyst
   - Tidal Opportunism Analyst
   - Slack Window Planner
   - Current Counterplay Advisor

2. **MCP Server**: Real-time data sources and computational tools
   - Weather, bathymetry, tidal, and race data resources
   - Analysis tools for start lines, routes, and performance

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   RegattaFlow App                       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │        EnhancedClaudeClient                       │ │
│  │                                                   │ │
│  │  • Skills API integration                        │ │
│  │  • MCP client integration                        │ │
│  │  • Combined workflows                            │ │
│  └───────────────┬──────────────┬──────────────────┘ │
│                  │              │                      │
└──────────────────┼──────────────┼──────────────────────┘
                   │              │
         ┌─────────┴─────┐   ┌────┴─────────┐
         │               │   │              │
    ┌────▼─────┐    ┌────▼───▼───┐   ┌─────▼─────┐
    │ Claude   │    │    MCP     │   │ Supabase  │
    │ Skills   │    │   Server   │   │ Database  │
    │   API    │    │            │   │           │
    └──────────┘    └────────────┘   └───────────┘
         │                │                 │
         │                │                 │
    ┌────▼────────┐  ┌────▼──────┐   ┌─────▼─────┐
    │ Race        │  │ Resources │   │ Real-time │
    │ Strategy    │  │ & Tools   │   │ Data      │
    │ Tidal       │  │           │   │           │
    │ Slack       │  │ • Weather │   │ • Races   │
    │ Current     │  │ • Tides   │   │ • Weather │
    └─────────────┘  │ • Bathy   │   │ • Courses │
                     │ • Boats   │   │ • Tracks  │
                     └───────────┘   └───────────┘
```

## Claude Skills

### What are Claude Skills?

Claude Skills are packaged domain expertise that extend Claude's capabilities. Each skill includes:

- **Metadata**: Name and description
- **Instructions**: Expert knowledge and frameworks (< 5k tokens)
- **Resources**: Optional supporting files

### Available Skills

#### 1. Race Strategy Analyst

Expert sailing race strategist combining RegattaFlow Playbook's frameworks with championship execution techniques.

**Capabilities:**
- Wind shift mathematics and puff response
- Start line bias calculation
- Delayed tack and covering tactics
- Downwind shift detection
- Fleet management strategies

**Usage:**
```typescript
import { enhancedClaudeClient } from '@/services/ai';

const response = await enhancedClaudeClient.createRaceStrategyRequest(
  'Analyze the start strategy for this race',
  {
    raceData: { /* race details */ },
    weatherData: { /* wind conditions */ }
  }
);
```

#### 2. Tidal Opportunism Analyst

Identifies current-driven opportunities using bathymetry and tidal intelligence.

**Capabilities:**
- Eddy and relief lane identification
- Anchoring decision support
- Current interaction with wind
- Strategic feature mapping

#### 3. Slack Window Planner

Builds maneuver timelines around tidal windows.

**Capabilities:**
- Slack window identification
- Crossing plan optimization
- Task sequencing
- Timing conflict detection

#### 4. Current Counterplay Advisor

Advises on current-based tactics against opponents.

**Capabilities:**
- Lee-bow positioning
- Split protection
- Gate timing strategies
- Defensive guidance

## MCP Server

### What is MCP?

The Model Context Protocol (MCP) is an open standard for connecting AI models to external data sources and tools. Think of it as "USB-C for AI applications."

### MCP Server Components

#### Resources (Data Sources)

Resources provide read-only access to data without performing computations:

| Resource URI | Description |
|-------------|-------------|
| `weather://current` | Real-time weather observations |
| `races://active` | Active and upcoming races |
| `tides://prediction/{location}` | Tidal predictions for a location |
| `bathymetry://venue/{venueId}` | Depth and terrain data |
| `boats://polars/{boatClass}` | Performance polars |
| `courses://race/{raceId}` | Race course layout |

#### Tools (Actions)

Tools perform computations and analysis:

| Tool | Description | Parameters |
|------|-------------|------------|
| `analyze_start_line` | Analyze race start positioning | raceId, windDirection, windSpeed, current |
| `analyze_tidal_opportunities` | Identify current advantages | raceId, startTime, duration, location |
| `calculate_optimal_route` | Calculate fastest route | coordinates, wind, current, boatClass |
| `analyze_performance` | Evaluate GPS track performance | trackId, boatClass, compareToPolars |

### Running the MCP Server

#### Setup

1. Navigate to the MCP server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the server:
```bash
npm run dev
```

#### Using with Claude Code

Add to your Claude Code MCP settings (`~/.config/claude-code/mcp.json`):

```json
{
  "mcpServers": {
    "regattaflow": {
      "command": "node",
      "args": ["/path/to/regattaflow-app/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-anon-key"
      }
    }
  }
}
```

## Integration Patterns

### Pattern 1: Skills Only

Use Claude Skills for expert analysis without real-time data:

```typescript
import { enhancedClaudeClient } from '@/services/ai';

const response = await enhancedClaudeClient.createEnhancedMessage({
  model: 'claude-3-5-sonnet-20240620',
  messages: [{
    role: 'user',
    content: 'What is the optimal upwind strategy in oscillating conditions?'
  }],
  skills: [
    { skillId: 'race-strategy-analyst' }
  ],
  enableCodeExecution: true,
});
```

### Pattern 2: MCP Only

Use MCP tools for data analysis without domain expertise:

```typescript
import { mcpClientService } from '@/services/ai';

// Connect to MCP server
await mcpClientService.connect({
  command: 'node',
  args: ['mcp-server/dist/index.js']
});

// Analyze start line
const analysis = await mcpClientService.analyzeStartLine({
  raceId: 'race-123',
  windDirection: 180,
  windSpeed: 12,
  currentDirection: 90,
  currentSpeed: 1.5
});
```

### Pattern 3: Combined Skills + MCP (Recommended)

Combine expert skills with real-time data for maximum capability:

```typescript
import { enhancedClaudeClient, mcpClientService } from '@/services/ai';

// 1. Connect to MCP server
await mcpClientService.connect({
  command: 'node',
  args: ['mcp-server/dist/index.js']
});

// 2. Fetch real-time data
const weather = await mcpClientService.getCurrentWeather();
const tides = await mcpClientService.getTidalPredictions('san-francisco');
const course = await mcpClientService.getRaceCourse('race-123');

// 3. Request expert analysis with Skills
const response = await enhancedClaudeClient.createRaceStrategyRequest(
  'Provide complete race strategy for Race #123 considering all environmental factors',
  {
    raceData: course,
    weatherData: weather,
    tidalData: tides
  }
);

console.log(response.text);
```

### Pattern 4: Streaming with Progressive Disclosure

Claude Skills use "progressive disclosure" - loading metadata first, then instructions as needed:

```typescript
const response = await enhancedClaudeClient.createEnhancedMessage({
  model: 'claude-3-5-sonnet-20240620',
  messages: [{
    role: 'user',
    content: 'Analyze this race situation: [detailed scenario]'
  }],
  skills: [
    { skillId: 'race-strategy-analyst' },
    { skillId: 'tidal-opportunism-analyst' },
    { skillId: 'slack-window-planner' }
  ],
  mcpTools: [
    {
      name: 'analyze_start_line',
      description: 'Analyze race start positioning'
    },
    {
      name: 'analyze_tidal_opportunities',
      description: 'Identify current-driven advantages'
    }
  ],
  enableCodeExecution: true,
  maxTokens: 4096
});
```

## API Reference

### EnhancedClaudeClient

#### `createEnhancedMessage(request: EnhancedClaudeRequest): Promise<EnhancedClaudeResponse>`

Create a message with Skills and/or MCP support.

**Parameters:**
- `model`: Claude model to use
- `messages`: Conversation messages
- `skills`: Array of skill configurations
- `mcpResources`: Array of MCP resources to include
- `mcpTools`: Array of MCP tools to enable
- `enableCodeExecution`: Enable code execution (required for Skills)

**Returns:**
- `text`: Response text
- `tokensIn`: Input token count
- `tokensOut`: Output token count
- `skillsUsed`: Skills that were activated
- `toolsUsed`: Tools that were called

#### `createRaceStrategyRequest(message: string, context?): Promise<EnhancedClaudeResponse>`

Helper for race strategy analysis with all sailing skills.

### MCPClientService

#### `connect(config: MCPServerConfig): Promise<void>`

Connect to the MCP server.

#### `disconnect(): Promise<void>`

Disconnect from the MCP server.

#### Resource Methods

- `getCurrentWeather(): Promise<any>`
- `getActiveRaces(): Promise<any[]>`
- `getTidalPredictions(location: string): Promise<any[]>`
- `getBathymetryData(venueId: string): Promise<any>`
- `getBoatPolars(boatClass: string): Promise<any>`
- `getRaceCourse(raceId: string): Promise<any>`

#### Tool Methods

- `analyzeStartLine(params): Promise<any>`
- `analyzeTidalOpportunities(params): Promise<any>`
- `calculateOptimalRoute(params): Promise<any>`
- `analyzePerformance(params): Promise<any>`

## Example: Complete Race Analysis Workflow

```typescript
import { enhancedClaudeClient, mcpClientService } from '@/services/ai';

async function analyzeRace(raceId: string) {
  try {
    // Step 1: Connect to MCP server
    await mcpClientService.connect({
      command: 'node',
      args: ['mcp-server/dist/index.js'],
      env: {
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

    // Step 2: Gather all relevant data
    const [race, weather, bathymetry] = await Promise.all([
      mcpClientService.getRaceCourse(raceId),
      mcpClientService.getCurrentWeather(),
      mcpClientService.getBathymetryData(race.venue_id)
    ]);

    const tides = await mcpClientService.getTidalPredictions(race.location);

    // Step 3: Analyze start line
    const startAnalysis = await mcpClientService.analyzeStartLine({
      raceId,
      windDirection: weather.wind_direction,
      windSpeed: weather.wind_speed,
      currentDirection: tides[0].current_direction,
      currentSpeed: tides[0].current_speed
    });

    // Step 4: Analyze tidal opportunities
    const tidalAnalysis = await mcpClientService.analyzeTidalOpportunities({
      raceId,
      startTime: race.start_time,
      duration: race.estimated_duration,
      location: race.location
    });

    // Step 5: Get expert strategy recommendations
    const strategy = await enhancedClaudeClient.createRaceStrategyRequest(
      `Provide a comprehensive race strategy for this ${race.race_type} race.

       Focus on:
       1. Start line positioning and timing
       2. Upwind and downwind tactical plans
       3. Current leverage opportunities
       4. Mark rounding strategies
       5. Overall race execution plan

       Consider all environmental factors and provide specific, actionable recommendations.`,
      {
        raceData: race,
        weatherData: weather,
        tidalData: { predictions: tides, analysis: tidalAnalysis },
        bathymetryData: bathymetry
      }
    );

    // Step 6: Return complete analysis
    return {
      race,
      conditions: { weather, tides, bathymetry },
      startAnalysis,
      tidalAnalysis,
      strategy: strategy.text,
      tokensUsed: strategy.tokensIn + strategy.tokensOut,
      skillsUsed: strategy.skillsUsed
    };

  } finally {
    // Always disconnect
    await mcpClientService.disconnect();
  }
}

// Usage
const analysis = await analyzeRace('race-123');
console.log(analysis.strategy);
```

## Best Practices

### 1. Resource Management

Always disconnect from the MCP server when done:

```typescript
try {
  await mcpClientService.connect(config);
  // ... do work
} finally {
  await mcpClientService.disconnect();
}
```

### 2. Token Optimization

Use Skills for domain expertise (loads only needed instructions) rather than including all expertise in system prompts:

```typescript
// ❌ Bad: Large system prompt
const response = await client.createMessage({
  system: '... 10,000 tokens of sailing expertise ...',
  messages: [...]
});

// ✅ Good: Use Skills (progressive disclosure)
const response = await enhancedClient.createEnhancedMessage({
  skills: [{ skillId: 'race-strategy-analyst' }],
  messages: [...]
});
```

### 3. Error Handling

Handle MCP connection errors gracefully:

```typescript
try {
  await mcpClientService.connect(config);
} catch (error) {
  console.error('MCP connection failed:', error);
  // Fallback to Skills-only mode
  return await enhancedClaudeClient.createRaceStrategyRequest(message);
}
```

### 4. Caching

Cache MCP data when appropriate to reduce database queries:

```typescript
const weatherCache = new Map();

async function getCachedWeather() {
  const cacheKey = 'current';
  if (weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data;
    }
  }

  const weather = await mcpClientService.getCurrentWeather();
  weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });
  return weather;
}
```

## Troubleshooting

### MCP Server Won't Start

1. Check environment variables are set in `.env`
2. Verify Supabase connection:
   ```bash
   cd mcp-server
   npm run dev
   ```
3. Check logs for specific errors

### Skills Not Loading

1. Verify skills are uploaded:
   ```typescript
   import { skillManagementService } from '@/services/ai/SkillManagementService';

   const skills = await skillManagementService.listSkills();
   console.log(skills);
   ```

2. Re-upload skills if needed:
   ```typescript
   await skillManagementService.initializeRaceStrategySkill();
   ```

### Token Limits Exceeded

1. Use progressive disclosure with Skills (automatic)
2. Reduce `maxTokens` in requests
3. Limit MCP resources included in context

## Further Reading

- [Claude Skills Documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Anthropic API Reference](https://docs.anthropic.com/en/api)

## Support

For issues or questions:
- File an issue on GitHub
- Check the RegattaFlow documentation
- Review Claude Skills and MCP documentation
