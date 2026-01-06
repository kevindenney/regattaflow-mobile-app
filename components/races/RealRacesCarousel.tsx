/**
 * Real Races Carousel
 *
 * Displays a horizontal carousel of user's actual races.
 * Supports two modes:
 * - Legacy: ScrollView-based carousel with navigation arrows
 * - Timeline: RaceTimelineLayout with vertical detail card pager
 */

// Debug version marker - helps verify bundle updates
console.log('[RealRacesCarousel] MODULE LOADED - v2 with status detection');

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppleRaceCard } from '@/components/races/AppleRaceCard';
import { AppleStyleRaceCard } from '@/components/races/AppleStyleRaceCard';
import { DistanceRaceCard } from '@/components/races/DistanceRaceCard';
import { RaceCardEnhanced } from '@/components/races/RaceCardEnhanced';
import { TimelineIndicators } from '@/components/races/TimelineIndicators';
import { CarouselNavArrows } from '@/components/races/CarouselNavArrows';
import { RaceDetailZone } from '@/components/races/RaceDetailZone';
import { RaceTimelineLayout } from '@/components/races/RaceTimelineLayout';
import {
  createDetailCardsForRace,
  renderDetailCardByType,
  type RaceDetailCardData,
  type RenderDetailCardOptions,
} from '@/components/races/detail-cards';
import type { DetailCardType } from '@/constants/navigationAnimations';
import type { RaceDocumentWithDetails } from '@/services/RaceDocumentService';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import { IOS_COLORS } from '@/components/cards/constants';

// Layout constants
const HERO_ZONE_HEIGHT = 280;
const MOBILE_CENTERING_PADDING = 16;
const MOBILE_CARD_GAP = 12;
const MOBILE_CARD_WIDTH = 320;
const MOBILE_SNAP_INTERVAL = MOBILE_CARD_WIDTH + MOBILE_CARD_GAP;
const RACE_CARD_HEIGHT = 240;
const DETAIL_ZONE_HEIGHT = 400;

type RaceStatus = 'next' | 'future' | 'today' | 'past';

export interface UserRaceResult {
  position?: number;
  points?: number;
  fleetSize?: number;
  status?: string;
  seriesPosition?: number;
  totalRaces?: number;
}

export interface RealRacesCarouselProps {
  /** Array of race data */
  races: any[];
  /** The next upcoming race */
  nextRace: any | null;
  /** Currently selected race ID */
  selectedRaceId: string | null;
  /** Callback when a race is selected */
  onSelectRace: (id: string) => void;
  /** Selected race full data for detail zone */
  selectedRaceData: any | null;
  /** Marks for selected race */
  selectedRaceMarks?: any[];
  /** Documents for selected race */
  raceDocuments?: RaceDocumentWithDetails[];
  /** Map of race ID to user results */
  userRaceResults: Map<string, UserRaceResult>;
  /** Current user ID for edit/delete permissions */
  userId?: string;
  /** Whether there's an active race */
  hasActiveRace?: boolean;
  /** Whether on mobile native platform */
  isMobileNative?: boolean;
  /** Function to get race status */
  getRaceStatus: (date: string, isNextRace: boolean, startTime?: string) => RaceStatus;
  /** Callback when edit is requested */
  onEditRace?: (raceId: string) => void;
  /** Callback when delete is requested */
  onDeleteRace?: (raceId: string, raceName: string) => void;
  /** Use new timeline layout with vertical card pager (default: false) */
  useTimelineLayout?: boolean;
  /** Callback when detail card changes (timeline layout mode) */
  onDetailCardChange?: (cardType: DetailCardType) => void;
  /** Use Apple-style card design (default: false) */
  useAppleStyle?: boolean;
  /** Use refined Apple-style card design (default: false, takes precedence over useAppleStyle) */
  useRefinedStyle?: boolean;
  /** Callback when add debrief is requested (for completed races without analysis) */
  onAddDebrief?: (raceId: string) => void;
  /** Array of race IDs that are past/completed (more reliable than date calculation) */
  pastRaceIds?: string[];
}

/**
 * Real Races Carousel Component
 */
