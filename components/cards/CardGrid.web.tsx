/**
 * CardGrid (Web) - Horizontal Race Timeline Navigation
 *
 * Simplified architecture:
 * - Horizontal scrolling for race timeline navigation
 * - Single RaceSummaryCard per race (full height, scrolls internally)
 * - CSS scroll-snap for smooth snapping
 * - Arrow key navigation (left/right only)
 */

import React, {
  useCallback,
  useMemo,
  memo,
  useRef,
  useEffect,
  useState,
} from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';

import {
  CardGridProps,
  CardRaceData,
  CardType,
  CardDimensions,
} from './types';
import {
  calculateCardDimensions,
  HORIZONTAL_CARD_GAP,
  CARD_BORDER_RADIUS,
  IOS_COLORS,
} from './constants';

// =============================================================================
// TYPES
// =============================================================================

interface CardGridWebProps extends CardGridProps {
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
    userId?: string
  ) => React.ReactNode;
}

// =============================================================================
// CARD GRID COMPONENT
// =============================================================================

// Timeline indicator constants
const MAX_VISIBLE_DOTS = 7;

function CardGridComponent({
  races,
  initialRaceIndex = 0,
  onRaceChange,
  renderCardContent,
  style,
  testID,
  userId,
  onEditRace,
  onDeleteRace,
  onUploadDocument,
  onRaceComplete,
  onOpenPostRaceInterview,
  nextRaceIndex,
}: CardGridWebProps & { nextRaceIndex?: number | null }) {
  // Refs for scroll container
  const horizontalScrollRef = useRef<ScrollView>(null);

  // State
  const [dimensions, setDimensions] = useState<CardDimensions>(() =>
    calculateCardDimensions(
      typeof window !== 'undefined' ? window.innerWidth : 375,
      typeof window !== 'undefined' ? window.innerHeight : 667
    )
  );
  const [currentRaceIndex, setCurrentRaceIndex] = useState(initialRaceIndex);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(
        calculateCardDimensions(window.innerWidth, window.innerHeight)
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate full height card dimensions
  const cardHeight = useMemo(() => {
    return dimensions.screenHeight - dimensions.contentPaddingTop * 2;
  }, [dimensions]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const goToRace = useCallback(
    (index: number, animated = true) => {
      const clampedIndex = Math.max(0, Math.min(index, races.length - 1));
      const offset = clampedIndex * (dimensions.cardWidth + HORIZONTAL_CARD_GAP);

      horizontalScrollRef.current?.scrollTo({
        x: offset,
        animated,
      });

      setCurrentRaceIndex(clampedIndex);

      if (onRaceChange && races[clampedIndex]) {
        onRaceChange(clampedIndex, races[clampedIndex]);
      }
    },
    [races, dimensions.cardWidth, onRaceChange]
  );

  // ==========================================================================
  // KEYBOARD NAVIGATION
  // ==========================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToRace(currentRaceIndex - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToRace(currentRaceIndex + 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRaceIndex, goToRace]);

  // Respond to initialRaceIndex changes from parent (e.g., "upcoming" button)
  useEffect(() => {
    if (initialRaceIndex !== currentRaceIndex && initialRaceIndex >= 0 && initialRaceIndex < races.length) {
      goToRace(initialRaceIndex);
    }
  }, [initialRaceIndex]);

  // ==========================================================================
  // SCROLL HANDLERS
  // ==========================================================================

  const handleHorizontalScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const snapInterval = dimensions.cardWidth + HORIZONTAL_CARD_GAP;
      const newIndex = Math.round(offsetX / snapInterval);

      if (newIndex !== currentRaceIndex && newIndex >= 0 && newIndex < races.length) {
        setCurrentRaceIndex(newIndex);

        if (onRaceChange && races[newIndex]) {
          onRaceChange(newIndex, races[newIndex]);
        }
      }
    },
    [dimensions.cardWidth, currentRaceIndex, races, onRaceChange]
  );

  // ==========================================================================
  // RENDER CARD
  // ==========================================================================

  const renderCard = useCallback(
    (race: CardRaceData, raceIndex: number) => {
      const isActive = raceIndex === currentRaceIndex;

      // Determine if user can manage this race
      const canManage = !!userId && race.created_by === userId;
      const handleEdit = canManage && onEditRace ? () => onEditRace(race.id) : undefined;
      const handleDelete = canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined;
      const handleUploadDocument = onUploadDocument ? () => onUploadDocument(race.id) : undefined;
      const handleRaceComplete = onRaceComplete
        ? (sessionId: string, raceName: string, raceId: string) => onRaceComplete(sessionId, raceName, raceId)
        : undefined;
      const handleOpenPostRaceInterview = onOpenPostRaceInterview
        ? () => onOpenPostRaceInterview(race.id, race.name)
        : undefined;

      // Handler for card navigation
      const handleCardPress = () => {
        if (raceIndex !== currentRaceIndex) {
          goToRace(raceIndex);
        }
      };

      return (
        <Pressable
          key={race.id}
          style={[
            styles.card,
            {
              width: dimensions.cardWidth,
              height: cardHeight,
              borderRadius: CARD_BORDER_RADIUS,
              opacity: isActive ? 1 : 0.7,
              transform: [{ scale: isActive ? 1 : 0.95 }],
            },
          ]}
          onPress={handleCardPress}
        >
          {renderCardContent(
            race,
            'race_summary',
            isActive,
            false, // isExpanded - web grid doesn't support expand/collapse
            () => {}, // onToggleExpand - no-op for web grid
            canManage,
            handleEdit,
            handleDelete,
            handleUploadDocument,
            handleRaceComplete,
            handleOpenPostRaceInterview,
            userId
          )}
        </Pressable>
      );
    },
    [
      currentRaceIndex,
      dimensions,
      cardHeight,
      renderCardContent,
      goToRace,
      userId,
      onEditRace,
      onDeleteRace,
      onUploadDocument,
      onRaceComplete,
      onOpenPostRaceInterview,
    ]
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (races.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]} testID={testID}>
        {/* Empty state */}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        style={styles.horizontalScroll}
        contentContainerStyle={[
          styles.horizontalContent,
          { paddingHorizontal: dimensions.contentPaddingLeft },
        ]}
        showsHorizontalScrollIndicator={false}
        snapToInterval={dimensions.cardWidth + HORIZONTAL_CARD_GAP}
        decelerationRate="fast"
        onScroll={handleHorizontalScroll}
        scrollEventThrottle={16}
      >
        {races.map((race, raceIndex) => renderCard(race, raceIndex))}
      </ScrollView>

      {/* Timeline Navigation Dots */}
      {races.length > 1 && (
        <View style={styles.timelineContainer}>
          <View style={styles.timelineDotsRow}>
            {/* Left arrow for windowed view */}
            {races.length > MAX_VISIBLE_DOTS && currentRaceIndex > Math.floor((MAX_VISIBLE_DOTS - 1) / 2) && (
              <Pressable
                onPress={() => goToRace(Math.max(0, currentRaceIndex - MAX_VISIBLE_DOTS))}
                style={styles.timelineArrowButton}
              >
                <span style={{ color: '#94A3B8', fontSize: 12 }}>‹</span>
              </Pressable>
            )}

            {/* Render dots */}
            {(() => {
              const totalRaces = races.length;

              // Calculate visible window for many races
              let startIdx = 0;
              let endIdx = totalRaces - 1;

              if (totalRaces > MAX_VISIBLE_DOTS) {
                const halfWindow = Math.floor((MAX_VISIBLE_DOTS - 1) / 2);
                startIdx = Math.max(0, currentRaceIndex - halfWindow);
                endIdx = startIdx + MAX_VISIBLE_DOTS - 1;
                if (endIdx >= totalRaces) {
                  endIdx = totalRaces - 1;
                  startIdx = Math.max(0, endIdx - MAX_VISIBLE_DOTS + 1);
                }
              }

              return races.slice(startIdx, endIdx + 1).map((race, idx) => {
                const actualIndex = startIdx + idx;
                const isSelected = actualIndex === currentRaceIndex;
                const isNextRace = nextRaceIndex !== null && nextRaceIndex !== undefined && actualIndex === nextRaceIndex;

                return (
                  <Pressable
                    key={race.id || `dot-${actualIndex}`}
                    onPress={() => goToRace(actualIndex)}
                    style={styles.timelineDotContainer}
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
                  </Pressable>
                );
              });
            })()}

            {/* Right arrow for windowed view */}
            {races.length > MAX_VISIBLE_DOTS && currentRaceIndex < races.length - 1 - Math.floor((MAX_VISIBLE_DOTS - 1) / 2) && (
              <Pressable
                onPress={() => goToRace(Math.min(races.length - 1, currentRaceIndex + MAX_VISIBLE_DOTS))}
                style={styles.timelineArrowButton}
              >
                <span style={{ color: '#94A3B8', fontSize: 12 }}>›</span>
              </Pressable>
            )}
          </View>

        </View>
      )}
    </View>
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
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    overflow: 'hidden',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalContent: {
    flexDirection: 'row',
    gap: HORIZONTAL_CARD_GAP,
    alignItems: 'flex-start',
    paddingTop: 40,
  },
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    overflow: 'hidden',
    // @ts-ignore - Web-only property
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  },
  // Timeline Indicators - iOS Page Control style (below card)
  timelineContainer: {
    position: 'absolute',
    bottom: 4,
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
    // @ts-ignore - Web cursor
    cursor: 'pointer',
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
    padding: 4,
    // @ts-ignore - Web cursor
    cursor: 'pointer',
  },
});

export default CardGrid;
