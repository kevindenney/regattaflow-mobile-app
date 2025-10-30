/**
 * TimingCard Component
 *
 * Displays timing information and start sequence with visual timeline
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/race-ui/Card';
import { CardHeader } from '@/components/race-ui/CardHeader';
import { Chip } from '@/components/race-ui/Chip';
import { Typography, Spacing, colors, BorderRadius } from '@/constants/designSystem';

interface TimelineEvent {
  time: string;
  label: string;
  type: 'warning' | 'prep' | 'start';
}

interface TimingCardProps {
  startSequence?: TimelineEvent[];
  signals?: string[];
}

const Timeline: React.FC<{ events: TimelineEvent[] }> = ({ events }) => {
  return (
    <View style={styles.timeline}>
      {events.map((event, index) => (
        <View key={index} style={styles.timelineItem}>
          <View style={styles.timelineLeft}>
            <View
              style={[
                styles.timelineDot,
                event.type === 'start' && styles.timelineDotHighlight,
              ]}
            />
            {index < events.length - 1 && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTime}>{event.time}</Text>
            <Text
              style={[
                styles.timelineLabel,
                event.type === 'start' && styles.timelineLabelHighlight,
              ]}
            >
              {event.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export const TimingCard: React.FC<TimingCardProps> = ({
  startSequence = [
    { time: '08:00', label: 'Warning Signal', type: 'warning' },
    { time: '08:04', label: 'Prep Signal', type: 'prep' },
    { time: '08:05', label: 'Start', type: 'start' },
  ],
  signals = ['Flag U', 'Black Flag', '3 min start'],
}) => {
  return (
    <Card>
      <CardHeader
        icon="timer-outline"
        title="Timing & Start Sequence"
        iconColor={colors.warning[600]}
      />

      {/* Visual timeline */}
      <Timeline events={startSequence} />

      {/* Signal chips */}
      {signals.length > 0 && (
        <View style={styles.signalsSection}>
          <Text style={styles.sectionLabel}>SIGNALS</Text>
          <View style={styles.signalChips}>
            {signals.map((signal, index) => (
              <Chip key={index} text={signal} color={colors.primary[600]} />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  timeline: {
    marginBottom: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neutral[300],
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  timelineDotHighlight: {
    backgroundColor: colors.primary[600],
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.neutral[200],
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 4,
  },
  timelineTime: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  timelineLabel: {
    ...Typography.body,
    color: colors.text.primary,
  },
  timelineLabelHighlight: {
    ...Typography.bodyBold,
    color: colors.primary[600],
  },
  signalsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionLabel: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  signalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
