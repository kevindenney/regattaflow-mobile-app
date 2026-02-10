/**
 * Trial Activation Screen
 *
 * Shown after name-photo during signup. Communicates the 14-day Pro trial,
 * highlights key Pro features, and shows transparent pricing so the user
 * knows exactly what to expect.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const PRO_FEATURES = [
  {
    icon: 'flash' as const,
    title: 'AI Race Strategy',
    description: 'Get personalized tactics based on wind, current, and fleet data',
  },
  {
    icon: 'analytics' as const,
    title: 'Performance Analytics',
    description: 'Track trends, compare results, and spot patterns over time',
  },
  {
    icon: 'cloud-download' as const,
    title: 'Weather Automation',
    description: 'Auto-fetch forecasts, tides, and conditions before every race',
  },
  {
    icon: 'infinite' as const,
    title: 'Unlimited Races',
    description: 'Log as many races as you sail — no caps, no limits',
  },
];

export default function TrialActivationScreen() {
  const router = useRouter();

  const handleStart = useCallback(() => {
    router.replace('/(tabs)/races');
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Badge */}
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.badgeRow}
          >
            <View style={styles.badge}>
              <Ionicons name="trophy" size={14} color="#D97706" />
              <Text style={styles.badgeText}>PRO TRIAL</Text>
            </View>
          </Animated.View>

          {/* Headline */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
            style={styles.headlineContainer}
          >
            <Text style={styles.headline}>
              You've got 14 days{'\n'}of full Pro access
            </Text>
            <Text style={styles.subheadline}>
              Everything unlocked — explore at your own pace.
            </Text>
          </Animated.View>

          {/* Feature list */}
          <Animated.View
            entering={FadeIn.delay(400).duration(400)}
            style={styles.featureList}
          >
            {PRO_FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInDown.delay(450 + index * 80)
                  .duration(350)
                  .springify()}
                style={styles.featureRow}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={20} color="#2563EB" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(400)}
          style={styles.footer}
        >
          {/* Pricing transparency */}
          <Text style={styles.pricingNote}>
            After 14 days, keep the Free plan forever.{'\n'}
            Pro is $10/mo if you want everything.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Let's go</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 40 : 48,
    justifyContent: 'center',
  },
  badgeRow: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 1,
  },
  headlineContainer: {
    marginBottom: 36,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subheadline: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  featureList: {
    gap: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
  },
  pricingNote: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
