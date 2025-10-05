# RegattaFlow Codebase Audit - Detailed Fix Report

**Date:** October 4, 2025
**Purpose:** Actionable report for generating fix instructions
**Scope:** Complete codebase analysis with specific file paths, line numbers, and implementation gaps

---

## EXECUTIVE SUMMARY

RegattaFlow has a **strong technical foundation** with sophisticated AI agent integration, but requires focused work in three critical areas:

1. **Payment Integration** - Stripe incomplete across sailor registration and coach marketplace
2. **Coach Experience** - Corrupted critical file + incomplete Stripe Connect blocking entire workflow
3. **Database Write Operations** - Several read-only implementations need write functionality

**Current Completion:**
- Sailor: 65% (strong AI features, missing payments)
- Coach: 30% (critical blocker + payment integration)
- Club: 25% (UI exists, backend unclear)

**Estimated Time to MVP:** 8-10 weeks with focused development

---

## SECTION 1: CRITICAL BLOCKERS (FIX IMMEDIATELY)

### BLOCKER 1: Corrupted Coach Onboarding File 🔴 CRITICAL

**File:** `/src/app/(auth)/coach-onboarding-expertise.tsx.corrupted`

**Impact:** Blocks entire coach onboarding workflow

**Context:**
- Backup file exists: `/src/app/(auth)/coach-onboarding-expertise.tsx.bak`
- This is screen 2 of 5 in coach onboarding flow
- Other onboarding screens exist:
  - `coach-onboarding-welcome.tsx` (has TODOs)
  - `coach-onboarding-pricing.tsx` (has TODOs)
  - `coach-onboarding-availability.tsx` (exists)
  - `coach-onboarding-profile-preview.tsx` (exists)
  - `coach-onboarding-stripe-callback.tsx` (exists)

**Required Action:**
1. Restore `.corrupted` file from `.bak` version
2. Test file compiles and renders
3. Complete any TODO markers in the file
4. Ensure form submission saves to `coach_profiles` table

**Related Services:**
- `/src/services/CoachService.ts` (modified, has implementation)
- Expected database tables: `coach_profiles`, `coach_services`, `coach_expertise`

**Success Criteria:**
- File renders without errors
- Form submits successfully
- Data persists to database
- User proceeds to next onboarding step (pricing)

---

### BLOCKER 2: Stripe Payment Integration Incomplete ⚠️ CRITICAL PATH

**Impact:** Blocks race registration, coach payments, and all revenue

**Areas Affected:**

#### A. Race Registration Payments

**Files:**
- `/src/components/registration/PaymentFlowComponent.tsx` (has TODOs)
- `/src/app/(tabs)/race/register/[id].tsx` (exists)
- `/src/components/registration/RaceRegistrationForm.tsx` (has TODOs)

**Missing Implementation:**
1. `@stripe/stripe-react-native` PaymentSheet integration
2. Payment intent creation
3. Payment confirmation handling
4. Database write to `event_registrations` or `race_entries` table
5. Email confirmation trigger

**Current State:**
- UI exists with registration forms
- PaymentFlowComponent wrapper exists but incomplete
- No evidence of actual PaymentSheet implementation
- No database insert found for completed registrations

**Required Tables:**
- `event_registrations` (not found in data hooks)
- `payment_intents` (not found in data hooks)
- Need migration or verify existing schema

**Expected Flow:**
```
User clicks "Register" →
Form submission →
Create payment intent (backend) →
Show PaymentSheet →
Confirm payment →
Insert to event_registrations →
Send confirmation email →
Redirect to registration confirmation
```

#### B. Coach Marketplace Payments

**Files:**
- `/src/services/StripeConnectService.ts` (modified, has TODOs)
- `/src/services/payments/StripeService.web.ts` (has TODOs)
- `/src/services/payments/StripeService.native.ts` (has TODOs)

**Missing Implementation:**
1. Stripe Connect account creation for coaches
2. Onboarding link generation
3. OAuth callback handling in `coach-onboarding-stripe-callback.tsx`
4. Platform fee configuration (15% commission mentioned in docs)
5. Payout management

**Current State:**
- Service files exist with structure
- TODO markers indicate incomplete implementation
- No evidence of actual Stripe Connect API calls
- Callback screen exists but implementation unclear

**Required Database Fields:**
- Check migration: `20251004_stripe_connect_fields.sql` exists
- Expected fields: `stripe_account_id`, `stripe_onboarding_complete`, `stripe_charges_enabled`

#### C. Sailor Subscriptions

**Files:**
- No subscription management UI found
- `/src/services/PaymentService.ts` (has TODO: "Implement actual payment processing")

**Missing Implementation:**
1. Subscription product/price creation (Stripe)
2. Subscription checkout flow
3. Webhook handlers for subscription events
4. Database table for subscriptions
5. Feature gating based on subscription tier

**Required Pricing (from docs):**
- Free Tier: Basic features
- Sailor Pro: $29/month
- Championship: $49/month

**Expected Tables:**
- `subscriptions` (not found in data hooks)
- `subscription_tiers` (not found in data hooks)

#### D. Stripe Configuration

**Environment Variables:**
- `STRIPE_SECRET_KEY` (backend/Edge Functions)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (frontend)

**Action Required:**
1. Verify environment variables are set in `.env`
2. Check if Stripe is initialized in `/src/providers/StripeProvider.tsx`
3. Add webhook endpoint configuration
4. Set up webhook secret for verification

**Webhook Events Needed:**
- `payment_intent.succeeded`
- `payment_intent.failed`
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `account.updated` (Stripe Connect)

---

### BLOCKER 3: GPS Race Tracking - Missing Write Operations ⚠️

**Impact:** Users can view past sessions but cannot create new GPS-tracked races

**Files:**
- `/src/app/(tabs)/race/timer.tsx` (has TODOs)
- `/src/app/race-timer-pro.tsx` (exists)
- `/src/app/race/timer/[id].tsx` (has TODOs)
- `/src/services/RaceTimerService.ts` (modified)

**Current State - READ OPERATIONS WORK:**

