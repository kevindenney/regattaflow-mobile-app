/**
 * Race Detail Zone
 *
 * Accordion-based detail sections for the selected race.
 * Displays Course & Strategy, Boat Setup, Fleet, and Regulatory sections.
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Compass, Settings, Users, FileText } from 'lucide-react-native';
import { AccordionSection } from '@/components/races/AccordionSection';
import {
  CourseDetailCard,
  StrategyDetailCard,
  RigDetailCard,
  FleetDetailCard,
  RegulatoryDetailCard,
} from '@/components/races/detail-cards';

export interface RaceDocument {
  id: string;
  file_name: string;
  document_type: string;
}

export interface RaceMark {
  id: string;
  name: string;
  mark_type?: string;
}

export interface RaceDetailZoneProps {
  /** Height of the detail zone container */
  height: number;
  /** The selected race data */
  raceData: {
    id: string;
    race_type?: string;
    metadata?: {
      course_name?: string;
      number_of_legs?: number;
      ai_strategy_summary?: string;
      rig_settings?: any;
      vhf_channel?: string;
    };
    course?: {
      name?: string;
    };
    boat_class?: {
      name?: string;
    };
    fleet?: {
      name?: string;
    };
  };
  /** Marks for the selected race */
  marks?: RaceMark[];
  /** Documents for the selected race */
  documents?: RaceDocument[];
}

/**
 * Race Detail Zone Component
 */
export function RaceDetailZone({
  height,
  raceData,
  marks,
  documents,
}: RaceDetailZoneProps) {
  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Course & Strategy - expanded by default */}
        <AccordionSection
          title="Course & Strategy"
          icon={<Compass size={16} color="#0369A1" />}
          defaultExpanded={true}
          subtitle={raceData.metadata?.course_name || raceData.course?.name}
        >
          <CourseDetailCard
            raceId={raceData.id}
            courseName={raceData.metadata?.course_name || raceData.course?.name}
            courseType={raceData.race_type === 'distance' ? 'distance' : 'windward-leeward'}
            numberOfLegs={raceData.metadata?.number_of_legs}
            marks={marks?.map((m) => ({
              id: m.id,
              name: m.name,
              type: m.mark_type || 'waypoint',
            }))}
          />
          <StrategyDetailCard
            raceId={raceData.id}
            aiInsight={raceData.metadata?.ai_strategy_summary}
          />
        </AccordionSection>

        {/* Boat Setup */}
        <AccordionSection
          title="Boat Setup"
          icon={<Settings size={16} color="#0369A1" />}
          subtitle={raceData.boat_class?.name}
        >
          <RigDetailCard
            raceId={raceData.id}
            boatClassName={raceData.boat_class?.name}
            settings={raceData.metadata?.rig_settings}
          />
        </AccordionSection>

        {/* Fleet */}
        <AccordionSection
          title="Fleet"
          icon={<Users size={16} color="#0369A1" />}
          subtitle={raceData.fleet?.name}
        >
          <FleetDetailCard
            raceId={raceData.id}
            totalCompetitors={0}
            confirmedCount={0}
            fleetName={raceData.fleet?.name}
          />
        </AccordionSection>

        {/* Regulatory & Documents */}
        <AccordionSection
          title="Regulatory"
          icon={<FileText size={16} color="#0369A1" />}
          count={documents?.length}
        >
          <RegulatoryDetailCard
            raceId={raceData.id}
            vhfChannel={raceData.metadata?.vhf_channel}
            documents={documents?.map((doc) => ({
              id: doc.id,
              name: doc.file_name,
              type: doc.document_type,
            }))}
          />
        </AccordionSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  contentContainer: {
    paddingBottom: 8,
  },
});

export default RaceDetailZone;
