/**
 * Real Races Carousel
 *
 * Displays a horizontal carousel of user's actual races.
 * Supports two modes:
 * - Legacy: ScrollView-based carousel with navigation arrows
 * - Timeline: RaceTimelineLayout with vertical detail card pager
 */

import { IOS_COLORS } from '@/components/cards/constants';
import { AppleRaceCard } from '@/components/races/AppleRaceCard';
import { AppleStyleRaceCard } from '@/components/races/AppleStyleRaceCard';
import { CarouselNavArrows } from '@/components/races/CarouselNavArrows';
import { DistanceRaceCard } from '@/components/races/DistanceRaceCard';
import { PracticeTimelineCard } from '@/components/races/PracticeTimelineCard';
import { RaceCardEnhanced } from '@/components/races/RaceCardEnhanced';
import { RaceDetailZone } from '@/components/races/RaceDetailZone';
import { RaceTimelineLayout } from '@/components/races/RaceTimelineLayout';
import { TimelineIndicators } from '@/components/races/TimelineIndicators';
import { TourStep } from '@/components/onboarding/TourStep';
import {
  createDetailCardsForRace,
  renderDetailCardByType,
  type RaceDetailCardData,
  type RenderDetailCardOptions,
} from '@/components/races/detail-cards';
import type { DetailCardType } from '@/constants/navigationAnimations';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import type { RaceDocumentWithDetails } from '@/services/RaceDocumentService';
import type { PracticeSession } from '@/types/practice';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, View } from 'react-native';

// Layout constants
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 140 : 120; // Including safe area, nav header, and venue display
const TAB_BAR_HEIGHT = 80; // Bottom tab bar
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - TAB_BAR_HEIGHT;

const HERO_ZONE_HEIGHT = 280;
const MOBILE_CENTERING_PADDING = 16;
const MOBILE_CARD_GAP = 12;
const MOBILE_CARD_WIDTH = Platform.OS === 'web' ? 390 : 320;
const MOBILE_SNAP_INTERVAL = MOBILE_CARD_WIDTH + MOBILE_CARD_GAP;
const RACE_CARD_HEIGHT = Math.floor(AVAILABLE_HEIGHT * 0.97); // ~97% of available screen space
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

// Timeline item type for combined races and practice sessions
export interface TimelineItem {
  type: 'race' | 'practice';
  data: any;
  date: Date;
}

