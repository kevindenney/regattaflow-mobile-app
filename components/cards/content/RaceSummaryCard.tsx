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
  Flag,
  Navigation,
  Trophy,
  Users,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { DetailBottomSheet } from '@/components/races/DetailBottomSheet';
import { DetailedReviewModal } from '@/components/races/DetailedReviewModal';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import type { DetailCardType } from '@/constants/navigationAnimations';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import { useRaceAnalysisState } from '@/hooks/useRaceAnalysisState';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useRaceSeriesPosition } from '@/hooks/useRaceSeriesPosition';
import { useRaceStartOrder } from '@/hooks/useRaceStartOrder';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { useRaceWeatherForecast } from '@/hooks/useRaceWeatherForecast';
import { detectRaceType } from '@/lib/races/raceDataUtils';
import {
  CardContentProps,
  RACE_PHASES,
  RACE_PHASE_SHORT_LABELS,
  RacePhase,
  getCurrentPhaseForRace,
} from '../types';
import {
  AfterRaceContent,
  DaysBeforeContent,
  OnWaterContent,
  RaceMorningContent,
} from './phases';

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
  if (days === 0) {
    return { bg: '#FFF4E5', text: IOS_COLORS.orange, label: 'Today' };
  }
  if (days <= 1) {
    return { bg: '#FFF8E5', text: '#CC7A00', label: 'Tomorrow' };
  }
  if (days <= 7) {
    return { bg: '#E8FAE9', text: IOS_COLORS.green, label: 'This Week' };
  }
  return { bg: '#E5F1FF', text: IOS_COLORS.blue, label: 'Upcoming' };
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
}: CardContentProps) {
  // Temporal phase state
  const currentPhase = useMemo(
    () => getCurrentPhaseForRace(race.date, race.startTime),
    [race.date, race.startTime]
  );
  const [selectedPhase, setSelectedPhase] = useState<RacePhase>(currentPhase);

  // Detail bottom sheet state
  const [activeDetailSheet, setActiveDetailSheet] = useState<DetailCardType | null>(null);

  // Detailed Review modal state
  const [showDetailedReview, setShowDetailedReview] = useState(false);

  // Handler to open detail sheet
  const handleOpenDetail = useCallback((type: DetailCardType) => {
    setActiveDetailSheet(type);
  }, []);

  // Handler to close detail sheet
  const handleCloseDetailSheet = useCallback(() => {
    setActiveDetailSheet(null);
  }, []);

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
    raceEventId: race.id,
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

  // Get race type badge styling
  const raceTypeBadge = useMemo(
    () => getRaceTypeBadge(detectedRaceType),
    [detectedRaceType]
  );

  // Calculate countdown
  const countdown = useMemo(
    () => calculateCountdown(race.date, race.startTime),
    [race.date, race.startTime]
  );

  // Get urgency colors
  const urgency = useMemo(
    () => getUrgencyColor(countdown.days, countdown.hours, countdown.isPast),
    [countdown.days, countdown.hours, countdown.isPast]
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

  // Build menu items for card management
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    if (onEdit) {
      items.push({ label: 'Edit Race', icon: 'create-outline', onPress: onEdit });
    }
    if (onDelete) {
      items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    }
    // For demo races, show dismiss option instead of edit/delete
    if ((race as any).isDemo && onDismiss) {
      items.push({ label: 'Dismiss sample', icon: 'close-outline', onPress: onDismiss });
    }
    return items;
  }, [onEdit, onDelete, race, onDismiss]);

  // Render race type badge component
  const RaceTypeBadgeIcon = raceTypeBadge.icon;

  // Helper to render phase tabs
  const renderPhaseTabs = (compact: boolean = false) => (
    <View style={compact ? styles.phaseTabsCompact : styles.phaseTabs}>
      {RACE_PHASES.map((phase) => {
        const isSelected = selectedPhase === phase;
        const isCurrent = currentPhase === phase;
        return (
          <Pressable
            key={phase}
            style={[
              compact ? styles.phaseTabCompact : styles.phaseTab,
              isSelected && (compact ? styles.phaseTabCompactSelected : styles.phaseTabSelected),
            ]}
            onPress={() => setSelectedPhase(phase)}
          >
            <Text
              numberOfLines={1}
              style={[
                compact ? styles.phaseTabTextCompact : styles.phaseTabText,
                isSelected && (compact ? styles.phaseTabTextCompactSelected : styles.phaseTabTextSelected),
              ]}
            >
              {RACE_PHASE_SHORT_LABELS[phase]}
            </Text>
            {isCurrent && !isSelected && (
              <View style={styles.phaseCurrentIndicator} />
            )}
          </Pressable>
        );
      })}
    </View>
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
    };

    return data;
  }, [race, vhfChannel, detectedRaceType, boatClassName, windData, tideData, timeLimitHours]);

  // Helper to render phase-specific content
  const renderPhaseContent = () => {
    switch (selectedPhase) {
      case 'days_before':
        return (
          <DaysBeforeContent
            race={cardRaceData}
          />
        );
      case 'race_morning':
        return (
          <RaceMorningContent
            race={cardRaceData}
            onOpenDetail={handleOpenDetail}
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
            onOpenDetailedReview={handleOpenDetailedReview}
            isExpanded={true}
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
  return (
    <>
      <View style={styles.container}>
        {/* Typographic Header with Menu */}
        <View style={styles.tufteHeader}>
          <Text style={styles.tufteTypeLabel}>
            {raceTypeBadge.label} RACE
            {!countdown.isPast && ` · ${urgency.label}`}
            {numberOfLegs > 0 && ` · ${numberOfLegs} legs`}
          </Text>
          {canManage && menuItems.length > 0 && (
            <View pointerEvents="box-none">
              <CardMenu items={menuItems} />
            </View>
          )}
        </View>

        {/* Demo Race Badge - shown when this is a placeholder race for empty state */}
        {(race as any).isDemo && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>Sample Race</Text>
            <Text style={styles.demoHint}>Tap + to add your first race</Text>
          </View>
        )}

        {/* Sample Data Badge - shown for seeded sample races from onboarding */}
        {!!(race as any).metadata?.is_sample && !(race as any).isDemo && (
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>SAMPLE</Text>
          </View>
        )}

        {/* Race Name - Primary visual element */}
        <Text style={styles.tufteRaceName} numberOfLines={2}>
          {race.name}
        </Text>

        {/* Venue + Racing Area */}
        {(race.venue || (race as any).racing_area_name) && (
          <Text style={styles.tufteVenue} numberOfLines={1}>
            {[race.venue, (race as any).racing_area_name].filter(Boolean).join(' · ')}
          </Text>
        )}

        {/* Temporal Phase Tabs */}
        {renderPhaseTabs(false)}

        {/* Phase-Specific Content - Scrollable */}
        <ScrollView
          style={styles.phaseContentContainerExpanded}
          contentContainerStyle={styles.phaseContentScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          nestedScrollEnabled={Platform.OS === 'android'}
        >
          {renderPhaseContent()}
        </ScrollView>

      </View>

      {/* Detail Bottom Sheet for drill-down */}
      <DetailBottomSheet
        type={activeDetailSheet}
        isOpen={activeDetailSheet !== null}
        onClose={handleCloseDetailSheet}
        raceId={race.id}
        raceData={raceDataForDetailCards}
      />

      {/* Detailed Review Modal for full post-race analysis */}
      <DetailedReviewModal
        visible={showDetailedReview}
        raceId={race.id}
        raceName={race.name}
        venueId={venue?.id}
        conditions={windData ? {
          windSpeed: windData.speedMin || windData.speedMax,
          windDirection: windData.direction,
        } : undefined}
        onClose={handleCloseDetailedReview}
        onComplete={handleDetailedReviewComplete}
      />
    </>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // Background controlled by CardShell (allows next race tinting)
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

  // Race Name (Apple typography)
  raceName: {
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
    flex: 1,
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
    marginBottom: 16,
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
  // TEMPORAL PHASE TAB STYLES
  // ==========================================================================

  // Phase tabs container (expanded)
  phaseTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },

  // Phase tab button (expanded)
  phaseTab: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    position: 'relative',
    minWidth: 55,
  },

  // Phase tab selected state (expanded)
  phaseTabSelected: {
    backgroundColor: IOS_COLORS.blue,
  },

  // Phase tab text (expanded)
  phaseTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },

  // Phase tab text selected (expanded)
  phaseTabTextSelected: {
    color: '#FFFFFF',
  },

  // Phase tabs container (compact - for collapsed view)
  phaseTabsCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 12,
    marginTop: 4,
  },

  // Phase tab button (compact)
  phaseTabCompact: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    position: 'relative',
  },

  // Phase tab selected state (compact)
  phaseTabCompactSelected: {
    backgroundColor: IOS_COLORS.blue,
  },

  // Phase tab text (compact)
  phaseTabTextCompact: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },

  // Phase tab text selected (compact)
  phaseTabTextCompactSelected: {
    color: '#FFFFFF',
  },

  // Current phase indicator dot (shows when not selected)
  phaseCurrentIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: IOS_COLORS.orange,
  },

  // ==========================================================================
  // PHASE CONTENT CONTAINER STYLES
  // ==========================================================================

  // Phase content container (collapsed view)
  phaseContentContainer: {
    flex: 1,
    marginBottom: 20,
  },

  // Phase content container (expanded view - ScrollView)
  phaseContentContainerExpanded: {
    flex: 1,
    marginBottom: 24,
  },

  // Phase content scroll content (for ScrollView contentContainerStyle)
  phaseContentScrollContent: {
    paddingBottom: 20,
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
});

export default RaceSummaryCard;
