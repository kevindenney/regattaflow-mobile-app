# RegattaFlow Project Overview

## 📱 Project Summary
RegattaFlow is a comprehensive sailing race management and analysis platform built with Expo (React Native), Supabase, and AI-powered coaching features.

## 🏗️ Tech Stack

### Frontend
- **Framework**: Expo (React Native) - Cross-platform mobile app
- **Language**: TypeScript
- **UI Library**: React Native with custom components
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + Hooks
- **Maps**: 3D visualization with bathymetry, weather overlays, and tactical analysis

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Edge Functions**: Supabase Functions (Deno runtime)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions

### AI & ML
- **AI Provider**: Anthropic Claude (via MCP - Model Context Protocol)
- **Skills System**: Custom Claude skills for race strategy, coaching, tuning analysis
- **Weather Intelligence**: StormGlass API integration with AI analysis
- **Edge Functions**: AI proxy for secure API key handling

### External Services
- **Weather Data**: StormGlass API (marine weather, currents, tides)
- **Mapping**: Custom bathymetry visualization with GEBCO data
- **MCP Servers**:
  - Supabase MCP (database operations)
  - Vercel MCP (deployment)
  - Chrome DevTools MCP (testing)
  - Surf MCP (marine weather)

## 📁 Project Structure

See `project_structure.txt` for complete file tree (1316 lines).

### Key Directories

#### `/app` - Application Routes (Expo Router)
- `(auth)/` - Authentication flows (login, signup, onboarding)
- `(tabs)/` - Main app tabs (races, map, coaching, etc.)
- `club/` - Club management features
- `coach/` - Coach-specific features
- `race/` - Race detail and analysis screens

#### `/components` - Reusable UI Components
- `ai/` - AI assistant and chat components
- `coaching/` - Coaching interface components
- `dashboard/` - Dashboard widgets and cards
- `map/` - Map visualization (2D/3D, weather overlays, bathymetry)
- `races/` - Race cards, timers, analysis views
- `race-detail/` - Detailed race view components (strategy cards, weather, etc.)
- `race-strategy/` - Tactical planning and map components
- `racing-console/` - Live racing interface
- `shared/` - Generic reusable components
- `venue/` - Venue intelligence and visualization

#### `/services` - Business Logic & API Clients
- `ai/` - AI service clients (Claude, MCP, skills management)
- `weather/` - Weather service providers (StormGlass, OpenWeatherMap)
- `tides/` - Tidal data services
- `agents/` - AI agent implementations
- Core services:
  - `supabase.ts` - Database client configuration
  - `RaceWeatherService.ts` - Race weather data aggregation
  - `RaceCoachingService.ts` - AI coaching integration
  - `StrategicPlanningService.ts` - Race strategy generation
  - `GPSTracker.ts` - Location tracking
  - `BathymetryTileService.ts` - Underwater mapping

#### `/supabase`
- `functions/` - Edge Functions (Deno)
  - `anthropic-skills-proxy/` - Secure AI API proxy
  - `race-analysis/` - Race analysis processing
  - `club-onboarding/` - Club setup automation
  - `coach-matching/` - Coach recommendation engine
- `migrations/` - Database schema migrations

#### `/skills` - Claude AI Skills
Custom AI capabilities for specialized coaching:
- `race-strategy-analyst/` - Comprehensive race strategy
- `boat-tuning-analyst/` - Rig tuning recommendations
- `tidal-opportunism-analyst/` - Tidal strategy
- `current-counterplay-advisor/` - Current tactics
- `slack-window-planner/` - Wind shift planning
- `race-learning-analyst/` - Post-race learning insights
- Plus 8+ more specialized skills

#### `/hooks` - React Hooks
- `ai/` - AI-related hooks
- `useRaceWeather.ts` - Weather data fetching
- `useRaceSuggestions.ts` - AI suggestions
- `useTacticalZones.ts` - Tactical overlay data
- `useClubWorkspace.ts` - Club management
- `useCoachWorkspace.ts` - Coach workspace

#### `/types` - TypeScript Definitions
- Database types (auto-generated from Supabase)
- AI knowledge types
- Race analysis types
- Component prop types

#### `/constants` - Configuration
- `Colors.ts` - Design system colors
- `RacingDesignSystem.ts` - Racing UI design tokens
- `mockData.ts` - Demo/test data

## 🎯 Core Features

### For Sailors
1. **Race Preparation**
   - AI-powered strategy planning
   - Weather forecasting and analysis
   - Tidal and current intelligence
   - Venue-specific insights

2. **On-Water Tracking**
   - GPS track recording
   - Live race timer with phase detection
   - Real-time tactical suggestions
   - Performance metrics

