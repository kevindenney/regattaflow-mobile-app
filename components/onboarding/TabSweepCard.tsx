/**
 * TabSweepCard — Full-screen card showing all 4 navigation tabs.
 *
 * Replaces four individual tab spotlight steps with a single card
 * that describes each tab's purpose with an icon + one-liner.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface TabRow {
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  description: string;
  color: string;
}

const TABS: TabRow[] = [
  {
    icon: 'people-outline',
    name: 'Follow',
    description: 'Discover sailors and share race insights',
    color: '#3B82F6',
  },
  {
    icon: 'chatbubbles-outline',
    name: 'Discuss',
    description: 'Join communities and conversations',
    color: '#8B5CF6',
  },
  {
    icon: 'school-outline',
    name: 'Learn',
    description: 'Race-focused courses and drills',
    color: '#10B981',
  },
  {
    icon: 'stats-chart-outline',
    name: 'Reflect',
    description: 'Review race logs and track progress',
    color: '#F59E0B',
  },
];

export interface TabSweepCardProps {
  visible: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function TabSweepCard({ visible, onNext, onSkip }: TabSweepCardProps) {
  const { width } = useWindowDimensions();

  if (!visible) return null;

  const cardWidth = Math.min(360, width - 48);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.backdrop}
    >
      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={styles.title}>Explore every tab</Text>
        <Text style={styles.subtitle}>
          Four tabs to power your sailing journey.
        </Text>

        <View style={styles.tabList}>
          {TABS.map((tab) => (
            <View key={tab.name} style={styles.tabRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${tab.color}15` }]}>
                <Ionicons name={tab.icon} size={22} color={tab.color} />
              </View>
              <View style={styles.tabText}>
                <Text style={styles.tabName}>{tab.name}</Text>
                <Text style={styles.tabDescription}>{tab.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabList: {
    width: '100%',
    gap: 14,
    marginBottom: 24,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    flex: 1,
  },
  tabName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  tabDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
