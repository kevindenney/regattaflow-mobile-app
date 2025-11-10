# RegattaFlow MCP Server

Model Context Protocol (MCP) server providing sailing data and analysis tools for RegattaFlow.

## Overview

This MCP server exposes sailing-related resources and tools that can be consumed by Claude and other MCP-compatible AI systems. It provides:

- **Resources**: Real-time access to weather, tidal, bathymetric, and race data
- **Tools**: Analysis capabilities for race strategy, performance, and route planning

## Architecture

```
┌─────────────────────────────────────┐
│      MCP Client (Claude)            │
│                                     │
│  Requests resources & calls tools   │
└──────────────┬──────────────────────┘
               │ MCP Protocol
               │ (stdio transport)
┌──────────────▼──────────────────────┐
│    RegattaFlow MCP Server           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Resources                    │  │
│  │  • weather://current          │  │
│  │  • races://active             │  │
│  │  • tides://prediction/{loc}   │  │
│  │  • bathymetry://venue/{id}    │  │
│  │  • boats://polars/{class}     │  │
│  │  • courses://race/{id}        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Tools                        │  │
│  │  • analyze_start_line         │  │
│  │  • analyze_tidal_opportunities│  │
│  │  • calculate_optimal_route    │  │
│  │  • analyze_performance        │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               │ Supabase Client
┌──────────────▼──────────────────────┐
│      Supabase Database              │
│                                     │
│  • Races & Courses                  │
│  • Weather Observations             │
│  • Tidal Predictions                │
│  • Bathymetry Data                  │
│  • GPS Tracks                       │
│  • Boat Polars                      │
└─────────────────────────────────────┘
```

## Installation

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Configuration

Create a `.env` file with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Run compiled server
npm start
```

### Watch Mode (Auto-reload)

```bash
npm run watch
```

## Resources

Resources provide read-only access to data without performing computations. They're designed to give Claude context about the sailing environment.

### Available Resources

| URI Pattern | Description | Example |
|------------|-------------|---------|
| `weather://current` | Current weather observations | Wind, pressure, temperature |
| `races://active` | Active and upcoming races | Next 10 races with course details |
| `tides://prediction/{location}` | Tidal predictions | `tides://prediction/san-francisco` |
| `bathymetry://venue/{venueId}` | Depth and terrain data | `bathymetry://venue/sf-bay` |
| `boats://polars/{boatClass}` | Performance polars | `boats://polars/j24` |
| `courses://race/{raceId}` | Race course layout | `courses://race/race-123` |

### Example: Reading a Resource

```json
{
  "method": "resources/read",
  "params": {
    "uri": "weather://current"
  }
}
```

Response:
```json
{
  "contents": [{
    "uri": "weather://current",
    "mimeType": "application/json",
    "text": "{\"wind_speed\":12,\"wind_direction\":180,...}"
  }]
}
```

## Tools

Tools perform computations and analysis based on inputs. They're model-controlled and designed to solve specific problems.

### Available Tools

#### 1. analyze_start_line

Analyzes race start line to determine favored end and optimal positioning.

**Input Schema:**
```typescript
{
  raceId: string;
  windDirection: number;  // degrees
  windSpeed: number;      // knots
  currentDirection?: number;  // degrees (optional)
  currentSpeed?: number;      // knots (optional)
}
```

**Output:**
```json
{
  "favoredEnd": "pin" | "boat",
  "biasAngle": 15,
  "boatLengthAdvantage": 6,
  "currentEffect": "favors pin end",
  "recommendation": "Start at pin end. Line bias is 15° giving ~6 boat length advantage.",
  "tactics": [
    "Approach on starboard tack from pin end",
    "Be at full speed 60 seconds before gun",
    "Current favors pin end - adjust timing accordingly"
  ]
}
```

#### 2. analyze_tidal_opportunities

Identifies current-driven advantages, eddies, and slack windows during a race.

**Input Schema:**
```typescript
{
  raceId: string;
  startTime: string;    // ISO format
  duration: number;     // minutes
  location: string;
}
```

**Output:**
```json
{
  "slackWindows": [
    {
      "time": "2025-01-15T14:30:00Z",
      "type": "low",
      "currentSpeed": 0.3
    }
  ],
  "opportunities": [
    {
      "time": "2025-01-15T13:00:00Z",
      "type": "strong_current",
      "direction": 90,
      "speed": 2.5,
      "advice": "Plan maneuvers to leverage this current"
    }
  ],
  "analysis": {
    "hasSlackDuringRace": true,
    "strongCurrentPeriods": 2,
    "recommendation": "Schedule critical maneuvers during slack windows"
  }
}
```

#### 3. calculate_optimal_route

Calculates the fastest route between two points considering wind, current, and boat polars.

**Input Schema:**
```typescript
{
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  windDirection: number;     // degrees
  windSpeed: number;         // knots
  currentDirection?: number; // degrees (optional)
  currentSpeed?: number;     // knots (optional)
  boatClass?: string;        // optional
}
```

**Output:**
```json
{
  "bearing": 45,
  "distance": 2.5,
  "windAngle": -30,
  "legType": "upwind",
  "recommendedAngles": [135, 225],
  "currentEffect": "1.5 kts from 90°",
  "estimatedTime": 18.2
}
```

#### 4. analyze_performance

Analyzes GPS track data to evaluate sailing performance against polars.

