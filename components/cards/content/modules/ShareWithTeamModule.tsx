/**
 * ShareWithTeamModule
 *
 * Pre-race sharing module that allows sailors to share their race preparation
 * with their coach and crew members.
 */

import React, { useState, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Share2, Check, User, Users, ChevronRight } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useTeamSharing } from '@/hooks/useTeamSharing';
import { UnifiedSharingSheet } from '@/components/sharing/UnifiedSharingSheet';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';
import type { ShareableContent, PreRaceShareContent } from '@/components/sharing/types';

interface ShareWithTeamModuleProps extends ContentModuleProps<CardRaceData> {}

/**
 * Share with Team content module
 */
function ShareWithTeamModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: ShareWithTeamModuleProps) {
  const { user } = useAuth();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [sharingWithCoach, setSharingWithCoach] = useState(false);

  // Get boat class ID from race data
  const boatClassId = (race.class_id as string) || (race.boat_class_id as string) || '';
  const boatClassObj = race.boat_class as { name?: string } | undefined;
  const boatClassName = race.boatClass || boatClassObj?.name || '';

  const {
    primaryCoach,
    primaryCrew,
    loading,
    hasSharedWith,
    shareWithCoach,
  } = useTeamSharing({
    sailorId: user?.id || '',
    raceId: race.id,
    raceName: race.name,
    boatClassId,
  });

  // Build shareable content from race data
  const shareableContent = useMemo((): ShareableContent => {
    const preRace: PreRaceShareContent = {
      raceInfo: {
        id: race.id,
        name: race.name,
        date: race.date,
        venue: race.venue,
        boatClass: boatClassName,
        weather: race.wind
          ? {
              windSpeed: race.wind.speedMin,
              windSpeedMax: race.wind.speedMax,
              windDirection: race.wind.direction,
            }
          : undefined,
      },
      // Strategy and other fields would come from sailor's preparation data
      // For now, we include what's available from the race
    };

    return {
      context: 'pre-race',
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      venue: race.venue,
      boatClass: boatClassName,
      preRace,
    };
  }, [race, boatClassName]);

  if (isCollapsed) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading team...</Text>
        </View>
      </View>
    );
  }

  // Check if no team available
  const hasTeam = primaryCoach || primaryCrew.length > 0;
  if (!hasTeam) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Users size={24} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyText}>No coach or crew connected</Text>
          <Text style={styles.emptySubtext}>
            Connect with a coach or add crew to share race prep
          </Text>
        </View>
      </View>
    );
  }

  const coachAlreadyShared = primaryCoach && hasSharedWith(primaryCoach.id, 'coach');

  const handleShareWithCoach = async () => {
    if (!primaryCoach || sharingWithCoach) return;
    setSharingWithCoach(true);
    await shareWithCoach(shareableContent);
    setSharingWithCoach(false);
  };

  const handleOpenShareSheet = () => {
    setShowShareSheet(true);
  };

  const handleCloseShareSheet = () => {
    setShowShareSheet(false);
  };

  return (
    <View style={styles.container}>
      {/* Coach Section */}
      {primaryCoach && (
        <Pressable
          style={({ pressed }) => [
            styles.recipientRow,
            coachAlreadyShared && styles.recipientRowShared,
            pressed && !coachAlreadyShared && styles.recipientRowPressed,
          ]}
          onPress={handleShareWithCoach}
          disabled={coachAlreadyShared || sharingWithCoach}
        >
          <View style={styles.avatarContainer}>
            <User size={20} color={IOS_COLORS.blue} />
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{primaryCoach.display_name}</Text>
            <Text style={styles.recipientRole}>Coach</Text>
          </View>
          {sharingWithCoach ? (
            <ActivityIndicator size="small" color={IOS_COLORS.blue} />
          ) : coachAlreadyShared ? (
            <View style={styles.sharedBadge}>
              <Check size={14} color={IOS_COLORS.green} />
              <Text style={styles.sharedText}>Shared</Text>
            </View>
          ) : (
            <View style={styles.shareButton}>
              <Share2 size={16} color="white" />
              <Text style={styles.shareButtonText}>Share</Text>
            </View>
          )}
        </Pressable>
      )}

      {/* Crew Section */}
      {primaryCrew.length > 0 && (
        <View style={styles.crewSection}>
          <Text style={styles.sectionLabel}>
            Crew ({primaryCrew.length})
          </Text>
          <View style={styles.crewAvatars}>
            {primaryCrew.slice(0, 4).map((crew) => {
              const alreadyShared = hasSharedWith(crew.id, 'crew');
              return (
                <View
                  key={crew.id}
                  style={[
                    styles.crewAvatar,
                    alreadyShared && styles.crewAvatarShared,
                  ]}
                >
                  <Text style={styles.crewInitial}>
                    {crew.name.charAt(0).toUpperCase()}
                  </Text>
                  {alreadyShared && (
                    <View style={styles.crewCheckmark}>
                      <Check size={10} color="white" />
                    </View>
                  )}
                </View>
              );
            })}
            {primaryCrew.length > 4 && (
              <View style={styles.crewAvatarMore}>
                <Text style={styles.crewMoreText}>+{primaryCrew.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Share All Button */}
      <Pressable
        style={({ pressed }) => [
          styles.shareAllButton,
          pressed && styles.shareAllButtonPressed,
        ]}
        onPress={handleOpenShareSheet}
      >
        <Share2 size={18} color={IOS_COLORS.blue} />
        <Text style={styles.shareAllText}>Share with Team</Text>
        <ChevronRight size={18} color={IOS_COLORS.gray3} />
      </Pressable>

      {/* Full Sharing Sheet */}
      <UnifiedSharingSheet
        visible={showShareSheet}
        onClose={handleCloseShareSheet}
        context="pre-race"
        content={shareableContent}
        sailorId={user?.id || ''}
        primaryCoachId={primaryCoach?.id}
        primaryCoachName={primaryCoach?.display_name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  emptySubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray3,
    textAlign: 'center',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
  },
  recipientRowShared: {
    backgroundColor: '#E8F5E9',
  },
  recipientRowPressed: {
    opacity: 0.7,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  recipientRole: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 1,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
  },
  sharedText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  crewSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  crewAvatars: {
    flexDirection: 'row',
    gap: 8,
  },
  crewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarShared: {
    backgroundColor: IOS_COLORS.green,
  },
  crewInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  crewCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  crewAvatarMore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.gray4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  shareAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    marginTop: 4,
  },
  shareAllButtonPressed: {
    opacity: 0.7,
  },
  shareAllText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
});

export default ShareWithTeamModule;
