/**
 * Race Detail Demo Page
 *
 * Showcases the complete redesigned race detail experience
 * with all new components integrated
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// New redesigned components
import { EnhancedRaceCard } from '@/components/races';
import {
  RaceDetailMapHero,
  TimingCard,
  WeatherCard,
  TideCard,
  CourseCard,
  CommunicationsCard,
  TacticalPlanCard,
  ContingencyPlansCard,
  RaceDocumentsCard,
  CrewEquipmentCard,
  FleetRacersCard,
} from '@/components/race-detail';
import { colors, Spacing } from '@/constants/designSystem';
import { createLogger } from '@/lib/utils/logger';

// Example data

const logger = createLogger('race-detail-demo');
const MOCK_RACES = [
  {
    id: '1',
    name: 'Croucher 1 & 2',
    venue: 'Port Shelter',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: 'upcoming' as const,
    windConditions: { summary: 'Variable 8-15kts' },
    currentConditions: { summary: 'slack 1m' },
  },
  {
    id: '2',
    name: 'Dragon Championships',
    venue: 'Victoria Harbour',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'upcoming' as const,
    windConditions: { summary: 'SE 12-18kts' },
    currentConditions: { summary: 'moderate 2m' },
  },
  {
    id: '3',
    name: 'Summer Series Race 3',
    venue: 'Stanley Bay',
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
    status: 'completed' as const,
  },
];

const MOCK_MAP_REGION = {
  latitude: 22.3193,
  longitude: 114.1694,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MOCK_COURSE = {
  startLine: [
    { latitude: 22.315, longitude: 114.165 },
    { latitude: 22.315, longitude: 114.175 },
  ],
  finishLine: [
    { latitude: 22.325, longitude: 114.165 },
    { latitude: 22.325, longitude: 114.175 },
  ],
  marks: [
    { coordinate: { latitude: 22.320, longitude: 114.170 } },
    { coordinate: { latitude: 22.318, longitude: 114.180 } },
    { coordinate: { latitude: 22.322, longitude: 114.178 } },
  ],
  path: [
    { latitude: 22.315, longitude: 114.170 },
    { latitude: 22.320, longitude: 114.170 },
    { latitude: 22.318, longitude: 114.180 },
    { latitude: 22.322, longitude: 114.178 },
    { latitude: 22.325, longitude: 114.170 },
  ],
};

const MOCK_RACE_EVENT = {
  id: 'demo-race',
  race_name: 'Demo Race',
  start_time: new Date().toISOString(),
  venue: {
    name: 'Victoria Harbour',
    coordinates_lat: MOCK_MAP_REGION.latitude,
    coordinates_lng: MOCK_MAP_REGION.longitude,
  },
};

const MOCK_MARKS = MOCK_COURSE.marks.map((mark, index) => ({
  id: `mark_${index}`,
  mark_name: `Mark ${index + 1}`,
  mark_type: 'windward',
  latitude: mark.coordinate.latitude,
  longitude: mark.coordinate.longitude,
}));

const MOCK_RACING_AREA_POLYGON = MOCK_COURSE.path.map((point) => ({
  lat: point.latitude,
  lng: point.longitude,
}));

const MOCK_WIND_CONDITIONS = {
  speed: 16,
  direction: 180,
  gusts: 18,
  beaufortScale: 5,
  description: 'Fresh breeze',
};

const MOCK_CURRENT_CONDITIONS = {
  speed: 0.5,
  direction: 225,
  strength: 'slack' as const,
};

const MOCK_TIDE_DATA = {
  highTide: { time: '14:00', height: '3.3m' },
  lowTide: { time: '08:00', height: '0.4m' },
  range: '4.9m',
};

export default function RaceDetailDemoScreen() {
  const [selectedRaceId, setSelectedRaceId] = useState('1');
  const selectedRace = MOCK_RACES.find((r) => r.id === selectedRaceId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colors.text.primary}
          onPress={() => router.back()}
        />
        <View style={styles.headerTitleContainer}>
          <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
        </View>
      </View>

      {/* Horizontal Race Cards */}
      <View style={styles.racesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOCK_RACES.map((race) => (
            <EnhancedRaceCard
              key={race.id}
              race={race}
              isSelected={race.id === selectedRaceId}
              onPress={() => setSelectedRaceId(race.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Detail Content - Scrollable */}
      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* 🗺️ MAP HERO */}
        <RaceDetailMapHero
          compact
          race={{
            ...MOCK_RACE_EVENT,
            id: selectedRaceId,
            race_name: selectedRace?.name || MOCK_RACE_EVENT.race_name,
            start_time: selectedRace?.startTime?.toISOString() || MOCK_RACE_EVENT.start_time,
            venue: {
              name: selectedRace?.venue,
              coordinates_lat: MOCK_MAP_REGION.latitude,
              coordinates_lng: MOCK_MAP_REGION.longitude,
            },
          }}
          marks={MOCK_MARKS}
          racingAreaPolygon={MOCK_RACING_AREA_POLYGON}
        />

        {/* Timing & Start Sequence */}
        <TimingCard
          startSequence={[
            { time: '08:00', label: 'Warning Signal', type: 'warning' },
            { time: '08:04', label: 'Prep Signal', type: 'prep' },
            { time: '08:05', label: 'Start', type: 'start' },
          ]}
          signals={['Flag U', 'Black Flag', '3 min start']}
        />

        {/* 🎯 TACTICAL PLAN CARD */}
        <TacticalPlanCard
          raceId={selectedRaceId}
          raceName={selectedRace?.name || 'Unknown Race'}
        />

        {/* ⚠️ CONTINGENCY PLANS CARD */}
        <ContingencyPlansCard raceId={selectedRaceId} />

        {/* Weather & Wind */}
        <WeatherCard windConditions={MOCK_WIND_CONDITIONS} showLiveIndicator />

        {/* Current & Tide */}
        <TideCard
          currentConditions={MOCK_CURRENT_CONDITIONS}
          tideData={MOCK_TIDE_DATA}
          showLiveIndicator
        />

        {/* Course & Start Area */}
        <CourseCard
          course={{
            id: '1',
            name: 'Standard Windward-Leeward',
            description: '3-lap windward-leeward course',
          }}
          startBoatName="RC Boat 1"
          startPosition="22°19.2'N 114°10.1'E"
          pinLength="150m"
          boatSpacing="5m"
          onSelectCourse={() => {
            logger.debug('Select course');
          }}
        />

        {/* Communications */}
        <CommunicationsCard
          vhfChannel="72"
          workingChannel="16"
          contacts={[
            { id: '1', name: 'John Smith', role: 'Principal Race Officer', phone: '+852 1234 5678' },
            { id: '2', name: 'Jane Doe', role: 'Safety Officer', phone: '+852 8765 4321' },
          ]}
        />

        {/* 👥 CREW & EQUIPMENT CARD */}
        <CrewEquipmentCard
          raceId={selectedRaceId}
          classId="dragon-class"
          onManageCrew={() =>
            router.push({
              pathname: '/(tabs)/crew',
              params: {
                fromRaceId: MOCK_RACE_EVENT.id,
                raceName: MOCK_RACE_EVENT.race_name,
                classId: 'demo-class',
                className: 'Demo Class',
              },
            })
          }
        />

        {/* ⛵ FLEET RACERS CARD - WHO'S RACING? */}
        <FleetRacersCard
          raceId={selectedRaceId}
          classId="dragon-class"
          venueId="port-shelter"
          onJoinFleet={(fleetId) => logger.debug('Joined fleet:', fleetId)}
        />

        {/* 📄 RACE DOCUMENTS CARD - Disabled (requires authentication)
        <RaceDocumentsCard
          raceId={selectedRaceId}
          onUpload={() => logger.debug('Upload document')}
          onDocumentPress={(doc) => logger.debug('Document pressed:', doc)}
          onShareWithFleet={(docId) => logger.debug('Share with fleet:', docId)}
        />
        */}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  racesBar: {
    backgroundColor: colors.background.primary,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
