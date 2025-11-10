/**
 * Fleet Competitors Card
 * Shows other boats/sailors competing in this race
 * Enables fleet connectivity and coordination
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, Spacing } from '@/constants/designSystem';
import { FleetDiscoveryService, Fleet } from '@/services/FleetDiscoveryService';
import { raceParticipantService, ParticipantWithProfile } from '@/services/RaceParticipantService';
import { useAuth } from '@/providers/AuthProvider';

interface RaceParticipant {
  id: string;
  name: string;
  boatName?: string;
  sailNumber?: string;
  fleetId?: string;
  status: 'registered' | 'confirmed' | 'tentative';
  visibility: 'public' | 'fleet' | 'private';
}

interface FleetRacersCardProps {
  raceId: string;
  venueId?: string;
  classId?: string;
  onJoinFleet?: (fleetId: string) => void;
}

export function FleetRacersCard({ raceId, venueId, classId, onJoinFleet }: FleetRacersCardProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [suggestedFleet, setSuggestedFleet] = useState<Fleet | null>(null);
  const [isFleetMember, setIsFleetMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    loadParticipants();
    loadSuggestedFleet();
  }, [raceId, classId, user?.id]);

  const loadParticipants = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch real competitors from database
      const competitors = await raceParticipantService.getRaceCompetitors(
        raceId,
        user.id,
        isFleetMember
      );

      // Map to local RaceParticipant interface
      const mapped: RaceParticipant[] = competitors.map(c => ({
        id: c.id,
        name: c.profile?.name || 'Unknown Sailor',
        boatName: c.boatName,
        sailNumber: c.sailNumber,
        fleetId: c.fleetId,
        status: c.status as 'registered' | 'confirmed' | 'tentative',
        visibility: c.visibility,
      }));

      setParticipants(mapped);
    } catch (error) {
      console.error('Error loading participants:', error);
      // Fallback to empty array on error
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestedFleet = async () => {
    if (!user?.id || !classId) return;

    try {
      // Get fleets for this class
      const fleets = await FleetDiscoveryService.discoverFleets({
        classId,
        visibility: 'public',
      });

      if (fleets.length > 0) {
        const fleet = fleets[0]; // Use the first matching fleet
        setSuggestedFleet(fleet);

        // Check if user is already a member
        const isMember = await FleetDiscoveryService.isMember(user.id, fleet.id);
        setIsFleetMember(isMember);
      }
    } catch (error) {
      console.error('Error loading fleet:', error);
    }
  };

  const handleJoinFleet = async () => {
    if (!user?.id || !suggestedFleet) return;

    try {
      await FleetDiscoveryService.joinFleet(user.id, suggestedFleet.id, true);
      setIsFleetMember(true);
      Alert.alert('Success', `You've joined ${suggestedFleet.name}!`);
      onJoinFleet?.(suggestedFleet.id);
    } catch (error) {
      console.error('Error joining fleet:', error);
      Alert.alert('Error', 'Failed to join fleet');
    }
  };

  const handleOpenWhatsApp = () => {
    if (!suggestedFleet?.whatsapp_link) return;

    Linking.openURL(suggestedFleet.whatsapp_link).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp group');
    });
  };

  const getStatusColor = (status: RaceParticipant['status']) => {
    switch (status) {
      case 'confirmed':
        return colors.success[600];
      case 'registered':
        return colors.info[600];
      case 'tentative':
        return colors.warning[600];
    }
  };

  const getStatusIcon = (status: RaceParticipant['status']) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'registered':
        return 'time';
      case 'tentative':
        return 'help-circle';
    }
  };

  const visibleParticipants = participants.filter((p) => p.visibility === 'public' || isFleetMember);
  const confirmedCount = visibleParticipants.filter((p) => p.status === 'confirmed').length;
  const displayParticipants = expandedView ? visibleParticipants : visibleParticipants.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="sail-boat" size={24} color={colors.primary[600]} />
          <Text style={styles.title}>Fleet Competitors</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{visibleParticipants.length}</Text>
        </View>
      </View>

      {/* Fleet Discovery Banner */}
      {suggestedFleet && !isFleetMember && (
        <View style={styles.fleetBanner}>
          <View style={styles.fleetBannerContent}>
            <MaterialCommunityIcons name="account-group" size={20} color={colors.primary[600]} />
            <View style={styles.fleetBannerText}>
              <Text style={styles.fleetBannerTitle}>{suggestedFleet.name}</Text>
              <Text style={styles.fleetBannerSubtitle}>
                {confirmedCount} members racing • {suggestedFleet.member_count} total members
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.joinFleetButton} onPress={handleJoinFleet}>
            <Ionicons name="add-circle" size={18} color={colors.background.primary} />
            <Text style={styles.joinFleetButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fleet Member Badge */}
      {isFleetMember && suggestedFleet && (
        <View style={styles.memberBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
          <Text style={styles.memberText}>You're a member of {suggestedFleet.name}</Text>
        </View>
      )}

      {/* Participants List */}
      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading racers...</Text>
        </View>
      ) : visibleParticipants.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-search" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No other competitors yet</Text>
          <Text style={styles.emptySubtext}>Other sailors will appear here when they register</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
            {displayParticipants.map((participant) => (
              <View key={participant.id} style={styles.participantCard}>
                <View style={styles.participantIcon}>
                  <MaterialCommunityIcons name="account-circle" size={36} color={colors.primary[300]} />
                  <View
                    style={[styles.statusIndicator, { backgroundColor: getStatusColor(participant.status) }]}
                  >
                    <Ionicons name={getStatusIcon(participant.status)} size={12} color={colors.background.primary} />
                  </View>
                </View>

                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  {participant.boatName && (
                    <View style={styles.boatInfo}>
                      <MaterialCommunityIcons name="sail-boat" size={14} color={colors.text.secondary} />
                      <Text style={styles.boatName}>{participant.boatName}</Text>
                      {participant.sailNumber && (
                        <>
                          <Text style={styles.separator}>•</Text>
                          <Text style={styles.sailNumber}>{participant.sailNumber}</Text>
                        </>
                      )}
                    </View>
                  )}
                </View>

                {participant.visibility === 'fleet' && (
                  <View style={styles.fleetOnlyBadge}>
                    <Ionicons name="lock-closed" size={12} color={colors.text.tertiary} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Show More/Less */}
          {visibleParticipants.length > 3 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setExpandedView(!expandedView)}
            >
              <Text style={styles.showMoreText}>
                {expandedView
                  ? 'Show Less'
                  : `Show ${visibleParticipants.length - 3} More`}
              </Text>
              <Ionicons
                name={expandedView ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary[600]}
              />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Fleet Actions */}
      {isFleetMember && suggestedFleet?.whatsapp_link && (
        <View style={styles.fleetActions}>
          <TouchableOpacity style={styles.whatsappButton} onPress={handleOpenWhatsApp}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.whatsappButtonText}>Fleet Group Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
          <Text style={styles.summaryText}>{confirmedCount} confirmed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="account-group" size={16} color={colors.primary[600]} />
          <Text style={styles.summaryText}>{visibleParticipants.length} total racers</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  countBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
  },
  fleetBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  fleetBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  fleetBannerText: {
    flex: 1,
  },
  fleetBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
  },
  fleetBannerSubtitle: {
    fontSize: 12,
    color: colors.primary[600],
    marginTop: 2,
  },
  joinFleetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
  },
  joinFleetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.background.primary,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success[50],
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  memberText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success[700],
  },
  loadingState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  participantsList: {
    maxHeight: 250,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  participantIcon: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  boatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boatName: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  separator: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  sailNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  fleetOnlyBadge: {
    padding: 4,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  fleetActions: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  whatsappButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.light,
  },
});
