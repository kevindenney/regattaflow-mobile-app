# Race Preparation Persistence & AI Integration

## Overview

This document describes the implementation of persistent storage for sailor race preparation data and integration with the AI chat service.

## Implementation Summary

### 1. Database Schema (✅ Completed)

**File:** `supabase/migrations/20251101090000_create_sailor_race_preparation.sql`

Created a new table `sailor_race_preparation` to store:
- Rig notes (text)
- Selected rig preset ID (text)
- Regulatory acknowledgements (JSONB)
- Race brief data for AI context (JSONB)

**Key Features:**
- Row-Level Security (RLS) policies ensure sailors can only access their own data
- Unique constraint on (race_event_id, sailor_id) prevents duplicate entries
- Automatic timestamp tracking with triggers
- Proper foreign key relationships with cascading deletes

**Note:** Migration file created but needs to be applied when database has write access.

### 2. Persistence Service (✅ Completed)

**File:** `services/SailorRacePreparationService.ts`

Provides a comprehensive API for managing race preparation data:

**Key Methods:**
- `getPreparation(raceEventId, sailorId)` - Fetch existing preparation data
- `upsertPreparation(preparation)` - Create or update preparation data
- `updateRigNotes(raceEventId, sailorId, rigNotes)` - Update rig notes specifically
- `updateRigPreset(raceEventId, sailorId, rigPresetId)` - Update selected rig preset
- `updateAcknowledgements(raceEventId, sailorId, acknowledgements)` - Update regulatory acknowledgements
- `updateRaceBrief(raceEventId, sailorId, raceBriefData)` - Update race brief for AI context
- `toggleAcknowledgement(raceEventId, sailorId, key)` - Toggle a specific acknowledgement
- `deletePreparation(raceEventId, sailorId)` - Delete preparation data
- `getSailorPreparations(sailorId)` - Get all preparations for a sailor

**Features:**
- Automatic upsert logic prevents duplicate entries
- Comprehensive error logging
- Type-safe interfaces for all data structures

### 3. React Hook for UI Integration (✅ Completed)

**File:** `hooks/useRacePreparation.ts`

Custom hook that manages race preparation data with automatic persistence:

**Key Features:**
- Auto-loads preparation data when race changes
- Debounced auto-save (1 second default)
- Optimistic UI updates with background persistence
- Loading and saving states for UI feedback
- Manual save and refresh methods
- Cleanup on unmount to save pending changes

**API:**
```typescript
const {
  // State
  rigNotes,
  selectedRigPresetId,
  acknowledgements,
  raceBriefData,
  isLoading,
  isSaving,

  // Actions
  setRigNotes,
  setSelectedRigPresetId,
  toggleAcknowledgement,
  updateRaceBrief,
  save,
  refresh,
} = useRacePreparation({
  raceEventId: 'race-id',
  autoSave: true,
  debounceMs: 1000,
});
```

### 4. AI Context Integration (✅ Completed)

**Updated Files:**
- `services/ai/ContextResolvers.ts` - Extended `RaceContext` interface to include preparation data
- `services/ai/PromptBuilder.ts` - Updated `buildRaceCommsPrompt` to include preparation context

**Key Changes:**
- `resolveRaceContext()` now accepts optional `sailorId` parameter
- When provided, fetches sailor preparation data and includes it in context
- AI prompts now include rig notes, acknowledgements, and race brief data
- Enables more personalized and contextual AI responses

**RaceContext Interface:**
```typescript
export interface RaceContext {
  clubId: string;
  race: any;
  regatta?: any;
  weather?: { summary?: string; wind?: string; };
  preparation?: {
    rigNotes?: string;
    selectedRigPresetId?: string;
    acknowledgements?: RegulatoryAcknowledgements;
    raceBrief?: RaceBriefData;
  };
}
```

### 5. Race Brief Sync Hook (✅ Completed)

**File:** `hooks/ai/useRaceBriefSync.ts`

Coordinates race brief data between UI hero and AI chat:

**Key Features:**
- Caches AI context to avoid redundant database queries
- Detects stale race briefs (older than 5 minutes)
- Auto-invalidates cache when race brief changes
- Provides helper hook for chat integration

