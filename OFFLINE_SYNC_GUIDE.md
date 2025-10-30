# Offline Sync & Mutation Queue Guide

## Overview

The RegattaFlow app now includes a robust offline sync system using a mutation queue. This ensures that user actions (like adding, editing, or deleting clubs) are persisted locally and automatically synchronized with Supabase when the network becomes available.

## Architecture

### Components

1. **MutationQueueService** (`services/MutationQueueService.ts`)
   - Generic service for queuing failed mutations
   - Monitors network connectivity
   - Automatically retries failed operations
   - Supports exponential backoff

2. **userManualClubsService** (`services/userManualClubsService.ts`)
   - Integrates with MutationQueueService
   - Handles club data operations
   - Gracefully falls back to queue on failure

3. **Database Table**: `user_manual_clubs`
   - Stores user-tracked clubs in Supabase
   - Row Level Security (RLS) enabled
   - User-scoped data access

## Setup

### 1. Apply Database Migration

Run the migration to create the `user_manual_clubs` table:

```bash
# Using Supabase CLI
supabase db push

# Or apply the migration file manually
psql -f migrations/20251030_create_user_manual_clubs.sql
```

The migration creates:
- `user_manual_clubs` table with proper schema
- Indexes for performance (user_id, added_at)
- RLS policies for user-scoped access
- Automatic `updated_at` trigger

### 2. Initialization

The mutation queue is automatically initialized in `app/_layout.tsx`:

```typescript
import {initializeMutationQueueHandlers} from '@/services/userManualClubsService';
import {initializeCrewMutationHandlers} from '@/services/crewManagementService';
import {initializeBoatMutationHandlers} from '@/services/SailorBoatService';
import {initializeRaceRegistrationMutationHandlers} from '@/services/RaceRegistrationService';

useEffect(() => {
  initializeMutationQueueHandlers();
  initializeCrewMutationHandlers();
  initializeBoatMutationHandlers();
  initializeRaceRegistrationMutationHandlers();
}, []);
```

This registers handlers for all offline-enabled collections and starts network monitoring for auto-sync.

### Collections Enabled for Offline Sync

- **Manual Club Tracker** (`user_manual_clubs`)
- **Crew Management** (`crew_members`, `crew_availability`)
- **Boat Management** (`sailor_boats`)
- **Race Registration Drafts** (`race_entries`)

## How It Works

### Normal Flow (Online)

```
User Action → Service Function → Supabase → Success ✓
```

### Offline Flow

```
User Action → Service Function → Supabase ✗
           ↓
    Enqueue Mutation
           ↓
    Save to AsyncStorage
           ↓
    Network Restored
           ↓
    Auto Retry → Supabase → Success ✓
```

### Example Usage in Components

```typescript
import {upsertUserManualClub} from '@/services/userManualClubsService';

async function handleAddClub(club: ManualClubPayload) {
  const result = await upsertUserManualClub(userId, club);

  if (result.success) {
    console.log('Club saved successfully');
  } else if (result.missingTable) {
    console.warn('Database table not ready yet');
  } else {
    console.warn('Failed to save, queued for retry');
  }

  // Local state is always updated regardless
}
```

## API Reference

### MutationQueueService

#### Methods

**`enqueueMutation(collection, type, payload)`**
- Adds a mutation to the queue
- Automatically attempts immediate sync if online

**`processQueue()`**
- Processes all pending mutations
- Called automatically when network returns

**`getPendingCount()`**
- Returns number of pending mutations

**`clearQueue()`**
- Clears all pending mutations

**`startNetworkMonitoring()`**
- Begins listening for network changes
- Auto-retries on reconnection

**`stopNetworkMonitoring()`**
- Stops network monitoring

### userManualClubsService

#### Functions

**`fetchUserManualClubs(userId: string)`**
```typescript
const { clubs, missingTable, error } = await fetchUserManualClubs(userId);
```

**`upsertUserManualClub(userId: string, club: ManualClubPayload)`**
```typescript
const { success, missingTable, error } = await upsertUserManualClub(userId, club);
```

**`deleteUserManualClub(userId: string, clubId: string)`**
```typescript
const { success, missingTable, error } = await deleteUserManualClub(userId, clubId);
```

**`bulkUpsertUserManualClubs(userId: string, clubs: ManualClubPayload[])`**
```typescript
const { success, missingTable, error } = await bulkUpsertUserManualClubs(userId, clubs);
```

