/**
 * RacingAreaCircleOverlay
 *
 * Native map overlay for displaying racing areas as circles (point + radius).
 * Works with react-native-maps. Shows community areas with verification status.
 * Tufte-inspired: minimal chrome, clear visual hierarchy.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { VenueRacingArea } from '@/services/venue/CommunityVenueCreationService';
import { TufteTokens } from '@/constants/designSystem';

// Safely import react-native-maps Circle
let Circle: any = null;
let Marker: any = null;
let Callout: any = null;
let mapsAvailable = false;

try {
  const maps = require('react-native-maps');
  Circle = maps.Circle;
  Marker = maps.Marker;
  Callout = maps.Callout;
  mapsAvailable = true;
} catch (e) {
  // Maps not available (Expo Go)
}

interface RacingAreaCircleOverlayProps {
  areas: VenueRacingArea[];
  selectedAreaId?: string | null;
  onAreaPress?: (area: VenueRacingArea) => void;
  showLabels?: boolean;
}

// Color configuration for different area states
const AREA_COLORS = {
  official: {
    fill: 'rgba(37, 99, 235, 0.12)',
    stroke: '#2563EB',
    selectedFill: 'rgba(37, 99, 235, 0.22)',
    selectedStroke: '#1D4ED8',
  },
  verified: {
    fill: 'rgba(5, 150, 105, 0.12)',
    stroke: '#059669',
    selectedFill: 'rgba(5, 150, 105, 0.22)',
    selectedStroke: '#047857',
  },
  pending: {
    fill: 'rgba(156, 163, 175, 0.08)',
    stroke: '#9CA3AF',
    selectedFill: 'rgba(156, 163, 175, 0.16)',
    selectedStroke: '#6B7280',
  },
  disputed: {
    fill: 'rgba(217, 119, 6, 0.12)',
    stroke: '#D97706',
    selectedFill: 'rgba(217, 119, 6, 0.22)',
    selectedStroke: '#B45309',
  },
};

function getAreaColors(area: VenueRacingArea, isSelected: boolean) {
  let colorSet = AREA_COLORS.official;

  if (area.source === 'community') {
    if (area.verification_status === 'verified') {
      colorSet = AREA_COLORS.verified;
    } else if (area.verification_status === 'disputed') {
      colorSet = AREA_COLORS.disputed;
    } else {
      colorSet = AREA_COLORS.pending;
    }
  }

  return {
    fill: isSelected ? colorSet.selectedFill : colorSet.fill,
    stroke: isSelected ? colorSet.selectedStroke : colorSet.stroke,
  };
}

/**
 * Main overlay component for native maps
 */
