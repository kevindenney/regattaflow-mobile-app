/**
 * Demo Races Carousel
 *
 * Displays a horizontal carousel of demo/mock races for new users
 * who haven't added any races yet. Includes race cards and detail view.
 */

import React, { useRef } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DistanceRaceCard } from '@/components/races/DistanceRaceCard';
import { RaceCardEnhanced } from '@/components/races/RaceCardEnhanced';
import { DemoRaceDetail } from '@/components/races/DemoRaceDetail';
import { TimelineIndicators } from '@/components/races/TimelineIndicators';
import { DemoAddRaceHeader } from '@/components/races/DemoAddRaceHeader';
import { MOCK_RACES } from '@/constants/mockData';

// Layout constants
const HERO_ZONE_HEIGHT = 280;
const MOBILE_CENTERING_PADDING = 16;
const MOBILE_CARD_GAP = 12;
const MOBILE_CARD_WIDTH = 320;
const MOBILE_SNAP_INTERVAL = MOBILE_CARD_WIDTH + MOBILE_CARD_GAP;
const RACE_CARD_HEIGHT = 240;

export interface DemoRacesCarouselProps {
  /** Currently selected demo race ID */
  selectedDemoRaceId: string | null;
  /** Callback when a demo race is selected */
  onSelectDemoRace: (id: string) => void;
  /** The currently selected demo race object */
  selectedDemoRace: typeof MOCK_RACES[0] | null;
  /** Callback when add race is pressed */
  onAddRace: () => void;
  /** Callback to navigate to add race */
  onAddRaceNavigation: () => void;
  /** Callback when logistics section layout changes */
  onLogisticsSectionLayout?: (y: number) => void;
  /** Callback when regulatory section layout changes */
  onRegulatorySectionLayout?: (y: number) => void;
}

/**
 * Demo Races Carousel Component
 */
export function DemoRacesCarousel({
  selectedDemoRaceId,
  onSelectDemoRace,
  selectedDemoRace,
  onAddRace,
  onAddRaceNavigation,
  onLogisticsSectionLayout,
  onRegulatorySectionLayout,
}: DemoRacesCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <>
      {/* Helpful hint + Add button for demo users */}
      <DemoAddRaceHeader onAddRace={onAddRace} />

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
            pointerEvents: 'box-none',
          }}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={MOBILE_SNAP_INTERVAL}
          snapToAlignment="start"
          onMomentumScrollEnd={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const adjustedOffset = offsetX + MOBILE_CENTERING_PADDING;
            let rawIndex = Math.round(adjustedOffset / MOBILE_SNAP_INTERVAL);
            rawIndex = Math.max(0, Math.min(rawIndex, MOCK_RACES.length - 1));

            const targetRace = MOCK_RACES[rawIndex];
            if (targetRace?.id && targetRace.id !== selectedDemoRaceId) {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onSelectDemoRace(targetRace.id);
            }
          }}
        >
          {MOCK_RACES.map((race, index) => {
            const isDistanceRace = race.race_type === 'distance';
            if (isDistanceRace) {
              return (
                <DistanceRaceCard
                  key={race.id}
                  id={race.id}
                  name={race.name}
                  startVenue={race.venue}
                  date={race.date}
                  startTime={race.startTime}
                  wind={race.wind}
                  totalDistanceNm={race.total_distance_nm}
                  vhf_channel={race.critical_details?.vhf_channel}
                  isPrimary={index === 0}
                  isMock={true}
                  isSelected={selectedDemoRaceId === race.id}
                  isDimmed={selectedDemoRaceId !== race.id}
                  onSelect={() => onSelectDemoRace(race.id)}
                  cardWidth={MOBILE_CARD_WIDTH}
                  cardHeight={RACE_CARD_HEIGHT}
                />
              );
            }
            return (
              <RaceCardEnhanced
                key={race.id}
                id={race.id}
                name={race.name}
                venue={race.venue}
                date={race.date}
                startTime={race.startTime}
                wind={race.wind}
                tide={race.tide}
                vhf_channel={race.critical_details?.vhf_channel}
                isSelected={selectedDemoRaceId === race.id}
                onSelect={() => onSelectDemoRace(race.id)}
                cardWidth={MOBILE_CARD_WIDTH}
              />
            );
          })}
        </ScrollView>

        {/* Timeline Indicators (Dots) - Demo Race Navigation */}
        <TimelineIndicators
          races={MOCK_RACES}
          selectedId={selectedDemoRaceId}
          onSelect={(id) => onSelectDemoRace(id)}
          snapInterval={MOBILE_SNAP_INTERVAL}
          scrollViewRef={scrollViewRef}
          activeColor="#7C3AED"
          scrollIndexOffset={1}
        />
      </View>

      {/* Detail Zone - scrolls independently */}
      {selectedDemoRace && (
        <DemoRaceDetail
          race={selectedDemoRace}
          onAddRace={onAddRaceNavigation}
          onLogisticsSectionLayout={onLogisticsSectionLayout}
          onRegulatorySectionLayout={onRegulatorySectionLayout}
        />
      )}
    </>
  );
}

export default DemoRacesCarousel;