## Features

### Automatic Retry with Exponential Backoff

Failed mutations are retried with increasing delays:
- 1st retry: 2 seconds
- 2nd retry: 4 seconds
- 3rd retry: 8 seconds
- etc., up to 30 seconds max

### Network Monitoring

The service automatically detects when the network comes back online and processes pending mutations.

### Max Retries

Mutations are retried up to 5 times before being logged as permanently failed.

### Graceful Degradation

If the Supabase table doesn't exist yet:
- Operations fail with `missingTable: true`
- Data is NOT queued (table needs to exist first)
- Local AsyncStorage continues to work

## Monitoring Queue Status

### Check Pending Mutations

```typescript
import MutationQueueService from '@/services/MutationQueueService';

const pendingCount = await MutationQueueService.getPendingCount();
console.log(`${pendingCount} mutations pending`);
```

### View Queue Contents

```typescript
const queue = await MutationQueueService.getQueue();
queue.forEach(mutation => {
  console.log(`${mutation.type} - retries: ${mutation.retries}`);
  if (mutation.error) {
    console.log(`Last error: ${mutation.error}`);
  }
});
```

## Best Practices

### 1. Always Update Local State First

```typescript
// Good ✓
setLocalClubs([...localClubs, newClub]);
await upsertUserManualClub(userId, newClub);

// Bad ✗
await upsertUserManualClub(userId, newClub);
setLocalClubs([...localClubs, newClub]); // Delayed if offline
```

### 2. Handle All Response States

```typescript
const result = await upsertUserManualClub(userId, club);

if (result.success) {
  // Happy path
} else if (result.missingTable) {
  // Database not ready - inform user
} else {
  // Network error - queued for retry
  showToast('Saved locally, will sync when online');
}
```

### 3. Don't Block User Actions

The mutation queue handles retries in the background. Don't prevent users from continuing to use the app while syncing.

## Extending to Other Collections

To add offline sync for other data types:

```typescript
// 1. Register handlers
MutationQueueService.registerHandler('my_collection', {
  upsert: async (payload) => {
    // Your upsert logic
  },
  delete: async (payload) => {
    // Your delete logic
  },
});

// 2. Enqueue on failure
try {
  await supabase.from('my_table').insert(data);
} catch (error) {
  await MutationQueueService.enqueueMutation('my_collection', 'upsert', data);
}
```

## Troubleshooting

### Mutations Not Syncing

1. Check network connectivity
2. Verify handlers are registered: `initializeMutationQueueHandlers()` was called
3. Check AsyncStorage for queued mutations
4. Review Supabase logs for RLS policy errors

### Table Missing Errors

1. Ensure migration was applied: `supabase db push`
2. Check Supabase dashboard for table existence
3. Verify RLS policies are enabled

### Max Retries Exceeded

Check the error message in the mutation:
```typescript
const queue = await MutationQueueService.getQueue();
const failedMutations = queue.filter(m => m.retries >= 5);
failedMutations.forEach(m => console.log(m.error));
```

Common causes:
- RLS policy blocking access
- Invalid data format
- Database constraint violations

## Testing

### Simulate Offline Mode

```typescript
import NetInfo from '@react-native-community/netinfo';

// Go offline
await NetInfo.configure({
  reachabilityUrl: 'https://example.com/offline',
  reachabilityTest: async () => Promise.resolve(false),
});

// Perform actions...

// Go back online
await NetInfo.configure({
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTest: async (response) => response.status === 204,
});

// Queue should auto-process
```

### Manual Queue Processing

```typescript
// Force process the queue
await MutationQueueService.processQueue();
```

## Performance Considerations

- Queue is stored in AsyncStorage (fast, persistent)
- Maximum queue size is unbounded (consider implementing cleanup for old failed mutations)
- Network monitoring uses minimal battery
- Mutations are processed sequentially to avoid overwhelming the server

## Security

- All RLS policies enforce user-scoped access
- Mutations in queue are user-scoped
- No sensitive data should be logged in mutation errors
- Queue is stored locally per device/user

## Future Enhancements

Consider implementing:
- [ ] Dead letter queue for permanently failed mutations
- [ ] Queue size limits and cleanup
- [ ] Conflict resolution for concurrent edits
- [ ] Optimistic UI updates with rollback
- [ ] Queue analytics/monitoring dashboard
