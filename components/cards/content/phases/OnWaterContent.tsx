/**
 * OnWaterContent - On Water Phase Content
 *
 * Content shown when selectedPhase === 'on_water'
 * Includes:
 * - Countdown timer
 * - Course info (VHF, signals, course number)
 * - Check-in status
 * - GPS tracking (when active)
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, TouchableOpacity, TextInput } from 'react-native';
import {
  Anchor,
  BarChart2,
  BookOpen,
  Car,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  CloudSun,
  Compass,
  FileText,
  Flag,
  ListChecks,
  Navigation,
  Radio,
  Route,
  Shield,
  Target,
  Timer,
  Trophy,
  Users,
  Wind,
  Sailboat,
  Wrench,
  Zap,
} from 'lucide-react-native';

import { CardRaceData, getTimeUntilRace } from '../../types';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import type { ChecklistCompletion } from '@/types/checklists';
import { RaceCountdownTimer, type RaceType as TimerRaceType } from '@/components/races/RaceCountdownTimer';
import { HistoricalSummaryCard, DataStatement } from './historical';
import { getItemsGroupedByCategory, getCategoriesForPhase } from '@/lib/checklists/checklistConfig';
import { CATEGORY_CONFIG, ChecklistCategory } from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';
import { DemoRaceService, type DemoRaceDetails } from '@/services/DemoRaceService';
import type { DemoRaceResults, DemoRaceAnalysis, DemoRaceWeather } from '@/lib/demo/demoRaceData';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  secondaryBackground: '#F2F2F7',
};

// Icon mapping for categories
const CATEGORY_ICONS: Record<ChecklistCategory, React.ComponentType<any>> = {
  equipment: Wrench,
  crew: Users,
  logistics: Car,
  safety: Shield,
  navigation: Compass,
  tactics: Target,
  team_coordination: Users,
  rules: BookOpen,
  weather: CloudSun,
  morning: CloudSun,
  on_water: Compass,
  documents: FileText,
  strategy: Target,
  review: ClipboardList,
};

// =============================================================================
// HELPER FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format position with ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function formatPosition(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  return position + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Calculate percentile placement in fleet
 */
function calculatePercentile(position: number, total: number): number {
  return Math.round(((position - 1) / (total - 1)) * 100);
}

/**
 * Format elapsed time for display (6:34:22 → 6h 34m)
 */
function formatElapsedTime(timeStr: string): string {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    const [hours, mins] = parts;
    return `${hours}h ${mins}m`;
  }
  return timeStr;
}

/**
 * Format conditions summary
 */
function formatConditions(weather: DemoRaceWeather): string {
  const gustInfo = weather.wind_gusts > weather.wind_speed + 4
    ? ` gusting ${weather.wind_gusts}kt`
    : '';
  return `${weather.wind_direction} ${weather.wind_speed}kt${gustInfo}`;
}

// =============================================================================
// RACE RESULT CARD COMPONENT
// =============================================================================

interface RaceResultCardProps {
  results: DemoRaceResults;
}

function RaceResultCard({ results }: RaceResultCardProps) {
  const percentile = calculatePercentile(results.position, results.total_boats);
  const isTopHalf = percentile <= 50;
  const isTopQuarter = percentile <= 25;

  return (
    <View style={resultStyles.container}>
      <View style={resultStyles.header}>
        <View style={resultStyles.iconContainer}>
          <Trophy size={18} color={IOS_COLORS.orange} />
        </View>
        <Text style={resultStyles.title}>RACE RESULT</Text>
      </View>

      {/* Main Position */}
      <View style={resultStyles.positionContainer}>
        <Text style={resultStyles.positionNumber}>{formatPosition(results.position)}</Text>
        <Text style={resultStyles.positionOf}>of {results.total_boats}</Text>
        <View style={[
          resultStyles.percentileBadge,
          isTopQuarter && resultStyles.percentileBadgeGold,
          isTopHalf && !isTopQuarter && resultStyles.percentileBadgeGreen,
        ]}>
          <Text style={[
            resultStyles.percentileText,
            (isTopQuarter || isTopHalf) && resultStyles.percentileTextLight,
          ]}>
            Top {percentile}%
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={resultStyles.statsGrid}>
        <View style={resultStyles.statItem}>
          <Text style={resultStyles.statLabel}>Elapsed</Text>
          <Text style={resultStyles.statValue}>{formatElapsedTime(results.elapsed_time)}</Text>
        </View>
        <View style={resultStyles.statDivider} />
        <View style={resultStyles.statItem}>
          <Text style={resultStyles.statLabel}>Corrected</Text>
          <Text style={resultStyles.statValue}>{formatElapsedTime(results.corrected_time)}</Text>
        </View>
        <View style={resultStyles.statDivider} />
        <View style={resultStyles.statItem}>
          <Text style={resultStyles.statLabel}>Avg Speed</Text>
          <Text style={resultStyles.statValue}>{results.average_speed}kt</Text>
        </View>
      </View>

      {/* Distance and Max Speed */}
      <View style={resultStyles.secondaryStats}>
        <Text style={resultStyles.secondaryStat}>
          {results.distance_sailed}nm sailed • Max {results.max_speed}kt
        </Text>
      </View>
    </View>
  );
}

const resultStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 4,
  },
  positionNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  positionOf: {
    fontSize: 18,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  percentileBadge: {
    marginLeft: 'auto',
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  percentileBadgeGold: {
    backgroundColor: IOS_COLORS.orange,
  },
  percentileBadgeGreen: {
    backgroundColor: IOS_COLORS.green,
  },
  percentileText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  percentileTextLight: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: IOS_COLORS.gray5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  secondaryStats: {
    alignItems: 'center',
  },
  secondaryStat: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
});

// =============================================================================
// CONDITIONS CARD COMPONENT
// =============================================================================

interface ConditionsCardProps {
  weather: DemoRaceWeather;
}