From `/src/hooks/useData.ts`:
```typescript
// Lines 398-419: Reading race timer sessions works
export function useRaceTimerSession(sessionId: string) {
  return useQuery(['race-timer-session', sessionId], async () => {
    const { data, error } = await supabase
      .from('race_timer_sessions')
      .select(`
        *,
        races (
          id, name, race_date, course_config
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  });
}
```

**Missing - WRITE OPERATIONS:**

No evidence found of:
1. GPS coordinate tracking with `expo-location`
2. Insert to `race_timer_sessions` with GPS data
3. Real-time coordinate updates during race
4. Session completion and persistence

**Required Implementation:**

```typescript
// Expected flow (not found in code):
1. User starts race timer
2. Request GPS permissions (expo-location)
3. Start GPS tracking interval (e.g., every 5 seconds)
4. Create race_timer_sessions record with initial data
5. Continuously append GPS coordinates to session
6. Store tactical events (mark roundings, tacks, etc.)
7. End session and persist final data
8. Trigger RaceAnalysisAgent for post-race analysis
```

**Database Table:** `race_timer_sessions`
- Migration: `20251002_race_tracking_schema.sql` exists
- Expected fields: `id`, `user_id`, `race_id`, `started_at`, `ended_at`, `gps_track` (JSON/JSONB), `tactical_events`

**Dependencies:**
- `expo-location` package (verify installed)
- GPS permissions in `app.json` (verify configured)
- Background location tracking for iOS (verify entitlements)

---

## SECTION 2: HIGH-PRIORITY INCOMPLETE FEATURES

### PRIORITY 1: Unused AI Agents (High Value, Already Built)

**Context:** Three AI agents are fully implemented but not integrated into UI, losing competitive advantage

#### A. RaceAnalysisAgent - Backend-Only

**File:** `/src/services/agents/RaceAnalysisAgent.ts` (exists)

**Current Integration:**
- Hook exists: `/src/hooks/useData.ts` lines 365-372
```typescript
export function useTriggerRaceAnalysis() {
  return useMutation(async (timerSessionId: string) => {
    const { RaceAnalysisService } = await import('@/src/services/RaceAnalysisService');
    return RaceAnalysisService.analyzeRaceSession(timerSessionId);
  });
}
```

**Database:**
- Table: `ai_coach_analysis` (lines 352-362 in useData.ts)
- Read operations work, write via RaceAnalysisService

**Missing UI Integration:**

From `/src/app/(tabs)/dashboard.tsx`:
- Lines 443-452: AICoachCard displays analysis from `recentTimerSessions`
- BUT: No trigger button or automatic analysis after race completion

**Required Action:**
1. Add "Analyze Race" button to dashboard AICoachCard
2. Trigger `useTriggerRaceAnalysis()` on button click
3. Show loading state during analysis
4. Display results when complete
5. **Automatic trigger:** Run analysis when race timer session ends

**Expected User Flow:**
```
User finishes race →
GPS session saved →
Auto-trigger RaceAnalysisAgent →
Agent analyzes performance →
Save to ai_coach_analysis table →
Show notification "Race analysis complete" →
Display in AICoachCard on dashboard
```

#### B. CoachMatchingAgent - Unused

**File:** `/src/services/agents/CoachMatchingAgent.ts` (exists via grep)

**Current State:**
- Agent implemented with AI-powered matching logic
- NOT called from any UI screen
- No database table for match results

**Missing Integration:**

From `/src/app/coach/discover.tsx` (has TODOs):
- Should use CoachMatchingAgent to rank coaches
- Currently likely shows basic list without AI matching

**Required Action:**
1. Create database table: `coach_match_scores`
   - Fields: `user_id`, `coach_id`, `compatibility_score`, `skill_gap_analysis`, `match_reasoning`, `created_at`
2. Integrate agent into coach discovery screen
3. Call agent with user's performance data
4. Display match scores with reasoning
5. Sort coaches by compatibility

**Expected User Flow:**
```
User clicks "Find a Coach" →
CoachMatchingAgent analyzes user performance →
Identifies skill gaps →
Matches with coach expertise →
Generates compatibility scores →
Displays ranked list with explanations
```

#### C. VenueIntelligenceAgent - Results Not Persisted

**File:** `/src/services/agents/VenueIntelligenceAgent.ts` (exists)

**Current Integration:**

From `/src/app/(tabs)/dashboard.tsx` lines 123-141:
```typescript
const handleGetVenueInsights = async () => {
  setIsGettingInsights(true);
  try {
    if (!currentVenue?.id) return;

    const agent = new VenueIntelligenceAgent();
    const result = await agent.analyzeVenue(currentVenue.id);

    if (result.success) {
      setVenueInsights(result.insights); // ⚠️ TRANSIENT STATE ONLY
    }
  } catch (error) {
    console.error('Failed to get venue insights:', error);
  } finally {
    setIsGettingInsights(false);
  }
};
```

**Problem:**
- Insights stored in React state only
- Lost on page refresh or navigation
- No historical insights available

**Required Action:**
1. Create database table: `venue_intelligence_cache`
   - Fields: `venue_id`, `user_id`, `insights` (JSONB), `weather_data` (JSONB), `cultural_data` (JSONB), `cached_at`, `expires_at`
2. Modify agent call to save results after successful analysis
3. Load cached insights on dashboard mount
4. Implement cache expiration (e.g., 24 hours)
5. Show cached vs fresh insights indicator

**Expected User Flow:**
```
User arrives at venue →
VenueIntelligenceAgent runs →
Insights saved to database →
Displayed in dashboard card →
On refresh: Load from cache →
Show "Updated 2 hours ago" indicator
```

---

### PRIORITY 2: Coach Experience Completion

#### A. Coach Onboarding Flow - Incomplete

**Files:**
1. `/src/app/(auth)/coach-onboarding-welcome.tsx` (has TODOs)
2. `/src/app/(auth)/coach-onboarding-expertise.tsx.corrupted` ← **FIX FIRST**
3. `/src/app/(auth)/coach-onboarding-availability.tsx` (exists)
4. `/src/app/(auth)/coach-onboarding-pricing.tsx` (has TODOs)
5. `/src/app/(auth)/coach-onboarding-profile-preview.tsx` (exists)
6. `/src/app/(auth)/coach-onboarding-stripe-callback.tsx` (exists)

**Required Implementation for Each Screen:**

**Screen 1: Welcome**
- Collect basic coach info (name, bio, photo)
- Validate inputs
- Save to temporary state (multi-step form)
- Navigate to expertise screen

**Screen 2: Expertise** ← CORRUPTED
- Restore from backup
- Collect certifications, experience, boat classes
- Save to temporary state
- Navigate to availability screen

**Screen 3: Availability**
- Collect weekly availability schedule
- Time zone handling
- Save to temporary state
- Navigate to pricing screen

**Screen 4: Pricing**
- Set hourly rate for different session types
- Platform commission display (15%)
- Save to temporary state
- Navigate to profile preview

**Screen 5: Profile Preview**
- Show all collected data
- "Edit" buttons for each section
- "Complete Onboarding" button
- On submit: Save all data + initialize Stripe Connect

**Screen 6: Stripe Callback**
- Handle OAuth return from Stripe
- Verify account setup
- Update `stripe_onboarding_complete` flag
- Redirect to coach dashboard

**Database Operations on Completion:**

```typescript
// Required inserts:
1. Update users.user_type = 'coach'
2. Insert to coach_profiles (bio, certifications, hourly_rate)
3. Insert multiple to coach_availability (weekly schedule)
4. Insert multiple to coach_services (session types, prices)
5. Insert to coach_expertise (boat classes, skill levels)
6. Create Stripe Connect account
7. Save stripe_account_id to users table
```

**Services:**
- `/src/services/CoachService.ts` (modified, use for data operations)
- `/src/services/StripeConnectService.ts` (complete Stripe integration)

#### B. Coach Dashboard - Missing Functionality

**Expected Screens:**
- `/src/app/(tabs)/clients.tsx` - Client list with session history
- `/src/app/(tabs)/schedule.tsx` - Calendar of upcoming sessions
- `/src/app/(tabs)/earnings.tsx` - Payment history and analytics

**Current State:**
- Files exist (modified in git status)
- Integration with Supabase unclear
- Likely using mock data

**Required Tables:**
- `coaching_sessions` - Session bookings
- `coaching_session_notes` - Post-session notes
- `stripe_payouts` - Payment history
- `coach_reviews` - Client feedback

**Required Implementation:**

**Clients Screen:**
```typescript
// Load client list
SELECT DISTINCT
  users.id, users.full_name, users.avatar_url,
  COUNT(coaching_sessions.id) as total_sessions,
  MAX(coaching_sessions.scheduled_at) as last_session
FROM coaching_sessions
JOIN users ON users.id = coaching_sessions.sailor_id
WHERE coaching_sessions.coach_id = current_user_id
GROUP BY users.id

// Show client performance trends
// Link to session notes
```

**Schedule Screen:**
```typescript
// Load upcoming sessions
SELECT
  coaching_sessions.*,
  users.full_name as sailor_name,
  users.avatar_url
FROM coaching_sessions
JOIN users ON users.id = coaching_sessions.sailor_id
WHERE coaching_sessions.coach_id = current_user_id
  AND coaching_sessions.scheduled_at >= NOW()
ORDER BY coaching_sessions.scheduled_at ASC

// Calendar view with drag-and-drop rescheduling
// Booking request acceptance/rejection
```

**Earnings Screen:**
```typescript
// Load payment history
SELECT
  stripe_payouts.*,
  COUNT(coaching_sessions.id) as sessions_count,
  SUM(coaching_sessions.price) as total_revenue,
  SUM(coaching_sessions.price * 0.15) as platform_fee
FROM stripe_payouts
LEFT JOIN coaching_sessions ON coaching_sessions.payout_id = stripe_payouts.id
WHERE stripe_payouts.coach_id = current_user_id
GROUP BY stripe_payouts.id
ORDER BY stripe_payouts.created_at DESC