**Input Schema:**
```typescript
{
  trackId: string;
  boatClass: string;
  compareToPolars?: boolean;  // optional
}
```

**Output:**
```json
{
  "trackId": "track-123",
  "boatClass": "j24",
  "duration": 3600,
  "distance": 6.5,
  "averageSpeed": 6.5,
  "maxSpeed": 8.2,
  "vmgUpwind": 5.8,
  "vmgDownwind": 6.2,
  "tackCount": 12,
  "gybeCount": 8,
  "polarComparison": {
    "speedPerformance": "92.3%",
    "vmgPerformance": "95.1%"
  }
}
```

### Example: Calling a Tool

```json
{
  "method": "tools/call",
  "params": {
    "name": "analyze_start_line",
    "arguments": {
      "raceId": "race-123",
      "windDirection": 180,
      "windSpeed": 12,
      "currentDirection": 90,
      "currentSpeed": 1.5
    }
  }
}
```

## Using with Claude Code

To use this MCP server with Claude Code, add it to your MCP settings:

### macOS/Linux

Edit `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "regattaflow": {
      "command": "node",
      "args": ["/absolute/path/to/regattaflow-app/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

### Windows

Edit `%APPDATA%\claude-code\mcp.json` with the same configuration.

### Verify Connection

After adding the server, restart Claude Code and check the MCP status:

```bash
# The server should appear in the available MCP servers list
# You can test by asking Claude: "What MCP servers are available?"
```

## Using with the TypeScript Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Create transport
const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  }
});

// Create client
const client = new Client({
  name: 'regattaflow-client',
  version: '1.0.0',
});

// Connect
await client.connect(transport);

// List resources
const { resources } = await client.request(
  { method: 'resources/list' },
  {}
);

console.log('Available resources:', resources);

// Read a resource
const { contents } = await client.request(
  { method: 'resources/read' },
  { uri: 'weather://current' }
);

console.log('Weather data:', JSON.parse(contents[0].text));

// Call a tool
const result = await client.request(
  { method: 'tools/call' },
  {
    name: 'analyze_start_line',
    arguments: {
      raceId: 'race-123',
      windDirection: 180,
      windSpeed: 12
    }
  }
);

console.log('Start analysis:', result);

// Close connection
await client.close();
```

## Development

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── resources/
│   │   └── index.ts       # Resource definitions
│   ├── tools/
│   │   └── index.ts       # Tool definitions
│   └── utils/
│       └── supabase.ts    # Supabase client
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Adding New Resources

Edit `src/resources/index.ts`:

```typescript
server.addResource({
  uri: 'your-resource://path',
  name: 'Your Resource Name',
  description: 'Description of what this resource provides',
  mimeType: 'application/json',
}, async (params) => {
  // Fetch your data
  const data = await fetchYourData(params);

  return {
    contents: [{
      uri: 'your-resource://path',
      mimeType: 'application/json',
      text: JSON.stringify(data),
    }],
  };
});
```

### Adding New Tools

Edit `src/tools/index.ts`:

```typescript
import { z } from 'zod';

const yourToolSchema = z.object({
  param1: z.string(),
  param2: z.number(),
});

server.registerTool({
  name: 'your_tool_name',
  description: 'What this tool does',
  inputSchema: yourToolSchema,
}, async (args) => {
  // Perform computation
  const result = performAnalysis(args);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result),
    }],
  };
});
```

## Troubleshooting

### Server Won't Start

1. **Check environment variables:**
   ```bash
   cat .env
   # Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set
   ```

2. **Verify Supabase connection:**
   ```bash
   curl "https://your-project.supabase.co/rest/v1/" \
     -H "apikey: your-anon-key"
   ```

3. **Check TypeScript compilation:**
   ```bash
   npm run build
   # Look for any compilation errors
   ```

### Resources Return Empty Data

1. Check that your Supabase tables exist and have data
2. Verify table permissions allow anonymous access (if using anon key)
3. Check server logs for Supabase errors

### Tools Fail to Execute

1. Verify input parameters match the schema
2. Check server logs for detailed error messages
3. Ensure required data exists in database (e.g., race course for analyze_start_line)

### MCP Client Can't Connect

1. Verify the command path is absolute
2. Check that the server process can access environment variables
3. Test the server independently: `npm run dev`

## Performance Considerations

### Resource Caching

Resources are fetched on-demand. For frequently accessed resources, consider implementing caching:

```typescript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key, fetcher) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### Database Queries

Optimize Supabase queries:
- Use `.select()` to fetch only needed columns
- Add `.limit()` to prevent large result sets
- Create database indexes for frequently queried columns

### Tool Computation

For compute-intensive tools:
- Consider async processing for long-running calculations
- Implement timeouts to prevent hanging
- Return progress indicators for multi-step analysis

## Security

### API Keys

- Never commit `.env` file to version control
- Use environment variables for all sensitive data
- Rotate Supabase keys regularly

### Input Validation

- All tool inputs are validated with Zod schemas
- Sanitize parameters before database queries
- Implement rate limiting if exposed publicly

### Database Access

- Use Supabase Row Level Security (RLS) policies
- Grant minimal required permissions
- Audit data access patterns

## License

MIT

## Support

For issues or questions:
- File an issue on GitHub
- Check the main RegattaFlow documentation
- Review the [MCP Integration Guide](../docs/MCP_CLAUDE_SKILLS_INTEGRATION.md)
