# VenueIntelligenceAgent Integration Flow

## Visual Integration Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        RegattaFlow App                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
          ┌─────────▼────────┐  ┌──────▼──────────┐
          │   DASHBOARD      │  │   VENUE SCREEN  │
          │  (Auto-Trigger)  │  │  (Manual)       │
          └─────────┬────────┘  └──────┬──────────┘
                    │                   │
                    │                   ├──► 💡 "Ask AI About Venue"
                    │                   │
                    │                   └──► 🤖 "Detect Current Venue"
                    │
        ┌───────────┴────────────┐
        │  GPS Venue Detection   │
        │  confidence > 50%      │
        └───────────┬────────────┘
                    │
                    │  Both paths lead to:
                    ▼
        ┌───────────────────────────┐
        │  VenueIntelligenceAgent   │
        │  (Anthropic Agent SDK)    │
        └───────────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        │   Agent executes:     │
        │                       │
        │  1️⃣  detect_venue_from_gps         (GPS → Venue ID)
        │  2️⃣  load_regional_intelligence    (Tactical + Weather + Cultural)
        │  3️⃣  fetch_regional_weather        (HKO/NOAA/etc.)
        │  4️⃣  apply_cultural_settings       (Language/Currency)
        │  5️⃣  cache_offline_data            (Offline racing)
        │
        │  OR (for analyzeVenue only):
        │
        │  🧠 analyzeVenue()                  (AI generates insights)
        └───────────┬───────────┘
                    │
        ┌───────────▼──────────────────┐
        │  AI Analysis (Claude)        │
        │  - Safety recommendations    │
        │  - Racing tactical advice    │
        │  - Cultural protocols        │
        │  - Practice areas            │
        │  - Optimal racing times      │
        └───────────┬──────────────────┘
                    │
        ┌───────────▼──────────────────┐
        │  VenueIntelligenceService    │
        │  saveVenueInsights()         │
        └───────────┬──────────────────┘
                    │
        ┌───────────▼──────────────────┐
        │  Supabase Database           │
        │  venue_conditions.hazards    │
        │  (JSONB)                     │
        └───────────┬──────────────────┘
                    │
        ┌───────────▼──────────────────┐
        │  UI Display                  │
        │                              │
        │  Dashboard: Purple card      │
        │  Venue: Full-screen modal    │
        └──────────────────────────────┘
```

---

## Integration Point 1: Dashboard Auto-Trigger

```
User opens app
    │
    ▼
Dashboard loads
    │
    ▼
useVenueDetection() hook
    │
    ├─► GPS location detected
    │   (currentVenue, confidence)
    │
    ▼
confidence > 50%?
    │
    YES
    │
    ▼
handleGetVenueInsights()
    │
    ▼
new VenueIntelligenceAgent()
    │
    ▼
agent.analyzeVenue(venueId)
    │
    ├─► Tools: load_regional_intelligence
    ├─► Tools: fetch_regional_weather
    └─► AI: Generate comprehensive insights
    │
    ▼
setVenueInsights(result.insights)
    │
    ▼
Purple "AI Venue Intelligence" card appears
    │
    ├─► 🔴 Safety (first line)
    ├─► 🟢 Racing (first line)
    └─► 🔵 Cultural (first line)
    │
    ▼
"View Full Intelligence" button → Venue screen
```

**Code Location:** `src/app/(tabs)/dashboard.tsx:116-142`

---

## Integration Point 2: Venue Screen - "Ask AI About This Venue"

```
User navigates to Venue tab
    │
    ▼
User selects venue from map/sidebar
    │
    ▼
User taps "💡 Ask AI About This Venue"
    │
    ▼
handleAskAIAboutVenue()
    │
    ▼
new VenueIntelligenceAgent()
    │
    ▼
agent.analyzeVenue(currentVenue.id)
    │
    ├─► Load venue data from Supabase
    ├─► Load regional intelligence
    ├─► Build comprehensive context
    ├─► AI generates insights (Claude)
    └─► Save to database
    │
    ▼
Full-screen modal appears
    │
    ├─► 🔴 Safety Recommendations (full text)
    ├─► 🟢 Racing Tips (full text)
    ├─► 🔵 Cultural Notes (full text)
    ├─► 🟡 Practice Areas (full text)
    ├─► 🟣 Optimal Conditions (full text)
    └─► 📄 Complete AI Analysis
    │
    ▼
User reads insights and closes modal
```

**Code Location:** `src/app/(tabs)/venue.tsx:131-156`

---

## Integration Point 3: Venue Screen - "Detect Current Venue"

```
User navigates to Venue tab
    │
    ▼
User taps "🤖 Detect Current Venue"
    │
    ▼
Location.requestForegroundPermissionsAsync()
    │
    ▼