// Charts: Revenue over time, sessions per month
// Expected earnings (pending payouts)
```

---

### PRIORITY 3: Coach Session Booking Flow - Missing

**Impact:** Sailors can view coaches but cannot book sessions

**Current State:**
- `/src/app/coach/discover.tsx` - Coach listing (has TODOs)
- `/src/app/coach/book.tsx` - Booking form (has TODOs)
- `/src/services/CoachingService.ts` - Service layer (has TODOs)
- `/src/hooks/useCoachingSessions.ts` - Data hooks (has TODOs)

**Required Implementation:**

#### Step 1: Coach Discovery (Fix `/src/app/coach/discover.tsx`)

```typescript
// Current: Basic list
// Required: AI-powered matching

1. Load user's performance data
2. Call CoachMatchingAgent
3. Display coaches with compatibility scores
4. Filters: boat class, location, price range, availability
5. Coach profile preview with reviews
6. "Book Session" button → navigate to booking screen
```

#### Step 2: Session Booking (Fix `/src/app/coach/book.tsx`)

```typescript
// Required flow:
1. Select coach from discovery or direct link
2. Load coach availability from coach_availability table
3. Show calendar with available time slots
4. Select session type (hourly rate may vary)
5. Select date/time
6. Add optional notes/goals for session
7. Calculate price (base rate + platform fee)
8. Show Stripe PaymentSheet
9. On payment success: Insert to coaching_sessions table
10. Send confirmation email to coach and sailor
11. Redirect to session confirmation screen
```

**Database Schema:**

```sql
-- coaching_sessions table (from migration 20251004_coaching_system.sql)
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY,
  coach_id UUID REFERENCES users(id),
  sailor_id UUID REFERENCES users(id),
  scheduled_at TIMESTAMP,
  duration_minutes INTEGER,
  session_type TEXT, -- 'video', 'in_person', 'review'
  price DECIMAL,
  platform_fee DECIMAL,
  status TEXT, -- 'pending', 'confirmed', 'completed', 'cancelled'
  payment_intent_id TEXT,
  notes TEXT,
  coach_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Payment Flow:**
1. Create payment intent (backend/Edge Function)
2. Show PaymentSheet with amount
3. Confirm payment
4. Update session status to 'confirmed'
5. Release payout to coach after session completion

---

## SECTION 3: DATA LAYER COMPLETENESS

### Screens with REAL DATA (Already Working)

✅ `/src/app/(tabs)/dashboard.tsx`
- **Status:** REAL DATA
- **Tables:** `regattas`, `race_timer_sessions`, `sailor_boats`, `fleets`, `sailor_classes`, `class_group_members`
- **Evidence:** Lines 78-90 use `useSailorDashboardData()` hook

✅ `/src/app/(tabs)/races.tsx`
- **Status:** REAL DATA + AI AGENTS
- **Tables:** `ai_analyses` (write), `race_strategies` (write), `documents` (read), `regattas` (read)
- **Agents:** DocumentProcessingAgent (lines 148-161), CoursePredictionAgent (lines 237-258)
- **Evidence:** Full PDF upload → AI extraction → database save workflow

✅ `/src/app/(tabs)/calendar.tsx`
- **Status:** REAL DATA
- **Tables:** `regattas` (via useSailorDashboardData), `saved_venues` (via useSavedVenues)
- **Evidence:** Lines 123-124, distance calculation, venue filtering

✅ `/src/app/(tabs)/crew.tsx`
- **Status:** REAL DATA
- **Tables:** `crew_members` (via CrewManagement component)
- **Evidence:** Lines 98-108 pass real class IDs to component

✅ `/src/app/(tabs)/tuning-guides.tsx`
- **Status:** REAL DATA + AI
- **Tables:** `tuning_guides`, `fleet_tuning_guides`, `tuning_guide_views`
- **AI:** TuningGuideExtractionService (lines 72-92)
- **Evidence:** Lines 41-70 load from database

✅ `/src/app/(tabs)/boat/index.tsx`
- **Status:** REAL DATA
- **Tables:** `sailor_boats`
- **Service:** SailorBoatService (lines 36-48)
- **Evidence:** CRUD operations working

✅ `/src/app/(tabs)/fleet/index.tsx`
- **Status:** REAL DATA
- **Tables:** `fleets`, `fleet_members`
- **Evidence:** Modified file, uses useFleetData hook

---

### Screens with MOCK/PLACEHOLDER Data (Need Backend)

⚠️ `/src/app/(tabs)/clients.tsx` (Coach)
- **Status:** INSUFFICIENT DATA
- **Expected Tables:** `coaching_sessions`, `users` (join)
- **Action Required:** Read file, verify data source, implement if mock

⚠️ `/src/app/(tabs)/schedule.tsx` (Coach)
- **Status:** INSUFFICIENT DATA
- **Expected Tables:** `coaching_sessions`, `coach_availability`
- **Action Required:** Read file, implement calendar with real bookings

⚠️ `/src/app/(tabs)/earnings.tsx` (Coach)
- **Status:** MIXED DATA
- **Expected Tables:** `stripe_payouts`, `coaching_sessions`
- **Evidence:** File modified in git status
- **Action Required:** Complete Stripe payout integration

⚠️ `/src/app/(tabs)/events.tsx` (Club)
- **Status:** INSUFFICIENT DATA
- **Expected Tables:** `club_events`, `event_registrations`
- **Action Required:** Read file, verify backend integration

⚠️ `/src/app/(tabs)/members.tsx` (Club)
- **Status:** MIXED DATA
- **Expected Tables:** `club_members`, `club_roles`
- **Evidence:** File modified in git status
- **Action Required:** Complete member management CRUD

---

## SECTION 4: DATABASE SCHEMA VERIFICATION

### Tables with CONFIRMED READ/WRITE Operations

| Table | Read | Write | Files |
|-------|------|-------|-------|
| `users` | ✅ | ✅ | `/src/hooks/useData.ts` lines 59-89 |
| `sailing_venues` | ✅ | ❌ | `/src/hooks/useData.ts` lines 91-133 |
| `saved_venues` | ✅ | ✅ | `/src/hooks/useData.ts` lines 135-164 |
| `races` | ✅ | ✅ | `/src/hooks/useData.ts` lines 166-248 |
| `race_strategies` | ✅ | ✅ | `/src/hooks/useData.ts` lines 250-277 |
| `race_timer_sessions` | ✅ | ❌ | `/src/hooks/useData.ts` lines 398-419 |
| `ai_coach_analysis` | ✅ | ⚠️ | `/src/hooks/useData.ts` lines 352-372 (via service) |
| `sailor_boats` | ✅ | ✅ | `/src/hooks/useData.ts` lines 421-445 |
| `boat_equipment` | ✅ | ✅ | `/src/hooks/useData.ts` lines 447-497 |
| `fleets` | ✅ | ❌ | `/src/hooks/useData.ts` lines 539-563 |
| `fleet_members` | ✅ | ✅ | `/src/hooks/useData.ts` lines 565-591 |
| `yacht_clubs` | ✅ | ❌ | `/src/hooks/useData.ts` lines 593-606 |
| `club_members` | ✅ | ✅ | `/src/hooks/useData.ts` lines 608-626 |
| `regattas` | ✅ | ✅ | `/src/hooks/useData.ts` lines 628-676 |
| `ai_analyses` | ✅ | ✅ | `/src/app/(tabs)/races.tsx` lines 214-234 |
| `sailor_classes` | ✅ | ❌ | `/src/hooks/useSailorDashboardData.ts` lines 187-201 |
| `class_group_members` | ✅ | ❌ | `/src/hooks/useSailorDashboardData.ts` lines 207-224 |
| `documents` | ✅ | ❌ | `/src/hooks/useSailorDashboardData.ts` lines 277-286 |
| `regatta_results` | ✅ | ❌ | `/src/hooks/useSailorDashboardData.ts` lines 305-318 |
| `tuning_guides` | ✅ | ⚠️ | `/src/app/(tabs)/tuning-guides.tsx` via service |
| `crew_members` | ✅ | ⚠️ | `/src/app/(tabs)/crew.tsx` via component |

