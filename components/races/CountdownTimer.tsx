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

/**
 * Tufte compact format: "2d 4h 30m" instead of verbose blocks
 */
const formatCompactCountdown = (timeLeft: TimeLeft, compact: boolean): string => {
  const { days, hours, minutes } = timeLeft;

  if (days > 0) {
    return compact ? `${days}d ${hours}h` : `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
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

  // Tufte compact format: single line, no verbose labels
  return (
    <View style={[styles.timerRow, compact && styles.timerRowCompact]}>
      <Text style={compact ? styles.countdownCompact : styles.countdownFull}>
        {formatCompactCountdown(timeLeft, compact)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRowCompact: {
    // Same as timerRow for compact format
  },
  // Tufte compact countdown styles
  countdownFull: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  countdownCompact: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
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
