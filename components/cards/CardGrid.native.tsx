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
import { StyleSheet, View, Platform, LayoutChangeEvent } from 'react-native';
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
    // Override card height to fill available space (minimal bottom padding)
    return {
      ...baseCalc,
      cardHeight: effectiveHeight - 24, // Small bottom margin for visual breathing room
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
});

export default CardGrid;
