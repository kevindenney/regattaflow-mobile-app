# Debug Logging Added - AI Rig Tuning

## What Was Added

Comprehensive console logging at every step of the AI rig tuning flow to identify exactly where it's failing.

## How to Use

1. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

2. **Open browser DevTools**:
   - Press F12 or Cmd+Opt+I
   - Go to "Console" tab
   - Clear console (Cmd+K or Ctrl+L)

3. **Navigate to Dragon race**:
   - Go to localhost:8081/races
   - Click on the Dragon race (ENE 8-9kts)
   - Scroll to "Rig Tuning Checklist" section

4. **Click "Refresh" button** on the Rig Tuning card

5. **Watch console for logs** - You'll see a detailed trace

## Expected Log Flow (Success)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[RaceTuningService] 🔍 getRecommendations called
[RaceTuningService] 📋 Request details: {...}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[RaceTuningService] ✅ Class reference found: { classId: '...', className: 'Dragon' }
[RaceTuningService] 📡 Fetching guides from tuningGuideService...
[RaceTuningService] 📚 Retrieved guides: { count: 0, ... }
[RaceTuningService] 🎯 Candidate sections: { count: 0, ... }

┌─────────────────────────────────────────────────────┐
│ NO TUNING GUIDES FOUND - TRYING AI GENERATION      │
└─────────────────────────────────────────────────────┘

[RaceTuningService] 🔧 AI Engine available? true
[RaceTuningService] 🔧 AI Engine ready? true
[RaceTuningService] 📞 Calling tryGenerateAIOnlyRecommendations...

┌─────────────────────────────────────────────────────┐
│ tryGenerateAIOnlyRecommendations START              │
└─────────────────────────────────────────────────────┘

[RaceTuningService] 🔍 Checking AI engine availability...
[RaceTuningService] 🔧 AI Engine isAvailable(): true
[RaceTuningService] ✅ AI engine is available, proceeding...
[RaceTuningService] 🤖 Calling aiEngine.generateAIOnlyRecommendations()...
[RaceTuningService] 📤 Passing request: {...}

╔═════════════════════════════════════════════════════╗
║ RaceTuningEngine.generateAIOnlyRecommendations     ║
╚═════════════════════════════════════════════════════╝

[RaceTuningEngine] 🔑 hasValidApiKey: true
[RaceTuningEngine] ✅ API key is valid
[RaceTuningEngine] 🔄 Ensuring skill initialized...
[RaceTuningEngine] ✅ Skill initialization complete
[RaceTuningEngine] 📊 Weather Context: {...}
[RaceTuningEngine] 🏆 Boat Class: Dragon
[RaceTuningEngine] 🧭 Point of Sail: upwind
[RaceTuningEngine] 📡 Calling Anthropic API...
[RaceTuningEngine] 🎯 Model: claude-3-5-sonnet-latest
[RaceTuningEngine] ✅ API call successful
[RaceTuningEngine] 📦 Response received: {...}
[RaceTuningEngine] 📝 Text blocks found: 1
[RaceTuningEngine] 📄 Combined text length: 2500
[RaceTuningEngine] 📄 Combined text preview: [...]
[RaceTuningEngine] 🔍 Searching for JSON array...
[RaceTuningEngine] ✅ JSON array found, parsing...
[RaceTuningEngine] 📊 Parsed result: { isArray: true, length: 1 }
[RaceTuningEngine] 🔄 Transforming recommendations...
[RaceTuningEngine] ✅ Transformation complete
[RaceTuningEngine] 📋 Returning 1 recommendation(s)

[RaceTuningService] 📥 Received response from AI engine
[RaceTuningService] 📊 Response details: { isArray: true, length: 1, ... }
[RaceTuningService] ✅ AI-only recommendations generated successfully
[RaceTuningService] 📋 Returning 1 recommendation(s)

✅ SUCCESS: Using AI-only generated tuning recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Common Failure Patterns

### 1. No API Key
```
[RaceTuningEngine] 🔑 hasValidApiKey: false
[RaceTuningEngine] ❌ NO API KEY - Returning empty array
```
**Fix**: Check .env file, restart server

### 2. Early Exit - No Class
```
[RaceTuningService] ❌ EARLY EXIT: No class reference provided
```
**Fix**: Race data missing boat class info

### 3. Weather Data Missing
```
[RaceTuningService] 📋 Request details: {
  classId: '...',
  className: 'Dragon',
  averageWindSpeed: undefined,  // ← PROBLEM
  windMin: undefined,
  windMax: undefined
}
```
**Fix**: Weather forecast not loaded for this race

### 4. API Call Failed
```
╔═════════════════════════════════════════════════════╗
║ ANTHROPIC API ERROR                                ║
╚═════════════════════════════════════════════════════╝
[RaceTuningEngine] ❌ Error: Failed to fetch
```
**Fix**: CORS issue, network problem, or API rate limit

### 5. Empty Response
```
[RaceTuningEngine] ❌ No JSON array found in response
[RaceTuningEngine] 📄 Full text: [shows what AI returned]
```
**Fix**: AI didn't return proper JSON format

## What to Capture

If it's still failing, capture:

1. **Full console log** - Select all, copy (Cmd+A, Cmd+C)
2. **Network tab** - Filter for "anthropic", check status codes
3. **Weather data** - Look for the weather context in logs:
   ```
   [RaceTuningEngine] 📊 Weather Context: {
     windSpeed: ?,
     windMin: ?,
     windMax: ?
   }
   ```

## Key Checkpoints

The logs will tell us:

- ✅ Is the service being called at all?
- ✅ Is there a class reference?
- ✅ Is weather data being passed?
- ✅ Is the API key present?
- ✅ Does the API call succeed?
- ✅ Does the AI return valid JSON?
- ✅ Does the transformation work?
- ✅ Is the data returned to the UI?

## Next Steps

After you refresh the page and click the Refresh button:

1. **Copy the full console output**
2. **Look for the first ❌ or error**
3. **Share the logs** - I can pinpoint the exact failure point

The logs will show us exactly where it breaks! 🔍
