/**
 * DemoStateService — Manages interactive state for demo races
 *
 * Stores user interactions with demo races separately from real race data.
 * This includes checklist completions, notes, debrief entries, etc.
 * All demo state uses a 'demo_' prefix for easy identification and cleanup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('DemoStateService');

// AsyncStorage key prefixes
const DEMO_CHECKLIST_PREFIX = 'demo_checklist_';
const DEMO_NOTES_PREFIX = 'demo_notes_';
const DEMO_DEBRIEF_PREFIX = 'demo_debrief_';
const DEMO_STRATEGY_PREFIX = 'demo_strategy_';
const DEMO_SAIL_SELECTION_PREFIX = 'demo_sail_selection_';
const DEMO_RIG_SETTINGS_PREFIX = 'demo_rig_settings_';
const DEMO_FIRST_REAL_RACE_KEY = 'demo_first_real_race_added';

/**
 * Checklist item with completion state
 */
export interface DemoChecklistItem {
  id: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

/**
 * Debrief entry for demo race
 */
export interface DemoDebriefEntry {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

/**
 * Strategy notes for demo race
 */
export interface DemoStrategyNotes {
  startPlan?: string;
  firstBeat?: string;
  upwind?: string;
  downwind?: string;
  overallIntention?: string;
  updatedAt: string;
}

/**
 * Sail selection for demo race
 */
export interface DemoSailSelection {
  mainsailId?: string;
  jibId?: string;
  spinnakerId?: string;
  notes?: string;
  updatedAt: string;
}

/**
 * Rig settings for demo race
 */
export interface DemoRigSettings {
  presetId?: string;
  customSettings?: Record<string, string>;
  notes?: string;
  updatedAt: string;
}

/**
 * Complete demo race state
 */
export interface DemoRaceState {
  raceId: string;
  checklist: DemoChecklistItem[];
  notes: string;
  debrief: DemoDebriefEntry[];
  strategy: DemoStrategyNotes | null;
  sailSelection: DemoSailSelection | null;
  rigSettings: DemoRigSettings | null;
  lastUpdated: string;
}

export class DemoStateService {
  private static cache: Map<string, DemoRaceState> = new Map();

  // ============================================================================
  // Checklist Methods
  // ============================================================================

  /**
   * Save checklist state for a demo race
   */
  static async saveDemoChecklist(raceId: string, items: DemoChecklistItem[]): Promise<void> {
    try {
      const key = `${DEMO_CHECKLIST_PREFIX}${raceId}`;
      await AsyncStorage.setItem(key, JSON.stringify(items));

      // Update cache
      const state = this.cache.get(raceId) || this.createEmptyState(raceId);
      state.checklist = items;
      state.lastUpdated = new Date().toISOString();
      this.cache.set(raceId, state);

      logger.debug('[DemoStateService] Saved checklist for race:', raceId);
    } catch (error) {
      logger.error('[DemoStateService] Failed to save checklist', error);
    }
  }

  /**
   * Get checklist state for a demo race
   */
  static async getDemoChecklist(raceId: string): Promise<DemoChecklistItem[]> {
    try {
      // Check cache first
      const cached = this.cache.get(raceId);
      if (cached?.checklist.length) {
        return cached.checklist;
      }

      const key = `${DEMO_CHECKLIST_PREFIX}${raceId}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const items = JSON.parse(raw) as DemoChecklistItem[];

        // Update cache
        const state = this.cache.get(raceId) || this.createEmptyState(raceId);
        state.checklist = items;
        this.cache.set(raceId, state);

        return items;
      }
      return [];
    } catch (error) {
      logger.error('[DemoStateService] Failed to get checklist', error);
      return [];
    }
  }

  /**
   * Toggle a checklist item for a demo race
   */
  static async toggleChecklistItem(raceId: string, itemId: string): Promise<DemoChecklistItem[]> {
    const items = await this.getDemoChecklist(raceId);
    const existingItem = items.find(i => i.id === itemId);

    if (existingItem) {
      existingItem.completed = !existingItem.completed;
      existingItem.completedAt = existingItem.completed ? new Date().toISOString() : undefined;
    } else {
      items.push({
        id: itemId,
        completed: true,
        completedAt: new Date().toISOString(),
      });
    }

    await this.saveDemoChecklist(raceId, items);
    return items;
  }

  // ============================================================================
  // Notes Methods
  // ============================================================================

  /**
   * Save notes for a demo race
   */
  static async saveDemoNotes(raceId: string, notes: string): Promise<void> {
    try {
      const key = `${DEMO_NOTES_PREFIX}${raceId}`;
      await AsyncStorage.setItem(key, notes);

      // Update cache
      const state = this.cache.get(raceId) || this.createEmptyState(raceId);
      state.notes = notes;
      state.lastUpdated = new Date().toISOString();
      this.cache.set(raceId, state);

      logger.debug('[DemoStateService] Saved notes for race:', raceId);
    } catch (error) {
      logger.error('[DemoStateService] Failed to save notes', error);
    }
  }

  /**
   * Get notes for a demo race
   */
  static async getDemoNotes(raceId: string): Promise<string> {
    try {
      const cached = this.cache.get(raceId);
      if (cached?.notes) {
        return cached.notes;
      }

      const key = `${DEMO_NOTES_PREFIX}${raceId}`;
      const notes = await AsyncStorage.getItem(key);
      return notes || '';
    } catch (error) {
      logger.error('[DemoStateService] Failed to get notes', error);
      return '';
    }
  }

  // ============================================================================
  // Debrief Methods
  // ============================================================================

  /**
   * Save debrief entries for a demo race
   */
  static async saveDemoDebrief(raceId: string, entries: DemoDebriefEntry[]): Promise<void> {
    try {
      const key = `${DEMO_DEBRIEF_PREFIX}${raceId}`;
      await AsyncStorage.setItem(key, JSON.stringify(entries));

      // Update cache
      const state = this.cache.get(raceId) || this.createEmptyState(raceId);
      state.debrief = entries;
      state.lastUpdated = new Date().toISOString();
      this.cache.set(raceId, state);

      logger.debug('[DemoStateService] Saved debrief for race:', raceId);
    } catch (error) {
      logger.error('[DemoStateService] Failed to save debrief', error);
    }
  }

  /**
   * Get debrief entries for a demo race
   */
  static async getDemoDebrief(raceId: string): Promise<DemoDebriefEntry[]> {
    try {
      const cached = this.cache.get(raceId);
      if (cached?.debrief.length) {
        return cached.debrief;
      }

      const key = `${DEMO_DEBRIEF_PREFIX}${raceId}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as DemoDebriefEntry[];
      }
      return [];
    } catch (error) {
      logger.error('[DemoStateService] Failed to get debrief', error);
      return [];
    }
  }

