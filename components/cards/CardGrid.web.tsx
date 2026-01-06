/**
 * CardGrid (Web) - 2D Card Navigation Component
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors
 * - CSS scroll-snap for smooth snapping
 * - Arrow key navigation
 * - Touch events for mobile web
 * - No heavy JS animations (better performance)
 *
 * This mirrors the native functionality but uses web-native features.
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
  CARD_TYPES,
  CARD_COUNT,
  CardPosition,
  CardDimensions,
} from './types';
import {
  calculateCardDimensions,
  HORIZONTAL_CARD_GAP,
  VERTICAL_CARD_GAP,
  CARD_BORDER_RADIUS,
  CARD_SHADOW,
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
    onRaceComplete?: (sessionId: string, raceName: string, raceId: string) => void
  ) => React.ReactNode;
}

// =============================================================================
// CARD GRID COMPONENT
// =============================================================================

function CardGridComponent({
  races,
  initialRaceIndex = 0,
  initialCardIndex = 0,
  onRaceChange,
  onCardChange,
  renderCardContent,
  style,
  testID,
  userId,
  onEditRace,
  onDeleteRace,
  onUploadDocument,
  onRaceComplete,
}: CardGridWebProps) {
  // Refs for scroll containers
  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRefs = useRef<Record<number, ScrollView | null>>({});

  // State
  const [dimensions, setDimensions] = useState<CardDimensions>(() =>
    calculateCardDimensions(
      typeof window !== 'undefined' ? window.innerWidth : 375,
      typeof window !== 'undefined' ? window.innerHeight : 667
    )
  );
  const [currentRaceIndex, setCurrentRaceIndex] = useState(initialRaceIndex);
  const [currentCardIndex, setCurrentCardIndex] = useState(initialCardIndex);
  // Expansion state - tracks which card is currently expanded (null = none)
  // Format: "raceId-cardType" or null
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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

  const goToCard = useCallback(
    (index: number, animated = true) => {
      const clampedIndex = Math.max(0, Math.min(index, CARD_COUNT - 1));
      const offset = clampedIndex * (dimensions.cardHeight + VERTICAL_CARD_GAP);

      // Scroll the vertical container for current race
      verticalScrollRefs.current[currentRaceIndex]?.scrollTo({
        y: offset,
        animated,
      });

      setCurrentCardIndex(clampedIndex);

      if (onCardChange) {
        const cardType = CARD_TYPES[clampedIndex];
        onCardChange(cardType, clampedIndex);
      }
    },
    [dimensions.cardHeight, currentRaceIndex, onCardChange]
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
        case 'ArrowUp':
          event.preventDefault();
          goToCard(currentCardIndex - 1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          goToCard(currentCardIndex + 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRaceIndex, currentCardIndex, goToRace, goToCard]);

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

  const handleVerticalScroll = useCallback(
    (raceIndex: number) => (event: any) => {
      if (raceIndex !== currentRaceIndex) return;

      const offsetY = event.nativeEvent.contentOffset.y;
      const snapInterval = dimensions.cardHeight + VERTICAL_CARD_GAP;
      const newIndex = Math.round(offsetY / snapInterval);

      if (newIndex !== currentCardIndex && newIndex >= 0 && newIndex < CARD_COUNT) {
        setCurrentCardIndex(newIndex);

        if (onCardChange) {
          const cardType = CARD_TYPES[newIndex];
          onCardChange(cardType, newIndex);
        }
      }
    },
    [dimensions.cardHeight, currentRaceIndex, currentCardIndex, onCardChange]
  );

  // ==========================================================================
  // RENDER CARD
  // ==========================================================================

  const renderCard = useCallback(
    (race: CardRaceData, raceIndex: number, cardType: CardType, cardIndex: number) => {
      const isActive = raceIndex === currentRaceIndex && cardIndex === currentCardIndex;

      // Check if this specific card is expanded
      const cardKey = `${race.id}-${cardType}`;
      const isExpanded = expandedCard === cardKey;

      // Create toggle callback for this specific card
      const onToggleExpand = () => {
        setExpandedCard((current) => (current === cardKey ? null : cardKey));
      };

      // Determine if user can manage this race (only show on race_summary card)
      const canManage = cardType === 'race_summary' && !!userId && race.created_by === userId;
      const handleEdit = canManage && onEditRace ? () => onEditRace(race.id) : undefined;
      const handleDelete = canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined;
      // Upload document callback (for regulatory card)
      const handleUploadDocument = cardType === 'regulatory' && onUploadDocument
        ? () => onUploadDocument(race.id)
        : undefined;
      // Race complete callback (for race_summary card timer)
      const handleRaceComplete = cardType === 'race_summary' && onRaceComplete
        ? (sessionId: string, raceName: string, raceId: string) => onRaceComplete(sessionId, raceName, raceId)
        : undefined;

      return (
        <Pressable
          key={`${race.id}-${cardType}`}
          style={[
            styles.card,
            {
              width: dimensions.cardWidth,
              height: dimensions.cardHeight,
              borderRadius: CARD_BORDER_RADIUS,
              opacity: isActive ? 1 : 0.7,
              transform: [{ scale: isActive ? 1 : 0.95 }],
            },
          ]}
          onPress={() => {
            if (raceIndex !== currentRaceIndex) {
              goToRace(raceIndex);
            } else if (cardIndex !== currentCardIndex) {
              goToCard(cardIndex);
            } else {
              // Already active card - toggle expansion
              onToggleExpand();
            }
          }}
        >
          {renderCardContent(
            race,
            cardType,
            isActive,
            isExpanded,
            onToggleExpand,
            canManage,
            handleEdit,
            handleDelete,
            handleUploadDocument,
            handleRaceComplete
          )}
        </Pressable>
      );
    },
    [
      currentRaceIndex,
      currentCardIndex,
      dimensions,
      renderCardContent,
      goToRace,
      goToCard,
      userId,
      onEditRace,
      onDeleteRace,
      onUploadDocument,
      onRaceComplete,
      expandedCard,
    ]
  );

  // ==========================================================================
  // RENDER VERTICAL STACK FOR ONE RACE
  // ==========================================================================

  const renderRaceVerticalStack = useCallback(
    (race: CardRaceData, raceIndex: number) => {
      return (
        <View
          key={race.id}
          style={[
            styles.raceColumn,
            { width: dimensions.cardWidth + HORIZONTAL_CARD_GAP },
          ]}
        >
          <ScrollView
            ref={(ref) => {
              verticalScrollRefs.current[raceIndex] = ref;
            }}
            style={styles.verticalScroll}
            contentContainerStyle={[
              styles.verticalContent,
              { paddingTop: dimensions.contentPaddingTop },
            ]}
            showsVerticalScrollIndicator={false}
            snapToInterval={dimensions.cardHeight + VERTICAL_CARD_GAP}
            decelerationRate="fast"
            onScroll={handleVerticalScroll(raceIndex)}
            scrollEventThrottle={16}
          >
            {CARD_TYPES.map((cardType, cardIndex) =>
              renderCard(race, raceIndex, cardType, cardIndex)
            )}
          </ScrollView>
        </View>
      );
    },
    [dimensions, renderCard, handleVerticalScroll]
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
        {races.map((race, raceIndex) => renderRaceVerticalStack(race, raceIndex))}
      </ScrollView>

      {/* Navigation hints */}
      <View style={styles.navigationHint}>
        <View style={styles.hintDot} />
        <View style={[styles.hintDot, styles.hintDotActive]} />
        <View style={styles.hintDot} />
      </View>
    </View>
  );
}

// =============================================================================
// MEMOIZED EXPORT
// =============================================================================

export const CardGrid = memo(CardGridComponent);

// =============================================================================
// STYLES (Apple HIG Compliant)
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
  },
  raceColumn: {
    height: '100%',
  },
  verticalScroll: {
    flex: 1,
  },
  verticalContent: {
    gap: VERTICAL_CARD_GAP,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    overflow: 'hidden',
    // @ts-ignore - Web-only property (iOS-style subtle shadow)
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
    marginBottom: VERTICAL_CARD_GAP,
  },
  navigationHint: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.gray4,
  },
  hintDotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.gray,
  },
});

export default CardGrid;
