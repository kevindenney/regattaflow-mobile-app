/**
 * UpcomingRacesSection Component
 * Displays upcoming races at a venue for racing sailors
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useVenueRaces, VenueRace } from '@/hooks/useVenueRaces';

interface UpcomingRacesSectionProps {
  venueId?: string;
  venueName?: string;
  limit?: number;
  compact?: boolean;
  onRacePress?: (race: VenueRace) => void;
}

/**
 * Get event type display info
 */
function getEventTypeInfo(eventType: string): { label: string; color: string; bgColor: string } {
  switch (eventType) {
    case 'championship':
      return { label: 'Championship', color: '#b45309', bgColor: '#fef3c7' };
    case 'distance_race':
      return { label: 'Distance', color: '#7c3aed', bgColor: '#ede9fe' };
    case 'weeknight_series':
      return { label: 'Series', color: '#0284c7', bgColor: '#e0f2fe' };
    case 'clinic':
      return { label: 'Training', color: '#059669', bgColor: '#d1fae5' };
    case 'weekend_regatta':
    default:
      return { label: 'Regatta', color: '#dc2626', bgColor: '#fee2e2' };
  }
}

/**
 * Get registration status display info
 */
function getRegistrationInfo(status?: string): { label: string; color: string } {
  switch (status) {
    case 'open':
      return { label: 'Open', color: '#059669' };
    case 'closed':
      return { label: 'Closed', color: '#dc2626' };
    case 'full':
      return { label: 'Full', color: '#d97706' };
    case 'pending':
      return { label: 'Coming Soon', color: '#6b7280' };
    default:
      return { label: '', color: '#6b7280' };
  }
}

/**
 * Format days until text
 */
function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 14) return '1 week';
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 60) return '1 month';
  return `${Math.floor(days / 30)} months`;
}

/**
 * Individual race card component
 */
function RaceCard({ race, onPress }: { race: VenueRace; onPress?: () => void }) {
  const eventTypeInfo = getEventTypeInfo(race.eventType);
  const registrationInfo = getRegistrationInfo(race.registrationStatus);

  const handleNorPress = () => {
    if (race.norUrl) {
      Linking.openURL(race.norUrl);
    }
  };

  const handleSiPress = () => {
    if (race.siUrl) {
      Linking.openURL(race.siUrl);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.raceCard, race.isToday && styles.raceCardToday]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View style={styles.raceHeader}>
        <View style={[styles.eventTypeBadge, { backgroundColor: eventTypeInfo.bgColor }]}>
          <ThemedText style={[styles.eventTypeText, { color: eventTypeInfo.color }]}>
            {eventTypeInfo.label}
          </ThemedText>
        </View>
        <View style={styles.dateContainer}>
          {race.isToday ? (
            <View style={styles.todayBadge}>
              <ThemedText style={styles.todayText}>TODAY</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.daysUntilText}>
              {formatDaysUntil(race.daysUntilStart)}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Race Name */}
      <ThemedText style={styles.raceName} numberOfLines={2}>
        {race.eventName}
      </ThemedText>

      {/* Date & Club */}
      <View style={styles.raceDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <ThemedText style={styles.detailText}>{race.formattedDateRange}</ThemedText>
        </View>
        {race.clubName && (
          <View style={styles.detailRow}>
            <Ionicons name="flag-outline" size={14} color="#6b7280" />
            <ThemedText style={styles.detailText} numberOfLines={1}>{race.clubName}</ThemedText>
          </View>
        )}
      </View>

      {/* Footer Row */}
      <View style={styles.raceFooter}>
        {/* Entry Fee */}
        {race.entryFee && race.entryFee > 0 && (
          <View style={styles.feeBadge}>
            <ThemedText style={styles.feeText}>
              {race.currency === 'HKD' ? 'HK$' : '$'}{race.entryFee}
            </ThemedText>
          </View>
        )}

        {/* Registration Status */}
        {registrationInfo.label && (
          <View style={styles.registrationContainer}>
            <View style={[styles.registrationDot, { backgroundColor: registrationInfo.color }]} />
            <ThemedText style={[styles.registrationText, { color: registrationInfo.color }]}>
              {registrationInfo.label}
            </ThemedText>
          </View>
        )}

        {/* Document Links */}
        <View style={styles.documentLinks}>
          {race.norUrl && (
            <TouchableOpacity onPress={handleNorPress} style={styles.docButton}>
              <ThemedText style={styles.docButtonText}>NOR</ThemedText>
            </TouchableOpacity>
          )}
          {race.siUrl && (
            <TouchableOpacity onPress={handleSiPress} style={styles.docButton}>
              <ThemedText style={styles.docButtonText}>SI</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Main component
 */
export function UpcomingRacesSection({
  venueId,
  venueName,
  limit = 5,
  compact = false,
  onRacePress,
}: UpcomingRacesSectionProps) {
  const { races, isLoading, error, refresh, hasMore, loadMore } = useVenueRaces(venueId, limit);

  if (!venueId) {
    return null;
  }

  // Compact view for hero card area
  if (compact) {
    if (isLoading && races.length === 0) {
      return (
        <View style={styles.compactContainer}>
          <ActivityIndicator size="small" color="#6b7280" />
        </View>
      );
    }

    if (races.length === 0) {
      return (
        <View style={styles.compactContainer}>
          <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
          <ThemedText style={styles.compactEmptyText}>No upcoming races</ThemedText>
        </View>
      );
    }

    const nextRace = races[0];
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => onRacePress?.(nextRace)}
        activeOpacity={0.7}
      >
        <Ionicons name="flag" size={16} color="#dc2626" />
        <View style={styles.compactContent}>
          <ThemedText style={styles.compactRaceName} numberOfLines={1}>
            {nextRace.eventName}
          </ThemedText>
          <ThemedText style={styles.compactDate}>
            {nextRace.isToday ? 'Today' : nextRace.formattedDateRange}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </TouchableOpacity>
    );
  }

  // Full view
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={20} color="#dc2626" />
          <ThemedText style={styles.headerTitle}>Upcoming Races</ThemedText>
          {races.length > 0 && (
            <View style={styles.countBadge}>
              <ThemedText style={styles.countText}>{races.length}</ThemedText>
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
      ) : races.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
          <ThemedText style={styles.emptyTitle}>No Upcoming Races</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            No races scheduled at {venueName || 'this venue'}
          </ThemedText>
        </View>
      ) : (
        <ScrollView 
          style={styles.racesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.racesListContent}
        >
          {races.map((race) => (
            <RaceCard 
              key={race.id} 
              race={race} 
              onPress={() => onRacePress?.(race)}
            />
          ))}
          
          {hasMore && (
            <TouchableOpacity 
              onPress={loadMore} 
              style={styles.loadMoreButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <ThemedText style={styles.loadMoreText}>Load More</ThemedText>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
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
    maxHeight: 400,
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
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  refreshButton: {
    padding: 6,
  },

  // Race List
  racesList: {
    flex: 1,
  },
  racesListContent: {
    padding: 12,
    gap: 10,
  },

  // Race Card
  raceCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  raceCardToday: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  daysUntilText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  raceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  raceDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  raceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  feeBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  feeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  registrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registrationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  registrationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  documentLinks: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  docButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  docButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },

  // Load More
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreText: {
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

  // Compact View
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  compactContent: {
    flex: 1,
  },
  compactRaceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  compactDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  compactEmptyText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});

export default UpcomingRacesSection;

