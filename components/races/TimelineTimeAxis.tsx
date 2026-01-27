/**
 * TimelineTimeAxis - Tufte-Inspired Horizontal Race Navigation
 *
 * Replaces abstract pagination dots with a meaningful time axis following
 * Tufte's principles: every mark conveys data.
 *
 * Features:
 * - Actual dates shown as tick marks on horizontal axis
 * - Different shapes indicate race types (△ distance, ◆ series, ○ fleet)
 * - Current race highlighted with filled shape
 * - Month labels at boundaries
 * - Arrow indicator when more races exist off-screen
 * - Tap any mark to jump directly
 *
 * Tufte Principles Applied:
 * - Data-Ink Ratio: Every element carries information
 * - Direct Labeling: Dates are on the axis, not in a separate legend
 * - Small Multiples: Shape variations add meaning without clutter
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Design tokens
const COLORS = {
  active: '#2563EB', // Ocean blue
  activeGlow: 'rgba(37, 99, 235, 0.15)',
  inactive: '#9CA3AF',
  inactiveStroke: '#9CA3AF',
  nextRace: '#10B981', // Green for "now" indicator
  dateText: '#64748B',
  monthLabel: '#374151',
  axisLine: '#E2E8F0',
  chevron: '#94A3B8',
};

const SIZES = {
  shapeSize: 8,           // Tufte: smaller marks
  shapeActiveSize: 10,    // Tufte: minimal active enlargement
  dateTextSize: 9,        // Tufte: compressed typography
  monthLabelSize: 9,
  tickSpacing: 56,        // Tighter spacing for density
  axisHeight: 36,         // Tufte: reduced vertical footprint
};

export interface TimeAxisRace {
  id: string;
  /** Date string (ISO or YYYY-MM-DD) */
  date: string;
  /** Race type: 'fleet', 'distance', 'match', 'team' */
  raceType?: 'fleet' | 'distance' | 'match' | 'team';
  /** Series name if part of a series */
  seriesName?: string;
  /** Full race name */
  name?: string;
}

export interface TimelineTimeAxisProps {
  /** Array of races with dates */
  races: TimeAxisRace[];
  /** Index of currently selected race */
  currentIndex: number;
  /** Callback when a race tick is pressed */
  onSelectRace: (index: number) => void;
  /** Index of the next upcoming race */
  nextRaceIndex?: number;
  /** Reference to parent ScrollView for programmatic scrolling */
  scrollViewRef?: React.RefObject<ScrollView>;
  /** Snap interval for scroll positioning */
  snapInterval?: number;
  /** Maximum visible ticks before showing overflow */
  maxVisibleTicks?: number;
}

/**
 * Format date for display on axis
 * Always shows "Jan 18" format for clarity - bare day numbers are confusing
 */
function formatAxisDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${month} ${day}`;
}

/**
 * Get month label for boundary markers
 */
function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Race Type Shape Component
 * △ = Distance race
 * ◆ = Series race (has seriesName)
 * ○ = Fleet race (default)
 * □ = Match race
 */
function RaceShape({
  raceType,
  isSeries,
  isActive,
  isNext,
  size,
}: {
  raceType?: string;
  isSeries?: boolean;
  isActive: boolean;
  isNext: boolean;
  size: number;
}) {
  const fillColor = isActive ? COLORS.active : 'transparent';
  const strokeColor = isActive
    ? COLORS.active
    : isNext
    ? COLORS.nextRace
    : COLORS.inactiveStroke;
  const strokeWidth = isActive ? 0 : 1.5;

  // If it's part of a series, show diamond
  if (isSeries) {
    return (
      <Svg width={size} height={size} viewBox="0 0 12 12">
        <Path
          d="M6 1 L11 6 L6 11 L1 6 Z"
          fill={isActive ? COLORS.active : 'transparent'}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </Svg>
    );
  }

  // Shape based on race type
  switch (raceType) {
    case 'distance':
      // Triangle
      return (
        <Svg width={size} height={size} viewBox="0 0 12 12">
          <Path
            d="M6 1 L11 11 L1 11 Z"
            fill={isActive ? COLORS.active : 'transparent'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );

    case 'match':
      // Square
      return (
        <Svg width={size} height={size} viewBox="0 0 12 12">
          <Rect
            x={1.5}
            y={1.5}
            width={9}
            height={9}
            fill={isActive ? COLORS.active : 'transparent'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );

    case 'team':
      // Square (same as match for now)
      return (
        <Svg width={size} height={size} viewBox="0 0 12 12">
          <Rect
            x={1.5}
            y={1.5}
            width={9}
            height={9}
            fill={isActive ? COLORS.active : 'transparent'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx={2}
          />
        </Svg>
      );

    case 'fleet':
    default:
      // Circle
      return (
        <Svg width={size} height={size} viewBox="0 0 12 12">
          <Circle
            cx={6}
            cy={6}
            r={4.5}
            fill={isActive ? COLORS.active : 'transparent'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
  }
}

/**
 * Single Tick on the Time Axis
 */
function TimeAxisTick({
  race,
  index,
  isActive,
  isNext,
  dateLabel,
  onPress,
}: {
  race: TimeAxisRace;
  index: number;
  isActive: boolean;
  isNext: boolean;
  dateLabel: string;
  onPress: () => void;
}) {
  const size = isActive ? SIZES.shapeActiveSize : SIZES.shapeSize;
  const isSeries = !!race.seriesName;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tick, isActive && styles.tickActive]}
      hitSlop={{ top: 16, bottom: 16, left: 8, right: 8 }} // Maintains 44pt touch target
      activeOpacity={0.7}
    >
      {/* "Now" indicator line above next race */}
      {isNext && (
        <View style={styles.nowIndicator} />
      )}

      {/* Race shape */}
      <View style={[styles.shapeContainer, isActive && styles.shapeContainerActive]}>
        <RaceShape
          raceType={race.raceType}
          isSeries={isSeries}
          isActive={isActive}
          isNext={isNext}
          size={size}
        />
      </View>

      {/* Date label */}
      <Text
        style={[
          styles.dateLabel,
          isActive && styles.dateLabelActive,
        ]}
        numberOfLines={1}
      >
        {dateLabel}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * TimelineTimeAxis Component
 */
export function TimelineTimeAxis({
  races,
  currentIndex,
  onSelectRace,
  nextRaceIndex,
  scrollViewRef,
  snapInterval = 391, // CARD_WIDTH + CARD_GAP
  maxVisibleTicks = 7,
}: TimelineTimeAxisProps) {
  // Don't render if 0 or 1 races
  if (races.length <= 1) {
    return null;
  }

  // Parse and sort races by date for display
  const processedRaces = useMemo(() => {
    return races.map((race, idx) => {
      const date = new Date(race.date);
      return {
        ...race,
        parsedDate: date,
        originalIndex: idx,
      };
    });
  }, [races]);

  // Generate date labels - always show month+day for clarity
  const dateLabels = useMemo(() => {
    return processedRaces.map((race) => ({
      label: formatAxisDate(race.parsedDate),
    }));
  }, [processedRaces]);

  // Handle tick press
  const handleTickPress = useCallback(
    (index: number) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Scroll the parent ScrollView if provided
      if (scrollViewRef?.current && snapInterval) {
        scrollViewRef.current.scrollTo({
          x: index * snapInterval,
          y: 0,
          animated: true,
        });
      }

      onSelectRace(index);
    },
    [scrollViewRef, snapInterval, onSelectRace]
  );

  // Determine visible window if too many races
  const { visibleRaces, startIdx, hasMore } = useMemo(() => {
    if (races.length <= maxVisibleTicks) {
      return {
        visibleRaces: processedRaces,
        startIdx: 0,
        hasMore: false,
      };
    }

    // Center window around current index
    const halfWindow = Math.floor((maxVisibleTicks - 1) / 2);
    let start = Math.max(0, currentIndex - halfWindow);
    let end = start + maxVisibleTicks;

    if (end > races.length) {
      end = races.length;
      start = Math.max(0, end - maxVisibleTicks);
    }

    return {
      visibleRaces: processedRaces.slice(start, end),
      startIdx: start,
      hasMore: end < races.length || start > 0,
    };
  }, [races.length, processedRaces, currentIndex, maxVisibleTicks]);

  return (
    <View style={styles.container}>
      {/* Axis line */}
      <View style={styles.axisLine} />

      {/* Time ticks */}
      <View style={styles.ticksContainer}>
        {/* Left overflow indicator */}
        {startIdx > 0 && (
          <TouchableOpacity
            style={styles.overflowIndicator}
            onPress={() => handleTickPress(0)}
            hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
          >
            <Text style={styles.chevron}>◂</Text>
          </TouchableOpacity>
        )}

        {/* Visible ticks */}
        {visibleRaces.map((race) => {
          const actualIndex = race.originalIndex;
          const isActive = actualIndex === currentIndex;
          const isNext = actualIndex === nextRaceIndex;

          return (
            <TimeAxisTick
              key={race.id}
              race={race}
              index={actualIndex}
              isActive={isActive}
              isNext={isNext}
              dateLabel={dateLabels[actualIndex].label}
              onPress={() => handleTickPress(actualIndex)}
            />
          );
        })}

        {/* Right overflow indicator */}
        {startIdx + visibleRaces.length < races.length && (
          <TouchableOpacity
            style={styles.overflowIndicator}
            onPress={() => handleTickPress(races.length - 1)}
            hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
          >
            <Text style={styles.chevron}>▸</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Legend hint (appears subtly on first view) */}
      {/* <View style={styles.legendHint}>
        <Text style={styles.legendText}>○ Fleet  △ Distance  ◆ Series</Text>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SIZES.axisHeight,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
    justifyContent: 'flex-end',
  },
  axisLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 14,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.axisLine,
  },
  ticksContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  tick: {
    alignItems: 'center',
    minWidth: SIZES.tickSpacing,
    paddingHorizontal: 2,
  },
  tickActive: {
    // No extra styling needed - the shape handles it
  },
  shapeContainer: {
    width: SIZES.shapeActiveSize + 2,
    height: SIZES.shapeActiveSize + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  shapeContainerActive: {
    backgroundColor: COLORS.activeGlow,
  },
  nowIndicator: {
    width: 2,
    height: 5,
    backgroundColor: COLORS.nextRace,
    borderRadius: 1,
    marginBottom: 2,
    position: 'absolute',
    top: -8,
  },
  dateLabel: {
    fontSize: SIZES.dateTextSize,
    color: COLORS.dateText,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  dateLabelActive: {
    color: COLORS.active,
    fontWeight: '600',
  },
  overflowIndicator: {
    width: 16,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 10,
    color: COLORS.chevron,
  },
  legendHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  legendText: {
    fontSize: 9,
    color: COLORS.inactive,
    letterSpacing: 0.5,
  },
});

export default TimelineTimeAxis;
