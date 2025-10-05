# API Service Usage Guide

This guide shows how to use the Supabase backend API in RegattaFlow screens.

## Overview

The API service provides:
- ✅ Centralized API methods for all data types
- ✅ Loading states and error handling
- ✅ Pull-to-refresh functionality
- ✅ Optimistic updates
- ✅ Pagination support
- ✅ TypeScript type safety

## File Structure

```
src/
├── services/
│   ├── apiService.ts       # API methods for all data types
│   └── supabase.ts         # Supabase client and types
├── hooks/
│   ├── useApi.ts           # Generic API hooks
│   └── useData.ts          # Domain-specific hooks
```

## Basic Usage

### 1. Simple Data Fetching

```typescript
import { useSailorProfile } from '@/src/hooks/useData';

function ProfileScreen() {
  const { data: profile, loading, error, refetch } = useSailorProfile();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return <ProfileView profile={profile} />;
}
```

### 2. Data Fetching with Pull-to-Refresh

```typescript
import { View, ScrollView, RefreshControl } from 'react-native';
import { useBoats } from '@/src/hooks/useData';
import { usePullToRefresh } from '@/src/hooks/useApi';

function BoatsScreen() {
  const { data: boats, loading, error, refetch } = useBoats();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2563EB"
        />
      }
    >
      {boats?.map(boat => <BoatCard key={boat.id} boat={boat} />)}
    </ScrollView>
  );
}
```

### 3. Paginated Data

```typescript
import { useRaces } from '@/src/hooks/useData';

function RacesScreen() {
  const { data, loading, error, hasMore, fetchMore } = useRaces();

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchMore();
    }
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <RaceCard race={item} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <LoadingSpinner /> : null}
    />
  );
}
```

### 4. Mutations (Create, Update, Delete)

```typescript
import { useCreateBoat, useUpdateBoat } from '@/src/hooks/useData';

function BoatFormScreen() {
  const createBoat = useCreateBoat();
  const updateBoat = useUpdateBoat();

  const handleCreate = async (boatData) => {
    await createBoat.mutate(boatData, {
      onSuccess: (data) => {
        console.log('Boat created:', data);
        navigation.goBack();
      },
      onError: (error) => {
        alert('Failed to create boat: ' + error.message);
      }
    });
  };

  const handleUpdate = async (boatId, updates) => {
    await updateBoat.mutate(
      { boatId, updates },
      {
        onSuccess: () => {
          console.log('Boat updated');
        }
      }
    );
  };

  return (
    <View>
      {/* Form UI */}
      <Button
        onPress={handleCreate}
        disabled={createBoat.loading}
      >
        {createBoat.loading ? 'Creating...' : 'Create Boat'}
      </Button>
    </View>
  );
}
```

### 5. Optimistic Updates

```typescript
import { useOptimisticUpdate } from '@/src/hooks/useApi';
import { useUpdateBoat } from '@/src/hooks/useData';

function BoatCard({ boat }) {
  const updateBoat = useUpdateBoat();
  const { data: optimisticBoat, update } = useOptimisticUpdate(boat);

  const handleTogglePrimary = async () => {
    await update(
      { ...boat, is_primary: !boat.is_primary },
      () => updateBoat.mutateAsync({ boatId: boat.id, updates: { is_primary: !boat.is_primary } })
    );
  };

  return (
    <TouchableOpacity onPress={handleTogglePrimary}>
      <Text>{optimisticBoat?.is_primary ? '⭐' : ''} {optimisticBoat?.name}</Text>
    </TouchableOpacity>
  );
}
```

### 6. Combined Data Fetching

```typescript
import { useDashboardData } from '@/src/hooks/useData';

function DashboardScreen() {
  const {
    profile,
    nextRace,
    recentRaces,
    performanceHistory,
    boats,
    fleets,
    loading,
    error,
    refreshing,
    onRefresh
  } = useDashboardData();

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ProfileHeader profile={profile} />
      <NextRaceCard race={nextRace} />
      <RecentRacesList races={recentRaces} />
      {/* ... */}
    </ScrollView>
  );
}
```

## Available Hooks

### Sailor Profile
- `useSailorProfile()` - Get current user's profile
- `useUpdateSailorProfile()` - Update profile

### Venues
- `useVenue(venueId)` - Get venue by ID
- `useNearbyVenues(lat, lng, radiusKm)` - Get nearby venues
- `useSavedVenues()` - Get user's saved venues
- `useSaveVenue()` - Save a venue

### Races
- `useRaces()` - Get paginated races
- `useRace(raceId)` - Get race by ID
- `useCreateRace()` - Create race
- `useUpdateRace()` - Update race

### Race Strategies
- `useRaceStrategy(raceId)` - Get strategy for race
- `useCreateRaceStrategy()` - Create strategy
- `useUpdateRaceStrategy()` - Update strategy

### Race Performance
- `useRacePerformance(raceId)` - Get performance data
- `usePerformanceHistory(limit)` - Get recent performance
- `useCreatePerformance()` - Create performance record

### Boats
- `useBoats()` - Get user's boats
- `useBoat(boatId)` - Get boat by ID
- `useCreateBoat()` - Create boat
- `useUpdateBoat()` - Update boat