Permission granted?
    │
    YES
    │
    ▼
Location.getCurrentPositionAsync()
    │
    ▼
Got GPS coordinates (lat, lng)
    │
    ▼
new VenueIntelligenceAgent()
    │
    ▼
agent.switchVenueByGPS({ latitude, longitude })
    │
    ├─► Tool: detect_venue_from_gps
    │   └─► PostGIS query: venues_within_radius
    │       └─► Returns closest venue + alternatives
    │
    ├─► Tool: load_regional_intelligence
    │   └─► Load tactical/weather/cultural data
    │
    ├─► Tool: fetch_regional_weather
    │   └─► Get current conditions from regional provider
    │
    ├─► Tool: apply_cultural_settings
    │   └─► Set language, currency, protocols
    │
    └─► Tool: cache_offline_data
        └─► Cache essential data for offline
    │
    ▼
Detection modal appears
    │
    ├─► Venue name + distance
    ├─► Confidence score (0-100%)
    ├─► Regional adaptations (language, currency)
    ├─► Nearby alternatives
    └─► AI tools used (badges)
    │
    ▼
User confirms or selects manual
    │
    CONFIRM
    │
    ▼
setVenueManually(venueId)
    │
    ▼
App switches to detected venue
    │
    ▼
Alert: "Venue switched to [name]"
```

**Code Location:** `src/app/(tabs)/venue.tsx:73-113`

---

## Data Flow: AI Insights Generation

```
VenueIntelligenceAgent.analyzeVenue(venueId)
    │
    ▼
Load venue from Supabase
    │
    ├─► sailing_venues (main venue data)
    ├─► venue_conditions (wind, currents, hazards)
    ├─► cultural_profiles (language, customs)
    ├─► weather_sources (regional providers)
    └─► yacht_clubs (facilities)
    │
    ▼
RegionalIntelligenceService.loadVenueIntelligence()
    │
    ├─► Tactical intelligence (local tactics)
    ├─► Weather intelligence (patterns, forecasts)
    ├─► Cultural intelligence (protocols, language)
    └─► Logistical intelligence (facilities, services)
    │
    ▼
Build comprehensive context for AI
    │
    {
      venueName: "Victoria Harbour",
      country: "Hong Kong",
      region: "asia-pacific",
      conditions: { wind_patterns, currents, tides },
      cultural: { languages, customs },
      intelligence: { tactical, weather, cultural, logistical }
    }
    │
    ▼
BaseAgentService.run()
    │
    ├─► userMessage: "Analyze this venue for a sailor..."
    ├─► context: comprehensive venue data
    ├─► maxIterations: 5
    │
    ▼
Anthropic Claude API
    │
    ├─► Model: claude-sonnet-4-5-20250929
    ├─► Temperature: 0.3 (consistent insights)
    ├─► Max tokens: 2048
    │
    ▼
AI generates structured insights
    │
    {
      safety: "Watch for commercial traffic...",
      racing: "Morning sea breeze from SE...",
      cultural: "RHKYC is traditional hub...",
      practice: "Causeway Bay for light wind...",
      timing: "Best racing Oct-May..."
    }
    │
    ▼
VenueIntelligenceService.saveVenueInsights()
    │
    ▼
Supabase: INSERT/UPDATE venue_conditions
    │
    hazards: [
      {
        type: "ai_generated_insights",
        insights: {
          generatedAt: "2025-10-04T...",
          analysis: "Full text...",
          recommendations: { ... }
        }
      }
    ]
    │
    ▼
Return insights to UI
    │
    ▼
Display in card/modal
```

---

## Database Schema: AI Insights Storage

```sql
-- Table: venue_conditions
CREATE TABLE venue_conditions (
  id UUID PRIMARY KEY,
  venue_id TEXT REFERENCES sailing_venues(id),
  hazards JSONB DEFAULT '[]',  -- ← AI insights stored here
  ...
);

-- Stored format:
{
  "type": "ai_generated_insights",
  "description": "AI-generated venue intelligence",
  "severity": "info",
  "insights": {
    "generatedAt": "2025-10-04T12:34:56Z",
    "analysis": "Complete AI analysis...",
    "recommendations": {
      "safety": "...",
      "racing": "...",
      "cultural": "...",
      "practice": "...",
      "timing": "..."
    }
  }
}
```

---

## UI Components Wired

### 1. Dashboard Insights Card
```tsx
Location: src/app/(tabs)/dashboard.tsx:272-336
Trigger: Auto (GPS confidence > 50%)
Display:
  ┌──────────────────────────────────────┐
  │ 🤖 AI Venue Intelligence         ✕  │
  │ [Venue Name]                         │
  │                                      │
  │ ⚠️  Safety                           │
  │ First line of safety recommendations │
  │                                      │
  │ 🏆 Racing Tips                       │
  │ First line of racing tips            │
  │                                      │
  │ 🌍 Cultural                          │
  │ First line of cultural notes         │
  │                                      │
  │ [View Full Intelligence →]           │
  └──────────────────────────────────────┘
