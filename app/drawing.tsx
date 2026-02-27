import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterestLandingPage } from '@/components/landing/InterestLandingPage';

export default function DrawingLandingPage() {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle =
    Platform.OS === 'web'
      ? [styles.container, styles.webContainer]
      : styles.container;

  return (
    <Container style={containerStyle}>
      <InterestLandingPage
        name="Drawing"
        slug="drawing"
        color="#E64A19"
        icon="color-palette"
        tagline="See more. Draw better."
        description="Plan your practice sessions with intent, draw with focus, and critique your work to improve. BetterAt gives artists the deliberate practice framework to level up."
        phases={{
          plan: {
            title: 'Plan Your Session',
            bullets: [
              'Choose your subject, medium, and technique focus',
              'Set specific skill goals for the session',
              'Gather reference materials and set up your workspace',
              'Review previous critiques for areas to work on',
            ],
          },
          do_: {
            title: 'Draw with Focus',
            bullets: [
              'Follow timed exercises for gesture, contour, or value studies',
              'Log medium, surface, and technique used',
              'Capture progress photos at key stages',
              'Note breakthroughs and struggles in real time',
            ],
          },
          review: {
            title: 'Critique & Reflect',
            bullets: [
              'Complete guided self-critique on composition, proportion, and value',
              'Compare against reference and identify gaps',
              'Get AI-powered feedback on your work',
              'Track improvement in specific skills over time',
            ],
          },
        }}
        features={[
          {
            title: 'Practice Planner',
            description:
              'Structure your drawing practice with focused exercises targeting specific skills like gesture, perspective, or shading.',
            icon: '\u{1F3AF}',
          },
          {
            title: 'Visual Journal',
            description:
              'Document every session with photos, notes, and self-assessments to build a visual record of your growth.',
            icon: '\u{1F4F8}',
          },
          {
            title: 'Skill Progression',
            description:
              'Track your development across core drawing skills — proportion, value, line quality, composition, and more.',
            icon: '\u{1F4C8}',
          },
          {
            title: 'AI Critique',
            description:
              'Upload your work for AI-powered analysis of composition, proportion, value range, and technique.',
            icon: '\u{1F916}',
          },
          {
            title: 'Exercise Library',
            description:
              'Access curated drawing exercises organized by skill level and technique, from 2-minute gestures to full studies.',
            icon: '\u{1F4DA}',
          },
          {
            title: 'Community Gallery',
            description:
              'Share work, give and receive feedback, and find inspiration from other artists on the same journey.',
            icon: '\u{1F5BC}\u{FE0F}',
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
