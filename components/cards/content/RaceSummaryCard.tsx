/**
 * RaceSummaryCard - Position 0 (Default View)
 *
 * Tufte-inspired race summary:
 * - Typography IS the interface (no colored badges)
 * - Maximum data density with sparklines
 * - Single encoding per concept (no icon + label)
 * - Every pixel shows data, not decoration
 */

import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Navigation,
  Trophy,
  Users,
  XCircle,
  Clock,
  FileText,
  Sun,
  Map,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState, useRef, Component, ErrorInfo, useEffect } from 'react';
import { ActionSheetIOS, LayoutAnimation, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { IOSSegmentedControl } from '@/components/ui/ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { showAlertWithButtons } from '@/lib/utils/crossPlatformAlert';
import { triggerHaptic } from '@/lib/haptics';
import { useRouter } from 'expo-router';

import { CrewHub } from '@/components/crew';
import type { CrewHubTab } from '@/components/crew';
import { DetailBottomSheet } from '@/components/races/DetailBottomSheet';
import { ModuleDetailBottomSheet } from '@/components/races/ModuleDetailBottomSheet';
import type { ModuleContentSummary } from '@/components/races/ModuleDetailBottomSheet';
import { RaceChatDrawer } from '@/components/races/RaceChatDrawer';
import { RaceStartInfoBar } from '@/components/races/RaceStartInfoBar';
import { CrewAvatarStack } from '@/components/races/CrewAvatarStack';
import { CollaborationPopover } from '@/components/races/CollaborationPopover';
import { useRaceCollaborators } from '@/hooks/useRaceCollaborators';
import { useRaceMessages } from '@/hooks/useRaceMessages';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { RaceCollaborationService } from '@/services/RaceCollaborationService';
import { useQueryClient } from '@tanstack/react-query';
import { DetailedReviewModal } from '@/components/races/DetailedReviewModal';
import { SuggestionsSection } from '@/components/races/suggestions/SuggestionsSection';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import type { DetailCardType } from '@/constants/navigationAnimations';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import { useRaceAnalysisState } from '@/hooks/useRaceAnalysisState';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useRaceSeriesPosition } from '@/hooks/useRaceSeriesPosition';
import { useRaceStartOrder } from '@/hooks/useRaceStartOrder';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { useRaceWeatherForecast } from '@/hooks/useRaceWeatherForecast';
import { usePhaseCompletionCounts, formatPhaseCompletionLabel } from '@/hooks/usePhaseCompletionCounts';
import { NURSING_CORE_V1_CAPABILITIES } from '@/configs/competencies/nursing-core-v1';
import { detectRaceType } from '@/lib/races/raceDataUtils';
import {
  CardContentProps,
  RACE_PHASES,
  RacePhase,
  getCurrentPhaseForRace,
} from '../types';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import { useInterest } from '@/providers/InterestProvider';
import { supabase } from '@/services/supabase';
import { isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback';
import { isUuid } from '@/utils/uuid';
import {
  AfterRaceContent,
  ConfigDrivenPhaseContent,
  DaysBeforeContent,
  OnWaterContent,
} from './phases';
import { StepPlanQuestions } from '@/components/step/StepPlanQuestions';
import { StepDrawContent } from '@/components/step/StepDrawContent';
import { DateEnrichmentCard } from '@/components/step/DateEnrichmentCard';
import { StepCritiqueContent } from '@/components/step/StepCritiqueContent';
import { BrainDumpEntry } from '@/components/step/BrainDumpEntry';
import { AIStructureReview } from '@/components/step/AIStructureReview';
import type { BrainDumpData, StepMetadata, StepPlanData, StepCollaborator, SubStep } from '@/types/step-detail';
import { useUpdateStepMetadata } from '@/hooks/useStepDetail';
import { useUpdateStep } from '@/hooks/useTimelineSteps';
import { useAuth } from '@/providers/AuthProvider';
import { structureBrainDump } from '@/services/ai/StepPlanAIService';
import { saveUrlsToLibrary } from '@/services/ai/BrainDumpAIService';
import { resolveEntities, buildEntityInput } from '@/services/ai/EntityResolutionService';
import { enrichDateForSailing } from '@/services/ai/DateEnrichmentService';
import { sailorBoatService } from '@/services/SailorBoatService';
import { equipmentService } from '@/services/EquipmentService';
import type { AnyExtractedEntity, DateEnrichment, ExtractedPersonEntity } from '@/types/step-detail';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
};

// Distance racing purple theme
const DISTANCE_COLORS = {
  primary: '#7C3AED',
  accent: '#8B5CF6',
  badgeBg: '#EDE9FE',
  badgeText: '#7C3AED',
  routeBg: '#F5F3FF',
} as const;

const NURSING_CAPABILITY_TITLE_BY_ID = new globalThis.Map(
  NURSING_CORE_V1_CAPABILITIES.map((capability) => [capability.id, capability.title])
);

// Phase labels are now driven by useInterestEventConfig() — see phaseTabs useMemo below

// =============================================================================
// ERROR BOUNDARY for phase content debugging
// =============================================================================

class PhaseContentErrorBoundary extends Component<
  { children: React.ReactNode; phase: string },
  { hasError: boolean; error: string | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PhaseContentErrorBoundary] ${this.props.phase} crashed:`, error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 14, color: '#FF3B30', fontWeight: '600', marginBottom: 8 }}>
            Phase content error
          </Text>
          <Text style={{ fontSize: 12, color: '#8E8E93', textAlign: 'center' }}>
            {this.state.error || 'Unknown error'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate countdown to race start
 */
function calculateCountdown(date: string, startTime?: string): {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  daysSince: number; // Days since race completed (for past races)
} {
  const now = new Date();
  const raceDate = new Date(date);

  // Set start time if provided
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    raceDate.setHours(hours || 0, minutes || 0, 0, 0);
  }

  const diffMs = raceDate.getTime() - now.getTime();
  const isPast = diffMs < 0;

  const absDiffMs = Math.abs(diffMs);
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

  // Days since race (for past races)
  const daysSince = isPast ? days : 0;

  // Check if today or tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const raceDayStart = new Date(raceDate);
  raceDayStart.setHours(0, 0, 0, 0);

  const isToday = raceDayStart.getTime() === today.getTime();
  const isTomorrow = raceDayStart.getTime() === tomorrow.getTime();

  return { days, hours, minutes, isPast, isToday, isTomorrow, daysSince };
}

/**
 * Format date for display
 */
function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(time?: string): string {
  if (!time) return 'TBD';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function buildNormalizedRaceDateTime(date?: string, startTime?: string): Date | null {
  if (!date) return null;
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) return null;

  // If date already includes a timestamp, trust it as the single source of truth.
  if (typeof date === 'string' && date.includes('T')) {
    return base;
  }

  // Date-only value: apply startTime (if present) in local time.
  const normalized = new Date(base);
  normalized.setHours(0, 0, 0, 0);
  if (startTime) {
    const [hh, mm] = startTime.split(':').map(Number);
    normalized.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
  }
  return normalized;
}

/**
 * Simplify rig setting label for compact display
 */
function simplifyLabel(label: string): string {
  // Shorten common labels
  const shortenings: Record<string, string> = {
    'Upper Shrouds': 'Uppers',
    'Lower Shrouds': 'Lowers',
    'Forestay Length': 'Forestay',
    'Forestay Tension': 'Forestay',
    'Mast Rake': 'Rake',
    'Spreader Sweep': 'Spreaders',
    'Backstay Tension': 'Backstay',
  };
  return shortenings[label] || label;
}

function parseStringIdList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter((entry) => entry.length > 0);
      }
    } catch {}
    return trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
}

/**
 * Simplify rig setting value for compact display
 * Tufte principle: show only the essential data, nothing more
 */
function simplifyValue(value: string): string {
  if (!value) return '';

  // Extract patterns in priority order
  const extractions = [
    // Loos gauge readings: "Loos PT-2M 14" or "Loos 12"
    { pattern: /Loos(?:\s+PT-\d+\w*)?\s*(\d+)/i, format: (m: RegExpMatchArray) => `${m[1]}` },
    // Tension words
    { pattern: /^(Firm|Light|Moderate|Tight|Loose|Medium|Max|Min)/i, format: (m: RegExpMatchArray) => m[1] },
    // Degrees: "1-2 degrees" or "5°"
    { pattern: /(\d+(?:[.-]\d+)?)\s*(?:degrees?|°)/i, format: (m: RegExpMatchArray) => `${m[1]}°` },
    // CM measurements: "1.86 cm" or "Fixed 1.86cm"
    { pattern: /(\d+(?:\.\d+)?)\s*cm/i, format: (m: RegExpMatchArray) => `${m[1]}cm` },
    // Turns: "minus 1 turn" or "2 turns"
    { pattern: /(?:minus\s+)?(\d+)\s*turns?/i, format: (m: RegExpMatchArray) => `${m[1]}t` },
    // Generic number at start
    { pattern: /^(\d+(?:[.-]\d+)?)/i, format: (m: RegExpMatchArray) => m[1] },
  ];

  for (const { pattern, format } of extractions) {
    const match = value.match(pattern);
    if (match) {
      return format(match);
    }
  }

  // Fallback: very short excerpt
  const cleaned = value
    .replace(/\([^)]*\)/g, '')  // Remove parentheticals
    .replace(/;.*$/, '')         // Remove after semicolon
    .split(/\s+/)
    .slice(0, 2)                 // First 2 words only
    .join(' ');

  return cleaned || '—';
}

/**
 * Format minutes in a compact way
 */
function formatMinutesCompact(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Format countdown in full format: "3d 2h until race"
 * This is the restored Tufte-style countdown format
 */
function formatCountdownFull(countdown: {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
}): string {
  if (countdown.isPast) return 'Race completed';

  const parts: string[] = [];
  if (countdown.days > 0) parts.push(`${countdown.days}d`);
  if (countdown.hours > 0) parts.push(`${countdown.hours}h`);
  if (parts.length === 0) parts.push(`${countdown.minutes}m`);

  return `${parts.join(' ')} until race`;
}

/**
 * Format full date for display
 * "Saturday, Jan 25 at 3:00 PM"
 */
function formatFullDate(date: string, time?: string): string {
  const d = buildNormalizedRaceDateTime(date, time);
  if (!d) return 'Date TBD';
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${weekday}, ${month} ${day} at ${timeStr}`;
}

/**
 * Tufte: Simplify race name
 * Remove club prefix (e.g., "RHKYC ") and redundant "- Race X" suffix
 */
function simplifyRaceName(name: string): string {
  if (!name) return '';

  // Common club prefixes to remove (expand as needed)
  const clubPrefixes = ['RHKYC', 'HKPBC', 'ABC', 'YC', 'SC', 'RC', 'HKSC', 'STC'];
  let simplified = name;

  // Remove club prefix if present at start
  for (const prefix of clubPrefixes) {
    const pattern = new RegExp(`^${prefix}\\s+`, 'i');
    simplified = simplified.replace(pattern, '');
  }

  // Remove "- Race X" at the end since we show race number separately
  simplified = simplified.replace(/\s*-\s*Race\s+\d+$/i, '');

  return simplified.trim();
}

/**
 * Tufte: Determine active phase for inline progress bar
 * Returns the first incomplete phase, or null if all complete
 */
