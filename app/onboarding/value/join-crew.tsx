/**
 * Join Your Crew - Value Showcase Screen 3
 * Social proof and community focus
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { ValueScreen, useIsDesktop } from '@/components/onboarding/ValueScreen';

function CommunityIllustration() {
  const isDesktop = useIsDesktop();
  const avatarPulse1 = useSharedValue(1);
  const avatarPulse2 = useSharedValue(1);
  const avatarPulse3 = useSharedValue(1);
  const notificationSlide = useSharedValue(0);

  // Responsive sizing
  const containerWidth = isDesktop ? 420 : 300;
  const containerHeight = isDesktop ? 460 : 340;
  const cardWidth = isDesktop ? 340 : 260;

  useEffect(() => {
    // Staggered avatar pulses
    avatarPulse1.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    avatarPulse2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    avatarPulse3.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Notification slide animation
    notificationSlide.value = withRepeat(
      withSequence(
        withDelay(2000, withTiming(1, { duration: 400 })),
        withDelay(3000, withTiming(0, { duration: 400 }))
      ),
      -1,
      false
    );
  }, []);

  const avatar1Style = useAnimatedStyle(() => ({
    transform: [{ scale: avatarPulse1.value }],
  }));

  const avatar2Style = useAnimatedStyle(() => ({
    transform: [{ scale: avatarPulse2.value }],
  }));

  const avatar3Style = useAnimatedStyle(() => ({
    transform: [{ scale: avatarPulse3.value }],
  }));

  const notificationStyle = useAnimatedStyle(() => ({
    opacity: notificationSlide.value,
    transform: [{ translateY: (1 - notificationSlide.value) * 20 }],
  }));

  return (
    <View style={[styles.illustrationContainer, { width: containerWidth, height: containerHeight }]}>
      {/* Main community card */}
      <View style={[styles.communityCard, { width: cardWidth }, isDesktop && styles.communityCardDesktop]}>
        {/* Club header */}
        <View style={styles.clubHeader}>
          <View style={[styles.clubLogo, isDesktop && styles.clubLogoDesktop]}>
            <Ionicons name="flag" size={isDesktop ? 28 : 24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.clubName, isDesktop && styles.clubNameDesktop]}>Bay Sailing Club</Text>
            <Text style={[styles.clubMembers, isDesktop && styles.clubMembersDesktop]}>248 members</Text>
          </View>
        </View>

        {/* Avatar stack */}
        <View style={styles.avatarStack}>
          <Animated.View style={[styles.avatar, styles.avatar1, avatar1Style, isDesktop && styles.avatarDesktop]}>
            <Ionicons name="person" size={isDesktop ? 24 : 20} color="#FFFFFF" />
          </Animated.View>
          <Animated.View style={[styles.avatar, styles.avatar2, avatar2Style, isDesktop && styles.avatarDesktop]}>
            <Ionicons name="person" size={isDesktop ? 24 : 20} color="#FFFFFF" />
          </Animated.View>
          <Animated.View style={[styles.avatar, styles.avatar3, avatar3Style, isDesktop && styles.avatarDesktop]}>
            <Ionicons name="person" size={isDesktop ? 24 : 20} color="#FFFFFF" />
          </Animated.View>
          <View style={[styles.avatarMore, isDesktop && styles.avatarMoreDesktop]}>
            <Text style={[styles.avatarMoreText, isDesktop && styles.avatarMoreTextDesktop]}>+245</Text>
          </View>
        </View>

        {/* Recent activity */}
        <Text style={[styles.activityLabel, isDesktop && styles.activityLabelDesktop]}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={[styles.activityText, isDesktop && styles.activityTextDesktop]}>
              <Text style={styles.activityName}>Sarah M.</Text> finished 2nd
            </Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={[styles.activityText, isDesktop && styles.activityTextDesktop]}>
              <Text style={styles.activityName}>Mike T.</Text> joined fleet
            </Text>
          </View>
        </View>
      </View>

      {/* Floating notification */}
      <Animated.View
        entering={FadeIn.delay(400).duration(400)}
        style={[styles.notificationCard, notificationStyle, isDesktop && styles.notificationCardDesktop]}
      >
        <View style={[styles.notificationIcon, isDesktop && styles.notificationIconDesktop]}>
          <Ionicons name="trophy" size={isDesktop ? 22 : 18} color="#FBBF24" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, isDesktop && styles.notificationTitleDesktop]}>Race Results</Text>
          <Text style={[styles.notificationBody, isDesktop && styles.notificationBodyDesktop]}>Sunday Series posted!</Text>
        </View>
      </Animated.View>

      {/* Stats row */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(400)}
        style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}
      >
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, isDesktop && styles.statNumberDesktop]}>50+</Text>
          <Text style={[styles.statText, isDesktop && styles.statTextDesktop]}>Clubs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, isDesktop && styles.statNumberDesktop]}>2.5k</Text>
          <Text style={[styles.statText, isDesktop && styles.statTextDesktop]}>Sailors</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, isDesktop && styles.statNumberDesktop]}>300+</Text>
          <Text style={[styles.statText, isDesktop && styles.statTextDesktop]}>Races</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function JoinCrewScreen() {
  return (
    <ValueScreen
      title="Join Your Crew"
      subtitle="Connect with your sailing club, follow fellow sailors, and never miss a race or event."
      illustration={<CommunityIllustration />}
      gradientColors={['#F97316', '#EA580C', '#C2410C']}
      ctaText="Get Started"
      nextRoute="/onboarding/auth-choice"
      currentStep={2}
      totalSteps={3}
    />
  );
}

const styles = StyleSheet.create({
  illustrationContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  communityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 20,
  },
  communityCardDesktop: {
    padding: 28,
    borderRadius: 28,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  clubLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubLogoDesktop: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  clubName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  clubNameDesktop: {
    fontSize: 22,
  },
  clubMembers: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  clubMembersDesktop: {
    fontSize: 15,
  },
  avatarStack: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarDesktop: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatar1: {
    backgroundColor: '#60A5FA',
    zIndex: 3,
  },
  avatar2: {
    backgroundColor: '#34D399',
    marginLeft: -12,
    zIndex: 2,
  },
  avatar3: {
    backgroundColor: '#F472B6',
    marginLeft: -12,
    zIndex: 1,
  },
  avatarMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  avatarMoreDesktop: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarMoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarMoreTextDesktop: {
    fontSize: 14,
  },
  activityLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityLabelDesktop: {
    fontSize: 13,
    marginBottom: 12,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  activityText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  activityTextDesktop: {
    fontSize: 15,
  },
  activityName: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationCard: {
    position: 'absolute',
    top: 60,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 12,
    paddingRight: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  notificationCardDesktop: {
    top: 80,
    right: 0,
    padding: 14,
    paddingRight: 20,
    borderRadius: 16,
    gap: 12,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconDesktop: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  notificationContent: {},
  notificationTitle: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationTitleDesktop: {
    fontSize: 15,
  },
  notificationBody: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 1,
  },
  notificationBodyDesktop: {
    fontSize: 14,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 24,
    marginTop: 16,
  },
  statsRowDesktop: {
    padding: 20,
    gap: 32,
    marginTop: 24,
    borderRadius: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statNumberDesktop: {
    fontSize: 26,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  statTextDesktop: {
    fontSize: 14,
    marginTop: 4,
  },
});
