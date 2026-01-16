/**
 * Historical Data Transformation Utilities
 *
 * Functions to transform RaceIntentions data into display-ready formats
 * for historical race phase views.
 */

import type {
  RaceIntentions,
  SailSelectionIntention,
  RigIntentions,
  ForecastIntention,
  ForecastSnapshot,
} from '@/types/raceIntentions';
import type { ChecklistCompletion, RacePhase, ChecklistCategory } from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';
import { CATEGORY_CONFIG } from '@/types/checklists';
import { getChecklistItems } from '@/lib/checklists/checklistConfig';

/**
 * Category summary for completion meters
 */
export interface CategorySummary {
  id: ChecklistCategory;
  name: string;
  completed: number;
  total: number;
  color: string;
}

/**
 * Formatted rig setting for display
 */
export interface FormattedRigSetting {
  label: string;
  value: string;
  notes?: string;
  status: 'default' | 'adjusted' | 'monitoring';
}

/**
 * Formatted sail selection for display
 */
export interface FormattedSailSelection {
  main?: string;
  jib?: string;
  spinnaker?: string;
  notes?: string;
  windContext?: string;
}

// =============================================================================
// CHECKLIST COMPLETIONS
// =============================================================================

/**
 * Summarize checklist completions by category for a given phase
 */
export function summarizeChecklistCompletions(
  completions: Record<string, ChecklistCompletion> | undefined,
  phase: RacePhase,
  raceType: RaceType
): CategorySummary[] {
  // Get all checklist items for this phase and race type
  const items = getChecklistItems(raceType, phase);

  // Group items by category
  const categoryItems = new Map<ChecklistCategory, string[]>();
  items.forEach((item) => {
    const existing = categoryItems.get(item.category) || [];
    existing.push(item.id);
    categoryItems.set(item.category, existing);
  });

  // Build summaries
  const summaries: CategorySummary[] = [];
  categoryItems.forEach((itemIds, category) => {
    const config = CATEGORY_CONFIG[category];
    const completed = itemIds.filter((id) => completions?.[id]).length;

    summaries.push({
      id: category,
      name: config.label,
      completed,
      total: itemIds.length,
      color: config.color,
    });
  });

  // Sort by total items (descending) to show most important first
  return summaries.sort((a, b) => b.total - a.total);
}

/**
 * Calculate overall phase completion percentage
 */
export function calculatePhaseProgress(
  completions: Record<string, ChecklistCompletion> | undefined,
  phase: RacePhase,
  raceType: RaceType
): number {
  const items = getChecklistItems(raceType, phase);
  if (items.length === 0) return 0;

  const completed = items.filter((item) => completions?.[item.id]).length;
  return Math.round((completed / items.length) * 100);
}

/**
 * Get list of completed items with their details
 */