function getActivePhaseForProgress(
  phaseCounts: Record<string, { completed: number; total: number }>,
  isPast: boolean
): { name: string; completed: number; total: number } | null {
  // For past races, show review if incomplete
  if (isPast) {
    const review = phaseCounts['after_race'];
    if (review && review.completed < review.total) {
      return { name: 'Review', ...review };
    }
    return null; // All done
  }

  // Show prep if incomplete (days_before phase)
  const prep = phaseCounts['days_before'];
  if (prep && prep.completed < prep.total) {
    return { name: 'Prep', ...prep };
  }

  // Show race if incomplete (on_water phase)
  const race = phaseCounts['on_water'];
  if (race && race.completed < race.total) {
    return { name: 'Race', ...race };
  }

  // Show review if incomplete (after_race phase)
  const review = phaseCounts['after_race'];
  if (review && review.completed < review.total) {
    return { name: 'Review', ...review };
  }

  return null; // All complete
}

/**
 * Get urgency color based on countdown (iOS system colors)
 */
function getUrgencyColor(days: number, hours: number, isPast: boolean): {
  bg: string;
  text: string;
  label: string;
} {
  if (isPast) {
    return { bg: IOS_COLORS.gray6, text: IOS_COLORS.gray, label: 'Completed' };
  }
  if (days === 0 && hours < 2) {
    return { bg: '#FFEBE9', text: IOS_COLORS.red, label: 'Starting Soon' };
  }
  // All upcoming races show green (Today, Tomorrow, This Week, Upcoming)
  if (days === 0) {
    return { bg: '#E8FAE9', text: IOS_COLORS.green, label: 'Today' };
  }
  if (days <= 1) {
    return { bg: '#E8FAE9', text: IOS_COLORS.green, label: 'Tomorrow' };
  }
  return { bg: '#E8FAE9', text: IOS_COLORS.green, label: 'Upcoming' };
}

/**
 * Get race type badge styling (iOS system colors)
 */
function getRaceTypeBadge(raceType: 'fleet' | 'distance' | 'match' | 'team'): {
  bg: string;
  text: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
} {
  switch (raceType) {
    case 'distance':
      return {
        bg: '#F3E8FF',
        text: IOS_COLORS.purple,
        label: 'DISTANCE',
        icon: Navigation,
      };
    case 'match':
      return {
        bg: '#FFF4E5',
        text: IOS_COLORS.orange,
        label: 'MATCH',
        icon: Trophy,
      };
    case 'team':
      return {
        bg: '#E5F1FF',
        text: IOS_COLORS.blue,
        label: 'TEAM',
        icon: Users,
      };
    case 'fleet':
    default:
      return {
        bg: '#E8FAE9',
        text: IOS_COLORS.green,
        label: 'FLEET',
        icon: Flag,
      };
  }
}

/**
 * Format tide state for display
 */
function formatTideState(state: string): string {
  const stateMap: Record<string, string> = {
    flooding: 'Flood',
    ebbing: 'Ebb',
    slack: 'Slack',
    rising: 'Rising',
    falling: 'Falling',
    high: 'High',
    low: 'Low',
  };
  return stateMap[state] || state;
}

/**
 * Format temporal context for past races (Tufte: subtle hint when memories fade)
 */
function formatTemporalContext(daysSince: number): string {
  if (daysSince === 0) return 'Today';
  if (daysSince === 1) return 'Yesterday';
  if (daysSince >= 3) return `${daysSince} days ago · memories fade`;
  return `${daysSince} days ago`;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Format multi-race results for display
 * Single race: "2nd of 18"
 * Multi-race: "R1: 2/18 · R2: 5/18"
 */
function formatMultiRaceResults(
  raceResults?: Array<{ raceNumber: number; position: number | null; fleetSize: number | null; keyMoment: string | null }>,
  singlePosition?: number,
  singleFleetSize?: number
): string | null {
  // Check for multi-race results first
  if (raceResults && raceResults.length > 0) {
    const resultsWithPosition = raceResults.filter(r => r.position != null);
    if (resultsWithPosition.length === 0) return null;

    if (raceResults.length === 1) {
      // Single race - use full format
      const r = resultsWithPosition[0];
      return `${r.position}${getOrdinalSuffix(r.position!)} of ${r.fleetSize || '?'}`;
    }

    // Multi-race - compact format: "R1: 2/18 · R2: 5/18"
    return resultsWithPosition
      .map(r => `R${r.raceNumber}: ${r.position}/${r.fleetSize || '?'}`)
      .join(' · ');
  }

  // Fall back to single result
  if (singlePosition) {
    return `${singlePosition}${getOrdinalSuffix(singlePosition)} of ${singleFleetSize || '?'}`;
  }

  return null;
}

/**
 * Format multi-race key moments for display
 * Single race: "Lost 3 places on downwind"
 * Multi-race: "R1: Good start · R2: Lost downwind"
 */
function formatMultiRaceKeyMoments(
  raceResults?: Array<{ raceNumber: number; position: number | null; fleetSize: number | null; keyMoment: string | null }>,
  singleKeyMoment?: string
): string | null {
  // Check for multi-race key moments
  if (raceResults && raceResults.length > 0) {
    const resultsWithKeyMoment = raceResults.filter(r => r.keyMoment?.trim());
    if (resultsWithKeyMoment.length === 0) return singleKeyMoment || null;

    if (raceResults.length === 1 && resultsWithKeyMoment[0].keyMoment) {
      // Single race - use full format
      return resultsWithKeyMoment[0].keyMoment;
    }

    // Multi-race - show first 2 with prefix
    return resultsWithKeyMoment
      .slice(0, 2)
      .map(r => `R${r.raceNumber}: ${r.keyMoment}`)
      .join(' · ');
  }

  return singleKeyMoment || null;
}

/**
 * Arrival time options in minutes before the start
 */
const ARRIVAL_TIME_OPTIONS = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1.5 hrs' },
  { minutes: 120, label: '2 hrs' },
];

/**
 * Calculate planned arrival time from race start and minutes before
 */
function calculateArrivalTime(raceDate: string, startTime: string | undefined, minutesBefore: number): string {
  const d = new Date(raceDate);
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    d.setHours(hours || 0, minutes || 0, 0, 0);
  }
  d.setMinutes(d.getMinutes() - minutesBefore);
  return d.toISOString();
}

/**
 * Format arrival time for display
 */