export function RacingAreaCircleOverlay({
  areas,
  selectedAreaId,
  onAreaPress,
  showLabels = true,
}: RacingAreaCircleOverlayProps) {
  // Return null if maps aren't available
  if (!mapsAvailable) {
    return null;
  }

  const handleAreaPress = useCallback(
    (area: VenueRacingArea) => {
      onAreaPress?.(area);
    },
    [onAreaPress]
  );

  // Filter areas with valid circle data
  const validAreas = useMemo(
    () =>
      areas.filter(
        (area) =>
          area.center_lat != null &&
          area.center_lng != null &&
          area.radius_meters != null &&
          area.radius_meters > 0
      ),
    [areas]
  );

  if (validAreas.length === 0) {
    return null;
  }

  return (
    <>
      {validAreas.map((area) => {
        const isSelected = area.id === selectedAreaId;
        const colors = getAreaColors(area, isSelected);
        const strokeWidth = isSelected ? 2.5 : 1.5;
        const isPending = area.source === 'community' && area.verification_status === 'pending';

        return (
          <React.Fragment key={area.id}>
            {/* Circle overlay */}
            <Circle
              center={{
                latitude: area.center_lat!,
                longitude: area.center_lng!,
              }}
              radius={area.radius_meters!}
              fillColor={colors.fill}
              strokeColor={colors.stroke}
              strokeWidth={strokeWidth}
              zIndex={isSelected ? 10 : 1}
              onPress={() => handleAreaPress(area)}
              tappable
              lineDashPattern={isPending ? [5, 5] : undefined}
            />

            {/* Label marker */}
            {showLabels && (
              <Marker
                coordinate={{
                  latitude: area.center_lat!,
                  longitude: area.center_lng!,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                onPress={() => handleAreaPress(area)}
              >
                <AreaLabelMarker area={area} isSelected={isSelected} />
                <Callout tooltip>
                  <AreaCallout area={area} />
                </Callout>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

/**
 * Minimal label shown on the map
 */
function AreaLabelMarker({
  area,
  isSelected,
}: {
  area: VenueRacingArea;
  isSelected: boolean;
}) {
  const isPending = area.source === 'community' && area.verification_status === 'pending';
  const isOfficial = area.source === 'official';

  return (
    <View style={[styles.labelContainer, isSelected && styles.labelSelected]}>
      <Text
        style={[
          styles.labelText,
          isSelected && styles.labelTextSelected,
          isPending && styles.labelTextPending,
        ]}
        numberOfLines={1}
      >
        {area.name}
      </Text>
      {isPending && (
        <View style={styles.confirmBadge}>
          <Text style={styles.confirmBadgeText}>
            {area.confirmation_count}/3
          </Text>
        </View>
      )}
      {isOfficial && !isSelected && (
        <View style={styles.officialDot} />
      )}
    </View>
  );
}

/**
 * Callout shown when marker is tapped
 */
function AreaCallout({ area }: { area: VenueRacingArea }) {
  const isPending = area.source === 'community' && area.verification_status === 'pending';

  return (
    <View style={styles.callout}>
      <Text style={styles.calloutTitle}>{area.name}</Text>
      {area.description && (
        <Text style={styles.calloutDescription} numberOfLines={2}>
          {area.description}
        </Text>
      )}
      <View style={styles.calloutMeta}>
        {area.source === 'official' && (
          <Text style={styles.calloutOfficial}>Official Area</Text>
        )}
        {area.source === 'community' && area.verification_status === 'verified' && (
          <Text style={styles.calloutVerified}>Community Verified</Text>
        )}
        {isPending && (
          <Text style={styles.calloutPending}>
            {area.confirmation_count}/3 confirmations
          </Text>
        )}
        <Text style={styles.calloutRadius}>
          {area.radius_meters! >= 1000
            ? `${(area.radius_meters! / 1000).toFixed(1)}km radius`
            : `${area.radius_meters}m radius`}
        </Text>
      </View>
    </View>
  );
}

/**
 * Export areas as GeoJSON for web/MapLibre compatibility
 */
export function useRacingAreasAsGeoJSON(
  areas: VenueRacingArea[],
  selectedAreaId?: string | null
) {
  return useMemo(() => {
    const validAreas = areas.filter(
      (a) => a.center_lat != null && a.center_lng != null && a.radius_meters
    );

    return {
      type: 'FeatureCollection' as const,
      features: validAreas.map((area) => {
        const isSelected = area.id === selectedAreaId;
        const colors = getAreaColors(area, isSelected);

        return {
          type: 'Feature' as const,
          id: area.id,
          properties: {
            name: area.name,
            description: area.description,
            source: area.source,
            verification_status: area.verification_status,
            confirmation_count: area.confirmation_count,
            radius_meters: area.radius_meters,
            fillColor: colors.fill,
            strokeColor: colors.stroke,
            isSelected,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [area.center_lng!, area.center_lat!],
          },
        };
      }),
    };
  }, [areas, selectedAreaId]);
}

const styles = StyleSheet.create({
  // Label styles
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: TufteTokens.borderRadius.subtle,
    borderWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
    maxWidth: 140,
    ...TufteTokens.shadows.subtle,
  },
  labelSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  labelText: {
    ...TufteTokens.typography.micro,
    color: '#374151',
    fontWeight: '600',
    flexShrink: 1,
  },
  labelTextSelected: {
    color: '#FFFFFF',
  },
  labelTextPending: {
    color: '#6B7280',
    fontWeight: '500',
  },

  // Official dot
  officialDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563EB',
  },

  // Confirm badge
  confirmBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  confirmBadgeText: {
    ...TufteTokens.typography.micro,
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Callout styles
  callout: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minWidth: 160,
    maxWidth: 220,
    ...TufteTokens.shadows.subtle,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  calloutTitle: {
    ...TufteTokens.typography.primary,
    color: '#111827',
    marginBottom: 4,
  },
  calloutDescription: {
    ...TufteTokens.typography.tertiary,
    color: '#6B7280',
    marginBottom: 8,
  },
  calloutMeta: {
    gap: 2,
  },
  calloutOfficial: {
    ...TufteTokens.typography.micro,
    color: '#2563EB',
    fontWeight: '600',
  },
  calloutVerified: {
    ...TufteTokens.typography.micro,
    color: '#059669',
    fontWeight: '600',
  },
  calloutPending: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
  },
  calloutRadius: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },
});

export default RacingAreaCircleOverlay;
