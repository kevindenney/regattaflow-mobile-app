/**
 * Real Races Carousel
 *
 * Displays a horizontal carousel of user's actual races.
 * Includes race cards, navigation arrows, and timeline indicators.
 */

import React, { useRef, useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DistanceRaceCard } from '@/components/races/DistanceRaceCard';
import { RaceCardEnhanced } from '@/components/races/RaceCardEnhanced';
import { TimelineIndicators } from '@/components/races/TimelineIndicators';
import { CarouselNavArrows } from '@/components/races/CarouselNavArrows';
import { RaceDetailZone } from '@/components/races/RaceDetailZone';
import type { RaceDocumentWithDetails } from '@/services/RaceDocumentService';

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
}: RealRacesCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);

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
      />
    );
  };

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
          activeColor="#2563EB"
        />
      </View>

      {/* Detail Zone - Accordion sections for race details */}
      {selectedRaceData && (
        <RaceDetailZone
          height={DETAIL_ZONE_HEIGHT}
          raceData={selectedRaceData}
          marks={selectedRaceMarks}
          documents={raceDocuments}
        />
      )}
    </>
  );
}

export default RealRacesCarousel;
