/**
 * RacingAreaCard
 *
 * Compact info card for a racing area with Tufte-inspired design.
 * Shows area name, verification status, key stats, and sparklines.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import { CommunityAreaBadge } from './CommunityAreaBadge';
import { ConditionsSparkline } from './ConditionsSparkline';
import type { VenueRacingArea } from '@/services/venue/CommunityVenueCreationService';

interface RacingAreaCardProps {
  area: VenueRacingArea;
  isSelected?: boolean;
  onPress: () => void;
  onConfirm?: () => void;
  compact?: boolean;
  // Optional stats
  discussionCount?: number;
  documentCount?: number;
  tipCount?: number;
  // Optional conditions data
  windData?: number[];
  currentWindSpeed?: number;
  currentWindDirection?: string;
}

export function RacingAreaCard({
  area,
  isSelected = false,
  onPress,
  onConfirm,
  compact = false,
  discussionCount = 0,
  documentCount = 0,
  tipCount = 0,
  windData,
  currentWindSpeed,
  currentWindDirection,
}: RacingAreaCardProps) {
  const hasStats = discussionCount > 0 || documentCount > 0 || tipCount > 0;

  if (compact) {
    return (
      <Pressable
        style={[styles.compactCard, isSelected && styles.compactCardSelected]}
        onPress={onPress}
      >
        <Text style={[styles.compactName, isSelected && styles.compactNameSelected]} numberOfLines={1}>
          {area.name}
        </Text>
        <CommunityAreaBadge
          source={area.source}
          verificationStatus={area.verification_status}
          confirmationCount={area.confirmation_count}
          compact
        />
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.card, isSelected && styles.cardSelected]} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>
            {area.name}
          </Text>
          <CommunityAreaBadge
            source={area.source}
            verificationStatus={area.verification_status}
            confirmationCount={area.confirmation_count}
            userHasConfirmed={area.user_has_confirmed}
            onConfirm={onConfirm}
          />
        </View>
        {isSelected && (
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        )}
      </View>

      {/* Description if present */}
      {area.description && (
        <Text style={styles.description} numberOfLines={2}>
          {area.description}
        </Text>
      )}

      {/* Conditions sparkline */}
      {windData && windData.length > 0 && (
        <View style={styles.conditionsRow}>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Wind</Text>
            <View style={styles.conditionValue}>
              <ConditionsSparkline data={windData} width={50} height={16} />
              {currentWindSpeed !== undefined && (
                <Text style={styles.conditionText}>
                  {currentWindSpeed}kt {currentWindDirection || ''}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Stats row */}
      {hasStats && (
        <View style={styles.statsRow}>
          {discussionCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={12} color="#6B7280" />
              <Text style={styles.statText}>{discussionCount}</Text>
            </View>
          )}
          {documentCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="document-text-outline" size={12} color="#6B7280" />
              <Text style={styles.statText}>{documentCount}</Text>
            </View>
          )}
          {tipCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="bulb-outline" size={12} color="#6B7280" />
              <Text style={styles.statText}>{tipCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Distance indicator if available */}
      {area.distance_km !== undefined && (
        <Text style={styles.distance}>
          {area.distance_km < 1
            ? `${Math.round(area.distance_km * 1000)}m away`
            : `${area.distance_km.toFixed(1)}km away`}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * RacingAreaCardList - Horizontal scrolling list of area cards
 */
interface RacingAreaCardListProps {
  areas: VenueRacingArea[];
  selectedAreaId?: string | null;
  onAreaSelect: (area: VenueRacingArea) => void;
  onConfirm?: (areaId: string) => void;
  compact?: boolean;
}

export function RacingAreaCardList({
  areas,
  selectedAreaId,
  onAreaSelect,
  onConfirm,
  compact = false,
}: RacingAreaCardListProps) {
  if (areas.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No racing areas defined</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {areas.map((area) => (
        <RacingAreaCard
          key={area.id}
          area={area}
          isSelected={selectedAreaId === area.id}
          onPress={() => onAreaSelect(area)}
          onConfirm={onConfirm ? () => onConfirm(area.id) : undefined}
          compact={compact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Standard card
  card: {
    backgroundColor: TufteTokens.backgrounds.paper,
    borderRadius: TufteTokens.borderRadius.subtle,
    borderWidth: TufteTokens.borders.hairline,
    borderColor: TufteTokens.borders.color,
    padding: TufteTokens.spacing.standard,
    gap: TufteTokens.spacing.compact,
    minWidth: 200,
    maxWidth: 280,
    ...TufteTokens.shadows.subtle,
  },
  cardSelected: {
    borderColor: '#2563EB',
    borderWidth: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: TufteTokens.spacing.compact,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...TufteTokens.typography.primary,
    color: '#111827',
  },

  // Description
  description: {
    ...TufteTokens.typography.tertiary,
    color: '#6B7280',
  },

  // Conditions
  conditionsRow: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.section,
  },
  conditionItem: {
    gap: 2,
  },
  conditionLabel: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionText: {
    ...TufteTokens.typography.tertiary,
    fontWeight: '600',
    color: '#111827',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.standard,
    paddingTop: TufteTokens.spacing.tight,
    borderTopWidth: TufteTokens.borders.hairline,
    borderTopColor: TufteTokens.borders.colorSubtle,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
  },

  // Distance
  distance: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },

  // Compact card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: TufteTokens.spacing.compact,
    paddingVertical: TufteTokens.spacing.tight,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  compactCardSelected: {
    backgroundColor: '#EFF6FF',
  },
  compactName: {
    ...TufteTokens.typography.tertiary,
    color: '#374151',
    maxWidth: 100,
  },
  compactNameSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },

  // List
  listContainer: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.compact,
    flexWrap: 'wrap',
  },

  // Empty state
  emptyContainer: {
    padding: TufteTokens.spacing.section,
    alignItems: 'center',
  },
  emptyText: {
    ...TufteTokens.typography.tertiary,
    color: '#9CA3AF',
  },
});

export default RacingAreaCard;