### Tables with READ-ONLY Operations (Need Write Implementation)

**Priority: HIGH** - These tables can be queried but users cannot create/update data

1. **`race_timer_sessions`**
   - **Current:** Can view past sessions
   - **Missing:** Cannot create new sessions with GPS tracking
   - **Action:** Implement GPS tracking write operations in race timer screens

2. **`sailing_venues`**
   - **Current:** Can browse venues
   - **Missing:** Cannot add custom venues (admin-only table)
   - **Action:** Decision needed - keep admin-only or allow user submissions?

3. **`fleets`**
   - **Current:** Can view and join fleets
   - **Missing:** Cannot create new fleets
   - **Action:** Add fleet creation flow for club admins

4. **`yacht_clubs`**
   - **Current:** Can browse and join clubs
   - **Missing:** Cannot create clubs
   - **Action:** Add club creation flow (part of club onboarding)

5. **`sailor_classes`**
   - **Current:** Can view enrolled classes
   - **Missing:** Cannot add new classes
   - **Action:** Add class enrollment form

6. **`documents`**
   - **Current:** Can view uploaded documents
   - **Missing:** Write operation unclear (may exist in DocumentProcessingAgent)
   - **Action:** Verify document upload saves to this table

7. **`regatta_results`**
   - **Current:** Can view results
   - **Missing:** Cannot create/update results
   - **Action:** Implement results entry for race committee

---

### Tables with NO CODE INTEGRATION (Schema Exists, Not Used)

**Priority: MEDIUM-HIGH** - Migrations exist but no application code uses these tables

From migration files in `supabase/migrations/`:

1. **`coaching_sessions`** (20251004_coaching_system.sql)
   - **Schema:** ✅ Exists
   - **Code:** ❌ No inserts found
   - **Action:** Implement in coach booking flow

2. **`coach_profiles`** (20251004_coaching_system.sql)
   - **Schema:** ✅ Exists
   - **Code:** ⚠️ Service exists (`CoachService.ts`) but no UI integration found
   - **Action:** Connect to coach onboarding screens

3. **`coach_availability`** (20251004_coaching_system.sql)
   - **Schema:** ✅ Exists
   - **Code:** ❌ No integration found
   - **Action:** Implement in coach onboarding (availability screen)

4. **`club_events`** (20251004_club_event_management.sql)
   - **Schema:** ✅ Exists
   - **Code:** ⚠️ UI exists (`/src/app/club/event/create.tsx`) but backend unclear
   - **Action:** Verify database integration, implement if missing

5. **`event_registrations`** (expected, not confirmed)
   - **Schema:** ⚠️ Not found in reviewed files
   - **Code:** ❌ No integration
   - **Action:** Verify migration exists, implement registration flow

6. **`monte_carlo_simulations`** (20251004_monte_carlo_simulations.sql)
   - **Schema:** ✅ Exists
   - **Code:** ⚠️ Race strategy uses Monte Carlo (lines 287-420 in races.tsx) but unclear if saves to this table
   - **Action:** Verify simulation results are persisted

7. **`race_control_system`** (20251005_race_control_system.sql)
   - **Schema:** ✅ Exists
   - **Code:** ❌ No UI integration found
   - **Action:** Implement race committee control interface

8. **`series_scoring_system`** (20251005_series_scoring_system.sql)
   - **Schema:** ✅ Exists
   - **Code:** ❌ No integration found
   - **Action:** Implement multi-race series scoring

9. **`crew_availability`** (20251004_crew_availability.sql)
   - **Schema:** ✅ Exists
   - **Code:** ⚠️ Component exists (`CrewAvailabilityCalendar.tsx`) but integration unclear
   - **Action:** Verify component is connected to database

10. **`race_strategies`** (20251004_race_strategies.sql)
    - **Schema:** ✅ Exists
    - **Code:** ✅ CONNECTED - Insert at races.tsx lines 344-398
    - **Status:** WORKING

11. **`ai_analyses`** (20251004_ai_analyses.sql)
    - **Schema:** ✅ Exists
    - **Code:** ✅ CONNECTED - Insert at races.tsx lines 214-234
    - **Status:** WORKING

---

## SECTION 5: AI INTEGRATION COMPLETENESS

### Fully Integrated AI Agents (Working End-to-End)

✅ **DocumentProcessingAgent**
- **File:** `/src/services/agents/DocumentProcessingAgent.ts`
- **UI Integration:** `/src/app/(tabs)/races.tsx` lines 148-161
- **Database Persistence:** `ai_analyses` table (lines 214-234)
- **Display:** 3D MapLibre visualization (lines 636-697)
- **Status:** PRODUCTION READY

**Flow:**
```
PDF upload →
Agent processes sailing instructions →
Extract race course marks →
Generate 3D GeoJSON visualization →
Analyze strategy →
Save to ai_analyses table →
Display interactive 3D map
```

✅ **RaceStrategyEngine** (not agent, but AI-powered)
- **File:** `/src/app/(tabs)/races.tsx` lines 287-420
- **Features:** Monte Carlo simulation, wind/tide analysis, confidence scoring
- **Database Persistence:** `race_strategies` table (lines 344-398)
- **Display:** Strategy preview card (lines 858-894)
- **Status:** PRODUCTION READY

**Flow:**
```
Course data + venue conditions →
Monte Carlo simulation (1000 iterations) →
Calculate optimal tactics →
Confidence scoring →
Save to race_strategies table →
Display strategy with visualizations
```

---

### Partially Integrated AI Agents (Backend Works, UI Incomplete)

⚠️ **VenueIntelligenceAgent**
- **File:** `/src/services/agents/VenueIntelligenceAgent.ts`
- **UI Integration:** `/src/app/(tabs)/dashboard.tsx` lines 123-141
- **Database Persistence:** ❌ MISSING (only setState, not saved)
- **Display:** ✅ Works (lines 272-335)
- **Status:** NEEDS PERSISTENCE

**Current Flow:**
```
User at venue →
Click "Get Insights" button →
VenueIntelligenceAgent.analyzeVenue() →
Results stored in React state →
Displayed in dashboard card →
⚠️ LOST on refresh
```

**Required Fix:**
```typescript
// After line 136 in dashboard.tsx
if (result.success) {
  setVenueInsights(result.insights);

  // ADD: Save to database
  await supabase.from('venue_intelligence_cache').upsert({
    venue_id: currentVenue.id,
    user_id: user.id,
    insights: result.insights,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  });
}
```

⚠️ **CoursePredictionAgent**
- **File:** `/src/services/agents/CoursePredictionAgent.ts`
- **UI Integration:** `/src/app/(tabs)/races.tsx` lines 237-258
- **Database Persistence:** ❌ MISSING (only setState)
- **Display:** ✅ Works (lines 640-667)
- **Status:** NEEDS PERSISTENCE

**Current Flow:**
```
User views upcoming race →
Click "Predict Course" button →
CoursePredictionAgent.predictCourse() →
Results stored in React state →
⚠️ LOST on refresh
```

**Required Fix:**
```typescript
// After line 252 in races.tsx
if (predictionResult.success) {
  setCoursePrediction(predictionResult.result);

  // ADD: Save to database (maybe in ai_analyses table with type='course_prediction')
  await supabase.from('ai_analyses').insert({
    user_id: user.id,
    regatta_id: regattaId,
    analysis_type: 'course_prediction',
    course_data: predictionResult.result,
    model_used: 'claude-sonnet-4-5',
    created_at: new Date().toISOString()
  });
}
```

