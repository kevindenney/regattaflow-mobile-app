/**
 * CountdownTimer Component
 *
 * Displays a live countdown to race start time
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, colors } from '@/constants/designSystem';

interface CountdownTimerProps {
  targetDate: Date;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference,
  };
};

const TimeBlock: React.FC<{ value: number; label: string; compact?: boolean }> = ({
  value,
  label,
  compact = false,
}) => {
  // Pluralize label based on value (e.g., "1 day" vs "2 days")
  const singularLabel = label.replace(/S$/, '');
  const displayLabel = value === 1 ? singularLabel : label;

  return (
    <View style={styles.timeBlock}>
      <Text style={compact ? styles.timeValueCompact : styles.timeValue}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={compact ? styles.timeLabelCompact : styles.timeLabel}>{displayLabel}</Text>
    </View>
  );
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // If race has started/passed
  if (timeLeft.total <= 0) {
    return (
      <View style={styles.startedContainer}>
        <Text style={styles.startedText}>Race Started</Text>
      </View>
    );
  }

  return (
    <View style={[styles.timerRow, compact && styles.timerRowCompact]}>
      {timeLeft.days > 0 && (
        <>
          <TimeBlock value={timeLeft.days} label="DAYS" compact={compact} />
          <Text style={compact ? styles.separatorCompact : styles.separator}> </Text>
        </>
      )}
      <TimeBlock value={timeLeft.hours} label="HRS" compact={compact} />
      <Text style={compact ? styles.separatorCompact : styles.separator}> </Text>
      <TimeBlock value={timeLeft.minutes} label="MINS" compact={compact} />
      {!compact && (
        <>
          <Text style={styles.separator}> </Text>
          <TimeBlock value={timeLeft.seconds} label="SECS" compact={compact} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  timerRowCompact: {
    gap: 3,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 28,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  timeValueCompact: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  timeLabelCompact: {
    fontSize: 7,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  separator: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.text.tertiary,
    opacity: 0.3,
    marginHorizontal: 2,
  },
  separatorCompact: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.text.tertiary,
    opacity: 0.3,
    marginHorizontal: 1,
  },
  startedContainer: {
    paddingVertical: Spacing.xs,
  },
  startedText: {
    ...Typography.bodyBold,
    fontSize: 12,
    color: colors.success[600],
  },
});
