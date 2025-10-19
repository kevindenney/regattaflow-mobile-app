/**
 * Query Examples - TypeScript patterns for Supabase CRUD operations
 *
 * This file demonstrates RegattaFlow conventions for:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Error handling patterns
 * - Type generation and usage
 * - Real-time subscriptions
 * - Geographic queries
 * - Transaction patterns using RPC functions
 *
 * To use: Copy relevant patterns into your service files
 */

import { supabase } from '@/src/lib/supabase';
import type { Database } from '@/src/types/database.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Generated types from Supabase schema (via supabase gen types typescript)
type ExampleItem = Database['public']['Tables']['example_items']['Row'];
type ExampleItemInsert = Database['public']['Tables']['example_items']['Insert'];
type ExampleItemUpdate = Database['public']['Tables']['example_items']['Update'];

// Custom types for complex queries
interface ExampleItemWithParent extends ExampleItem {
  parent: {
    id: string;
    name: string;
  } | null;
}

interface ExampleItemFilters {
  status?: 'draft' | 'active' | 'archived';
  search?: string;
  parentId?: string;
  isPublic?: boolean;
}

// ============================================================================
// PATTERN 1: CREATE (INSERT)
// ============================================================================

/**
 * Create a single item
 * Standard pattern: insert().select().single()
 */
export async function createItem(
  userId: string,
  data: Omit<ExampleItemInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<ExampleItem | null> {
  try {
    const { data: item, error } = await supabase
      .from('example_items')
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) {
      console.error('[createItem] Error creating item:', error);
      throw new Error(error.message);
    }

    return item;
  } catch (error) {
    console.error('[createItem] Unexpected error:', error);
    return null;
  }
}

/**
 * Create multiple items (bulk insert)
 * Pattern: insert().select() (no .single())
 */
export async function createItems(
  userId: string,
  items: Omit<ExampleItemInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>[]
): Promise<ExampleItem[]> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .insert(
        items.map((item) => ({
          user_id: userId,
          ...item,
        }))
      )
      .select();

    if (error) {
      console.error('[createItems] Error creating items:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('[createItems] Unexpected error:', error);
    return [];
  }
}

// ============================================================================
// PATTERN 2: READ (SELECT)
// ============================================================================

/**
 * Get a single item by ID
 * Pattern: select().eq().single()
 */
export async function getItemById(itemId: string): Promise<ExampleItem | null> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('[getItemById] Error fetching item:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('[getItemById] Unexpected error:', error);
    return null;
  }
}

/**
 * Get all items for a user
 * Pattern: select().eq()
 */
export async function getUserItems(userId: string): Promise<ExampleItem[]> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getUserItems] Error fetching items:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('[getUserItems] Unexpected error:', error);
    return [];
  }
}

/**
 * Get items with filters and pagination
 * Pattern: select().eq().ilike().range()
 */
