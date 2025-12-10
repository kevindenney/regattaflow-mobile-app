/**
 * FleetCommunityCard Component
 * Displays active fleets and community information for a venue
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useVenueFleetInfo, VenueFleet, getFrequencyLabel } from '@/hooks/useVenueFleetInfo';

interface FleetCommunityCardProps {
  venueId?: string;
  venueName?: string;
  compact?: boolean;
  onFleetPress?: (fleet: VenueFleet) => void;
}

/**
 * Get boat class icon
 */
function getClassIcon(boatClass: string): string {
  const lowerClass = boatClass.toLowerCase();
  if (lowerClass.includes('laser') || lowerClass.includes('ilca')) return 'boat-outline';
  if (lowerClass.includes('470') || lowerClass.includes('49')) return 'boat';
  if (lowerClass.includes('dragon')) return 'flame-outline';
  if (lowerClass.includes('j/')) return 'speedometer';
  if (lowerClass.includes('etchells')) return 'ribbon';
  if (lowerClass.includes('optimist')) return 'school-outline';
  return 'sail-outline';
}

/**
 * Get frequency badge color
 */
function getFrequencyColor(frequency?: string): { bg: string; text: string } {
  switch (frequency) {
    case 'weekly': return { bg: '#d1fae5', text: '#059669' };
    case 'biweekly': return { bg: '#e0f2fe', text: '#0284c7' };
    case 'monthly': return { bg: '#fef3c7', text: '#d97706' };
    case 'seasonal': return { bg: '#fee2e2', text: '#dc2626' };
    default: return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

/**
 * Individual fleet card
 */
function FleetItem({ fleet, onPress }: { fleet: VenueFleet; onPress?: () => void }) {
  const frequencyColor = getFrequencyColor(fleet.racingFrequency);

  const handleEmail = () => {
    if (fleet.contactEmail) {
      Linking.openURL(`mailto:${fleet.contactEmail}`);
    }
  };

  const handleWebsite = () => {
    if (fleet.website) {
      Linking.openURL(fleet.website);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.fleetItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.fleetHeader}>
        <View style={styles.fleetIconContainer}>
          <Ionicons name={getClassIcon(fleet.boatClass) as any} size={20} color="#0284c7" />
        </View>
        <View style={styles.fleetInfo}>
          <ThemedText style={styles.fleetClassName}>{fleet.boatClass}</ThemedText>
          {fleet.classAssociation && (
            <ThemedText style={styles.fleetAssociation} numberOfLines={1}>
              {fleet.classAssociation}
            </ThemedText>
          )}
        </View>
        {fleet.typicalFleetSize && (
          <View style={styles.fleetSizeBadge}>
            <ThemedText style={styles.fleetSizeText}>{fleet.typicalFleetSize}</ThemedText>
            <ThemedText style={styles.fleetSizeLabel}>boats</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.fleetMeta}>
        {fleet.racingFrequency && (
          <View style={[styles.frequencyBadge, { backgroundColor: frequencyColor.bg }]}>
            <ThemedText style={[styles.frequencyText, { color: frequencyColor.text }]}>
              {getFrequencyLabel(fleet.racingFrequency)}
            </ThemedText>
          </View>
        )}

        <View style={styles.fleetActions}>
          {fleet.contactEmail && (
            <TouchableOpacity onPress={handleEmail} style={styles.actionButton}>
              <Ionicons name="mail-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
          {fleet.website && (
            <TouchableOpacity onPress={handleWebsite} style={styles.actionButton}>
              <Ionicons name="globe-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function FleetCommunityCard({
  venueId,
  venueName,
  compact = false,
  onFleetPress,
}: FleetCommunityCardProps) {
  const { fleets, totalFleetSize, activeFleetCount, isLoading, error, refresh } = useVenueFleetInfo(venueId);

  if (!venueId) return null;

  if (compact) {
    if (isLoading) {
      return (
        <View style={styles.compactContainer}>
          <ActivityIndicator size="small" color="#6b7280" />
        </View>
      );
    }

    if (fleets.length === 0) {
      return (
        <View style={styles.compactContainer}>
          <Ionicons name="people-outline" size={16} color="#9ca3af" />
          <ThemedText style={styles.compactEmptyText}>No fleet info</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.compactContainer}>
        <Ionicons name="people" size={16} color="#0284c7" />
        <ThemedText style={styles.compactText}>
          {activeFleetCount} active fleet{activeFleetCount !== 1 ? 's' : ''}
        </ThemedText>
        <ThemedText style={styles.compactMeta}>~{totalFleetSize} boats</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={20} color="#0284c7" />
          <ThemedText style={styles.headerTitle}>Active Fleets</ThemedText>
          {activeFleetCount > 0 && (
            <View style={styles.countBadge}>
              <ThemedText style={styles.countText}>{activeFleetCount}</ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="refresh" size={18} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : fleets.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={40} color="#d1d5db" />
          <ThemedText style={styles.emptyTitle}>No Fleet Information</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Fleet data for {venueName || 'this venue'} hasn't been added yet
          </ThemedText>
        </View>
      ) : (
        <>
          {/* Summary Stats */}
          {totalFleetSize > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{activeFleetCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Classes</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>~{totalFleetSize}</ThemedText>
                <ThemedText style={styles.statLabel}>Active Boats</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {fleets.filter(f => f.racingFrequency === 'weekly').length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Weekly</ThemedText>
              </View>
            </View>
          )}

          {/* Fleet List */}
          <View style={styles.fleetList}>
            {fleets.map((fleet) => (
              <FleetItem
                key={fleet.id}
                fleet={fleet}
                onPress={() => onFleetPress?.(fleet)}
              />
            ))}
          </View>

          {/* Join CTA */}
          <TouchableOpacity style={styles.joinButton}>
            <Ionicons name="add-circle-outline" size={18} color="#0284c7" />
            <ThemedText style={styles.joinButtonText}>Join a Fleet</ThemedText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  refreshButton: {
    padding: 6,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },

  // Fleet List
  fleetList: {
    padding: 12,
    gap: 10,
  },
  fleetItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  fleetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  fleetIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleetInfo: {
    flex: 1,
  },
  fleetClassName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  fleetAssociation: {
    fontSize: 12,
    color: '#6b7280',
  },
  fleetSizeBadge: {
    alignItems: 'center',
  },
  fleetSizeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  fleetSizeLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  fleetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fleetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },

  // Join Button
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Error State
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },

  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  compactMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 'auto',
  },
  compactEmptyText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});

export default FleetCommunityCard;

