/**
 * Global Club Directory Detail Screen
 *
 * Shows details of a club from the global directory.
 * Allows users to:
 * - View club information
 * - Join the club
 * - Claim the club (if unclaimed)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Globe,
  Calendar,
  Users,
  CheckCircle,
  Building2,
  Sailboat,
  ExternalLink,
  Flag,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { ClubDiscoveryService, GlobalClubResult } from '@/services/ClubDiscoveryService';
import { ClaimClubModal } from '@/components/club/ClaimClubModal';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

export default function GlobalClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showClaimModal, setShowClaimModal] = useState(false);

  // Fetch club details
  const { data: club, isLoading, error } = useQuery({
    queryKey: ['global-club', id],
    queryFn: () => ClubDiscoveryService.getGlobalClub(id!),
    enabled: !!id,
  });

  // Check if user is a member
  const { data: userClubs } = useQuery({
    queryKey: ['user-global-clubs', user?.id],
    queryFn: () => ClubDiscoveryService.getUserGlobalClubs(user!.id),
    enabled: !!user?.id,
  });

  const isMember = userClubs?.some((c) => c.id === id);

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: () => ClubDiscoveryService.joinGlobalClub(user!.id, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-global-clubs', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['global-club', id] });
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: () => ClubDiscoveryService.leaveGlobalClub(user!.id, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-global-clubs', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['global-club', id] });
    },
  });

  const handleToggleMembership = useCallback(() => {
    if (isMember) {
      Alert.alert(
        'Leave Club',
        `Are you sure you want to leave ${club?.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => leaveMutation.mutate(),
          },
        ]
      );
    } else {
      joinMutation.mutate();
    }
  }, [isMember, club?.name, joinMutation, leaveMutation]);

  const handleClaimClub = useCallback(() => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to claim this club.');
      return;
    }
    setShowClaimModal(true);
  }, [user]);

  const handleClaimSuccess = useCallback(
    (platformClubId: string) => {
      setShowClaimModal(false);
      queryClient.invalidateQueries({ queryKey: ['global-club', id] });
      // Navigate to the new platform club
      router.replace(`/club/${platformClubId}`);
    },
    [queryClient, id, router]
  );

  const handleOpenWebsite = useCallback(() => {
    if (club?.website) {
      Linking.openURL(club.website);
    }
  }, [club?.website]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  if (error || !club) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Club not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const location = [club.city, club.region, club.country].filter(Boolean).join(', ');

  return (
    <>
      <Stack.Screen
        options={{
          title: club.shortName || club.name,
          headerBackTitle: 'Search',
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {club.logoUrl ? (
              <View style={styles.logo}>
                <Text style={styles.logoText}>
                  {club.shortName || club.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Building2 size={32} color={IOS_COLORS.white} />
              </View>
            )}
          </View>

          <Text style={styles.clubName}>{club.name}</Text>
          {club.shortName && <Text style={styles.shortName}>{club.shortName}</Text>}

          {/* Verified badge */}
          {club.verified && (
            <View style={styles.verifiedBadge}>
              <CheckCircle size={14} color={IOS_COLORS.systemGreen} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          {/* Claimed status */}
          {club.isClaimed && (
            <View style={styles.claimedBadge}>
              <Flag size={14} color={IOS_COLORS.systemBlue} />
              <Text style={styles.claimedText}>On RegattaFlow</Text>
            </View>
          )}
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfo}>
          {location && (
            <View style={styles.infoItem}>
              <MapPin size={16} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.infoText}>{location}</Text>
            </View>
          )}
          {club.establishedYear && (
            <View style={styles.infoItem}>
              <Calendar size={16} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.infoText}>Est. {club.establishedYear}</Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Users size={16} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.infoText}>
              {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {club.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{club.description}</Text>
          </View>
        )}

        {/* Typical Classes */}
        {club.typicalClasses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classes Sailed</Text>
            <View style={styles.tagContainer}>
              {club.typicalClasses.map((cls, index) => (
                <View key={index} style={styles.tag}>
                  <Sailboat size={12} color={IOS_COLORS.systemBlue} />
                  <Text style={styles.tagText}>{cls}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Facilities */}
        {club.facilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities</Text>
            <View style={styles.tagContainer}>
              {club.facilities.map((facility, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>
                    {facility.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Website */}
        {club.website && (
          <Pressable style={styles.websiteButton} onPress={handleOpenWebsite}>
            <Globe size={18} color={IOS_COLORS.systemBlue} />
            <Text style={styles.websiteText}>Visit Website</Text>
            <ExternalLink size={14} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Join/Leave Button */}
          <Pressable
            style={[
              styles.actionButton,
              isMember ? styles.actionButtonSecondary : styles.actionButtonPrimary,
            ]}
            onPress={handleToggleMembership}
            disabled={joinMutation.isPending || leaveMutation.isPending}
          >
            {joinMutation.isPending || leaveMutation.isPending ? (
              <ActivityIndicator size="small" color={isMember ? IOS_COLORS.systemBlue : IOS_COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.actionButtonText,
                  isMember ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary,
                ]}
              >
                {isMember ? 'Leave Club' : 'Join Club'}
              </Text>
            )}
          </Pressable>

          {/* Claim Button (only for unclaimed clubs) */}
          {!club.isClaimed && (
            <Pressable style={styles.claimButton} onPress={handleClaimClub}>
              <Flag size={18} color={IOS_COLORS.systemOrange} />
              <Text style={styles.claimButtonText}>Claim This Club</Text>
            </Pressable>
          )}
        </View>

        {/* Claim explanation */}
        {!club.isClaimed && (
          <View style={styles.claimExplanation}>
            <Text style={styles.claimExplanationTitle}>Are you a club administrator?</Text>
            <Text style={styles.claimExplanationText}>
              Claim this club to manage it on RegattaFlow. You'll be able to create races,
              manage members, and publish results.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Claim Modal */}
      <ClaimClubModal
        visible={showClaimModal}
        club={club}
        onClose={() => setShowClaimModal(false)}
        onSuccess={handleClaimSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  content: {
    padding: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.xxxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: IOS_SPACING.xl,
  },
  errorText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.lg,
  },
  backButton: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.md,
  },
  backButtonText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.white,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: IOS_SPACING.xl,
  },
  logoContainer: {
    marginBottom: IOS_SPACING.md,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: IOS_COLORS.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    backgroundColor: IOS_COLORS.systemGray3,
  },
  logoText: {
    ...IOS_TYPOGRAPHY.title1,
    color: IOS_COLORS.white,
    fontWeight: '700',
  },
  clubName: {
    ...IOS_TYPOGRAPHY.title2,
    color: IOS_COLORS.label,
    textAlign: 'center',
    fontWeight: '700',
  },
  shortName: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    backgroundColor: IOS_COLORS.systemGreen + '20',
    borderRadius: IOS_RADIUS.full,
  },
  verifiedText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemGreen,
    fontWeight: '600',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: IOS_SPACING.xs,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    backgroundColor: IOS_COLORS.systemBlue + '20',
    borderRadius: IOS_RADIUS.full,
  },
  claimedText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  quickInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.secondaryLabel,
  },
  section: {
    marginBottom: IOS_SPACING.xl,
  },
  sectionTitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: IOS_SPACING.sm,
  },
  description: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: IOS_RADIUS.full,
  },
  tagText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.label,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.md,
    marginBottom: IOS_SPACING.xl,
  },
  websiteText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemBlue,
  },
  actions: {
    gap: IOS_SPACING.md,
    marginBottom: IOS_SPACING.lg,
  },
  actionButton: {
    paddingVertical: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  actionButtonPrimary: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  actionButtonSecondary: {
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  actionButtonText: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: IOS_COLORS.white,
  },
  actionButtonTextSecondary: {
    color: IOS_COLORS.systemBlue,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemOrange,
  },
  claimButtonText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemOrange,
    fontWeight: '600',
  },
  claimExplanation: {
    padding: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.systemOrange + '10',
    borderRadius: IOS_RADIUS.md,
  },
  claimExplanationTitle: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.systemOrange,
    fontWeight: '600',
    marginBottom: IOS_SPACING.xs,
  },
  claimExplanationText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});
