# AI Rig Tuning Debug Guide

## Issue: "No tuning data yet" despite AI implementation

If you see "Matching rig tuning with forecast" briefly, then it reverts to "No tuning data yet", follow these debugging steps:

### 1. Check Browser Console Logs

Open browser DevTools (F12 or Cmd+Opt+I) and look for these log messages:

**Expected successful flow:**
```
[useRaceTuningRecommendation] 🔍 Fetch called with: {...}
[RaceTuningService] 🔍 getRecommendations called: {...}
[RaceTuningService] 📡 Fetching guides from tuningGuideService...
[RaceTuningService] 📚 Retrieved guides: { count: 0, ... }
[RaceTuningService] ⚠️ No extracted sections available, trying AI-only mode
[RaceTuningService] 🔧 AI Engine available? true
[RaceTuningService] 🤖 Calling AI-only rig tuning generation...
[RaceTuningEngine] Starting AI-only rig tuning generation
[RaceTuningService] 🤖 Using AI-only generated tuning recommendations
[useRaceTuningRecommendation] ✅ Got result: Found recommendation: AI Rig Tuning Analysis
```

**Common error patterns:**

#### Error 1: API Key Not Configured
```
[RaceTuningEngine] AI rig tuning unavailable: No Anthropic API key configured
[RaceTuningService] ⚠️ AI-only generation returned no recommendations
```

**Fix:** Restart dev server to pick up environment variables
```bash
# Stop current server (Ctrl+C)
npm start
```

#### Error 2: CORS or Network Error
```
TypeError: Failed to fetch
Access to fetch at 'https://api.anthropic.com/...' blocked by CORS
```

**Fix:** Check that `dangerouslyAllowBrowser: true` is set in RaceTuningEngine constructor

#### Error 3: API Rate Limit
```
429 Too Many Requests
```

**Fix:** Wait a few minutes or check Anthropic API dashboard

#### Error 4: Weather Data Missing
```
[useRaceTuningRecommendation] windMin: undefined, windMax: undefined, gusts: undefined
```

**Fix:** Weather forecast may not be loaded yet or venue missing

### 2. Check Network Tab

In DevTools → Network tab, look for:

**API calls to Anthropic:**
- URL: `https://api.anthropic.com/v1/messages`
- Method: POST
- Status: Should be 200
- Response: JSON with AI-generated content

**Common issues:**
- **401 Unauthorized**: API key invalid or expired
- **400 Bad Request**: Malformed request (check console for details)
- **429 Too Many Requests**: Rate limit exceeded

### 3. Verify API Key

```bash
# Check .env file
cat .env | grep ANTHROPIC_API_KEY

# Should show: EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...

# Restart dev server to load environment variables
npm start
```

### 4. Check Weather Data

In browser console, check if weather data is available:

```javascript
// Type this in browser console on race detail page
console.log('Weather:', window.__RACE_WEATHER__)
```

Expected output:
```json
{
  "wind": {
    "speedMin": 8,
    "speedMax": 12,
    "direction": 225,
    "gustSpeed": 15
  },
  "waves": {
    "height": "1-2ft"
  },
  "current": {
    "speed": 0.5,
    "direction": 180
  }
}
```

If weather is `undefined` or incomplete, the AI may not have enough context.

### 5. Test AI Generation Directly

Run the test script to verify AI generation works:

```bash
npx tsx test-ai-rig-tuning.ts
```

Expected output:
```
🧪 Testing AI Rig Tuning System
...
✅ Recommendation Generated!
🤖 AI-GENERATED RECOMMENDATION
   Confidence: 75%
...
```

If this fails, the issue is with AI generation, not the UI integration.

### 6. Common Fixes

#### Fix 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm start
```

#### Fix 2: Clear Browser Cache
```bash
# In browser DevTools → Application → Clear Storage → Clear site data
# Then refresh page (Cmd+R or Ctrl+R)
```

#### Fix 3: Check Anthropic API Status
Visit: https://status.anthropic.com/

#### Fix 4: Verify API Key Permissions
- Log into Anthropic Console: https://console.anthropic.com/
- Check API key has required permissions
- Generate new key if needed and update `.env`

### 7. Force AI Generation (Testing)

To test AI generation without waiting for race conditions:

**Option A: Use test script**
```bash
npx tsx test-ai-rig-tuning.ts
```

**Option B: Call service directly in browser console**
```javascript
// In browser console on race detail page
import { raceTuningService } from './services/RaceTuningService';

const testRequest = {
  className: 'Dragon',
  averageWindSpeed: 10,
  windMin: 8,
  windMax: 12,
  gusts: 14,
  pointsOfSail: 'upwind',
  limit: 1
};

raceTuningService.getRecommendations(testRequest)
  .then(recs => console.log('✅ Recommendations:', recs))
  .catch(err => console.error('❌ Error:', err));
```

### 8. Enable Verbose Logging

Add this to RaceTuningEngine constructor (temporarily for debugging):

```typescript
constructor() {
  // ... existing code

  console.log('🔧 RaceTuningEngine initialized:', {
    hasValidApiKey: this.hasValidApiKey,
    apiKey: this.hasValidApiKey ? 'configured' : 'missing'
  });
}
```

### 9. Check for Empty Response

If AI returns but card still shows "No tuning data yet":

**Check recommendation structure:**
```javascript
// In browser console
console.log('Recommendation:', tuningRecommendation);
```

Expected structure:
```json
{
  "guideId": "ai-generated-tuning",
  "guideTitle": "AI Rig Tuning Analysis",
  "guideSource": "RegattaFlow AI Rig Tuning Analyst",
  "settings": [
    { "key": "shrouds", "label": "Shroud Tension", "value": "...", "reasoning": "..." }
  ],
  "isAIGenerated": true,
  "confidence": 0.75
}
```

If `settings: []` (empty array), AI returned no settings → Check AI prompt/response

### 10. Fallback: Use Static Mock Data (Temporary)

If AI is failing, temporarily add mock data for testing UI:

```typescript
// In services/RaceTuningService.ts, add to tryGenerateAIOnlyRecommendations:

// TEMPORARY: Return mock data if AI fails
return [{
  guideId: 'mock-ai-tuning',
  guideTitle: 'Mock AI Rig Tuning',
  guideSource: 'Test Mock',
  sectionTitle: 'Test Setup',
  conditionSummary: '10-12 knots',
  settings: [
    { key: 'shrouds', label: 'Shroud Tension', value: 'Loos PT-1M 26', reasoning: 'Test reasoning' },
    { key: 'forestay', label: 'Forestay', value: '3120mm', reasoning: 'Test' }
  ],
  isAIGenerated: true,
  confidence: 0.75,
  weatherSpecificNotes: ['Test weather note'],
  caveats: ['This is mock data for testing']
}];
```

This will confirm the UI rendering works, isolating the issue to AI generation.

## Summary Checklist

- [ ] Browser console shows AI generation attempt
- [ ] Network tab shows 200 response from Anthropic API
- [ ] `.env` has valid `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- [ ] Dev server restarted after `.env` changes
- [ ] Weather data is available (check console logs)
- [ ] Test script runs successfully: `npx tsx test-ai-rig-tuning.ts`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Browser cache cleared
- [ ] Anthropic API status is operational

## Getting Help

If still not working after these steps, capture:

1. **Browser console logs** (full output, screenshots)
2. **Network tab** (filter for "anthropic", export HAR)
3. **Test script output** from `npx tsx test-ai-rig-tuning.ts`
4. **Race data** (boat class, weather availability)

Include these in your issue report.
