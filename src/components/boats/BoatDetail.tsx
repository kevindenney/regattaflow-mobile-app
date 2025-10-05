import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BoatDetailProps {
  boat: {
    id: string;
    name: string;
    className: string;
    sailNumber?: string;
    manufacturer?: string;
    yearBuilt?: number;
    hullMaterial?: string;
    isPrimary: boolean;
    homeClub?: string;
    storageLocation?: string;
    ownership?: string;
  };
}

interface VenueConfig {
  venue: string;
  lastUsed: string;
  setup: string;
  performance: string;
}

const MOCK_VENUE_CONFIGS: VenueConfig[] = [
  {
    venue: 'Victoria Harbour (RHKYC)',
    lastUsed: 'Oct 1, 2025',
    setup: 'Medium Air Setup',
    performance: 'Avg 2.3',
  },
  {
    venue: 'Port Shelter (HHYC)',
    lastUsed: 'Sep 28, 2025',
    setup: 'Heavy Air Setup',
    performance: 'Avg 3.1',
  },
  {
    venue: 'Stanley Bay',
    lastUsed: 'Sep 20, 2025',
    setup: 'Light Air Setup',
    performance: 'Avg 4.2',
  },
];

export function BoatDetail({ boat }: BoatDetailProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Boat Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Boat Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Class</Text>
            <Text style={styles.infoValue}>{boat.className}</Text>
          </View>
          {boat.sailNumber && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sail Number</Text>
              <Text style={styles.infoValue}>{boat.sailNumber}</Text>
            </View>
          )}
          {boat.manufacturer && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Manufacturer</Text>
              <Text style={styles.infoValue}>{boat.manufacturer}</Text>
            </View>
          )}
          {boat.yearBuilt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Year Built</Text>
              <Text style={styles.infoValue}>{boat.yearBuilt}</Text>
            </View>
          )}
          {boat.hullMaterial && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Hull Material</Text>
              <Text style={styles.infoValue}>{boat.hullMaterial}</Text>
            </View>
          )}
          {boat.ownership && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ownership</Text>
              <Text style={styles.infoValue}>{boat.ownership}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Location & Storage */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location & Storage</Text>
        <View style={styles.locationInfo}>
          {boat.homeClub && (
            <View style={styles.locationItem}>
              <Ionicons name="business" size={20} color="#3B82F6" />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Home Club</Text>
                <Text style={styles.locationValue}>{boat.homeClub}</Text>
              </View>
            </View>
          )}
          {boat.storageLocation && (
            <View style={styles.locationItem}>
              <Ionicons name="location" size={20} color="#3B82F6" />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Storage</Text>
                <Text style={styles.locationValue}>{boat.storageLocation}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Performance Profile */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Performance Profile</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3.2</Text>
            <Text style={styles.statLabel}>Avg Finish</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={12} color="#10B981" />
              <Text style={styles.trendText}>+0.5</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>28%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={12} color="#10B981" />
              <Text style={styles.trendText}>+5%</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>64</Text>
            <Text style={styles.statLabel}>Total Races</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="remove" size={12} color="#64748B" />
              <Text style={styles.trendText}>-</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Venue Configurations */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Venue Configurations</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardSubtitle}>
          Quick access to venue-specific setups and performance
        </Text>
        {MOCK_VENUE_CONFIGS.map((config, index) => (
          <TouchableOpacity key={index} style={styles.venueCard}>
            <View style={styles.venueHeader}>
              <Ionicons name="location" size={18} color="#3B82F6" />
              <Text style={styles.venueName}>{config.venue}</Text>
            </View>
            <View style={styles.venueDetails}>
              <View style={styles.venueDetail}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.venueDetailText}>{config.lastUsed}</Text>
              </View>
              <View style={styles.venueDetail}>
                <Ionicons name="settings-outline" size={14} color="#64748B" />
                <Text style={styles.venueDetailText}>{config.setup}</Text>
              </View>
              <View style={styles.venueDetail}>
                <Ionicons name="trophy-outline" size={14} color="#64748B" />
                <Text style={styles.venueDetailText}>{config.performance}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="fish" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>View Sails</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="git-network" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Rigging</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="build" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Maintenance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="stats-chart" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Performance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    marginTop: -8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    minWidth: '45%',
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  locationInfo: {
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    flex: 1,
    gap: 2,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  venueCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  venueDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  venueDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueDetailText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