export function RealRacesCarousel({
  races,
  nextRace,
  selectedRaceId,
  onSelectRace,
  selectedRaceData,
  selectedRaceMarks,
  raceDocuments,
  userRaceResults,
  userId,
  hasActiveRace = false,
  isMobileNative = false,
  getRaceStatus,
  onEditRace,
  onDeleteRace,
  useTimelineLayout = false,
  onDetailCardChange,
  useAppleStyle = false,
  useRefinedStyle = false,
  onAddDebrief,
  pastRaceIds,
}: RealRacesCarouselProps) {
  // Debug: Component props (unconditional for debugging)
  console.log('[RealRacesCarousel] RENDER - props:', {
    useTimelineLayout,
    selectedRaceId,
    hasSelectedRaceData: !!selectedRaceData,
    selectedRaceDataName: selectedRaceData?.name,
    racesCount: races?.length,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);

  // Find selected race index for timeline layout
  const selectedRaceIndex = useMemo(() => {
    if (!selectedRaceId) return 0;
    const index = races.findIndex((r) => r.id === selectedRaceId);
    return index >= 0 ? index : 0;
  }, [races, selectedRaceId]);

  // Debug: Log race data to identify duplicates
  if (__DEV__ && races.length > 0) {
    const raceIds = races.map(r => r.id);
    const uniqueIds = new Set(raceIds);
    console.log(`[RealRacesCarousel] Races: ${races.length} total, ${uniqueIds.size} unique`);
    if (uniqueIds.size !== races.length) {
      console.warn('[RealRacesCarousel] DUPLICATE RACES DETECTED:', {
        total: races.length,
        unique: uniqueIds.size,
        ids: raceIds,
      });
    }
  }

  // Find next race index for "jump to next" navigation
  const nextRaceIndex = useMemo(() => {
    if (!nextRace?.id) return undefined;
    const index = races.findIndex((r) => r.id === nextRace.id);
    return index >= 0 ? index : undefined;
  }, [races, nextRace?.id]);

  // Determine if selected race is completed (past)
  const selectedRaceStatus = useMemo(() => {
    if (!selectedRaceData) return 'upcoming';
    const isNextRace = !!(nextRace?.id && selectedRaceData.id === nextRace.id);
    const status = getRaceStatus(selectedRaceData.date || new Date().toISOString(), isNextRace);
    if (__DEV__) {
      console.log('[RealRacesCarousel] Status detection:', {
        raceId: selectedRaceData.id,
        raceName: selectedRaceData.name,
        raceDate: selectedRaceData.date,
        isNextRace,
        computedStatus: status,
      });
    }
    return status;
  }, [selectedRaceData, nextRace?.id, getRaceStatus]);

  // Use pastRaceIds if available (most reliable), otherwise check race from array or selectedRaceStatus
  const isSelectedRaceCompleted = useMemo(() => {
    // Debug logging - unconditional
    const selectedRace = races[selectedRaceIndex];
    const raceDate = selectedRace?.date || selectedRace?.start_date;
    const isNextRace = !!(nextRace?.id && selectedRace?.id === nextRace.id);
    const statusFromArray = selectedRace ? getRaceStatus(raceDate || new Date().toISOString(), isNextRace) : 'unknown';

    console.log('[isSelectedRaceCompleted] DEBUG:', {
      pastRaceIdsLength: pastRaceIds?.length,
      selectedRaceId,
      selectedRaceIndex,
      selectedRaceName: selectedRace?.name,
      selectedRaceDate: raceDate,
      inPastRaceIds: pastRaceIds?.includes(selectedRaceId || ''),
      statusFromArray,
      selectedRaceStatus,
    });

    // Primary: Use pastRaceIds (computed from liveRaces, always available)
    if (pastRaceIds && selectedRaceId && pastRaceIds.includes(selectedRaceId)) {
      console.log('[isSelectedRaceCompleted] Returning TRUE via pastRaceIds');
      return true;
    }

    // Secondary: Check the race directly from the races array (works even if selectedRaceData not loaded)
    if (selectedRace) {
      const status = getRaceStatus(raceDate || new Date().toISOString(), isNextRace);
      if (status === 'past') {
        console.log('[isSelectedRaceCompleted] Returning TRUE via races array check');
        return true;
      }
    }

    // Final fallback: Use selectedRaceStatus (depends on selectedRaceData being loaded)
    console.log('[isSelectedRaceCompleted] Returning', selectedRaceStatus === 'past', 'via selectedRaceStatus fallback');
    return selectedRaceStatus === 'past';
  }, [pastRaceIds, selectedRaceId, races, selectedRaceIndex, nextRace?.id, getRaceStatus, selectedRaceStatus]);

  if (__DEV__ && selectedRaceData) {
    console.log('[RealRacesCarousel] isSelectedRaceCompleted:', isSelectedRaceCompleted, 'status:', selectedRaceStatus, 'pastRaceIds:', pastRaceIds?.length, 'selectedRaceId:', selectedRaceId, 'inPastRaceIds:', pastRaceIds?.includes(selectedRaceId || ''));
  }

  // Get user result for selected race (if completed)
  const selectedRaceResult = useMemo(() => {
    if (!isSelectedRaceCompleted || !selectedRaceData?.id) return undefined;
    const result = userRaceResults.get(selectedRaceData.id);
    if (!result) return undefined;
    return {
      position: result.position ?? 0,
      points: result.points ?? 0,
      fleetSize: result.fleetSize ?? 0,
      status: result.status as 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'ret' | undefined,
      seriesPosition: result.seriesPosition,
      totalRaces: result.totalRaces,
    };
  }, [isSelectedRaceCompleted, selectedRaceData?.id, userRaceResults]);

  // Fetch analysis data for completed races
  const { analysisData } = useRaceAnalysisData(
    isSelectedRaceCompleted ? selectedRaceData?.id : null,
    userId
  );

  // Create detail cards for the selected race (timeline mode)
  const detailCards = useMemo(() => {
    if (!useTimelineLayout) return undefined;

    // Use selectedRaceData if available, otherwise fall back to race from races array
    const selectedRace = races[selectedRaceIndex];
    const raceData = selectedRaceData || selectedRace;

    // Need at least basic race data to create cards
    if (!raceData?.id) return undefined;

    const cardInput = {
      id: raceData.id,
      name: raceData.name,
      wind: raceData.wind || selectedRaceData?.wind,
      tide: raceData.tide || selectedRaceData?.tide,
      courseName: selectedRaceData?.metadata?.selected_course_name || raceData.metadata?.selected_course_name,
      courseType: selectedRaceData?.race_type || raceData.race_type,
      marks: selectedRaceMarks,
      vhfChannel: selectedRaceData?.vhf_channel || selectedRaceData?.critical_details?.vhf_channel || raceData.vhf_channel,
      fleetName: selectedRaceData?.fleet?.name || raceData.fleet?.name,
      // Race status for completed/upcoming card selection
      status: isSelectedRaceCompleted ? 'completed' : 'upcoming',
      // Result data for completed races
      result: selectedRaceResult,
      // Analysis data for completed races
      hasDebrief: analysisData?.hasDebrief,
      analysisId: analysisData?.analysisId,
      analysisSummary: analysisData?.analysisSummary,
      analysisInsights: analysisData?.analysisInsights,
      analysisConfidence: analysisData?.analysisConfidence,
      // Learning data for completed races
      keyLearning: analysisData?.keyLearning,
      focusNextRace: analysisData?.focusNextRace,
    };

    if (__DEV__) {
      console.log('[RealRacesCarousel] createDetailCardsForRace input:', {
        id: cardInput.id,
        status: cardInput.status,
        isSelectedRaceCompleted,
        hasResult: !!cardInput.result,
        hasDebrief: cardInput.hasDebrief,
      });
    }

    const cards = createDetailCardsForRace(cardInput);

    if (__DEV__) {
      console.log('[RealRacesCarousel] createDetailCardsForRace output:', cards.map(c => c.type));
    }

    return cards;
  }, [
    useTimelineLayout,
    races,
    selectedRaceIndex,
    selectedRaceData,
    selectedRaceMarks,
    isSelectedRaceCompleted,
    selectedRaceResult,
    analysisData,
  ]);

  // Handle race change in timeline layout
  const handleRaceChange = useCallback(
    (index: number) => {
      const race = races[index];
      if (race?.id && race.id !== selectedRaceId) {
        onSelectRace(race.id);
      }
    },
    [races, selectedRaceId, onSelectRace]
  );

  // Handle detail card change in timeline layout
  const handleDetailCardChange = useCallback(
    (index: number, cardType: DetailCardType) => {
      onDetailCardChange?.(cardType);
    },
    [onDetailCardChange]
  );

  // Options for post-race card rendering
  const detailCardOptions: RenderDetailCardOptions = useMemo(
    () => ({
      onAddDebrief: onAddDebrief && selectedRaceData?.id
        ? () => onAddDebrief(selectedRaceData.id)
        : undefined,
      currentUserId: userId,
    }),
    [onAddDebrief, selectedRaceData?.id, userId]
  );

  // Render detail card for timeline layout
  // The expansionOptions come from DetailCardPager and contain isExpanded/onToggle
  const renderDetailCard = useCallback(
    (card: RaceDetailCardData, index: number, isActive: boolean, expansionOptions?: { isExpanded: boolean; onToggle: () => void }) => {
      // Merge expansion options with other detail card options
      const mergedOptions: RenderDetailCardOptions = {
        ...detailCardOptions,
        isExpanded: expansionOptions?.isExpanded,
        onToggle: expansionOptions?.onToggle,
      };
      return renderDetailCardByType(card, index, isActive, onDetailCardChange, mergedOptions);
    },
    [onDetailCardChange, detailCardOptions]
  );

  /**
   * Check if race is a distance race based on type or name patterns
   */
  const isDistanceRace = (race: any): boolean => {
    return race.race_type === 'distance' || (
      race.name && (
        /\baround\b/i.test(race.name) ||
        /\bround\s+the\b/i.test(race.name) ||
        /circumnavigation/i.test(race.name) ||
        /\boffshore\b/i.test(race.name) ||
        /distance\s*race/i.test(race.name) ||
        /passage\s*race/i.test(race.name) ||
        /point.*to.*point/i.test(race.name) ||
        /ocean\s*race/i.test(race.name) ||
        /coastal\s*race/i.test(race.name)
      )
    );
  };

  const renderRaceCard = (race: any, index: number) => {
    const isNextRace = !!(nextRace?.id && race.id === nextRace.id);
    const raceStatus = getRaceStatus(race.date || new Date().toISOString(), isNextRace);

    // Get results for past races
    const raceResult = raceStatus === 'past' && race.id ? userRaceResults.get(race.id) : undefined;

    // Refined Apple-style card (takes precedence)
    if (useRefinedStyle && !isDistanceRace(race)) {
      const refinedStatus: 'past' | 'next' | 'future' =
        raceStatus === 'past' ? 'past' :
        raceStatus === 'next' || raceStatus === 'today' ? 'next' : 'future';

      const canManage = race.created_by === userId;
      return (
        <AppleStyleRaceCard
          key={race.id || index}
          id={race.id}
          name={race.name || race.title || `Race ${index + 1}`}
          venue={race.venue || race.venue_name || race.location || 'Unknown Venue'}
          date={race.date || race.start_date || new Date().toISOString()}
          startTime={race.startTime || race.start_time || '10:00'}
          raceType={race.race_type || 'fleet'}
          raceStatus={refinedStatus}
          wind={race.wind}
          tide={race.tide}
          vhfChannel={race.vhf_channel || race.critical_details?.vhf_channel}
          results={raceResult ? {
            position: raceResult.position ?? 0,
            fleetSize: raceResult.fleetSize ?? 0,
            points: raceResult.points,
          } : undefined}
          onPress={() => onSelectRace(race.id)}
          cardWidth={MOBILE_CARD_WIDTH}
          cardHeight={RACE_CARD_HEIGHT}
          onEdit={canManage && onEditRace ? () => onEditRace(race.id) : undefined}
          onDelete={canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined}
        />
      );
    }

    // Apple-style card (for fleet races when enabled)
    if (useAppleStyle && !isDistanceRace(race)) {
      // Map race status to AppleRaceCard format
      const appleStatus: 'past' | 'next' | 'future' =
        raceStatus === 'past' ? 'past' :
        raceStatus === 'next' || raceStatus === 'today' ? 'next' : 'future';

      const canManage = race.created_by === userId;
      return (
        <AppleRaceCard
          key={race.id || index}
          id={race.id}
          name={race.name || race.title || `Race ${index + 1}`}
          venue={race.venue || race.venue_name || race.location || 'Unknown Venue'}
          clubName={race.club?.name || race.fleet?.club?.name}
          date={race.date || race.start_date || new Date().toISOString()}
          startTime={race.startTime || race.start_time || '10:00'}
          wind={race.wind}
          tide={race.tide}
          vhfChannel={race.vhf_channel || race.critical_details?.vhf_channel}
          raceStatus={appleStatus}
          results={raceResult ? {
            position: raceResult.position ?? 0,
            fleetSize: raceResult.fleetSize ?? 0,
            points: raceResult.points,
            status: raceResult.status as any,
          } : undefined}
          onPress={() => onSelectRace(race.id)}
          cardWidth={MOBILE_CARD_WIDTH}
          canManage={canManage}
          onEdit={canManage && onEditRace ? () => onEditRace(race.id) : undefined}
          onDelete={canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined}
        />
      );
    }

    if (isDistanceRace(race)) {
      return (
        <DistanceRaceCard
          key={race.id || index}
          id={race.id}
          name={race.name}
          date={race.date || new Date().toISOString()}
          startTime={race.startTime || '10:00'}
          startVenue={race.venue || 'Unknown Venue'}
          finishVenue={race.start_finish_same_location === false ? race.finish_venue : undefined}
          totalDistanceNm={race.total_distance_nm}
          timeLimitHours={race.time_limit_hours}
          routeWaypoints={race.route_waypoints}
          courseName={race.metadata?.selected_course_name}
          wind={race.wind}
          vhf_channel={race.vhf_channel || race.critical_details?.vhf_channel}
          isPrimary={isNextRace}
          raceStatus={raceStatus}
          isSelected={selectedRaceId === race.id}
          onSelect={() => onSelectRace(race.id)}
          onEdit={race.created_by === userId && onEditRace ? () => onEditRace(race.id) : undefined}
          onDelete={race.created_by === userId && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined}
          isDimmed={hasActiveRace && selectedRaceId !== race.id}
          cardWidth={MOBILE_CARD_WIDTH}
          cardHeight={RACE_CARD_HEIGHT}
        />
      );
    }

    const canManage = race.created_by === userId;
    return (
      <RaceCardEnhanced
        key={race.id || index}
        id={race.id}
        name={race.name || race.title || `Race ${index + 1}`}
        venue={race.venue || race.venue_name || race.location || 'Unknown Venue'}
        date={race.date || race.start_date || new Date().toISOString()}
        startTime={race.startTime || '10:00'}
        courseName={race.metadata?.selected_course_name}
        wind={race.wind}
        tide={race.tide}
        vhf_channel={race.vhf_channel || race.critical_details?.vhf_channel}
        raceStatus={raceStatus}
        isSelected={selectedRaceId === race.id}
        onSelect={() => onSelectRace(race.id)}
        cardWidth={MOBILE_CARD_WIDTH}
        fleetName={race.fleet?.name}
        canManage={canManage}
        onEdit={canManage && onEditRace ? () => onEditRace(race.id) : undefined}
        onDelete={canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined}
      />
    );
  };

  // Timeline Layout Mode - uses RaceTimelineLayout with DetailCardPager
  if (useTimelineLayout) {
    return (
      <RaceTimelineLayout
        races={races}
        selectedRaceIndex={selectedRaceIndex}
        onRaceChange={handleRaceChange}
        renderRaceCard={(race, index) => renderRaceCard(race, index)}
        renderDetailCard={renderDetailCard}
        detailCards={detailCards as any}
        onDetailCardChange={handleDetailCardChange}
        useCardPagerMode={true}
        enableHaptics={Platform.OS !== 'web'}
        cardWidth={MOBILE_CARD_WIDTH}
        nextRaceIndex={nextRaceIndex}
      />
    );
  }

  // Legacy Layout Mode - ScrollView-based carousel
  return (
    <>
      {/* Hero Zone - Fixed height race card timeline */}
      <View style={{ height: HERO_ZONE_HEIGHT }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingLeft: MOBILE_CENTERING_PADDING,
            paddingRight: MOBILE_CENTERING_PADDING,
            paddingVertical: 8,
            gap: MOBILE_CARD_GAP,
          }}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={MOBILE_SNAP_INTERVAL}
          snapToAlignment="start"
          onScroll={(event) => {
            setScrollX(event.nativeEvent.contentOffset.x);
          }}
          onContentSizeChange={(contentWidth) => {
            setScrollContentWidth(contentWidth);
          }}
          onMomentumScrollEnd={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const adjustedOffset = offsetX + MOBILE_CENTERING_PADDING;
            let rawIndex = Math.round(adjustedOffset / MOBILE_SNAP_INTERVAL);
            rawIndex = Math.max(0, Math.min(rawIndex, races.length - 1));

            const targetRace = races[rawIndex];
            if (targetRace?.id && targetRace.id !== selectedRaceId) {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onSelectRace(targetRace.id);
            }
          }}
        >
          {races.map((race, index) => renderRaceCard(race, index))}
        </ScrollView>

        {/* Navigation Arrows - Hidden on mobile */}
        <CarouselNavArrows
          isMobileNative={isMobileNative}
          scrollX={scrollX}
          scrollContentWidth={scrollContentWidth}
          scrollViewRef={scrollViewRef}
        />

        {/* Timeline Indicators (Dots) */}
        <TimelineIndicators
          races={races}
          selectedId={selectedRaceId}
          onSelect={onSelectRace}
          snapInterval={MOBILE_SNAP_INTERVAL}
          scrollViewRef={scrollViewRef}
          activeColor={IOS_COLORS.blue}
          nextRaceIndex={nextRaceIndex}
        />
      </View>

      {/* Detail Zone - Accordion sections for race details */}
      {selectedRaceData && (
        <RaceDetailZone
          height={DETAIL_ZONE_HEIGHT}
          raceData={selectedRaceData}
          marks={selectedRaceMarks}
          documents={raceDocuments}
          userId={userId}
          onEditRace={onEditRace}
          onDeleteRace={onDeleteRace}
        />
      )}
    </>
  );
}

export default RealRacesCarousel;
