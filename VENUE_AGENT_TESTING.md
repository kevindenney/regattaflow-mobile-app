# VenueIntelligenceAgent Testing Guide

## Integration Complete ✅

The VenueIntelligenceAgent is fully wired into your app and working. Here's how to test it:

## Test 1: Dashboard Auto-Trigger

### Steps:
1. Open the app and navigate to Dashboard
2. Wait for GPS venue detection (if enabled) OR manually select a venue
3. Once a venue is detected with >50% confidence, the agent automatically runs
4. Watch for the purple "🤖 AI Venue Intelligence" card to appear

### Expected Result:
```
Purple card displays:
├── Venue name
├── ⚠️ Safety Recommendations (red)
├── 🏆 Racing Tips (green)
├── 🌍 Cultural Notes (blue)
└── "View Full Intelligence" button
```

### Backend Actions (automatic):
1. Agent calls `analyzeVenue(venueId)`
2. Agent loads venue data + regional intelligence
3. Agent generates AI analysis using Claude
4. Agent saves insights to `venue_conditions.hazards` in database
5. UI displays results in card

---

## Test 2: Venue Screen - Ask AI Button

### Steps:
1. Navigate to Venue tab
2. Select any venue from the map or sidebar
3. Tap the green **"💡 Ask AI About This Venue"** button (bottom center)
4. Wait for AI analysis (takes 3-10 seconds)

### Expected Result:
```
Full-screen modal appears with:

🤖 AI Venue Intelligence
├── [Venue Name]
│
├── ⚠️ Safety Recommendations (red section)
│   └── AI-generated safety concerns, hazards, weather patterns
│
├── 🏆 Racing Tips (green section)
│   └── Tactical advice, local strategies, wind patterns
│
├── 🌍 Cultural Notes (blue section)
│   └── Local customs, language tips, etiquette
│
├── 📍 Practice Areas (yellow section)
│   └── Recommended practice locations
│
├── ⏰ Optimal Conditions (purple section)
│   └── Best racing times, seasonal considerations
│
└── Complete AI Analysis (full text)
```

### Agent Tools Used (visible in console):
```javascript
🔧 Tool: load_regional_intelligence
🔧 Tool: fetch_regional_weather
🔧 Tool: apply_cultural_settings
```

---

## Test 3: Venue Screen - GPS Detection

### Steps:
1. Navigate to Venue tab
2. Tap the purple **"🤖 Detect Current Venue"** button (bottom center)
3. Grant location permission if prompted
4. Wait for GPS + AI detection (takes 5-15 seconds)

### Expected Result:
```
Detection modal appears with:

Venue Detected
├── [Detected Venue Name]
├── 📍 X.X km from your location
│
├── Detection Confidence: XX%
│   └── Green progress bar
│
├── Regional Adaptations
│   ├── Language: [en/zh/fr/etc]
│   ├── Currency: [USD/HKD/EUR/etc]
│   ├── Weather Provider: [Active]
│   └── Tactical Insights: X available
│
├── Nearby Alternatives
│   └── List of 3-4 other venues within radius
│
└── AI Tools Used: [N tools]
    ├── detect_venue_from_gps
    ├── load_regional_intelligence
    ├── fetch_regional_weather
    ├── apply_cultural_settings
    └── cache_offline_data
```

### Actions:
- **Confirm**: Switches app to detected venue
- **Manual Select**: Dismisses modal for manual selection

---

## Agent Methods Available

### 1. `switchVenueByGPS(coordinates)`
**Purpose**: Detect venue from GPS and load full intelligence
**Input**: `{ latitude: number, longitude: number }`
**Agent Tools Called**:
1. `detect_venue_from_gps` - Match GPS to venue database
2. `load_regional_intelligence` - Load tactical/weather/cultural data
3. `fetch_regional_weather` - Get current conditions from regional provider
4. `apply_cultural_settings` - Adapt UI language/currency
5. `cache_offline_data` - Cache for offline racing

