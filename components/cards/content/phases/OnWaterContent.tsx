/**
 * OnWaterContent - On Water Phase Content
 *
 * Content shown when selectedPhase === 'on_water'
 * Includes:
 * - Countdown timer
 * - Course info (VHF, signals, course number)
 * - Quick rules reference
 * - Check-in status
 * - GPS tracking (when active)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, TouchableOpacity } from 'react-native';
import {
  Award,
  BarChart2,
  BookOpen,
  Car,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CloudSun,
  Compass,
  FileText,
  ListChecks,
  Map,
  Navigation,
  Radio,
  Shield,
  Target,
  Timer,
  Trophy,
  Users,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react-native';

import { CardRaceData, getTimeUntilRace } from '../../types';
import { useRacePreparation } from '@/hooks/useRacePreparation';
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
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#FAFAFA',
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

/**
 * Retrospective Checklist Section - Shows all checklist items with completed/not status
 */
interface RetrospectiveChecklistSectionProps {
  raceType: RaceType;
  phase: 'days_before' | 'race_morning' | 'on_water';
  completions: Record<string, { completedAt: string; notes?: string }> | undefined;
}

function RetrospectiveChecklistSection({
  raceType,
  phase,
  completions,
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
}: OnWaterContentProps) {
  // Live countdown
  const [timeUntilRace, setTimeUntilRace] = useState(() => getTimeUntilRace(race.date, race.startTime));

  // Start sequence timer state
  const [showStartSequence, setShowStartSequence] = useState(false);

  // Race preparation data (for historical view)
  const { intentions } = useRacePreparation({
    regattaId: race.id,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRace(getTimeUntilRace(race.date, race.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [race.date, race.startTime]);

  const countdown = useMemo(() => formatCountdown(timeUntilRace), [timeUntilRace]);

  // Race info
  const vhfChannel = race.vhf_channel;
  const courseNumber = (race as any).course_number || (race as any).course_code;
  const raceType: RaceType = race.race_type || 'fleet';

  // Check-in status (would come from race entry in production)
  const [checkedIn, setCheckedIn] = useState(false);

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

  // Pre-start checklist
  const preStartChecks = [
    { id: 'course', label: 'Sailed course in miniature', done: false },
    { id: 'laylines', label: 'Checked laylines', done: false },
    { id: 'favored', label: 'Identified favored end', done: false },
    { id: 'rules', label: 'Reviewed start rules', done: false },
  ];

  // Check if race is significantly past (2+ hours since start)
  const isRaceCompleted = timeUntilRace < -2 * 60 * 60 * 1000;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // For completed races, show rich historical reflection view
  if (isRaceCompleted) {
    // Get demo race details for results, analysis, weather
    const demoDetails = DemoRaceService.isDemoRace(race.id)
      ? DemoRaceService.getDemoRaceDetails(race.id)
      : null;

    const hasResults = !!demoDetails?.results;
    const hasAnalysis = !!demoDetails?.analysis;
    const hasWeather = !!demoDetails?.weather;
    const hasRacePlan = !!intentions.strategyBrief?.raceIntention;

    return (
      <View style={styles.container}>
        {/* Subtle Completion Badge */}
        <View style={styles.completionBadge}>
          <CheckCircle size={14} color={IOS_COLORS.green} />
          <Text style={styles.completionBadgeText}>Completed</Text>
        </View>

        <View style={styles.historicalContent}>
          {/* Race Result Card - Primary focus */}
          {hasResults && demoDetails?.results && (
            <RaceResultCard results={demoDetails.results} />
          )}

          {/* Conditions Card */}
          {hasWeather && demoDetails?.weather && (
            <ConditionsCard weather={demoDetails.weather} />
          )}

          {/* Race Plan Card - Show pre-race strategy for reflection */}
          {hasRacePlan && intentions.strategyBrief?.raceIntention && (
            <RacePlanCard
              intention={intentions.strategyBrief.raceIntention}
              strategyNotes={intentions.strategyNotes}
            />
          )}

          {/* Performance Analysis Card */}
          {hasAnalysis && demoDetails?.analysis && (
            <PerformanceCard analysis={demoDetails.analysis} />
          )}

          {/* Race Info Summary - only show if VHF/Course available */}
          {(vhfChannel || courseNumber) && (
            <HistoricalSummaryCard
              icon={Radio}
              iconColor={IOS_COLORS.blue}
              title="Race Info"
              expandable={false}
              summary={
                <View style={styles.historicalInfoRow}>
                  {vhfChannel && (
                    <DataStatement label="VHF" value={`Ch ${vhfChannel}`} />
                  )}
                  {courseNumber && (
                    <DataStatement label="Course" value={courseNumber} />
                  )}
                </View>
              }
            />
          )}

          {/* Retrospective Checklist - Condensed */}
          <RetrospectiveChecklistSection
            raceType={raceType}
            phase="on_water"
            completions={intentions.checklistCompletions}
          />

          {/* Review Button */}
          <Pressable
            style={({ pressed }) => [
              styles.reviewButton,
              pressed && styles.reviewButtonPressed,
            ]}
            onPress={onSwitchToReview}
          >
            <Clock size={18} color={IOS_COLORS.blue} />
            <Text style={styles.reviewButtonText}>Add your reflection</Text>
            <ChevronRight size={16} color={IOS_COLORS.gray} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Countdown Timer or Start Sequence Timer */}
      {showStartSequence ? (
        <RaceCountdownTimer
          raceId={race.id}
          raceName={race.name || 'Race'}
          raceDate={race.date}
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

      {/* Race Info Grid */}
      <View style={styles.infoGrid}>
        {vhfChannel && (
          <View style={styles.infoItem}>
            <Radio size={18} color={IOS_COLORS.blue} />
            <View>
              <Text style={styles.infoLabel}>VHF</Text>
              <Text style={styles.infoValue}>Ch {vhfChannel}</Text>
            </View>
          </View>
        )}
        {courseNumber && (
          <View style={styles.infoItem}>
            <Map size={18} color={IOS_COLORS.green} />
            <View>
              <Text style={styles.infoLabel}>Course</Text>
              <Text style={styles.infoValue}>{courseNumber}</Text>
            </View>
          </View>
        )}
        <View style={styles.infoItem}>
          <BookOpen size={18} color={IOS_COLORS.orange} />
          <View>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{raceType.charAt(0).toUpperCase() + raceType.slice(1)}</Text>
          </View>
        </View>
      </View>

      {/* Check-in Status */}
      <Pressable
        style={[styles.checkInButton, checkedIn && styles.checkInButtonDone]}
        onPress={() => setCheckedIn(!checkedIn)}
      >
        <Check size={18} color={checkedIn ? '#FFFFFF' : IOS_COLORS.blue} />
        <Text style={[styles.checkInText, checkedIn && styles.checkInTextDone]}>
          {checkedIn ? 'Checked in with RC' : 'Tap when checked in'}
        </Text>
      </Pressable>

      {/* Pre-Start Checklist (expanded only) */}
      {isExpanded && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRE-START CHECKS</Text>
          <View style={styles.checklistContainer}>
            {preStartChecks.map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                  {item.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checklistLabel, item.done && styles.checklistLabelDone]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Rules Reference */}
      {isExpanded && (
        <View style={styles.rulesContainer}>
          <Text style={styles.sectionLabel}>QUICK RULES</Text>
          <View style={styles.rulesList}>
            <Text style={styles.ruleItem}>• Port gives way to starboard</Text>
            <Text style={styles.ruleItem}>• Windward boat keeps clear</Text>
            <Text style={styles.ruleItem}>• Boat clear astern keeps clear</Text>
            <Text style={styles.ruleItem}>• Proper course at mark (3 lengths)</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
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

  // Checklist
  checklistContainer: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  checklistLabelDone: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },

  // Rules
  rulesContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  rulesList: {
    gap: 6,
  },
  ruleItem: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
});

export default OnWaterContent;