function formatArrivalTimeDisplay(plannedArrival: string, minutesBefore?: number): string {
  if (minutesBefore) {
    if (minutesBefore >= 60) {
      const hours = Math.floor(minutesBefore / 60);
      const mins = minutesBefore % 60;
      return mins > 0 ? `${hours}h ${mins}m before` : `${hours}h before`;
    }
    return `${minutesBefore}m before`;
  }
  const d = new Date(plannedArrival);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceSummaryCard({
  race,
  cardType,
  isActive,
  isExpanded,
  onToggleExpand,
  dimensions,
  canManage,
  onEdit,
  onDelete,
  onRaceComplete,
  onOpenPostRaceInterview,
  userId,
  onDismiss,
  seasonWeek,
  raceNumber,
  totalRaces,
  // Timeline navigation props (compact axis inside card footer)
  timelineRaces,
  currentRaceIndex,
  onSelectRace,
  nextRaceIndex,
  // Scroll handler forwarded from parent for toolbar hide/show
  onContentScroll,
  // Handler for card press (navigation to this card when clicking partially visible cards)
  onCardPress,
  // Refetch trigger for AfterRaceContent
  refetchTrigger,
  onMoveStepEarlier,
  onMoveStepLater,
  onMoveStepToPlannedNext,
  onMoveStepToCompletedMostRecent,
  onNextStepCreated,
}: CardContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { currentInterest } = useInterest();
  const eventConfig = useInterestEventConfig();
  const interestSlug = currentInterest?.slug || eventConfig.interestSlug || 'sail-racing';
  const isSailing = interestSlug === 'sail-racing';

  // Temporal phase state — for timeline steps, map status to the right tab
  const isTimelineStep = Boolean((race as any).isTimelineStep);
  const stepStatus = (race as any).stepStatus ?? (race as any).status;
  const currentPhase = useMemo(() => {
    if (isTimelineStep) {
      if (stepStatus === 'completed' || stepStatus === 'done') return 'after_race' as RacePhase;
      if (stepStatus === 'in_progress') return 'on_water' as RacePhase;
      return 'days_before' as RacePhase; // pending, planned, or any other
    }
    return getCurrentPhaseForRace(race.date, race.startTime);
  }, [race.date, race.startTime, isTimelineStep, stepStatus]);
  // Restore last-used tab for this step, falling back to status-derived default
  const [selectedPhase, setSelectedPhase] = useState<RacePhase>(() => {
    if (isTimelineStep && typeof window !== 'undefined') {
      const saved = window.localStorage?.getItem(`step_tab:${race.id}`);
      if (saved === 'days_before' || saved === 'on_water' || saved === 'after_race') return saved;
    }
    return currentPhase;
  });

  // Persist tab selection for timeline steps
  useEffect(() => {
    if (isTimelineStep && typeof window !== 'undefined') {
      window.localStorage?.setItem(`step_tab:${race.id}`, selectedPhase);
    }
  }, [selectedPhase, isTimelineStep, race.id]);

  // Inline title editing for timeline steps
  const updateStepMutation = useUpdateStep();
  const queryClient = useQueryClient();
  const [editTitle, setEditTitle] = useState(race.name || '');
  const titleInputRef = useRef<TextInput>(null);
  // Track the last title we saved locally so we don't revert on prop re-sync
  const lastSavedTitle = useRef<string | null>(null);

  // Sync editTitle from race.name prop — but skip if we just saved locally
  useEffect(() => {
    if (lastSavedTitle.current !== null && race.name === lastSavedTitle.current) {
      // Prop caught up to our local save — clear the guard
      lastSavedTitle.current = null;
      return;
    }
    if (lastSavedTitle.current !== null) {
      // Prop changed but hasn't caught up to our save yet — keep local value
      return;
    }
    setEditTitle(race.name || '');
  }, [race.name]);

  const handleTitleSubmit = useCallback(() => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      // Revert to current name if blank
      setEditTitle(race.name || '');
      return;
    }
    if (trimmed === race.name) return;

    // Update local state immediately — this is what prevents the revert
    setEditTitle(trimmed);
    lastSavedTitle.current = trimmed;

    // Optimistically update all timeline-steps caches
    queryClient.setQueriesData<any[]>(
      { queryKey: ['timeline-steps'] },
      (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((s) => (s.id === race.id ? { ...s, title: trimmed } : s));
      },
    );

    updateStepMutation.mutate({ stepId: race.id, input: { title: trimmed } });
  }, [editTitle, race.name, race.id, updateStepMutation, queryClient]);

  // Brain dump state for timeline steps
  const metadata = (race as any)?.metadata as StepMetadata | undefined;
  const serverBrainDump = metadata?.brain_dump;
  // Local brain dump state tracks the latest data (server metadata may lag behind)
  const [localBrainDump, setLocalBrainDump] = useState<BrainDumpData | undefined>(serverBrainDump);
  const brainDumpData = localBrainDump ?? serverBrainDump;
  const hasPlanContent = Boolean(
    metadata?.plan?.what_will_you_do?.trim() ||
    (metadata?.plan?.how_sub_steps?.length && metadata?.plan?.how_sub_steps.some((s) => s.text.trim()))
  );
  const [brainDumpPhase, setBrainDumpPhase] = useState<'dump' | 'review' | null>(
    isTimelineStep && brainDumpData && (!hasPlanContent || !brainDumpData.ai_structured_at) ? 'dump' : null,
  );
  const [aiReviewPlan, setAiReviewPlan] = useState<StepPlanData | null>(null);
  const [aiSuggestedTitle, setAiSuggestedTitle] = useState<string | undefined>();
  const [aiStructuring, setAiStructuring] = useState(false);
  const savedLibraryIdsRef = useRef<string[]>([]);
  const [resolvedEntities, setResolvedEntities] = useState<AnyExtractedEntity[]>([]);
  const [dateEnrichment, setDateEnrichment] = useState<DateEnrichment | undefined>();
  const [isEnrichingDate, setIsEnrichingDate] = useState(false);
  const [isResolvingEntities, setIsResolvingEntities] = useState(false);
  const [entityResolutionError, setEntityResolutionError] = useState<string | null>(null);
  const updateStepMetadata = useUpdateStepMetadata(isTimelineStep ? race.id : '');

  const handleSkipToPlan = useCallback((currentDump: BrainDumpData) => {
    // Keep local state in sync so going back to brain dump preserves text
    setLocalBrainDump(currentDump);
    // Carry brain dump content into the plan so nothing is lost
    if (currentDump.raw_text?.trim()) {
      const collaborators: StepCollaborator[] = (currentDump.extracted_people ?? [])
        .filter((name) => name.trim())
        .map((name, i) => ({
          id: `external_${i}_${Date.now()}`,
          type: 'external' as const,
          display_name: name.trim(),
        }));
      updateStepMetadata.mutate(
        {
          brain_dump: currentDump,
          plan: {
            ...(metadata?.plan ?? {}),
            what_will_you_do: metadata?.plan?.what_will_you_do || currentDump.raw_text,
            who_collaborators: currentDump.extracted_people,
            collaborators: collaborators.length > 0 ? collaborators : undefined,
            capability_goals: currentDump.extracted_topics.length > 0
              ? currentDump.extracted_topics : undefined,
          },
        },
        { onSuccess: () => setBrainDumpPhase(null) },
      );
    } else {
      setBrainDumpPhase(null);
    }
  }, [metadata?.plan, updateStepMetadata]);

  const handleStructureWithAI = useCallback(async (dump: BrainDumpData) => {
    updateStepMetadata.mutate({ brain_dump: dump });
    setAiStructuring(true);

    // Save extracted URLs to library in the background
    const resolvedInterestId = (race as any).interest_id ?? currentInterest?.id;
    if (dump.extracted_urls.length > 0 && user?.id && resolvedInterestId) {
      saveUrlsToLibrary(dump.extracted_urls, user.id, resolvedInterestId)
        .then((savedIds) => {
          savedLibraryIdsRef.current = savedIds;
        })
        .catch(() => {});
    }

    try {
      const result = await structureBrainDump({
        brainDump: dump,
        interestName: currentInterest?.name ?? 'sailing',
        interestId: (race as any).interest_id ?? currentInterest?.id,
        interestSlug: currentInterest?.slug,
        userId: user?.id ?? '',
      });

      const plan: StepPlanData = {
        what_will_you_do: result.what_will_you_do,
        how_sub_steps: result.how_sub_steps.map((text, i) => ({
          id: `ai_${i}_${Date.now()}`,
          text,
          sort_order: i,
          completed: false,
        })),
        who_collaborators: result.who_collaborators,
        why_reasoning: result.why_reasoning,
        capability_goals: result.capability_goals.length > 0 ? result.capability_goals : undefined,
      };

      setAiReviewPlan(plan);
      setAiSuggestedTitle(result.suggested_title || undefined);
      setResolvedEntities([]);
      setDateEnrichment(undefined);
      setEntityResolutionError(null);
      setBrainDumpPhase('review');

      // Fire entity resolution async (updates state as results arrive)
      if (user?.id) {
        const entityInput = buildEntityInput(dump, result.extracted_entities, result.who_collaborators);
        setIsResolvingEntities(true);
        resolveEntities(entityInput, user.id)
          .then(async (resolution) => {
            setResolvedEntities(resolution.entities);

            // Date enrichment for sailing
            const isSailing = currentInterest?.slug?.includes('sail') || currentInterest?.name?.toLowerCase().includes('sail');
            if (isSailing && resolution.firstDateIso && resolution.resolvedLocationCoords) {
              setIsEnrichingDate(true);
              try {
                let userBoats: any[] = [];
                let userEquipment: any[] = [];
                try {
                  userBoats = await sailorBoatService.listBoatsForSailor(user.id);
                  const primaryBoat = userBoats.find((b: any) => b.is_primary) || userBoats[0];
                  if (primaryBoat) {
                    userEquipment = await equipmentService.getEquipmentForBoat(primaryBoat.id);
                  }
                } catch {}

                const enrichment = await enrichDateForSailing({
                  dateIso: resolution.firstDateIso!,
                  coordinates: resolution.resolvedLocationCoords!,
                  venueId: resolution.resolvedVenueId,
                  userBoats,
                  userEquipment,
                });
                setDateEnrichment(enrichment);
              } finally {
                setIsEnrichingDate(false);
              }
            }
          })
          .catch((err) => {
            console.error('[EntityResolution] failed:', err);
            setEntityResolutionError(String(err));
          })
          .finally(() => setIsResolvingEntities(false));
      }
    } catch (err) {
      console.error('AI structuring failed:', err);
      const plan: StepPlanData = {
        what_will_you_do: dump.raw_text,
        who_collaborators: dump.extracted_people,
        capability_goals: dump.extracted_topics.length > 0 ? dump.extracted_topics : undefined,
      };
      setAiReviewPlan(plan);
      setBrainDumpPhase('review');
    } finally {
      setAiStructuring(false);
    }
  }, [updateStepMetadata, currentInterest, race, user]);

  const handleConfirmAIPlan = useCallback((confirmedPlan: StepPlanData, title?: string) => {
    // Merge any saved library resource IDs into the plan
    let enrichedPlan: StepPlanData = savedLibraryIdsRef.current.length > 0
      ? { ...confirmedPlan, linked_resource_ids: [
          ...new Set([...(confirmedPlan.linked_resource_ids ?? []), ...savedLibraryIdsRef.current]),
        ]}
      : { ...confirmedPlan };

    // Convert who_collaborators strings to structured StepCollaborator entries
    // Use resolved person entities for platform user linking
    const personEntities = resolvedEntities.filter(
      (e): e is ExtractedPersonEntity => e.type === 'person',
    );
    if (personEntities.length > 0) {
      enrichedPlan.collaborators = personEntities.map((p, i) => ({
        id: p.matched_user_id || `external_${i}_${Date.now()}`,
        type: (p.matched_user_id ? 'platform' : 'external') as 'platform' | 'external',
        user_id: p.matched_user_id,
        display_name: p.matched_display_name || p.raw_text,
      }));
    } else if (enrichedPlan.who_collaborators?.length && !enrichedPlan.collaborators?.length) {
      enrichedPlan.collaborators = enrichedPlan.who_collaborators
        .filter((name) => name.trim())
        .map((name, i) => ({
          id: `external_${i}_${Date.now()}`,
          type: 'external' as const,
          display_name: name.trim(),
        }));
    }

    // Add entity context
    if (resolvedEntities.length > 0) {
      enrichedPlan.equipment_context = resolvedEntities;
    }
    if (dateEnrichment) {
      enrichedPlan.date_enrichment = dateEnrichment;
    }

    updateStepMetadata.mutate(
      {
        plan: enrichedPlan,
        brain_dump: { ...(brainDumpData ?? {} as BrainDumpData), ai_structured_at: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          // Only transition after DB write + cache update complete
          // so StepPlanQuestions reads the confirmed plan from cache
          setAiReviewPlan(null);
          setBrainDumpPhase(null);
          savedLibraryIdsRef.current = [];
          setResolvedEntities([]);
          // Keep dateEnrichment in local state so it persists across tab switches
          // (race.metadata won't refresh until the list query re-fetches)
        },
      },
    );

    // Update step title and optional starts_at from first date entity
    const stepUpdate: Record<string, any> = {};
    if (title) stepUpdate.title = title;
    const firstDate = resolvedEntities.find(
      (e): e is import('@/types/step-detail').ExtractedDateEntity => e.type === 'date',
    );
    if (firstDate?.parsed_iso) stepUpdate.starts_at = firstDate.parsed_iso;
    if (Object.keys(stepUpdate).length > 0) {
      updateStepMutation.mutate({ stepId: race.id, input: stepUpdate });
    }
  }, [race.id, brainDumpData, updateStepMetadata, updateStepMutation, resolvedEntities, dateEnrichment]);

  const handleResolveAmbiguousPerson = useCallback((rawText: string, userId: string, displayName: string) => {
    setResolvedEntities((prev) =>
      prev.map((e) => {
        if (e.type === 'person' && e.raw_text === rawText) {
          return {
            ...e,
            matched_user_id: userId,
            matched_display_name: displayName,
            confidence: 'exact',
            ambiguous_matches: undefined,
          } as ExtractedPersonEntity;
        }
        return e;
      }),
    );
  }, []);

  const handleBackToDump = useCallback(() => {
    setBrainDumpPhase('dump');
    setAiReviewPlan(null);
    setResolvedEntities([]);
    setDateEnrichment(undefined);
  }, []);

  const handleDraftChange = useCallback((dump: BrainDumpData) => {
    setLocalBrainDump(dump);
    updateStepMetadata.mutate({ brain_dump: dump });
  }, [updateStepMetadata]);

  // Detail bottom sheet state
  const [activeDetailSheet, setActiveDetailSheet] = useState<DetailCardType | null>(null);

  // Module detail sheet state (non-sailing interests)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Module content state (tracks user-entered content for tile previews)
  const [moduleContent, setModuleContent] = useState<Record<string, ModuleContentSummary>>({});
  const handleModuleContentChange = useCallback((modId: string, summary: ModuleContentSummary) => {
    setModuleContent((prev) => ({ ...prev, [modId]: summary }));
  }, []);
  const [advancedCompetencyCount, setAdvancedCompetencyCount] = useState(0);
  const [hasValidatedCompetency, setHasValidatedCompetency] = useState(false);
  const moduleArtifactContext = useMemo(() => {
    const source = String((race as any)?._source || (race as any)?.source || (race as any)?.source_table || '').toLowerCase();
    const explicitType = String((race as any)?.event_type || (race as any)?.eventType || (race as any)?.metadata?.event_type || '').toLowerCase();
    const explicitId = String((race as any)?.event_id || (race as any)?.eventId || (race as any)?.metadata?.event_id || '').trim();
    const fallbackId = String((race as any)?.id || '').trim();
    const eventId = explicitId || fallbackId;

    let eventType: 'regatta' | 'race_event' | null = null;
    if (explicitType === 'regatta' || explicitType === 'race_event') {
      eventType = explicitType;
    } else if (source.includes('race_event')) {
      eventType = 'race_event';
    } else if (source.includes('regatta') || eventId.length > 0) {
      eventType = 'regatta';
    }

    if (!eventType || !eventId) return null;
    return {
      eventType,
      eventId,
      userId: userId || null,
    };
  }, [race, userId]);

  useEffect(() => {
    let isCancelled = false;
    const loadAdvancedCount = async () => {
      if (
        interestSlug !== 'nursing'
        || !userId
        || !isUuid(userId)
        || !moduleArtifactContext?.eventId
        || !isUuid(moduleArtifactContext.eventId)
      ) {
        if (!isCancelled) {
          setAdvancedCompetencyCount(0);
          setHasValidatedCompetency(false);
        }
        return;
      }

      const primaryQuery = supabase
        .from('betterat_competency_attempts')
        .select('competency_id,artifact_id,status')
        .eq('user_id', userId)
        .eq('event_id', moduleArtifactContext.eventId)
        .eq('event_type', moduleArtifactContext.eventType);
      let { data, error } = await primaryQuery;
      if (error) {
        if (isMissingSupabaseColumn(error, 'betterat_competency_attempts.event_type')) {
          const fallback = await supabase
            .from('betterat_competency_attempts')
            .select('competency_id,artifact_id,status')
            .eq('user_id', userId)
            .eq('event_id', moduleArtifactContext.eventId);
          data = fallback.data;
          error = fallback.error;
        }
      }
      if (error) {
        if (!isCancelled) {
          setAdvancedCompetencyCount(0);
          setHasValidatedCompetency(false);
        }
        return;
      }

      const hasValidated = (data || []).some((row: any) => (
        typeof row.artifact_id === 'string'
        && row.artifact_id.length > 0
        && String(row.status || '') === 'validated'
      ));

      const uniqueIds = new Set(
        (data || [])
          .filter((row: any) => typeof row.artifact_id === 'string' && row.artifact_id.length > 0)
          .map((row: any) => String(row.competency_id || ''))
          .filter((id: string) => id.length > 0)
      );

      if (!isCancelled) {
        setAdvancedCompetencyCount(uniqueIds.size);
        setHasValidatedCompetency(hasValidated);
      }
    };

    loadAdvancedCount();

    return () => {
      isCancelled = true;
    };
  }, [interestSlug, moduleArtifactContext, userId]);

  // Detailed Review modal state
  const [showDetailedReview, setShowDetailedReview] = useState(false);

  // Crew Hub state (unified crew management)
  const [showCrewHub, setShowCrewHub] = useState(false);
  const [crewHubInitialTab, setCrewHubInitialTab] = useState<CrewHubTab>('roster');

  // Chat drawer state
  const [showChat, setShowChat] = useState(false);
  const [showCollabPopover, setShowCollabPopover] = useState(false);
  const { collaborators } = useRaceCollaborators(isTimelineStep ? null : race.id);

  // Messages for collaboration popover activity feed
  const { messages: raceMessages } = useRaceMessages({
    regattaId: isTimelineStep ? undefined : race.id,
    realtime: FEATURE_FLAGS.ENABLE_RACE_CREW_CHAT,
  });

  // Share handler
  const handleShare = useCallback(async () => {
    try {
      const dateStr = new Date(race.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const activityLabel = eventConfig.eventNoun || (isSailing ? 'Race' : 'Activity');
      const locationLabel = isSailing ? 'Venue' : 'Location';
      const sourceLabel = isSailing ? 'Shared from RegattaFlow' : 'Shared from BetterAt Clinical';
      const locationValue = race.venue || 'TBD';

      const parts = [`${activityLabel}: ${race.name}`, `${activityLabel} date: ${dateStr}`];
      parts.push(`${locationLabel}: ${locationValue}`);
      parts.push(sourceLabel);
      await Share.share({ message: parts.join('\n'), title: race.name });
    } catch {
      // User cancelled — no-op
    }
  }, [eventConfig.eventNoun, isSailing, race.name, race.date, race.venue]);

  // Extract collaboration flags from race
  const isOwner = (race as any).isOwner ?? true; // Default true for backward compatibility
  const isCollaborator = (race as any).isCollaborator ?? false;
  const isPendingInvite = (race as any).isPendingInvite ?? false;
  const collaboratorId = (race as any).collaboratorId;

  // Accept/decline invite handlers
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAcceptInvite = useCallback(async () => {
    if (!collaboratorId || isAccepting) return;
    setIsAccepting(true);
    try {
      await RaceCollaborationService.acceptInvite(collaboratorId);
      // Invalidate queries to refresh the races list
      queryClient.invalidateQueries({ queryKey: ['races'] });
      queryClient.invalidateQueries({ queryKey: ['race-collaborators', race.id] });
    } catch (error) {
      console.error('Failed to accept invite:', error);
    } finally {
      setIsAccepting(false);
    }
  }, [collaboratorId, isAccepting, queryClient, race.id]);

  const handleDeclineInvite = useCallback(async () => {
    if (!collaboratorId || isDeclining) return;
    setIsDeclining(true);
    try {
      await RaceCollaborationService.declineInvite(collaboratorId);
      // Invalidate queries to refresh the races list
      queryClient.invalidateQueries({ queryKey: ['races'] });
      queryClient.invalidateQueries({ queryKey: ['race-collaborators', race.id] });
    } catch (error) {
      console.error('Failed to decline invite:', error);
    } finally {
      setIsDeclining(false);
    }
  }, [collaboratorId, isDeclining, queryClient, race.id]);

  // Handler to open detail sheet
  const handleOpenDetail = useCallback((type: DetailCardType) => {
    setActiveDetailSheet(type);
  }, []);

  // Handler to close detail sheet
  const handleCloseDetailSheet = useCallback(() => {
    setActiveDetailSheet(null);
  }, []);

  // Handler to open module detail sheet (non-sailing interests)
  const handleModulePress = useCallback((moduleId: string) => {
    setActiveModuleId(moduleId);
  }, []);

  // Handler to close module detail sheet
  const handleCloseModuleSheet = useCallback(() => {
    setActiveModuleId(null);
  }, []);

  // Handler for scroll position tracking (shows edge gradients + toolbar hide/show)
  const handleContentScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onContentScroll?.(event);
  }, [onContentScroll]);

  // Handler to open detailed review modal
  const handleOpenDetailedReview = useCallback(() => {
    setShowDetailedReview(true);
  }, []);

  // Handler to close detailed review modal
  const handleCloseDetailedReview = useCallback(() => {
    setShowDetailedReview(false);
  }, []);

  // Handler for detailed review completion
  const handleDetailedReviewComplete = useCallback(() => {
    setShowDetailedReview(false);
    // The modal handles saving internally, just close it
  }, []);

  // Update selected phase when current phase changes (e.g., race day arrives)
  React.useEffect(() => {
    setSelectedPhase(currentPhase);
  }, [currentPhase]);

  // Arrival plan section state
  const [arrivalExpanded, setArrivalExpanded] = useState(false);
  const [arrivalNotes, setArrivalNotes] = useState('');

  // Hook for race preparation data (includes arrival intentions)
  const { intentions, updateArrivalIntention, isSaving } = useRacePreparation({
    regattaId: race.id,
    autoSave: true,
    debounceMs: 1000,
  });

  // Hook for race analysis state (Tufte "absence as interface")
  const { state: analysisState } = useRaceAnalysisState(race.id, race.date, userId);

  // Hook for race analysis data (actual content for display)
  const { analysisData } = useRaceAnalysisData(race.id, userId);

  // Get current arrival intention
  const arrivalIntention = intentions.arrivalTime;

  // Sync local notes with saved intention
  React.useEffect(() => {
    if (arrivalIntention?.notes !== undefined && arrivalIntention.notes !== arrivalNotes) {
      setArrivalNotes(arrivalIntention.notes);
    }
  }, [arrivalIntention?.notes]);

  // Handle selecting an arrival time option
  const handleSelectArrivalTime = useCallback((minutesBefore: number) => {
    const plannedArrival = calculateArrivalTime(race.date, race.startTime, minutesBefore);
    updateArrivalIntention({
      plannedArrival,
      minutesBefore,
      notes: arrivalNotes,
    });
  }, [race.date, race.startTime, arrivalNotes, updateArrivalIntention]);

  // Handle notes change (on blur)
  const handleArrivalNotesBlur = useCallback(() => {
    if (arrivalIntention) {
      updateArrivalIntention({
        ...arrivalIntention,
        notes: arrivalNotes,
      });
    }
  }, [arrivalIntention, arrivalNotes, updateArrivalIntention]);

  // Toggle arrival section
  const toggleArrivalSection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setArrivalExpanded(prev => !prev);
  }, []);

  // Detect race type from name or explicit setting
  const detectedRaceType = useMemo(() => {
    const explicit = race.race_type as 'fleet' | 'distance' | 'match' | 'team' | undefined;
    const distance = (race as any).total_distance_nm;
    return detectRaceType(race.name, explicit, distance) as 'fleet' | 'distance' | 'match' | 'team';
  }, [race.name, race.race_type, (race as any).total_distance_nm]);

  const isDistanceRace = detectedRaceType === 'distance';

  // Get phase completion counts for tab labels (Tufte: data in the labels)
  const { counts: phaseCounts } = usePhaseCompletionCounts({
    regattaId: race.id,
    raceType: detectedRaceType,
    enabled: true,
  });

  // Get race type badge styling
  const raceTypeBadge = useMemo(
    () => getRaceTypeBadge(detectedRaceType),
    [detectedRaceType]
  );

  // Calculate countdown.
  // For non-sailing steps, prefer the timestamp in `race.date` (start_date)
  // instead of legacy `startTime`, which can be stale in mixed schemas.
  const effectiveCountdownStartTime = useMemo(() => {
    if (!isSailing && typeof race.date === 'string' && race.date.includes('T')) {
      return undefined;
    }
    return race.startTime;
  }, [isSailing, race.date, race.startTime]);

  const countdown = useMemo(
    () => calculateCountdown(race.date, effectiveCountdownStartTime),
    [race.date, effectiveCountdownStartTime]
  );
  const rawTimelineStatus = String((race as any)?.status || (race as any)?.metadata?.status || '').toLowerCase();
  const isExplicitlyCompleted = rawTimelineStatus === 'completed' || rawTimelineStatus === 'done';
  const isOverdue = !isExplicitlyCompleted && countdown.isPast && !isTimelineStep;
  const isTimelineDone = isExplicitlyCompleted;
  const isNextStepCard =
    typeof raceNumber === 'number' &&
    typeof nextRaceIndex === 'number' &&
    (raceNumber - 1) === nextRaceIndex;
  const eventSubtype = String((race as any)?.metadata?.event_subtype || '').toLowerCase();
  const isBlankActivitySubtype = eventSubtype === 'blank_activity';
  const isGroupLearningCycleSubtype = eventSubtype === 'group_learning_cycle';
  const normalizedStepDateTime = useMemo(
    () => buildNormalizedRaceDateTime(race.date, race.startTime),
    [race.date, race.startTime]
  );
  const effectiveRaceName = race.name;
  const displayRaceName = (() => {
    const raw = String(effectiveRaceName || 'Step').replace(/^Activity/i, 'Step');

    if (isBlankActivitySubtype) {
      const isGenerated = /^Step\s*[-—]\s*\d{4}-\d{2}-\d{2}$/i.test(raw);
      if (!isGenerated) return raw;
      if (!normalizedStepDateTime) return 'Step';
      return `Step — ${normalizedStepDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    // Legacy records for non-nursing interests may still carry "Group Cycle".
    // Normalize the generated title so domain language stays consistent.
    if (!isSailing && isGroupLearningCycleSubtype) {
      const isLegacyGenerated = /^Group\s*Cycle\s*[-—]\s*\d{4}-\d{2}-\d{2}$/i.test(raw);
      if (isLegacyGenerated) {
        if (!normalizedStepDateTime) return 'Team Step';
        return `Team Step — ${normalizedStepDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
    }

    return race.name;
  })();

  // For timeline steps that aren't done, never show gray "past" styling —
  // the step is still active regardless of its calendar date.
  const effectiveIsPast = isTimelineStep ? isExplicitlyCompleted : countdown.isPast;

  // Get urgency colors
  const urgency = useMemo(
    () => getUrgencyColor(countdown.days, countdown.hours, effectiveIsPast),
    [countdown.days, countdown.hours, effectiveIsPast]
  );

  // Extract distance race fields
  const totalDistanceNm = (race as any).total_distance_nm;
  const timeLimitHours = race.time_limit_hours || (race as any).time_limit_hours;
  const routeWaypoints = (race as any).route_waypoints || [];
  const numberOfLegs = (race as any).number_of_legs || routeWaypoints.length || 0;

  // Extract conditions data
  const windData = race.wind;
  const tideData = race.tide;
  const vhfChannel = race.vhf_channel;

  // Check if we have any conditions to show
  const hasConditions = windData || tideData || vhfChannel;

  // Fetch weather forecast for sparklines
  // Check multiple possible venue data sources (full venue object or raw coordinates)
  const venueObj = (race as any).venue_data || (race as any).venue_info;
  const venueCoords = (race as any).venueCoordinates; // From useEnrichedRaces
  // Construct synthetic venue if we have coordinates but no full venue object
  // Use global region to trigger the global fallback weather model (GFS Global)
  // which works for any location without requiring specific country matching
  const venue = venueObj || (venueCoords ? {
    id: `race-${race.id}`,
    name: race.venue || 'Race Location',
    coordinates: venueCoords, // { lat, lng } format works with resolveVenueLocation
    region: 'global', // Use global fallback model - works anywhere
  } : null);

  const { data: forecastData } = useRaceWeatherForecast(venue, race.date, !!venue);

  // Extract additional data for Tufte density
  const fleetSize = (race as any).fleet_size || (race as any).entry_count || (race as any).competitors?.length;
  const courseType = (race as any).course_type || (race as any).course?.type;
  const courseDistance = (race as any).course_distance_nm || (race as any).total_distance_nm;
  const boatClassName = race.boatClass || (race as any).boat_class || (race as any).class_name;

  // Get rig tuning recommendations (only for upcoming races)
  // Only fetch rig tuning when we have wind data to base recommendations on
  const hasWindData = !!(windData?.speedMin || windData?.speedMax);
  const { settings: rigSettings } = useRaceTuningRecommendation({
    className: boatClassName,
    windMin: windData?.speedMin,
    windMax: windData?.speedMax,
    limit: 2,
    enabled: !countdown.isPast && !!boatClassName && hasWindData,
  });

  // Get race series/day position
  const seasonId = (race as any).season_id;
  const { data: seriesPosition } = useRaceSeriesPosition({
    raceId: race.id,
    raceDate: race.date,
    seasonId,
    enabled: true,
  });

  // Get start order info (only for upcoming races)
  const regattaId = (race as any).regatta_id;
  const fleetName = (race as any).fleet_name || (race as any).fleet;
  const { data: startOrderData } = useRaceStartOrder({
    raceId: race.id,
    fleetName,
    boatClass: boatClassName,
    raceDate: race.date,
    regattaId,
    enabled: !countdown.isPast,
  });

  const openCrewHub = useCallback((tab: CrewHubTab = 'roster') => {
    setCrewHubInitialTab(tab);
    setShowCrewHub(true);
  }, []);

  // Build menu items for card management - permission-aware
  const noun = eventConfig.eventNoun;
  const teamNoun = eventConfig.teamNoun ?? 'Team';
  const normalizedInterestSlug = String(interestSlug || '').trim().toLowerCase();
  const isNursingInterest = normalizedInterestSlug === 'nursing';
  const templateSuggestedCompetencyTitles = useMemo(() => {
    if (!isNursingInterest) return [];
    const metadata = ((race as any)?.metadata || {}) as Record<string, unknown>;
    const suggestedIds = parseStringIdList(metadata.org_template_suggested_competency_ids);
    return suggestedIds.map((id) => NURSING_CAPABILITY_TITLE_BY_ID.get(id) || id);
  }, [isNursingInterest, race]);
  const visibleTemplateSuggestedTitles = templateSuggestedCompetencyTitles.slice(0, 3);
  const hiddenTemplateSuggestedCount = Math.max(templateSuggestedCompetencyTitles.length - visibleTemplateSuggestedTitles.length, 0);
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    // Team/Crew Chat — fallback entry point when no avatar row is visible
    if (FEATURE_FLAGS.ENABLE_RACE_CREW_CHAT) {
      items.push({ label: `${teamNoun} Chat`, icon: 'chatbubbles-outline', onPress: () => setShowChat(true) });
    }
    // Explicit collaborator entry point for shared/group workflows.
    items.push({ label: 'Add Collaborators', icon: 'people-outline', onPress: () => openCrewHub('roster') });
    // Share is always available
    items.push({ label: `Share ${noun}`, icon: 'share-outline', onPress: handleShare });
    // Detail (scrollable view) is not part of the nursing experience menu.
    if (!isNursingInterest) {
      items.push({ label: `${noun} Detail`, icon: 'flag-outline', onPress: () => router.push(`/race/${race.id}` as any) });
    }
    // Only show edit/delete for owners
    if (isOwner) {
      if (onMoveStepEarlier) {
        items.push({ label: 'Move Earlier', icon: 'arrow-back-outline', onPress: onMoveStepEarlier });
      }
      if (onMoveStepLater) {
        items.push({ label: 'Move Later', icon: 'arrow-forward-outline', onPress: onMoveStepLater });
      }
      if (onMoveStepToPlannedNext) {
        items.push({
          label: 'Move to Planned',
          icon: 'bookmark-outline',
          onPress: onMoveStepToPlannedNext,
        });
      }
      if (onMoveStepToCompletedMostRecent) {
        items.push({
          label: 'Mark Done',
          icon: 'checkmark-done-outline',
          onPress: onMoveStepToCompletedMostRecent,
        });
      }
      if (onEdit) {
        items.push({ label: `Edit ${noun}`, icon: 'create-outline', onPress: onEdit });
      }
      if (onDelete) {
        items.push({ label: `Delete ${noun}`, icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
      }
    }
    // For demo races, show dismiss option instead of edit/delete
    if ((race as any).isDemo && onDismiss) {
      items.push({ label: 'Dismiss sample', icon: 'close-outline', onPress: onDismiss });
    }
    return items;
  }, [
    onEdit,
    onDelete,
    race,
    onDismiss,
    isOwner,
    handleShare,
    router,
    noun,
    teamNoun,
    openCrewHub,
    isNursingInterest,
    onMoveStepEarlier,
    onMoveStepLater,
    onMoveStepToPlannedNext,
    onMoveStepToCompletedMostRecent,
  ]);

  // Long-press handler to show context menu
  const handleLongPress = useCallback(() => {
    if (!canManage || menuItems.length === 0) return;

    triggerHaptic('impactMedium');

    if (Platform.OS === 'ios') {
      const options = menuItems.map(item => item.label);
      options.push('Cancel');

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: menuItems.findIndex(item => item.variant === 'destructive'),
        },
        (buttonIndex) => {
          if (buttonIndex < menuItems.length) {
            menuItems[buttonIndex].onPress?.();
          }
        }
      );
    } else {
      // Android/Web: Use cross-platform alert
      showAlertWithButtons(
        'Race Options',
        undefined,
        [
          ...menuItems.map(item => ({
            text: item.label,
            onPress: item.onPress,
            style: item.variant === 'destructive' ? ('destructive' as const) : ('default' as const),
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  }, [canManage, menuItems]);

  const handleOverdueBadgePress = useCallback(() => {
    if (!isOverdue) return;
    const actions: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }> = [];
    if (onMoveStepToCompletedMostRecent) {
      actions.push({ text: 'Mark Done', onPress: onMoveStepToCompletedMostRecent });
    }
    if (onMoveStepToPlannedNext) {
      actions.push({ text: 'Move to Planned', onPress: onMoveStepToPlannedNext });
    }
    if (onOpenPostRaceInterview) {
      actions.push({ text: 'Reflect + AI', onPress: onOpenPostRaceInterview });
    }
    if (Platform.OS === 'web') {
      const choiceMap = actions.map((action, idx) => `${idx + 1}. ${action.text}`).join('\n');
      const input = window.prompt(`Overdue Step\nChoose an action:\n${choiceMap}\n\nEnter number (or cancel).`, '');
      const idx = Number(input) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < actions.length) {
        actions[idx].onPress?.();
      }
      return;
    }

    actions.push({ text: 'Cancel', style: 'cancel' });
    showAlertWithButtons('Overdue Step', 'What would you like to do?', actions);
  }, [isOverdue, onMoveStepToCompletedMostRecent, onMoveStepToPlannedNext, onOpenPostRaceInterview]);

  // Render race type badge component
  const RaceTypeBadgeIcon = raceTypeBadge.icon;

  // Phase tabs data for IOSSegmentedControl — labels driven by interest config
  // Tufte: Include completion counts directly in labels for maximum information density
  const phaseTabs = useMemo(() => {
    return RACE_PHASES.map((phase) => {
      const count = phaseCounts[phase];
      const countLabel = formatPhaseCompletionLabel(count.completed, count.total);
      const phaseLabel = eventConfig.phaseLabels[phase]?.short ?? phase;
      return {
        value: phase,
        label: `${phaseLabel}${countLabel}`,
      };
    });
  }, [phaseCounts, eventConfig.phaseLabels]);

  // Handle phase tab change with haptic feedback
  const handlePhaseChange = useCallback((phase: RacePhase) => {
    // DEBUG: Log phase tab selection
    if (typeof window !== 'undefined' && (window as any).__PERIOD_DEBUG__?.enabled) {
      (window as any).__PERIOD_DEBUG__.log('RaceSummaryCard.phaseTab', eventConfig.phaseLabels[phase]?.short ?? phase, { phase, raceId: race.id });
    }
    setSelectedPhase(phase);
  }, [race.id]);

  // Helper to render phase tabs with iOS segmented control style (Prep/Launch/Race/Review)
  // Max width = 2 tiles (155px each) + 1 gap (12px) = 322px
  const renderPhaseTabs = () => (
    <IOSSegmentedControl
      segments={phaseTabs}
      selectedValue={selectedPhase}
      onValueChange={handlePhaseChange}
      style={{ marginTop: 12, marginBottom: 12, maxWidth: 322 }}
    />
  );

  // Convert race data to CardRaceData format for phase content
  const cardRaceData = useMemo(() => {
    const data = {
      id: race.id,
      name: race.name,
      date: race.date,
      startTime: race.startTime,
      venue: race.venue,
      vhf_channel: vhfChannel,
      race_type: detectedRaceType,
      boatClass: boatClassName,
      wind: windData,
      tide: tideData,
      isDemo: race.isDemo, // Preserve isDemo flag for demo race handling
      metadata: (race as any).metadata, // Preserve metadata for coordinates/venue info
      venueCoordinates: (race as any).venueCoordinates, // Preserve coordinates for weather fetching
      created_by: race.created_by, // Preserve for edit/delete permissions
      time_limit_hours: timeLimitHours, // Distance race duration for Forecast Check wizard
      boat_id: (race as any).boat_id, // Preserve for sail selection/equipment
      class_id: (race as any).class_id, // Preserve for tuning recommendations
      // Distance racing fields for Weather Routing wizard
      route_waypoints: routeWaypoints, // Already extracted above
      total_distance_nm: totalDistanceNm,
    };

    return data;
  }, [race, vhfChannel, detectedRaceType, boatClassName, windData, tideData, timeLimitHours, routeWaypoints, totalDistanceNm]);

  // Helper to render phase-specific content
  const renderPhaseContent = () => {
    // Timeline steps get dedicated step content per phase (all interests)
    if (isTimelineStep && isActive) {
      if (selectedPhase === 'days_before') {
        // Brain dump phase intercepts the plan view
        if (brainDumpPhase === 'dump') {
          return (
            <BrainDumpEntry
              initialData={brainDumpData}
              onSkipToPlan={handleSkipToPlan}
              onStructureWithAI={handleStructureWithAI}
              onDraftChange={handleDraftChange}
              isStructuring={aiStructuring}
              interestSlug={currentInterest?.slug}
            />
          );
        }
        if (brainDumpPhase === 'review' && aiReviewPlan) {
          return (
            <AIStructureReview
              planData={aiReviewPlan}
              suggestedTitle={aiSuggestedTitle}
              resolvedEntities={resolvedEntities}
              dateEnrichment={dateEnrichment}
              isEnrichingDate={isEnrichingDate}
              isResolvingEntities={isResolvingEntities}
              entityResolutionError={entityResolutionError}
              onResolveAmbiguousPerson={handleResolveAmbiguousPerson}
              onConfirm={handleConfirmAIPlan}
              onBack={handleBackToDump}
            />
          );
        }
        return (
          <>
            {brainDumpData && !brainDumpData.ai_structured_at && (
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  marginHorizontal: 16,
                  marginTop: 8,
                  backgroundColor: 'rgba(61,138,90,0.08)',
                  borderRadius: 10,
                }}
                onPress={() => setBrainDumpPhase('dump')}
              >
                <Ionicons name="sparkles" size={14} color={STEP_COLORS.accent} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: STEP_COLORS.accent }}>
                  Structure with AI instead
                </Text>
              </Pressable>
            )}
            <StepPlanQuestions
              stepId={race.id}
              interestId={(race as any).interest_id ?? currentInterest?.id}
            />
          </>
        );
      }
      if (selectedPhase === 'on_water') {
        const activeEnrichment = dateEnrichment ?? metadata?.plan?.date_enrichment;
        return (
          <>
            {activeEnrichment && (activeEnrichment.wind || activeEnrichment.tide) && (
              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <DateEnrichmentCard
                  dateLabel="today's session"
                  dateIso=""
                  enrichment={activeEnrichment}
                />
              </View>
            )}
            <StepDrawContent stepId={race.id} />
          </>
        );
      }
      if (selectedPhase === 'after_race') {
        return <StepCritiqueContent stepId={race.id} onNextStepCreated={onNextStepCreated} />;
      }
    }

    // Non-sailing interests use config-driven rendering;
    // blank_activity events also use config-driven rendering even for sailing
    const isBlankActivity = (race as any)?.metadata?.event_subtype === 'blank_activity';
    if (!isSailing || isBlankActivity) {
      // Non-timeline or inactive cards use config-driven rendering
      return (
        <ConfigDrivenPhaseContent
          phase={selectedPhase}
          config={eventConfig}
          race={cardRaceData}
          onModulePress={handleModulePress}
          moduleContent={moduleContent}
        />
      );
    }

    // Sailing retains rich hardcoded phase content
    switch (selectedPhase) {
      case 'days_before':
        return (
          <DaysBeforeContent
            race={cardRaceData}
          />
        );
      case 'on_water':
        return (
          <OnWaterContent
            race={cardRaceData}
          />
        );
      case 'after_race':
        return (
          <AfterRaceContent
            race={cardRaceData}
            userId={userId}
            onOpenPostRaceInterview={onOpenPostRaceInterview}
            isExpanded={true}
            refetchTrigger={refetchTrigger}
          />
        );
      default:
        return null;
    }
  };

  // Build race data for detail cards
  const raceDataForDetailCards = useMemo(() => {
    const data = {
      id: race.id,
      name: race.name,
      wind: windData,
      tide: tideData,
      courseName: (race as any).course_name,
      courseType: courseType,
      vhfChannel: vhfChannel,
      fleetName: fleetName,
      race_type: detectedRaceType,
      total_distance_nm: totalDistanceNm,
      time_limit_hours: timeLimitHours,
      route_waypoints: routeWaypoints,
      venue: venue,
      date: race.date,
      // For Tufte race-window display - combines date + time into ISO string
      // race.date may be ISO timestamp "2025-12-13T00:00:00+00:00" or date string "2025-12-13"
      // race.startTime may be "08:25:00", "08:25", or "10:00 AM"
      start_time: (() => {
        if (!race.startTime || !race.date) return null;
        // Extract just the date part (YYYY-MM-DD) from race.date
        const dateStr = race.date.split('T')[0];
        // Normalize time to HH:mm:ss format
        let timeStr = race.startTime;
        // Handle "10:00 AM" format
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          const [hours, mins] = time.split(':').map(Number);
          const h24 = period === 'PM' && hours !== 12 ? hours + 12 : (period === 'AM' && hours === 12 ? 0 : hours);
          timeStr = `${h24.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
        } else if (timeStr.split(':').length === 2) {
          timeStr = `${timeStr}:00`;
        }
        return `${dateStr}T${timeStr}`;
      })(),
    };

    return data;
  }, [
    race.id, race.name, race.date, race.startTime, windData, tideData, courseType,
    vhfChannel, fleetName, detectedRaceType, totalDistanceNm,
    timeLimitHours, routeWaypoints, venue,
  ]);

  // ==========================================================================
  // RENDER - Single full-height view with scrollable content
  // ==========================================================================

  // Build full countdown text (e.g., "3d 2h until race")
  const fullCountdownText = useMemo(() => {
    return formatCountdownFull(countdown);
  }, [countdown]);

  // Build compact countdown text (e.g., "18h" or "2d") - for badges if needed
  const compactCountdown = useMemo(() => {
    if (countdown.isPast) return null;
    if (countdown.days > 0) return `${countdown.days}d`;
    if (countdown.hours > 0) return `${countdown.hours}h`;
    return `${countdown.minutes}m`;
  }, [countdown]);

  // Get urgency color for countdown display
  const urgencyColor = useMemo(() => {
    return getUrgencyColor(countdown.days, countdown.hours, effectiveIsPast);
  }, [countdown.days, countdown.hours, effectiveIsPast]);

  // Build season context text (e.g., "W26 · Race 2/10")
  const seasonContextText = useMemo(() => {
    const parts: string[] = [];
    if (seasonWeek) parts.push(seasonWeek);
    if (raceNumber && totalRaces) parts.push(`Race ${raceNumber}/${totalRaces}`);
    else if (raceNumber) parts.push(`Race ${raceNumber}`);
    return parts.join(' · ');
  }, [seasonWeek, raceNumber, totalRaces]);

  // Build venue + datetime subtitle (e.g., "Victoria Harbour · Sat, Jan 25 10:30 AM")
  const raceSubtitle = useMemo(() => {
    const parts: string[] = [];

    // Get venue name from various possible sources, avoiding raw coordinates
    const venueInfo = (race as any).venue_info || (race as any).venue_data;
    const racingAreaName = (race as any).racing_area_name;
    const rawVenue = race.venue;

    // Check if rawVenue looks like coordinates (e.g., "22.3361, 114.2911")
    const isCoordinates = rawVenue && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(rawVenue.trim());

    // Priority: venue_info.name > racing_area_name > venue (if not coordinates)
    const venueName = venueInfo?.name || racingAreaName || (!isCoordinates ? rawVenue : null);

    if (venueName) parts.push(venueName);

    const normalized = buildNormalizedRaceDateTime(race.date, race.startTime);
    const dateStr = normalized
      ? normalized.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : 'Date TBD';
    const timeStr = normalized
      ? normalized.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : formatTime(race.startTime);
    parts.push(`${dateStr} ${timeStr}`);
    return parts.join(' · ');
  }, [race.venue, race.date, race.startTime, (race as any).venue_info, (race as any).racing_area_name]);

  const nonSailingTypeLabel = useMemo(() => {
    if (isBlankActivitySubtype) return 'Step';
    return (
      eventConfig.eventSubtypes.find((s) => s.id === (race as any)?.metadata?.event_subtype)?.label
      ?? eventConfig.eventNoun
    );
  }, [eventConfig.eventNoun, eventConfig.eventSubtypes, isBlankActivitySubtype, race]);

  // Get active phase for inline progress bar
  const activePhase = useMemo(() => {
    return getActivePhaseForProgress(phaseCounts, effectiveIsPast);
  }, [phaseCounts, effectiveIsPast]);

  const showNextRibbon = isNextStepCard && !isTimelineDone && !isOverdue;
  const hideTypeChipForNextNonSailing = showNextRibbon && !isSailing;

  return (
    <>
        <Pressable onPress={onCardPress || (() => {})} onLongPress={handleLongPress} delayLongPress={500} style={{ flex: 1, opacity: 1 }} disabled={isActive}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            nestedScrollEnabled={Platform.OS === 'android'}
            onScroll={handleContentScroll}
            scrollEventThrottle={16}
          >
            {/* Simplified Header: Race type badge + Countdown */}
            <View style={styles.simpleHeaderWrapper}>
            {showNextRibbon && (
              <View style={styles.nextBookmarkRibbon}>
                <Ionicons name="bookmark" size={11} color="#047857" />
                <Text style={styles.nextBookmarkRibbonText}>Next</Text>
              </View>
            )}
            <View style={styles.simpleHeaderRow}>
          {/* Status badge: past = green checkmark + result; future = race type */}
          {isTimelineDone ? (
            <View style={styles.pastRaceBadge}>
              <Ionicons name="checkmark-circle" size={14} color={IOS_COLORS.green} />
              <Text style={styles.pastBadgeText}>
                {analysisData?.selfReportedPosition
                  ? `${analysisData.selfReportedPosition}${getOrdinalSuffix(analysisData.selfReportedPosition)}`
                  : 'DONE'}
              </Text>
            </View>
          ) : isOverdue ? (
            <Pressable style={styles.overdueBadge} onPress={handleOverdueBadgePress}>
              <Ionicons name="warning" size={13} color="#B45309" />
              {!isBlankActivitySubtype && <Text style={styles.overdueBadgeText}>Overdue</Text>}
            </Pressable>
          ) : !hideTypeChipForNextNonSailing ? (
            <View style={styles.raceTypeBadge}>
              <Text style={[styles.raceTypeBadgeText, !isSailing && styles.raceTypeBadgeTextSubtle]}>
                {isSailing
                  ? (detectedRaceType?.toUpperCase() || 'FLEET')
                  : nonSailingTypeLabel}
              </Text>
            </View>
          ) : (
            <View />
          )}
        <View style={styles.simpleHeaderRight}>
            {/* Countdown: past = gray relative time; today = bold TODAY; future = large number */}
            {(isSailing || isTimelineDone) && (
            <View style={styles.countdownSimple}>
              {isTimelineDone ? (
                <Text style={styles.pastTimeLabel}>
                  {countdown.daysSince === 0
                    ? 'Today'
                    : countdown.daysSince === 1
                      ? 'Yesterday'
                      : countdown.daysSince <= 30
                        ? `${countdown.daysSince}d ago`
                        : 'Completed'}
                </Text>
              ) : countdown.isToday ? (
                <Text style={[styles.countdownTodayLabel, { color: urgencyColor.text }]}>
                  TODAY
                </Text>
              ) : (
                <>
                  <Text style={[styles.countdownNumberSimple, { color: urgencyColor.text }]}>
                    {countdown.days}
                  </Text>
                  <Text style={[styles.countdownLabelSimple, { color: urgencyColor.text }]}>
                    {countdown.days === 1 ? 'day' : 'days'}
                  </Text>
                </>
              )}
            </View>
            )}
            {/* Three-dot menu (includes Share Race, Crew Chat) */}
            {menuItems.length > 0 && (
              <CardMenu items={menuItems} iconSize={20} iconColor={IOS_COLORS.gray} />
            )}
          </View>
        </View>
        </View>

        {(race as any).isDemo && (
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>SAMPLE DATA</Text>
          </View>
        )}

        {/* Full race/step name — always editable TextInput for timeline steps */}
        {isTimelineStep ? (
          <TextInput
            ref={titleInputRef}
            style={[styles.raceNameLarge, styles.raceNameInput]}
            value={editTitle}
            onChangeText={setEditTitle}
            onBlur={handleTitleSubmit}
            onSubmitEditing={handleTitleSubmit}
            returnKeyType="done"
            selectTextOnFocus
          />
        ) : (
          <Text
            style={styles.raceNameLarge}
            numberOfLines={2}
            ellipsizeMode="tail"
          >{displayRaceName || '[No Step Name]'}</Text>
        )}
        {isNursingInterest && visibleTemplateSuggestedTitles.length > 0 ? (
          <View style={styles.templateSuggestedRow}>
            <Text style={styles.templateSuggestedLabel}>Suggested:</Text>
            {visibleTemplateSuggestedTitles.map((title) => (
              <View key={title} style={styles.templateSuggestedChip}>
                <Text style={styles.templateSuggestedChipText} numberOfLines={1}>{title}</Text>
              </View>
            ))}
            {hiddenTemplateSuggestedCount > 0 ? (
              <View style={styles.templateSuggestedChip}>
                <Text style={styles.templateSuggestedChipText}>+{hiddenTemplateSuggestedCount}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {interestSlug === 'nursing' && (advancedCompetencyCount > 0 || hasValidatedCompetency) ? (
          <View style={styles.nursingStatusRow}>
            {advancedCompetencyCount > 0 ? (
              <View style={styles.advancedBadge}>
                <Text style={styles.advancedBadgeText}>Advanced {advancedCompetencyCount}</Text>
              </View>
            ) : null}
            {hasValidatedCompetency ? (
              <View style={styles.validatedBadge}>
                <Text style={styles.validatedBadgeText}>Validated</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Location — hide for timeline steps with no venue; show "Venue TBD" only for sailing races */}
        {(venue?.name || race.venue) ? (
          <View style={styles.simpleDetailRow}>
            <Ionicons name="location-outline" size={16} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.simpleDetailText}>{venue?.name || race.venue}</Text>
          </View>
        ) : !isTimelineStep ? (
          <View style={styles.simpleDetailRow}>
            <Ionicons name="location-outline" size={16} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.simpleDetailText}>Venue TBD</Text>
          </View>
        ) : null}

        {/* Date/time — hide for timeline steps (they use created_at, not a scheduled date) */}
        {!isTimelineStep && (
          <View style={styles.simpleDetailRow}>
            <Ionicons name="calendar-outline" size={16} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.simpleDetailText}>{formatFullDate(race.date, race.startTime)}</Text>
          </View>
        )}

        {/* Collaborator avatar row */}
        {FEATURE_FLAGS.ENABLE_CREW_AVATARS_HEADER && collaborators.length > 0 && (
          <View style={styles.crewAvatarRow}>
            <CrewAvatarStack
              collaborators={collaborators}
              maxVisible={5}
              size="xs"
              onPress={() => setShowCollabPopover(true)}
              showPendingBadge
            />
          </View>
        )}
        {Boolean((race as any)?.metadata?.group_editable) && collaborators.length === 0 && (
          <Pressable style={styles.addCollaboratorsChip} onPress={() => openCrewHub('roster')}>
            <Ionicons name="people-outline" size={14} color={IOS_COLORS.blue} />
            <Text style={styles.addCollaboratorsChipText}>Add collaborators</Text>
          </Pressable>
        )}

        {/* Pill-style Phase Tabs (Prep/Race/Review) */}
        {renderPhaseTabs()}

        {/* Collaboration indicators (keep these as they provide important context) */}
        {!isOwner && isCollaborator && (
          <View style={styles.sharedBadge}>
            <Users size={12} color={IOS_COLORS.blue} />
            <Text style={styles.sharedBadgeText}>Shared</Text>
          </View>
        )}

        {/* Pending Invite Badge with Accept/Decline actions (important for interaction) */}
        {!isOwner && isPendingInvite && (
          <View style={styles.inviteBadgeContainer}>
            <View style={styles.inviteBadge}>
              <Clock size={12} color={IOS_COLORS.orange} />
              <Text style={styles.inviteBadgeText}>Crew Invite</Text>
            </View>
            <View style={styles.inviteActions}>
              <Pressable
                style={[styles.inviteAcceptButton, isAccepting && styles.inviteButtonDisabled]}
                onPress={handleAcceptInvite}
                disabled={isAccepting || isDeclining}
              >
                <CheckCircle size={14} color={IOS_COLORS.green} />
                <Text style={styles.inviteAcceptText}>{isAccepting ? 'Joining...' : 'Accept'}</Text>
              </Pressable>
              <Pressable
                style={[styles.inviteDeclineButton, isDeclining && styles.inviteButtonDisabled]}
                onPress={handleDeclineInvite}
                disabled={isAccepting || isDeclining}
              >
                <XCircle size={14} color={IOS_COLORS.red} />
                <Text style={styles.inviteDeclineText}>{isDeclining ? 'Declining...' : 'Decline'}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Pill-style Phase Tabs moved above date row */}

        {/* Race Start Info Bar - VHF, races, start sequence (only on Race tab for upcoming races) */}
        {!countdown.isPast && selectedPhase === 'on_water' && (
          <RaceStartInfoBar
            vhfChannel={vhfChannel}
            startOrder={startOrderData?.startOrder}
            totalFleets={startOrderData?.totalFleets}
            classFlag={startOrderData?.classFlag}
            startTime={startOrderData?.plannedStartTime || race.startTime}
            warningTime={startOrderData?.plannedWarningTime}
            compact
          />
        )}

        {/* Phase-Specific Content */}
        <PhaseContentErrorBoundary phase={selectedPhase}>
          {renderPhaseContent()}
        </PhaseContentErrorBoundary>

        {/* Suggestions from followers - only renders if pending suggestions exist */}
        <SuggestionsSection raceId={cardRaceData.id} />

        {/* Compact Timeline Navigation with Prev/Next (Tufte: direct manipulation) */}
        {timelineRaces && timelineRaces.length > 1 && onSelectRace && (
          <View style={styles.compactTimeline}>
            {/* Prev Button */}
            <Pressable
              style={[
                styles.timelineNavButton,
                currentRaceIndex === 0 && styles.timelineNavButtonDisabled,
              ]}
              onPress={() => {
                if (currentRaceIndex && currentRaceIndex > 0) {
                  triggerHaptic('impactLight');
                  onSelectRace(currentRaceIndex - 1);
                }
              }}
              disabled={!currentRaceIndex || currentRaceIndex === 0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft
                size={18}
                color={currentRaceIndex === 0 ? IOS_COLORS.gray4 : IOS_COLORS.blue}
              />
            </Pressable>

            {/* Timeline Track with Dots */}
            <View style={styles.compactTimelineCenter}>
              <View style={styles.compactTimelineTrack} />
              <View style={styles.compactTimelineDots}>
                {timelineRaces.map((tlRace, index) => {
                  const isSelected = index === currentRaceIndex;
                  const isNext = index === nextRaceIndex;
                  const raceDate = new Date(tlRace.date);
                  const dayLabel = raceDate.getDate().toString();
                  const monthLabel = raceDate.toLocaleDateString('en-US', { month: 'short' }).slice(0, 3);

                  return (
                    <Pressable
                      key={tlRace.id}
                      onPress={() => {
                        triggerHaptic('impactLight');
                        onSelectRace(index);
                      }}
                      style={[
                        styles.compactTimelineDot,
                        isSelected && styles.compactTimelineDotSelected,
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      {isNext && !isSelected && (
                        <View style={styles.compactTimelineNowIndicator} />
                      )}
                      <Text style={[
                        styles.compactTimelineDay,
                        isSelected && styles.compactTimelineDaySelected,
                        isNext && !isSelected && styles.compactTimelineDayNext,
                      ]}>
                        {dayLabel}
                      </Text>
                      {/* Show month for first, last, and selected dots */}
                      {(index === 0 || index === timelineRaces.length - 1 || isSelected) && (
                        <Text style={[
                          styles.compactTimelineMonth,
                          isSelected && styles.compactTimelineMonthSelected,
                        ]}>
                          {monthLabel}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Next Button */}
            <Pressable
              style={[
                styles.timelineNavButton,
                currentRaceIndex === timelineRaces.length - 1 && styles.timelineNavButtonDisabled,
              ]}
              onPress={() => {
                if (currentRaceIndex !== undefined && currentRaceIndex < timelineRaces.length - 1) {
                  triggerHaptic('impactLight');
                  onSelectRace(currentRaceIndex + 1);
                }
              }}
              disabled={currentRaceIndex === undefined || currentRaceIndex === timelineRaces.length - 1}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight
                size={18}
                color={currentRaceIndex === timelineRaces.length - 1 ? IOS_COLORS.gray4 : IOS_COLORS.blue}
              />
            </Pressable>
          </View>
        )}

          </ScrollView>
        </Pressable>

      {/* Detail Bottom Sheet for drill-down (sailing) */}
      <DetailBottomSheet
        type={activeDetailSheet}
        isOpen={activeDetailSheet !== null}
        onClose={handleCloseDetailSheet}
        raceId={race.id}
        raceData={raceDataForDetailCards}
      />

      {/* Module Detail Bottom Sheet for non-sailing interests + sailing blank_activity */}
      {(!isSailing || (race as any)?.metadata?.event_subtype === 'blank_activity') && (
        <ModuleDetailBottomSheet
          moduleId={activeModuleId}
          isOpen={activeModuleId !== null}
          onClose={handleCloseModuleSheet}
          config={eventConfig}
          stepMetadata={(race as any)?.metadata || null}
          artifactContext={moduleArtifactContext}
          onContentChange={handleModuleContentChange}
        />
      )}

      {/* Detailed Review Modal for full post-race analysis */}
      <DetailedReviewModal
        visible={showDetailedReview}
        raceId={race.id}
        raceName={race.name}
        venueId={venue?.id}
        conditions={windData ? {
          windSpeed: windData.speedMin || windData.speedMax,
          windDirection: parseFloat(windData.direction) || undefined,
        } : undefined}
        onClose={handleCloseDetailedReview}
        onComplete={handleDetailedReviewComplete}
      />

      {/* Crew Hub - Unified crew management */}
      <CrewHub
        sailorId={userId || ''}
        classId={(race as any).class_id || ''}
        className={boatClassName}
        regattaId={race.id}
        raceName={race.name}
        isOpen={showCrewHub}
        onClose={() => setShowCrewHub(false)}
        initialTab={crewHubInitialTab}
      />

      {/* Race Chat Drawer — skip for timeline steps */}
      {!isTimelineStep && (
        <RaceChatDrawer
          regattaId={race.id}
          raceName={race.name}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Collaboration Popover */}
      {FEATURE_FLAGS.ENABLE_COLLABORATION_POPOVER && (
        <CollaborationPopover
          visible={showCollabPopover}
          onClose={() => setShowCollabPopover(false)}
          collaborators={collaborators}
          recentMessages={raceMessages}
          currentUserId={userId}
          onOpenChat={() => {
            setShowCollabPopover(false);
            setShowChat(true);
          }}
          onManageCrew={() => {
            setShowCollabPopover(false);
            openCrewHub('roster');
          }}
        />
      )}
    </>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },

  // ==========================================================================
  // TYPE + TIMING CONTEXT HEADER (e.g., "FLEET RACE · THIS WEEK")
  // ==========================================================================

  typeContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  typeContextText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },

  // Full countdown row (e.g., "3d 2h until race")
  fullCountdown: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },

  // Header right section (race position + menu)
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Race position with navigation (e.g., "Race 4/22 →")
  racePositionNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: `${IOS_COLORS.blue}10`,
  },
  racePositionText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },

  // Race meta row (date/time + venue on same line)
  raceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 4,
  },
  raceDateTimeText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  raceMetaSeparator: {
    fontSize: 15,
    color: IOS_COLORS.gray3,
  },

  // ==========================================================================
  // LEGACY COMPACT HEADER (kept for potential reuse)
  // ==========================================================================

  compactHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 8,
  },

  compactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  compactHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Season context text (e.g., "W26 · Race 2/10")
  seasonContext: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.2,
  },

  // Compact countdown badge (e.g., "18h" or "2d")
  countdownBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Icon-only quick actions in header
  quickActionsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  compactActionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  compactActionButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },

  // Race name (Apple HIG - 20pt semibold, primary visual element)
  raceName: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  // Race subtitle (venue + datetime combined)
  raceSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },

  // Badges Row (top of card)
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Expanded header (with menu)
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  // Race Name expanded (Apple typography)
  raceNameExpanded: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    lineHeight: 28,
    marginBottom: 6,
    letterSpacing: -0.3,
  },

  // Venue
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  venueText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    marginBottom: 12,
  },

  // Countdown Section
  countdownSection: {
    marginBottom: 16,
  },
  countdownPastContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
  },
  countdownPast: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // Collapsed countdown (iOS blue styling)
  collapsedCountdown: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownPastCompact: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  countdownCompactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 6,
  },
  countdownCompactUnit: {
    alignItems: 'center',
    minWidth: 48,
  },
  countdownCompactValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  countdownCompactLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  countdownCompactSeparator: {
    fontSize: 24,
    fontWeight: '300',
    color: IOS_COLORS.gray3,
    paddingBottom: 10,
  },

  // Tufte compact countdown (single line, maximizes data-ink ratio)
  countdownTufteRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.gray6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  countdownTufteValue: {
    fontSize: 32,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  countdownTufteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Conditions Preview (collapsed)
  conditionsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Conditions Preview (expanded - more detail)
  conditionsPreviewExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  conditionItemExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  conditionValueExpanded: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Distance Race Info Row
  distanceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  distanceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Date & Time Row
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },

  // Arrival Plan Section
  arrivalSection: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  arrivalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  arrivalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  arrivalHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  arrivalSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8FAE9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  arrivalSetBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  arrivalAddBadge: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  arrivalAddBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  arrivalContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  arrivalSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  arrivalOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  arrivalOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    minWidth: 80,
  },
  arrivalOptionSelected: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  arrivalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  arrivalOptionTextSelected: {
    color: '#FFFFFF',
  },
  arrivalOptionSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  arrivalOptionSubtextSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  arrivalNotesContainer: {
    marginTop: 4,
  },
  arrivalNotesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: IOS_COLORS.label,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  savingText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },

  // ==========================================================================
  // TUFTE STYLES - Typography IS the interface
  // Maximum data-ink ratio, no decorative elements
  // ==========================================================================

  // Typographic header - race type as small caps text, not a badge
  tufteTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // Tappable header area for expand/collapse
  tappableHeader: {
    marginBottom: 4,
  },

  // Right side of header (menu + chevron)
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Header row with type label and menu
  tufteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  // Race name - primary visual element, large and bold
  tufteRaceName: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  // Venue - secondary text, no icon
  tufteVenue: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },

  // Countdown Hero (Apple HIG - prominent centered countdown)
  countdownHero: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  countdownHeroValue: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    lineHeight: 56,
  },
  countdownHeroLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginTop: 2,
  },

  // Compact Inline Countdown (saves ~16px vertical space)
  countdownInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  countdownValue: {
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  countdownLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },

  // Meta Row (location, date)
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },

  // Quick Actions Row (Compact - icon only, 44pt touch targets maintained)
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
    marginBottom: 12,
  },
  quickActionButton: {
    width: 44,  // Touch target maintained
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  quickActionButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Time block - contains countdown inline with date
  tufteTimeBlock: {
    marginBottom: 14,
  },

  // Countdown inline - single line format: "2h 47m to start · Wed, Jan 7 10:25 AM"
  tufteCountdownInline: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },

  // Countdown value - the actual time, emphasized
  tufteCountdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },

  // Past race text
  tufteCountdownPast: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // Conditions grid - flat layout, no icons
  tufteConditionsGrid: {
    gap: 8,
    marginBottom: 12,
  },

  // Condition row - label, value, sparkline
  tufteConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Condition label - fixed width for alignment
  tufteConditionLabel: {
    width: 36,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Condition value - the data
  tufteConditionValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // Data density row - additional info in one line
  tufteDataDensity: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginBottom: 16,
  },

  // Section label - small caps header for sections
  tufteSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Expanded conditions container
  tufteConditionsExpanded: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },

  // Expanded condition row - more space
  tufteConditionRowExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },

  // Expanded condition label
  tufteConditionLabelExpanded: {
    width: 44,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Expanded condition value
  tufteConditionValueExpanded: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // Trend annotation text
  tufteTrendText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // ==========================================================================
  // TUFTE EXPANDED VIEW STYLES
  // ==========================================================================

  // Time block - inline countdown with date
  tufteTimeBlockExpanded: {
    marginBottom: 16,
    gap: 8,
  },
  tufteCountdownLineExpanded: {
    fontSize: 16,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteCountdownValueExpanded: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  tufteDistanceInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteStartAction: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    marginTop: 8,
  },
  tufteStartActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    textAlign: 'center',
  },

  // Arrival row - flat inline
  tufteArrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  tufteArrivalLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteArrivalValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Arrival expanded options
  tufteArrivalExpanded: {
    paddingBottom: 16,
    gap: 12,
  },
  tufteArrivalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tufteArrivalOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    backgroundColor: '#FFFFFF',
  },
  tufteArrivalOptionSelected: {
    borderColor: IOS_COLORS.blue,
    backgroundColor: `${IOS_COLORS.blue}10`,
  },
  tufteArrivalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteArrivalOptionTextSelected: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  tufteArrivalNotes: {
    fontSize: 14,
    color: IOS_COLORS.label,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
  },

  // ==========================================================================
  // TUFTE "ABSENCE AS INTERFACE" STYLES
  // Empty fields communicate incompleteness through visual sparseness
  // ==========================================================================

  // Temporal context - subtle gray text showing days since race
  tufteTemporalContext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginBottom: 12,
  },

  // Absence fields container (collapsed)
  tufteAbsenceFields: {
    gap: 8,
  },

  // Absence row - label + placeholder
  tufteAbsenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Absence label - fixed width for alignment
  tufteAbsenceLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Absence placeholder - underscore line indicating missing data
  tufteAbsencePlaceholder: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.gray3,
    letterSpacing: 2,
  },

  // Absence value - actual data when available (increases visual density)
  tufteAbsenceValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Absence fields container (expanded) - more space for interaction
  tufteAbsenceFieldsExpanded: {
    gap: 12,
    marginTop: 8,
  },

  // Absence row expanded - tappable to open post-race interview
  tufteAbsenceRowExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },

  // Absence label expanded
  tufteAbsenceLabelExpanded: {
    width: 90,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Absence placeholder expanded
  tufteAbsencePlaceholderExpanded: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.gray3,
    letterSpacing: 2,
  },

  // Absence value expanded - actual data when available
  tufteAbsenceValueExpanded: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },

  // ==========================================================================
  // PHASE CONTENT CONTAINER STYLES
  // ==========================================================================

  // ScrollView content container
  scrollContent: {
    paddingBottom: 120, // Clear floating tab bar + safe area insets
  },

  // Compact Timeline (inside card footer - Tufte-inspired)
  compactTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    gap: 8,
  },
  // Navigation buttons for timeline
  timelineNavButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: IOS_COLORS.gray6,
  },
  timelineNavButtonDisabled: {
    opacity: 0.4,
  },
  // Center section with track and dots
  compactTimelineCenter: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  compactTimelineTrack: {
    position: 'absolute',
    top: '40%',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 1,
  },
  compactTimelineDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  compactTimelineDot: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 32,
    paddingTop: 4,
  },
  compactTimelineDotSelected: {
    // Selected state handled by text styles
  },
  compactTimelineDay: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    fontVariant: ['tabular-nums'],
  },
  compactTimelineDaySelected: {
    fontSize: 15,
    fontWeight: '700',
    color: IOS_COLORS.blue,
  },
  compactTimelineDayNext: {
    color: '#10B981', // Next race green
    fontWeight: '600',
  },
  compactTimelineMonth: {
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  compactTimelineMonthSelected: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  compactTimelineNowIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginBottom: 4,
  },

  // Demo race badge (shown when user has no real races)
  demoBadge: {
    backgroundColor: '#FEF3C7', // Amber-100
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E', // Amber-800
    letterSpacing: 0.3,
  },
  demoHint: {
    fontSize: 11,
    color: '#B45309', // Amber-700
    marginTop: 2,
  },

  // Sample data badge (shown for seeded races from onboarding)
  sampleBadge: {
    backgroundColor: '#E0E7FF', // Indigo-100
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  sampleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA', // Indigo-700
    letterSpacing: 1,
  },

  // ==========================================================================
  // COLLABORATION BADGE STYLES
  // ==========================================================================

  // "Shared with you" badge for accepted collaborators
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  sharedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Pending invite badge container (contains badge + actions)
  inviteBadgeContainer: {
    marginBottom: 12,
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.orange}15`,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  inviteBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },

  // Accept/Decline action buttons
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.green}15`,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inviteAcceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  inviteDeclineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.red}10`,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inviteDeclineText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.red,
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },

  // ==========================================================================
  // TUFTE MINIMALIST CARD STYLES
  // Maximum data density, typography IS the interface
  // ==========================================================================

  // Top row: temporal info left, race number + menu right
  tufteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tufteTopRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tufteTemporalText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteRaceNumber: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },

  // Simplified race name (larger, no club prefix)
  tufteRaceNameSimplified: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 24,
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  // Inline progress bar
  tufteProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tuftePhaseName: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    width: 44, // Fixed width for alignment
  },
  tufteProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tufteProgressFill: {
    height: 4,
    backgroundColor: IOS_COLORS.secondaryLabel,
    borderRadius: 2,
  },
  tufteProgressCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    width: 20, // Fixed width for alignment
    textAlign: 'right',
  },

  // Complete state
  tufteCompleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  tufteCompleteText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // ==========================================================================
  // SIMPLIFIED HEADER STYLES (Clean design: badge + countdown + name + details)
  // ==========================================================================

  simpleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  simpleHeaderWrapper: {
    position: 'relative',
  },
  nextBookmarkRibbon: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  nextBookmarkRibbonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.2,
  },
  raceTypeBadge: {
    backgroundColor: IOS_COLORS.gray5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  raceTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  raceTypeBadgeTextSubtle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.tertiaryLabel,
  },
  simpleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownSimple: {
    alignItems: 'center',
  },
  countdownNumberSimple: {
    fontSize: 28,
    fontWeight: '700',
  },
  countdownLabelSimple: {
    fontSize: 13,
    fontWeight: '500',
  },
  pastTimeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    letterSpacing: -0.1,
  },
  countdownTodayLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pastRaceBadge: {
    backgroundColor: '#E8FAE9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pastBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.green,
    letterSpacing: 0.5,
  },
  overdueBadge: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overdueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  raceNameLarge: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 22,
    marginBottom: 10,
  },
  raceNameInput: {
    borderBottomWidth: 0,
    paddingVertical: 2,
    marginBottom: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  templateSuggestedRow: {
    marginTop: -2,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  templateSuggestedLabel: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '600',
  },
  templateSuggestedChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 170,
  },
  templateSuggestedChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  advancedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  advancedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  nursingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  validatedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  validatedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  simpleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  simpleDetailText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  crewAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  addCollaboratorsChip: {
    marginTop: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#D6E5FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addCollaboratorsChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

});

export default RaceSummaryCard;
