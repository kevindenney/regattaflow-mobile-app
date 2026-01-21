/**
 * Fleet Competitors Card
 * Shows other boats/sailors competing in this race
 * Enables fleet connectivity and coordination
 * Now shows ALL matching fleets and includes race registration
 */

import { colors, Spacing } from '@/constants/designSystem';
import { useAuth } from '@/providers/AuthProvider';
import { Fleet, FleetDiscoveryService } from '@/services/FleetDiscoveryService';
import { raceParticipantService } from '@/services/RaceParticipantService';
import { supabase } from '@/services/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  clubId?: string;
  classId?: string;
  onJoinFleet?: (fleetId: string) => void;
  onRegister?: () => void;
}

export function FleetRacersCard({ raceId, venueId, clubId, classId, onJoinFleet, onRegister }: FleetRacersCardProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  // Now stores ALL available fleets, not just one
  const [availableFleets, setAvailableFleets] = useState<Fleet[]>([]);
  const [userFleetMemberships, setUserFleetMemberships] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedView, setExpandedView] = useState(false);
  const [showFleetsExpanded, setShowFleetsExpanded] = useState(false);
  
  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeringRace, setRegisteringRace] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    boatName: '',
    sailNumber: '',
    status: 'registered' as 'registered' | 'confirmed' | 'tentative',
    visibility: 'public' as 'public' | 'fleet' | 'private',
    fleetId: undefined as string | undefined,
  });

  useEffect(() => {
    loadAvailableFleets();
  }, [classId, venueId, clubId, user?.id]);

  useEffect(() => {
    loadParticipants();
    checkUserRegistration();
  }, [raceId, user?.id]);

  const loadParticipants = async () => {
    if (!user?.id || !raceId) {
      setLoading(false);
      setParticipants([]);
      return;
    }

    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<[]>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout loading competitors after 10 seconds')), 10000);
      });
      
      const competitorsPromise = raceParticipantService.getRaceCompetitors(
        raceId,
        user.id,
        userFleetMemberships.size > 0
      );
      
      const competitors = await Promise.race([competitorsPromise, timeoutPromise]);

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
    } catch (error: any) {
      console.error('[FleetRacersCard] Error loading participants:', error);
      console.error('[FleetRacersCard] Error details:', {
        message: error?.message,
        name: error?.name,
        raceId,
        userId: user?.id,
      });
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const checkUserRegistration = async () => {
    if (!user?.id || !raceId) return;
    
    try {
      const { data } = await supabase
        .from('race_participants')
        .select('id')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsRegistered(!!data);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const loadAvailableFleets = async () => {
    if (!user?.id) return;

    try {
      let fleets: Fleet[] = [];
      const memberships = new Set<string>();

      // 1. First try: Get fleets matching the boat class
      if (classId) {
        const classFleets = await FleetDiscoveryService.discoverFleets(
          undefined, // venueId
          classId,   // classId
          10         // limit
        );
        fleets = [...classFleets];
      }

      // 2. Second try: Get fleets from the same club
      if (clubId && fleets.length < 5) {
        try {
          const clubFleets = await FleetDiscoveryService.discoverFleetsByClub(clubId, 10);
          // Add club fleets that aren't already in the list
          clubFleets.forEach(cf => {
            if (!fleets.find(f => f.id === cf.id)) {
              fleets.push(cf);
            }
          });
        } catch (e) {
          console.debug('[FleetRacersCard] Could not load club fleets:', e);
        }
      }

      // 3. Third try: Get fleets from the same venue
      if (venueId && fleets.length < 5) {
        try {
          const venueFleets = await FleetDiscoveryService.discoverFleetsByVenue(venueId, 10);
          // Add venue fleets that aren't already in the list
          venueFleets.forEach(vf => {
            if (!fleets.find(f => f.id === vf.id)) {
              fleets.push(vf);
            }
          });
        } catch (e) {
          console.debug('[FleetRacersCard] Could not load venue fleets:', e);
        }
      }

      // Check membership for each fleet
      for (const fleet of fleets) {
        try {
          const isMember = await FleetDiscoveryService.isMember(user.id, fleet.id);
          if (isMember) {
            memberships.add(fleet.id);
          }
        } catch (e) {
          // Ignore membership check errors
        }
      }

      setAvailableFleets(fleets);
      setUserFleetMemberships(memberships);
    } catch (error) {
      console.error('Error loading fleets:', error);
    }
  };

  const handleJoinFleet = async (fleet: Fleet) => {
    if (!user?.id) return;

    try {
      await FleetDiscoveryService.joinFleet(user.id, fleet.id, true);
      setUserFleetMemberships(prev => new Set([...prev, fleet.id]));
      Alert.alert('Success', `You've joined ${fleet.name}!`);
      onJoinFleet?.(fleet.id);
    } catch (error) {
      console.error('Error joining fleet:', error);
      Alert.alert('Error', 'Failed to join fleet');
    }
  };

  const handleRegisterForRace = async () => {
    if (!user?.id || !raceId) return;

    try {
      setRegisteringRace(true);

      const { error } = await supabase
        .from('race_participants')
        .insert({
          regatta_id: raceId,
          user_id: user.id,
          boat_name: registrationForm.boatName || null,
          sail_number: registrationForm.sailNumber || null,
          status: registrationForm.status,
          visibility: registrationForm.visibility,
          fleet_id: registrationForm.fleetId || null,
        });

      if (error) throw error;

      setIsRegistered(true);
      setShowRegisterModal(false);
      Alert.alert('Success', 'You are now registered for this race!');
      loadParticipants(); // Refresh the list
      onRegister?.();
    } catch (error: any) {
      console.error('Error registering for race:', error);
      Alert.alert('Error', error.message || 'Failed to register for race');
    } finally {
      setRegisteringRace(false);
    }
  };

  const handleOpenWhatsApp = (fleet: Fleet) => {
    if (!fleet.whatsapp_link) return;

    Linking.openURL(fleet.whatsapp_link).catch(() => {
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

  const isAnyFleetMember = userFleetMemberships.size > 0;
  const visibleParticipants = participants.filter((p) => p.visibility === 'public' || isAnyFleetMember);
  const confirmedCount = visibleParticipants.filter((p) => p.status === 'confirmed').length;
  const displayParticipants = expandedView ? visibleParticipants : visibleParticipants.slice(0, 3);
  const displayFleets = showFleetsExpanded ? availableFleets : availableFleets.slice(0, 2);

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

      {/* Race Registration Button */}
      {!isRegistered ? (
        <View style={styles.registrationSection}>
          <View style={styles.registrationBenefits}>
            <Text style={styles.registrationTitle}>Register to Unlock:</Text>
            <View style={styles.benefitsGrid}>
              <View style={styles.benefitChip}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
                <Text style={styles.benefitChipText}>Competitor insights</Text>
              </View>
              <View style={styles.benefitChip}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
                <Text style={styles.benefitChipText}>Race check-in</Text>
              </View>
              <View style={styles.benefitChip}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
                <Text style={styles.benefitChipText}>Fleet networking</Text>
              </View>
              <View style={styles.benefitChip}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
                <Text style={styles.benefitChipText}>Tactical analysis</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => setShowRegisterModal(true)}
          >
            <Ionicons name="add-circle" size={20} color={colors.background.primary} />
            <Text style={styles.registerButtonText}>Register for This Race</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.registeredBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
          <Text style={styles.registeredText}>You're registered for this race</Text>
        </View>
      )}

      {/* All Available Fleets */}
      {availableFleets.length > 0 && (
        <View style={styles.fleetsSection}>
          <Text style={styles.fleetsSectionTitle}>
            {availableFleets.length} Fleet{availableFleets.length !== 1 ? 's' : ''} Available
          </Text>
          
          {displayFleets.map((fleet) => {
            const isMember = userFleetMemberships.has(fleet.id);
            return (
              <View key={fleet.id} style={styles.fleetBanner}>
                <View style={styles.fleetBannerContent}>
                  <MaterialCommunityIcons name="account-group" size={20} color={colors.primary[600]} />
                  <View style={styles.fleetBannerText}>
                    <Text style={styles.fleetBannerTitle}>{fleet.name}</Text>
                    <Text style={styles.fleetBannerSubtitle}>
                      {fleet.member_count || 0} members
                      {fleet.boat_class?.name && ` • ${fleet.boat_class.name}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.fleetActions}>
                  {isMember ? (
                    <>
                      <View style={styles.memberBadgeSmall}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success[600]} />
                        <Text style={styles.memberTextSmall}>Joined</Text>
                      </View>
                      {fleet.whatsapp_link && (
                        <TouchableOpacity 
                          style={styles.whatsappButtonSmall}
                          onPress={() => handleOpenWhatsApp(fleet)}
                        >
                          <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={styles.joinFleetButton} 
                      onPress={() => handleJoinFleet(fleet)}
                    >
                      <Ionicons name="add-circle" size={16} color={colors.background.primary} />
                      <Text style={styles.joinFleetButtonText}>Join</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Show More Fleets */}
          {availableFleets.length > 2 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowFleetsExpanded(!showFleetsExpanded)}
            >
              <Text style={styles.showMoreText}>
                {showFleetsExpanded
                  ? 'Show Less Fleets'
                  : `Show ${availableFleets.length - 2} More Fleets`}
              </Text>
              <Ionicons
                name={showFleetsExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary[600]}
              />
            </TouchableOpacity>
          )}
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

          {/* Show More/Less Participants */}
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

      {/* Registration Modal */}
      <Modal
        visible={showRegisterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register for Race</Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Boat Name (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Sea Breeze"
                value={registrationForm.boatName}
                onChangeText={(text) => setRegistrationForm(prev => ({ ...prev, boatName: text }))}
              />

              <Text style={styles.inputLabel}>Sail Number (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., HKG 1234"
                value={registrationForm.sailNumber}
                onChangeText={(text) => setRegistrationForm(prev => ({ ...prev, sailNumber: text }))}
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {(['confirmed', 'registered', 'tentative'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      registrationForm.status === status && styles.statusOptionSelected
                    ]}
                    onPress={() => setRegistrationForm(prev => ({ ...prev, status }))}
                  >
                    <Ionicons 
                      name={getStatusIcon(status)} 
                      size={16} 
                      color={registrationForm.status === status ? colors.background.primary : getStatusColor(status)} 
                    />
                    <Text style={[
                      styles.statusOptionText,
                      registrationForm.status === status && styles.statusOptionTextSelected
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Visibility</Text>
              <View style={styles.visibilityOptions}>
                {(['public', 'fleet', 'private'] as const).map((visibility) => (
                  <TouchableOpacity
                    key={visibility}
                    style={[
                      styles.visibilityOption,
                      registrationForm.visibility === visibility && styles.visibilityOptionSelected
                    ]}
                    onPress={() => setRegistrationForm(prev => ({ ...prev, visibility }))}
                  >
                    <Ionicons 
                      name={visibility === 'public' ? 'globe' : visibility === 'fleet' ? 'people' : 'lock-closed'} 
                      size={16} 
                      color={registrationForm.visibility === visibility ? colors.background.primary : colors.text.secondary} 
                    />
                    <Text style={[
                      styles.visibilityOptionText,
                      registrationForm.visibility === visibility && styles.visibilityOptionTextSelected
                    ]}>
                      {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {availableFleets.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Racing with Fleet (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fleetSelector}>
                    <TouchableOpacity
                      style={[
                        styles.fleetOption,
                        !registrationForm.fleetId && styles.fleetOptionSelected
                      ]}
                      onPress={() => setRegistrationForm(prev => ({ ...prev, fleetId: undefined }))}
                    >
                      <Text style={[
                        styles.fleetOptionText,
                        !registrationForm.fleetId && styles.fleetOptionTextSelected
                      ]}>None</Text>
                    </TouchableOpacity>
                    {availableFleets.map((fleet) => (
                      <TouchableOpacity
                        key={fleet.id}
                        style={[
                          styles.fleetOption,
                          registrationForm.fleetId === fleet.id && styles.fleetOptionSelected
                        ]}
                        onPress={() => setRegistrationForm(prev => ({ ...prev, fleetId: fleet.id }))}
                      >
                        <Text style={[
                          styles.fleetOptionText,
                          registrationForm.fleetId === fleet.id && styles.fleetOptionTextSelected
                        ]}>{fleet.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowRegisterModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, registeringRace && styles.submitButtonDisabled]}
                onPress={handleRegisterForRace}
                disabled={registeringRace}
              >
                <Text style={styles.submitButtonText}>
                  {registeringRace ? 'Registering...' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
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
  // Registration button styles
  registrationSection: {
    marginTop: 12,
    gap: 12,
  },
  registrationBenefits: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    padding: 12,
  },
  registrationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  benefitChipText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background.primary,
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success[50],
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  registeredText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success[700],
  },
  // Fleets section styles
  fleetsSection: {
    marginBottom: Spacing.md,
  },
  fleetsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  memberBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.success[50],
    borderRadius: 4,
  },
  memberTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success[700],
  },
  whatsappButtonSmall: {
    padding: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    marginLeft: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalBody: {
    padding: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: colors.text.primary,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  statusOptionTextSelected: {
    color: colors.background.primary,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  visibilityOptionSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  visibilityOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  visibilityOptionTextSelected: {
    color: colors.background.primary,
  },
  fleetSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  fleetOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    marginRight: Spacing.sm,
  },
  fleetOptionSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  fleetOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  fleetOptionTextSelected: {
    color: colors.background.primary,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  submitButton: {
    flex: 2,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background.primary,
  },
});