function ConditionsCard({ weather }: ConditionsCardProps) {
  return (
    <View style={conditionsStyles.container}>
      <View style={conditionsStyles.header}>
        <View style={conditionsStyles.iconContainer}>
          <Wind size={18} color={IOS_COLORS.blue} />
        </View>
        <Text style={conditionsStyles.title}>RACE CONDITIONS</Text>
      </View>

      <View style={conditionsStyles.content}>
        <Text style={conditionsStyles.mainCondition}>
          {formatConditions(weather)}
        </Text>
        <View style={conditionsStyles.detailsRow}>
          {weather.wave_height > 0 && (
            <Text style={conditionsStyles.detail}>Waves: {weather.wave_height}m</Text>
          )}
          {weather.visibility && (
            <Text style={conditionsStyles.detail}>Vis: {weather.visibility}</Text>
          )}
          {weather.temperature && (
            <Text style={conditionsStyles.detail}>{weather.temperature}°C</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const conditionsStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  content: {
    gap: 4,
  },
  mainCondition: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detail: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
});

// =============================================================================
// RACE PLAN CARD COMPONENT
// =============================================================================

interface RacePlanCardProps {
  intention: string;
  strategyNotes?: Record<string, string>;
}

function RacePlanCard({ intention, strategyNotes }: RacePlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasNotes = strategyNotes && Object.keys(strategyNotes).length > 0;

  return (
    <View style={planStyles.container}>
      <Pressable
        style={planStyles.header}
        onPress={() => hasNotes && setIsExpanded(!isExpanded)}
      >
        <View style={planStyles.iconContainer}>
          <Target size={18} color={IOS_COLORS.green} />
        </View>
        <View style={planStyles.headerContent}>
          <Text style={planStyles.title}>YOUR RACE PLAN</Text>
          <Text style={planStyles.intention}>"{intention}"</Text>
        </View>
        {hasNotes && (
          <View style={planStyles.expanderIcon}>
            {isExpanded ? (
              <ChevronUp size={16} color={IOS_COLORS.gray} />
            ) : (
              <ChevronDown size={16} color={IOS_COLORS.gray} />
            )}
          </View>
        )}
      </Pressable>

      {isExpanded && strategyNotes && (
        <View style={planStyles.notesContainer}>
          {Object.entries(strategyNotes).map(([section, note]) => (
            note && (
              <View key={section} style={planStyles.noteItem}>
                <Text style={planStyles.noteSection}>
                  {section.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={planStyles.noteText}>{note}</Text>
              </View>
            )
          ))}
        </View>
      )}
    </View>
  );
}

const planStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  intention: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    fontStyle: 'italic',
  },
  expanderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notesContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 12,
  },
  noteItem: {
    gap: 2,
  },
  noteSection: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});

// =============================================================================
// PERFORMANCE CARD COMPONENT
// =============================================================================

interface PerformanceCardProps {
  analysis: DemoRaceAnalysis;
}