⚠️ **RaceAnalysisAgent**
- **File:** `/src/services/agents/RaceAnalysisAgent.ts`
- **UI Integration:** ⚠️ PARTIAL - Hook exists but no UI trigger
- **Hook:** `/src/hooks/useData.ts` lines 365-372
- **Database Persistence:** ✅ Works via `RaceAnalysisService`
- **Database Table:** `ai_coach_analysis` (lines 352-362)
- **Display:** Dashboard AICoachCard (lines 443-452) shows results
- **Status:** NEEDS UI TRIGGER

**Current Flow:**
```
Race timer session saved →
⚠️ NO AUTOMATIC TRIGGER →
Manual trigger via useTriggerRaceAnalysis() hook →
RaceAnalysisService.analyzeRaceSession() →
Calls RaceAnalysisAgent →
Saves to ai_coach_analysis table →
Displays in dashboard
```

**Required Fix:**

1. **Automatic Trigger After Race:**
```typescript
// In race timer screen (when user ends session)
const { mutate: triggerAnalysis } = useTriggerRaceAnalysis();

const handleEndRace = async () => {
  const sessionId = await saveRaceSession();

  // ADD: Auto-trigger analysis
  triggerAnalysis(sessionId, {
    onSuccess: () => {
      showNotification('Race analysis complete! View on dashboard.');
    }
  });
};
```

2. **Manual Trigger from Dashboard:**
```typescript
// In dashboard.tsx AICoachCard component
// Add button: "Analyze This Race"
<Button onPress={() => triggerAnalysis(session.id)}>
  Analyze Race
</Button>
```

---

### Unused AI Agents (Built But Not Integrated)

❌ **CoachMatchingAgent**
- **File:** `/src/services/agents/CoachMatchingAgent.ts` (exists via grep)
- **UI Integration:** ❌ NONE
- **Expected Use:** `/src/app/coach/discover.tsx` (coach discovery screen)
- **Database:** ❌ No table for match results
- **Status:** UNUSED - HIGH VALUE FEATURE

**Expected Flow:**
```
User clicks "Find a Coach" →
CoachMatchingAgent analyzes user performance data →
Identifies skill gaps (e.g., "weak upwind performance") →
Searches coaches with matching expertise →
Calculates compatibility scores →
Ranks coaches with reasoning →
Displays: "95% match - Expert in upwind tactics for Dragon class"
```

**Required Implementation:**

1. **Create Database Table:**
```sql
CREATE TABLE coach_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  coach_id UUID REFERENCES users(id),
  compatibility_score DECIMAL, -- 0.0 to 1.0
  skill_gap_analysis JSONB, -- User's identified weaknesses
  match_reasoning TEXT, -- AI explanation
  performance_data_used JSONB, -- User's races analyzed
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, coach_id)
);
```

2. **Integrate into `/src/app/coach/discover.tsx`:**
```typescript
// On screen load
const matchCoaches = async () => {
  const agent = new CoachMatchingAgent();
  const result = await agent.matchCoaches({
    userId: user.id,
    recentRaces: userRaces, // From useSailorDashboardData
    preferences: {
      boatClass: user.primaryBoatClass,
      maxHourlyRate: 150,
      preferredLanguages: ['en']
    }
  });

  if (result.success) {
    // Save match scores
    await supabase.from('coach_match_scores').upsert(
      result.matches.map(match => ({
        user_id: user.id,
        coach_id: match.coachId,
        compatibility_score: match.score,
        skill_gap_analysis: match.skillGaps,
        match_reasoning: match.reasoning
      }))
    );

    // Display ranked coaches
    setMatchedCoaches(result.matches);
  }
};
```

❌ **OnboardingAgent**
- **File:** `/src/services/agents/OnboardingAgent.ts` (exists via grep)
- **UI Integration:** ❌ NONE
- **Expected Use:** Personalized onboarding guidance
- **Status:** UNUSED

**Potential Use Cases:**
- Guide new users through app features
- Suggest next actions based on user type
- Personalize onboarding flow based on responses
- Auto-configure settings based on sailor profile

**Implementation Decision Needed:** Is this agent still needed, or can onboarding be handled with traditional UI flows?

---

## SECTION 6: NAVIGATION & ORPHANED SCREENS

### Confirmed Reachable Screens (In Tab Navigation)

From `/src/app/(tabs)/` structure:

**Sailor Tabs:**
- ✅ `/dashboard` - Primary landing, real data
- ✅ `/races` - Race strategy with AI agents
- ✅ `/calendar` - Event calendar with filters
- ✅ `/crew` - Crew management
- ✅ `/tuning-guides` - Tuning guides library
- ✅ `/boat` - Boat list
- ✅ `/fleet` - Fleet overview
- ✅ `/venue` - Venue selector
- ✅ `/more` - Settings/profile menu

**Coach Tabs (Expected):**
- ⚠️ `/clients` - Client list (exists, unclear if reachable)
- ⚠️ `/schedule` - Session calendar (exists, unclear if reachable)
- ⚠️ `/earnings` - Payment history (exists, unclear if reachable)

**Club Tabs (Expected):**
- ⚠️ `/events` - Event management (exists, unclear if reachable)
- ⚠️ `/members` - Member management (exists, unclear if reachable)

**Action Required:**
1. Read `/src/app/(tabs)/_layout.tsx` to confirm tab configuration
2. Verify role-based tab visibility (sailor vs coach vs club)
3. Check if coach/club tabs are implemented or TODO

---

### Orphaned Screens (Exist But Navigation Unclear)

**Priority: HIGH** - These screens exist but may not be accessible to users

From `git status` untracked files:

#### Analytics & Intelligence
- `/src/app/analytics.tsx`
- `/src/app/ai-strategy.tsx`
- `/src/app/venue-intelligence.tsx`

#### Race Features
- `/src/app/race-analysis.tsx`
- `/src/app/race-control.tsx`
- `/src/app/race-timer-pro.tsx`
- `/src/app/race-strategy.tsx`
- `/src/app/race-in-progress.tsx`
- `/src/app/recent-race-analysis.tsx`
- `/src/app/start-sequence.tsx`

#### Administrative
- `/src/app/fleet-verification.tsx`
- `/src/app/venue-verification.tsx`
- `/src/app/venue-verification-review.tsx`
- `/src/app/race-series-verification.tsx`
- `/src/app/regatta-verification.tsx`
- `/src/app/admin-users-verification.tsx`

#### Course & Location
- `/src/app/course-view.tsx`
- `/src/app/location.tsx`
- `/src/app/map-fullscreen.tsx`

#### Race Committee
- `/src/app/race-committee-dashboard.tsx`
- `/src/app/record-finishes.tsx`
- `/src/app/results-scoring.tsx`
- `/src/app/score-races.tsx`
- `/src/app/series-race-config.tsx`
- `/src/app/series-standings.tsx`

#### Setup & Management
- `/src/app/boat-setup.tsx`
- `/src/app/confirm-crew.tsx`
- `/src/app/entry-management.tsx`

#### Documents & Content
- `/src/app/upload-documents.tsx`
- `/src/app/post-update.tsx`

**Required Actions:**

1. **Categorize Screens:**
   - Which are feature screens (need navigation links)?
   - Which are modal/detail screens (navigated programmatically)?
   - Which are admin-only screens (need permission checks)?
   - Which are deprecated/unused (can be deleted)?

2. **Add Navigation:**
   - Feature screens: Add to relevant tab or menu
   - Modal screens: Ensure `router.push()` calls exist
   - Admin screens: Create admin panel navigation

3. **Example Navigation Additions:**
```typescript
// In /src/app/(tabs)/more.tsx or settings menu
<Button onPress={() => router.push('/analytics')}>
  View Analytics
</Button>

// In race detail screen
<Button onPress={() => router.push(`/race-analysis?sessionId=${sessionId}`)}>
  View Analysis
</Button>

// In fleet screen
<Button onPress={() => router.push('/fleet-verification')}
        visible={user.role === 'admin'}>
  Verify Fleets
</Button>
```

---

## SECTION 7: TODO/FIXME AUDIT

### Critical TODOs (Blocking Features)

From grep search of codebase:

#### Payment Integration TODOs

