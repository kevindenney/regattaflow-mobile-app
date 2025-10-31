/**
 * CompactCommsCard Component
 *
 * Compact communications channel display card inspired by macOS Weather app
 */

// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherMetricCard } from './WeatherMetricCard';
import { colors, Spacing } from '@/constants/designSystem';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface CompactCommsCardProps {
  vhfChannel?: string;
  workingChannel?: string;
  raceOfficer?: string;
}

// VHF Radio icon illustration
const RadioIllustration: React.FC<{ size: number }> = ({ size }) => {
  const radioColor = colors.info[600];

  return (
    <Svg width={size} height={size}>
      {/* Radio body */}
      <Rect
        x={size * 0.25}
        y={size * 0.3}
        width={size * 0.5}
        height={size * 0.5}
        rx={4}
        stroke={radioColor}
        strokeWidth={2}
        fill="none"
      />

      {/* Antenna */}
      <Path
        d={`M ${size / 2},${size * 0.3} L ${size / 2},${size * 0.1}`}
        stroke={radioColor}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Antenna tip */}
      <Circle cx={size / 2} cy={size * 0.1} r={3} fill={radioColor} />

      {/* Display screen */}
      <Rect
        x={size * 0.32}
        y={size * 0.4}
        width={size * 0.36}
        height={size * 0.15}
        rx={2}
        fill={radioColor}
        opacity={0.3}
      />

      {/* Buttons */}
      <Circle cx={size * 0.4} cy={size * 0.68} r={2} fill={radioColor} opacity={0.5} />
      <Circle cx={size * 0.5} cy={size * 0.68} r={2} fill={radioColor} opacity={0.5} />
      <Circle cx={size * 0.6} cy={size * 0.68} r={2} fill={radioColor} opacity={0.5} />
    </Svg>
  );
};

export const CompactCommsCard: React.FC<CompactCommsCardProps> = ({
  vhfChannel,
  workingChannel,
  raceOfficer,
}) => {
  return (
    <WeatherMetricCard
      title="COMMS"
      icon="radio-outline"
      backgroundColor={colors.background.card}
    >
      <View style={styles.container}>
        {/* Radio illustration */}
        <RadioIllustration size={60} />

        {/* VHF Channel - Main emphasis */}
        {vhfChannel && (
          <View style={styles.mainChannelContainer}>
            <Text style={styles.channelLabel}>VHF</Text>
            <Text style={styles.mainChannel}>{vhfChannel}</Text>
          </View>
        )}

        {/* Working channel */}
        {workingChannel && workingChannel !== vhfChannel && (
          <View style={styles.infoRow}>
            <Ionicons name="swap-horizontal-outline" size={12} color={colors.text.tertiary} />
            <Text style={styles.infoText}>Ch {workingChannel}</Text>
          </View>
        )}

        {/* Race officer */}
        {raceOfficer && (
          <View style={styles.badge}>
            <Ionicons name="person-outline" size={10} color={colors.info[700]} />
            <Text style={styles.badgeText} numberOfLines={1}>
              {raceOfficer}
            </Text>
          </View>
        )}
      </View>
    </WeatherMetricCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
    paddingVertical: Spacing.xs,
  },
  mainChannelContainer: {
    alignItems: 'center',
    gap: 2,
    marginTop: Spacing.xs,
  },
  channelLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  mainChannel: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.info[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: Spacing.xs,
    maxWidth: '90%',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.info[700],
    letterSpacing: 0.3,
  },
});
