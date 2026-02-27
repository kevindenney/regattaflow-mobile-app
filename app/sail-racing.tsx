import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterestLandingPage } from '@/components/landing/InterestLandingPage';

export default function SailRacingLandingPage() {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle =
    Platform.OS === 'web'
      ? [styles.container, styles.webContainer]
      : styles.container;

  return (
    <Container style={containerStyle}>
      <InterestLandingPage
        name="Sail Racing"
        slug="sail-racing"
        color="#003DA5"
        icon="boat"
        tagline="Race smarter. Improve faster."
        description="Plan your race strategy, execute on the water, and review every tack. BetterAt gives sailors the structure to turn each regatta into a learning opportunity."
        phases={{
          plan: {
            title: 'Plan Your Race',
            bullets: [
              'Study the course layout and mark positions',
              'Analyze wind forecasts and tidal patterns',
              'Set sail selection and rig tuning targets',
              'Review competitor tendencies and fleet dynamics',
            ],
          },
          do_: {
            title: 'Execute On Water',
            bullets: [
              'Follow your pre-start routine and sequence timer',
              'Log conditions, wind shifts, and tactical decisions',
              'Track mark roundings and boat-on-boat situations',
              'Use AI coaching prompts between races',
            ],
          },
          review: {
            title: 'Review & Improve',
            bullets: [
              'Complete structured debrief after each race',
              'Analyze GPS tracks overlaid on course maps',
              'Get AI-powered insights on tactical patterns',
              'Track progress across your racing season',
            ],
          },
        }}
        features={[
          {
            title: 'Race Strategy Engine',
            description:
              'AI analyzes weather, tides, and course geometry to suggest tactical playbooks before you leave the dock.',
            icon: '\u{1F9ED}',
          },
          {
            title: 'Rig Tuning Guides',
            description:
              'Class-specific tuning references with conditions-based recommendations for your exact boat.',
            icon: '\u{2699}\u{FE0F}',
          },
          {
            title: 'GPS Track Analysis',
            description:
              'Upload tracks to visualize your course, compare against fleet, and identify where you gained or lost.',
            icon: '\u{1F4CD}',
          },
          {
            title: 'Structured Debrief',
            description:
              'Guided post-race review that builds a searchable learning library across your entire season.',
            icon: '\u{1F4DD}',
          },
          {
            title: 'Venue Intelligence',
            description:
              'Crowdsourced local knowledge for racing venues — currents, wind patterns, and tactical notes.',
            icon: '\u{1F30A}',
          },
          {
            title: 'Fleet & Crew',
            description:
              'Connect with your fleet, share strategy, coordinate crew, and track results together.',
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
