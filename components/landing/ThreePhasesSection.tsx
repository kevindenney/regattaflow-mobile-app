import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';

const PHASES = [
  {
    num: '01',
    title: 'Plan',
    body: 'Set clear goals and chart a path forward. Build your practice calendar around what actually moves the needle.',
    bullets: {
      'Sail Racing': 'Study the weather, set your race strategy, prepare your boat',
      Nursing: 'Review patient assignments, prep medications, plan your shift',
      'Lac Craft': 'List documents needed, find the nearest bank branch, set a deadline',
      Drawing: 'Choose your subject, gather references, set session goals',
      Fitness: 'Design your training block, plan warm-up routines',
    },
  },
  {
    num: '02',
    title: 'Do',
    body: "Track your sessions while they're fresh. The app works wherever you do — on the water, in the clinic, at the easel, in the gym.",
    bullets: {
      'Sail Racing': 'Log wind shifts, tactical decisions, mark roundings',
      Nursing: 'Document assessments, skills performed, patient interactions',
      'Lac Craft': 'Visit the bank, submit forms, photograph receipts via Telegram',
      Drawing: 'Record techniques used, time spent, reference materials',
      Fitness: 'Track sets, reps, weights, heart rate, and effort',
    },
  },
  {
    num: '03',
    title: 'Review',
    body: "See your data, spot patterns, get feedback. Know exactly what's working and what to focus on next.",
    bullets: {
      'Sail Racing': 'Debrief each race, review performance trends across the season',
      Nursing: 'Reflect on patient encounters, track competency progress',
      'Lac Craft': 'Review loan status, track income vs expenses, plan next product',
      Drawing: 'Critique your work, compare to references, note growth areas',
      Fitness: 'Analyze training volume, recovery metrics, performance gains',
    },
  },
];

const INTEREST_COLORS: Record<string, string> = {
  'Sail Racing': '#003DA5',
  Nursing: '#0097A7',
  'Lac Craft': '#E67E22',
  Drawing: '#E64A19',
  Fitness: '#2E7D32',
};

export function ThreePhasesSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>— THE MODEL</Text>
        <Text style={[styles.heading, isDesktop && styles.headingDesktop]}>
          Three phases.{'\n'}Every discipline.
        </Text>

        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {PHASES.map((phase, i) => (
            <View
              key={phase.num}
              style={[
                styles.card,
                isDesktop && i < 2 && styles.cardBorderRight,
              ]}
            >
              <Text style={styles.phaseNum}>{phase.num}</Text>
              <Text style={styles.phaseTitle}>{phase.title}</Text>
              <Text style={styles.phaseBody}>{phase.body}</Text>
              <View style={styles.bulletList}>
                {Object.entries(phase.bullets).map(([interest, bullet]) => (
                  <View key={interest} style={styles.bulletRow}>
                    <View
                      style={[
                        styles.bulletDot,
                        { backgroundColor: INTEREST_COLORS[interest] },
                      ]}
                    />
                    <Text style={styles.bulletText}>
                      <Text
                        style={[
                          styles.bulletInterest,
                          { color: INTEREST_COLORS[interest] },
                        ]}
                      >
                        {interest}:
                      </Text>{' '}
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#FAF8F5',
  },
  inner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: '#9B9B9B',
    marginBottom: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 48,
    lineHeight: 40,
  },
  headingDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  grid: {
    gap: 0,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  gridDesktop: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  cardBorderRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  phaseNum: {
    fontSize: 48,
    fontWeight: '700',
    color: '#F3F0EB',
    marginBottom: 20,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  phaseBody: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 22,
    marginBottom: 20,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 12,
    color: '#9B9B9B',
    lineHeight: 18,
    flex: 1,
  },
  bulletInterest: {
    fontWeight: '600',
  },
});
