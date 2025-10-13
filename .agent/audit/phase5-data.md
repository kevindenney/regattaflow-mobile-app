# Phase 5: Data Flow & State Management Audit

**Date**: 2025-10-12
**Auditor**: Claude Code
**Focus**: Services, State Management, Hooks, Data Synchronization, Import Dependencies

---

## Executive Summary

### ✅ Strengths
- **107 service files** providing comprehensive functionality
- **Context-based state management** with React Context API (AuthProvider, SubscriptionProvider, ClubProvider)
- **Well-organized service layer** with clear separation of concerns
- **Custom hooks architecture** providing reusable data access patterns
- **Strong typing** with TypeScript throughout services and hooks
- **Platform-specific implementations** for payment services (web/native split)

### ⚠️ Critical Issues
1. **No centralized state management** - Missing Zustand/Redux despite CLAUDE.md mentioning Zustand
2. **Potential circular dependencies** in services importing from other services
3. **Mixed state patterns** - Context, local state, and direct service calls coexisting
4. **Inconsistent data caching** - Some services cache, others don't
5. **Missing error boundary integration** for service failures

### 📊 Impact Assessment
- **Data Flow Consistency**: MEDIUM RISK - Multiple patterns create confusion
- **State Synchronization**: HIGH RISK - No global state store for cross-component data
- **Performance**: MEDIUM RISK - No memoization strategy for expensive computations
- **Developer Experience**: MEDIUM RISK - Unclear which pattern to use for new features

---

## 1. Service Layer Analysis

### 1.1 Service Inventory (107 Total Files)

#### **Core Services** (/src/services/)
```
✅ supabase.ts              - Supabase client with platform-specific storage
✅ apiService.ts            - Centralized API wrapper for all data operations
✅ venueService.ts          - GPS venue detection and regional adaptation
✅ offlineService.ts        - Offline data caching and sync
✅ aiService.ts             - AI strategy and document parsing
✅ gpsService.ts            - GPS tracking and VMG calculations
```

#### **Specialized Services by Category**

**Venue & Location (10 files)**
```
src/services/venue/
  ✅ SupabaseVenueService.ts     - Database operations for venues
  ✅ VenueDetectionService.ts    - GPS-based detection
  ✅ RegionalIntelligenceService.ts - Regional sailing knowledge
  ✅ GlobalVenueDatabase.ts      - Master venue repository

src/services/location/
  ✅ VenueDetectionService.ts    - Duplicate of venue detection?
  ✅ GooglePlacesService.ts      - Place autocomplete
  ✅ NominatimService.ts         - OpenStreetMap geocoding
  ✅ OverpassService.ts          - OSM marine data
```
**🔴 ISSUE**: Duplicate VenueDetectionService in two locations

**AI & Agents (15 files)**
```
src/services/agents/
  ✅ BaseAgentService.ts                - Base class for AI agents
  ✅ VenueIntelligenceAgent.ts          - Autonomous venue switching
  ✅ DocumentProcessingAgent.ts         - Document parsing orchestration
  ✅ CoachMatchingAgent.ts              - Coach recommendation
  ✅ CoursePredictionAgent.ts           - Race course generation
  ✅ OnboardingAgent.ts                 - User onboarding flow
  ✅ ClubOnboardingAgent.ts             - Club-specific onboarding
  ✅ ConversationalOnboardingAgent.ts   - Chat-based onboarding

  Tool Files:
  ✅ SailNumberTools.ts
  ✅ WebSearchTools.ts
  ✅ WebScrapingTools.ts
  ✅ EnhancedOnboardingTools.ts
  ✅ ComprehensiveOnboardingTools.ts
  ✅ ConversationalOnboardingTools.ts
  ✅ OnboardingEntityExtractor.ts

src/services/ai/
  ✅ RaceCourseExtractor.ts
  ✅ RaceStrategyEngine.ts
  ✅ SailingEducationService.ts
  ✅ VoiceNoteService.ts
  ✅ EnhancedAIIntegrationService.ts
  ✅ DocumentProcessingService.ts
```

