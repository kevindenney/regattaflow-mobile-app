/**
 * SailorProfileScreen - Main Strava-style profile screen
 */

import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SailorProfileHeader } from './SailorProfileHeader';
import { SailorMediaCarousel } from './SailorMediaCarousel';
import { SailorStatsCard } from './SailorStatsCard';
import { SailorActivityChart } from './SailorActivityChart';
import { SailorTrophyCase } from './SailorTrophyCase';
import { SailorBoatList } from './SailorBoatList';
import { SailorRaceTimeline } from './SailorRaceTimeline';
import { useSailorFullProfile } from '@/hooks/useSailorFullProfile';
import { useSailorMedia } from '@/hooks/useSailorMedia';
import {
  IOS_COLORS,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';

interface SailorProfileScreenProps {
  userId: string;
}

export function SailorProfileScreen({ userId }: SailorProfileScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    profile,
    isLoading,
    error,
    refetch,
    toggleFollow,
    isToggling,
    isOwnProfile,
  } = useSailorFullProfile(userId);

  const { media, refetch: refetchMedia } = useSailorMedia(userId);

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchMedia()]);
    setRefreshing(false);
  }, [refetch, refetchMedia]);

  const handleFollowersPress = useCallback(() => {
    router.push(`/sailor/${userId}/followers`);
  }, [router, userId]);

  const handleFollowingPress = useCallback(() => {
    router.push(`/sailor/${userId}/following`);
  }, [router, userId]);

  const handleRacePress = useCallback(
    (raceId: string) => {
      router.push(`/sailor-journey/${userId}/${raceId}`);
    },
    [router, userId]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        {/* Could add error UI here */}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Profile Header */}
      <SailorProfileHeader
        profile={profile}
        onFollowersPress={handleFollowersPress}
        onFollowingPress={handleFollowingPress}
        onToggleFollow={toggleFollow}
        isToggling={isToggling}
        onBack={handleBack}
      />

      {/* Media Carousel */}
      {(media.length > 0 || isOwnProfile) && (
        <View style={styles.section}>
          <SailorMediaCarousel
            userId={userId}
            media={media}
            isOwnProfile={isOwnProfile}
            onMediaAdded={refetchMedia}
          />
        </View>
      )}

      {/* Stats Card */}
      <View style={styles.section}>
        <SailorStatsCard stats={profile.stats} />
      </View>

      {/* Activity Chart */}
      <View style={styles.section}>
        <SailorActivityChart userId={userId} />
      </View>

      {/* Trophy Case (if has achievements) */}
      {profile.achievements.length > 0 && (
        <View style={styles.section}>
          <SailorTrophyCase achievements={profile.achievements} />
        </View>
      )}

      {/* Boats List (if has boats) */}
      {profile.boats.length > 0 && (
        <View style={styles.section}>
          <SailorBoatList boats={profile.boats} />
        </View>
      )}

      {/* Race Timeline */}
      <View style={styles.section}>
        <SailorRaceTimeline userId={userId} onRacePress={handleRacePress} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  contentContainer: {
    paddingBottom: IOS_SPACING.xxxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  section: {
    marginTop: IOS_SPACING.lg,
  },
});