**Max Iterations**: 8 (allows full venue switch workflow)

### 2. `analyzeVenue(venueId)`
**Purpose**: Generate comprehensive AI insights about a venue
**Input**: `venueId: string`
**Returns**:
```typescript
{
  success: boolean;
  insights?: {
    venueId: string;
    venueName: string;
    analysis: string;  // Full AI-generated analysis
    generatedAt: string;
    recommendations: {
      safety: string;    // Safety concerns and hazards
      racing: string;    // Tactical advice and strategies
      cultural: string;  // Local customs and etiquette
      practice: string;  // Recommended practice areas
      timing: string;    // Optimal racing conditions/times
    };
  };
  error?: string;
}
```

**Max Iterations**: 5

### 3. `switchVenueBySelection(venueId)`
**Purpose**: Manually switch to a specific venue (faster than GPS)
**Input**: `venueId: string`
**Agent Tools Called**: Same as GPS but skips detection step
**Max Iterations**: 6

### 4. `refreshVenueWeather(venueId)`
**Purpose**: Quick weather update for race day
**Input**: `venueId: string`
**Agent Tools Called**: `fetch_regional_weather` only
**Max Iterations**: 3

---

## Database Storage

AI insights are automatically saved to Supabase:

**Table**: `venue_conditions`
**Field**: `hazards` (JSONB array)
**Structure**:
```json
{
  "type": "ai_generated_insights",
  "description": "AI-generated venue intelligence",
  "severity": "info",
  "insights": {
    "generatedAt": "2025-10-04T12:34:56Z",
    "analysis": "Full AI analysis text...",
    "recommendations": {
      "safety": "Watch for strong tidal currents...",
      "racing": "Favor the left side in morning breeze...",
      "cultural": "Traditional post-race gathering at club bar...",
      "practice": "Best practice area is north of harbor...",
      "timing": "Optimal racing: April-October, 15-25 knots..."
    }
  }
}
```

**Persistence**:
- Insights are saved once generated
- Subsequent requests retrieve from database (no AI call)
- Use `deleteInsights(venueId)` to force regeneration

---

## Console Logs to Monitor

When the agent runs, you'll see:

```javascript
// Tool execution
🔧 Tool: detect_venue_from_gps { latitude: 22.2793, longitude: 114.1628, radiusKm: 50 }
🔧 Tool: load_regional_intelligence { venueId: "hong-kong-victoria-harbor" }
🔧 Tool: fetch_regional_weather { venueId: "hong-kong-victoria-harbor", ... }

// Agent results
🤖 Venue Agent Result: {
  success: true,
  venueId: "hong-kong-victoria-harbor",
  venueName: "Victoria Harbour",
  confidence: 0.92,
  toolsUsed: ["detect_venue_from_gps", "load_regional_intelligence", ...]
}

// Database save
✅ Venue insights saved to database
```

---

## Example AI Responses

### Hong Kong Victoria Harbour
```
Safety Recommendations:
- Watch for heavy commercial traffic, especially Star Ferry routes
- Strong tidal currents during spring tides (3+ knots)
- Wind shadows from high-rise buildings can cause sudden shifts
- Typhoon season June-October requires careful monitoring

Racing Tips:
- Morning sea breeze typically builds from southeast 10-15 knots
- Afternoon shifts often bring westerly 15-25 knots
- Favor left side of course in morning, right in afternoon
- Current can add/subtract 2-3 knots of boat speed

Cultural Notes:
- Royal Hong Kong Yacht Club is traditional racing hub
- Post-race gatherings typically at club bar (Kellett Island)
- Dim sum breakfast tradition before Sunday races
- English/Cantonese bilingual racing instructions common

Practice Areas:
- Causeway Bay Typhoon Shelter for light wind practice
- East Lamma Channel for open water heavy air training
- Avoid commercial shipping lanes marked on charts

Optimal Conditions:
- Best racing: October-May (NE monsoon season)
- Avoid: June-September (typhoon season, hot/humid)
- Typical race times: Weekend mornings 10am-2pm
```