  /**
   * Add a debrief entry for a demo race
   */
  static async addDebriefEntry(raceId: string, question: string, answer: string): Promise<DemoDebriefEntry[]> {
    const entries = await this.getDemoDebrief(raceId);
    const newEntry: DemoDebriefEntry = {
      id: `debrief_${Date.now()}`,
      question,
      answer,
      createdAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    await this.saveDemoDebrief(raceId, entries);
    return entries;
  }

  // ============================================================================
  // Strategy Methods
  // ============================================================================

  /**
   * Save strategy notes for a demo race
   */
  static async saveDemoStrategy(raceId: string, strategy: DemoStrategyNotes): Promise<void> {
    try {
      const key = `${DEMO_STRATEGY_PREFIX}${raceId}`;
      await AsyncStorage.setItem(key, JSON.stringify(strategy));

      // Update cache
      const state = this.cache.get(raceId) || this.createEmptyState(raceId);
      state.strategy = strategy;
      state.lastUpdated = new Date().toISOString();
      this.cache.set(raceId, state);

      logger.debug('[DemoStateService] Saved strategy for race:', raceId);
    } catch (error) {
      logger.error('[DemoStateService] Failed to save strategy', error);
    }
  }

  /**
   * Get strategy notes for a demo race
   */
  static async getDemoStrategy(raceId: string): Promise<DemoStrategyNotes | null> {
    try {
      const cached = this.cache.get(raceId);
      if (cached?.strategy) {
        return cached.strategy;
      }

      const key = `${DEMO_STRATEGY_PREFIX}${raceId}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as DemoStrategyNotes;
      }
      return null;
    } catch (error) {
      logger.error('[DemoStateService] Failed to get strategy', error);
      return null;
    }
  }

  // ============================================================================
  // Sail Selection Methods
  // ============================================================================

  /**
   * Save sail selection for a demo race
   */
  static async saveDemoSailSelection(raceId: string, selection: DemoSailSelection): Promise<void> {
    try {
      const key = `${DEMO_SAIL_SELECTION_PREFIX}${raceId}`;
      await AsyncStorage.setItem(key, JSON.stringify(selection));

      // Update cache
      const state = this.cache.get(raceId) || this.createEmptyState(raceId);
      state.sailSelection = selection;
      state.lastUpdated = new Date().toISOString();
      this.cache.set(raceId, state);

      logger.debug('[DemoStateService] Saved sail selection for race:', raceId);
    } catch (error) {
      logger.error('[DemoStateService] Failed to save sail selection', error);
    }
  }

  /**
   * Get sail selection for a demo race
   */
  static async getDemoSailSelection(raceId: string): Promise<DemoSailSelection | null> {
    try {
      const cached = this.cache.get(raceId);
      if (cached?.sailSelection) {
        return cached.sailSelection;
      }

      const key = `${DEMO_SAIL_SELECTION_PREFIX}${raceId}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as DemoSailSelection;
      }
      return null;
    } catch (error) {
      logger.error('[DemoStateService] Failed to get sail selection', error);
      return null;
    }
  }

  // ============================================================================
  // Rig Settings Methods
  // ============================================================================

