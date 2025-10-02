# RegattaFlow Development Context

*Last Updated: September 25, 2025*

## Project Overview

RegattaFlow is a comprehensive sailing ecosystem that unifies the fragmented world of competitive sailing through three interconnected platforms:

1. **Sailors** - Individual racers tracking their racing journey with AI-powered strategy
2. **Coaches** - Professional coaching marketplace with integrated analytics
3. **Clubs/Classes/Regattas** - Race organizers managing events and results

See [Master Plan](./plans/regattaflow-master-plan.md) for complete vision and roadmap.

## Technology Stack

### Current Architecture - Expo Universal App
- **Universal Platform**: Expo SDK 54+ with React Native for iOS, Android, and Web
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Real-time)
- **Web Rendering**: React Native Web with Expo Router
- **Mobile**: Native iOS and Android via Expo/React Native
- **Hosting**: Vercel for web builds (`expo export:web`), EAS for mobile builds
- **State Management**: Zustand for client state
- **Database**: PostgreSQL with Row Level Security
- **AI/ML**:
  - **Anthropic Claude** (Agent SDK) for autonomous multi-step workflows
  - **Google AI (Gemini)** for document parsing and content extraction
  - **Agent SDK**: Self-orchestrating AI for venue intelligence, document processing, and coach matching

### Key External Services
- **Maps**: MapLibre GL JS for 3D race course visualization
- **Weather**: Multi-model weather ensemble forecasting
- **Payments**: Stripe for subscriptions and coach marketplace
- **Email**: SendGrid for transactional emails

## Development Methodology

### Living Document Planning
This project uses a comprehensive planning methodology. **Always check existing plans before starting work.**

#### Essential Commands
```bash
# Start new feature
"I want to implement [feature]. Check @plans/example-feature.md for reference. Write a plan in @plans/[feature-name].md and let me validate it before implementation."

# Continue existing work
"Continue the implementation documented in @plans/[feature-name].md"

# Quality checks (run after implementation)
expo lint         # ESLint + Prettier for React Native
expo start --web  # Test web build locally
npx expo export:web && vercel build  # Test production build
```

#### Planning Documents
**Migration & Core Architecture:**
- [nextjs-to-expo-migration.md](./plans/nextjs-to-expo-migration.md) - **COMPLETED: Migration from Next.js to Expo Universal**
- [WORKFLOW.md](./plans/WORKFLOW.md) - Detailed development methodology
- [technical-architecture.md](./plans/technical-architecture.md) - System design with global infrastructure
- [example-feature.md](./plans/example-feature.md) - Template and reference

**Product Strategy & Vision:**
- [regattaflow-master-plan.md](./plans/regattaflow-master-plan.md) - Complete product vision and roadmap
- [regattaflow-expo-app.md](./plans/regattaflow-expo-app.md) - Expo app specific planning
- [mobile-app-experience.md](./plans/mobile-app-experience.md) - Mobile user experience design
- [frontend-ux-strategy.md](./plans/frontend-ux-strategy.md) - UI/UX strategy and patterns

**Core Features:**
- [global-sailing-venues.md](./plans/global-sailing-venues.md) - **CRITICAL: Global venue intelligence system**
- [sailor-experience.md](./plans/sailor-experience.md) - Primary user experience with global features
- [race-strategy-planning.md](./plans/race-strategy-planning.md) - OnX Maps for Sailing with regional intelligence
- [onx-maps-advanced-mapping-system.md](./plans/onx-maps-advanced-mapping-system.md) - Advanced 3D mapping system

**Business Features:**
- [coach-marketplace.md](./plans/coach-marketplace.md) - Two-sided coaching marketplace
- [club-management.md](./plans/club-management.md) - Race committee and club management tools

## Development Patterns

### Authentication Pattern (React Native + Web)
```typescript
import { useAuth } from '@/src/lib/contexts/AuthContext'
import { View, Text } from 'react-native'

export function ProtectedFeature() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <AuthRequired />

  return <FeatureContent />
}
```

### Supabase Data Patterns
```typescript
// Standard table naming (unchanged)
const tables = {
  users: 'users',
  regattas: 'regattas',
  results: 'regatta_results',
  sailors: 'sailor_profiles',
  coaches: 'coach_profiles',
  sessions: 'coaching_sessions',
  venues: 'sailing_venues',
  venue_intelligence: 'regional_intelligence',
  venue_cultural: 'cultural_profiles',
  venue_visits: 'venue_visits'
}

// Standard query pattern with RLS (unchanged)
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id)

// Global venue queries with geographic optimization
const { data: nearbyVenues } = await supabase
  .from('sailing_venues')
  .select('*, regional_intelligence(*), cultural_profiles(*)')
  .rpc('venues_within_radius', { lat, lng, radius_km: 50 })
```

