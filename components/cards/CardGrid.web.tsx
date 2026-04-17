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
import { StyleSheet, View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import {
  CardGridProps,
  CardRaceData,
  CardType,
  CardDimensions,
  isRacePast,
} from './types';
import {
  calculateCardDimensions,
  calculateWebCardWidth,
  HORIZONTAL_CARD_GAP,
  CARD_BORDER_RADIUS,
  IOS_COLORS,
} from './constants';
import { CardWidthContext } from './CardWidthContext';
import { TimeAxisRace } from '@/components/races/TimelineTimeAxis';

const NOW_DIVIDER_WIDTH = 32; // Width of the NOW separator between cards

// =============================================================================
// TYPES
// =============================================================================

interface CardGridWebProps extends CardGridProps {
  /** Render function for card content */
  renderCardContent: (
    race: CardRaceData,
    cardType: CardType,
    isActive: boolean,
    canManage: boolean,
    onEdit?: () => void,
    onDelete?: () => void,
    onUploadDocument?: () => void,
    onRaceComplete?: (sessionId: string, raceName: string, raceId: string) => void,
    onOpenPostRaceInterview?: () => void,
    userId?: string,
    onDismiss?: () => void,
    raceIndex?: number,
    totalRaces?: number,
    // Timeline navigation props (for compact axis inside card)
    timelineRaces?: Array<{ id: string; date: string; raceType?: 'fleet' | 'distance' | 'match' | 'team'; seriesName?: string; name?: string; interestSlug?: string; metadata?: Record<string,unknown> }>,
    currentRaceIndex?: number,
    onSelectRace?: (index: number) => void,
    nextRaceIndex?: number,
    // Handler for card press (navigation to this card when clicking partially visible cards)
    onCardPress?: () => void,
    // Refetch trigger for AfterRaceContent
    refetchTrigger?: number
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
  testID,
  userId,
  onEditRace,
  onDeleteRace,
  onUploadDocument,
  onRaceComplete,
  onOpenPostRaceInterview,
  nextRaceIndex,
  topInset,
  refetchTrigger,
  nowBarWeather,
}: CardGridWebProps & { nextRaceIndex?: number | null; topInset?: number }) {
  // Refs for scroll container
  const horizontalScrollRef = useRef<ScrollView>(null);
  const containerRef = useRef<View>(null);

  // Track container width via ResizeObserver (accounts for shelf sidebar)
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );

  // State
  const [dimensions, setDimensions] = useState<CardDimensions>(() =>
    calculateCardDimensions(containerWidth, typeof window !== 'undefined' ? window.innerHeight : 667)
  );
  const [currentRaceIndex, setCurrentRaceIndex] = useState(initialRaceIndex);
  const currentRaceIdRef = useRef<string | null>(races[initialRaceIndex]?.id ?? null);
  const [isHovering, setIsHovering] = useState(false);

  // Keep currentRaceIdRef in sync with index changes
  useEffect(() => {
    currentRaceIdRef.current = races[currentRaceIndex]?.id ?? null;
  }, [currentRaceIndex, races]);

  // When races array changes, keep selection on the same race ID (it may have
  // shifted to a different index due to upstream data changes / refetch).
  const prevRacesRef = useRef(races);
  useEffect(() => {
    if (prevRacesRef.current === races) return;
    prevRacesRef.current = races;
    const trackedId = currentRaceIdRef.current;
    if (!trackedId || races.length === 0) return;
    const newIdx = races.findIndex((r) => r.id === trackedId);
    if (newIdx >= 0 && newIdx !== currentRaceIndex) {
      // Same race is now at a different index — re-center without calling onRaceChange
      setCurrentRaceIndex(newIdx);
      const cardStep = dimensions.cardWidth + HORIZONTAL_CARD_GAP;
      const dividerExtra = NOW_DIVIDER_WIDTH + HORIZONTAL_CARD_GAP;
      let offset = newIdx * cardStep;
      if (nextRaceIndex != null && newIdx >= nextRaceIndex) offset += dividerExtra;
      horizontalScrollRef.current?.scrollTo({ x: offset, animated: false });
    }
  }, [races, currentRaceIndex, dimensions.cardWidth]);

  // Calculate arrow visibility
  const showLeftArrow = currentRaceIndex > 0;
  const showRightArrow = currentRaceIndex < races.length - 1;
  const lastDoneIndex = useMemo(() => {
    if (races.length === 0) return null;
    if (nextRaceIndex != null) {
      if (nextRaceIndex <= 0) return null;
      return Math.min(nextRaceIndex - 1, races.length - 1);
    }
    for (let i = races.length - 1; i >= 0; i -= 1) {
      if (isRacePast(races[i].date, races[i].startTime)) return i;
    }
    return null;
  }, [nextRaceIndex, races]);

  // Observe container width changes (e.g. shelf open/close)
  useEffect(() => {
    const el = containerRef.current as any;
    if (!el || typeof ResizeObserver === 'undefined') return;

    // Get the underlying DOM node from React Native web View
    const domNode: HTMLElement | undefined =
      el instanceof HTMLElement ? el : el?.getNode?.() ?? el;
    if (!domNode || !(domNode instanceof HTMLElement)) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(domNode);
    return () => observer.disconnect();
  }, []);

  // Recalculate card dimensions when container width or window height changes
  useEffect(() => {
    const baseDimensions = calculateCardDimensions(containerWidth, window.innerHeight);
    // Override cardWidth with web-specific calculation for wider cards on larger screens
    const webCardWidth = calculateWebCardWidth(containerWidth);
    setDimensions({
      ...baseDimensions,
      cardWidth: webCardWidth,
      // Recalculate horizontal snap interval with new width
      horizontalSnapInterval: webCardWidth + HORIZONTAL_CARD_GAP,
      // Recalculate padding to center the wider card
      contentPaddingLeft: Math.round((containerWidth - webCardWidth) / 2),
    });
  }, [containerWidth]);

  // Update dimensions on window resize (for height changes)
  useEffect(() => {
    const handleResize = () => {
      const baseDimensions = calculateCardDimensions(containerWidth, window.innerHeight);
      const webCardWidth = calculateWebCardWidth(containerWidth);
      setDimensions({
        ...baseDimensions,
        cardWidth: webCardWidth,
        horizontalSnapInterval: webCardWidth + HORIZONTAL_CARD_GAP,
        contentPaddingLeft: Math.round((containerWidth - webCardWidth) / 2),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerWidth]);

  // Calculate full height card dimensions
  const cardHeight = useMemo(() => {
    return dimensions.screenHeight - dimensions.contentPaddingTop * 2;
  }, [dimensions]);

  // Convert races to TimeAxisRace format for Tufte-inspired time axis
  const timeAxisRaces: TimeAxisRace[] = useMemo(() => {
    return races.map((race) => ({
      id: race.id,
      date: race.start_date || race.date || new Date().toISOString(),
      raceType: (race.race_type as 'fleet' | 'distance' | 'match' | 'team') || 'fleet',
      seriesName: race.series_name || (race as any).metadata?.series_name,
      name: race.name,
      interestSlug: String((race as any)?.metadata?.interest_slug || ''),
      metadata: (race as any)?.metadata,
    }));
  }, [races]);

  // ==========================================================================
  // SNAP OFFSETS
  // ==========================================================================

  // Pre-compute the scroll offset for each card index
  // Account for the NOW divider that appears before the nextRaceIndex card
  const snapOffsets = useMemo(() => {
    const cardStep = dimensions.cardWidth + HORIZONTAL_CARD_GAP;
    const dividerExtra = NOW_DIVIDER_WIDTH + HORIZONTAL_CARD_GAP; // divider width + its gap
    return races.map((_, i) => {
      let offset = i * cardStep;
      // If there's a NOW divider and this card is at or after it, shift by divider width
      if (nextRaceIndex != null && i >= nextRaceIndex) {
        offset += dividerExtra;
      }
      return offset;
    });
  }, [races, dimensions.cardWidth, nextRaceIndex]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const goToRace = useCallback(
    (index: number, animated = true) => {
      const clampedIndex = Math.max(0, Math.min(index, races.length - 1));
      const offset = snapOffsets[clampedIndex] ?? 0;

      horizontalScrollRef.current?.scrollTo({
        x: offset,
        animated,
      });

      setCurrentRaceIndex(clampedIndex);

      if (onRaceChange && races[clampedIndex]) {
        onRaceChange(clampedIndex, races[clampedIndex]);
      }
    },
    [races, snapOffsets, onRaceChange]
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

  // Scroll to initial race on mount (e.g., next upcoming race)
  const hasInitialScrolled = useRef(false);
  useEffect(() => {
    if (hasInitialScrolled.current) return;
    if (initialRaceIndex >= 0 && initialRaceIndex < races.length && snapOffsets.length > 0) {
      hasInitialScrolled.current = true;
      if (initialRaceIndex === 0) return; // Already at 0, no scroll needed
      // Use requestAnimationFrame to ensure ScrollView is laid out before scrolling
      requestAnimationFrame(() => {
        horizontalScrollRef.current?.scrollTo({
          x: snapOffsets[initialRaceIndex] ?? 0,
          animated: false,
        });
      });
    }
  }, [initialRaceIndex, races.length, snapOffsets]);

  // Respond to initialRaceIndex changes from parent (e.g., "upcoming" button,
  // or data loading that shifts the target race to its real index)
  useEffect(() => {
    if (!hasInitialScrolled.current) return;
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
      // Find the closest snap offset to determine current race index
      let newIndex = 0;
      let minDist = Infinity;
      for (let i = 0; i < snapOffsets.length; i++) {
        const dist = Math.abs(offsetX - snapOffsets[i]);
        if (dist < minDist) {
          minDist = dist;
          newIndex = i;
        }
      }

      if (newIndex !== currentRaceIndex && newIndex >= 0 && newIndex < races.length) {
        setCurrentRaceIndex(newIndex);

        if (onRaceChange && races[newIndex]) {
          onRaceChange(newIndex, races[newIndex]);
        }
      }
    },
    [snapOffsets, currentRaceIndex, races, onRaceChange]
  );

  // ==========================================================================
  // RENDER CARD
  // ==========================================================================

  const renderCard = useCallback(
    (race: CardRaceData, raceIndex: number) => {
      const isActive = raceIndex === currentRaceIndex;
      const isNextRace = nextRaceIndex != null && raceIndex === nextRaceIndex;
      const isLastDone = lastDoneIndex != null && raceIndex === lastDoneIndex;


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
        <View
          style={[
            styles.card,
            {
              width: dimensions.cardWidth,
              height: cardHeight,
              borderRadius: CARD_BORDER_RADIUS,
            },
            isLastDone && styles.cardLastDone,
          ]}
        >
          {/* NOW bar is rendered as a standalone separator between cards */}
          {isLastDone && !isActive ? (
            <View style={styles.badgeDone}>
              <View style={styles.badgeDotDone} />
              <Text style={styles.badgeTextDone}>LAST DONE</Text>
            </View>
          ) : null}
          <CardWidthContext.Provider value={{ cardWidth: dimensions.cardWidth }}>
            {renderCardContent(
            race,
            'race_summary',
            isActive,
            canManage,
            handleEdit,
            handleDelete,
            handleUploadDocument,
            handleRaceComplete,
            handleOpenPostRaceInterview,
            userId,
            undefined, // onDismiss - not used in web
            raceIndex,
            races.length,
            // Timeline navigation props (for compact axis inside card)
            timeAxisRaces,
            currentRaceIndex,
            goToRace,
            nextRaceIndex ?? undefined,
            // Card press handler for navigation (clicking partially visible cards)
            handleCardPress,
            // Refetch trigger for AfterRaceContent
            refetchTrigger
          )}
          </CardWidthContext.Provider>
        </View>
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
      races.length,
      refetchTrigger,
      nextRaceIndex,
      lastDoneIndex,
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
    <View
      ref={containerRef}
      style={[styles.container, style]}
      testID={testID}
      // @ts-ignore - web-only mouse handlers
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        style={styles.horizontalScroll}
        contentContainerStyle={[
          styles.horizontalContent,
          {
            paddingHorizontal: dimensions.contentPaddingLeft,
            paddingTop: topInset || 40,
          },
        ]}
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        onScroll={handleHorizontalScroll}
        scrollEventThrottle={16}
      >
        {races.map((race, raceIndex) => {
          // DEBUG: Log each race being rendered
          if (typeof window !== 'undefined' && (window as any).__PERIOD_DEBUG__?.enabled) {
            (window as any).__PERIOD_DEBUG__.log('CardGrid.web.renderCard', raceIndex, { raceId: race.id, raceName: race.name, raceIndex });
          }
          const isNextRace = nextRaceIndex != null && raceIndex === nextRaceIndex;
          return (
            <React.Fragment key={race.id}>
              {/* NOW divider — standalone separator before the next step */}
              {isNextRace && (
                <View style={styles.nowDivider}>
                  <View style={styles.nowDividerLine} />
                  <View style={styles.nowDividerLabel}>
                    <Text style={styles.nowDividerText}>NOW</Text>
                  </View>
                  <View style={styles.nowDividerLine} />
                </View>
              )}
              {renderCard(race, raceIndex)}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* Navigation Arrows - appear on hover */}
      {isHovering && showLeftArrow && (
        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowLeft]}
          onPress={() => goToRace(currentRaceIndex - 1)}
          accessibilityRole="button"
          accessibilityLabel="Previous race"
        >
          <ChevronLeft size={32} color={IOS_COLORS.blue} />
        </TouchableOpacity>
      )}
      {isHovering && showRightArrow && (
        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowRight]}
          onPress={() => goToRace(currentRaceIndex + 1)}
          accessibilityRole="button"
          accessibilityLabel="Next race"
        >
          <ChevronRight size={32} color={IOS_COLORS.blue} />
        </TouchableOpacity>
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
    // paddingTop is applied dynamically via topInset prop
  },
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    overflow: 'hidden',
    // @ts-ignore - Web-only property
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  nowDivider: {
    width: NOW_DIVIDER_WIDTH,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 6,
  },
  nowDividerLine: {
    flex: 1,
    width: 2,
    backgroundColor: IOS_COLORS.green,
    borderRadius: 1,
    opacity: 0.4,
  },
  nowDividerLabel: {
    backgroundColor: IOS_COLORS.green,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nowDividerText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FFFFFF',
  },
  cardLastDone: {
    borderWidth: 2,
    borderColor: 'rgba(107, 114, 128, 0.55)',
  },
  badgeDone: {
    position: 'absolute',
    top: 8,
    right: 40,
    zIndex: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
    borderColor: 'rgba(107, 114, 128, 0.35)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeDotDone: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#6B7280',
  },
  badgeTextDone: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#4B5563',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    // @ts-ignore - web-only
    transform: 'translateY(-50%)',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    // @ts-ignore - web-only
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    // @ts-ignore - web-only
    cursor: 'pointer',
    zIndex: 10,
  },
  navArrowLeft: {
    left: 16,
  },
  navArrowRight: {
    right: 16,
  },
});

export default CardGrid;