1. **`/src/services/PaymentService.ts`**
   ```
   // TODO: Implement actual payment processing
   ```
   - **Impact:** All payment flows blocked
   - **Action:** Implement Stripe payment intent creation and confirmation

2. **`/src/components/registration/PaymentFlowComponent.tsx`**
   - Has TODO markers (file modified)
   - **Action:** Implement PaymentSheet integration

3. **`/src/services/StripeConnectService.ts`**
   - Has TODO markers (file modified)
   - **Action:** Complete Stripe Connect account creation and OAuth

#### Coach Features TODOs

4. **`/src/app/(auth)/coach-onboarding-welcome.tsx`**
   - Has TODO markers
   - **Action:** Complete welcome screen form handling

5. **`/src/app/(auth)/coach-onboarding-pricing.tsx`**
   - Has TODO markers
   - **Action:** Complete pricing configuration

6. **`/src/services/CoachingService.ts`**
   - Has TODO markers
   - **Action:** Implement session booking logic

7. **`/src/hooks/useCoachingSessions.ts`**
   - Has TODO markers
   - **Action:** Complete data hooks for session management

#### Race & Results TODOs

8. **`/src/services/ResultsService.ts`**
   - Has TODO markers
   - **Action:** Implement results entry and publishing

9. **`/src/app/(tabs)/race/timer.tsx`**
   - Has TODO markers
   - **Action:** Complete GPS tracking implementation

#### Fleet & Social TODOs

10. **`/src/app/fleet-activity.tsx`**
    - Has TODO markers
    - **Action:** Implement fleet social feed

11. **`/src/components/sailor/CrewManagement.tsx`**
    - Has TODO markers (file modified)
    - **Action:** Complete crew management features

---

### Backup/Corrupted Files (Need Resolution)

🔴 **CRITICAL:**
- `/src/app/(auth)/coach-onboarding-expertise.tsx.corrupted`
  - **Action:** Restore from `.bak` file IMMEDIATELY

**Backup Files (Can be deleted after verification):**
- `/src/app/(auth)/coach-onboarding-expertise.tsx.bak`
- `/src/app/(auth)/onboarding.tsx.bak`
- **Action:** Compare with current versions, delete if no longer needed

**Deprecated Component:**
- `/src/components/ui/button.tsx` (deleted in git status)
  - Likely replaced by gluestack-ui button component
  - **Action:** Verify no imports reference old path

---

## SECTION 8: IMPLEMENTATION PRIORITIES

### IMMEDIATE (Week 1) - Critical Blockers

#### Priority 1.1: Fix Coach Onboarding [1-2 days]
- [ ] Restore `/src/app/(auth)/coach-onboarding-expertise.tsx` from `.bak`
- [ ] Complete TODOs in `coach-onboarding-welcome.tsx`
- [ ] Complete TODOs in `coach-onboarding-pricing.tsx`
- [ ] Verify data flow through all 6 screens
- [ ] Test database inserts to `coach_profiles`, `coach_availability`, `coach_services`

#### Priority 1.2: Stripe Payment Integration [3-4 days]
- [ ] Install and configure `@stripe/stripe-react-native`
- [ ] Create Edge Function: `create-payment-intent`
- [ ] Implement PaymentSheet in `/src/components/registration/PaymentFlowComponent.tsx`
- [ ] Add payment confirmation handling
- [ ] Create webhook endpoint for payment events
- [ ] Test race registration payment flow end-to-end

#### Priority 1.3: Stripe Connect for Coaches [2-3 days]
- [ ] Complete `/src/services/StripeConnectService.ts`
- [ ] Create Edge Function: `create-stripe-connect-account`
- [ ] Implement OAuth callback in `coach-onboarding-stripe-callback.tsx`
- [ ] Update database schema to store `stripe_account_id`
- [ ] Test coach onboarding with Stripe Connect

**Total Week 1 Estimate:** 6-9 days of work (requires focused effort or multiple developers)

---

### HIGH PRIORITY (Week 2-3) - Core Functionality

#### Priority 2.1: GPS Race Tracking [3-4 days]
- [ ] Verify `expo-location` installation and permissions
- [ ] Implement GPS tracking in `/src/app/(tabs)/race/timer.tsx`
- [ ] Create database insert for `race_timer_sessions` with GPS data
- [ ] Add real-time coordinate updates during race
- [ ] Implement session completion and persistence
- [ ] Test GPS tracking accuracy and performance

#### Priority 2.2: Integrate Unused AI Agents [4-5 days]

**RaceAnalysisAgent:**
- [ ] Add "Analyze Race" button to dashboard AICoachCard
- [ ] Implement automatic analysis trigger after race completion
- [ ] Add loading and result display states
- [ ] Test analysis quality and performance

**CoachMatchingAgent:**
- [ ] Create `coach_match_scores` database table
- [ ] Integrate agent into `/src/app/coach/discover.tsx`
- [ ] Implement match score display with reasoning
- [ ] Add filters for preferences (price, boat class, etc.)
- [ ] Test matching accuracy

**VenueIntelligenceAgent Persistence:**
- [ ] Create `venue_intelligence_cache` database table
- [ ] Modify dashboard to save agent results
- [ ] Implement cache expiration logic (24 hours)
- [ ] Add "Updated X hours ago" indicator
- [ ] Test cache performance

**CoursePredictionAgent Persistence:**
- [ ] Add database save after prediction
- [ ] Display historical predictions
- [ ] Compare prediction accuracy with actual course

#### Priority 2.3: Coach Session Booking Flow [4-5 days]
- [ ] Enhance `/src/app/coach/discover.tsx` with AI matching
- [ ] Implement `/src/app/coach/book.tsx` booking form
- [ ] Load coach availability from `coach_availability` table
- [ ] Display calendar with available time slots
- [ ] Integrate payment flow for session booking
- [ ] Insert to `coaching_sessions` table
- [ ] Send confirmation emails (coach + sailor)
- [ ] Test end-to-end booking flow

**Total Week 2-3 Estimate:** 11-14 days of work

---

### MEDIUM PRIORITY (Week 4-5) - Complete User Experiences

#### Priority 3.1: Coach Dashboard Completion [3-4 days]

**Clients Screen:**
- [ ] Implement client list query from `coaching_sessions`
- [ ] Display session count and last session date
- [ ] Add client performance trends
- [ ] Link to session notes

**Schedule Screen:**
- [ ] Implement upcoming sessions calendar
- [ ] Add booking request acceptance/rejection
- [ ] Implement drag-and-drop rescheduling
- [ ] Add session reminder notifications

**Earnings Screen:**
- [ ] Query `stripe_payouts` table
- [ ] Display payment history with filters
- [ ] Add revenue charts (Chart.js or recharts)
- [ ] Show pending earnings
- [ ] Add payout schedule information

#### Priority 3.2: Club Event Management [5-6 days]
- [ ] Verify `/src/app/club/event/create.tsx` backend integration
- [ ] Implement `club_events` table insert
- [ ] Add registration settings (payment required, early bird pricing)
- [ ] Implement `/src/app/club/event/[id]/entries.tsx` entry management
- [ ] Add entry approval/rejection workflow
- [ ] Implement race control system integration
- [ ] Test event creation to results publishing flow

#### Priority 3.3: Subscription Management [3-4 days]
- [ ] Create Stripe subscription products (Sailor Pro, Championship)
- [ ] Implement subscription checkout flow
- [ ] Create `subscriptions` database table
- [ ] Add subscription management screen (cancel, upgrade, downgrade)
- [ ] Implement feature gating based on subscription tier
- [ ] Add webhook handlers for subscription events
- [ ] Test subscription lifecycle

**Total Week 4-5 Estimate:** 11-14 days of work

---

### LOWER PRIORITY (Week 6+) - Polish & Advanced Features

#### Priority 4.1: Results & Scoring Systems [5-6 days]
- [ ] Implement results entry interface for race committee
- [ ] Add scoring calculation (series scoring migration exists)
- [ ] Create results approval workflow
- [ ] Implement results publishing
- [ ] Add series standings calculation
- [ ] Test with different race formats (fleet, match, team)