function PerformanceCard({ analysis }: PerformanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return IOS_COLORS.green;
    if (grade.startsWith('B')) return IOS_COLORS.blue;
    if (grade.startsWith('C')) return IOS_COLORS.orange;
    return IOS_COLORS.red;
  };

  return (
    <View style={perfStyles.container}>
      <Pressable
        style={perfStyles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={perfStyles.iconContainer}>
          <BarChart2 size={18} color="#9B59B6" />
        </View>
        <View style={perfStyles.headerContent}>
          <Text style={perfStyles.title}>PERFORMANCE ANALYSIS</Text>
          <View style={perfStyles.scoreRow}>
            <Text style={perfStyles.scoreValue}>{analysis.overall_score}</Text>
            <Text style={perfStyles.scoreLabel}>/100</Text>
          </View>
        </View>
        <View style={perfStyles.gradesRow}>
          <View style={perfStyles.gradeItem}>
            <Text style={[perfStyles.grade, { color: getGradeColor(analysis.tactical_analysis.start.grade) }]}>
              {analysis.tactical_analysis.start.grade}
            </Text>
            <Text style={perfStyles.gradeLabel}>Start</Text>
          </View>
          <View style={perfStyles.gradeItem}>
            <Text style={[perfStyles.grade, { color: getGradeColor(analysis.tactical_analysis.mark_roundings.grade) }]}>
              {analysis.tactical_analysis.mark_roundings.grade}
            </Text>
            <Text style={perfStyles.gradeLabel}>Marks</Text>
          </View>
          <View style={perfStyles.gradeItem}>
            <Text style={[perfStyles.grade, { color: getGradeColor(analysis.tactical_analysis.strategy_execution.grade) }]}>
              {analysis.tactical_analysis.strategy_execution.grade}
            </Text>
            <Text style={perfStyles.gradeLabel}>Strategy</Text>
          </View>
        </View>
        <View style={perfStyles.expanderIcon}>
          {isExpanded ? (
            <ChevronUp size={16} color={IOS_COLORS.gray} />
          ) : (
            <ChevronDown size={16} color={IOS_COLORS.gray} />
          )}
        </View>
      </Pressable>

      {isExpanded && (
        <View style={perfStyles.detailsContainer}>
          {/* Highlights */}
          <View style={perfStyles.section}>
            <Text style={perfStyles.sectionTitle}>HIGHLIGHTS</Text>
            {analysis.highlights.map((highlight, i) => (
              <View key={i} style={perfStyles.highlightItem}>
                <CheckCircle size={14} color={IOS_COLORS.green} />
                <Text style={perfStyles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>

          {/* Areas for Improvement */}
          <View style={perfStyles.section}>
            <Text style={perfStyles.sectionTitle}>AREAS TO IMPROVE</Text>
            {analysis.areas_for_improvement.map((area, i) => (
              <View key={i} style={perfStyles.highlightItem}>
                <Zap size={14} color={IOS_COLORS.orange} />
                <Text style={perfStyles.highlightText}>{area}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const perfStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  headerContent: {
    gap: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  gradesRow: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 'auto',
    marginRight: 8,
  },
  gradeItem: {
    alignItems: 'center',
    gap: 2,
  },
  grade: {
    fontSize: 16,
    fontWeight: '700',
  },
  gradeLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  expanderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});

// =============================================================================
// STRATEGY SUMMARY COMPONENTS
// =============================================================================

interface StrategySummaryCardProps {
  icon: React.ComponentType<any>;
  iconColor: string;
  title: string;
  summary: string | null;
  details?: Record<string, string>;
  emptyMessage: string;
  onNavigateToPrep?: () => void;
}

function StrategySummaryCard({
  icon: Icon,
  iconColor,
  title,
  summary,
  details,
  emptyMessage,
  onNavigateToPrep,
}: StrategySummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasContent = !!summary || (details && Object.values(details).some(Boolean));
  const hasDetails = details && Object.values(details).filter(Boolean).length > 0;

  if (!hasContent) {
    return (
      <View style={strategyStyles.emptyContainer}>
        <View style={[strategyStyles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={16} color={iconColor} />
        </View>
        <View style={strategyStyles.emptyContent}>
          <Text style={strategyStyles.emptyTitle}>{title}</Text>
          <Text style={strategyStyles.emptyMessage}>{emptyMessage}</Text>
        </View>
        {onNavigateToPrep && (
          <Pressable style={strategyStyles.addButton} onPress={onNavigateToPrep}>
            <Text style={strategyStyles.addButtonText}>Add in Prep</Text>
            <ChevronRight size={14} color={IOS_COLORS.blue} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={strategyStyles.container}>
      <Pressable
        style={strategyStyles.header}
        onPress={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <View style={[strategyStyles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={16} color={iconColor} />
        </View>
        <View style={strategyStyles.headerContent}>
          <Text style={strategyStyles.title}>{title}</Text>
          <Text style={strategyStyles.summary} numberOfLines={isExpanded ? undefined : 2}>
            {summary || Object.values(details || {}).filter(Boolean).join(' • ')}
          </Text>
        </View>
        {hasDetails && (
          <View style={strategyStyles.expanderIcon}>
            {isExpanded ? (
              <ChevronUp size={14} color={IOS_COLORS.gray} />
            ) : (
              <ChevronDown size={14} color={IOS_COLORS.gray} />
            )}
          </View>
        )}
      </Pressable>

      {isExpanded && details && (
        <View style={strategyStyles.detailsContainer}>
          {Object.entries(details).map(([key, value]) =>
            value ? (
              <View key={key} style={strategyStyles.detailItem}>
                <Text style={strategyStyles.detailLabel}>
                  {formatStrategyLabel(key)}
                </Text>
                <Text style={strategyStyles.detailValue}>{value}</Text>
              </View>
            ) : null
          )}
        </View>
      )}
    </View>
  );
}

function formatStrategyLabel(key: string): string {
  const labels: Record<string, string> = {
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

  // Handle edge cases: empty key, just a period, or key that only contains periods
  if (!key || key.trim() === '' || key === '.' || /^\.+$/.test(key)) {
    return 'Unknown';
  }

  const splitResult = key.split('.').pop();
  const fallback = splitResult && splitResult.trim() !== ''
    ? splitResult.replace(/_/g, ' ').toUpperCase()
    : 'Unknown';

  const result = labels[key] || fallback;

  // DEBUG: Log strategy label formatting
  if (typeof window !== 'undefined' && (window as any).__PERIOD_DEBUG__?.enabled) {
    (window as any).__PERIOD_DEBUG__.log('formatStrategyLabel', result, { key, hasLabel: !!labels[key], splitResult });
    // Warn if result looks suspicious
    if (result === '.' || result === '' || !result) {
      console.warn('⚠️ formatStrategyLabel produced suspicious result:', { key, result, splitPop: splitResult });
    }
  }

  return result;
}

const strategyStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyMessage: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summary: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  expanderIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});

// =============================================================================
// PRE-START CHECKLIST ITEMS CONFIGURATION
// =============================================================================

interface PreStartCheckItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  iconColor: string;
}

const PRE_START_CHECK_ITEMS: PreStartCheckItem[] = [
  { id: 'prestart_checkin', label: 'Checked in with Race Committee', icon: Radio, iconColor: IOS_COLORS.blue },
  { id: 'prestart_sailed_line', label: 'Sailed the line (timed pin to boat)', icon: Timer, iconColor: IOS_COLORS.orange },
  { id: 'prestart_favored_end', label: 'Identified favored end', icon: Flag, iconColor: IOS_COLORS.green },
  { id: 'prestart_miniature_course', label: 'Sailed course in miniature', icon: Route, iconColor: IOS_COLORS.blue },
  { id: 'prestart_laylines', label: 'Checked laylines to mark 1', icon: Navigation, iconColor: '#5856D6' },
  { id: 'prestart_wind_patterns', label: 'Observed wind patterns (shifts/puffs)', icon: Wind, iconColor: IOS_COLORS.blue },
  { id: 'prestart_current', label: 'Noted current at line/marks', icon: Anchor, iconColor: '#0D9488' },
  { id: 'prestart_crew_roles', label: 'Confirmed crew roles', icon: Users, iconColor: IOS_COLORS.blue },
  { id: 'prestart_boat_check', label: 'Final boat check complete', icon: CheckCircle, iconColor: IOS_COLORS.green },
];

/**
 * Retrospective Checklist Section - Shows all checklist items with completed/not status
 */
interface RetrospectiveChecklistSectionProps {
  raceType: RaceType;
  phase: 'days_before' | 'race_morning' | 'on_water';
  completions: Record<string, { completedAt: string; notes?: string }> | undefined;
  initialExpanded?: boolean;
}

function RetrospectiveChecklistSection({
  raceType,
  phase,
  completions,
  initialExpanded = true,
}: RetrospectiveChecklistSectionProps) {
  const itemsByCategory = getItemsGroupedByCategory(raceType, phase);
  const categories = getCategoriesForPhase(raceType, phase);

  // Calculate totals
  const allItems = Object.values(itemsByCategory).flat();
  const completedCount = allItems.filter((item) => completions?.[item.id]).length;
  const totalCount = allItems.length;

  if (totalCount === 0) return null;

  return (
    <HistoricalSummaryCard
      icon={ListChecks}
      iconColor={IOS_COLORS.blue}
      title="Race Checklist"
      expandable={true}
      initialExpanded={initialExpanded}
      summary={
        <View style={styles.retroSummary}>
          <Text style={styles.retroSummaryText}>
            {completedCount} of {totalCount} items completed
          </Text>
          <View style={styles.retroProgressBar}>
            <View
              style={[
                styles.retroProgressFill,
                { width: `${(completedCount / totalCount) * 100}%` },
              ]}
            />
          </View>
        </View>
      }
      details={
        <View style={styles.retroDetailsList}>
          {categories.map((category) => {
            const items = itemsByCategory[category];
            if (!items || items.length === 0) return null;
            const config = CATEGORY_CONFIG[category];
            const IconComponent = CATEGORY_ICONS[category] || Wrench;
            const categoryCompletedCount = items.filter(
              (item) => completions?.[item.id]
            ).length;

            return (
              <View key={category} style={styles.retroCategory}>
                <View style={styles.retroCategoryHeader}>
                  <IconComponent size={14} color={config.color} />
                  <Text style={styles.retroCategoryLabel}>{config.label}</Text>
                  <Text style={styles.retroCategoryCount}>
                    {categoryCompletedCount}/{items.length}
                  </Text>
                </View>
                <View style={styles.retroItemsList}>
                  {items.map((item) => {
                    const isCompleted = !!completions?.[item.id];
                    return (
                      <View key={item.id} style={styles.retroItem}>
                        <View
                          style={[
                            styles.retroCheckbox,
                            isCompleted && styles.retroCheckboxDone,
                          ]}
                        >
                          {isCompleted && (
                            <Text style={styles.retroCheckmark}>✓</Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.retroItemLabel,
                            !isCompleted && styles.retroItemLabelNotDone,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      }
    />
  );
}

interface OnWaterContentProps {
  race: CardRaceData;
  onStartTimer?: () => void;
  onRaceComplete?: (sessionId: string) => void;
  onSwitchToReview?: () => void;
  isExpanded?: boolean;
  /** Forecast data from parent (RaceSummaryCard) */
  forecastData?: import('@/hooks/useRaceWeatherForecast').RaceWeatherForecastData | null;
  /** Start order data from parent (RaceSummaryCard) */
  startOrderData?: {
    startOrder?: number;
    totalFleets?: number;
    classFlag?: string;
    plannedStartTime?: string;
  } | null;
}

/**
 * Format countdown for display
 */
function formatCountdown(ms: number): { value: string; label: string; urgent: boolean } {
  const absMs = Math.abs(ms);
  const isPast = ms < 0;

  if (isPast) {
    const hoursAgo = absMs / (1000 * 60 * 60);
    if (hoursAgo < 1) {
      const mins = Math.floor(absMs / (1000 * 60));
      return { value: `+${mins}`, label: 'min', urgent: false };
    }
    return { value: `+${Math.round(hoursAgo)}`, label: 'hr', urgent: false };
  }

  const minutes = Math.floor(absMs / (1000 * 60));
  const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return { value: `${hours}:${mins.toString().padStart(2, '0')}`, label: 'hr:min', urgent: false };
  }

  if (minutes <= 5) {
    return {
      value: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      label: 'min:sec',
      urgent: true,
    };
  }

  return { value: `${minutes}`, label: 'min', urgent: minutes <= 10 };
}

export function OnWaterContent({
  race,
  onStartTimer,
  onRaceComplete,
  onSwitchToReview,
  isExpanded = true,
  forecastData,
  startOrderData,
}: OnWaterContentProps) {
  // Live countdown
  const [timeUntilRace, setTimeUntilRace] = useState(() => getTimeUntilRace(race.date ?? '', race.startTime));

  // Start sequence timer state
  const [showStartSequence, setShowStartSequence] = useState(false);

  // Race preparation data (for strategy surface)
  const { intentions, updateIntentions } = useRacePreparation({
    regattaId: race.id,
  });

  // Extract strategy data from intentions
  const strategyNotes = intentions?.strategyNotes || {};
  const raceIntention = intentions?.strategyBrief?.raceIntention;

  // Build strategy summaries
  const hasStartStrategy = !!(
    strategyNotes['start.lineBias'] ||
    strategyNotes['start.favoredEnd'] ||
    strategyNotes['start.timingApproach']
  );

  const hasFirstBeatStrategy = !!(
    strategyNotes['upwind.favoredTack'] ||
    strategyNotes['upwind.shiftStrategy'] ||
    strategyNotes['upwind.laylineApproach']
  );

  const hasDownwindStrategy = !!(
    strategyNotes['downwind.favoredGybe'] ||
    strategyNotes['downwind.pressureStrategy'] ||
    strategyNotes['downwind.vmgApproach']
  );

  // Extract sail selection + rig tuning from intentions
  const sailSelection = intentions?.sailSelection;
  const hasSailSelection = !!(sailSelection?.mainsailName || sailSelection?.jibName || sailSelection?.spinnakerName);
  const rigIntentions = intentions?.rigIntentions;
  const hasRigSettings = !!(rigIntentions?.settings && Object.keys(rigIntentions.settings).length > 0);
  const hasEquipment = hasSailSelection || hasRigSettings;

  // ==========================================================================
  // EDITABLE RACE INFO — resolve from SI data or user-entered intentions
  // ==========================================================================
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Resolve race info: prefer SI-extracted data, fallback to user-entered intentions
  const briefingComms = intentions?.briefingComms;
  const briefingSchedule = intentions?.briefingSchedule;

  const vhfChannel = race.vhf_channel || briefingComms?.safetyChannel || null;
  const totalStarts = startOrderData?.totalFleets || briefingSchedule?.numberOfClasses || null;
  const ourStart = startOrderData?.startOrder || briefingSchedule?.myClassStartNumber || null;
  const classFlag = startOrderData?.classFlag || briefingSchedule?.classFlag || null;

  const handleEditStart = useCallback((field: string, currentValue: string | number | null) => {
    setEditingField(field);
    setEditValue(currentValue != null ? String(currentValue) : '');
  }, []);

  // Use refs to avoid stale closures and prevent double-save from onBlur + onSubmitEditing
  const editingFieldRef = useRef<string | null>(null);
  const editValueRef = useRef('');
  editingFieldRef.current = editingField;
  editValueRef.current = editValue;

  const handleEditSave = useCallback(() => {
    const field = editingFieldRef.current;
    const val = editValueRef.current.trim();

    if (!field) return;

    // Clear immediately to prevent double-fire from onBlur + onSubmitEditing
    setEditingField(null);
    setEditValue('');

    if (!val) return;

    switch (field) {
      case 'vhf':
        updateIntentions({
          briefingComms: { safetyChannel: val },
        });
        break;
      case 'starts':
        updateIntentions({
          briefingSchedule: { numberOfClasses: parseInt(val, 10) || undefined },
        });
        break;
      case 'ourStart':
        updateIntentions({
          briefingSchedule: { myClassStartNumber: parseInt(val, 10) || undefined },
        });
        break;
      case 'flag':
        updateIntentions({
          briefingSchedule: { classFlag: val },
        });
        break;
    }
  }, [updateIntentions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRace(getTimeUntilRace(race.date ?? '', race.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [race.date ?? '', race.startTime]);

  const countdown = useMemo(() => formatCountdown(timeUntilRace), [timeUntilRace]);

  const raceType: RaceType = race.race_type || 'fleet';

  // Handle starting the timer
  const handleStartTimer = () => {
    setShowStartSequence(true);
    onStartTimer?.();
  };

  // Handle race completion
  const handleRaceComplete = (sessionId: string) => {
    setShowStartSequence(false);
    onRaceComplete?.(sessionId);
  };

  // ==========================================================================
  // FORECAST DATA
  // ==========================================================================
  const raceWindow = forecastData?.raceWindow;
  const windSpeed = raceWindow?.windAtStart;
  const windDir = raceWindow?.windDirectionAtStart;
  const windEnd = raceWindow?.windAtEnd;
  const currentDir = raceWindow?.currentDirectionAtStart;
  const currentSpeed = raceWindow?.currentSpeedAtStart;
  const windTrend = forecastData?.windTrend;

  // Format current direction as cardinal for display
  const currentDirCardinal = useMemo(() => {
    if (currentDir == null) return null;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(currentDir / 45) % 8];
  }, [currentDir]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <View style={styles.container}>
      {/* Race Intention Header (if set) */}
      {raceIntention && (
        <View style={styles.intentionBanner}>
          <Target size={16} color={IOS_COLORS.green} />
          <Text style={styles.intentionText}>"{raceIntention}"</Text>
        </View>
      )}

      {/* Countdown Timer or Start Sequence Timer */}
      {showStartSequence ? (
        <RaceCountdownTimer
          raceId={race.id}
          raceName={race.name || 'Race'}
          raceDate={race.date ?? ''}
          raceTime={race.startTime || '10:00'}
          raceType={(raceType || 'fleet') as TimerRaceType}
          timeLimitHours={(race as any).time_limit_hours}
          onRaceComplete={handleRaceComplete}
        />
      ) : (
        <TouchableOpacity
          style={[styles.countdownContainer, countdown.urgent && styles.countdownUrgent]}
          onPress={handleStartTimer}
          activeOpacity={0.7}
          disabled={timeUntilRace <= 0}
        >
          <Text style={[styles.countdownValue, countdown.urgent && styles.countdownValueUrgent]}>
            {countdown.value}
          </Text>
          <Text style={[styles.countdownLabel, countdown.urgent && styles.countdownLabelUrgent]}>
            {timeUntilRace >= 0 ? `${countdown.label} to start` : 'since start'}
          </Text>
          {timeUntilRace > 0 && (
            <View style={styles.tapToStartHint}>
              <Timer size={14} color={countdown.urgent ? IOS_COLORS.red : IOS_COLORS.blue} />
              <Text style={[styles.tapToStartText, countdown.urgent && styles.tapToStartTextUrgent]}>
                Tap to start sequence
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* ================================================================ */}
      {/* RACE INFO — always visible, tappable to edit                    */}
      {/* ================================================================ */}
      <View style={briefStyles.raceInfoGrid}>
        {/* VHF Channel */}
        {editingField === 'vhf' ? (
          <View style={briefStyles.raceInfoChipEditing}>
            <Radio size={14} color={IOS_COLORS.blue} />
            <Text style={briefStyles.raceInfoLabel}>VHF</Text>
            <TextInput
              style={briefStyles.raceInfoInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Ch #"
              keyboardType="number-pad"
              autoFocus
              onSubmitEditing={handleEditSave}
              onBlur={handleEditSave}
              returnKeyType="done"
            />
            <Pressable onPress={handleEditSave} hitSlop={8}>
              <CheckCircle size={16} color={IOS_COLORS.blue} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[briefStyles.raceInfoChip, !vhfChannel && briefStyles.raceInfoChipEmpty]}
            onPress={() => handleEditStart('vhf', vhfChannel)}
          >
            <Radio size={14} color={vhfChannel ? IOS_COLORS.blue : IOS_COLORS.gray} />
            <Text style={briefStyles.raceInfoLabel}>VHF</Text>
            <Text style={[briefStyles.raceInfoValue, !vhfChannel && briefStyles.raceInfoValueEmpty]}>
              {vhfChannel ? `Ch ${vhfChannel}` : 'Set'}
            </Text>
          </Pressable>
        )}

        {/* Total Starts */}
        {editingField === 'starts' ? (
          <View style={briefStyles.raceInfoChipEditing}>
            <Flag size={14} color={IOS_COLORS.green} />
            <Text style={briefStyles.raceInfoLabel}>Starts</Text>
            <TextInput
              style={briefStyles.raceInfoInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="#"
              keyboardType="number-pad"
              autoFocus
              onSubmitEditing={handleEditSave}
              onBlur={handleEditSave}
              returnKeyType="done"
            />
            <Pressable onPress={handleEditSave} hitSlop={8}>
              <CheckCircle size={16} color={IOS_COLORS.blue} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[briefStyles.raceInfoChip, !totalStarts && briefStyles.raceInfoChipEmpty]}
            onPress={() => handleEditStart('starts', totalStarts)}
          >
            <Flag size={14} color={totalStarts ? IOS_COLORS.green : IOS_COLORS.gray} />
            <Text style={briefStyles.raceInfoLabel}>Starts</Text>
            <Text style={[briefStyles.raceInfoValue, !totalStarts && briefStyles.raceInfoValueEmpty]}>
              {totalStarts ?? 'Set'}
            </Text>
          </Pressable>
        )}

        {/* Our Start Number */}
        {editingField === 'ourStart' ? (
          <View style={briefStyles.raceInfoChipEditing}>
            <Target size={14} color={IOS_COLORS.orange} />
            <Text style={briefStyles.raceInfoLabel}>Our Start</Text>
            <TextInput
              style={briefStyles.raceInfoInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="#"
              keyboardType="number-pad"
              autoFocus
              onSubmitEditing={handleEditSave}
              onBlur={handleEditSave}
              returnKeyType="done"
            />
            <Pressable onPress={handleEditSave} hitSlop={8}>
              <CheckCircle size={16} color={IOS_COLORS.blue} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[briefStyles.raceInfoChip, !ourStart && briefStyles.raceInfoChipEmpty]}
            onPress={() => handleEditStart('ourStart', ourStart)}
          >
            <Target size={14} color={ourStart ? IOS_COLORS.orange : IOS_COLORS.gray} />
            <Text style={briefStyles.raceInfoLabel}>Our Start</Text>
            <Text style={[briefStyles.raceInfoValue, !ourStart && briefStyles.raceInfoValueEmpty]}>
              {ourStart ? `#${ourStart}${totalStarts ? ` of ${totalStarts}` : ''}` : 'Set'}
            </Text>
          </Pressable>
        )}

        {/* Class Flag */}
        {editingField === 'flag' ? (
          <View style={briefStyles.raceInfoChipEditing}>
            <Flag size={14} color={IOS_COLORS.red} />
            <Text style={briefStyles.raceInfoLabel}>Flag</Text>
            <TextInput
              style={briefStyles.raceInfoInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="e.g. Blue"
              autoFocus
              onSubmitEditing={handleEditSave}
              onBlur={handleEditSave}
              returnKeyType="done"
            />
            <Pressable onPress={handleEditSave} hitSlop={8}>
              <CheckCircle size={16} color={IOS_COLORS.blue} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[briefStyles.raceInfoChip, !classFlag && briefStyles.raceInfoChipEmpty]}
            onPress={() => handleEditStart('flag', classFlag)}
          >
            <Flag size={14} color={classFlag ? IOS_COLORS.red : IOS_COLORS.gray} />
            <Text style={briefStyles.raceInfoLabel}>Flag</Text>
            <Text style={[briefStyles.raceInfoValue, !classFlag && briefStyles.raceInfoValueEmpty]}>
              {classFlag ?? 'Set'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ================================================================ */}
      {/* FOCUS CONCEPTS — Playbook concepts linked for this race         */}
      {/* ================================================================ */}
      {intentions?.raceFocusConcepts && intentions.raceFocusConcepts.length > 0 && (
        <View style={briefStyles.section}>
          <Text style={briefStyles.sectionLabel}>FOCUS</Text>
          <View style={briefStyles.focusConceptsList}>
            {intentions.raceFocusConcepts.map((fc) => (
              <View key={fc.conceptId} style={briefStyles.focusConceptCard}>
                <View style={briefStyles.focusConceptHeader}>
                  <BookOpen size={14} color={IOS_COLORS.blue} />
                  <Text style={briefStyles.focusConceptTitle} numberOfLines={1}>
                    {fc.title}
                  </Text>
                </View>
                {fc.reminder && (
                  <Text style={briefStyles.focusConceptReminder}>
                    {fc.reminder}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ================================================================ */}
      {/* CONDITIONS FORECAST                                             */}
      {/* ================================================================ */}
      {(windSpeed != null || currentSpeed != null) && (
        <View style={briefStyles.section}>
          <Text style={briefStyles.sectionLabel}>CONDITIONS</Text>
          <View style={briefStyles.conditionsGrid}>
            {/* Wind */}
            {windSpeed != null && (
              <View style={briefStyles.conditionCard}>
                <View style={briefStyles.conditionIconRow}>
                  <Wind size={16} color={IOS_COLORS.blue} />
                  <Text style={briefStyles.conditionTitle}>Wind</Text>
                </View>
                <Text style={briefStyles.conditionValue}>
                  {windDir} {Math.round(windSpeed)}kt
                  {windEnd != null && windEnd !== windSpeed
                    ? ` → ${Math.round(windEnd)}kt`
                    : ''}
                </Text>
                {windTrend && (
                  <Text style={briefStyles.conditionNote}>
                    {windTrend === 'building' ? 'Building' : windTrend === 'easing' ? 'Easing' : 'Steady'}
                  </Text>
                )}
              </View>
            )}

            {/* Current */}
            {currentSpeed != null && currentSpeed > 0 && (
              <View style={briefStyles.conditionCard}>
                <View style={briefStyles.conditionIconRow}>
                  <Navigation size={16} color={IOS_COLORS.orange} />
                  <Text style={briefStyles.conditionTitle}>Current</Text>
                </View>
                <Text style={briefStyles.conditionValue}>
                  {currentDirCardinal ? `${currentDirCardinal} ` : ''}{currentSpeed.toFixed(1)}kt
                </Text>
                {raceWindow?.hasTurnDuringRace && raceWindow.turnTimeDuringRace && (
                  <Text style={briefStyles.conditionNote}>
                    Turn at {raceWindow.turnTimeDuringRace}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ================================================================ */}
      {/* EQUIPMENT — Sails & Rig                                         */}
      {/* ================================================================ */}
      {hasEquipment && (
        <View style={briefStyles.section}>
          <Text style={briefStyles.sectionLabel}>EQUIPMENT</Text>
          <View style={briefStyles.equipmentGrid}>
            {/* Sails */}
            {hasSailSelection && (
              <View style={briefStyles.equipmentCard}>
                <View style={briefStyles.equipmentCardHeader}>
                  <Sailboat size={14} color={IOS_COLORS.blue} />
                  <Text style={briefStyles.equipmentCardTitle}>Sails</Text>
                </View>
                {sailSelection?.mainsailName && (
                  <Text style={briefStyles.equipmentItem}>
                    Main: {sailSelection.mainsailName}
                  </Text>
                )}
                {sailSelection?.jibName && (
                  <Text style={briefStyles.equipmentItem}>
                    Jib: {sailSelection.jibName}
                  </Text>
                )}
                {sailSelection?.spinnakerName && (
                  <Text style={briefStyles.equipmentItem}>
                    Spi: {sailSelection.spinnakerName}
                  </Text>
                )}
                {sailSelection?.windRangeContext && (
                  <Text style={briefStyles.equipmentNote}>
                    {sailSelection.windRangeContext}
                  </Text>
                )}
              </View>
            )}

            {/* Rig Tuning */}
            {hasRigSettings && (
              <View style={briefStyles.equipmentCard}>
                <View style={briefStyles.equipmentCardHeader}>
                  <Wrench size={14} color={IOS_COLORS.orange} />
                  <Text style={briefStyles.equipmentCardTitle}>Rig</Text>
                </View>
                {Object.entries(rigIntentions!.settings)
                  .filter(([, setting]) => setting.value)
                  .slice(0, 4)
                  .map(([key, setting]) => (
                  <Text key={key} style={briefStyles.equipmentItem}>
                    {key.replace(/_/g, ' ')}: {setting.value}
                  </Text>
                ))}
                {rigIntentions?.overallNotes && (
                  <Text style={briefStyles.equipmentNote}>
                    {rigIntentions.overallNotes}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ================================================================ */}
      {/* STRATEGY BRIEFING                                               */}
      {/* ================================================================ */}
      {(hasStartStrategy || hasFirstBeatStrategy || hasDownwindStrategy) && (
        <View style={briefStyles.section}>
          <Text style={briefStyles.sectionLabel}>RACE PLAN</Text>
          <View style={briefStyles.strategyList}>
            {/* Start Strategy */}
            {hasStartStrategy && (
              <View style={briefStyles.strategyCard}>
                <View style={briefStyles.strategyHeader}>
                  <Flag size={14} color={IOS_COLORS.green} />
                  <Text style={briefStyles.strategyTitle}>Start</Text>
                </View>
                {strategyNotes['start.favoredEnd'] && (
                  <Text style={briefStyles.strategyValue}>
                    {strategyNotes['start.favoredEnd']}
                  </Text>
                )}
                {strategyNotes['start.timingApproach'] && (
                  <Text style={briefStyles.strategyDetail}>
                    {strategyNotes['start.timingApproach']}
                  </Text>
                )}
                {strategyNotes['start.lineBias'] && (
                  <Text style={briefStyles.strategyDetail}>
                    {strategyNotes['start.lineBias']}
                  </Text>
                )}
              </View>
            )}

            {/* First Beat / Upwind Strategy */}
            {hasFirstBeatStrategy && (
              <View style={briefStyles.strategyCard}>
                <View style={briefStyles.strategyHeader}>
                  <Route size={14} color={IOS_COLORS.blue} />
                  <Text style={briefStyles.strategyTitle}>First Beat</Text>
                </View>
                {strategyNotes['upwind.favoredTack'] && (
                  <Text style={briefStyles.strategyValue}>
                    {strategyNotes['upwind.favoredTack']}
                  </Text>
                )}
                {strategyNotes['upwind.shiftStrategy'] && (
                  <Text style={briefStyles.strategyDetail}>
                    {strategyNotes['upwind.shiftStrategy']}
                  </Text>
                )}
                {strategyNotes['upwind.laylineApproach'] && (
                  <Text style={briefStyles.strategyDetail}>
                    {strategyNotes['upwind.laylineApproach']}
                  </Text>
                )}
              </View>
            )}

            {/* Downwind Strategy */}
            {hasDownwindStrategy && (
              <View style={briefStyles.strategyCard}>
                <View style={briefStyles.strategyHeader}>
                  <ChevronDown size={14} color={IOS_COLORS.orange} />
                  <Text style={briefStyles.strategyTitle}>Downwind</Text>
                </View>
                {strategyNotes['downwind.favoredGybe'] && (
                  <Text style={briefStyles.strategyValue}>
                    {strategyNotes['downwind.favoredGybe']}
                  </Text>
                )}
                {strategyNotes['downwind.pressureStrategy'] && (
                  <Text style={briefStyles.strategyDetail}>
                    {strategyNotes['downwind.pressureStrategy']}
                  </Text>
                )}
                {strategyNotes['downwind.vmgApproach'] && (
                  <Text style={briefStyles.strategyDetail}>
                    {strategyNotes['downwind.vmgApproach']}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Empty state when no strategy set */}
      {!hasStartStrategy && !hasFirstBeatStrategy && !hasDownwindStrategy && (
        <View style={briefStyles.emptyState}>
          <Target size={20} color={IOS_COLORS.gray} />
          <Text style={briefStyles.emptyText}>
            Complete your race plan in the Prep tab
          </Text>
        </View>
      )}

    </View>
  );
}

// =============================================================================
// BRIEFING STYLES (simplified Racing tab)
// =============================================================================

const briefStyles = StyleSheet.create({
  raceInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  raceInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  raceInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  raceInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  raceInfoValueEmpty: {
    color: IOS_COLORS.gray,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  raceInfoChipEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: IOS_COLORS.gray3,
    backgroundColor: IOS_COLORS.gray6,
    shadowOpacity: 0,
    elevation: 0,
  },
  raceInfoChipEditing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.blue,
  },
  raceInfoInput: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    minWidth: 40,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  conditionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  conditionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  conditionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  conditionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  conditionValue: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  conditionNote: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  strategyList: {
    gap: 8,
  },
  strategyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  strategyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  strategyValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  strategyDetail: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 19,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    flex: 1,
  },
  focusConceptsList: {
    gap: 8,
  },
  focusConceptCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  focusConceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusConceptTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  focusConceptReminder: {
    fontSize: 14,
    fontStyle: 'italic',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 20,
    lineHeight: 19,
  },
  equipmentGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  equipmentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  equipmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  equipmentCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  equipmentItem: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 19,
  },
  equipmentNote: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    lineHeight: 16,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  // Tile sections
  tileSectionContainer: {
    gap: 12,
  },
  tileSectionHeader: {
    gap: 2,
    paddingBottom: 4,
  },
  tileSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C3C43',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tileSectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Intention Banner
  intentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${IOS_COLORS.green}12`,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.green,
  },
  intentionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
    color: IOS_COLORS.label,
  },

  // Strategy Section
  strategySection: {
    gap: 10,
  },
  strategyCards: {
    gap: 8,
  },
  emptyStrategyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  emptyStrategyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    flex: 1,
  },

  // Pre-start section (flat header style matching DaysBeforeContent)
  preStartSection: {
    gap: 10,
  },
  preStartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preStartHeaderLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  preStartHeaderCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  preStartItemsList: {
    gap: 10,
  },
  preStartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Square checkbox (22x22, borderRadius 6) matching DaysBeforeContent
  preStartCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preStartCheckboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  preStartCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  preStartItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  preStartItemLabelDone: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },

  // Enhanced Pre-Start Items List
  enhancedPreStartItemsList: {
    gap: 8,
  },

  // Pre-Departure Section
  preDepartureSection: {
    gap: 10,
  },
  preDepartureItemsList: {
    gap: 8,
  },
  preDepartureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  preDepartureContent: {
    flex: 1,
    gap: 2,
  },
  preDepartureLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  preDepartureDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  preDepartureTypeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sailBadge: {
    backgroundColor: `${IOS_COLORS.blue}15`,
  },
  rigBadge: {
    backgroundColor: `${IOS_COLORS.orange}15`,
  },
  preDepartureTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyPreDepartureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.gray6,
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  emptyPreDepartureText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    flex: 1,
  },

  // Racing Strategy Section
  racingStrategySection: {
    gap: 10,
  },
  racingStrategyCategoriesList: {
    gap: 12,
  },
  racingStrategyCategory: {
    gap: 8,
  },
  racingStrategyCategoryHeader: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  racingStrategyCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  racingStrategyItemsList: {
    gap: 6,
    paddingLeft: 13,
  },
  racingStrategyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  racingStrategyItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  racingStrategyItemValue: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  emptyRacingStrategyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.gray6,
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  emptyRacingStrategyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    flex: 1,
  },

  // Completed Race View (legacy)
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  completedValue: {
    fontSize: 32,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  completedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  completedHint: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    marginTop: 12,
  },

  // Historical View Styles
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.green}15`,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  completionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  historicalContent: {
    gap: 12,
  },
  historicalInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },

  // Retrospective Checklist Styles
  retroSummary: {
    gap: 8,
  },
  retroSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  retroProgressBar: {
    height: 6,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  retroProgressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 3,
  },
  retroDetailsList: {
    gap: 16,
    marginTop: 8,
  },
  retroCategory: {
    gap: 8,
  },
  retroCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retroCategoryLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  retroCategoryCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  retroItemsList: {
    gap: 6,
    paddingLeft: 20,
  },
  retroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retroCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retroCheckboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  retroCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  retroItemLabel: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.label,
  },
  retroItemLabelNotDone: {
    color: IOS_COLORS.gray,
  },

  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  reviewButtonPressed: {
    backgroundColor: IOS_COLORS.gray5,
  },
  reviewButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Countdown
  countdownContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  countdownUrgent: {
    backgroundColor: `${IOS_COLORS.red}15`,
  },
  countdownValue: {
    fontSize: 48,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  countdownValueUrgent: {
    color: IOS_COLORS.red,
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  countdownLabelUrgent: {
    color: IOS_COLORS.red,
  },
  tapToStartHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  tapToStartText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  tapToStartTextUrgent: {
    color: IOS_COLORS.red,
  },

  // Start Timer Button
  startTimerButton: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startTimerText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Check-in Button
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: IOS_COLORS.blue,
    borderRadius: 12,
    paddingVertical: 12,
  },
  checkInButtonDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkInText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  checkInTextDone: {
    color: '#FFFFFF',
  },

  // Section
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },

  // Checklist - Standardized to match EducationalChecklistItem style
  checklistContainer: {
    gap: 8,
  },
  // Card-style checklist item (matches EducationalChecklistItem)
  checklistItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checklistItemCardCompleted: {
    backgroundColor: '#34C75908', // Faint green tint
    opacity: 0.85,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Circle checkbox (24x24, matches EducationalChecklistItem)
  checkboxCircle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Legacy square checkbox styles (kept for backwards compatibility)
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checklistLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  checklistLabelDone: {
    color: IOS_COLORS.secondaryLabel,
    textDecorationLine: 'line-through',
    textDecorationColor: IOS_COLORS.gray,
  },
});

export default OnWaterContent;
