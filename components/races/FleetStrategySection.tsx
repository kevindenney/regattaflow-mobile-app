/**
 * Fleet Strategy Section
 *
 * Displays strategy cards for fleet racing, including start, upwind, downwind,
 * community tips, mark rounding, and contingency plans.
 * Only shown for future fleet races.
 */

import React from 'react';
import {
  StartStrategyCard,
  UpwindStrategyCard,
  DownwindStrategyCard,
  MarkRoundingCard,
  ContingencyPlansCard,
} from '@/components/race-detail';
import { CommunityTipsCard } from '@/components/venue/CommunityTipsCard';

export interface FleetStrategySectionProps {
  /** Whether this is a future race (strategy is actionable) */
  isRaceFuture: boolean;
  /** Race data */
  raceData: {
    id: string;
    name?: string;
    start_date?: string;
    race_type?: string;
    racing_area_polygon?: {
      coordinates?: number[][][];
    };
    metadata?: {
      venue_id?: string;
      venue_name?: string;
      venue_lat?: number;
      venue_lng?: number;
    };
  };
  /** Sailor ID for personalized recommendations */
  sailorId?: string | null;
}

/**
 * Fleet Strategy Section Component
 */
export function FleetStrategySection({
  isRaceFuture,
  raceData,
  sailorId,
}: FleetStrategySectionProps) {
  // Only show for fleet races (not distance) and future races
  if (raceData.race_type === 'distance' || !isRaceFuture) {
    return null;
  }

  // Parse racing area polygon
  const racingAreaPolygon =
    Array.isArray(raceData.racing_area_polygon?.coordinates?.[0]) &&
    raceData.racing_area_polygon!.coordinates![0].length >= 3
      ? raceData.racing_area_polygon!.coordinates![0]
          .slice(0, raceData.racing_area_polygon!.coordinates![0].length - 1)
          .map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
      : undefined;

  return (
    <>
      {/* Start Strategy */}
      <StartStrategyCard
        raceId={raceData.id}
        raceName={raceData.name}
        raceStartTime={raceData.start_date}
        venueId={raceData.metadata?.venue_id}
        venueName={raceData.metadata?.venue_name}
        venueCoordinates={
          raceData.metadata?.venue_lat
            ? {
                lat: raceData.metadata.venue_lat,
                lng: raceData.metadata.venue_lng!,
              }
            : undefined
        }
        racingAreaPolygon={racingAreaPolygon}
        sailorId={sailorId}
        raceEventId={raceData.id}
      />

      {/* Upwind Strategy - Dedicated Beats Card */}
      <UpwindStrategyCard
        raceId={raceData.id}
        raceName={raceData.name}
        sailorId={sailorId}
        raceEventId={raceData.id}
        venueId={raceData.metadata?.venue_id}
        venueName={raceData.metadata?.venue_name}
      />

      {/* Downwind Strategy - Dedicated Runs Card */}
      <DownwindStrategyCard
        raceId={raceData.id}
        raceName={raceData.name}
        sailorId={sailorId}
        raceEventId={raceData.id}
      />

      {/* Community Local Knowledge */}
      {raceData.metadata?.venue_id && raceData.metadata?.venue_name && (
        <CommunityTipsCard
          venueId={raceData.metadata.venue_id}
          venueName={raceData.metadata.venue_name}
          compact={true}
        />
      )}

      {/* Mark Rounding Strategy */}
      <MarkRoundingCard
        raceId={raceData.id}
        raceName={raceData.name}
        sailorId={sailorId}
        raceEventId={raceData.id}
      />

      {/* Contingency Plans - What-if scenarios */}
      <ContingencyPlansCard raceId={raceData.id} />
    </>
  );
}

export default FleetStrategySection;