3. **Post-Race Analysis**
   - Track playback with environmental overlays
   - Split times and performance analysis
   - AI coaching feedback
   - Learning insights and action items

4. **Fleet Management**
   - Fleet membership and leaderboards
   - Shared race events
   - Group insights and analytics

### For Coaches
1. **Client Management**
   - Athlete profiles and progress tracking
   - Session scheduling
   - Performance monitoring

2. **Race Analysis**
   - Detailed track analysis tools
   - Video annotation (planned)
   - Coaching feedback system

3. **Strategy Development**
   - Course visualization tools
   - Wind/current modeling
   - Tactical scenario planning

### For Clubs
1. **Event Management**
   - Race event creation and scheduling
   - Notice of Race (NOR) document handling
   - Fleet coordination

2. **Member Management**
   - Roster management
   - Fleet assignments
   - Results tracking

3. **AI Assistance**
   - Automated onboarding
   - Smart suggestions for club setup
   - Document processing

## 🔑 Key Technologies & Patterns

### MCP (Model Context Protocol) Integration
- Custom MCP server for RegattaFlow domain knowledge
- Supabase MCP for database operations
- Vercel MCP for deployment automation
- Skills-based AI architecture

### Real-time Features
- Supabase Realtime for live race updates
- WebSocket connections for GPS tracking
- Live coaching suggestions

### 3D Visualization
- Bathymetry rendering with depth contours
- 3D weather overlay visualization
- Tactical zone rendering
- Current flow visualization

### Offline-First Design
- Local caching of venue data
- Offline map tiles
- Queue-based sync system

## 🗄️ Database Schema Highlights

Key tables:
- `races` - Race events with weather and strategy data
- `race_results` - Performance tracking
- `race_suggestions` - AI-generated coaching tips
- `sailor_profiles` - User sailing experience
- `coach_profiles` - Coach certifications and specialties
- `clubs` - Sailing club information
- `fleets` - Fleet management
- `race_courses` - Course definitions with marks
- `ai_activity` - AI interaction logging
- `sailor_race_preparation` - Pre-race planning data

## 🚀 Recent Major Features

1. ✅ **StormGlass Weather Integration** - Professional marine weather data
2. ✅ **Claude Skills System** - 15+ specialized AI coaching skills
3. ✅ **3D Map Visualization** - Bathymetry and environmental overlays
4. ✅ **Racing Console** - Live race mode with phase detection
5. ✅ **Fleet Insights** - Collaborative learning for fleet members
6. ✅ **NOR Document System** - Notice of Race handling and AI extraction
7. ✅ **Coach Workspace** - Comprehensive coaching tools

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase CLI
- Claude Code or Claude Desktop (for MCP)

### Environment Variables
Key variables (see `.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role (Edge Functions only)
- `ANTHROPIC_API_KEY` - Claude API key
- `STORMGLASS_API_KEY` - Weather data API key

### Key Scripts
- `npm start` - Start Expo dev server
- `npm run build:web` - Build web version
- `npx supabase db push` - Push database migrations
- `npx supabase functions deploy` - Deploy Edge Functions

## 📚 Documentation Files

See `/docs` folder for detailed guides:
- `AI_INTEGRATION_GUIDE.md` - AI features implementation
- `CLAUDE_SKILLS_SETUP.md` - Skills system configuration
- `STORMGLASS_MIGRATION_PLAN.md` - Weather service setup
- `MCP_CLAUDE_SKILLS_INTEGRATION.md` - MCP server setup
- `VERCEL_MCP_SETUP.md` - Wire the Vercel MCP server into Codex

## 🎨 Design Patterns

1. **Service Layer Pattern** - Business logic isolated in `/services`
2. **Compound Components** - Complex UI broken into composable parts
3. **Custom Hooks** - Reusable state and side effect logic
4. **AI Skills Architecture** - Modular, composable AI capabilities
5. **Context Resolvers** - Dynamic AI context injection
6. **Edge-First AI** - Secure API handling via Edge Functions

## 📊 Current Status

The app is in active development with the following functional areas:
- ✅ Core race management
- ✅ AI coaching features
- ✅ Weather integration
- ✅ Fleet management
- ✅ Club administration
- 🚧 Video analysis (planned)
- 🚧 Social features (planned)
- 🚧 Mobile notifications (planned)

## 🔗 Key File Paths

For quick navigation:
- Main app entry: `app/_layout.tsx`
- Supabase config: `services/supabase.ts`
- AI client: `services/ai/EnhancedClaudeClient.ts`
- Weather service: `services/weather/StormGlassService.ts`
- Race detail UI: `components/race-detail/`
- Database schema: `supabase/migrations/`

---

**Last Updated**: 2025-11-07
**Project Version**: Active Development
**Repository**: Private (RegattaFlow)