export function getCompletedItems(
  completions: Record<string, ChecklistCompletion> | undefined,
  phase: RacePhase,
  raceType: RaceType
): Array<{
  id: string;
  label: string;
  category: ChecklistCategory;
  completedAt: string;
  notes?: string;
}> {
  if (!completions) return [];

  const items = getChecklistItems(raceType, phase);
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return Object.entries(completions)
    .filter(([id]) => {
      const item = itemMap.get(id);
      return item && item.phase === phase;
    })
    .map(([id, completion]) => {
      const item = itemMap.get(id)!;
      return {
        id,
        label: item.label,
        category: item.category,
        completedAt: completion.completedAt,
        notes: completion.notes,
      };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

// =============================================================================
// SAIL SELECTION
// =============================================================================

/**
 * Format sail selection into display-ready strings
 */
export function formatSailSelection(
  sailSelection: SailSelectionIntention | undefined
): FormattedSailSelection | null {
  if (!sailSelection) return null;

  const hasAnySelection =
    sailSelection.mainsail ||
    sailSelection.jib ||
    sailSelection.spinnaker ||
    sailSelection.mainsailName ||
    sailSelection.jibName ||
    sailSelection.spinnakerName;

  if (!hasAnySelection) return null;

  return {
    main: sailSelection.mainsailName || (sailSelection.mainsail ? 'Selected' : undefined),
    jib: sailSelection.jibName || (sailSelection.jib ? 'Selected' : undefined),
    spinnaker: sailSelection.spinnakerName || (sailSelection.spinnaker ? 'Selected' : undefined),
    notes: sailSelection.notes,
    windContext: sailSelection.windRangeContext,
  };
}

/**
 * Format sail selection as a compact single-line string
 */
export function formatSailSelectionCompact(
  sailSelection: SailSelectionIntention | undefined
): string | null {
  const formatted = formatSailSelection(sailSelection);
  if (!formatted) return null;

  const parts: string[] = [];
  if (formatted.main) parts.push(`Main: ${formatted.main}`);
  if (formatted.jib) parts.push(`Jib: ${formatted.jib}`);
  if (formatted.spinnaker) parts.push(`Spin: ${formatted.spinnaker}`);

  return parts.length > 0 ? parts.join(' | ') : null;
}

// =============================================================================
// RIG SETTINGS
// =============================================================================

/**
 * Human-readable labels for rig setting keys
 */
const RIG_SETTING_LABELS: Record<string, string> = {
  upper_shrouds: 'Uppers',
  lower_shrouds: 'Lowers',
  forestay: 'Forestay',
  backstay: 'Backstay',
  mast_rake: 'Rake',
  mast_pre_bend: 'Pre-bend',
  spreader_angle: 'Spreaders',
  headstay_tension: 'Headstay',
  shroud_base: 'Base',
  cunningham: 'Cunningham',
  outhaul: 'Outhaul',
  vang: 'Vang',
  traveler: 'Traveler',
};

/**
 * Format rig intentions into display-ready settings
 */
export function formatRigSettings(
  rigIntentions: RigIntentions | undefined
): FormattedRigSetting[] {
  if (!rigIntentions?.settings) return [];

  return Object.entries(rigIntentions.settings)
    .filter(([_, setting]) => setting.status !== 'default' || setting.value)
    .map(([key, setting]) => ({
      label: RIG_SETTING_LABELS[key] || formatSettingKey(key),
      value: setting.value || (setting.status === 'adjusted' ? 'Adjusted' : 'Monitoring'),
      notes: setting.notes,
      status: setting.status,
    }));
}

/**
 * Format rig settings as a compact grid string
 */
export function formatRigSettingsCompact(
  rigIntentions: RigIntentions | undefined
): string | null {
  const settings = formatRigSettings(rigIntentions);
  if (settings.length === 0) return null;

  // Show only adjusted settings in compact view
  const adjusted = settings.filter((s) => s.status === 'adjusted' && s.value);
  if (adjusted.length === 0) return rigIntentions?.overallNotes || null;

  return adjusted.map((s) => `${s.label}: ${s.value}`).join(' | ');
}

/**
 * Convert setting_key to Title Case
 */
function formatSettingKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// FORECAST
// =============================================================================

/**
 * Format forecast summary from snapshots
 */
export function formatForecastSummary(
  forecastCheck: ForecastIntention | undefined
): string | null {
  if (!forecastCheck?.snapshots?.length) return null;

  const latestSnapshot = forecastCheck.snapshots[forecastCheck.snapshots.length - 1];
  if (!latestSnapshot) return null;

  const { raceWindow, windTrend } = latestSnapshot;
  if (!raceWindow) return null;

  const trendLabel = {
    building: 'building',
    steady: 'steady',
    easing: 'easing',
  }[windTrend] || '';

  const windRange = `${Math.round(raceWindow.windAtStart || 0)}-${Math.round(raceWindow.windAtEnd || 0)}kt`;
  const direction = raceWindow.windDirectionAtStart || '';

  return `${direction} ${windRange} (${trendLabel})`;
}

/**
 * Get forecast evolution if multiple snapshots exist
 */
export function getForecastEvolution(
  forecastCheck: ForecastIntention | undefined
): {
  hasEvolution: boolean;
  snapshotCount: number;
  latestAnalysis?: string;
  alertLevel?: 'stable' | 'minor_change' | 'significant_change';
} {
  if (!forecastCheck?.snapshots) {
    return { hasEvolution: false, snapshotCount: 0 };
  }

  return {
    hasEvolution: forecastCheck.snapshots.length > 1,
    snapshotCount: forecastCheck.snapshots.length,
    latestAnalysis: forecastCheck.latestAnalysis?.summary,
    alertLevel: forecastCheck.latestAnalysis?.alertLevel,
  };
}

// =============================================================================
// STRATEGY
// =============================================================================

/**
 * Get strategy intention summary
 */
export function getStrategyIntention(intentions: RaceIntentions | undefined): string | null {
  return intentions?.strategyBrief?.raceIntention || null;
}

/**
 * Get strategy notes count by section
 */
export function getStrategyNotesCount(intentions: RaceIntentions | undefined): number {
  if (!intentions?.strategyNotes) return 0;
  return Object.values(intentions.strategyNotes).filter((note) => note && note.trim()).length;
}

// =============================================================================
// ARRIVAL
// =============================================================================

/**
 * Format arrival time intention
 */
export function formatArrivalTime(intentions: RaceIntentions | undefined): string | null {
  const arrival = intentions?.arrivalTime;
  if (!arrival) return null;

  if (arrival.minutesBefore) {
    return `${arrival.minutesBefore} min before warning`;
  }

  if (arrival.plannedArrival) {
    const time = new Date(arrival.plannedArrival);
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return arrival.notes || null;
}

// =============================================================================
// COURSE
// =============================================================================

/**
 * Format course selection
 */
export function formatCourseSelection(intentions: RaceIntentions | undefined): string | null {
  const course = intentions?.courseSelection;
  if (!course) return null;

  if (course.selectedCourseName) {
    return course.selectedCourseName;
  }

  if (course.selectedCourseSequence) {
    return course.selectedCourseSequence;
  }

  return null;
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Check if any meaningful data was captured for a phase
 */
export function hasPhaseData(
  intentions: RaceIntentions | undefined,
  phase: RacePhase
): boolean {
  if (!intentions) return false;

  const hasCompletions =
    intentions.checklistCompletions &&
    Object.keys(intentions.checklistCompletions).length > 0;

  switch (phase) {
    case 'days_before':
      return !!(
        hasCompletions ||
        intentions.forecastCheck?.snapshots?.length ||
        intentions.arrivalTime
      );
    case 'race_morning':
      return !!(
        hasCompletions ||
        intentions.sailSelection ||
        intentions.rigIntentions ||
        intentions.strategyBrief?.raceIntention ||
        intentions.strategyNotes
      );
    case 'on_water':
      return !!hasCompletions;
    default:
      return false;
  }
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) return 'Just now';
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