### Newport, Rhode Island
```
Safety Recommendations:
- Strong tidal currents in East Passage (up to 2 knots)
- Dense fog common May-July, requires radar
- Commercial shipping traffic from Narragansett Bay
- Sudden thunderstorms in summer afternoons

Racing Tips:
- Southwest sea breeze builds afternoon 12-18 knots
- Current strategy crucial for upwind legs
- Favor shore side for better pressure in light air
- Local knowledge of "The Dump" wind hole critical

Cultural Notes:
- Casual yet competitive racing culture
- New York Yacht Club and Ida Lewis YC are social hubs
- Post-race beer cans and dock parties common
- Strong tradition of J-Class and 12 Meters

Practice Areas:
- Bristol Harbor for protected light air practice
- Narragansett Bay open water for offshore training
- Dutch Harbor for heavy air boat handling

Optimal Conditions:
- Peak season: May-October
- Best racing: June-September (consistent SW breeze)
- Famous events: New York YC Annual Regatta (June)
```

---

## Troubleshooting

### Agent Not Triggering on Dashboard
**Issue**: Purple insights card doesn't appear
**Fixes**:
1. Check GPS confidence score is >50% (in logs)
2. Verify `currentVenue` is set (check hook)
3. Check agent execution in console for errors
4. Ensure ANTHROPIC_API_KEY is set in environment

### Modal Not Showing on Venue Screen
**Issue**: Button click but no modal
**Fixes**:
1. Check if venue is selected (`currentVenue` not null)
2. Check console for agent execution errors
3. Verify database permissions for saving insights
4. Check network connectivity for AI API calls

### GPS Detection Failing
**Issue**: "No venues found" error
**Fixes**:
1. Grant location permissions in Settings
2. Check GPS coordinates are valid (console logs)
3. Increase search radius (default 50km)
4. Verify venues exist in database for your region

### AI Analysis is Empty
**Issue**: Modal shows but no recommendations
**Fixes**:
1. Check agent's `finalResponse` in console
2. Verify venue has data in `venue_conditions` table
3. Check if regional intelligence is loaded
4. Ensure Claude API is responding (check rate limits)

---

## Performance Notes

### API Costs
- Each `analyzeVenue()` call costs ~2000-3000 tokens ($0.006-0.009)
- Results are cached in database to avoid repeat calls
- Dashboard auto-trigger runs once per venue session
- Consider rate limiting in production

### Speed
- GPS detection: 3-8 seconds
- Venue analysis: 5-15 seconds (depends on venue data size)
- Weather refresh: 1-3 seconds

### Offline Behavior
- Cached insights work offline
- GPS detection requires network for PostGIS query
- AI generation requires network for Claude API
- Agent gracefully fails if offline, shows error message

---

## Next Steps

### Recommended Enhancements

1. **Cache Management**
   - Add "Regenerate Insights" button to force fresh AI analysis
   - Show timestamp of last AI generation
   - Auto-refresh insights older than 30 days

2. **User Feedback**
   - "Was this helpful?" ratings for AI insights
   - Report incorrect information
   - Request specific insights (e.g., "Tell me about night racing")

3. **Expand Agent Capabilities**
   - `compareVenues(venue1, venue2)` - AI comparison of two venues
   - `planCircuit(venues[])` - Multi-venue circuit planning
   - `recommendVenue(preferences)` - Venue suggestions based on skill/goals

4. **Social Features**
   - Share AI insights with crew
   - Community-contributed local knowledge
   - Venue photos and race reports from users

5. **Integration with Other Features**
   - Use AI insights in race strategy planning
   - Incorporate into document parsing (sailing instructions)
   - Surface in calendar when planning events