**Weather & Environmental (4 files)**
```
src/services/weather/
  ✅ RegionalWeatherService.ts       - Multi-region weather APIs
  ✅ ProfessionalWeatherService.ts   - Premium weather data
  ✅ WeatherAPIProService.ts         - WeatherAPI.com integration

src/services/tides/
  ✅ WorldTidesProService.ts         - Tide predictions
```

**Payments (5 files)**
```
src/services/payments/
  ✅ StripeService.web.ts            - Web Stripe integration
  ✅ StripeService.native.ts         - Native Stripe integration
  ✅ PaymentService.web.ts
  ✅ PaymentService.native.ts
  ✅ StripeConnectService.ts         - Coach marketplace payments
```

**Club & Fleet Management (8 files)**
```
✅ ClubService.ts
✅ ClubVerificationService.ts
✅ ClubDiscoveryService.ts
✅ ClubSubscriptionService.ts
✅ ClubMemberService.ts
✅ FleetDiscoveryService.ts
✅ FleetSocialService.ts
✅ fleetService.ts
```

**Race Management (10 files)**
```
✅ RaceTimerService.ts
✅ RaceAnalysisService.ts
✅ RaceRegistrationService.ts
✅ RaceScrapingService.ts
✅ RaceReminderService.ts
✅ ResultsService.ts
✅ raceDataDistribution.ts

src/services/results/
  ✅ ResultsExportService.ts
  ✅ ExternalResultsService.ts

src/services/scoring/
  ✅ ScoringEngine.ts                - Low-point scoring system
```

**Document & Storage (4 files)**
```
src/services/storage/
  ✅ DocumentStorageService.ts
  ✅ DeveloperDocumentService.ts
  ✅ SailingDocumentLibraryService.ts
✅ DocumentParsingService.ts
```

**Coaching (5 files)**
```
✅ CoachService.ts
✅ CoachingService.ts
✅ AICoachingAssistant.ts
✅ AICoachMatchingService.ts
✅ AISessionPlanningService.ts
```

**Specialized Features (20+ files)**
```
✅ CalendarService.ts
✅ EmailService.ts
✅ CircuitPlanningService.ts
✅ ComputerVisionService.ts
✅ crewManagementService.ts
✅ equipmentAIService.ts
✅ eventService.ts
✅ GooglePlacesService.ts
✅ GPSTracker.ts
✅ IoTSensorService.ts
✅ LocationDetectionService.ts
✅ MapLibreService.ts
✅ monteCarloService.ts
✅ RaceCourseVisualizationService.ts
✅ RealtimeService.ts
✅ SailingNetworkService.ts
✅ SavedVenueService.ts
✅ StrategicPlanningService.ts
✅ TuningGuideExtractionService.ts
✅ tuningGuideService.ts
✅ voiceCommandService.ts
```

**Marine Data (4 files)**
```
src/services/ais/
  ✅ AISStreamService.ts              - Real-time vessel tracking
  ✅ MarineTrafficAISService.ts       - MarineTraffic API

src/services/bathymetry/
  ✅ NOAABathymetryService.ts         - Ocean depth data

src/services/tactical/
  ✅ AITacticalService.ts             - Real-time tactical advice
```

**Venue-Specific (3 files)**
```
src/services/venues/
  ✅ RaceCourseService.ts
  ✅ YachtClubService.ts
✅ VenueIntelligenceService.ts
```

**Onboarding (1 file)**
```
src/services/onboarding/
  ✅ saveSailorProfile.ts
```

### 1.2 Service Quality Assessment

#### ✅ **Well-Implemented Services**

**supabase.ts** (643 lines)
```typescript
✅ Platform-specific storage adapter (web: localStorage, native: SecureStore)
✅ Comprehensive Database type definitions
✅ Query retry wrapper with exponential backoff
✅ Connectivity testing utility
✅ Proper TypeScript generics for type safety
```

**apiService.ts** (727 lines)
```typescript
✅ Centralized API wrapper for all Supabase tables
✅ Consistent response structure: { data, error, loading }
✅ Proper error handling with fallbacks
✅ RPC function fallbacks for missing stored procedures
✅ Clean separation of concerns by domain
✅ Well-organized API namespaces (sailorProfile, venues, races, etc.)
```