  /**
   * Save rig settings for a demo race
   */
  static async saveDemoRigSettings(raceId: string, settings: DemoRigSettings): Promise<void> {
    try {
      const key = `${DEMO_RIG_SETTINGS_PREFIX}${raceId}`;
      await AsyncStorage.setItem(key, JSON.stringify(settings));

      // Update cache
      const state = this.cache.get(raceId) || this.createEmptyState(raceId);
      state.rigSettings = settings;
      state.lastUpdated = new Date().toISOString();
      this.cache.set(raceId, state);

      logger.debug('[DemoStateService] Saved rig settings for race:', raceId);
    } catch (error) {
      logger.error('[DemoStateService] Failed to save rig settings', error);
    }
  }

  /**
   * Get rig settings for a demo race
   */
  static async getDemoRigSettings(raceId: string): Promise<DemoRigSettings | null> {
    try {
      const cached = this.cache.get(raceId);
      if (cached?.rigSettings) {
        return cached.rigSettings;
      }

      const key = `${DEMO_RIG_SETTINGS_PREFIX}${raceId}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as DemoRigSettings;
      }
      return null;
    } catch (error) {
      logger.error('[DemoStateService] Failed to get rig settings', error);
      return null;
    }
  }

  // ============================================================================
  // Full State Methods
  // ============================================================================

  /**
   * Get complete demo race state
   */
  static async getDemoRaceState(raceId: string): Promise<DemoRaceState> {
    const [checklist, notes, debrief, strategy, sailSelection, rigSettings] = await Promise.all([
      this.getDemoChecklist(raceId),
      this.getDemoNotes(raceId),
      this.getDemoDebrief(raceId),
      this.getDemoStrategy(raceId),
      this.getDemoSailSelection(raceId),
      this.getDemoRigSettings(raceId),
    ]);

    return {
      raceId,
      checklist,
      notes,
      debrief,
      strategy,
      sailSelection,
      rigSettings,
      lastUpdated: new Date().toISOString(),
    };
  }

  // ============================================================================
  // First Real Race Tracking
  // ============================================================================

  /**
   * Mark that the user has added their first real race
   * This will cause demo races to be hidden
   */
  static async markFirstRealRaceAdded(): Promise<void> {
    try {
      await AsyncStorage.setItem(DEMO_FIRST_REAL_RACE_KEY, new Date().toISOString());
      logger.debug('[DemoStateService] Marked first real race added');
    } catch (error) {
      logger.error('[DemoStateService] Failed to mark first real race', error);
    }
  }

  /**
   * Check if user has added a real race (demo races should be hidden)
   */
  static async hasAddedRealRace(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(DEMO_FIRST_REAL_RACE_KEY);
      return value !== null;
    } catch (error) {
      logger.error('[DemoStateService] Failed to check first real race', error);
      return false;
    }
  }

  /**
   * Reset first real race tracking (for testing)
   */
  static async resetFirstRealRace(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEMO_FIRST_REAL_RACE_KEY);
      logger.debug('[DemoStateService] Reset first real race tracking');
    } catch (error) {
      logger.error('[DemoStateService] Failed to reset first real race', error);
    }
  }

  // ============================================================================
  // Cleanup Methods
  // ============================================================================

  /**
   * Clear all demo state (called when user adds first real race or signs out)
   */
  static async clearAllDemoState(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const demoKeys = allKeys.filter(key =>
        key.startsWith(DEMO_CHECKLIST_PREFIX) ||
        key.startsWith(DEMO_NOTES_PREFIX) ||
        key.startsWith(DEMO_DEBRIEF_PREFIX) ||
        key.startsWith(DEMO_STRATEGY_PREFIX) ||
        key.startsWith(DEMO_SAIL_SELECTION_PREFIX) ||
        key.startsWith(DEMO_RIG_SETTINGS_PREFIX)
      );

      if (demoKeys.length > 0) {
        await AsyncStorage.multiRemove(demoKeys);
      }

      this.cache.clear();
      logger.debug('[DemoStateService] Cleared all demo state');
    } catch (error) {
      logger.error('[DemoStateService] Failed to clear demo state', error);
    }
  }

  /**
   * Clear demo state for a specific race
   */
  static async clearDemoRaceState(raceId: string): Promise<void> {
    try {
      const keys = [
        `${DEMO_CHECKLIST_PREFIX}${raceId}`,
        `${DEMO_NOTES_PREFIX}${raceId}`,
        `${DEMO_DEBRIEF_PREFIX}${raceId}`,
        `${DEMO_STRATEGY_PREFIX}${raceId}`,
        `${DEMO_SAIL_SELECTION_PREFIX}${raceId}`,
        `${DEMO_RIG_SETTINGS_PREFIX}${raceId}`,
      ];

      await AsyncStorage.multiRemove(keys);
      this.cache.delete(raceId);

      logger.debug('[DemoStateService] Cleared demo state for race:', raceId);
    } catch (error) {
      logger.error('[DemoStateService] Failed to clear race state', error);
    }
  }

  /**
   * Clear the cache (useful when user signs out)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private static createEmptyState(raceId: string): DemoRaceState {
    return {
      raceId,
      checklist: [],
      notes: '',
      debrief: [],
      strategy: null,
      sailSelection: null,
      rigSettings: null,
      lastUpdated: new Date().toISOString(),
    };
  }
}