### Equipment
- `useSails(boatId)` - Get sails for boat
- `useEquipment(boatId, category)` - Get equipment
- `useCreateEquipment()` - Create equipment
- `useUpdateEquipment()` - Update equipment

### Maintenance
- `useMaintenanceRecords(boatId)` - Get maintenance records
- `useCreateMaintenance()` - Create maintenance record

### Fleets
- `useFleets()` - Get user's fleets
- `useFleet(fleetId)` - Get fleet by ID
- `useFleetMembers(fleetId)` - Get fleet members
- `useJoinFleet()` - Join fleet

### Clubs
- `useClubs()` - Get user's clubs
- `useClub(clubId)` - Get club by ID
- `useJoinClub()` - Join club

### Venue Intelligence
- `useVenueIntelligence(venueId)` - Get venue intelligence
- `useCulturalProfile(venueId)` - Get cultural profile

### Regattas
- `useRegattas()` - Get regattas
- `useRegatta(regattaId)` - Get regatta by ID
- `useCreateRegatta()` - Create regatta
- `useUpdateRegatta()` - Update regatta

### Combined Hooks
- `useDashboardData()` - Get all dashboard data
- `useBoatDetailData(boatId)` - Get all boat detail data
- `useFleetDetailData(fleetId)` - Get all fleet detail data

## Error Handling

### Global Error Handling

```typescript
function MyScreen() {
  const { data, loading, error, refetch } = useData();

  if (error) {
    return (
      <ErrorView
        title="Failed to load data"
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  return <DataView data={data} />;
}
```

### Mutation Error Handling

```typescript
const createBoat = useCreateBoat();

const handleSubmit = async (data) => {
  await createBoat.mutate(data, {
    onSuccess: () => {
      alert('Success!');
    },
    onError: (error) => {
      if (error.message.includes('unique')) {
        alert('A boat with this name already exists');
      } else {
        alert('Failed to create boat: ' + error.message);
      }
    }
  });
};
```

## Loading States

### Button Loading State

```typescript
function SaveButton({ onSave }) {
  const updateBoat = useUpdateBoat();

  return (
    <Button
      onPress={onSave}
      disabled={updateBoat.loading}
    >
      {updateBoat.loading ? (
        <>
          <ActivityIndicator size="small" color="white" />
          <Text>Saving...</Text>
        </>
      ) : (
        <Text>Save</Text>
      )}
    </Button>
  );
}
```

### Screen Loading State

```typescript
function DataScreen() {
  const { data, loading } = useData();

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return <DataView data={data} />;
}
```

## Real-time Updates (Supabase Subscriptions)

```typescript
import { useEffect } from 'react';
import { supabase } from '@/src/services/supabase';

function RaceListScreen() {
  const { data: races, refetch } = useRaces();

  useEffect(() => {
    const channel = supabase
      .channel('races_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'races'
        },
        () => {
          refetch(); // Refetch when data changes
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [refetch]);

  return <RaceList races={races} />;
}
```

## Best Practices

1. **Always handle loading and error states**
   ```typescript
   if (loading) return <LoadingSpinner />;
   if (error) return <ErrorMessage error={error} />;
   ```

2. **Use pull-to-refresh for better UX**
   ```typescript
   const { refreshing, onRefresh } = usePullToRefresh(refetch);
   ```

3. **Implement optimistic updates for instant feedback**
   ```typescript
   const { update } = useOptimisticUpdate(initialData);
   ```

4. **Paginate long lists**
   ```typescript
   const { data, hasMore, fetchMore } = usePaginatedQuery(...);
   ```

5. **Use combined hooks for complex screens**
   ```typescript
   const dashboardData = useDashboardData();
   ```

6. **Provide user feedback for mutations**
   ```typescript
   onSuccess: () => alert('Success!'),
   onError: (err) => alert(err.message)
   ```

## TypeScript Support

All hooks are fully typed:

```typescript
import { Tables } from '@/src/services/supabase';

// Inferred types
const { data: boat } = useBoat(boatId); // boat: Tables<'sailor_boats'> | null

// Mutation types
const createBoat = useCreateBoat();
createBoat.mutate({
  sailor_id: userId,
  name: 'Fire Dragon',
  // TypeScript will autocomplete and validate fields
});
```

## Migration from Mock Data

### Before (Mock Data)
```typescript
const races = [
  { id: 1, name: 'Race 1' },
  { id: 2, name: 'Race 2' }
];
```

### After (API)
```typescript
const { data: races, loading, error, refreshing, onRefresh } = useRaces();

// Add to ScrollView
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {races?.map(race => <RaceCard key={race.id} race={race} />)}
</ScrollView>
```

## Troubleshooting

### Data not loading?
1. Check Supabase environment variables in `.env`
2. Verify RLS policies allow access
3. Check network tab for errors
4. Ensure user is authenticated

### Types not working?
1. Run `npx supabase gen types typescript` to regenerate types
2. Check imports from `@/src/services/supabase`

### Infinite loading?
1. Check if `enabled` option is correct
2. Verify API function returns properly
3. Check for circular dependencies

## Support

For issues or questions:
- Check Supabase logs: `npx supabase logs`
- Check browser console for errors
- Review Supabase documentation: https://supabase.com/docs
