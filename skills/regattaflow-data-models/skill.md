---
name: regattaflow-data-models
description: RegattaFlow Supabase database patterns, RLS policies, query conventions, and migration best practices
trigger: Use when working with database schema, RLS policies, SQL queries, or data models in RegattaFlow
---

# RegattaFlow Data Models Skill

## Technology Stack

**Database:** PostgreSQL via Supabase
**Auth:** Supabase Auth with UUID-based user IDs
**Security:** Row Level Security (RLS) on all tables
**Real-time:** Supabase Realtime for live updates
**Migrations:** SQL migration files in `supabase/migrations/`

## Core Database Principles

### 1. All Tables Use RLS

**CRITICAL:** Every table MUST have RLS enabled and policies defined.

```sql
-- Always enable RLS on new tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 2. UUID Primary Keys

All tables use UUID primary keys (not serial integers):

```sql
CREATE TABLE boats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- other columns...
);
```

### 3. Timestamps on Everything

Every table includes created_at and updated_at:

```sql
CREATE TABLE table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- other columns...
);
```

### 4. User ID Foreign Keys

Tables owned by users include user_id with CASCADE delete:

```sql
CREATE TABLE sailor_boats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sailor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- other columns...
);
```

## Row Level Security (RLS) Patterns

### Pattern 1: User-Owned Data (Most Common)

Used for: races, sailor_boats, documents, strategies

```sql
-- Enable RLS
ALTER TABLE sailor_boats ENABLE ROW LEVEL SECURITY;

-- Policy: Sailors can view their own boats
CREATE POLICY "Sailors can view their own boats"
  ON sailor_boats FOR SELECT
  USING (auth.uid() = sailor_id);

-- Policy: Sailors can insert their own boats
CREATE POLICY "Sailors can insert their own boats"
  ON sailor_boats FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

-- Policy: Sailors can update their own boats
CREATE POLICY "Sailors can update their own boats"
  ON sailor_boats FOR UPDATE
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

-- Policy: Sailors can delete their own boats
CREATE POLICY "Sailors can delete their own boats"
  ON sailor_boats FOR DELETE
  USING (auth.uid() = sailor_id);
```

**Key Points:**
- **USING clause:** Controls who can see/modify the row
- **WITH CHECK clause:** Required for INSERT/UPDATE, validates new data
- **Both USING and WITH CHECK** on UPDATE to prevent ownership changes
- **Separate policies** for each operation (SELECT/INSERT/UPDATE/DELETE)

### Pattern 2: Public Read, Owner Write

Used for: boat_classes, sailing_venues (reference data)

```sql
-- Enable RLS
ALTER TABLE boat_classes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view boat classes
CREATE POLICY "Anyone can view boat classes"
  ON boat_classes FOR SELECT
  USING (true);

-- Policy: Only admins or creators can modify
CREATE POLICY "Creators can modify boat classes"
  ON boat_classes FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
```

### Pattern 3: Junction Tables (Many-to-Many)

Used for: fleet_members, race_registrations

```sql
-- Enable RLS
ALTER TABLE fleet_members ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view fleet membership
CREATE POLICY "Members can view fleet membership"
  ON fleet_members FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM fleet_members WHERE fleet_id = fleet_members.fleet_id
  ));

-- Policy: Users can manage their own memberships
CREATE POLICY "Users can manage own membership"
  ON fleet_members FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Pattern 4: Nested Ownership (Parent-Child)

Used for: race_marks (owned via race), document_pages (owned via document)

```sql
-- Enable RLS
ALTER TABLE race_marks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view marks for their races
CREATE POLICY "Users can view marks for their races"
  ON race_marks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM races
    WHERE races.id = race_marks.race_id
    AND races.user_id = auth.uid()
  ));

-- Policy: Users can manage marks for their races
CREATE POLICY "Users can manage marks for their races"
  ON race_marks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM races
    WHERE races.id = race_marks.race_id
    AND races.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM races
    WHERE races.id = race_marks.race_id
    AND races.user_id = auth.uid()
  ));
```

## Migration Patterns

