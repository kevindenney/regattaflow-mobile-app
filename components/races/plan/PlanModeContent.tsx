/**
 * PlanModeContent Component
 * Organizes all selected race detail content into collapsible sections for PLAN mode
 *
 * This component takes race data and organizes it into priority-based sections:
 * - Priority 1-2: Always visible (actions, brief)
 * - Priority 3-4: Expanded by default (conditions, course)
 * - Priority 5-8: Collapsed by default (setup, logistics, regulatory, post-race)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Wind, Map, Settings, Users, FileText, Trophy, Navigation } from 'lucide-react-native';
import { CollapsibleSection } from './CollapsibleSection';

export interface PlanModeContentProps {
  /** Selected race data */
  raceData: any;

  /** Race ID */
  raceId: string;

  /** Children components organized by section */
  sections: {
    /** Priority 2: Quick Actions (Edit/Delete, Course Selector) */
    quickActions?: React.ReactNode;

    /** Priority 3: Conditions (Weather, Tide, Contingency) */
    conditions?: React.ReactNode;

    /** Priority 4: Course & Strategy (Map, Course Template, AI Insights) */
    courseAndStrategy?: React.ReactNode;

    /** Priority 5: Boat Setup (Rig Tuning, Rig Planner) */
    boatSetup?: React.ReactNode;

    /** Priority 6: Team & Logistics (Crew, Fleet, Documents) */
    teamAndLogistics?: React.ReactNode;

    /** Priority 7: Regulatory (Digest, Course Outline) */
    regulatory?: React.ReactNode;

    /** On-Water Execution tools */
    raceExecution?: React.ReactNode;

    /** Priority 8: Post-Race Analysis */
    postRaceAnalysis?: React.ReactNode;
  };

  /** Additional props for dynamic behavior */
  raceStatus?: 'upcoming' | 'in-progress' | 'completed';
  contingencyCount?: number;
  regulatoryAcknowledged?: number;
  regulatoryTotal?: number;
  crewCount?: number;
  fleetCount?: number;
  documentCount?: number;

  /** Auto-expand post-race analysis when data is available */
  hasPostRaceData?: boolean;
}

export function PlanModeContent({
  raceData,
  raceId,
  sections,
  raceStatus = 'upcoming',
  contingencyCount = 0,
  regulatoryAcknowledged = 0,
  regulatoryTotal = 0,
  crewCount = 0,
  fleetCount = 0,
  documentCount = 0,
  hasPostRaceData = false,
}: PlanModeContentProps) {
  // Determine if post-race section should be auto-expanded
  // Expand when race is completed OR when there's post-race data available (fleet insights, etc)
  const shouldExpandPostRace = raceStatus === 'completed' || hasPostRaceData;

  const renderChildContent = (content: React.ReactNode) => {
    return React.Children.map(content, (child, index) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return (
          <Text key={`text-child-${index}`}>
            {child}
          </Text>
        );
      }

      return child;
    });
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Priority 2: Quick Actions (Always Visible) */}
      {sections.quickActions && (
        <View>{renderChildContent(sections.quickActions)}</View>
      )}

      {/* Priority 3: Conditions & Environment */}
      {sections.conditions && (
        <CollapsibleSection
          id={`${raceId}-conditions`}
          title="Conditions & Environment"
          icon={<Wind size={20} color="#3B82F6" />}
          badge={contingencyCount > 0 ? `${contingencyCount} plans` : undefined}
          badgeVariant="info"
          priority={3}
          defaultExpanded={true}
        >
          {sections.conditions}
        </CollapsibleSection>
      )}

      {/* Priority 4: Course & Strategy */}
      {sections.courseAndStrategy && (
        <CollapsibleSection
          id={`${raceId}-course-strategy`}
          title="Course & Strategy"
          icon={<Map size={20} color="#10B981" />}
          priority={4}
          defaultExpanded={true}
        >
          {sections.courseAndStrategy}
        </CollapsibleSection>
      )}

      {/* Priority 5: Boat Setup */}
      {sections.boatSetup && (
        <CollapsibleSection
          id={`${raceId}-boat-setup`}
          title="Boat Setup"
          icon={<Settings size={20} color="#8B5CF6" />}
          priority={5}
          defaultExpanded={false}
        >
          {sections.boatSetup}
        </CollapsibleSection>
      )}

      {/* Priority 6: Team & Logistics */}
      {sections.teamAndLogistics && (
        <CollapsibleSection
          id={`${raceId}-team-logistics`}
          title="Team & Logistics"
          icon={<Users size={20} color="#F59E0B" />}
          badge={
            crewCount > 0 || fleetCount > 0 || documentCount > 0
              ? `${crewCount + fleetCount + documentCount} items`
              : undefined
          }
          badgeVariant="default"
          priority={6}
          defaultExpanded={false}
        >
          {sections.teamAndLogistics}
        </CollapsibleSection>
      )}

      {/* Priority 7: Regulatory & Rules */}
      {sections.regulatory && (
        <CollapsibleSection
          id={`${raceId}-regulatory`}
          title="Regulatory & Rules"
          icon={<FileText size={20} color="#6366F1" />}
          badge={
            regulatoryTotal > 0
              ? `${regulatoryAcknowledged}/${regulatoryTotal} ack'd`
              : undefined
          }
          badgeVariant={
            regulatoryAcknowledged === regulatoryTotal ? 'success' : 'warning'
          }
          priority={7}
          defaultExpanded={false}
        >
          {sections.regulatory}
        </CollapsibleSection>
      )}

      {/* On-Water Execution */}
      {sections.raceExecution && (
        <CollapsibleSection
          id={`${raceId}-race-execution`}
          title="On-Water Execution"
          icon={<Navigation size={20} color="#0EA5E9" />}
          priority={7.5}
          defaultExpanded={false}
        >
          {sections.raceExecution}
        </CollapsibleSection>
      )}

      {/* Priority 8: Post-Race Analysis */}
      {sections.postRaceAnalysis && (
        <CollapsibleSection
          id={`${raceId}-post-race`}
          title="Post-Race Analysis"
          icon={<Trophy size={20} color="#EF4444" />}
          badge={raceStatus === 'completed' || hasPostRaceData ? 'Available' : undefined}
          badgeVariant="success"
          priority={8}
          defaultExpanded={shouldExpandPostRace}
        >
          {sections.postRaceAnalysis}
        </CollapsibleSection>
      )}
    </View>
  );
}
