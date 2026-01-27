/**
 * OnWater Helpers
 *
 * Helper functions for deriving displayable checklist items from
 * race preparation intentions for the On Water phase.
 */

import type {
  RaceIntentions,
  SailSelectionIntention,
  RigIntentions,
  StrategyNotes,
} from '@/types/raceIntentions';

// =============================================================================
// TYPES
// =============================================================================

/**
 * A displayable pre-departure item derived from intentions
 */
export interface PreDepartureItem {
  id: string;
  type: 'sail' | 'rig';
  label: string;
  detail?: string;
}

/**
 * A displayable racing strategy item derived from strategyNotes
 */
export interface RacingStrategyItem {
  id: string;
  category: StrategyCategory;
  label: string;
  value: string;
}

/**
 * Strategy categories for grouping
 */
export type StrategyCategory =
  | 'start'
  | 'upwind'
  | 'downwind'
  | 'markRounding'
  | 'finish';

/**
 * Grouped racing strategy items by category
 */
export interface GroupedRacingStrategy {
  start: RacingStrategyItem[];
  upwind: RacingStrategyItem[];
  downwind: RacingStrategyItem[];
  markRounding: RacingStrategyItem[];
  finish: RacingStrategyItem[];
}

/**
 * Category display configuration
 */
export interface CategoryDisplayConfig {
  label: string;
  color: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Mapping of strategy note keys to user-friendly labels
 */
const STRATEGY_KEY_LABELS: Record<string, string> = {
  'start.lineBias': 'Line Bias',
  'start.favoredEnd': 'Favored End',
  'start.timingApproach': 'Timing Approach',
  'upwind.favoredTack': 'Favored Tack',
  'upwind.shiftStrategy': 'Shift Strategy',
  'upwind.laylineApproach': 'Layline Approach',
  'downwind.favoredGybe': 'Favored Gybe',
  'downwind.pressureStrategy': 'Pressure Strategy',
  'downwind.vmgApproach': 'VMG Approach',
  'markRounding.approach': 'Approach',
  'markRounding.exitStrategy': 'Exit Strategy',
  'markRounding.tacticalPosition': 'Tactical Position',
  'finish.lineBias': 'Line Bias',
  'finish.finalApproach': 'Final Approach',
};

/**
 * Category display configurations
 */
export const CATEGORY_DISPLAY_CONFIG: Record<StrategyCategory, CategoryDisplayConfig> = {
  start: { label: 'START STRATEGY', color: '#FF9500' }, // iOS orange
  upwind: { label: 'FIRST BEAT / UPWIND', color: '#007AFF' }, // iOS blue
  downwind: { label: 'DOWNWIND', color: '#34C759' }, // iOS green
  markRounding: { label: 'MARK ROUNDING', color: '#5856D6' }, // iOS purple
  finish: { label: 'FINISH', color: '#34C759' }, // iOS green
};

/**
 * Placeholder text for pre-start specification inputs
 */
const PRE_START_PLACEHOLDERS: Record<string, string> = {
  prestart_checkin: 'e.g., VHF 72 at -10 min',
  prestart_sailed_line: 'e.g., Pin to boat: 48 seconds',
  prestart_favored_end: 'e.g., Pin favored by 3 BL',
  prestart_miniature_course: 'e.g., Sailed windward-leeward leg',
  prestart_laylines: 'e.g., 280° port, 310° starboard',
  prestart_wind_patterns: 'e.g., 5° shifts every 8 min, left building',
  prestart_current: 'e.g., 0.5kt flood at pin, ebbing at RC',
  prestart_crew_roles: 'e.g., Bow: marks, Pit: kite',
  prestart_boat_check: 'e.g., All systems go, kite packed',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract pre-departure items from intentions
 * Returns sail selections and any adjusted rig settings
 */
export function derivePreDepartureItems(
  intentions: RaceIntentions | undefined
): PreDepartureItem[] {
  const items: PreDepartureItem[] = [];

  if (!intentions) return items;

  // Extract sail selections
  const sailSelection = intentions.sailSelection;
  if (sailSelection) {
    if (sailSelection.mainsailName) {
      items.push({
        id: 'sail_mainsail',
        type: 'sail',
        label: 'Mainsail',
        detail: sailSelection.mainsailName,
      });
    }
    if (sailSelection.jibName) {
      items.push({
        id: 'sail_jib',
        type: 'sail',
        label: 'Jib',
        detail: sailSelection.jibName,
      });
    }
    if (sailSelection.spinnakerName) {
      items.push({
        id: 'sail_spinnaker',
        type: 'sail',
        label: 'Spinnaker',
        detail: sailSelection.spinnakerName,
      });
    }
  }

  // Extract adjusted rig settings (only 'adjusted' status, not 'default' or 'monitoring')
  const rigIntentions = intentions.rigIntentions;
  if (rigIntentions?.settings) {
    for (const [settingKey, setting] of Object.entries(rigIntentions.settings)) {
      if (setting.status === 'adjusted' && setting.value) {
        items.push({
          id: `rig_${settingKey}`,
          type: 'rig',
          label: formatRigSettingLabel(settingKey),
          detail: setting.value,
        });
      }
    }
  }

  return items;
}

/**
 * Format rig setting key into user-friendly label
 */
function formatRigSettingLabel(key: string): string {
  const labels: Record<string, string> = {
    upper_shrouds: 'Upper Shrouds',
    lower_shrouds: 'Lower Shrouds',
    backstay: 'Backstay',
    forestay: 'Forestay',
    mast_rake: 'Mast Rake',
    mast_pre_bend: 'Mast Pre-bend',
    spreader_angle: 'Spreader Angle',
    jib_halyard: 'Jib Halyard',
    main_halyard: 'Main Halyard',
  };
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract racing strategy items from strategy notes
 */
export function deriveRacingStrategyItems(
  strategyNotes: StrategyNotes | undefined
): RacingStrategyItem[] {
  const items: RacingStrategyItem[] = [];

  if (!strategyNotes) return items;

  for (const [key, value] of Object.entries(strategyNotes)) {
    if (!value || typeof value !== 'string' || value.trim() === '') continue;

    const category = getCategoryFromKey(key);
    if (!category) continue;

    items.push({
      id: key,
      category,
      label: STRATEGY_KEY_LABELS[key] || formatStrategyKeyLabel(key),
      value: value.trim(),
    });
  }

  return items;
}

/**
 * Determine category from strategy note key
 */
function getCategoryFromKey(key: string): StrategyCategory | null {
  if (key.startsWith('start.')) return 'start';
  if (key.startsWith('upwind.')) return 'upwind';
  if (key.startsWith('downwind.')) return 'downwind';
  if (key.startsWith('markRounding.')) return 'markRounding';
  if (key.startsWith('finish.')) return 'finish';
  return null;
}

/**
 * Format strategy key into user-friendly label (fallback)
 */
function formatStrategyKeyLabel(key: string): string {
  const parts = key.split('.');
  const field = parts.length > 1 ? parts[parts.length - 1] : key;
  return field.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Group racing strategy items by category
 */
export function groupRacingStrategyByCategory(
  items: RacingStrategyItem[]
): GroupedRacingStrategy {
  const grouped: GroupedRacingStrategy = {
    start: [],
    upwind: [],
    downwind: [],
    markRounding: [],
    finish: [],
  };

  for (const item of items) {
    grouped[item.category].push(item);
  }

  return grouped;
}

/**
 * Get placeholder text for a pre-start checklist item
 */
export function getPreStartPlaceholder(itemId: string): string {
  return PRE_START_PLACEHOLDERS[itemId] || 'Add specification...';
}

/**
 * Check if there are any pre-departure items from intentions
 */
export function hasPreDepartureItems(intentions: RaceIntentions | undefined): boolean {
  return derivePreDepartureItems(intentions).length > 0;
}

/**
 * Check if there are any racing strategy items from strategy notes
 */
export function hasRacingStrategyItems(strategyNotes: StrategyNotes | undefined): boolean {
  return deriveRacingStrategyItems(strategyNotes).length > 0;
}

/**
 * Get all categories that have items
 */
export function getNonEmptyCategories(
  grouped: GroupedRacingStrategy
): StrategyCategory[] {
  const categories: StrategyCategory[] = ['start', 'upwind', 'downwind', 'markRounding', 'finish'];
  return categories.filter((cat) => grouped[cat].length > 0);
}