### Component Structure (Expo Universal)
```
src/components/[feature]/
├── index.ts              # Barrel exports
├── [Feature]Table.tsx    # Data display (React Native components)
├── [Feature]Form.tsx     # Data input (React Native components)
├── [Feature]Card.tsx     # Summary display (React Native components)
└── types.ts              # Local interfaces
```

### File Organization (Expo App Router)
```
src/
├── app/                  # Expo Router - Universal navigation
├── components/           # React Native components (universal)
├── lib/                  # Utilities and configurations
├── contexts/             # React contexts (universal)
├── hooks/                # Custom hooks (universal)
├── types/                # TypeScript definitions
└── assets/               # Images, fonts, and static files
```

## Key Features & User Personas

### Primary Persona: Bram Van Olsen
- **Profile**: Dragon class sailor, Hong Kong-based, international competitor
- **Goal**: World Championship preparation with AI-powered race strategy
- **Key Features**: Global venue intelligence, document parsing, 3D course visualization, tactical planning
- **Pain Points**: Fragmented PDFs, unfamiliar venues, cultural barriers, manual tracking
- **Global Context**: Competes worldwide but needs local expertise at each venue

### Core Feature Categories
1. **Global Venue Intelligence** - **CRITICAL: Location-aware system with 147+ venues**
2. **AI Race Strategy Planning** - OnX Maps for Sailing with regional adaptation
3. **Document Management** - AI-powered parsing with multi-language support
4. **Performance Analytics** - Race tracking and strategic analysis with venue comparison
5. **Equipment Management** - Boat setup optimization with venue-specific recommendations
6. **Coach Marketplace** - Two-sided marketplace for sailing instruction
7. **Club Management** - Complete race committee and event tools

## Development Workflow

### Expo Universal Development
RegattaFlow uses Expo's Universal App architecture to provide consistent experiences across iOS, Android, and Web from a single codebase.

#### Platform-Specific Considerations
```typescript
// Platform detection for universal components
import { Platform } from 'react-native'

export function UniversalComponent() {
  if (Platform.OS === 'web') {
    // Web-specific optimizations
    return <WebOptimizedView />
  }

  // Mobile-optimized (iOS/Android)
  return <MobileOptimizedView />
}
```

#### Responsive Design Patterns
```typescript
// Universal responsive design with React Native Web
import { useWindowDimensions } from 'react-native'

export function ResponsiveLayout() {
  const { width } = useWindowDimensions()

  return (
    <View style={{
      flexDirection: width > 768 ? 'row' : 'column'  // Desktop vs Mobile
    }}>
      <MainContent />
      <Sidebar />
    </View>
  )
}
```

### MCP-Enhanced Development
RegattaFlow leverages Model Context Protocol (MCP) servers for integrated development workflows.

#### Available MCP Services
- **Browser Tools MCP**: Complete UI debugging and audit suite
- **Stripe MCP**: Payment system integration and testing
- **Supabase MCP**: Database operations and documentation access
- **Vercel MCP**: Deployment and environment management
- **MapLibre GL**: 3D mapping and maritime visualization

### Quality Standards (MCP-Enhanced)
- **TypeScript**: All code must be type-safe
- **Testing**: `expo export:web && vercel build` + `mcp__browser-tools__runBestPracticesAudit`
- **Linting**: `expo lint` + `mcp__browser-tools__runNextJSAudit` (works with React)
- **Performance**: `mcp__browser-tools__runPerformanceAudit` for web optimization
- **Accessibility**: `mcp__browser-tools__runAccessibilityAudit` for compliance
- **SEO**: `mcp__browser-tools__runSEOAudit` for search optimization
- **Planning**: Update relevant plan documents during implementation
- **Security**: Never expose secrets, use environment variables

### Branch Naming
```
feature/[feature-name]    # New features
fix/[issue-description]   # Bug fixes
refactor/[area]          # Code improvements
docs/[update-type]       # Documentation updates
```

### Commit Messages
```
feat: implement race strategy AI engine (see @plans/race-strategy-planning.md)
fix: resolve Supabase RLS policy for coach profiles
refactor: optimize regatta results query performance
```

## Environment & Configuration

### Required Environment Variables
```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google AI (for AI features)
GOOGLE_AI_API_KEY=

# MapLibre GL (for 3D maps - open source, no token required)

# Stripe (for payments)
STRIPE_SECRET_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Development Commands
```bash
# Development
expo start              # Start development server (all platforms)
expo start --web        # Start web development server
expo start --ios        # Start iOS simulator
expo start --android    # Start Android emulator

