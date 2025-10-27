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

export class SailorBoatService {
  /**
   * Get all boats for a sailor
   */
  async listBoatsForSailor(sailorId: string): Promise<SailorBoat[]> {
    console.log('🔍 [SailorBoatService] Fetching boats for sailor:', sailorId);

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
      console.error('❌ [SailorBoatService] Error fetching sailor boats:', error);
      throw error;
    }

    console.log(`✅ [SailorBoatService] Successfully fetched ${data?.length || 0} boats`);
    console.log('📊 [SailorBoatService] Boat data:', JSON.stringify(data, null, 2));

    return data || [];
  }

  /**
   * Get boats for a sailor filtered by class
   */
  async listBoatsForSailorClass(sailorId: string, classId: string): Promise<SailorBoat[]> {
    console.log('🔍 [SailorBoatService] Fetching boats for sailor/class:', { sailorId, classId });

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
      console.error('❌ [SailorBoatService] Error fetching class boats:', error);
      throw error;
    }

    console.log(`✅ [SailorBoatService] Successfully fetched ${data?.length || 0} class boats`);

    return data || [];
  }

  /**
   * Get a specific boat by ID
   */
  async getBoat(boatId: string): Promise<SailorBoat | null> {
    console.log('🔍 [SailorBoatService] Fetching boat:', boatId);

    const { data, error } = await supabase
      .from('sailor_boats')
      .select(`
        *,
        boat_class:boat_classes(id, name, class_association)
      `)
      .eq('id', boatId)
      .single();

    if (error) {
      console.error('❌ [SailorBoatService] Error fetching boat:', error);
      return null;
    }

    console.log('✅ [SailorBoatService] Successfully fetched boat:', data);

    return data;
  }

  /**
   * Get the primary boat for a sailor in a specific class
   */
  async getPrimaryBoat(sailorId: string, classId: string): Promise<SailorBoat | null> {
    console.log('🔍 [SailorBoatService] Fetching primary boat:', { sailorId, classId });

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
      console.error('❌ [SailorBoatService] Error fetching primary boat:', error);
    }

    console.log('✅ [SailorBoatService] Primary boat result:', data || 'none');

    return data || null;
  }

  /**
   * Create a new boat
   */
  async createBoat(input: CreateBoatInput): Promise<SailorBoat> {
    console.log('🔍 [SailorBoatService] Creating boat:', input);

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
      console.error('❌ [SailorBoatService] Error creating boat:', error);
      throw error;
    }

    console.log('✅ [SailorBoatService] Successfully created boat:', data);

    return data;
  }

  /**
   * Update a boat
   */
  async updateBoat(boatId: string, input: UpdateBoatInput): Promise<SailorBoat> {
    console.log('🔍 [SailorBoatService] Updating boat:', { boatId, input });

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
      console.error('❌ [SailorBoatService] Error updating boat:', error);
      throw error;
    }

    console.log('✅ [SailorBoatService] Successfully updated boat:', data);

    return data;
  }

  /**
   * Set a boat as primary for its class
   */
  async setPrimaryBoat(boatId: string): Promise<void> {
    console.log('🔍 [SailorBoatService] Setting primary boat:', boatId);

    // First, get the boat to know which sailor and class we're working with
    const { data: boat, error: fetchError } = await supabase
      .from('sailor_boats')
      .select('sailor_id, class_id')
      .eq('id', boatId)
      .single();

    if (fetchError) {
      console.error('❌ [SailorBoatService] Error fetching boat:', fetchError);
      throw fetchError;
    }

    console.log('📊 [SailorBoatService] Boat details:', boat);

    // Unset all primary boats for this sailor/class
    console.log('🔄 [SailorBoatService] Unsetting all primary boats for sailor/class...');
    const { error: unsetError } = await supabase
      .from('sailor_boats')
      .update({ is_primary: false })
      .eq('sailor_id', boat.sailor_id)
      .eq('class_id', boat.class_id);

    if (unsetError) {
      console.error('❌ [SailorBoatService] Error unsetting primary boats:', unsetError);
      throw unsetError;
    }

    // Set the selected boat as primary
    console.log('⭐ [SailorBoatService] Setting boat as primary...');
    const { error: setError } = await supabase
      .from('sailor_boats')
      .update({ is_primary: true })
      .eq('id', boatId);

    if (setError) {
      console.error('❌ [SailorBoatService] Error setting primary boat:', setError);
      throw setError;
    }

    console.log('✅ [SailorBoatService] Successfully set primary boat');
  }

  /**
   * Delete a boat
   */
  async deleteBoat(boatId: string): Promise<void> {
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