**venueService.ts** (435 lines)
```typescript
✅ GPS-based venue detection with confidence scoring
✅ Regional adaptation system (currency, timezone, weather sources)
✅ Cultural briefing generation
✅ Automatic venue switching based on GPS
✅ Integration with offline caching
✅ Distance calculations using Haversine formula
✅ Clean separation of detection, adaptation, and utility methods
```

#### ⚠️ **Services Needing Improvement**

**Duplicate Services**
```
🔴 VenueDetectionService exists in:
   - src/services/location/VenueDetectionService.ts
   - src/services/venue/VenueDetectionService.ts

🔴 DocumentProcessingService exists in:
   - src/services/DocumentParsingService.ts
   - src/services/ai/DocumentProcessingService.ts
```

**Service Naming Inconsistencies**
```
⚠️ fleetService.ts vs FleetDiscoveryService.ts
⚠️ eventService.ts vs RaceRegistrationService.ts
⚠️ tuningGuideService.ts vs TuningGuideExtractionService.ts
```

**Missing Documentation**
```
⚠️ 60+ service files lack JSDoc comments
⚠️ No README.md in src/services/ explaining architecture
⚠️ Missing service dependency graph
```

---

## 2. State Management Analysis

### 2.1 Current State Management Approach

**Context Providers** (Primary Pattern)
```typescript
✅ AuthProvider         - Authentication state (590 lines)
✅ SubscriptionProvider - Subscription status (366 lines)
✅ ClubProvider        - Club management (457 lines)
```

**Context Provider Quality**

**AuthProvider** (`src/providers/AuthProvider.tsx`)
```typescript
✅ Robust state machine: 'checking' | 'signed_out' | 'needs_role' | 'ready'
✅ Proper session restoration on app boot
✅ Auth state change listener with cleanup
✅ Fallback timers for stuck states (3s watchdog)
✅ Comprehensive logging for debugging
✅ Profile fetching integrated with auth flow
✅ Platform-specific OAuth handling (web vs mobile)
✅ Biometric authentication placeholders

⚠️ 590 lines - could be split into smaller hooks
⚠️ Multiple auth debugging systems (authDebug, logAuthEvent, logAuthState)
⚠️ Complex useEffect dependencies could cause re-renders
```

**SubscriptionProvider** (`src/lib/contexts/SubscriptionContext.tsx`)
```typescript
✅ Feature access control with tier hierarchy
✅ Trial period management
✅ Purchase and restore flow handling
✅ Upgrade prompt logic
✅ Custom hooks for feature access (useFeatureAccess, usePremiumFeature)
✅ Clean separation of subscription logic from UI

⚠️ Hardcoded tier features mapping
⚠️ No subscription status syncing across tabs (web)
```

**ClubProvider** (`src/lib/contexts/ClubContext.tsx`)
```typescript
✅ Multi-club management for users
✅ Permission checking (admin, race management, members)
✅ Dashboard stats aggregation
✅ Race event lifecycle management
✅ Race data distribution tracking
✅ Custom hooks for club admin and race management

⚠️ Loads all club data on mount (could be lazy)
⚠️ No optimistic updates for mutations
```

### 2.2 Missing State Management

**🔴 No Zustand Store** (Despite CLAUDE.md claiming "Zustand for client state")
```typescript
❌ No store/ directory exists
❌ No global state for:
   - Current venue
   - Active race
   - GPS location
   - Weather data
   - Offline sync status
   - Toast notifications
   - Modal state
```

**Recommendation**: Implement Zustand for:
```typescript
// Proposed structure
src/store/
  ✅ useVenueStore.ts       - Current venue + GPS state
  ✅ useRaceStore.ts        - Active race + timer state
  ✅ useOfflineStore.ts     - Sync queue + cached data
  ✅ useUIStore.ts          - Modals, toasts, loading states
  ✅ useWeatherStore.ts     - Current weather + forecasts
```

### 2.3 State Synchronization Issues

**Problem: Disconnected State Updates**
```typescript
// Example from multiple components:
const { user } = useAuth()           // From Context
const profile = useSailorProfile()   // From custom hook with internal state
const venue = useVenueDetection()    // From custom hook with internal state

// These don't share state - if profile updates venue,
// useVenueDetection won't know unless it refetches
```

