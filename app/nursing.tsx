import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterestLandingPage } from '@/components/landing/InterestLandingPage';

export default function NursingLandingPage() {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle =
    Platform.OS === 'web'
      ? [styles.container, styles.webContainer]
      : styles.container;

  return (
    <Container style={containerStyle}>
      <InterestLandingPage
        name="Nursing"
        slug="nursing"
        color="#0097A7"
        icon="medkit"
        tagline="Build clinical confidence, shift by shift."
        description="Prepare for every clinical rotation, track your skills on shift, and reflect on what you learned. BetterAt helps nursing students grow into exceptional practitioners."
        phases={{
          plan: {
            title: 'Prep for Your Shift',
            bullets: [
              'Review patient assignments and care plans',
              'Set learning objectives for the rotation',
              'Study medications and procedures you may encounter',
              'Prepare questions for your preceptor',
            ],
          },
          do_: {
            title: 'On Shift',
            bullets: [
              'Log clinical skills performed and patient interactions',
              'Track competencies as you practice them',
              'Note challenging situations and how you handled them',
              'Record new procedures and techniques learned',
            ],
          },
          review: {
            title: 'Reflect & Grow',
            bullets: [
              'Complete guided post-shift reflection',
              'Identify knowledge gaps and set study priorities',
              'Track competency progression across rotations',
              'Build your clinical portfolio with evidence of growth',
            ],
          },
        }}
        features={[
          {
            title: 'Competency Tracker',
            description:
              'Map your progress across NCLEX categories and clinical competencies with visual dashboards.',
            icon: '\u{1F4CA}',
          },
          {
            title: 'Shift Journal',
            description:
              'Structured clinical journaling that builds a searchable record of your nursing experiences.',
            icon: '\u{1F4D3}',
          },
          {
            title: 'Skills Checklist',
            description:
              'Track every clinical skill from IV insertion to medication administration with sign-off support.',
            icon: '\u2705',
          },
          {
            title: 'AI Study Coach',
            description:
              'Get personalized study recommendations based on your clinical experiences and knowledge gaps.',
            icon: '\u{1F916}',
          },
          {
            title: 'Rotation Planner',
            description:
              'Organize your clinical schedule, set goals for each rotation, and track hours completed.',
            icon: '\u{1F4C5}',
          },
          {
            title: 'Peer Learning',
            description:
              'Connect with cohort members, share clinical insights, and learn from each other\'s experiences.',
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