### Standard Migration Template

```sql
-- Migration: descriptive_name
-- Created: YYYY-MM-DD
-- Purpose: Brief description of what this migration does

-- Table Creation
CREATE TABLE IF NOT EXISTS table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_table_name_user_id ON table_name(user_id);
CREATE INDEX IF NOT EXISTS idx_table_name_created_at ON table_name(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_name_status ON table_name(status);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE table_name IS 'Stores user-specific data for feature X';
COMMENT ON COLUMN table_name.status IS 'Current status: active, inactive, archived';
```

### Migration File Naming

Format: `YYYYMMDD_descriptive_name.sql`

Examples:
- `20251018_add_race_marks_table.sql`
- `20251018_fix_sailor_boats_rls.sql`
- `20251018_add_venue_coordinates.sql`

### Index Best Practices

```sql
-- Index foreign keys (performance critical)
CREATE INDEX idx_table_fk_column ON table_name(foreign_key_column);

-- Index frequently queried columns
CREATE INDEX idx_table_status ON table_name(status);

-- Index timestamp columns for sorting (DESC for recent-first queries)
CREATE INDEX idx_table_created_at ON table_name(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_table_user_status ON table_name(user_id, status);

-- Partial indexes for common filters
CREATE INDEX idx_table_active ON table_name(user_id)
  WHERE status = 'active';
```

## Query Patterns

### TypeScript Integration

#### Type Generation

```bash
# Generate TypeScript types from database schema
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

#### Type Usage

```typescript
import type { Database } from '@/src/types/supabase';

// Table row types
type Race = Database['public']['Tables']['races']['Row'];
type RaceInsert = Database['public']['Tables']['races']['Insert'];
type RaceUpdate = Database['public']['Tables']['races']['Update'];

// Use in service functions
async function getRace(id: string): Promise<Race | null> {
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
```

### Standard CRUD Patterns

#### SELECT - Single Record

```typescript
import { supabase } from '@/src/services/supabase';

// Get single record
const { data, error } = await supabase
  .from('races')
  .select('*')
  .eq('id', raceId)
  .single();

if (error) {
  console.error('Error fetching race:', error);
  return null;
}

return data;
```

#### SELECT - Multiple Records

```typescript
// Get all races for user
const { data, error } = await supabase
  .from('races')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: false });

if (error) {
  console.error('Error fetching races:', error);
  return [];
}

return data;
```

#### SELECT - With Joins

```typescript
// Join with related tables
const { data, error } = await supabase
  .from('races')
  .select(`
    *,
    venue:sailing_venues(id, name, location),
    boat:sailor_boats(id, name, sail_number),
    marks:race_marks(*)
  `)
  .eq('user_id', userId);
```

**Join Syntax:**
- `table:foreign_table(columns)` - Single relation
- `table:foreign_table(*)` - All columns
- Nested comma-separated columns

#### INSERT - Single Record

```typescript
const { data, error } = await supabase
  .from('races')
  .insert({
    user_id: userId,
    name: 'Race Name',
    date: '2025-10-19',
    venue_id: venueId,
  })
  .select()
  .single();

if (error) {
  console.error('Insert failed:', error);
  throw new Error('Failed to create race');
}

return data;
```

**IMPORTANT:** Always call `.select()` after insert to get the inserted row with generated fields (id, created_at, etc.)

#### INSERT - Multiple Records

```typescript
const { data, error } = await supabase
  .from('race_marks')
  .insert([
    { race_id: raceId, name: 'Start Pin', latitude: 22.279, longitude: 114.162 },
    { race_id: raceId, name: 'Windward', latitude: 22.285, longitude: 114.165 },
  ])
  .select();
```

#### UPDATE - Single Record

```typescript
const { data, error } = await supabase
  .from('races')
  .update({
    status: 'completed',
    finish_time: new Date().toISOString(),
  })
  .eq('id', raceId)
  .eq('user_id', userId)  // ALWAYS verify ownership
  .select()
  .single();

if (error) {
  console.error('Update failed:', error);
  throw new Error('Failed to update race');
}