export async function getFilteredItems(
  userId: string,
  filters: ExampleItemFilters,
  page: number = 0,
  pageSize: number = 20
): Promise<{ items: ExampleItem[]; total: number }> {
  try {
    // Build the query
    let query = supabase
      .from('example_items')
      .select('*', { count: 'exact' }) // Include total count
      .eq('user_id', userId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.parentId) {
      query = query.eq('parent_id', filters.parentId);
    }

    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }

    if (filters.search) {
      // Full-text search using ilike
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Apply pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('[getFilteredItems] Error fetching items:', error);
      throw new Error(error.message);
    }

    return {
      items: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('[getFilteredItems] Unexpected error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * Get items with related data (joins)
 * Pattern: select('*, related_table(columns)')
 */
export async function getItemsWithParent(
  userId: string
): Promise<ExampleItemWithParent[]> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .select(
        `
        *,
        parent:example_parents(id, name)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getItemsWithParent] Error fetching items:', error);
      throw new Error(error.message);
    }

    return data as ExampleItemWithParent[] || [];
  } catch (error) {
    console.error('[getItemsWithParent] Unexpected error:', error);
    return [];
  }
}

// ============================================================================
// PATTERN 3: UPDATE
// ============================================================================

/**
 * Update a single item
 * Pattern: update().eq().select().single()
 */
export async function updateItem(
  itemId: string,
  updates: ExampleItemUpdate
): Promise<ExampleItem | null> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('[updateItem] Error updating item:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('[updateItem] Unexpected error:', error);
    return null;
  }
}

/**
 * Update multiple items (bulk update)
 * Pattern: update().in().select()
 */
export async function updateMultipleItems(
  itemIds: string[],
  updates: ExampleItemUpdate
): Promise<ExampleItem[]> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .update(updates)
      .in('id', itemIds)
      .select();

    if (error) {
      console.error('[updateMultipleItems] Error updating items:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('[updateMultipleItems] Unexpected error:', error);
    return [];
  }
}

/**
 * Conditional update (only if condition is met)
 * Pattern: update().eq().eq().select().single()
 */
export async function updateItemIfDraft(
  itemId: string,
  updates: ExampleItemUpdate
): Promise<ExampleItem | null> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .update(updates)
      .eq('id', itemId)
      .eq('status', 'draft') // Only update if status is draft
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows matched (item not found or not draft)
        return null;
      }
      console.error('[updateItemIfDraft] Error updating item:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('[updateItemIfDraft] Unexpected error:', error);
    return null;
  }
}

// ============================================================================
// PATTERN 4: DELETE
// ============================================================================

/**
 * Delete a single item
 * Pattern: delete().eq()
 */
export async function deleteItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('example_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('[deleteItem] Error deleting item:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('[deleteItem] Unexpected error:', error);
    return false;
  }
}

/**
 * Delete multiple items (bulk delete)
 * Pattern: delete().in()
 */
export async function deleteMultipleItems(itemIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('example_items')
      .delete()
      .in('id', itemIds);

    if (error) {
      console.error('[deleteMultipleItems] Error deleting items:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('[deleteMultipleItems] Unexpected error:', error);
    return false;
  }
}

/**
 * Soft delete (update status instead of deleting)
 * Pattern: Prefer soft delete for data retention
 */
export async function archiveItem(itemId: string): Promise<ExampleItem | null> {
  try {
    const { data, error } = await supabase
      .from('example_items')
      .update({ status: 'archived' })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('[archiveItem] Error archiving item:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('[archiveItem] Unexpected error:', error);
    return null;
  }
}

// ============================================================================
// PATTERN 5: REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to all changes for a user's items
 * Pattern: channel().on().subscribe()
 */
export function subscribeToUserItems(
  userId: string,
  callbacks: {
    onInsert?: (item: ExampleItem) => void;
    onUpdate?: (item: ExampleItem) => void;
    onDelete?: (oldItem: ExampleItem) => void;
  }
) {
  const channel = supabase
    .channel(`user-${userId}-items`)
    .on<ExampleItem>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'example_items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[Subscription] New item:', payload.new);
        callbacks.onInsert?.(payload.new);
      }
    )
    .on<ExampleItem>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'example_items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[Subscription] Updated item:', payload.new);
        callbacks.onUpdate?.(payload.new);
      }
    )
    .on<ExampleItem>(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'example_items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[Subscription] Deleted item:', payload.old);
        callbacks.onDelete?.(payload.old);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to changes for a specific item
 * Pattern: channel().on().subscribe() with ID filter
 */
export function subscribeToItem(
  itemId: string,
  callbacks: {
    onUpdate?: (item: ExampleItem) => void;
    onDelete?: () => void;
  }
) {
  const channel = supabase
    .channel(`item-${itemId}`)
    .on<ExampleItem>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'example_items',
        filter: `id=eq.${itemId}`,
      },
      (payload) => {
        console.log('[Subscription] Item updated:', payload.new);
        callbacks.onUpdate?.(payload.new);
      }
    )
    .on<ExampleItem>(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'example_items',
        filter: `id=eq.${itemId}`,
      },
      (payload) => {
        console.log('[Subscription] Item deleted:', payload.old);
        callbacks.onDelete?.();
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// PATTERN 6: GEOGRAPHIC QUERIES (PostGIS)
// ============================================================================

/**
 * Get items within a radius (using PostGIS)
 * Pattern: rpc() for custom SQL functions
 */
export async function getItemsNearLocation(
  latitude: number,
  longitude: number,
  radiusMeters: number
): Promise<ExampleItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_items_within_radius', {
      center_lat: latitude,
      center_lng: longitude,
      radius_meters: radiusMeters,
    });

    if (error) {
      console.error('[getItemsNearLocation] Error fetching items:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('[getItemsNearLocation] Unexpected error:', error);
    return [];
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * Use this client-side if you don't need PostGIS
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// ============================================================================
// PATTERN 7: TRANSACTIONS (RPC Functions)
// ============================================================================

/**
 * Transfer item ownership (atomic transaction)
 * Pattern: Use RPC for multi-step operations that must be atomic
 */
export async function transferItemOwnership(
  itemId: string,
  newOwnerId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('transfer_item_ownership', {
      item_uuid: itemId,
      new_owner_uuid: newOwnerId,
    });

    if (error) {
      console.error('[transferItemOwnership] Error transferring ownership:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('[transferItemOwnership] Unexpected error:', error);
    return false;
  }
}

// Corresponding SQL function (add to migration):
/*
CREATE OR REPLACE FUNCTION transfer_item_ownership(
  item_uuid UUID,
  new_owner_uuid UUID
)
RETURNS VOID AS $$
BEGIN
  -- Verify current user owns the item
  IF NOT EXISTS (
    SELECT 1 FROM example_items
    WHERE id = item_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Item not found or you do not own it';
  END IF;

  -- Verify new owner exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = new_owner_uuid
  ) THEN
    RAISE EXCEPTION 'New owner does not exist';
  END IF;

  -- Transfer ownership
  UPDATE example_items
  SET user_id = new_owner_uuid, updated_at = NOW()
  WHERE id = item_uuid;

  -- Log the transfer (if you have an audit table)
  -- INSERT INTO ownership_transfers (item_id, from_user, to_user) VALUES (...);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

// ============================================================================
// PATTERN 8: OPTIMISTIC UPDATES
// ============================================================================

/**
 * Optimistic UI update with rollback on error
 * Pattern: Update local state immediately, rollback if server fails
 */
export async function optimisticUpdateItem(
  itemId: string,
  updates: ExampleItemUpdate,
  localStateUpdater: (item: ExampleItem | null) => void,
  currentItem: ExampleItem
): Promise<boolean> {
  // Step 1: Optimistically update local state
  localStateUpdater({ ...currentItem, ...updates } as ExampleItem);

  try {
    // Step 2: Send update to server
    const { data, error } = await supabase
      .from('example_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      // Step 3a: Rollback on error
      console.error('[optimisticUpdateItem] Error, rolling back:', error);
      localStateUpdater(currentItem);
      throw new Error(error.message);
    }

    // Step 3b: Confirm with server data
    localStateUpdater(data);
    return true;
  } catch (error) {
    console.error('[optimisticUpdateItem] Unexpected error:', error);
    return false;
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Check if error is "not found" error
 */
export function isNotFoundError(error: any): boolean {
  return error?.code === 'PGRST116';
}

/**
 * Check if error is RLS policy violation
 */
export function isRLSError(error: any): boolean {
  return error?.code === '42501' || error?.message?.includes('policy');
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  if (isNotFoundError(error)) {
    return 'Item not found';
  }
  if (isRLSError(error)) {
    return 'You do not have permission to perform this action';
  }
  return error?.message || 'An unexpected error occurred';
}
