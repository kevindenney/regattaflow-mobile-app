# Anthropic Agent SDK Setup Guide

## Step 1: Get Your API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to **API Keys** in the left sidebar
4. Click **Create Key**
5. Copy the API key (starts with `sk-ant-`)

## Step 2: Add API Key to Environment

Open `.env` file and replace the placeholder:

```env
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**Important:**
- Never commit your `.env` file to git (it's already in `.gitignore`)
- The key should start with `sk-ant-`
- Keep this key secure - it's tied to your billing account

## Step 3: Test the Setup

Run the test script to verify everything works:

```bash
npm run test:agent
```

You should see:
```
✅ API Key found
✅ Agent initialized successfully
✅ Agent responded successfully!
✅ ALL TESTS PASSED!
```

## Step 4: Use Agents in Your App

### Example 1: Venue Intelligence Agent

```typescript
import { VenueIntelligenceAgent } from '@/src/services/agents';

const agent = new VenueIntelligenceAgent();

// Detect venue and load all intelligence
const result = await agent.switchVenueByGPS({
  latitude: 22.2793,
  longitude: 114.1628
});

if (result.success) {
  console.log('Venue switched:', result.result);
  console.log('Agent used these tools:', result.toolsUsed);
}
```

### Example 2: Document Processing Agent

```typescript
import { DocumentProcessingAgent } from '@/src/services/agents';

const agent = new DocumentProcessingAgent();

// Process sailing instructions
const result = await agent.processSailingInstructions(
  'sailingInstructions.pdf',
  pdfContent
);

if (result.success) {
  console.log('Course extracted and visualized!');
  console.log('Strategy generated:', result.result);
}
```

### Example 3: Coach Matching Agent

```typescript
import { CoachMatchingAgent } from '@/src/services/agents';

const agent = new CoachMatchingAgent();

// Find best coach for your needs
const result = await agent.findBestCoach({
  sailorId: 'user-123',
  goals: 'improve upwind speed in heavy air',
  budget: 150
});

if (result.success) {
  console.log('Recommended coach:', result.result);
}
```

## Available Agents

RegattaFlow includes 6 autonomous AI agents:

| Agent | Purpose | Key Features |
|-------|---------|-------------|
| **VenueIntelligenceAgent** | Venue switching & regional intelligence | GPS detection, weather APIs, cultural settings |
| **DocumentProcessingAgent** | Sailing instruction parsing | PDF extraction, 3D visualization, strategy generation |
| **CoachMatchingAgent** | Intelligent coach discovery | Performance analysis, skill gap detection, compatibility scoring |
| **OnboardingAgent** | New sailor onboarding | Profile creation, venue selection, app tour |
| **CoursePredictionAgent** | Race course forecasting | Wind pattern analysis, tactical recommendations |
| **RaceAnalysisAgent** | Post-race performance review | Data analysis, competitor comparison, improvement suggestions |

## Agent Architecture

All agents extend `BaseAgentService` and use Anthropic's Claude for autonomous decision-making.

**Key Features:**
- **Self-orchestrating** - Agents decide which tools to call and when
- **Self-healing** - Automatic retry on failures
- **Adaptive** - Adjusts to unexpected scenarios
- **Explainable** - Natural language error messages

See `src/services/agents/BaseAgentService.ts` for implementation details.

## Troubleshooting

### Error: "API key not found"
- Check that `.env` file exists
- Verify the key starts with `EXPO_PUBLIC_ANTHROPIC_API_KEY=`
- Restart your development server after updating `.env`

### Error: "Authentication failed"
- Verify your API key is correct
- Check that you copied the entire key (starts with `sk-ant-`)
- Ensure your Anthropic account has credits

### Error: "Tool execution failed"
- Check that database tables exist (run migrations)
- Verify Supabase connection is working
- Check network connectivity for weather APIs

## Cost Management

Anthropic charges based on tokens used:

- **Claude Sonnet 4.5**: $3.00 per million input tokens, $15.00 per million output tokens
- Agents are optimized for cost (temperature: 0.3, maxTokens: 2048-4096)
- Average venue switch: ~$0.05
- Average document processing: ~$0.10

Monitor usage at [https://console.anthropic.com/usage](https://console.anthropic.com/usage)

## Next Steps

1. ✅ Complete this setup
2. Run `npm run test:agent` to verify
3. Check out agent implementations in `src/services/agents/`
4. Read the full planning document: `plans/anthropic-agent-sdk-integration.md`
5. Start using agents in your features!

## Support

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [RegattaFlow Agent Architecture](./plans/anthropic-agent-sdk-integration.md)
- [Claude Code Guide](./CLAUDE.md)