return data;
```

**Security:** Always include `.eq('user_id', userId)` to prevent unauthorized updates

#### DELETE - Single Record

```typescript
const { error } = await supabase
  .from('races')
  .delete()
  .eq('id', raceId)
  .eq('user_id', userId);  // ALWAYS verify ownership

if (error) {
  console.error('Delete failed:', error);
  throw new Error('Failed to delete race');
}
```

### Advanced Query Patterns

#### Filtering

```typescript
// Multiple conditions
const { data } = await supabase
  .from('races')
  .select('*')
  .eq('user_id', userId)
  .gte('date', '2025-01-01')
  .lte('date', '2025-12-31')
  .in('status', ['scheduled', 'in_progress']);

// Text search
const { data } = await supabase
  .from('races')
  .select('*')
  .ilike('name', '%championship%');

// Null checks
const { data } = await supabase
  .from('races')
  .select('*')
  .is('finish_time', null);
```

#### Ordering and Pagination

```typescript
// Order by multiple columns
const { data } = await supabase
  .from('races')
  .select('*')
  .order('date', { ascending: false })
  .order('created_at', { ascending: false });

// Pagination
const page = 0;
const pageSize = 20;
const { data, count } = await supabase
  .from('races')
  .select('*', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

#### Aggregation

```typescript
// Count records
const { count, error } = await supabase
  .from('races')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

// Use PostgreSQL functions
const { data } = await supabase
  .rpc('count_races_by_status', {
    p_user_id: userId
  });
```

### Geographic Queries

#### Nearby Venues (PostGIS)

```typescript
// Use RPC function for distance queries
const { data, error } = await supabase
  .rpc('venues_within_radius', {
    lat: 22.279,
    lng: 114.162,
    radius_km: 50
  });
```

**RPC Function (in migration):**

```sql
CREATE OR REPLACE FUNCTION venues_within_radius(
  lat FLOAT,
  lng FLOAT,
  radius_km FLOAT
)
RETURNS SETOF sailing_venues AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM sailing_venues
  WHERE calculate_distance(
    lat, lng,
    latitude, longitude
  ) <= radius_km
  ORDER BY calculate_distance(lat, lng, latitude, longitude);
END;
$$ LANGUAGE plpgsql;
```

#### Distance Calculation (Haversine)

```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 FLOAT,
  lon1 FLOAT,
  lat2 FLOAT,
  lon2 FLOAT
) RETURNS FLOAT AS $$
DECLARE
  R FLOAT := 6371; -- Earth radius in km
  dLat FLOAT;
  dLon FLOAT;
  a FLOAT;
  c FLOAT;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);

  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);

  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

## Real-Time Subscriptions

### Subscribe to Table Changes

```typescript
import { supabase } from '@/src/services/supabase';
import { useEffect } from 'react';

export function useRaceUpdates(userId: string) {
  useEffect(() => {
    const subscription = supabase
      .channel('races_channel')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE, or specific event
          schema: 'public',
          table: 'races',
          filter: `user_id=eq.${userId}`  // Only user's races
        },
        (payload) => {
          console.log('Race updated:', payload);
          // Update local state based on payload.eventType
          // INSERT: payload.new
          // UPDATE: payload.new (updated row)
          // DELETE: payload.old (deleted row)
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
}
```

### Broadcast Messages (Real-Time Communication)

```typescript
// Send message
const channel = supabase.channel('race_123');
channel.send({
  type: 'broadcast',
  event: 'position_update',
  payload: {
    latitude: 22.279,
    longitude: 114.162,
    timestamp: Date.now()
  }
});

// Receive messages
channel.on('broadcast', { event: 'position_update' }, (payload) => {
  console.log('Position update:', payload);
});
```

## Error Handling

### Standard Error Pattern

```typescript
async function getRace(raceId: string): Promise<Race | null> {
  try {
    const { data, error } = await supabase
      .from('races')
      .select('*')
      .eq('id', raceId)
      .single();

    if (error) {
      // Log for debugging
      console.error('[getRace] Supabase error:', error);

      // Check for specific error codes
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }

      // Re-throw for caller to handle
      throw new Error(`Failed to fetch race: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('[getRace] Unexpected error:', error);
    throw error;
  }
}
```

### Common Error Codes

- `PGRST116` - No rows returned (404)
- `23505` - Unique constraint violation
- `23503` - Foreign key violation
- `42501` - Insufficient privileges (RLS)

## Best Practices

### 1. Always Use Transactions for Related Operations

```typescript
// Use Supabase transactions via RPC
const { data, error } = await supabase.rpc('create_race_with_marks', {
  p_race_data: raceData,
  p_marks_data: marksData
});
```

**RPC Function:**

```sql
CREATE OR REPLACE FUNCTION create_race_with_marks(
  p_race_data JSONB,
  p_marks_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_race_id UUID;
BEGIN
  -- Insert race
  INSERT INTO races (user_id, name, date, venue_id)
  VALUES (
    (p_race_data->>'user_id')::UUID,
    p_race_data->>'name',
    (p_race_data->>'date')::TIMESTAMP WITH TIME ZONE,
    (p_race_data->>'venue_id')::UUID
  )
  RETURNING id INTO v_race_id;

  -- Insert marks
  INSERT INTO race_marks (race_id, name, latitude, longitude)
  SELECT
    v_race_id,
    value->>'name',
    (value->>'latitude')::FLOAT,
    (value->>'longitude')::FLOAT
  FROM jsonb_array_elements(p_marks_data);

  RETURN jsonb_build_object('race_id', v_race_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Index Foreign Keys

Always create indexes on foreign key columns:

```sql
CREATE INDEX idx_race_marks_race_id ON race_marks(race_id);
CREATE INDEX idx_sailor_boats_sailor_id ON sailor_boats(sailor_id);
CREATE INDEX idx_races_venue_id ON races(venue_id);
```

### 3. Use Soft Deletes for Important Data

```sql
-- Add deleted_at column
ALTER TABLE races ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to exclude soft-deleted records
CREATE POLICY "Users can view own active races"
  ON races FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Soft delete function
UPDATE races
SET deleted_at = NOW()
WHERE id = race_id;
```

### 4. Validate Data with Check Constraints

```sql
CREATE TABLE races (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  rating FLOAT CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure finish_time is after start_time
  start_time TIMESTAMP WITH TIME ZONE,
  finish_time TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_time_range CHECK (finish_time IS NULL OR finish_time > start_time)
);
```

### 5. Use Enums for Fixed Sets of Values

```sql
-- Create enum type
CREATE TYPE race_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Use in table
CREATE TABLE races (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status race_status NOT NULL DEFAULT 'scheduled'
);
```

## Common Patterns Reference

### Upsert (Insert or Update)

```typescript
const { data, error } = await supabase
  .from('sailor_boats')
  .upsert({
    id: boatId,  // If exists, update; otherwise insert
    sailor_id: userId,
    name: 'Updated Name',
  })
  .select()
  .single();
```

### Conditional Update

```typescript
// Only update if condition is met
const { data, error } = await supabase
  .from('races')
  .update({ status: 'completed' })
  .eq('id', raceId)
  .eq('status', 'in_progress')  // Only if currently in progress
  .select();
```

### Bulk Operations

```typescript
// Delete multiple records
const { error } = await supabase
  .from('race_marks')
  .delete()
  .eq('race_id', raceId);

// Update multiple records
const { data, error } = await supabase
  .from('races')
  .update({ archived: true })
  .lt('date', '2024-01-01');
```

---

## When to Use This Skill

Use this skill when:
- Creating new database tables or migrations
- Writing RLS policies for security
- Implementing CRUD operations in services
- Setting up real-time subscriptions
- Querying related data with joins
- Optimizing queries with indexes
- Handling geographic data (venues, coordinates)
- Implementing transactions

**Token Savings:** By following these established patterns, you avoid generating database schema code, RLS policies, and query logic from scratch. Reference this skill instead.

**Estimated savings:** ~600-1,000 tokens per migration or service implementation