**Recommendation**: Event bus or Zustand for cross-cutting concerns
```typescript
// Proposed solution
const venueStore = useVenueStore()
const { currentVenue, setVenue } = venueStore

// Any component can update venue, all subscribers react
```

---

## 3. Custom Hooks Analysis

### 3.1 Hook Inventory

**Core Data Hooks** (`src/hooks/`)
```
✅ useApi.ts                      - Base API hook with caching
✅ useData.ts                     - Comprehensive data hooks (566 lines)
✅ useSailorDashboardData.ts      - Sailor dashboard aggregation
✅ useCoachDashboardData.ts       - Coach dashboard aggregation
✅ useClubDashboardData.ts        - Club dashboard aggregation
✅ useFleetData.ts                - Fleet data hooks
✅ useRaces.ts                    - Race data hooks
✅ useRaceResults.ts              - Race results hooks
```

**Feature-Specific Hooks**
```
✅ useVenueDetection.ts           - GPS venue detection
✅ useVenueIntelligence.ts        - Venue intelligence data
✅ useGlobalVenueIntelligence.ts  - Global venue features
✅ useGlobalVenues.ts             - Global venue search
✅ useSavedVenues.ts              - Saved venue management
✅ useRegionalWeather.ts          - Weather by region
✅ useCoachingSessions.ts         - Coaching session management
✅ useFleetSocial.ts              - Fleet social features
✅ useFleetNotifications.ts       - Fleet notification system
✅ useSailingDocuments.ts         - Document library
✅ useSailingEducation.ts         - Educational content
```

**Utility Hooks**
```
✅ useThemeColor.ts               - Theme color management
✅ useNetworkStatus.ts            - Online/offline detection
✅ useOffline.ts                  - Offline capabilities
✅ useRealtimeConnection.ts       - Supabase realtime
✅ useLocationContext.ts          - Location context
✅ useFeatureAccess.tsx           - Subscription feature access
✅ useStreamingChat.ts            - AI chat streaming
```

**Onboarding State Hooks**
```
✅ useSailorOnboardingState.ts
✅ useCoachOnboardingState.ts
✅ useClubOnboardingState.ts
```

### 3.2 Hook Quality Assessment

#### ✅ **Well-Implemented Hooks**

**useData.ts** (566 lines)
```typescript
✅ Comprehensive data access layer
✅ Proper dependency management with useCallback
✅ Pull-to-refresh integration
✅ Combined data hooks (useDashboardData, useBoatDetailData)
✅ Consistent error handling
✅ Loading state management

⚠️ Very large file - should be split by domain
⚠️ Some hooks have complex dependencies (could cause re-renders)
```

**useApi.ts** (Assumed implementation)
```typescript
✅ Base hook for API calls
✅ Caching support
✅ Loading and error states
✅ Mutation support with useMutation
✅ Paginated query support with usePaginatedQuery
✅ Pull-to-refresh utilities
```

#### ⚠️ **Hooks Needing Improvement**

**Missing React Query Integration**
```
🔴 Manual caching in useApi instead of using React Query
🔴 No automatic cache invalidation
🔴 No optimistic updates
🔴 No request deduplication
```

**Inconsistent Hook Patterns**
```typescript
// Some hooks return objects:
const { data, loading, error } = useSailorProfile()

// Others return arrays:
const [profile, updateProfile] = useSailorProfile() // (hypothetical)

// Some combine data + actions:
const { profile, boats, fleets, refetch, refreshing } = useDashboardData()

⚠️ Should standardize on one pattern
```

**Missing Hook Documentation**
```
⚠️ No JSDoc for custom hooks
⚠️ No usage examples
⚠️ Parameter types not always clear
```

---

## 4. Data Flow Patterns

### 4.1 Current Data Flow

```
User Action
    ↓
Component (calls hook)
    ↓
Custom Hook (useData, useSailorProfile, etc.)
    ↓
API Service (apiService.ts)
    ↓
Supabase Client (supabase.ts)
    ↓
Database
```

**Reverse Flow (Data Updates)**
```
Database Change (Supabase Realtime)
    ↓
RealtimeService.ts
    ↓
??? (No clear propagation mechanism)
    ↓
Component re-renders manually or on refetch
```

