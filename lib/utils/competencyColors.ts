/**
 * Shared color utilities for competency achievement visualization.
 * Used by both the admin CompetencyHeatmap and personal PersonalAchievementMatrix.
 */

import type { CompetencyStatus } from '@/types/competency';

/** Achievement percentage → background color */
export function achievementColor(percent: number): string {
  if (percent >= 80) return '#10B981';
  if (percent >= 50) return '#F59E0B';
  if (percent >= 25) return '#F97316';
  if (percent > 0) return '#EF4444';
  return '#E5E7EB';
}

/** Achievement percentage → text color for readability on the cell background */
export function achievementTextColor(percent: number): string {
  if (percent > 0) return '#FFFFFF';
  return '#9CA3AF';
}

/** Competency status → background color for compact status cells */
export function statusCellColor(status: CompetencyStatus | string): string {
  switch (status) {
    case 'competent': return '#047857';
    case 'validated': return '#10B981';
    case 'checkoff_ready': return '#7C3AED';
    case 'practicing': return '#F59E0B';
    case 'learning': return '#0369A1';
    default: return '#F1F5F9';
  }
}

/** Competency status → short abbreviation for compact display */
export function statusAbbrev(status: CompetencyStatus | string): string {
  switch (status) {
    case 'competent': return 'C';
    case 'validated': return 'V';
    case 'checkoff_ready': return 'CR';
    case 'practicing': return 'P';
    case 'learning': return 'L';
    default: return '';
  }
}
