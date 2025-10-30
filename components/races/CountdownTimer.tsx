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
}) => (
  <View style={styles.timeBlock}>
    <Text style={compact ? styles.timeValueCompact : styles.timeValue}>
      {String(value).padStart(2, '0')}
    </Text>
    <Text style={compact ? styles.timeLabelCompact : styles.timeLabel}>{label}</Text>
  </View>
);

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
      {timeLeft.days > 0 && <TimeBlock value={timeLeft.days} label="DAYS" compact={compact} />}
      {timeLeft.days > 0 && <Text style={styles.separator}>:</Text>}
      <TimeBlock value={timeLeft.hours} label="HRS" compact={compact} />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.minutes} label="MIN" compact={compact} />
      {!compact && (
        <>
          <Text style={styles.separator}>:</Text>
          <TimeBlock value={timeLeft.seconds} label="SEC" compact={compact} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timerRowCompact: {
    gap: 2,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 24,
  },
  timeValueCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 20,
  },
  timeLabel: {
    fontSize: 7,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  timeLabelCompact: {
    fontSize: 6,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  separator: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginTop: -10,
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