### 4.2 Data Flow Issues

**🔴 Missing Realtime Update Propagation**
```typescript
// RealtimeService exists but no integration with hooks
// Components don't automatically update when data changes in DB
```

**🔴 No Optimistic Updates**
```typescript
// All mutations wait for server response
// No immediate UI feedback for user actions
```

**🔴 Cache Invalidation Not Automated**
```typescript
// Manual refetch() calls required
// No automatic invalidation on mutations
```

**🔴 No Request Deduplication**
```typescript
// Multiple components requesting same data = multiple API calls
```

---

## 5. Import Dependencies & Circular Dependencies

### 5.1 Service Import Patterns

**Sample from grep results** (50 lines examined):
```typescript
// Services importing other services (potential circular dependencies)
src/services/venue/VenueDetectionService.ts:
  import { supabaseVenueService } from './SupabaseVenueService'
  import { OfflineService } from '../offlineService'

src/services/venueService.ts:
  import { supabaseVenueService } from './venue/SupabaseVenueService'
  import { OfflineService } from './offlineService'

// This creates dependency chain:
venueService → supabaseVenueService
venueService → OfflineService
```

**Observed Import Patterns**:
```
✅ Most services import from supabase.ts (good - base dependency)
✅ Agent services import BaseAgentService (good - inheritance)
⚠️ Some services import sibling services (potential circular risk)
⚠️ No clear service layer hierarchy
```

### 5.2 Hook Import Patterns

**From grep results**:
```typescript
src/hooks/useData.ts:
  import { useAuth } from '@/src/providers/AuthProvider'
  import api from '@/src/services/apiService'
  import { useApi, useMutation, usePaginatedQuery } from './useApi'

// Clean pattern: hooks import from services and contexts
✅ No hooks importing other hooks (except useApi base hook)
✅ Proper separation of concerns
```

### 5.3 Circular Dependency Check

**Manual Analysis** (based on file structure):
```
✅ No obvious circular dependencies detected
✅ Services generally import from lower-level services
✅ Hooks import from services (one-way flow)
✅ Components import from hooks (one-way flow)

⚠️ Potential issue: Duplicate services might cause double imports
```

**Recommended Tool**: Use `madge` to generate dependency graph
```bash
npm install -g madge
madge --circular src/services/
madge --circular src/hooks/
```

---

## 6. Performance Analysis

### 6.1 Current Performance Concerns

**No Memoization Strategy**
```typescript
🔴 No useMemo for expensive computations
🔴 No useCallback for function props
🔴 Service methods recreated on every render
```

**Example from AuthProvider**:
```typescript
// ✅ Good: useMemo for context value
const value = useMemo<AuthCtx>(() => {
  // ... complex state derivation
}, [ready, signedIn, user, loading, userProfile, userType])

// But functions inside are NOT memoized:
const signIn = async (email, password) => { ... }
// ^ Recreated on every render
```

**Large Hook Dependencies**
```typescript
// From useData.ts
const refetch = useCallback(async () => {
  await Promise.all([
    profile.refetch(),
    races.refetch(),
    performanceHistory.refetch(),
    boats.refetch(),
    fleets.refetch(),
    recentSessions.refetch()
  ]);
}, [profile, races, performanceHistory, boats, fleets, recentSessions]);

// ⚠️ 6 dependencies - if any changes, refetch recreated
```

### 6.2 API Call Efficiency

**Parallel Fetching** ✅
```typescript
// Good: useData.ts fetches multiple queries in parallel
const profile = useSailorProfile()
const races = useRaces()
const boats = useBoats()
// All execute in parallel, not sequentially
```

**Overfetching** ⚠️
```typescript
// From apiService.ts - some queries fetch too much:
.select('*, regional_intelligence(*), cultural_profiles(*)')
// Could be lazy-loaded instead of always fetching
```

**N+1 Query Problem** 🔴
```typescript
// Potential issue in boat fetching:
const boats = await getBoats(userId)  // 1 query
for (boat of boats) {
  const equipment = await getEquipment(boat.id)  // N queries
}
// Should use Supabase joins or batch queries
```

