/**
 * CardGrid (Native) - Horizontal Race Timeline Navigation
 *
 * Simplified architecture:
 * - Horizontal swipes for race timeline navigation
 * - Single RaceSummaryCard per race (full height, scrolls internally)
 * - Phase tabs inside card for temporal navigation
 * - Bottom sheet for drill-down details
 *
 * Uses react-native-gesture-handler and react-native-reanimated.
 */

import React, { useCallback, useMemo, memo, useState, useEffect } from 'react';
import { StyleSheet, View, Platform, LayoutChangeEvent, TouchableOpacity, Text } from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  CardGridProps,
  CardRaceData,
  CardType,
  CARD_TYPES,
  CardPosition,
} from './types';
import {
  SNAP_SPRING_CONFIG,
  VELOCITY_THRESHOLD,
  SNAP_DISTANCE_THRESHOLD,
  HORIZONTAL_CARD_GAP,
  ENABLE_HAPTICS,
  calculateCardDimensions,
  IOS_COLORS,
} from './constants';
import { CardShell } from './CardShell';

// =============================================================================
// CONSTANTS
// =============================================================================

// Maximum number of dots to show before windowing
const MAX_VISIBLE_DOTS = 7;

// =============================================================================
// TYPES
// =============================================================================

interface CardGridNativeProps extends CardGridProps {
  /** Render function for card content */
  renderCardContent: (
    race: CardRaceData,
    cardType: CardType,
    isActive: boolean,
    isExpanded: boolean,
    onToggleExpand: () => void,
    canManage: boolean,
    onEdit?: () => void,
    onDelete?: () => void,
    onUploadDocument?: () => void,
    onRaceComplete?: (sessionId: string, raceName: string, raceId: string) => void,
    onOpenPostRaceInterview?: () => void,
    userId?: string,
    onDismiss?: () => void
  ) => React.ReactNode;
}

// =============================================================================
// CARD GRID COMPONENT
// =============================================================================

