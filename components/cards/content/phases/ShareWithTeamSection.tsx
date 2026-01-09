/**
 * ShareWithTeamSection
 *
 * Pre-race sharing section that allows sailors to share their race preparation
 * with their coach and crew members. Used in DaysBeforeContent and RaceMorningContent.
 */

import React, { useState, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Share2, Check, User, Users, ChevronRight, Send, UserPlus, GraduationCap } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';
import { useTeamSharing } from '@/hooks/useTeamSharing';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useRaceWeatherForecast } from '@/hooks/useRaceWeatherForecast';
import { UnifiedSharingSheet } from '@/components/sharing/UnifiedSharingSheet';
import { ShareChannelGrid } from '@/components/sharing/ShareChannelGrid';
import { useShareHandlers } from '@/components/sharing/hooks/useShareHandlers';
import type { ShareChannel } from '@/components/sharing/types';
import type { CardRaceData } from '@/components/cards/types';
import type { ShareableContent, PreRaceShareContent } from '@/components/sharing/types';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  teal: '#0D9488',
};

interface ShareWithTeamSectionProps {
  race: CardRaceData;
}

/**
 * Share with Team section for pre-race phases
 */
export function ShareWithTeamSection({ race }: ShareWithTeamSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [sharingWithCoach, setSharingWithCoach] = useState(false);
  const [loadingChannel, setLoadingChannel] = useState<ShareChannel | null>(null);

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

  // Load sailor's race preparation data (strategy notes, sail selection, rig setup)
  const {
    intentions,
    rigNotes,
    selectedRigPresetId,
    isLoading: prepLoading,
  } = useRacePreparation({
    raceEventId: race.id,
    autoSave: false, // Read-only for sharing
  });

  // Build venue object for weather fetching (like RaceMorningContent does)
  // The race may have venueCoordinates (from useEnrichedRaces) or a venue string
  const venueCoordinates = (race as any).venueCoordinates;
  const venueName = race.venue || 'Racing Area';
  const venueId = (race as any).venue_id || race.id;

  // Create a minimal venue object that the weather services can use
  // The RegionalWeatherService.resolveVenueLocation() looks for venue.coordinates as an object
  const venueForForecast = venueCoordinates ? {
    id: venueId,
    name: venueName,
    coordinates: {
      lat: venueCoordinates.lat,
      lng: venueCoordinates.lng,
    },
    // Also include flat properties for compatibility with various services
    coordinates_lat: String(venueCoordinates.lat),
    coordinates_lng: String(venueCoordinates.lng),
  } : null;

  // Fetch weather forecast for the race
  const { data: forecastData, loading: forecastLoading, error: forecastError } = useRaceWeatherForecast(venueForForecast, race.date, !!venueForForecast);

  // Build shareable content from race data and sailor's preparation
  const shareableContent = useMemo((): ShareableContent => {
    // Extract strategy notes from intentions
    const strategyNotes = intentions?.strategyNotes || {};

    // Build rig tuning info from intentions
    const rigTuning = intentions?.rigIntentions ? {
      preset: selectedRigPresetId || undefined,
      windRange: undefined,
      settings: intentions.rigIntentions.settings ? {
        cunningham: Object.values(intentions.rigIntentions.settings).find(s => s)?.value,
      } : undefined,
    } : undefined;

    // Get wind/tide from race data OR from fetched forecast
    const raceWindow = forecastData?.raceWindow;
    const windDir = race.wind?.direction || raceWindow?.windDirectionAtStart;
    const windMin = race.wind?.speedMin ?? raceWindow?.windAtStart;
    const windMax = race.wind?.speedMax ?? raceWindow?.windAtEnd;
    const tideState = race.tide?.state || (raceWindow?.hasTurnDuringRace ? 'turning' : undefined);
    const tideHeight = race.tide?.height ?? forecastData?.highTide?.height;

    // Build weather info from race data OR forecast
    const weather = (windDir || windMin) ? {
      windSpeed: windMin,
      windSpeedMax: windMax,
      windDirection: windDir,
      tideState: tideState as any,
      tideHeight: tideHeight,
      currentSpeed: forecastData?.currentAtRaceTime?.speed,
      currentDirection: forecastData?.currentAtRaceTime?.direction,
    } : undefined;

    // Generate AI insights from conditions
    const aiInsights: string[] = [];
    if (windDir) {
      if (windDir.includes('N')) {
        aiInsights.push('Favor right side on first beat (northerly persistents)');
      } else if (windDir.includes('E')) {
        aiInsights.push('Watch for oscillations from the east');
      } else if (windDir.includes('S')) {
        aiInsights.push('Left side may pay on southerly shift');
      }
    }
    if (windMax && windMax > 18) {
      aiInsights.push('Heavy air - reef early, power up gradually');
    } else if (windMin && windMin < 8) {
      aiInsights.push('Light air - prioritize clear air, minimize maneuvers');
    }
    if (tideState) {
      if (tideState === 'flooding') {
        aiInsights.push('Current favorable upwind - stay in main flow');
      } else if (tideState === 'ebbing') {
        aiInsights.push('Current adverse upwind - favor shallows');
      }
    }
    // Add tide turn info if available
    if (forecastData?.turnTime) {
      aiInsights.push(`Tide turns at ${forecastData.turnTime}`);
    }
    if (forecastData?.windTrend) {
      const trendMsg = forecastData.windTrend === 'building' ? 'Wind building through race' :
                       forecastData.windTrend === 'easing' ? 'Wind easing through race' : null;
      if (trendMsg) aiInsights.push(trendMsg);
    }

    // Build sail selection notes
    const sailNotes = intentions?.sailSelection ? [
      intentions.sailSelection.mainsailName && `Main: ${intentions.sailSelection.mainsailName}`,
      intentions.sailSelection.jibName && `Jib: ${intentions.sailSelection.jibName}`,
      intentions.sailSelection.spinnakerName && `Spinnaker: ${intentions.sailSelection.spinnakerName}`,
      intentions.sailSelection.notes,
    ].filter(Boolean).join(' • ') : undefined;

    // Build user notes from various sources
    const userNoteParts = [
      rigNotes,
      sailNotes,
      intentions?.arrivalTime?.notes,
      intentions?.courseSelection?.notes,
    ].filter(Boolean);
    const userNotes = userNoteParts.length > 0 ? userNoteParts.join('\n\n') : undefined;

    const preRace: PreRaceShareContent = {
      raceInfo: {
        id: race.id,
        name: race.name,
        date: race.date,
        venue: race.venue,
        boatClass: boatClassName,
        weather,
        rigTuning,
        startTime: race.startTime,
        raceType: race.race_type,
        totalDistanceNm: race.total_distance_nm as number | undefined,
      },
      // Strategy notes from sailor's preparation
      userNotes,
      startStrategy: strategyNotes['start'] || strategyNotes['start-strategy'] || undefined,
      upwindStrategy: strategyNotes['upwind'] || strategyNotes['upwind-strategy'] || undefined,
      downwindStrategy: strategyNotes['downwind'] || strategyNotes['downwind-strategy'] || undefined,
      // AI-generated insights from conditions
      aiInsights: aiInsights.length > 0 ? aiInsights : undefined,
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
  }, [race, boatClassName, intentions, rigNotes, selectedRigPresetId, forecastData]);

  // Share handlers for external sharing
  const { handleShare } = useShareHandlers({ content: shareableContent });

  // Handle external share channel selection
  const handleExternalShare = async (channel: ShareChannel) => {
    setLoadingChannel(channel);
    await handleShare(channel);
    setLoadingChannel(null);
  };

  // Don't render if no user or still loading
  if (!user?.id || loading || prepLoading) {
    return null;
  }

  // Check if no team available - show external share options as primary
  const hasTeam = primaryCoach || primaryCrew.length > 0;
  if (!hasTeam) {
    return (
      <View style={styles.section}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Share2 size={16} color={IOS_COLORS.teal} />
          <Text style={styles.sectionLabel}>Share</Text>
        </View>

        {/* External Share Options - Primary Action */}
        <View style={styles.externalShareContainer}>
          <ShareChannelGrid
            onSelectChannel={handleExternalShare}
            loadingChannel={loadingChannel}
            channels={['whatsapp', 'email', 'copy', 'native']}
          />
        </View>

        {/* Team Discovery - Secondary */}
        <View style={styles.teamDiscovery}>
          <Text style={styles.teamDiscoveryText}>
            Want to track who you've shared with?
          </Text>
          <View style={styles.emptyActions}>
            <Pressable
              style={({ pressed }) => [
                styles.emptyActionButtonMuted,
                pressed && styles.emptyActionButtonPressed,
              ]}
              onPress={() => router.push('/coach/discover')}
            >
              <GraduationCap size={14} color={IOS_COLORS.gray} />
              <Text style={styles.emptyActionTextMuted}>Find a Coach</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.emptyActionButtonMuted,
                pressed && styles.emptyActionButtonPressed,
              ]}
              onPress={() => router.push('/(tabs)/crew')}
            >
              <UserPlus size={14} color={IOS_COLORS.gray} />
              <Text style={styles.emptyActionTextMuted}>Add Crew</Text>
            </Pressable>
          </View>
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
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Share2 size={16} color={IOS_COLORS.teal} />
        <Text style={styles.sectionLabel}>Share with Team</Text>
      </View>

      <View style={styles.content}>
        {/* Coach Row */}
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
              <User size={18} color={IOS_COLORS.blue} />
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName}>{primaryCoach.display_name}</Text>
              <Text style={styles.recipientRole}>Coach</Text>
            </View>
            {sharingWithCoach ? (
              <ActivityIndicator size="small" color={IOS_COLORS.blue} />
            ) : coachAlreadyShared ? (
              <View style={styles.sharedBadge}>
                <Check size={12} color={IOS_COLORS.green} />
                <Text style={styles.sharedText}>Shared</Text>
              </View>
            ) : (
              <View style={styles.shareButton}>
                <Send size={14} color="white" />
              </View>
            )}
          </Pressable>
        )}

        {/* Crew Summary */}
        {primaryCrew.length > 0 && (
          <View style={styles.crewRow}>
            <View style={styles.crewAvatars}>
              {primaryCrew.slice(0, 3).map((crew) => {
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
                  </View>
                );
              })}
              {primaryCrew.length > 3 && (
                <View style={styles.crewAvatarMore}>
                  <Text style={styles.crewMoreText}>+{primaryCrew.length - 3}</Text>
                </View>
              )}
            </View>
            <Text style={styles.crewLabel}>
              {primaryCrew.length} crew member{primaryCrew.length !== 1 ? 's' : ''}
            </Text>
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
          <Share2 size={16} color={IOS_COLORS.teal} />
          <Text style={styles.shareAllText}>Share Race Prep with Team</Text>
          <ChevronRight size={16} color={IOS_COLORS.gray3} />
        </Pressable>
      </View>

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
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray3,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
  },
  emptyActionButtonPressed: {
    opacity: 0.7,
    backgroundColor: '#F0F7FF',
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  externalShareContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    paddingTop: 8,
  },
  teamDiscovery: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  teamDiscoveryText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginBottom: 8,
  },
  emptyActionButtonMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  emptyActionTextMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  recipientRole: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    marginTop: 1,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  sharedText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },
  shareButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  crewAvatars: {
    flexDirection: 'row',
  },
  crewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  crewAvatarShared: {
    backgroundColor: IOS_COLORS.green,
  },
  crewInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  crewAvatarMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  crewMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  crewLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 16,
  },
  shareAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: `${IOS_COLORS.teal}10`,
    borderRadius: 10,
    marginTop: 4,
  },
  shareAllButtonPressed: {
    opacity: 0.7,
  },
  shareAllText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.teal,
  },
});

export default ShareWithTeamSection;
