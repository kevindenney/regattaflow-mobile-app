# Race Suggestions System - Implementation Complete

## Overview

The intelligent race suggestion system has been successfully implemented. The system learns from user history and connections to provide personalized race recommendations based on club membership, fleet participation, racing patterns, and temporal trends.

## ✅ Completed Components

### 1. Database Schema
**File:** `supabase/migrations/20251106130000_create_race_suggestions_system.sql`

**Tables Created:**
- `race_suggestions_cache` - Pre-computed suggestions with 24-hour expiry
- `race_patterns` - ML-derived patterns from racing history
- `race_templates` - Common race structures users frequently use
- `suggestion_feedback` - User interaction tracking for ML improvement

**Key Features:**
- Row-Level Security (RLS) policies for data privacy
- Automatic cache expiration and cleanup
- Pattern effectiveness tracking via triggers
- Optimized indexes for fast queries

### 2. Core Service
**File:** `services/RaceSuggestionService.ts`

**Key Methods:**
- `getSuggestionsForUser()` - Main entry point with caching
- `getClubUpcomingRaces()` - Fetches races from user's clubs
- `getFleetUpcomingRaces()` - Fetches races from fleet members
- `detectAndUpdatePatterns()` - ML pattern detection
- `recordFeedback()` - Tracks user interactions

**Pattern Detection Types:**
- **Seasonal Patterns** - Races that repeat annually (e.g., "Spring Championship" every April)
- **Venue Preferences** - Locations the user frequents (3+ races)
- **Class Preferences** - Boat classes the user races most (3+ races)
- **Temporal Annual** - "Same race, same time last year" suggestions

**Confidence Scoring:**
- Club events: 0.9 (high confidence - direct membership)
- Fleet races: 0.85 (good confidence - shared class)
- Seasonal patterns: Up to 0.95 (based on occurrence count)
- Venue/class preferences: 0.75-0.9 (based on frequency)

### 3. UI Component
**File:** `components/races/RaceSuggestionsDrawer.tsx`

**Features:**
- Collapsible sections for each suggestion category
- Visual confidence badges (High/Good/Possible Match)
- One-tap form population
- Dismiss functionality
- Refresh button
- Empty state when no suggestions available

**Sections:**
1. **From Your Clubs** - Club events the user is eligible for
2. **From Your Fleets** - Races added by fleet members
3. **Based on Your History** - Pattern-matched suggestions
4. **Your Common Races** - Template-based suggestions

### 4. React Hook
**File:** `hooks/useRaceSuggestions.ts`

**Exports:**
- `useRaceSuggestions()` - Main hook for suggestion management
- `useRaceSuggestion(id)` - Get specific suggestion by ID

**Features:**
- Automatic loading on mount
- Cache invalidation support
- Feedback recording (accept/dismiss)
- Error handling
- Loading states

### 5. Integration
**File:** `app/(tabs)/race/add.tsx` (modified)

**Changes:**
- Imported `RaceSuggestionsDrawer` and `useRaceSuggestions`
- Added suggestion state management
- Implemented `handleSelectSuggestion()` - populates form fields
- Implemented `handleDismissSuggestion()` - tracks dismissals
- Inserted drawer component before AI Quick Entry section

**User Flow:**
1. User navigates to Add Race screen
2. Suggestions load automatically from cache or generate fresh
3. User sees categorized suggestions with confidence scores
4. User clicks "Add to Calendar" on a suggestion
5. Form fields auto-populate from suggestion data
6. User reviews and saves the race
7. System records acceptance and learns from interaction

### 6. Background Processing
**File:** `supabase/functions/refresh-race-suggestions/index.ts`

**Functionality:**
- Runs daily to refresh suggestions for active users
- Processes users in batches (max 1000 per run)
- Cleans expired suggestions
- Generates fresh suggestions from all sources
- Logs processing stats and errors

**Active User Definition:**
- Added a race in last 90 days, OR
- Active club membership, OR
- Active fleet membership

**Processing Stats Tracked:**
- Total users processed
- Success/error counts
- Total suggestions generated
- Processing time

## 🎯 How It Works

### Data Flow

