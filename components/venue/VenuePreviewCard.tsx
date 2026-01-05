/**
 * VenuePreviewCard
 *
 * Data-rich preview card shown when map is unavailable.
 * Tufte-inspired: maximize data density in available space.
 * Shows sparklines for wind/tide/current + venue stats.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import { WindSparkline, TideSparkline, CurrentSparkline } from './ConditionsSparkline';
import type { VenueRacingArea } from '@/services/venue/CommunityVenueCreationService';

interface VenuePreviewCardProps {
  venueName: string;
  country?: string;
  // Current conditions
  windSpeed?: number;
  windDirection?: string;
  tideHeight?: number;
  tideState?: 'rising' | 'falling' | 'high' | 'low';
  currentSpeed?: number;
  // Sparkline data (24hr forecast)
  windData?: number[];
  tideData?: number[];
  currentData?: number[];
  // Stats
  racingAreaCount?: number;
  discussionCount?: number;
  // Racing areas list
  racingAreas?: VenueRacingArea[];
  onAreaSelect?: (area: VenueRacingArea) => void;
  // Action
  onShowMap?: () => void;
  height?: number | string;
}

export function VenuePreviewCard({
  venueName,
  country,
  windSpeed,
  windDirection,
  tideHeight,
  tideState,
  currentSpeed,
  windData = [],
  tideData = [],
  currentData = [],
  racingAreaCount = 0,
  discussionCount = 0,
  racingAreas = [],
  onAreaSelect,
  onShowMap,
  height = 280,
}: VenuePreviewCardProps) {
  // Format tide state
  const formatTideState = (state?: string) => {
    switch (state) {
      case 'rising':
        return 'Rising';
      case 'falling':
        return 'Falling';
      case 'high':
        return 'High';
      case 'low':
        return 'Low';
      default:
        return '';
    }
  };

  const hasConditions = windSpeed !== undefined || tideHeight !== undefined || currentSpeed !== undefined;
  const hasSparklines = windData.length > 0 || tideData.length > 0 || currentData.length > 0;

  return (
    <View style={[styles.container, { height: typeof height === 'number' ? height : 280 }]}>
      {/* Venue Header */}
      <View style={styles.header}>
        <Ionicons name="location" size={18} color="#2563EB" />
        <Text style={styles.venueName} numberOfLines={1}>
          {venueName}
        </Text>
        {country && <Text style={styles.country}>{country}</Text>}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Current Conditions Row */}
      {hasConditions && (
        <View style={styles.conditionsRow}>
          {windSpeed !== undefined && (
            <View style={styles.conditionItem}>
              <Text style={styles.conditionValue}>
                {windSpeed}kt {windDirection || ''}
              </Text>
              <Text style={styles.conditionLabel}>wind</Text>
            </View>
          )}
          {tideHeight !== undefined && (
            <View style={styles.conditionItem}>
              <Text style={styles.conditionValue}>
                {tideHeight.toFixed(1)}m {formatTideState(tideState)}
              </Text>
              <Text style={styles.conditionLabel}>tide</Text>
            </View>
          )}
          {currentSpeed !== undefined && currentSpeed > 0 && (
            <View style={styles.conditionItem}>
              <Text style={styles.conditionValue}>{currentSpeed.toFixed(1)}kt</Text>
              <Text style={styles.conditionLabel}>current</Text>
            </View>
          )}
        </View>
      )}

      {/* Sparklines Row (Tufte: inline small multiples) */}
      {hasSparklines && (
        <View style={styles.sparklinesRow}>
          {windData.length > 0 && (
            <View style={styles.sparklineItem}>
              <WindSparkline data={windData} width={80} height={24} />
              <Text style={styles.sparklineLabel}>Wind 24hr</Text>
            </View>
          )}
          {tideData.length > 0 && (
            <View style={styles.sparklineItem}>
              <TideSparkline data={tideData} width={80} height={24} />
              <Text style={styles.sparklineLabel}>Tide</Text>
            </View>
          )}
          {currentData.length > 0 && (
            <View style={styles.sparklineItem}>
              <CurrentSparkline data={currentData} width={80} height={24} />
              <Text style={styles.sparklineLabel}>Current</Text>
            </View>
          )}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{racingAreaCount}</Text>
          <Text style={styles.statLabel}>
            racing area{racingAreaCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.statDot} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{discussionCount}</Text>
          <Text style={styles.statLabel}>
            discussion{discussionCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Racing Areas List (fallback when no map) */}
      {racingAreas.length > 0 && (
        <View style={styles.areasList}>
          {racingAreas.slice(0, 3).map((area) => (
            <Pressable
              key={area.id}
              style={styles.areaItem}
              onPress={() => onAreaSelect?.(area)}
            >
              <Text style={styles.areaName} numberOfLines={1}>
                {area.name}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
            </Pressable>
          ))}
          {racingAreas.length > 3 && (
            <Text style={styles.moreAreas}>
              +{racingAreas.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* Dev Build Note */}
      {onShowMap && (
        <Pressable style={styles.devNote} onPress={onShowMap}>
          <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
          <Text style={styles.devNoteText}>
            Map requires a development build
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: TufteTokens.backgrounds.subtle,
    padding: TufteTokens.spacing.section,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TufteTokens.spacing.compact,
  },
  venueName: {
    ...TufteTokens.typography.primary,
    fontSize: 18,
    fontWeight: '600',
    color: TufteTokens.colors.textPrimary,
    flex: 1,
  },
  country: {
    ...TufteTokens.typography.tertiary,
    color: TufteTokens.colors.textSecondary,
  },

  // Divider
  divider: {
    height: TufteTokens.borders.hairline,
    backgroundColor: TufteTokens.borders.colorSubtle,
    marginVertical: TufteTokens.spacing.compact,
  },

  // Current Conditions
  conditionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: TufteTokens.spacing.compact,
  },
  conditionItem: {
    alignItems: 'center',
  },
  conditionValue: {
    ...TufteTokens.typography.data,
    fontWeight: '600',
    color: TufteTokens.colors.textPrimary,
  },
  conditionLabel: {
    ...TufteTokens.typography.micro,
    color: TufteTokens.colors.textTertiary,
    textTransform: 'lowercase',
  },

  // Sparklines
  sparklinesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: TufteTokens.backgrounds.paper,
    borderRadius: TufteTokens.borderRadius.subtle,
    marginVertical: TufteTokens.spacing.compact,
  },
  sparklineItem: {
    alignItems: 'center',
    padding: TufteTokens.spacing.compact,
  },
  sparklineLabel: {
    ...TufteTokens.typography.micro,
    color: TufteTokens.colors.textTertiary,
    marginTop: TufteTokens.spacing.tight,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: TufteTokens.spacing.tight,
  },
  statValue: {
    ...TufteTokens.typography.data,
    fontWeight: '600',
    color: TufteTokens.colors.textPrimary,
  },
  statLabel: {
    ...TufteTokens.typography.micro,
    color: TufteTokens.colors.textSecondary,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: TufteTokens.colors.textTertiary,
  },

  // Areas List
  areasList: {
    gap: TufteTokens.spacing.tight,
  },
  areaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    backgroundColor: TufteTokens.backgrounds.paper,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  areaName: {
    ...TufteTokens.typography.tertiary,
    color: TufteTokens.colors.textPrimary,
    flex: 1,
  },
  moreAreas: {
    ...TufteTokens.typography.micro,
    color: TufteTokens.colors.textSecondary,
    textAlign: 'center',
    paddingTop: TufteTokens.spacing.tight,
  },

  // Dev Note
  devNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TufteTokens.spacing.tight,
    paddingTop: TufteTokens.spacing.compact,
  },
  devNoteText: {
    ...TufteTokens.typography.micro,
    color: TufteTokens.colors.textTertiary,
  },
});

export default VenuePreviewCard;