# Building
expo export:web         # Build web app for deployment
eas build --platform ios  # Build iOS app
eas build --platform android  # Build Android app

# Quality Assurance
expo lint               # Run ESLint + Prettier
npx tsc --noEmit       # TypeScript type checking

# Deployment
vercel deploy           # Deploy web build to Vercel
eas submit              # Submit mobile builds to stores
```

## Global Venue Intelligence Development

### Critical Development Context
**RegattaFlow's competitive differentiator is global venue intelligence.** This transforms the app from a general sailing tool into "OnX Maps for Sailing" - a globally-aware platform that provides local expertise anywhere sailors compete.

### Location-Aware Development Patterns
```typescript
// Venue Detection Service Integration (React Native Universal)
import { VenueDetectionService } from '@/src/services/VenueDetectionService'
import { RegionalIntelligenceService } from '@/src/services/RegionalIntelligenceService'
import { View } from 'react-native'

export function LocationAwareComponent() {
  const { currentVenue, isDetecting } = useVenueDetection()
  const { intelligence, weather, cultural } = useRegionalIntelligence(currentVenue?.id)

  // Component automatically adapts to current venue
  return (
    <VenueAdaptiveLayout venue={currentVenue}>
      <WeatherDisplay data={weather} locale={cultural.primaryLanguage} />
      <TacticalAdvice intelligence={intelligence} />
      <CulturalProtocols venue={currentVenue} cultural={cultural} />
    </VenueAdaptiveLayout>
  )
}
```

### Venue Intelligence Data Flow
```typescript
interface VenueIntelligenceFlow {
  detection: {
    gps: 'Automatic venue detection via GPS coordinates';
    manual: 'User venue selection with search/favorites';
    calendar: 'Calendar-driven venue pre-switching';
  };

  dataActivation: {
    intelligence: 'Load regional racing knowledge';
    weather: 'Activate venue-specific weather sources';
    cultural: 'Apply language/protocol adaptations';
    offline: 'Cache essential data for racing';
  };

  userExperience: {
    seamless: 'Transparent venue switching';
    contextual: 'Venue-appropriate feature exposure';
    educational: 'Learning system for new venues';
    performance: 'Venue-specific optimization';
  };
}
```

### Global Weather Integration Pattern
```typescript
// Multi-regional weather service pattern (Universal)
import { WeatherAggregationService } from '@/src/services/WeatherAggregationService'

export function VenueWeatherService(venue: SailingVenue) {
  const providers = {
    'north-america': ['NOAA', 'Environment_Canada'],
    'europe': ['ECMWF', 'Met_Office', 'Meteo_France'],
    'asia-pacific': ['JMA', 'Hong_Kong_Observatory', 'BOM']
  }

  const regionalProviders = providers[venue.region]
  return new WeatherAggregationService(regionalProviders, venue.coordinates)
}
```

### Cultural Adaptation Pattern
```typescript
interface CulturalAdaptationService {
  language: {
    interface: 'Auto-switch UI language based on venue';
    terminology: 'Sailing-specific term localization';
    documents: 'Multi-language document parsing';
  };

  protocols: {
    racing: 'Venue-specific customs and traditions';
    social: 'Post-race etiquette expectations';
    business: 'Local sailing industry practices';
  };

  economic: {
    currency: 'Automatic currency detection/conversion';
    costs: 'Local service pricing intelligence';
    budgeting: 'Venue-specific expense guidance';
  };
}
```

### Development Commands for Global Features
```bash
# Global venue development workflow
expo run venue:sync         # Sync venue database from master list
expo run intelligence:update # Update regional intelligence data
expo run weather:test       # Test multi-regional weather APIs
expo run cultural:validate  # Validate cultural data completeness
expo run venue:offline      # Prepare offline venue packages

# Location testing commands
expo run location:simulate  # Simulate GPS venue detection
expo run venue:switch       # Test venue switching scenarios
expo run intelligence:load  # Test intelligence loading performance
```

## MCP Development Patterns

### Payment System Development
**Traditional Workflow**: Manual Stripe dashboard → Code → Browser testing
**MCP-Enhanced Workflow**:
```bash
# Create test products and pricing via MCP
mcp__stripe__create_product(name: "Sailor Pro", description: "Monthly sailing analytics")
mcp__stripe__create_price(product: "prod_xxx", amount: 2900, currency: "usd")