**API:**
```typescript
const {
  getAIContext,        // Get full AI context with preparation data
  isStale,             // Check if race brief is outdated
  refreshContext,      // Manually refresh cache
} = useRaceBriefSync({
  raceEventId: 'race-id',
  raceBrief: raceBriefData,
  enabled: true,
});
```

### 6. UI Integration in races.tsx (✅ Completed)

**File:** `app/(tabs)/races.tsx`

**Changes:**
1. Replaced local state with `useRacePreparation` hook
2. Added `useRaceBriefSync` for AI integration
3. Auto-syncs race brief to preparation service via useEffect
4. Updated `handleOpenChatFromRigPlanner` to load AI context before navigation
5. All rig notes and acknowledgements now persist automatically

**Key Benefits:**
- No more lost rig notes when navigating away
- NoR acknowledgements persist across sessions
- AI chat has full context of sailor's preparation
- Race brief automatically feeds AI for contextual responses

## Data Flow

```
User Interaction (UI)
         ↓
useRacePreparation Hook (debounced)
         ↓
SailorRacePreparationService
         ↓
Supabase (sailor_race_preparation table)
         ↓
AI Context Resolver
         ↓
AI Prompt Builder
         ↓
Claude API (with full race context)
```

## Next Steps for Testing

### 1. Apply Database Migration

```bash
# Option 1: Using Supabase CLI
npx supabase db push

# Option 2: Using the MCP tool (when write access available)
# Migration file is already created at:
# supabase/migrations/20251101090000_create_sailor_race_preparation.sql
```

### 2. Test on Device with Real Data

1. **Test Rig Notes Persistence:**
   - Enter rig notes for a race
   - Navigate away and return
   - Verify notes are preserved

2. **Test Acknowledgements:**
   - Toggle NoR acknowledgements
   - Check database to confirm persistence
   - Verify acknowledgements show correctly after refresh

3. **Test AI Integration:**
   - Add rig notes and race preparation data
   - Open chat from rig planner
   - Verify AI responses reference the preparation context

4. **Test Auto-Save:**
   - Type rig notes slowly
   - Observe network requests (debounced to 1 second)
   - Verify final state is saved

5. **Test Multi-Race Scenario:**
   - Add preparation data for multiple races
   - Switch between races
   - Verify correct data loads for each race

### 3. Performance Testing

- Test with longer course lists (Attachment B scenarios)
- Verify debouncing works correctly
- Check for memory leaks during long sessions
- Monitor Supabase query performance

### 4. Edge Cases to Test

- No internet connection (offline mode)
- Rapid race switching
- Simultaneous updates from different devices
- Race deletion (should cascade delete preparation data)

## File Summary

### New Files Created
1. `supabase/migrations/20251101090000_create_sailor_race_preparation.sql` - Database schema
2. `services/SailorRacePreparationService.ts` - Persistence service
3. `hooks/useRacePreparation.ts` - React hook for UI integration
4. `hooks/ai/useRaceBriefSync.ts` - AI context synchronization

### Modified Files
1. `app/(tabs)/races.tsx` - Integrated persistence and AI sync
2. `services/ai/ContextResolvers.ts` - Extended with preparation data
3. `services/ai/PromptBuilder.ts` - Updated prompts with preparation context

## TypeScript Status

✅ Type check passes (no new errors introduced)

## Database Schema Reference

```sql
CREATE TABLE public.sailor_race_preparation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_event_id UUID NOT NULL REFERENCES public.race_events(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rig_notes TEXT,
  selected_rig_preset_id TEXT,
  regulatory_acknowledgements JSONB DEFAULT '{"cleanRegatta": false, "signOn": false, "safetyBriefing": false}'::jsonb,
  race_brief_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_sailor_race UNIQUE(race_event_id, sailor_id)
);
```

## Security Considerations

- RLS policies ensure data isolation between sailors
- All queries use authenticated user context
- No sensitive data exposed in AI prompts
- Preparation data is private to each sailor

## Future Enhancements

1. **Offline Support:** Queue updates when offline, sync when online
2. **Team Sharing:** Allow sailors to share rig notes with teammates
3. **Historical Analysis:** Track preparation patterns over time
4. **AI Suggestions:** Proactive rig recommendations based on conditions
5. **Real-time Sync:** WebSocket updates when crew members update shared data
