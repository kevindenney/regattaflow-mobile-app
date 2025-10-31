/**
 * Sailor Boat Service
 * Manages individual boats (vessels) - separate from class membership and fleets
 *
 * KEY DISTINCTION:
 * - Boats: Individual vessels (e.g., "Dragonfly" - a specific Dragon)
 * - Classes: Types of boats (e.g., Dragon, Etchells, J/70)
 * - Fleets: Groups of sailors in a class (e.g., "Hong Kong Dragon Fleet")
 */

import { supabase } from './supabase';
import MutationQueueService from './MutationQueueService';
import { createLogger } from '@/lib/utils/logger';

export interface SailorBoat {
  id: string;
  sailor_id: string;
  class_id: string;

  // Boat Identity
  name: string; // "Dragonfly", "My Dragon", etc.
  sail_number?: string;
  hull_number?: string;

  // Boat Details
  manufacturer?: string;
  year_built?: number;
  hull_material?: string;

  // Status
  is_primary: boolean;
  status: 'active' | 'stored' | 'sold' | 'retired';

  // Location
  home_club_id?: string;
  storage_location?: string;

  // Ownership
  ownership_type?: 'owned' | 'co_owned' | 'chartered' | 'club_boat' | 'crew';
  purchase_date?: string;
  purchase_price?: number;

  // Notes
  notes?: string;
  metadata?: Record<string, any>;

  created_at: string;
  updated_at: string;

  // Joined data
  boat_class?: {
    id: string;
    name: string;
    class_association?: string;
  };
  home_club?: {
    id: string;
    name: string;
  };
  queuedForSync?: boolean;
  offlineOperation?: string;
}

export interface CreateBoatInput {
  sailor_id: string;
  class_id: string;
  name: string;
  sail_number?: string;
  hull_number?: string;
  manufacturer?: string;
  year_built?: number;
  hull_material?: string;
  is_primary?: boolean;
  home_club_id?: string;
  storage_location?: string;
  ownership_type?: 'owned' | 'co_owned' | 'chartered' | 'club_boat' | 'crew';
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
}

