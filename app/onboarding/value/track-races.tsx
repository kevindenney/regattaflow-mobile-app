/**
 * Track Every Race - Value Showcase Screen 1
 * Animated sailing visual showing race tracking benefits
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { ValueScreen } from '@/components/onboarding/ValueScreen';

function SailingIllustration() {
  const boatX = useSharedValue(0);
  const waveOffset = useSharedValue(0);

  useEffect(() => {
    // Gentle boat rocking motion
    boatX.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Wave animation
    waveOffset.value = withRepeat(
      withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const boatStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: boatX.value }, { rotate: `${boatX.value / 4}deg` }],
  }));

  const waveStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: waveOffset.value }],
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: -waveOffset.value }],
  }));

  return (
    <View style={styles.illustrationContainer}>
      {/* Stylized map/course background */}
      <View style={styles.mapBackground}>
        {/* Course marks */}
        <View style={[styles.courseMark, { top: 20, left: 40 }]}>
          <View style={styles.markOuter}>
            <View style={styles.markInner} />
          </View>
        </View>
        <View style={[styles.courseMark, { top: 80, right: 50 }]}>
          <View style={styles.markOuter}>
            <View style={styles.markInner} />
          </View>
        </View>
        <View style={[styles.courseMark, { bottom: 60, left: 60 }]}>
          <View style={styles.markOuter}>
            <View style={styles.markInner} />
          </View>
        </View>

        {/* Course line */}
        <View style={styles.courseLine} />

        {/* Animated boat */}
        <Animated.View style={[styles.boatContainer, boatStyle]}>
          <Ionicons name="boat" size={48} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Animated waves at bottom */}
      <View style={styles.wavesContainer}>
        <Animated.View style={[styles.wave, styles.wave1, waveStyle1]} />
        <Animated.View style={[styles.wave, styles.wave2, waveStyle2]} />
      </View>

      {/* Stats overlay */}
      <View style={styles.statsOverlay}>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={20} color="#FBBF24" />
          <Animated.Text style={styles.statValue}>12</Animated.Text>
          <Animated.Text style={styles.statLabel}>Races</Animated.Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="medal" size={20} color="#F472B6" />
          <Animated.Text style={styles.statValue}>3rd</Animated.Text>
          <Animated.Text style={styles.statLabel}>Best</Animated.Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="speedometer" size={20} color="#34D399" />
          <Animated.Text style={styles.statValue}>8.2</Animated.Text>
          <Animated.Text style={styles.statLabel}>Avg Kts</Animated.Text>
        </View>
      </View>
    </View>
  );
}

export default function TrackRacesScreen() {
  return (
    <ValueScreen
      title="Track Every Race"
      subtitle="Log your races, review your performance, and watch your sailing skills improve over time."
      illustration={<SailingIllustration />}
      gradientColors={['#0EA5E9', '#0284C7', '#0369A1']}
      ctaText="Continue"
      nextRoute="/onboarding/value/prepare-pro"
      currentStep={0}
      totalSteps={3}
    />
  );
}

const styles = StyleSheet.create({
  illustrationContainer: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  courseMark: {
    position: 'absolute',
  },
  markOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  courseLine: {
    position: 'absolute',
    top: 30,
    left: 50,
    width: 180,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '25deg' }],
  },
  boatContainer: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  wavesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    right: -20,
    height: 20,
    borderRadius: 100,
  },
  wave1: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    bottom: 10,
  },
  wave2: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: 0,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});