```
User Opens Add Race Screen
    ↓
useRaceSuggestions Hook Loads
    ↓
Check Cache (race_suggestions_cache)
    ↓
If Expired/Empty → Generate Fresh Suggestions
    ├─ Query club_events for user's clubs
    ├─ Query race_events for user's fleet classes
    ├─ Detect patterns from user's race history
    └─ Retrieve user's templates
    ↓
Display Categorized Suggestions
    ↓
User Selects Suggestion
    ↓
Form Fields Auto-Populate
    ↓
Record Feedback (accepted/modified/dismissed)
    ↓
Update Pattern Effectiveness
```

### Pattern Detection Algorithm

**Seasonal Patterns:**
```typescript
Group races by (name + month)
If same race appears 2+ times in same month:
  Confidence = min(occurrences / 5, 0.95)
  Suggest for next occurrence of that month
```

**Venue Preferences:**
```typescript
Count races at each venue
If venue has 3+ races:
  Confidence = min(count / 10, 0.9)
  Suggest races at this venue
```

**Class Preferences:**
```typescript
Count races in each boat class
If class has 3+ races:
  Confidence = min(count / 8, 0.9)
  Suggest races in this class
```

**Temporal Annual:**
```typescript
For upcoming 2 months:
  Find races from previous years in same months
  Suggest with 0.7 confidence
```

## 📊 Database Functions

### `get_active_suggestions(user_id, limit)`
Returns non-expired, non-dismissed suggestions ordered by confidence

### `record_suggestion_feedback(user_id, suggestion_id, action, modified_fields)`
Records user interaction and updates suggestion/pattern tables

### `clean_expired_suggestions()`
Removes suggestions past their expiry date

### `update_pattern_effectiveness()`
Trigger function that recalculates pattern acceptance rates based on feedback

## 🚀 Deployment Steps

### 1. Apply Database Migration
```bash
npx supabase db push
```

### 2. Deploy Edge Function
```bash
npx supabase functions deploy refresh-race-suggestions
```

### 3. Set Up Cron Job (Optional)
Add to Supabase dashboard → Database → Extensions → pg_cron:
```sql
SELECT cron.schedule(
  'refresh-race-suggestions-daily',
  '0 2 * * *', -- Run at 2 AM daily
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/refresh-race-suggestions',
    headers := '{"Authorization": "Bearer [service-role-key]"}'::jsonb
  ) AS request_id;
  $$
);
```

### 4. Manual Refresh (Testing)
```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/refresh-race-suggestions \
  -H "Authorization: Bearer [service-role-key]"
```

## 🔧 Configuration

### Cache Duration
Default: 24 hours (set in `generateFreshSuggestions()`)

To modify, update the `expiresAt` calculation:
```typescript
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 48); // Change to 48 hours
```

### Pattern Thresholds
Current minimums for pattern detection:
- Seasonal: 2 occurrences
- Venue preference: 3 races
- Class preference: 3 races
- Overall minimum: 3 total races for pattern detection

To adjust, modify the detection methods in `RaceSuggestionService.ts`

### Active User Definition
Currently: Activity in last 90 days

To modify, update the edge function:
```typescript
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 120); // Change to 120 days
```

## 📈 Analytics & Monitoring

### Track Suggestion Effectiveness
```sql
-- Overall acceptance rate
SELECT
  suggestion_type,
  COUNT(*) FILTER (WHERE action = 'accepted') * 100.0 / COUNT(*) AS acceptance_rate
FROM suggestion_feedback
GROUP BY suggestion_type;

-- Pattern effectiveness
SELECT
  pattern_type,
  AVG(suggestion_acceptance_rate) AS avg_acceptance_rate,
  COUNT(*) AS pattern_count
FROM race_patterns
GROUP BY pattern_type;

-- Most popular suggestions
SELECT
  race_data->>'raceName' AS race_name,
  COUNT(*) FILTER (WHERE action = 'accepted') AS accepted_count,
  COUNT(*) FILTER (WHERE action = 'dismissed') AS dismissed_count
FROM suggestion_feedback sf
JOIN race_suggestions_cache rsc ON sf.suggestion_id = rsc.id
GROUP BY race_data->>'raceName'
ORDER BY accepted_count DESC
LIMIT 20;
```

