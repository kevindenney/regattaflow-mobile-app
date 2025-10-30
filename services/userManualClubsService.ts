import { supabase } from '@/services/supabase';
import MutationQueueService from './MutationQueueService';

const TABLE_NAME = 'user_manual_clubs';
const COLLECTION_NAME = 'user_manual_clubs';

const isMissingTableError = (error: any) => {
  if (!error) return false;
  const message = typeof error?.message === 'string' ? error.message : '';
  return message.includes('relation') || message.includes('does not exist');
};

export interface ManualClubRecord {
  id: string;
  user_id: string;
  club_name: string;
  relationship?: string | null;
  notes?: string | null;
  added_at: string;
  updated_at?: string | null;
}

export interface ManualClubPayload {
  id: string;
  name: string;
  relationship: string;
  notes?: string;
  addedAt: string;
}

interface OperationResult {
  success: boolean;
  missingTable?: boolean;
  error?: any;
}

interface FetchResult {
  clubs: ManualClubRecord[];
  missingTable: boolean;
  error?: any;
}

export async function fetchUserManualClubs(userId: string): Promise<FetchResult> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        return { clubs: [], missingTable: true };
      }
      return { clubs: [], missingTable: false, error };
    }

    return { clubs: data || [], missingTable: false };
  } catch (error) {
    return { clubs: [], missingTable: false, error };
  }
}

export async function upsertUserManualClub(userId: string, club: ManualClubPayload): Promise<OperationResult> {
  try {
    const { error } = await supabase.from(TABLE_NAME).upsert(
      {
        id: club.id,
        user_id: userId,
        club_name: club.name,
        relationship: club.relationship,
        notes: club.notes || null,
        added_at: club.addedAt,
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isMissingTableError(error)) {
        return { success: false, missingTable: true };
      }
      // Enqueue for retry
      await MutationQueueService.enqueueMutation(COLLECTION_NAME, 'upsert', { userId, club });
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    // Enqueue for retry on network/unexpected errors
    await MutationQueueService.enqueueMutation(COLLECTION_NAME, 'upsert', { userId, club });
    return { success: false, error };
  }
}

export async function deleteUserManualClub(userId: string, clubId: string): Promise<OperationResult> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', userId)
      .eq('id', clubId);

    if (error) {
      if (isMissingTableError(error)) {
        return { success: false, missingTable: true };
      }
      // Enqueue for retry
      await MutationQueueService.enqueueMutation(COLLECTION_NAME, 'delete', { userId, clubId });
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    // Enqueue for retry on network/unexpected errors
    await MutationQueueService.enqueueMutation(COLLECTION_NAME, 'delete', { userId, clubId });
    return { success: false, error };
  }
}

export async function bulkUpsertUserManualClubs(userId: string, clubs: ManualClubPayload[]): Promise<OperationResult> {
  if (clubs.length === 0) {
    return { success: true };
  }

  try {
    const records = clubs.map((club) => ({
      id: club.id,
      user_id: userId,
      club_name: club.name,
      relationship: club.relationship,
      notes: club.notes || null,
      added_at: club.addedAt,
    }));

    const { error } = await supabase.from(TABLE_NAME).upsert(records, { onConflict: 'id' });

    if (error) {
      if (isMissingTableError(error)) {
        return { success: false, missingTable: true };
      }
      // Enqueue for retry
      await MutationQueueService.enqueueMutation(COLLECTION_NAME, 'bulk-sync', { userId, clubs });
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    // Enqueue for retry on network/unexpected errors
    await MutationQueueService.enqueueMutation(COLLECTION_NAME, 'bulk-sync', { userId, clubs });
    return { success: false, error };
  }
}

/**
 * Initialize mutation queue handlers for automatic retry
 */
export function initializeMutationQueueHandlers() {
  MutationQueueService.registerHandler(COLLECTION_NAME, {
    upsert: async (payload: { userId: string; club: ManualClubPayload }) => {
      const result = await upsertUserManualClubDirect(payload.userId, payload.club);
      if (!result.success && !result.missingTable) {
        throw new Error(result.error?.message || 'Failed to upsert club');
      }
    },
    delete: async (payload: { userId: string; clubId: string }) => {
      const result = await deleteUserManualClubDirect(payload.userId, payload.clubId);
      if (!result.success && !result.missingTable) {
        throw new Error(result.error?.message || 'Failed to delete club');
      }
    },
    bulkSync: async (payload: { userId: string; clubs: ManualClubPayload[] }) => {
      const result = await bulkUpsertUserManualClubsDirect(payload.userId, payload.clubs);
      if (!result.success && !result.missingTable) {
        throw new Error(result.error?.message || 'Failed to bulk sync clubs');
      }
    },
  });

  // Start network monitoring for automatic sync
  MutationQueueService.startNetworkMonitoring();
}

/**
 * Direct upsert without queue (used by mutation queue retry)
 */
async function upsertUserManualClubDirect(userId: string, club: ManualClubPayload): Promise<OperationResult> {
  try {
    const { error } = await supabase.from(TABLE_NAME).upsert(
      {
        id: club.id,
        user_id: userId,
        club_name: club.name,
        relationship: club.relationship,
        notes: club.notes || null,
        added_at: club.addedAt,
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isMissingTableError(error)) {
        return { success: false, missingTable: true };
      }
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Direct delete without queue (used by mutation queue retry)
 */
async function deleteUserManualClubDirect(userId: string, clubId: string): Promise<OperationResult> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', userId)
      .eq('id', clubId);

    if (error) {
      if (isMissingTableError(error)) {
        return { success: false, missingTable: true };
      }
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Direct bulk upsert without queue (used by mutation queue retry)
 */
async function bulkUpsertUserManualClubsDirect(userId: string, clubs: ManualClubPayload[]): Promise<OperationResult> {
  if (clubs.length === 0) {
    return { success: true };
  }

  try {
    const records = clubs.map((club) => ({
      id: club.id,
      user_id: userId,
      club_name: club.name,
      relationship: club.relationship,
      notes: club.notes || null,
      added_at: club.addedAt,
    }));

    const { error } = await supabase.from(TABLE_NAME).upsert(records, { onConflict: 'id' });

    if (error) {
      if (isMissingTableError(error)) {
        return { success: false, missingTable: true };
      }
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