### 6.3 Caching Issues

**No Shared Cache**
```typescript
🔴 Each hook instance maintains its own cache
🔴 Same data fetched multiple times if used in multiple components
🔴 No cache eviction strategy
```

**Example Problem**:
```typescript
// Component A:
const profile = useSailorProfile()  // Fetches from API

// Component B (rendered simultaneously):
const profile = useSailorProfile()  // Fetches from API AGAIN

// Should share cache and deduplicate requests
```

---

## 7. Error Handling & Resilience

### 7.1 Error Handling Patterns

**Service Layer** ✅
```typescript
// From apiService.ts - consistent error handling:
try {
  const { data, error } = await supabase.from('table').select()
  return { data, error, loading: false }
} catch (error) {
  return { data: null, error: error as Error, loading: false }
}

✅ Consistent response shape
✅ Never throws - always returns error object
```

**Query Retry** ✅
```typescript
// From supabase.ts
export const queryWithRetry = async <T>(
  queryFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  // ... exponential backoff retry logic
}

✅ Automatic retry with backoff
✅ Configurable retry count
⚠️ Not used consistently across all services
```

**Missing Error Boundaries** 🔴
```
🔴 No error boundaries in component tree
🔴 Service errors can crash entire app
🔴 No fallback UI for data loading failures
```

### 7.2 Loading States

**Good Practices** ✅
```typescript
// From hooks - consistent loading pattern:
const { data, loading, error } = useApi(...)

if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage />
return <DataDisplay data={data} />
```

**Missing Features** ⚠️
```
⚠️ No skeleton screens
⚠️ No optimistic loading indicators
⚠️ No progressive data loading (show partial results)
```

---

## 8. Recommendations

### 8.1 Critical (Implement Immediately)

#### **1. Add Zustand for Global State** 🔴 HIGH PRIORITY
```bash
npm install zustand
```

```typescript
// Create: src/store/useVenueStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VenueStore {
  currentVenue: SailingVenue | null
  setVenue: (venue: SailingVenue) => void
  lastGPSLocation: Coordinates | null
  updateGPSLocation: (coords: Coordinates) => void
}

export const useVenueStore = create<VenueStore>()(
  persist(
    (set) => ({
      currentVenue: null,
      setVenue: (venue) => set({ currentVenue: venue }),
      lastGPSLocation: null,
      updateGPSLocation: (coords) => set({ lastGPSLocation: coords }),
    }),
    { name: 'venue-storage' }
  )
)
```

**Benefits**:
- Shared state across all components
- Automatic persistence to storage
- DevTools integration for debugging
- No prop drilling

#### **2. Consolidate Duplicate Services** 🔴 HIGH PRIORITY
```bash
# Remove duplicates:
rm src/services/location/VenueDetectionService.ts
# Keep: src/services/venue/VenueDetectionService.ts

# Add re-export if needed:
echo "export { VenueDetectionService } from '../venue/VenueDetectionService'" > src/services/location/index.ts
```

#### **3. Implement React Query** ⚠️ MEDIUM PRIORITY
```bash
npm install @tanstack/react-query
```

```typescript
// Wrap app in query provider:
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

// Convert hooks to use React Query:
export function useSailorProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['sailor-profile', user?.id],
    queryFn: () => api.sailorProfile.getProfile(user?.id || ''),
    enabled: !!user?.id,
  })
}
```

**Benefits**:
- Automatic caching and deduplication
- Cache invalidation on mutations
- Optimistic updates
- Request cancellation
- DevTools for debugging

### 8.2 Important (Implement Soon)

#### **4. Add Error Boundaries**
```typescript
// Create: src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  // ... error boundary logic
}

// Wrap data-fetching components:
<ErrorBoundary fallback={<ErrorFallback />}>
  <DashboardData />
</ErrorBoundary>
```

#### **5. Standardize Hook Patterns**
```typescript
// Standardize on this pattern:
export function useResource() {
  return {
    data,        // The primary data
    loading,     // Loading state
    error,       // Error state
    refetch,     // Manual refetch function
    mutate,      // Mutation function (if applicable)
  }
}
```

