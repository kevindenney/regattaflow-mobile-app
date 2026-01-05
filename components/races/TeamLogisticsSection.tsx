/**
 * Team & Logistics Section
 *
 * Displays crew management and fleet racer information
 * for the Team & Logistics accordion section.
 */

import React from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { CrewEquipmentCard, FleetRacersCard } from '@/components/race-detail';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TeamLogisticsSection');

export interface TeamLogisticsSectionProps {
  /** Race ID */
  raceId: string;
  /** Class ID for crew equipment */
  classId?: string | null;
  /** Class name for fleet racers */
  className?: string | null;
  /** Race date */
  raceDate?: string;
  /** Race name */
  raceName?: string;
  /** Venue ID */
  venueId?: string;
  /** Callback when manage crew is pressed */
  onManageCrew: () => void;
  /** Callback when section layout changes */
  onLayout?: (y: number) => void;
}

/**
 * Team & Logistics Section Component
 */
export function TeamLogisticsSection({
  raceId,
  classId,
  className,
  raceDate,
  venueId,
  onManageCrew,
  onLayout,
}: TeamLogisticsSectionProps) {
  const handleLayout = (event: LayoutChangeEvent) => {
    if (onLayout) {
      const positionY = event.nativeEvent.layout.y;
      onLayout(positionY);
    }
  };

  return (
    <View onLayout={handleLayout}>
      <CrewEquipmentCard
        raceId={raceId}
        classId={classId}
        raceDate={raceDate}
        onManageCrew={onManageCrew}
      />

      <FleetRacersCard
        raceId={raceId}
        classId={className}
        venueId={venueId}
        onJoinFleet={(fleetId) => {
          logger.debug('Joined fleet:', fleetId);
        }}
      />
    </View>
  );
}

export default TeamLogisticsSection;
