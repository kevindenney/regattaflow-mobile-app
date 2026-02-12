/**
 * WelcomeCard — Centered modal card shown as the first tour step.
 *
 * Renders a dark backdrop with a white card containing the welcome
 * message and "Start Tour" / "Skip" buttons.
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

export interface WelcomeCardProps {
  visible: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

export function WelcomeCard({ visible, onStartTour, onSkip }: WelcomeCardProps) {
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
        <Text style={styles.emoji}>⛵</Text>
        <Text style={styles.title}>Your race companion</Text>
        <Text style={styles.description}>
          RegattaFlow helps you prepare for races, learn tactics, and track your progress.
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartTour}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Take the Tour</Text>
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
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
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
