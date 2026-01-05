/**
 * Fleet Detail Card
 * Compact view of fleet/competitor information for the detail zone
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

interface Competitor {
  id: string;
  name: string;
  boatName?: string;
  sailNumber?: string;
  status: 'confirmed' | 'registered' | 'tentative';
}

interface FleetDetailCardProps {
  raceId: string;
  totalCompetitors?: number;
  confirmedCount?: number;
  competitors?: Competitor[];
  fleetName?: string;
  isRegistered?: boolean;
  onPress?: () => void;
  onRegister?: () => void;
}

export function FleetDetailCard({
  raceId,
  totalCompetitors = 0,
  confirmedCount = 0,
  competitors,
  fleetName,
  isRegistered,
  onPress,
  onRegister,
}: FleetDetailCardProps) {
  const displayCompetitors = competitors?.slice(0, 3) || [];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="sail-boat" size={18} color="#6366F1" />
        </View>
        <Text style={styles.headerTitle}>Fleet</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalCompetitors}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
      </View>

      <View style={styles.content}>
        {/* Registration Status */}
        {isRegistered !== undefined && (
          <View style={[styles.registrationBadge, isRegistered ? styles.registeredBadge : styles.notRegisteredBadge]}>
            <Ionicons
              name={isRegistered ? "checkmark-circle" : "add-circle"}
              size={14}
              color={isRegistered ? "#059669" : "#6366F1"}
            />
            <Text style={[styles.registrationText, isRegistered ? styles.registeredText : styles.notRegisteredText]}>
              {isRegistered ? 'Registered' : 'Not Registered'}
            </Text>
            {!isRegistered && onRegister && (
              <TouchableOpacity style={styles.registerButton} onPress={onRegister}>
                <Text style={styles.registerButtonText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.statValue}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>confirmed</Text>
          </View>
          {fleetName && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="account-group" size={14} color="#6366F1" />
              <Text style={styles.statValue}>{fleetName}</Text>
            </View>
          )}
        </View>

        {/* Competitors Preview */}
        {displayCompetitors.length > 0 && (
          <View style={styles.competitorsPreview}>
            {displayCompetitors.map((competitor) => (
              <View key={competitor.id} style={styles.competitorRow}>
                <MaterialCommunityIcons name="account-circle" size={20} color="#CBD5E1" />
                <Text style={styles.competitorName} numberOfLines={1}>
                  {competitor.name}
                </Text>
                {competitor.sailNumber && (
                  <Text style={styles.sailNumber}>{competitor.sailNumber}</Text>
                )}
              </View>
            ))}
            {totalCompetitors > 3 && (
              <Text style={styles.moreText}>+{totalCompetitors - 3} more sailors</Text>
            )}
          </View>
        )}

        {totalCompetitors === 0 && (
          <Text style={styles.emptyText}>No competitors registered yet</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  content: {
    gap: 10,
  },
  registrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  registeredBadge: {
    backgroundColor: '#D1FAE5',
  },
  notRegisteredBadge: {
    backgroundColor: '#EEF2FF',
  },
  registrationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  registeredText: {
    color: '#059669',
  },
  notRegisteredText: {
    color: '#6366F1',
  },
  registerButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  registerButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  competitorsPreview: {
    gap: 6,
    marginTop: 4,
  },
  competitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  competitorName: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
  },
  sailNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'monospace',
  },
  moreText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginLeft: 28,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