function CardGridComponent({
  races,
  initialRaceIndex = 0,
  onRaceChange,
  renderCardContent,
  style,
  enableHaptics = ENABLE_HAPTICS,
  testID,
  userId,
  onEditRace,
  onDeleteRace,
  onUploadDocument,
  onRaceComplete,
  onOpenPostRaceInterview,
  nextRaceIndex,
  deletingRaceId,
  onDismissSample,
}: CardGridNativeProps) {
  // Track actual container dimensions
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  // Navigation state
  const [jsRaceIndex, setJsRaceIndex] = useState(initialRaceIndex);

  // Shared values for animations
  const currentRaceIndex = useSharedValue(initialRaceIndex);
  const horizontalOffset = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Calculate dimensions
  const effectiveWidth = containerSize?.width ?? 393;
  const effectiveHeight = containerSize?.height ?? 700;

  const dimensions = useMemo(() => {
    const baseCalc = calculateCardDimensions(effectiveWidth, effectiveHeight);
    // Override card height to fill available space (small bottom padding for breathing room)
    return {
      ...baseCalc,
      cardHeight: effectiveHeight - 24, // Bottom margin for dots + visual breathing room
    };
  }, [effectiveWidth, effectiveHeight]);

  // Update horizontal offset when dimensions change
  useMemo(() => {
    horizontalOffset.value = jsRaceIndex * dimensions.horizontalSnapInterval;
  }, [dimensions.horizontalSnapInterval, jsRaceIndex]);

  // Respond to initialRaceIndex changes from parent (e.g., "upcoming" button)
  useEffect(() => {
    if (initialRaceIndex !== jsRaceIndex && initialRaceIndex >= 0 && initialRaceIndex < races.length) {
      // Update shared values
      currentRaceIndex.value = initialRaceIndex;
      horizontalOffset.value = withSpring(initialRaceIndex * dimensions.horizontalSnapInterval, SNAP_SPRING_CONFIG);
      // Update JS state
      setJsRaceIndex(initialRaceIndex);
      // Trigger callback
      if (onRaceChange && races[initialRaceIndex]) {
        onRaceChange(initialRaceIndex, races[initialRaceIndex]);
      }
    }
  }, [initialRaceIndex]);

  // ==========================================================================
  // GESTURE HANDLING
  // ==========================================================================

  const handleRaceChange = useCallback(
    (idx: number) => {
      setJsRaceIndex(idx);
      if (onRaceChange && races[idx]) {
        onRaceChange(idx, races[idx]);
      }
    },
    [onRaceChange, races]
  );

  /**
   * Navigate to a specific race index (used by timeline dots)
   */
  const goToRace = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= races.length || targetIndex === jsRaceIndex) {
        return;
      }

      // Haptic feedback
      if (enableHaptics && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Update shared values for animation
      currentRaceIndex.value = targetIndex;
      horizontalOffset.value = withSpring(targetIndex * dimensions.horizontalSnapInterval, SNAP_SPRING_CONFIG);

      // Update JS state and trigger callback
      handleRaceChange(targetIndex);
    },
    [races.length, jsRaceIndex, enableHaptics, dimensions.horizontalSnapInterval, handleRaceChange, currentRaceIndex, horizontalOffset]
  );

  const racesCount = races.length;

  /**
   * Pan gesture for horizontal race navigation
   */
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          isGestureActive.value = true;
        })
        .onUpdate((event) => {
          'worklet';
          const { translationX } = event;
          const currentIdx = Math.max(0, currentRaceIndex.value);
          const baseOffset = currentIdx * dimensions.horizontalSnapInterval;
          horizontalOffset.value = baseOffset - translationX;
        })
        .onEnd((event) => {
          'worklet';
          const { translationX, velocityX } = event;
          const currentIndex = Math.max(0, currentRaceIndex.value);
          let targetIndex = currentIndex;

          // Check velocity and distance thresholds
          if (velocityX < -VELOCITY_THRESHOLD || translationX < -SNAP_DISTANCE_THRESHOLD) {
            targetIndex = Math.min(currentIndex + 1, racesCount - 1);
          } else if (velocityX > VELOCITY_THRESHOLD || translationX > SNAP_DISTANCE_THRESHOLD) {
            targetIndex = Math.max(currentIndex - 1, 0);
          }

          // Ensure targetIndex is valid
          targetIndex = Math.max(0, Math.min(targetIndex, racesCount - 1));

          // Snap to target
          const targetOffset = targetIndex * dimensions.horizontalSnapInterval;
          horizontalOffset.value = withSpring(targetOffset, SNAP_SPRING_CONFIG);
          currentRaceIndex.value = targetIndex;

          // Haptic feedback
          if (enableHaptics && Platform.OS !== 'web' && targetIndex !== currentIndex) {
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          }

          // Callback
          if (targetIndex !== currentIndex) {
            runOnJS(handleRaceChange)(targetIndex);
          }

          isGestureActive.value = false;
        }),
    [
      dimensions.horizontalSnapInterval,
      racesCount,
      enableHaptics,
      handleRaceChange,
      currentRaceIndex,
      horizontalOffset,
      isGestureActive,
    ]
  );

  // ==========================================================================
  // ANIMATED CONTAINER STYLE
  // ==========================================================================

  const animatedContainerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: -horizontalOffset.value + dimensions.contentPaddingLeft },
      ],
    };
  }, [dimensions.contentPaddingLeft]);

  // ==========================================================================
  // RENDER CARDS
  // ==========================================================================

  const gridState = useMemo(
    () => ({
      currentRaceIndex,
      horizontalOffset,
      isGestureActive,
    }),
    [currentRaceIndex, horizontalOffset, isGestureActive]
  );

  /**
   * Render a single card for a race
   */
  const renderCard = useCallback(
    (race: CardRaceData, raceIndex: number) => {
      const position: CardPosition = { x: raceIndex };
      const isActive = raceIndex === jsRaceIndex;

      // Only render cards within visible range for performance
      const isNearby = Math.abs(raceIndex - jsRaceIndex) <= 1;
      if (!isNearby) {
        return null;
      }

      // Determine if user can manage this race (or if it's a demo race that can be dismissed)
      const isDemo = !!(race as any).isDemo;
      const canManage = (!!userId && race.created_by === userId) || isDemo;
      const handleEdit = !isDemo && canManage && onEditRace ? () => onEditRace(race.id) : undefined;
      const handleDelete = !isDemo && canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined;
      const handleDismiss = isDemo && onDismissSample ? onDismissSample : undefined;
      const handleUploadDocument = onUploadDocument ? () => onUploadDocument(race.id) : undefined;
      const handleRaceComplete = onRaceComplete
        ? (sessionId: string, raceName: string, raceId: string) => onRaceComplete(sessionId, raceName, raceId)
        : undefined;
      const handleOpenPostRaceInterview = onOpenPostRaceInterview
        ? () => onOpenPostRaceInterview(race.id, race.name)
        : undefined;

      // Determine if this is the next upcoming race (for subtle styling)
      // Use != to catch both null and undefined
      const isNextRace = nextRaceIndex != null && raceIndex === nextRaceIndex;

      return (
        <View
          key={race.id}
          style={[
            styles.cardPosition,
            {
              left: raceIndex * (dimensions.cardWidth + HORIZONTAL_CARD_GAP),
              top: 0,
            },
          ]}
        >
          <CardShell
            isNextRace={isNextRace}
            position={position}
            dimensions={dimensions}
            gridState={gridState}
            testID={`card-${race.id}`}
            isDeleting={deletingRaceId === race.id}
          >
            {renderCardContent(
              race,
              'race_summary',
              isActive,
              false, // isExpanded - native grid doesn't support expand/collapse
              () => {}, // onToggleExpand - no-op for native
              canManage,
              handleEdit,
              handleDelete,
              handleUploadDocument,
              handleRaceComplete,
              handleOpenPostRaceInterview,
              userId,
              handleDismiss
            )}
          </CardShell>
        </View>
      );
    },
    [
      jsRaceIndex,
      dimensions,
      gridState,
      renderCardContent,
      userId,
      onEditRace,
      onDeleteRace,
      onUploadDocument,
      onRaceComplete,
      onOpenPostRaceInterview,
      deletingRaceId,
      onDismissSample,
    ]
  );

  /**
   * Render all visible cards
   */
  const renderCards = useMemo(() => {
    return races.map((race, raceIndex) => renderCard(race, raceIndex)).filter(Boolean);
  }, [races, renderCard, jsRaceIndex, dimensions]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (races.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]} testID={testID}>
        {/* Empty state could go here */}
      </View>
    );
  }

  // Calculate total grid size (horizontal only)
  const totalGridWidth = races.length * (dimensions.cardWidth + HORIZONTAL_CARD_GAP);

  return (
    <GestureHandlerRootView
      style={[styles.rootContainer, style]}
      testID={testID}
      onLayout={handleLayout}
    >
      <View style={styles.gestureWrapper}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.gridContainer,
              {
                width: totalGridWidth,
                height: dimensions.cardHeight,
              },
              animatedContainerStyle,
            ]}
            collapsable={false}
          >
            {renderCards}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Timeline Navigation Dots */}
      {races.length > 1 && (
        <View style={styles.timelineContainer}>
          <View style={styles.timelineDotsRow}>
            {/* Left arrow for windowed view */}
            {races.length > MAX_VISIBLE_DOTS && jsRaceIndex > Math.floor((MAX_VISIBLE_DOTS - 1) / 2) && (
              <TouchableOpacity
                onPress={() => goToRace(Math.max(0, jsRaceIndex - MAX_VISIBLE_DOTS))}
                style={styles.timelineArrowButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.timelineArrow}>‹</Text>
              </TouchableOpacity>
            )}

            {/* Render dots with windowing */}
            {(() => {
              const totalRaces = races.length;

              // Calculate visible window for many races
              let startIdx = 0;
              let endIdx = totalRaces - 1;

              if (totalRaces > MAX_VISIBLE_DOTS) {
                const halfWindow = Math.floor((MAX_VISIBLE_DOTS - 1) / 2);
                startIdx = Math.max(0, jsRaceIndex - halfWindow);
                endIdx = startIdx + MAX_VISIBLE_DOTS - 1;
                if (endIdx >= totalRaces) {
                  endIdx = totalRaces - 1;
                  startIdx = Math.max(0, endIdx - MAX_VISIBLE_DOTS + 1);
                }
              }

              return races.slice(startIdx, endIdx + 1).map((race, idx) => {
                const actualIndex = startIdx + idx;
                const isSelected = actualIndex === jsRaceIndex;
                const isNextRace = nextRaceIndex != null && actualIndex === nextRaceIndex;

                return (
                  <TouchableOpacity
                    key={race.id || `dot-${actualIndex}`}
                    onPress={() => goToRace(actualIndex)}
                    style={styles.timelineDotContainer}
                    hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                  >
                    {/* Now bar - small vertical line above the upcoming race dot */}
                    {isNextRace && (
                      <View style={styles.timelineNowBar} />
                    )}
                    {/* Uniform circle: filled for active, hollow for inactive */}
                    <View
                      style={[
                        styles.timelineDot,
                        isSelected ? styles.timelineDotActive : styles.timelineDotInactive,
                      ]}
                    />
                  </TouchableOpacity>
                );
              });
            })()}

            {/* Right arrow for windowed view */}
            {races.length > MAX_VISIBLE_DOTS && jsRaceIndex < races.length - 1 - Math.floor((MAX_VISIBLE_DOTS - 1) / 2) && (
              <TouchableOpacity
                onPress={() => goToRace(Math.min(races.length - 1, jsRaceIndex + MAX_VISIBLE_DOTS))}
                style={styles.timelineArrowButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.timelineArrow, { marginLeft: 2, marginRight: 0 }]}>›</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      )}
    </GestureHandlerRootView>
  );
}

// =============================================================================
// MEMOIZED EXPORT
// =============================================================================

export const CardGrid = memo(CardGridComponent);

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    overflow: 'hidden',
    minHeight: 500,
  },
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureWrapper: {
    flex: 1,
  },
  gridContainer: {
    position: 'relative',
  },
  cardPosition: {
    position: 'absolute',
  },
  // Timeline navigation - iOS Page Control style (below card)
  timelineContainer: {
    position: 'absolute',
    bottom: 48, // Lift dots up from the bottom edge
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timelineDotContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 14,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineDotActive: {
    backgroundColor: '#374151',
  },
  timelineDotInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  timelineNowBar: {
    width: 2,
    height: 5,
    backgroundColor: '#34C759',
    borderRadius: 1,
    marginBottom: 2,
  },
  timelineArrowButton: {
    paddingHorizontal: 4,
  },
  timelineArrow: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default CardGrid;
