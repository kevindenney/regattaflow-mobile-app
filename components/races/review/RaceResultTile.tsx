/**
 * RaceResultTile - Apple Weather-inspired race result widget
 *
 * Compact pressable tile replacing the ReviewChecklistItem in the RESULT section.
 * Shows sparkline of recent positions, current result, fleet position bar.
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Trophy, Check } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import { FleetPositionBar } from './FleetPositionBar';
import { useRecentRaceResults, type RecentRacePosition } from '@/hooks/useRecentRaceResults';
import { Marginalia } from '@/components/ui/Marginalia';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// iOS System Colors
const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

interface RaceResultTileProps {
  /** Current result position (null if not yet recorded) */
  position?: number;
  /** Current result fleet size (null if not yet recorded) */
  fleetSize?: number;
  /** Race count for multi-race regattas */
  raceCount?: number;
  /** User ID for fetching race history */
  userId?: string;
  /** Current race ID (excluded from history) */
  raceId?: string;
  /** Callback when tile is pressed */
  onPress?: () => void;
  /** Coach annotation for the result field */
  coachAnnotation?: { comment: string; isRead: boolean };
}

/**
 * Get ordinal suffix for a number
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// ─── Sparkline ─────────────────────────────────────────────────────────
const SPARKLINE_WIDTH = 120;
const SPARKLINE_HEIGHT = 40;
const SPARKLINE_PADDING = 8;

interface SparklineProps {
  recentResults: RecentRacePosition[];
  currentPosition?: number;
  currentFleetSize?: number;
  width?: number;
  height?: number;
}

function PositionSparkline({
  recentResults,
  currentPosition,
  currentFleetSize,
  width = SPARKLINE_WIDTH,
  height = SPARKLINE_HEIGHT,
}: SparklineProps) {
  // Combine all data points to determine Y scale
  const allPositions = recentResults.map((r) => r.position);
  const allFleetSizes = recentResults.map((r) => r.fleetSize);
  if (currentPosition) allPositions.push(currentPosition);
  if (currentFleetSize) allFleetSizes.push(currentFleetSize);

  const maxFleet = Math.max(...allFleetSizes, currentFleetSize || 0, 1);
  const minPos = 1;
  const maxPos = Math.max(...allPositions, maxFleet);

  // Total number of points (history + current race slot)
  const totalPoints = recentResults.length + 1;
  const innerWidth = width - SPARKLINE_PADDING * 2;
  const innerHeight = height - SPARKLINE_PADDING * 2;

  // Map position to Y (1st place at top, worst at bottom)
  const posToY = (pos: number) => {
    if (maxPos <= minPos) return SPARKLINE_PADDING + innerHeight / 2;
    return SPARKLINE_PADDING + ((pos - minPos) / (maxPos - minPos)) * innerHeight;
  };

  // Map index to X
  const idxToX = (idx: number) => {
    if (totalPoints <= 1) return SPARKLINE_PADDING + innerWidth / 2;
    return SPARKLINE_PADDING + (idx / (totalPoints - 1)) * innerWidth;
  };

  // Build points for past races
  const pastPoints = recentResults.map((r, i) => ({
    x: idxToX(i),
    y: posToY(r.position),
  }));

  // Current race point (last position on X axis)
  const currentIdx = recentResults.length;
  const currentX = idxToX(currentIdx);
  const currentY = currentPosition ? posToY(currentPosition) : posToY(maxPos / 2);

  // Polyline for past races
  const pastPolylinePoints = pastPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // If current position exists, extend the polyline to include it
  const fullPolylinePoints = currentPosition
    ? `${pastPolylinePoints} ${currentX},${posToY(currentPosition)}`
    : pastPolylinePoints;

  return (
    <Svg width={width} height={height}>
      {/* Grid lines at position 1 and max fleet */}
      <Line
        x1={SPARKLINE_PADDING}
        y1={posToY(1)}
        x2={width - SPARKLINE_PADDING}
        y2={posToY(1)}
        stroke={COLORS.gray5}
        strokeWidth={0.5}
      />
      <Line
        x1={SPARKLINE_PADDING}
        y1={posToY(maxPos)}
        x2={width - SPARKLINE_PADDING}
        y2={posToY(maxPos)}
        stroke={COLORS.gray5}
        strokeWidth={0.5}
      />

      {/* Connecting line */}
      {pastPoints.length > 0 && (
        <Polyline
          points={fullPolylinePoints}
          fill="none"
          stroke={currentPosition ? COLORS.green : COLORS.gray3}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dashed line to current race position when empty */}
      {!currentPosition && pastPoints.length > 0 && (
        <Line
          x1={pastPoints[pastPoints.length - 1].x}
          y1={pastPoints[pastPoints.length - 1].y}
          x2={currentX}
          y2={currentY}
          stroke={COLORS.gray3}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}

      {/* Past race dots */}
      {pastPoints.map((p, i) => (
        <Circle
          key={`past-${i}`}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={COLORS.gray}
          stroke={COLORS.background}
          strokeWidth={1}
        />
      ))}

      {/* Current race dot */}
      {currentPosition ? (
        // Filled, highlighted dot for recorded result
        <Circle
          cx={currentX}
          cy={posToY(currentPosition)}
          r={4}
          fill={COLORS.green}
          stroke={COLORS.background}
          strokeWidth={1.5}
        />
      ) : (
        // Open/dashed circle for unrecorded result
        <Circle
          cx={currentX}
          cy={currentY}
          r={4}
          fill="none"
          stroke={COLORS.gray3}
          strokeWidth={1.5}
          strokeDasharray="2,2"
        />
      )}
    </Svg>
  );
}