export interface UpdateBoatInput {
  name?: string;
  sail_number?: string;
  hull_number?: string;
  manufacturer?: string;
  year_built?: number;
  hull_material?: string;
  is_primary?: boolean;
  status?: 'active' | 'stored' | 'sold' | 'retired';
  home_club_id?: string;
  storage_location?: string;
  ownership_type?: 'owned' | 'co_owned' | 'chartered' | 'club_boat' | 'crew';
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

const logger = createLogger('SailorBoatService');
const BOATS_COLLECTION = 'sailor_boats';
export class SailorBoatService {
  /**
   * Get all boats for a sailor
   */
  async listBoatsForSailor(sailorId: string): Promise<SailorBoat[]> {

    const { data, error } = await supabase
      .from('sailor_boats')
      .select(`
        *,
        boat_class:boat_classes(id, name, class_association)
      `)
      .eq('sailor_id', sailorId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {

      throw error;
    }

    return data || [];
  }

  /**
   * Get boats for a sailor filtered by class
   */
  async listBoatsForSailorClass(sailorId: string, classId: string): Promise<SailorBoat[]> {

    const { data, error } = await supabase
      .from('sailor_boats')
      .select(`
        *,
        boat_class:boat_classes(id, name, class_association)
      `)
      .eq('sailor_id', sailorId)
      .eq('class_id', classId)
      .order('is_primary', { ascending: false });

    if (error) {

      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific boat by ID
   */
  async getBoat(boatId: string): Promise<SailorBoat | null> {

    const { data, error } = await supabase
      .from('sailor_boats')
      .select(`
        *,
        boat_class:boat_classes(id, name, class_association)
      `)
      .eq('id', boatId)
      .single();

    if (error) {

      return null;
    }

    return data;
  }

  /**
   * Get the primary boat for a sailor in a specific class
   */
  async getPrimaryBoat(sailorId: string, classId: string): Promise<SailorBoat | null> {

    const { data, error } = await supabase
      .from('sailor_boats')
      .select(`
        *,
        boat_class:boat_classes(id, name, class_association)
      `)
      .eq('sailor_id', sailorId)
      .eq('class_id', classId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK

    }

    return data || null;
  }

  /**
   * Create a new boat
   */
  async createBoat(input: CreateBoatInput): Promise<SailorBoat> {
    try {
      return await this.createBoatDirect(input);
    } catch (error: any) {
      logger.warn('Error creating boat, queueing for offline sync', error);

      await MutationQueueService.enqueueMutation(BOATS_COLLECTION, 'upsert', {
        action: 'create',
        input,
      });

      const nowIso = new Date().toISOString();
      const fallback: SailorBoat = {
        id: `local_boat_${Date.now()}`,
        sailor_id: input.sailor_id,
        class_id: input.class_id,
        name: input.name,
        sail_number: input.sail_number,
        hull_number: input.hull_number,
        manufacturer: input.manufacturer,
        year_built: input.year_built,
        hull_material: input.hull_material,
        is_primary: Boolean(input.is_primary),
        status: 'active',
        home_club_id: input.home_club_id,
        storage_location: input.storage_location,
        ownership_type: input.ownership_type,
        purchase_date: input.purchase_date,
        purchase_price: input.purchase_price,
        notes: input.notes,
        metadata: undefined,
        created_at: nowIso,
        updated_at: nowIso,
        boat_class: undefined,
        home_club: undefined,
        queuedForSync: true,
        offlineOperation: 'create',
      };

      const offlineError: any = new Error('Boat creation queued for sync');
      offlineError.queuedForSync = true;
      offlineError.entity = fallback;
      offlineError.originalError = error;
      offlineError.operation = 'createBoat';
      throw offlineError;
    }
  }

  async createBoatDirect(input: CreateBoatInput): Promise<SailorBoat> {

    const { data, error } = await supabase
      .from('sailor_boats')
      .insert({
        ...input,
        status: 'active',
      })
      .select(`
        *,
        boat_class:boat_classes(id, name, class_association)
      `)
      .single();

    if (error) {

      throw error;
    }

    return data;
  }

  /**
   * Update a boat
   */
  async updateBoat(boatId: string, input: UpdateBoatInput): Promise<SailorBoat> {
    try {
      return await this.updateBoatDirect(boatId, input);
    } catch (error: any) {
      logger.warn('Error updating boat, queueing for offline sync', error);

      await MutationQueueService.enqueueMutation(BOATS_COLLECTION, 'upsert', {
        action: 'update',
        boatId,
        input,
      });

      const offlineError: any = new Error('Boat update queued for sync');
      offlineError.queuedForSync = true;
      offlineError.entity = {
        id: boatId,
        updates: input,
        queuedForSync: true,
        offlineOperation: 'update',
      };
      offlineError.originalError = error;
      offlineError.operation = 'updateBoat';
      throw offlineError;
    }
  }

  async updateBoatDirect(boatId: string, input: UpdateBoatInput): Promise<SailorBoat> {

    const { data, error } = await supabase
      .from('sailor_boats')
      .update(input)
      .eq('id', boatId)
      .select(`
        *,
        boat_class:boat_classes(id, name, class_association)
      `)
      .single();

    if (error) {

      throw error;
    }

    return data;
  }

  /**
   * Set a boat as primary for its class
   */
  async setPrimaryBoat(boatId: string): Promise<void> {

    // First, get the boat to know which sailor and class we're working with
    const { data: boat, error: fetchError } = await supabase
      .from('sailor_boats')
      .select('sailor_id, class_id')
      .eq('id', boatId)
      .single();

    if (fetchError) {

      throw fetchError;
    }

    // Unset all primary boats for this sailor/class

    logger.debug('⭐ [SailorBoatService] Loaded boat for primary toggle', boat);

    const { data: previousPrimaries, error: unsetError } = await supabase
      .from('sailor_boats')
      .update({ is_primary: false })
      .eq('sailor_id', boat.sailor_id)
      .neq('id', boatId)
      .select('id, name');
    logger.debug('⭐ [SailorBoatService] Clearing existing primaries for sailor', {
      sailorId: boat.sailor_id,
      targetBoatId: boatId,
      cleared: previousPrimaries?.map((p: any) => p.id) ?? [],
    });

    if (unsetError) {

      throw unsetError;
    }
    logger.debug('⭐ [SailorBoatService] Cleared previous primary boats');

    // Set the selected boat as primary
    logger.debug('⭐ [SailorBoatService] Setting boat as primary...');
    const { error: setError } = await supabase
      .from('sailor_boats')
      .update({ is_primary: true })
      .eq('id', boatId);

    if (setError) {

      throw setError;
    }
    logger.debug('⭐ [SailorBoatService] Primary boat updated successfully');

  }

  /**
   * Delete a boat
   */
  async deleteBoat(boatId: string): Promise<void> {
    try {
      await this.deleteBoatDirect(boatId);
    } catch (error: any) {
      logger.warn('Error deleting boat, queueing for offline sync', error);

      await MutationQueueService.enqueueMutation(BOATS_COLLECTION, 'delete', {
        action: 'delete',
        boatId,
      });

      const offlineError: any = new Error('Boat deletion queued for sync');
      offlineError.queuedForSync = true;
      offlineError.entity = { id: boatId };
      offlineError.originalError = error;
      offlineError.operation = 'deleteBoat';
      throw offlineError;
    }
  }

  async deleteBoatDirect(boatId: string): Promise<void> {
    const { error } = await supabase
      .from('sailor_boats')
      .delete()
      .eq('id', boatId);

    if (error) {
      console.error('Error deleting boat:', error);
      throw error;
    }
  }

  /**
   * Get equipment for a specific boat
   */
  async getBoatEquipment(boatId: string) {
    const { data, error } = await supabase
      .from('boat_equipment')
      .select('*')
      .eq('boat_id', boatId)
      .order('category');

    if (error) {
      console.error('Error fetching boat equipment:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get crew for a specific boat
   */
  async getBoatCrew(boatId: string) {
    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('boat_id', boatId)
      .order('role');

    if (error) {
      console.error('Error fetching boat crew:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get tuning settings for a specific boat
   */
  async getBoatTuningSettings(boatId: string) {
    const { data, error } = await supabase
      .from('boat_tuning_settings')
      .select('*')
      .eq('boat_id', boatId)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching boat tuning settings:', error);
      throw error;
    }

    return data || [];
  }
}

export const sailorBoatService = new SailorBoatService();

export function initializeBoatMutationHandlers() {
  MutationQueueService.registerHandler(BOATS_COLLECTION, {
    upsert: async (payload: any) => {
      switch (payload?.action) {
        case 'create':
          await sailorBoatService.createBoatDirect(payload.input);
          break;
        case 'update':
          await sailorBoatService.updateBoatDirect(payload.boatId, payload.input || {});
          break;
        default:
          logger.warn('Unhandled boat upsert action', payload?.action);
      }
    },
    delete: async (payload: any) => {
      if (payload?.action === 'delete' && payload.boatId) {
        await sailorBoatService.deleteBoatDirect(payload.boatId);
      } else {
        logger.warn('Unhandled boat delete action', payload?.action);
      }
    },
  });
}
