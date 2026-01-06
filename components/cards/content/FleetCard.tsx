/**
 * FleetCard - Position 3
 *
 * Full-card display of fleet and competitor information:
 * - Total competitor count
 * - Confirmed/registered counts
 * - Fleet name
 * - Registration status
 * - Competitors list
 *
 * This card helps sailors understand who they're racing against.
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import {
  Users,
  Sailboat,
  CheckCircle,
  PlusCircle,
  User,
  Trophy,
  Medal,
  Star,
} from 'lucide-react-native';

import { CardContentProps } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface Competitor {
  id: string;
  name: string;
  boatName?: string;
  sailNumber?: string;
  status: 'confirmed' | 'registered' | 'tentative';
  rank?: number;
  isLocal?: boolean;
}

interface FleetData {
  totalCompetitors?: number;
  confirmedCount?: number;
  competitors?: Competitor[];
  fleetName?: string;
  isRegistered?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get status badge color
 */
function getStatusColor(status: Competitor['status']): string {
  switch (status) {
    case 'confirmed':
      return '#22C55E';
    case 'registered':
      return '#3B82F6';
    case 'tentative':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FleetCard({
  race,
  cardType,
  isActive,
  dimensions,
}: CardContentProps) {
  // Extract fleet data from race
  const fleetData: FleetData = (race as any).fleet || {};
  const {
    totalCompetitors = 0,
    confirmedCount = 0,
    competitors = [],
    fleetName,
    isRegistered,
  } = fleetData;

  const hasCompetitors = competitors.length > 0 || totalCompetitors > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Users size={24} color="#6366F1" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Fleet</Text>
          <Text style={styles.subtitle}>
            {fleetName || 'Competitors & registration'}
          </Text>
        </View>
        {totalCompetitors > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalCompetitors}</Text>
          </View>
        )}
      </View>

      {hasCompetitors ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Registration Status */}
          {isRegistered !== undefined && (
            <View style={[
              styles.registrationCard,
              isRegistered ? styles.registeredCard : styles.notRegisteredCard
            ]}>
              {isRegistered ? (
                <CheckCircle size={20} color="#059669" />
              ) : (
                <PlusCircle size={20} color="#6366F1" />
              )}
              <View style={styles.registrationContent}>
                <Text style={[
                  styles.registrationStatus,
                  isRegistered ? styles.registeredText : styles.notRegisteredText
                ]}>
                  {isRegistered ? 'You\'re Registered' : 'Not Registered Yet'}
                </Text>
                <Text style={styles.registrationSubtext}>
                  {isRegistered
                    ? 'You\'re on the start list for this race'
                    : 'Register to join this race'}
                </Text>
              </View>
              {!isRegistered && (
                <TouchableOpacity style={styles.registerButton}>
                  <Text style={styles.registerButtonText}>Join</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Users size={20} color="#6366F1" />
              <Text style={styles.statValue}>{totalCompetitors}</Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statCard}>
              <CheckCircle size={20} color="#22C55E" />
              <Text style={styles.statValue}>{confirmedCount}</Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
          </View>

          {/* Competitors List */}
          {competitors.length > 0 && (
            <View style={styles.competitorsSection}>
              <Text style={styles.sectionTitle}>Competitors</Text>
              <View style={styles.competitorsList}>
                {competitors.slice(0, 10).map((competitor, index) => (
                  <View key={competitor.id} style={styles.competitorRow}>
                    <View style={styles.competitorRank}>
                      {competitor.rank ? (
                        <Text style={styles.rankText}>{competitor.rank}</Text>
                      ) : (
                        <User size={16} color="#9CA3AF" />
                      )}
                    </View>
                    <View style={styles.competitorInfo}>
                      <Text style={styles.competitorName}>{competitor.name}</Text>
                      {competitor.boatName && (
                        <Text style={styles.boatName}>{competitor.boatName}</Text>
                      )}
                    </View>
                    {competitor.sailNumber && (
                      <View style={styles.sailNumberBadge}>
                        <Text style={styles.sailNumber}>{competitor.sailNumber}</Text>
                      </View>
                    )}
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(competitor.status) }
                    ]} />
                  </View>
                ))}
              </View>
              {competitors.length > 10 && (
                <Text style={styles.moreText}>
                  +{competitors.length - 10} more sailors
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Sailboat size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No Competitors Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to register for this race!
          </Text>
          <TouchableOpacity style={styles.emptyAction}>
            <PlusCircle size={16} color="#FFFFFF" />
            <Text style={styles.emptyActionText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },

  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    gap: 16,
  },

  // Registration Card
  registrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  registeredCard: {
    backgroundColor: '#D1FAE5',
  },
  notRegisteredCard: {
    backgroundColor: '#EEF2FF',
  },
  registrationContent: {
    flex: 1,
  },
  registrationStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  registeredText: {
    color: '#059669',
  },
  notRegisteredText: {
    color: '#6366F1',
  },
  registrationSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  registerButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Competitors Section
  competitorsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  competitorsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
  },
  competitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  competitorRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  competitorInfo: {
    flex: 1,
  },
  competitorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  boatName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sailNumberBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sailNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    fontVariant: ['tabular-nums'],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
});

export default FleetCard;
