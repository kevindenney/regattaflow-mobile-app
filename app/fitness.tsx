import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterestLandingPage } from '@/components/landing/InterestLandingPage';

export default function FitnessLandingPage() {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle =
    Platform.OS === 'web'
      ? [styles.container, styles.webContainer]
      : styles.container;

  return (
    <Container style={containerStyle}>
      <InterestLandingPage
        name="Fitness"
        slug="fitness"
        color="#2E7D32"
        icon="barbell"
        tagline="Train with purpose. Recover with insight."
        description="Plan your workouts with clear goals, train with intention, and review your progress to keep improving. BetterAt brings deliberate practice to your fitness journey."
        phases={{
          plan: {
            title: 'Plan Your Workout',
            bullets: [
              'Set training goals and select your program',
              'Plan exercises, sets, and target weights',
              'Check recovery status and adjust intensity',
              'Review previous session notes for progression',
            ],
          },
          do_: {
            title: 'Train with Intent',
            bullets: [
              'Log exercises, sets, reps, and weights in real time',
              'Track rest periods and perceived effort',
              'Note form cues and technique observations',
              'Record cardio metrics — distance, pace, heart rate',
            ],
          },
          review: {
            title: 'Review & Progress',
            bullets: [
              'Complete post-workout reflection on energy and effort',
              'Analyze volume and intensity trends over time',
              'Get AI-powered suggestions for progression',
              'Track personal records and milestone achievements',
            ],
          },
        }}
        features={[
          {
            title: 'Workout Logger',
            description:
              'Fast, intuitive logging for strength, cardio, and mixed sessions with auto-progression suggestions.',
            icon: '\u{1F4AA}',
          },
          {
            title: 'Progress Analytics',
            description:
              'Visualize strength gains, volume trends, and body composition changes with clean, actionable charts.',
            icon: '\u{1F4CA}',
          },
          {
            title: 'Program Builder',
            description:
              'Create or follow training programs with periodization, deload weeks, and progressive overload built in.',
            icon: '\u{1F4CB}',
          },
          {
            title: 'AI Coach',
            description:
              'Get personalized training recommendations based on your history, goals, and recovery patterns.',
            icon: '\u{1F916}',
          },
          {
            title: 'Recovery Tracking',
            description:
              'Monitor sleep, soreness, and readiness to train. Smart suggestions for when to push and when to rest.',
            icon: '\u{1F4A4}',
          },
          {
            title: 'Training Community',
            description:
              'Share workouts, challenge friends, and stay accountable with your training partners.',
            icon: '\u{1F465}',
          },
        ]}
      />
    </Container>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  webContainer: ViewStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webContainer: {
    minHeight: '100vh' as any,
    width: '100%',
  },
});