### Monitor Background Job Performance
```sql
-- Check last run (if using pg_cron)
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-race-suggestions-daily')
ORDER BY start_time DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### No Suggestions Appearing
1. Check if user has club/fleet memberships:
   ```sql
   SELECT * FROM club_members WHERE user_id = '[user-id]' AND is_active = true;
   SELECT * FROM fleet_members WHERE user_id = '[user-id]' AND status = 'active';
   ```

2. Check if user has race history (for patterns):
   ```sql
   SELECT COUNT(*) FROM regattas WHERE created_by = '[user-id]';
   ```

3. Check suggestion cache:
   ```sql
   SELECT * FROM race_suggestions_cache
   WHERE user_id = '[user-id]'
     AND expires_at > NOW()
     AND dismissed_at IS NULL;
   ```

### Suggestions Not Refreshing
1. Check cache expiry:
   ```sql
   SELECT MIN(expires_at) FROM race_suggestions_cache WHERE user_id = '[user-id]';
   ```

2. Manually invalidate cache:
   ```sql
   UPDATE race_suggestions_cache
   SET expires_at = NOW()
   WHERE user_id = '[user-id]';
   ```

3. Check edge function logs in Supabase Dashboard → Edge Functions → Logs

### Patterns Not Detecting
1. Ensure minimum race count (3 races required)
2. Check pattern table:
   ```sql
   SELECT * FROM race_patterns WHERE user_id = '[user-id]';
   ```

3. Manually trigger pattern detection (call service method directly in console)

## 🎨 Customization

### Add New Suggestion Type

1. Update database enum:
```sql
ALTER TABLE race_suggestions_cache
DROP CONSTRAINT race_suggestions_cache_suggestion_type_check;

ALTER TABLE race_suggestions_cache
ADD CONSTRAINT race_suggestions_cache_suggestion_type_check
CHECK (suggestion_type IN ('club_event', 'fleet_race', 'pattern_match', 'template', 'similar_sailor', 'your_new_type'));
```

2. Add to TypeScript types:
```typescript
export type SuggestionType = 'club_event' | 'fleet_race' | 'pattern_match' | 'template' | 'similar_sailor' | 'your_new_type';
```

3. Implement generation logic in `RaceSuggestionService.ts`

4. Add UI section in `RaceSuggestionsDrawer.tsx`

### Customize Confidence Scoring

Modify the `scoreAndRankSuggestions()` method to implement custom ML scoring:
```typescript
private scoreAndRankSuggestions(suggestions: RaceSuggestion[]): RaceSuggestion[] {
  return suggestions.map(s => ({
    ...s,
    confidenceScore: this.calculateCustomScore(s),
  })).sort((a, b) => b.confidenceScore - a.confidenceScore);
}
```

## 📚 Future Enhancements

- [ ] External calendar integrations (sailing.org, regattacentral.com)
- [ ] Social suggestions ("3 friends are racing this")
- [ ] Weather-based suggestions (favorite wind conditions)
- [ ] Distance-based suggestions (nearby races)
- [ ] Push notifications for registration deadlines
- [ ] Suggestion history analytics dashboard
- [ ] A/B testing different confidence algorithms
- [ ] Machine learning model training on acceptance patterns

## 🔐 Security Considerations

- ✅ RLS policies ensure users only see their own data
- ✅ Service role key required for background refresh
- ✅ CORS headers properly configured
- ✅ No sensitive data in suggestion cache
- ✅ Dismissed suggestions are soft-deleted (for learning)
- ✅ Pattern data is user-specific and private

## 📄 License & Attribution

Part of RegattaFlow application
Implementation by Claude Code Assistant
Date: November 6, 2025

---

## Quick Reference

**Service:** `services/RaceSuggestionService.ts`
**Hook:** `hooks/useRaceSuggestions.ts`
**Component:** `components/races/RaceSuggestionsDrawer.tsx`
**Migration:** `supabase/migrations/20251106130000_create_race_suggestions_system.sql`
**Edge Function:** `supabase/functions/refresh-race-suggestions/index.ts`

**Main Integration Point:** `app/(tabs)/race/add.tsx` (line 743-750)