```

### 2. Venue Analysis Modal
```tsx
Location: src/app/(tabs)/venue.tsx:304-415
Trigger: Manual ("Ask AI" button)
Display:
  ┌──────────────────────────────────────┐
  │ AI Venue Intelligence            ✕  │
  │ [Venue Name]                         │
  │ 🤖 AI-Generated Intelligence         │
  │                                      │
  │ ⚠️  Safety Recommendations           │
  │ [Full safety text with details]      │
  │                                      │
  │ 🏆 Racing Tips                       │
  │ [Full racing tactical advice]        │
  │                                      │
  │ 🌍 Cultural Notes                    │
  │ [Full cultural protocols]            │
  │                                      │
  │ 📍 Practice Areas                    │
  │ [Recommended practice locations]     │
  │                                      │
  │ ⏰ Optimal Conditions                │
  │ [Best racing times and seasons]      │
  │                                      │
  │ Complete AI Analysis                 │
  │ [Full unstructured AI response]      │
  │                                      │
  │           [Close]                    │
  └──────────────────────────────────────┘
```

### 3. Venue Detection Modal
```tsx
Location: src/app/(tabs)/venue.tsx:418-535
Trigger: Manual ("Detect Venue" button)
Display:
  ┌──────────────────────────────────────┐
  │ Venue Detected                   ✕  │
  │                                      │
  │ Victoria Harbour                     │
  │ 📍 2.3 km from your location         │
  │                                      │
  │ Detection Confidence                 │
  │ 92%  [████████████████████░░]        │
  │                                      │
  │ Regional Adaptations                 │
  │ Language: English                    │
  │ Currency: HKD                        │
  │ Weather Provider: Active             │
  │ Tactical Insights: 12 available      │
  │                                      │
  │ Nearby Alternatives                  │
  │ • Aberdeen Harbour (5.2 km)          │
  │ • Repulse Bay (7.8 km)               │
  │ • Sai Kung (15.3 km)                 │
  │                                      │
  │ AI Tools Used: 5                     │
  │ [detect_venue] [load_intel] ...      │
  │                                      │
  │ [Manual Select]    [Confirm]         │
  └──────────────────────────────────────┘
```

---

## Complete File Structure

```
regattaflow-app/
├── src/
│   ├── services/
│   │   ├── agents/
│   │   │   ├── BaseAgentService.ts         ← Agent foundation
│   │   │   ├── VenueIntelligenceAgent.ts   ← Main agent ✅
│   │   │   └── index.ts
│   │   └── VenueIntelligenceService.ts     ← Database persistence ✅
│   │
│   ├── app/
│   │   └── (tabs)/
│   │       ├── dashboard.tsx               ← Auto-trigger integration ✅
│   │       └── venue.tsx                   ← Manual button integration ✅
│   │
│   └── hooks/
│       └── useVenueDetection.ts            ← GPS detection hook
│
├── supabase/
│   └── migrations/
│       └── 20250930_venue_intelligence_system.sql  ← Database tables ✅
│
└── Documentation/
    ├── VENUE_AGENT_TESTING.md              ← Testing guide ✅
    ├── VENUE_AGENT_INTEGRATION_SUMMARY.md  ← Integration summary ✅
    └── VENUE_AGENT_FLOW.md                 ← This file ✅
```

---

## Summary: What's Wired and Working

✅ **Dashboard**
- Auto-triggers when GPS detects venue (confidence > 50%)
- Displays purple AI insights card
- Shows first line of Safety, Racing, Cultural recommendations
- Links to full venue screen

✅ **Venue Screen - Ask AI**
- Green floating button: "💡 Ask AI About This Venue"
- Generates comprehensive AI insights
- Full-screen modal with 5 recommendation sections
- Saves to database for future retrieval

✅ **Venue Screen - GPS Detection**
- Purple floating button: "🤖 Detect Current Venue"
- Uses GPS to find nearest venue
- Loads full regional intelligence
- Shows confidence score and regional adaptations
- Offers nearby alternatives

✅ **Database Persistence**
- AI insights saved to `venue_conditions.hazards`
- Instant retrieval for cached insights
- Force regeneration available

✅ **Agent Tools**
- `detect_venue_from_gps` - GPS → Venue ID matching
- `load_regional_intelligence` - Complete venue intelligence
- `fetch_regional_weather` - Regional weather providers
- `apply_cultural_settings` - Language/currency adaptation
- `cache_offline_data` - Offline racing support

**The VenueIntelligenceAgent is fully integrated and operational!** 🚀
