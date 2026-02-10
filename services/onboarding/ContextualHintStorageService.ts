/**
 * ContextualHintStorageService — AsyncStorage persistence for contextual hints
 *
 * Tracks which hints the user has dismissed. Migrates the legacy tour key
 * so returning users don't see hints for things the old tour already covered.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HINT_IDS, type HintId } from '@/lib/contextual-hints';

const STORAGE_KEY = 'regattaflow_contextual_hints_v1';
const LEGACY_TOUR_KEY = 'regattaflow_sailor_tour_v1';

interface HintState {
  dismissed: Record<string, boolean>;
  migratedFromLegacy?: boolean;
}

export class ContextualHintStorageService {
  private static cache: HintState | null = null;

  /**
   * Load hint state from storage, migrating legacy tour data if needed.
   */
  static async loadHints(): Promise<HintState> {
    if (this.cache) return this.cache;

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cache = JSON.parse(raw) as HintState;
      } else {
        this.cache = { dismissed: {} };
      }

      // Migrate legacy tour completion → pre-dismiss equivalent hints
      if (!this.cache.migratedFromLegacy) {
        await this.migrateLegacyTour();
      }

      return this.cache;
    } catch {
      this.cache = { dismissed: {} };
      return this.cache;
    }
  }

  /**
   * Mark a hint as dismissed so it won't show again.
   */
  static async dismissHint(id: HintId): Promise<void> {
    const state = await this.loadHints();
    state.dismissed[id] = true;
    this.cache = state;
    await this.persist();
  }

  /**
   * Check if a hint has already been dismissed.
   */
  static async isHintDismissed(id: HintId): Promise<boolean> {
    const state = await this.loadHints();
    return !!state.dismissed[id];
  }

  /**
   * Reset all hints (useful for testing / support).
   */
  static async resetAllHints(): Promise<void> {
    this.cache = { dismissed: {}, migratedFromLegacy: true };
    await this.persist();
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private static async persist(): Promise<void> {
    if (!this.cache) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch {
      // Swallow — non-critical
    }
  }

  /**
   * If the user already completed the old 5-step modal tour, pre-dismiss
   * the hints that covered the same ground so they don't see them again.
   */
  private static async migrateLegacyTour(): Promise<void> {
    try {
      const legacyValue = await AsyncStorage.getItem(LEGACY_TOUR_KEY);
      if (legacyValue === 'true' || legacyValue === 'completed') {
        const state = this.cache ?? { dismissed: {} };

        // The old tour covered: timeline, add-race, race-cards, explore-tabs, get-started
        state.dismissed[HINT_IDS.RACES_ADD_BUTTON] = true;
        state.dismissed[HINT_IDS.RACES_SWIPE_CARDS] = true;
        state.dismissed[HINT_IDS.RACES_PREP_SECTION] = true;

        state.migratedFromLegacy = true;
        this.cache = state;
        await this.persist();
      } else {
        // No legacy tour found, just mark migration as done
        if (this.cache) {
          this.cache.migratedFromLegacy = true;
          await this.persist();
        }
      }
    } catch {
      // Non-critical
    }
  }
}