export interface RealRacesCarouselProps {
  /** Array of race data */
  races: any[];
  /** Array of practice sessions to display in timeline */
  practiceSessions?: PracticeSession[];
  /** Callback when a practice session is selected */
  onSelectPractice?: (id: string) => void;
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
  /** Race ID currently being deleted (for loading overlay) */
  deletingRaceId?: string | null;
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
  practiceSessions,
  onSelectPractice,
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
  deletingRaceId,
  useTimelineLayout = false,
  onDetailCardChange,
  useAppleStyle = false,
  useRefinedStyle = false,
  onAddDebrief,
  pastRaceIds,
}: RealRacesCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);

  // Combine races and practice sessions into a single timeline
  // Prioritize upcoming items first, then show past items
  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: (TimelineItem & { hasDate: boolean })[] = [];
    const now = new Date();

    // Add races
    races.forEach((race) => {
      const rawDate = race.date || race.start_date;
      // Track whether race has a valid date - races without dates should be treated as past
      const hasDate = !!rawDate;
      const raceDate = rawDate || new Date(0).toISOString(); // Use epoch for missing dates
      items.push({
        type: 'race',
        data: race,
        date: new Date(raceDate),
        hasDate,
      });
    });

    // Add practice sessions
    if (practiceSessions) {
      practiceSessions.forEach((session) => {
        items.push({
          type: 'practice',
          data: session,
          date: new Date(session.scheduled_date),
          hasDate: true,
        });
      });
    }

    // Separate upcoming and past items
    // Consider an item "upcoming" if it has a valid date AND hasn't ended yet (start + 3 hours buffer)
    // Items without dates are always treated as past
    const upcoming = items.filter((item) => {
      if (!item.hasDate) return false;
      const endEstimate = new Date(item.date.getTime() + 3 * 60 * 60 * 1000);
      return endEstimate > now;
    });
    const past = items.filter((item) => {
      if (!item.hasDate) return true;
      const endEstimate = new Date(item.date.getTime() + 3 * 60 * 60 * 1000);
      return endEstimate <= now;
    });

    // Sort upcoming by date ascending (nearest first)
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Sort past by date descending (most recent first)
    past.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Return upcoming first, then past
    return [...upcoming, ...past];
  }, [races, practiceSessions]);

  // Find selected race index for timeline layout (searches in combined timeline)
  const selectedRaceIndex = useMemo(() => {
    if (!selectedRaceId) return 0;
    const index = timelineItems.findIndex(
      (item) => item.type === 'race' && item.data.id === selectedRaceId
    );
    return index >= 0 ? index : 0;
  }, [timelineItems, selectedRaceId]);


  // Find next race index for "jump to next" navigation (in combined timeline)
  const nextRaceIndex = useMemo(() => {
    if (!nextRace?.id) return undefined;
    const index = timelineItems.findIndex(
      (item) => item.type === 'race' && item.data.id === nextRace.id
    );
    return index >= 0 ? index : undefined;
  }, [timelineItems, nextRace?.id]);

  // Determine if selected race is completed (past)
  const selectedRaceStatus = useMemo(() => {
    if (!selectedRaceData) return 'upcoming';
    const isNextRace = !!(nextRace?.id && selectedRaceData.id === nextRace.id);
    return getRaceStatus(selectedRaceData.date || new Date().toISOString(), isNextRace);
  }, [selectedRaceData, nextRace?.id, getRaceStatus]);

  // Use pastRaceIds if available (most reliable), otherwise check race from array or selectedRaceStatus
  const isSelectedRaceCompleted = useMemo(() => {
    // Primary: Use pastRaceIds (computed from liveRaces, always available)
    if (pastRaceIds && selectedRaceId && pastRaceIds.includes(selectedRaceId)) {
      return true;
    }

    // Secondary: Check the race directly from the races array (works even if selectedRaceData not loaded)
    const selectedRace = races[selectedRaceIndex];
    if (selectedRace) {
      const raceDate = selectedRace?.date || selectedRace?.start_date;
      const isNextRace = !!(nextRace?.id && selectedRace?.id === nextRace.id);
      const status = getRaceStatus(raceDate || new Date().toISOString(), isNextRace);
      if (status === 'past') {
        return true;
      }
    }

    // Final fallback: Use selectedRaceStatus (depends on selectedRaceData being loaded)
    return selectedRaceStatus === 'past';
  }, [pastRaceIds, selectedRaceId, races, selectedRaceIndex, nextRace?.id, getRaceStatus, selectedRaceStatus]);

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
    if (!useTimelineLayout) {
      return undefined;
    }

    // Use selectedRaceData if available, otherwise fall back to race from races array
    const selectedRace = races[selectedRaceIndex];
    const raceData = selectedRaceData || selectedRace;

    // Need at least basic race data to create cards
    if (!raceData?.id) {
      return undefined;
    }

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
      // Venue and date for forecast fetching (Tufte sparklines in ConditionsDetailCard)
      // Check both enriched format (venueCoordinates) and raw Supabase format (metadata.venue_coordinates)
      venue: (() => {
        const coords = raceData.venueCoordinates || raceData.metadata?.venue_coordinates;
        if (!coords?.lat || !coords?.lng) {
          return undefined;
        }
        return {
          id: raceData.id,
          name: raceData.venue || raceData.metadata?.venue || 'Race Venue',
          coordinates: [coords.lng, coords.lat],
          region: 'unknown',
          country: 'unknown',
        };
      })(),
      date: raceData.date || raceData.start_date,
    };

    return createDetailCardsForRace(cardInput);
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

  // Handle timeline item change (race or practice)
  const handleTimelineItemChange = useCallback(
    (index: number) => {
      const item = timelineItems[index];
      if (!item) return;

      if (item.type === 'race') {
        const race = item.data;
        if (race?.id && race.id !== selectedRaceId) {
          onSelectRace(race.id);
        }
      } else if (item.type === 'practice') {
        const session = item.data as PracticeSession;
        onSelectPractice?.(session.id);
      }
    },
    [timelineItems, selectedRaceId, onSelectRace, onSelectPractice]
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

  // Render function for timeline items (handles both races and practice sessions)
  const renderTimelineItem = (item: TimelineItem, index: number) => {
    // Handle practice sessions
    if (item.type === 'practice') {
      const session = item.data as PracticeSession;
      return (
        <PracticeTimelineCard
          key={`practice-${session.id}`}
          session={session}
          isSelected={false} // Practice sessions don't have detail cards yet
          onPress={() => onSelectPractice?.(session.id)}
          cardWidth={MOBILE_CARD_WIDTH}
        />
      );
    }

    // Handle races
    const race = item.data;
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
          isDeleting={deletingRaceId === race.id}
          isSample={!!race.metadata?.is_sample}
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
          cardHeight={RACE_CARD_HEIGHT}
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
        cardHeight={RACE_CARD_HEIGHT}
        fleetName={race.fleet?.name}
        canManage={canManage}
        onEdit={canManage && onEditRace ? () => onEditRace(race.id) : undefined}
        onDelete={canManage && onDeleteRace ? () => onDeleteRace(race.id, race.name) : undefined}
      />
    );
  };

  // Legacy render function for race-only rendering (used in ScrollView mode)
  const renderRaceCard = (race: any, index: number) => {
    return renderTimelineItem({ type: 'race', data: race, date: new Date(race.date || race.start_date || new Date()) }, index);
  };

  // Timeline Layout Mode - uses RaceTimelineLayout with DetailCardPager
  // Now supports both races and practice sessions in a combined timeline
  if (useTimelineLayout) {
    const canGoLeft = selectedRaceIndex > 0;
    const canGoRight = selectedRaceIndex < timelineItems.length - 1;

    const handleNavLeft = () => {
      if (canGoLeft) {
        handleTimelineItemChange(selectedRaceIndex - 1);
      }
    };

    const handleNavRight = () => {
      if (canGoRight) {
        handleTimelineItemChange(selectedRaceIndex + 1);
      }
    };

    return (
      <TourStep step="race_cards_navigation" position="bottom">
        <TourStep step="phase_tabs" position="bottom">
          <View style={timelineNavStyles.container}>
            <RaceTimelineLayout
              races={timelineItems}
              selectedRaceIndex={selectedRaceIndex}
              onRaceChange={handleTimelineItemChange}
              renderRaceCard={(item, index) => renderTimelineItem(item as TimelineItem, index)}
              renderDetailCard={renderDetailCard}
              detailCards={detailCards as any}
              onDetailCardChange={handleDetailCardChange}
              useCardPagerMode={true}
              enableHaptics={Platform.OS !== 'web'}
              cardWidth={MOBILE_CARD_WIDTH}
              nextRaceIndex={nextRaceIndex}
            />
          </View>
        </TourStep>
      </TourStep>
    );
  }

  // Legacy Layout Mode - ScrollView-based carousel
  return (
    <>
      {/* Hero Zone - Fixed height race card timeline */}
      <TourStep step="race_cards_navigation" position="bottom">
        <TourStep step="phase_tabs" position="bottom">
          <View style={{ height: HERO_ZONE_HEIGHT }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false}
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
        </TourStep>
      </TourStep>

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

// Styles for timeline layout container
const timelineNavStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RealRacesCarousel;
