/**
 * TimelineGridView - "Zoom out" grid of mini race cards
 *
 * Like Photos app: toggle from single-card view to see all races at a glance.
 * Cards are grouped by month with section headers, arranged in a responsive grid.
 * Tapping a mini card zooms back to that race in the CardGrid.
 */

import React, { useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CardRaceData, isRacePast, formatTimeUntilRace } from './types';
import { IOS_COLORS } from './constants';
import { triggerHaptic } from '@/lib/haptics';

// =============================================================================
// TYPES
// =============================================================================

interface TimelineGridViewProps {
  races: CardRaceData[];
  /** Currently selected race ID */
  selectedRaceId?: string;
  /** Index of the next upcoming race */
  nextRaceIndex?: number | null;
  /** Called when user taps a mini card */
  onSelectRace: (index: number, race: CardRaceData) => void;
  /** Top inset to clear the toolbar */
  topInset?: number;
  /** Season header height */
  seasonHeaderHeight?: number;
}

interface MonthGroup {
  key: string;
  label: string;
  races: Array<{ race: CardRaceData; index: number }>;
}

// =============================================================================
// HELPERS
// =============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function groupByMonth(races: CardRaceData[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  races.forEach((race, index) => {
    const dateStr = (race as any).start_date || race.date;
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[month]} ${year}`;

    if (!groups.has(key)) {
      groups.set(key, { key, label, races: [] });
    }
    groups.get(key)!.races.push({ race, index });
  });

  return Array.from(groups.values());
}

function getRaceStatusColor(race: CardRaceData, isNext: boolean): string {
  if (isNext) return IOS_COLORS.green;
  const dateStr = (race as any).start_date || race.date;
  const isPast = isRacePast(dateStr, race.startTime);
  if (isPast) return IOS_COLORS.gray3;
  return IOS_COLORS.blue;
}

function getRaceStatusLabel(race: CardRaceData, isNext: boolean): string {
  if (isNext) return 'NEXT';
  const dateStr = (race as any).start_date || race.date;
  const isPast = isRacePast(dateStr, race.startTime);
  if (isPast) return 'DONE';
  return formatTimeUntilRace(dateStr, race.startTime);
}

function getRaceTypeIcon(race: CardRaceData): string {
  const subtype = (race as any).metadata?.event_subtype;
  if (subtype === 'blank_activity') return 'add-circle-outline';
  switch (race.race_type) {
    case 'distance': return 'compass-outline';
    case 'match': return 'git-compare-outline';
    case 'team': return 'people-outline';
    default: return 'boat-outline';
  }
}

// =============================================================================
// MINI CARD
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MiniCard = React.memo(function MiniCard({
  race,
  index,
  isSelected,
  isNext,
  onPress,
}: {
  race: CardRaceData;
  index: number;
  isSelected: boolean;
  isNext: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusColor = getRaceStatusColor(race, isNext);
  const statusLabel = getRaceStatusLabel(race, isNext);
  const dateStr = (race as any).start_date || race.date;
  const d = new Date(dateStr);
  const dayNum = d.getDate();
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const isBlankActivity = (race as any).metadata?.event_subtype === 'blank_activity';

  return (
    <AnimatedPressable
      style={[
        miniStyles.card,
        isSelected && miniStyles.cardSelected,
        isNext && miniStyles.cardNext,
        animStyle,
      ]}
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
    >
      {/* Status badge */}
      <View style={[miniStyles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={miniStyles.statusText}>{statusLabel}</Text>
      </View>

      {/* Date circle */}
      <View style={miniStyles.dateCircle}>
        <Text style={miniStyles.dateDay}>{dayNum}</Text>
        <Text style={miniStyles.dateDayName}>{dayName}</Text>
      </View>

      {/* Race name */}
      <Text style={miniStyles.raceName} numberOfLines={2}>
        {race.name || (isBlankActivity ? 'Blank Step' : 'Untitled')}
      </Text>

      {/* Venue */}
      {race.venue && race.venue !== 'Venue TBD' && (
        <Text style={miniStyles.venue} numberOfLines={1}>
          {race.venue}
        </Text>
      )}

      {/* Race type icon */}
      <View style={miniStyles.typeRow}>
        <Ionicons
          name={getRaceTypeIcon(race) as any}
          size={12}
          color={IOS_COLORS.tertiaryLabel}
        />
        {race.boatClass && race.boatClass !== 'Class TBD' && (
          <Text style={miniStyles.boatClass} numberOfLines={1}>{race.boatClass}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TimelineGridView({
  races,
  selectedRaceId,
  nextRaceIndex,
  onSelectRace,
  topInset = 0,
  seasonHeaderHeight = 34,
}: TimelineGridViewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // Responsive columns
  const columns = screenWidth > 900 ? 4 : screenWidth > 600 ? 3 : 2;
  const horizontalPadding = 16;
  const gap = 10;
  const cardWidth = (screenWidth - horizontalPadding * 2 - gap * (columns - 1)) / columns;

  // Group races by month
  const monthGroups = useMemo(() => groupByMonth(races), [races]);

  const handleSelectRace = useCallback(
    (index: number, race: CardRaceData) => {
      onSelectRace(index, race);
    },
    [onSelectRace],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[gridStyles.container, { paddingTop: topInset + seasonHeaderHeight + 8 }]}
    >
      <ScrollView
        ref={scrollRef}
        style={gridStyles.scrollView}
        contentContainerStyle={[
          gridStyles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary bar */}
        <View style={gridStyles.summaryBar}>
          <Text style={gridStyles.summaryText}>
            {races.length} {races.length === 1 ? 'race' : 'races'}
          </Text>
          {nextRaceIndex != null && nextRaceIndex >= 0 && (
            <View style={gridStyles.summaryNextBadge}>
              <View style={gridStyles.summaryNextDot} />
              <Text style={gridStyles.summaryNextText}>
                Next: {races[nextRaceIndex]?.name || 'Upcoming'}
              </Text>
            </View>
          )}
        </View>

        {monthGroups.map((group) => (
          <View key={group.key} style={gridStyles.monthSection}>
            {/* Month header */}
            <Text style={gridStyles.monthHeader}>{group.label}</Text>

            {/* Card grid */}
            <View style={[gridStyles.grid, { gap }]}>
              {group.races.map(({ race, index }) => (
                <View key={race.id} style={{ width: cardWidth }}>
                  <MiniCard
                    race={race}
                    index={index}
                    isSelected={race.id === selectedRaceId}
                    isNext={index === nextRaceIndex}
                    onPress={() => handleSelectRace(index, race)}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const miniStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    minHeight: 120,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: IOS_COLORS.blue,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 2px #007AFF, 0 2px 8px rgba(0,122,255,0.15)',
      } as any,
      default: {
        shadowColor: IOS_COLORS.blue,
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  cardNext: {
    borderWidth: 2,
    borderColor: IOS_COLORS.green,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dateCircle: {
    alignItems: 'center',
    marginBottom: 6,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    lineHeight: 26,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  raceName: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 16,
    marginBottom: 2,
    textAlign: 'center',
  },
  venue: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 'auto' as any,
  },
  boatClass: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '500',
  },
});

const gridStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  summaryNextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  summaryNextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.green,
  },
  summaryNextText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