// ─── Main Tile ─────────────────────────────────────────────────────────

export function RaceResultTile({
  position,
  fleetSize,
  raceCount,
  userId,
  raceId,
  onPress,
  coachAnnotation,
}: RaceResultTileProps) {
  const { recentResults, averagePosition } = useRecentRaceResults(userId, raceId);
  const hasResult = !!position && !!fleetSize;
  const hasHistory = recentResults.length > 0;

  // Animation (IOSWidgetCard pattern)
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
    }
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    if (onPress) {
      triggerHaptic('impactLight');
      onPress();
    }
  };

  return (
    <View style={styles.tileWrapper}>
      <AnimatedPressable
        style={[
          styles.tile,
          hasResult && styles.tileComplete,
          animatedStyle,
          Platform.OS !== 'web' && IOS_SHADOWS.card,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={
          hasResult ? `Race result: ${getOrdinal(position!)} of ${fleetSize}` : 'Record race result'
        }
      >
        {/* Completion badge */}
        {hasResult && (
          <View style={styles.completeBadge}>
            <Check size={10} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}

        {/* Header row */}
        <View style={styles.header}>
          <Trophy size={12} color={COLORS.green} />
          <Text style={styles.headerLabel}>RESULT</Text>
        </View>

        {/* Central content area - fills the square */}
        <View style={styles.body}>
          {/* Sparkline */}
          {hasHistory && (
            <PositionSparkline
              recentResults={recentResults}
              currentPosition={position}
              currentFleetSize={fleetSize}
              width={110}
              height={36}
            />
          )}

          {/* Result display */}
          {hasResult ? (
            <View style={styles.resultRow}>
              <Text style={styles.positionLarge}>{getOrdinal(position!)}</Text>
              <Text style={styles.fleetLabel}>of {fleetSize}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>— / —</Text>
          )}

          {/* Fleet position bar */}
          {hasResult ? (
            <FleetPositionBar position={position!} fleetSize={fleetSize!} height={4} />
          ) : (
            <FleetPositionBar position={1} fleetSize={1} height={4} disabled />
          )}
        </View>

        {/* Footer */}
        <Text style={styles.hint} numberOfLines={1}>
          {hasResult
            ? 'Tap to edit'
            : hasHistory
              ? `Avg: ${averagePosition}`
              : 'Record result'}
        </Text>
      </AnimatedPressable>

      {/* Coach annotation outside the square */}
      {coachAnnotation && (
        <Marginalia
          author="Coach"
          comment={coachAnnotation.comment}
          isNew={!coachAnnotation.isRead}
          variant="compact"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tileWrapper: {
    flex: 1,
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    padding: 12,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileComplete: {
    borderColor: `${COLORS.green}60`,
    backgroundColor: `${COLORS.green}06`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  positionLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  fleetLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  placeholderText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.gray3,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default RaceResultTile;