# Integrated UI testing with browser tools
mcp__browser-tools__runDebuggerMode()  # Enable comprehensive debugging
mcp__browser-tools__getNetworkLogs()   # Monitor payment API calls
mcp__browser-tools__runAccessibilityAudit()  # Ensure payment forms are accessible
```

### Database Development
**Traditional Workflow**: Separate Supabase dashboard → SQL queries → Code → Testing
**MCP-Enhanced Workflow**:
```bash
# Direct database operations via Supabase MCP (read-only for safety)
# Query race results, test RLS policies, validate schema
# Integrated with browser tools for UI validation

mcp__browser-tools__runPerformanceAudit()  # Test database query performance impact
mcp__browser-tools__getConsoleErrors()     # Check for database connection issues
```

### UI/UX Development
**Traditional Workflow**: Code → Browser dev tools → Manual auditing
**MCP-Enhanced Workflow**:
```bash
# Comprehensive UI quality assurance
mcp__browser-tools__runAccessibilityAudit()     # WCAG compliance for sailing apps
mcp__browser-tools__runPerformanceAudit()       # Race data loading optimization
mcp__browser-tools__runSEOAudit()               # Regatta visibility optimization
mcp__browser-tools__runNextJSAudit()            # Framework-agnostic React optimizations
mcp__browser-tools__takeScreenshot()            # Visual regression testing
```

### Maritime Feature Development
**Traditional Workflow**: Multiple external tools for vessel data
**MCP-Enhanced Workflow**:
```bash
# Integrated vessel tracking for race visualization
# AIS Stream MCP provides real-time maritime data
# Integrated with MapLibre GL JS for 3D race course rendering
# Browser tools for testing maritime UI components

mcp__browser-tools__runDebuggerMode()  # Debug race visualization
mcp__browser-tools__getNetworkLogs()   # Monitor AIS data streams
```

### Deployment and Environment Management
**Traditional Workflow**: Manual Vercel dashboard → Environment variables → Deploy
**MCP-Enhanced Workflow**:
```bash
# Streamlined deployment via Vercel MCP
# Environment variable synchronization
# Deployment status monitoring
# Integrated error tracking

mcp__browser-tools__runBestPracticesAudit()  # Pre-deployment quality check
```

### Feature Development Workflow Example: Race Strategy Planning
```bash
# 1. Document Processing (AI + Maritime Intelligence)
# Upload sailing instructions → OpenAI parsing → AIS vessel data correlation

# 2. 3D Course Visualization (MapLibre GL JS - Universal)
# Generate race course → 3D rendering → Maritime overlays

# 3. UI Testing (Browser Tools MCP)
mcp__browser-tools__runAccessibilityAudit()  # Ensure sailors with disabilities can use
mcp__browser-tools__runPerformanceAudit()    # Optimize for mobile on boats
mcp__browser-tools__runSEOAudit()            # Regatta discoverability

# 4. Payment Integration (Stripe MCP)
mcp__stripe__create_product(name: "Race Strategy Pro")  # Premium features

# 5. Database Integration (Supabase MCP)
# Store race strategies → RLS validation → Performance analysis

# 6. Quality Assurance
mcp__browser-tools__runBestPracticesAudit()  # Overall quality check
mcp__browser-tools__takeScreenshot()         # Visual documentation
```

## AI Strategy Integration

### Agent-Based Architecture (NEW)
RegattaFlow uses Anthropic's Agent SDK for autonomous multi-step AI workflows. Agents self-orchestrate complex tasks by deciding which tools to call and adapting to results.

#### Available Agents
1. **VenueIntelligenceAgent** - Autonomous venue switching
   - GPS venue detection
   - Regional intelligence loading
   - Weather API selection (HKO, NOAA, etc.)
   - Cultural settings application
   - Offline data caching

2. **DocumentProcessingAgent** - Autonomous document processing
   - Race course extraction from sailing instructions
   - 3D visualization generation (MapLibre GeoJSON)
   - Strategic analysis and recommendations
   - Knowledge base storage

3. **CoachMatchingAgent** - Autonomous coach discovery
   - Performance analysis and trend detection
   - Skill gap identification
   - Coach search with expertise matching
   - Multi-factor compatibility scoring
   - Personalized session recommendations

#### Agent Development Pattern
```typescript
import { VenueIntelligenceAgent } from '@/src/services/agents';

// Agent autonomously executes multi-step workflow
const agent = new VenueIntelligenceAgent();
const result = await agent.switchVenueByGPS({
  latitude: 22.2793,
  longitude: 114.1628
});