#### Priority 4.2: Fleet Social Features [3-4 days]
- [ ] Implement fleet activity feed
- [ ] Add post creation (photos, race reports)
- [ ] Implement comments and reactions
- [ ] Add notifications for fleet activity
- [ ] Test social engagement features

#### Priority 4.3: Verification & Admin Screens [4-5 days]
- [ ] Implement admin verification workflows
- [ ] Add fleet verification process
- [ ] Add venue verification process
- [ ] Add race series verification
- [ ] Create admin dashboard
- [ ] Add user management for admins

#### Priority 4.4: Navigation Cleanup [2-3 days]
- [ ] Audit all orphaned screens
- [ ] Add navigation links for feature screens
- [ ] Verify modal/detail screen routes
- [ ] Add admin panel navigation
- [ ] Delete deprecated screens
- [ ] Test all navigation paths

**Total Week 6+ Estimate:** 14-18 days of work

---

## SECTION 9: TECHNICAL IMPLEMENTATION NOTES

### Stripe Integration Implementation Guide

#### Step 1: Environment Setup
```bash
# Install Stripe React Native
npm install @stripe/stripe-react-native

# Install Stripe backend SDK (for Edge Functions)
npm install stripe
```

#### Step 2: Environment Variables
```env
# Frontend (.env)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Backend (Supabase Edge Functions or backend service)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Step 3: Initialize Stripe Provider

**File:** `/src/providers/StripeProvider.tsx`
```typescript
import { StripeProvider as StripeProviderNative } from '@stripe/stripe-react-native';
import { ReactNode } from 'react';
import { Platform } from 'react-native';

export function StripeProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

  if (Platform.OS === 'web') {
    // Web: Load Stripe.js script
    // Use @stripe/stripe-js for web
    return <>{children}</>;
  }

  // Native: Use Stripe React Native
  return (
    <StripeProviderNative publishableKey={publishableKey}>
      {children}
    </StripeProviderNative>
  );
}
```

#### Step 4: Create Payment Intent (Edge Function)

**File:** `supabase/functions/create-payment-intent/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  try {
    const { amount, currency = 'usd', metadata } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Step 5: Payment Flow Component

**File:** `/src/components/registration/PaymentFlowComponent.tsx`
```typescript
import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/src/services/supabase';

export function PaymentFlowComponent({
  amount,
  raceId,
  onSuccess
}: {
  amount: number;
  raceId: string;
  onSuccess: () => void;
}) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Create payment intent
      const { data: { clientSecret } } = await supabase.functions.invoke(
        'create-payment-intent',
        { body: { amount: amount * 100, metadata: { raceId } } }
      );

      // 2. Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'RegattaFlow',
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      // 3. Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment Cancelled', presentError.message);
        return;
      }

      // 4. Payment successful - insert registration
      await supabase.from('event_registrations').insert({
        race_id: raceId,
        payment_intent_id: clientSecret.split('_secret_')[0],
        amount,
        status: 'confirmed'
      });

      Alert.alert('Success', 'Registration confirmed!');
      onSuccess();

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onPress={handlePayment}
      disabled={loading}
      title={loading ? 'Processing...' : `Pay $${amount}`}
    />
  );
}
```

#### Step 6: Webhook Handler (Edge Function)

**File:** `supabase/functions/stripe-webhook/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update registration status
      await supabase
        .from('event_registrations')
        .update({ status: 'confirmed', paid_at: new Date().toISOString() })
        .eq('payment_intent_id', paymentIntent.id);

      // Send confirmation email
      await supabase.functions.invoke('send-registration-confirmation', {
        body: { paymentIntentId: paymentIntent.id }
      });
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;

      await supabase
        .from('event_registrations')
        .update({ status: 'failed' })
        .eq('payment_intent_id', failedPayment.id);
      break;

    // Add more webhook handlers as needed
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

### GPS Tracking Implementation Guide

#### Step 1: Install expo-location
```bash
npx expo install expo-location
```

#### Step 2: Configure Permissions

**File:** `app.json`
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "RegattaFlow needs your location to track your race performance.",
        "NSLocationAlwaysUsageDescription": "RegattaFlow needs background location to track races even when the app is minimized."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

#### Step 3: Race Timer Implementation

**File:** `/src/app/(tabs)/race/timer.tsx`
```typescript
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/lib/contexts/AuthContext';

type GPSCoordinate = {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
};

export default function RaceTimerScreen({ raceId }: { raceId: string }) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<GPSCoordinate[]>([]);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startRace = async () => {
    // 1. Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Location permission is required to track races');
      return;
    }

    // 2. Create race timer session
    const { data: session, error } = await supabase
      .from('race_timer_sessions')
      .insert({
        user_id: user.id,
        race_id: raceId,
        started_at: new Date().toISOString(),
        gps_track: [],
        tactical_events: []
      })
      .select()
      .single();

    if (error) {
      alert('Failed to start race session');
      return;
    }

    setSessionId(session.id);
    setIsTracking(true);

    // 3. Start GPS tracking
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (location) => {
        const coordinate: GPSCoordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
          heading: location.coords.heading,
        };

        setCoordinates(prev => [...prev, coordinate]);
      }
    );
  };

  const endRace = async () => {
    if (!sessionId) return;

    // 1. Stop GPS tracking
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    setIsTracking(false);

    // 2. Save final GPS track to database
    const { error } = await supabase
      .from('race_timer_sessions')
      .update({
        ended_at: new Date().toISOString(),
        gps_track: coordinates, // Save all coordinates as JSONB
      })
      .eq('id', sessionId);

    if (error) {
      alert('Failed to save race session');
      return;
    }

    // 3. Trigger AI analysis
    const { useTriggerRaceAnalysis } = await import('@/src/hooks/useData');
    // Note: This needs to be called as a hook, restructure as needed

    alert('Race completed! Analysis will be ready shortly.');

    // Reset state
    setSessionId(null);
    setCoordinates([]);
  };

  return (
    <View>
      {!isTracking ? (
        <Button title="Start Race" onPress={startRace} />
      ) : (
        <>
          <Text>Tracking... {coordinates.length} GPS points</Text>
          <Button title="End Race" onPress={endRace} />
        </>
      )}
    </View>
  );
}
```

---

### Database Schema Additions Needed

#### Table: `venue_intelligence_cache`
```sql
CREATE TABLE venue_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES sailing_venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  weather_data JSONB,
  cultural_data JSONB,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(venue_id, user_id)
);

CREATE INDEX idx_venue_intelligence_cache_venue ON venue_intelligence_cache(venue_id);
CREATE INDEX idx_venue_intelligence_cache_user ON venue_intelligence_cache(user_id);
CREATE INDEX idx_venue_intelligence_cache_expires ON venue_intelligence_cache(expires_at);
```

#### Table: `coach_match_scores`
```sql
CREATE TABLE coach_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3, 2) CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
  skill_gap_analysis JSONB,
  match_reasoning TEXT,
  performance_data_used JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, coach_id)
);

CREATE INDEX idx_coach_match_scores_user ON coach_match_scores(user_id);
CREATE INDEX idx_coach_match_scores_coach ON coach_match_scores(coach_id);
CREATE INDEX idx_coach_match_scores_score ON coach_match_scores(compatibility_score DESC);
```

#### Table: `event_registrations` (if not exists)
```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES sailor_boats(id),
  payment_intent_id TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'usd',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(race_id, user_id)
);

