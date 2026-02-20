import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STEPS = [
  {
    icon: 'clipboard-outline' as const,
    step: '1',
    title: 'Plan Your Race',
    description:
      'AI checklists, weather briefings, and venue intelligence so you arrive prepared.',
  },
  {
    icon: 'analytics-outline' as const,
    step: '2',
    title: 'Race with Confidence',
    description:
      'Real-time strategy, starting sequence countdown, and tactical support on the water.',
  },
  {
    icon: 'trophy-outline' as const,
    step: '3',
    title: 'Analyze & Improve',
    description:
      'Post-race analytics, AI debrief, and season-long trends to track your progress.',
  },
];

export function HowItWorksSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <View nativeID="how-it-works" style={styles.container}>
      <View style={styles.content}>
        {/* Section Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            How It Works
          </Text>
          <Text style={styles.subtitle}>
            Three steps to better racing
          </Text>
        </View>

        {/* Steps */}
        <View style={[styles.stepsRow, isDesktop && styles.stepsRowDesktop]}>
          {STEPS.map((step) => (
            <View
              key={step.step}
              style={[styles.card, isDesktop && styles.cardDesktop]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={step.icon} size={32} color="#3E92CC" />
              </View>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>Step {step.step}</Text>
              </View>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardDescription}>{step.description}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  titleDesktop: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },

  stepsRow: {
    gap: 24,
    flexDirection: 'column',
  },
  stepsRowDesktop: {
    flexDirection: 'row',
  },

  card: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cardDesktop: {
    // same base styles, flex handles it
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(62, 146, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  stepBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
