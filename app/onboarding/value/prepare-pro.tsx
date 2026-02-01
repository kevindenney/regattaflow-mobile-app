/**
 * Prepare Like a Pro - Value Showcase Screen 2
 * Weather and conditions preview showing race preparation features
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
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { ValueScreen } from '@/components/onboarding/ValueScreen';

function WeatherIllustration() {
  const windArrowRotation = useSharedValue(0);
  const compassNeedle = useSharedValue(0);
  const tidePulse = useSharedValue(1);

  useEffect(() => {
    // Wind direction animation
    windArrowRotation.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Compass needle wobble
    compassNeedle.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Tide indicator pulse
    tidePulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const windArrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${45 + windArrowRotation.value}deg` }],
  }));

  const compassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${compassNeedle.value}deg` }],
  }));

  const tideStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tidePulse.value }],
  }));

  return (
    <View style={styles.illustrationContainer}>
      {/* Main weather card */}
      <View style={styles.weatherCard}>
        {/* Header with location */}
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.locationText}>San Francisco Bay</Text>
        </View>

        {/* Wind section */}
        <View style={styles.windSection}>
          <Animated.View style={[styles.windArrow, windArrowStyle]}>
            <Ionicons name="arrow-up" size={40} color="#FFFFFF" />
          </Animated.View>
          <View style={styles.windInfo}>
            <Text style={styles.windSpeed}>12</Text>
            <Text style={styles.windUnit}>kts</Text>
            <Text style={styles.windDirection}>SW</Text>
          </View>
        </View>

        {/* Condition badges */}
        <View style={styles.conditionBadges}>
          <View style={styles.badge}>
            <Ionicons name="water" size={14} color="#60A5FA" />
            <Text style={styles.badgeText}>1.2m swell</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="thermometer" size={14} color="#F87171" />
            <Text style={styles.badgeText}>18°C</Text>
          </View>
        </View>
      </View>

      {/* Floating cards */}
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={[styles.floatingCard, styles.compassCard]}
      >
        <Animated.View style={compassStyle}>
          <Ionicons name="compass" size={32} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.floatingCardLabel}>Course</Text>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(500).duration(400)}
        style={[styles.floatingCard, styles.tideCard, tideStyle]}
      >
        <Ionicons name="trending-up" size={28} color="#22C55E" />
        <Text style={styles.floatingCardLabel}>Rising</Text>
      </Animated.View>

      {/* Forecast timeline */}
      <View style={styles.forecastTimeline}>
        {['Now', '1hr', '2hr', '3hr'].map((time, index) => (
          <View key={time} style={styles.forecastItem}>
            <Text style={styles.forecastTime}>{time}</Text>
            <Text style={styles.forecastWind}>{12 + index * 2}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PrepareProScreen() {
  return (
    <ValueScreen
      title="Prepare Like a Pro"
      subtitle="Get real-time wind, tide, and weather data. Know exactly what conditions you'll face before you hit the water."
      illustration={<WeatherIllustration />}
      gradientColors={['#8B5CF6', '#7C3AED', '#6D28D9']}
      ctaText="Continue"
      nextRoute="/onboarding/value/join-crew"
      currentStep={1}
      totalSteps={3}
    />
  );
}

const styles = StyleSheet.create({
  illustrationContainer: {
    width: 300,
    height: 320,
    position: 'relative',
    alignItems: 'center',
  },
  weatherCard: {
    width: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  windSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  windArrow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  windInfo: {
    alignItems: 'flex-start',
  },
  windSpeed: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  windUnit: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: -4,
  },
  windDirection: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  conditionBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  floatingCard: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  compassCard: {
    top: 40,
    right: 0,
  },
  tideCard: {
    top: 100,
    left: 0,
  },
  floatingCardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  forecastTimeline: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 16,
    marginTop: 16,
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 4,
  },
  forecastWind: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
