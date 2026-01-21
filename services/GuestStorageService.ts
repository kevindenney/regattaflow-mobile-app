import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { v4 as uuid } from 'uuid';

const GUEST_RACE_KEY = '@regattaflow/guest_race';
const PENDING_RACE_KEY = '@regattaflow/pending_race';
const FIRST_LAUNCH_KEY = '@regattaflow/first_launch';
const ONBOARDING_COMPLETE_KEY = '@regattaflow/onboarding_complete';

export interface GuestRace {
  id: string;
  name: string;
  start_date: string;
  venue: string;
  latitude?: number;
  longitude?: number;
  race_type?: 'fleet' | 'distance' | 'match' | 'team';
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * Service for managing guest (non-authenticated) user data
 * Stores race data locally in AsyncStorage and handles migration to Supabase on signup
 */
export class GuestStorageService {
  /**
   * Get the guest's locally stored race
   * @returns The guest race or null if none exists
   */
  static async getGuestRace(): Promise<GuestRace | null> {
    try {
      const data = await AsyncStorage.getItem(GUEST_RACE_KEY);
      if (!data) return null;
      return JSON.parse(data) as GuestRace;
    } catch (error) {
      console.error('[GuestStorageService] Error getting guest race:', error);
      return null;
    }
  }

  /**
   * Save a race for the guest user
   * Note: Only ONE race can be stored - this overwrites any existing race
   * @param race The race data to save
   */
  static async saveGuestRace(race: GuestRace): Promise<void> {
    try {
      const raceWithId: GuestRace = {
        ...race,
        id: race.id || uuid(),
        created_at: race.created_at || new Date().toISOString(),
      };
      await AsyncStorage.setItem(GUEST_RACE_KEY, JSON.stringify(raceWithId));
    } catch (error) {
      console.error('[GuestStorageService] Error saving guest race:', error);
      throw new Error('Failed to save race locally');
    }
  }

  /**
   * Check if the guest already has a race stored
   * Used to enforce the one-race limit for guests
   */
  static async hasGuestRace(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(GUEST_RACE_KEY);
      return data !== null;
    } catch (error) {
      console.error('[GuestStorageService] Error checking guest race:', error);
      return false;
    }
  }

  /**
   * Clear all guest data (race, onboarding state)
   * Called after successful migration or logout
   */
  static async clearGuestData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        GUEST_RACE_KEY,
        ONBOARDING_COMPLETE_KEY,
      ]);
    } catch (error) {
      console.error('[GuestStorageService] Error clearing guest data:', error);
    }
  }

  /**
   * Migrate the guest's race to their new account
   * @param userId The authenticated user's ID
   * @returns The new race ID in Supabase
   */
  static async migrateToAccount(userId: string): Promise<string | null> {
    try {
      const guestRace = await this.getGuestRace();
      if (!guestRace) {
        return null;
      }

      // Insert the race into the regattas table
      const { data, error } = await supabase
        .from('regattas')
        .insert({
          name: guestRace.name,
          start_date: guestRace.start_date,
          created_by: userId,
          status: 'upcoming',
          race_type: guestRace.race_type || 'fleet',
          latitude: guestRace.latitude,
          longitude: guestRace.longitude,
          metadata: {
            ...guestRace.metadata,
            migrated_from_guest: true,
            original_guest_id: guestRace.id,
            guest_created_at: guestRace.created_at,
          },
        })
        .select('id')
        .single();

      if (error) {
        console.error('[GuestStorageService] Migration error:', error);
        throw new Error('Failed to migrate race to account');
      }

      // Clear local guest data after successful migration
      await this.clearGuestData();

      return data.id;
    } catch (error) {
      console.error('[GuestStorageService] Migration failed:', error);
      throw error;
    }
  }

  // ==================== Pending Race (during auth flow) ====================

  /**
   * Save a pending race that the user was trying to create when prompted to sign up
   * This preserves the race data during the authentication flow
   * @param race The race data to save as pending
   */
  static async savePendingRace(race: GuestRace): Promise<void> {
    try {
      const raceWithId: GuestRace = {
        ...race,
        id: race.id || uuid(),
        created_at: race.created_at || new Date().toISOString(),
      };
      await AsyncStorage.setItem(PENDING_RACE_KEY, JSON.stringify(raceWithId));
    } catch (error) {
      console.error('[GuestStorageService] Error saving pending race:', error);
      throw new Error('Failed to save pending race');
    }
  }

  /**
   * Get the pending race that was saved during signup prompt
   * @returns The pending race or null if none exists
   */
  static async getPendingRace(): Promise<GuestRace | null> {
    try {
      const data = await AsyncStorage.getItem(PENDING_RACE_KEY);
      if (!data) return null;
      return JSON.parse(data) as GuestRace;
    } catch (error) {
      console.error('[GuestStorageService] Error getting pending race:', error);
      return null;
    }
  }

  /**
   * Clear the pending race data (after successful migration or cancellation)
   */
  static async clearPendingRace(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PENDING_RACE_KEY);
    } catch (error) {
      console.error('[GuestStorageService] Error clearing pending race:', error);
    }
  }

  /**
   * Migrate the pending race to the user's account
   * @param userId The authenticated user's ID
   * @returns The new race ID in Supabase
   */
  static async migratePendingRaceToAccount(userId: string): Promise<string | null> {
    try {
      const pendingRace = await this.getPendingRace();
      if (!pendingRace) {
        return null;
      }

      // Insert the race into the regattas table
      const { data, error } = await supabase
        .from('regattas')
        .insert({
          name: pendingRace.name,
          start_date: pendingRace.start_date,
          created_by: userId,
          status: 'upcoming',
          race_type: pendingRace.race_type || 'fleet',
          latitude: pendingRace.latitude,
          longitude: pendingRace.longitude,
          metadata: {
            ...pendingRace.metadata,
            migrated_from_pending: true,
            original_pending_id: pendingRace.id,
            pending_created_at: pendingRace.created_at,
          },
        })
        .select('id')
        .single();

      if (error) {
        console.error('[GuestStorageService] Pending race migration error:', error);
        throw new Error('Failed to migrate pending race to account');
      }

      // Clear pending race data after successful migration
      await this.clearPendingRace();

      return data.id;
    } catch (error) {
      console.error('[GuestStorageService] Pending race migration failed:', error);
      throw error;
    }
  }

  // ==================== Onboarding State ====================

  /**
   * Check if this is the user's first launch
   */
  static async isFirstLaunch(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      return value === null;
    } catch {
      return true;
    }
  }

  /**
   * Mark that the app has been launched before
   */
  static async markLaunched(): Promise<void> {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, new Date().toISOString());
    } catch (error) {
      console.error('[GuestStorageService] Error marking launched:', error);
    }
  }

  /**
   * Check if onboarding tips have been dismissed
   */
  static async isOnboardingComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark onboarding as complete (user dismissed tips)
   */
  static async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('[GuestStorageService] Error completing onboarding:', error);
    }
  }
}