CREATE INDEX idx_event_registrations_race ON event_registrations(race_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
```

#### Table: `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT CHECK (tier IN ('free', 'sailor_pro', 'championship')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

## SECTION 10: TESTING CHECKLIST

### End-to-End Workflow Tests

#### Sailor Workflows
- [ ] **Race Registration with Payment**
  1. Browse upcoming races
  2. Click "Register"
  3. Select boat
  4. Complete payment via Stripe
  5. Verify database insert to `event_registrations`
  6. Receive confirmation email
  7. See race in "My Races" section

- [ ] **Document Upload → AI Strategy**
  1. Upload sailing instructions PDF
  2. DocumentProcessingAgent processes
  3. View 3D course visualization
  4. Generate race strategy with Monte Carlo
  5. Verify saves to `ai_analyses` and `race_strategies`
  6. View strategy on race day

- [ ] **GPS Race Tracking**
  1. Start race timer
  2. Grant location permissions
  3. GPS tracks coordinates during race
  4. End race
  5. Verify GPS data saved to `race_timer_sessions`
  6. Auto-trigger RaceAnalysisAgent
  7. View AI analysis on dashboard

- [ ] **Coach Booking**
  1. Click "Find a Coach"
  2. CoachMatchingAgent ranks coaches
  3. View compatibility scores
  4. Select coach and time slot
  5. Complete payment
  6. Verify insert to `coaching_sessions`
  7. Receive confirmation

#### Coach Workflows
- [ ] **Onboarding**
  1. Select "Coach" user type
  2. Complete welcome screen
  3. Add expertise and certifications
  4. Set availability schedule
  5. Configure pricing
  6. Preview profile
  7. Initialize Stripe Connect
  8. Complete OAuth callback
  9. Verify all data saved
  10. Redirect to coach dashboard

- [ ] **Session Management**
  1. Receive booking request notification
  2. View session details
  3. Accept/reject request
  4. Add to calendar
  5. Complete session
  6. Add session notes
  7. Mark as complete
  8. Payment processes to Stripe Connect

- [ ] **Earnings Dashboard**
  1. View payment history
  2. See revenue charts
  3. Check pending payouts
  4. Download payout reports

#### Club Workflows
- [ ] **Event Creation**
  1. Click "Create Event"
  2. Enter event details
  3. Configure registration (payment required, early bird)
  4. Set race schedule
  5. Verify insert to `club_events`
  6. Publish event

- [ ] **Entry Management**
  1. View registrations
  2. Approve/reject entries
  3. Manage late entries
  4. Export entry list

- [ ] **Race Control**
  1. Select race to start
  2. Configure start sequence
  3. Start race timer
  4. Record finishes
  5. Enter results
  6. Publish results

---

## SECTION 11: ESTIMATED TIMELINES

### By Priority Level

**IMMEDIATE (Week 1):**
- Fix coach onboarding: 1-2 days
- Stripe payment integration: 3-4 days
- Stripe Connect: 2-3 days
- **Total: 6-9 days**

**HIGH (Week 2-3):**
- GPS race tracking: 3-4 days
- Integrate AI agents: 4-5 days
- Coach booking flow: 4-5 days
- **Total: 11-14 days**

**MEDIUM (Week 4-5):**
- Coach dashboard: 3-4 days
- Club event management: 5-6 days
- Subscription management: 3-4 days
- **Total: 11-14 days**

**LOWER (Week 6+):**
- Results & scoring: 5-6 days
- Fleet social: 3-4 days
- Admin/verification: 4-5 days
- Navigation cleanup: 2-3 days
- **Total: 14-18 days**

### By User Type (MVP Definition)

**Sailor MVP: 3-4 weeks**
- Week 1: Payment integration
- Week 1-2: GPS tracking
- Week 2: AI agent integration
- Week 3: Coach booking
- Week 4: Testing and polish

**Coach MVP: 4-5 weeks**
- Week 1: Fix onboarding + Stripe Connect
- Week 2-3: Session management
- Week 3: Earnings dashboard
- Week 4: AI matching
- Week 5: Testing and polish

**Club MVP: 5-6 weeks**
- Week 1-2: Event creation backend
- Week 2-3: Entry management
- Week 3-4: Race control
- Week 4-5: Results publishing
- Week 6: Testing and polish

### Overall Platform MVP: 8-10 weeks
With focused development effort (1-2 full-time developers)

---

## SECTION 12: SUCCESS METRICS

### Implementation Completeness

**Current State:**
- Sailor: 65% → Target: 95%
- Coach: 30% → Target: 90%
- Club: 25% → Target: 85%

### Critical Path Completion

- [ ] Payment integration working (race registration + coach sessions)
- [ ] All 3 AI agents integrated and persisting data
- [ ] GPS tracking writing to database
- [ ] Coach onboarding flow complete
- [ ] Coach earnings dashboard live
- [ ] Event creation end-to-end functional

### User Flow Completion

- [ ] Sailor can register for races with payment
- [ ] Sailor can track GPS races and get AI analysis
- [ ] Sailor can book and pay for coaching sessions
- [ ] Coach can onboard and receive payments
- [ ] Coach can manage sessions and clients
- [ ] Club can create events and manage entries

---

## APPENDIX: KEY FILE REFERENCES

### Core Data Files
- `/src/hooks/useData.ts` - Central data hooks (30+ Supabase tables)
- `/src/hooks/useSailorDashboardData.ts` - Sailor dashboard queries
- `/src/services/supabase.ts` - Supabase client initialization

### AI Agent Files
- `/src/services/agents/DocumentProcessingAgent.ts` - PDF extraction (WORKING)
- `/src/services/agents/VenueIntelligenceAgent.ts` - Venue insights (PARTIAL)
- `/src/services/agents/RaceAnalysisAgent.ts` - Post-race analysis (BACKEND-ONLY)
- `/src/services/agents/CoursePredictionAgent.ts` - Course prediction (PARTIAL)
- `/src/services/agents/CoachMatchingAgent.ts` - Coach discovery (UNUSED)
- `/src/services/agents/OnboardingAgent.ts` - User onboarding (UNUSED)

### Payment Files
- `/src/services/PaymentService.ts` - General payment logic (TODOs)
- `/src/services/StripeConnectService.ts` - Coach payouts (TODOs)
- `/src/services/payments/StripeService.web.ts` - Web payment (TODOs)
- `/src/services/payments/StripeService.native.ts` - Native payment (TODOs)
- `/src/components/registration/PaymentFlowComponent.tsx` - Payment UI (TODOs)

### Coach Files
- `/src/app/(auth)/coach-onboarding-*.tsx` - Onboarding flow (6 screens)
- `/src/app/(tabs)/clients.tsx` - Client management
- `/src/app/(tabs)/schedule.tsx` - Session calendar
- `/src/app/(tabs)/earnings.tsx` - Payment history
- `/src/services/CoachService.ts` - Coach data operations
- `/src/services/CoachingService.ts` - Session management (TODOs)

### Sailor Files
- `/src/app/(tabs)/dashboard.tsx` - Main dashboard (WORKING)
- `/src/app/(tabs)/races.tsx` - Race strategy with AI (WORKING)
- `/src/app/(tabs)/calendar.tsx` - Event calendar (WORKING)
- `/src/app/(tabs)/crew.tsx` - Crew management (WORKING)
- `/src/app/(tabs)/boat/index.tsx` - Boat list (WORKING)
- `/src/app/(tabs)/race/timer.tsx` - GPS tracking (TODOs)

### Club Files
- `/src/app/club/event/create.tsx` - Event creation
- `/src/app/club/event/[id]/entries.tsx` - Entry management
- `/src/app/(tabs)/events.tsx` - Event list
- `/src/app/(tabs)/members.tsx` - Member management

### Migration Files (Database Schema)
- `supabase/migrations/20251004_coaching_system.sql`
- `supabase/migrations/20251004_stripe_connect_fields.sql`
- `supabase/migrations/20251004_race_strategies.sql`
- `supabase/migrations/20251004_ai_analyses.sql`
- `supabase/migrations/20251005_race_control_system.sql`
- `supabase/migrations/20251005_series_scoring_system.sql`

---

**END OF DETAILED REPORT**

This report can be fed directly into Claude AI with prompts like:
- "Based on BLOCKER 2, generate step-by-step fix instructions for Stripe integration"
- "Implement Priority 2.2 RaceAnalysisAgent integration with code"
- "Create migration for venue_intelligence_cache table from Section 9"
- "Generate complete implementation for GPS tracking from Section 9"