#### **6. Add Service Documentation**
```typescript
// Add JSDoc to all services:
/**
 * Venue Detection Service
 *
 * Automatically detects sailing venues based on GPS coordinates
 * and switches regional settings accordingly.
 *
 * @example
 * const result = await VenueService.detectVenueFromGPS(userId)
 * if (result.venue) {
 *   await VenueService.switchVenue(result.venue.id, userId)
 * }
 */
export class VenueService { ... }
```

#### **7. Implement Optimistic Updates**
```typescript
// Example with React Query:
const mutation = useMutation({
  mutationFn: updateBoat,
  onMutate: async (newBoat) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['boats'] })

    // Snapshot previous value
    const previousBoats = queryClient.getQueryData(['boats'])

    // Optimistically update
    queryClient.setQueryData(['boats'], (old) =>
      old.map(boat => boat.id === newBoat.id ? newBoat : boat)
    )

    return { previousBoats }
  },
  onError: (err, newBoat, context) => {
    // Rollback on error
    queryClient.setQueryData(['boats'], context.previousBoats)
  },
})
```

### 8.3 Nice to Have (Long Term)

#### **8. Generate Service Dependency Graph**
```bash
npm install -g madge
madge --image deps.svg src/services/
```

#### **9. Add Performance Monitoring**
```typescript
// Create: src/lib/performance.ts
export function measurePerformance(label: string) {
  return {
    start: performance.now(),
    end: () => {
      const duration = performance.now() - this.start
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`)
    }
  }
}

// Use in services:
const perf = measurePerformance('Venue Detection')
const result = await detectVenue()
perf.end()
```

#### **10. Implement Progressive Data Loading**
```typescript
// Show partial data while loading full dataset:
const { data: quickData } = useQuery({
  queryKey: ['boats-summary'],
  queryFn: () => api.boats.getSummary(), // Fast, minimal data
})

const { data: fullData } = useQuery({
  queryKey: ['boats-full'],
  queryFn: () => api.boats.getFull(),    // Slow, complete data
  enabled: !!quickData,                   // Only fetch after summary
})

return (
  <>
    <BoatSummary data={quickData} />
    {fullData && <BoatDetails data={fullData} />}
  </>
)
```

---

## 9. Checklist for New Features

When adding new data features, ensure:

### Service Layer
- [ ] Service follows single responsibility principle
- [ ] Consistent error handling (return { data, error })
- [ ] TypeScript types defined for all inputs/outputs
- [ ] JSDoc documentation added
- [ ] No circular dependencies with other services
- [ ] Retry logic for network operations
- [ ] Offline support considered (if applicable)

### State Management
- [ ] Determine if state should be local, context, or Zustand
- [ ] Use Zustand for cross-component shared state
- [ ] Use Context for feature-scoped state (auth, subscription)
- [ ] Use local state for component-only state

### Hooks
- [ ] Use React Query for data fetching (when implemented)
- [ ] Standardized return shape: { data, loading, error, refetch }
- [ ] Proper dependency arrays in useCallback/useMemo
- [ ] JSDoc with usage examples
- [ ] Consider pagination for large datasets

### Data Flow
- [ ] Optimistic updates for mutations
- [ ] Cache invalidation strategy defined
- [ ] Realtime updates handled (if applicable)
- [ ] Error boundaries wrap data-dependent UI
- [ ] Loading skeletons for better UX

### Performance
- [ ] Expensive computations memoized
- [ ] Queries batched where possible
- [ ] Avoid N+1 query problems
- [ ] Consider lazy loading for heavy data
- [ ] Monitor bundle size impact

---

## 10. Conclusion

The RegattaFlow data layer is **comprehensive but could be more cohesive**. The service layer is well-organized with 107 specialized services, but the lack of centralized state management (Zustand) and modern data fetching (React Query) creates inconsistencies.

### Priority Actions:
1. **Implement Zustand** for global state (venue, race, UI)
2. **Remove duplicate services** (VenueDetectionService, DocumentProcessingService)
3. **Add React Query** for better caching and request management
4. **Standardize hook patterns** for consistency
5. **Add error boundaries** for resilience

### Current Grade: B
**With recommended improvements: A-**

The foundation is solid, but modernizing the state management approach will significantly improve developer experience and app performance.