if (result.success) {
  // Agent completed: detected venue, loaded intelligence, fetched weather,
  // applied cultural settings, cached offline data
  console.log('Venue switched:', result.result);
  console.log('Tools used:', result.toolsUsed);
} else {
  // Agent explains failure in natural language
  console.error('Agent failed:', result.error);
}
```

#### Agent vs Traditional AI
**Before (Manual Orchestration):**
```typescript
// Developer hardcodes every step
const parsed = await gemini.generateContent("Extract marks");
const marks = JSON.parse(parsed.text);
const venue = await getVenueData();
const strategy = await gemini.generateContent("Generate strategy");
```

**After (Autonomous Agents):**
```typescript
// AI decides the steps
const result = await documentAgent.processSailingInstructions(text, filename);
// Agent internally: Extract → Generate viz → Analyze strategy → Save
```

**Benefits:**
- 80% less orchestration code
- Self-healing (agents retry failures automatically)
- Adaptive (agents adjust to unexpected scenarios)
- Better error messages in natural language

See [plans/anthropic-agent-sdk-integration.md](./plans/anthropic-agent-sdk-integration.md) for complete implementation details.

### Document Processing Pipeline (Hybrid: Agent + Gemini)
1. **Upload**: PDF, URL, or photo (OCR) using `expo-document-picker`
2. **Agent Orchestration**: DocumentProcessingAgent decides workflow
3. **AI Parsing**: Google AI Gemini extraction (called by agent tools)
4. **Course Building**: 3D MapLibre visualization (generated by agent)
5. **Strategy Generation**: Strategic analysis (coordinated by agent)
6. **Knowledge Storage**: Automatic saving (handled by agent)

### Key AI Features
- **Autonomous venue intelligence switching** - Agent detects and loads regional data
- **Self-orchestrating document processing** - Agent extracts, visualizes, and analyzes
- **Intelligent coach matching** - Agent analyzes performance and matches expertise
- **Sailing instruction parsing** - Gemini extraction orchestrated by agent
- **Wind/tide/current forecasting** - Regional weather API selection by agent
- **Race strategy optimization** - Confidence scoring with adaptive recommendations
- **Equipment setup correlation** - Performance tracking with venue adaptation
- **Real-time tactical decisions** - Context-aware guidance

## Important Notes

### Data Privacy & Security
- All user data protected by Supabase RLS policies
- GDPR compliance with data export/deletion
- Field-level encryption for sensitive information
- Audit logging for all data access

### Performance Considerations
- CDN via Vercel Edge Network (web builds)
- EAS optimization for mobile app builds
- Database query optimization with proper indexing
- Real-time subscriptions for live race tracking
- Offline-first mobile experience with sync
- React Native Web optimizations for desktop users

### Revenue Model
- **Free Tier**: Basic race tracking, limited documents
- **Sailor Pro** ($29/month): Full features, unlimited storage
- **Championship** ($49/month): Advanced AI, environmental intelligence
- **Coach Marketplace**: 15% commission on sessions
- **Club Licenses**: $299-999/month based on volume

## Quick References

### Common User Flows
1. **New Sailor**: Detect venue → Upload race documents → AI generates course → Create venue-adapted strategy
2. **Traveling Sailor**: GPS detects new venue → Load cultural briefing → Access local intelligence → Adapt equipment/tactics
3. **Race Day**: Confirm venue → Load regional strategy → Start tactical timer → Log events → Analyze with venue comparison
4. **Global Circuit**: Plan multi-venue campaign → Optimize logistics → Track performance across venues → Compare venue-specific results
5. **Coach Booking**: Browse marketplace → Filter by venue expertise → Book session → Share venue-specific performance data
6. **Club Event**: Select venue → Create regatta → Manage entries → Run races → Publish results with venue context

### Integration Points
- **Global Venue Database** - 147+ major sailing venues with intelligence
- **Regional Weather APIs** - Multi-model weather integration by region
- **Cultural Intelligence Services** - Language, customs, and protocol data
- **Sailing organization databases** for official results
- **Equipment vendor APIs** (North Sails, etc.) for venue-specific setup guides
- **Payment systems** for subscriptions and coaching fees
- **Location services** for automatic venue detection and switching
- **Maritime chart services** for venue bathymetry and navigation

### Platform-Specific Notes

#### Mobile (iOS/Android)
- Native performance with React Native
- GPS venue detection and offline caching
- Camera integration for document scanning
- Push notifications for race updates

#### Web (Desktop/Tablet)
- React Native Web for consistent experience
- Keyboard shortcuts and desktop workflows
- Large screen layouts for strategy planning
- SEO optimization for public pages

---

*This document provides context for Claude development sessions. For detailed feature specifications, always refer to the relevant plan in the `plans/` directory.*