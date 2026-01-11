/**
 * OnWaterContent - On Water Phase Content
 *
 * Content shown when selectedPhase === 'on_water'
 * Includes:
 * - Countdown timer
 * - Course info (VHF, signals, course number)
 * - Quick rules reference
 * - Check-in status
 * - GPS tracking (when active)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Radio, Map, BookOpen, Check, Navigation } from 'lucide-react-native';

import { CardRaceData, getTimeUntilRace } from '../../types';
import { useRacePreparation } from '@/hooks/useRacePreparation';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface OnWaterContentProps {
  race: CardRaceData;
  onStartTimer?: () => void;
  isExpanded?: boolean;
}

/**
 * Format countdown for display
 */
function formatCountdown(ms: number): { value: string; label: string; urgent: boolean } {
  const absMs = Math.abs(ms);
  const isPast = ms < 0;

  if (isPast) {
    const hoursAgo = absMs / (1000 * 60 * 60);
    if (hoursAgo < 1) {
      const mins = Math.floor(absMs / (1000 * 60));
      return { value: `+${mins}`, label: 'min', urgent: false };
    }
    return { value: `+${Math.round(hoursAgo)}`, label: 'hr', urgent: false };
  }

  const minutes = Math.floor(absMs / (1000 * 60));
  const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return { value: `${hours}:${mins.toString().padStart(2, '0')}`, label: 'hr:min', urgent: false };
  }

  if (minutes <= 5) {
    return {
      value: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      label: 'min:sec',
      urgent: true,
    };
  }

  return { value: `${minutes}`, label: 'min', urgent: minutes <= 10 };
}

export function OnWaterContent({
  race,
  onStartTimer,
  isExpanded = true,
}: OnWaterContentProps) {
  // Live countdown
  const [timeUntilRace, setTimeUntilRace] = useState(() => getTimeUntilRace(race.date, race.startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRace(getTimeUntilRace(race.date, race.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [race.date, race.startTime]);

  const countdown = useMemo(() => formatCountdown(timeUntilRace), [timeUntilRace]);

  // Race info
  const vhfChannel = race.vhf_channel;
  const courseNumber = (race as any).course_number || (race as any).course_code;
  const raceType = race.race_type || 'fleet';

  // Check-in status (would come from race entry in production)
  const [checkedIn, setCheckedIn] = useState(false);

  // Pre-start checklist
  const preStartChecks = [
    { id: 'course', label: 'Sailed course in miniature', done: false },
    { id: 'laylines', label: 'Checked laylines', done: false },
    { id: 'favored', label: 'Identified favored end', done: false },
    { id: 'rules', label: 'Reviewed start rules', done: false },
  ];

  // Check if race is significantly past (2+ hours since start)
  const isRaceCompleted = timeUntilRace < -2 * 60 * 60 * 1000;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // For completed races, show simplified view
  if (isRaceCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedValue}>{countdown.value}hr</Text>
          <Text style={styles.completedLabel}>since start</Text>
          <Text style={styles.completedHint}>Switch to "Review" tab for results</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Countdown Timer */}
      <View style={[styles.countdownContainer, countdown.urgent && styles.countdownUrgent]}>
        <Text style={[styles.countdownValue, countdown.urgent && styles.countdownValueUrgent]}>
          {countdown.value}
        </Text>
        <Text style={[styles.countdownLabel, countdown.urgent && styles.countdownLabelUrgent]}>
          {timeUntilRace >= 0 ? `${countdown.label} to start` : 'since start'}
        </Text>
      </View>

      {/* Start Timer Button */}
      {onStartTimer && timeUntilRace > 0 && timeUntilRace < 30 * 60 * 1000 && (
        <Pressable style={styles.startTimerButton} onPress={onStartTimer}>
          <Text style={styles.startTimerText}>Start Race Timer</Text>
        </Pressable>
      )}

      {/* Race Info Grid */}
      <View style={styles.infoGrid}>
        {vhfChannel && (
          <View style={styles.infoItem}>
            <Radio size={18} color={IOS_COLORS.blue} />
            <View>
              <Text style={styles.infoLabel}>VHF</Text>
              <Text style={styles.infoValue}>Ch {vhfChannel}</Text>
            </View>
          </View>
        )}
        {courseNumber && (
          <View style={styles.infoItem}>
            <Map size={18} color={IOS_COLORS.green} />
            <View>
              <Text style={styles.infoLabel}>Course</Text>
              <Text style={styles.infoValue}>{courseNumber}</Text>
            </View>
          </View>
        )}
        <View style={styles.infoItem}>
          <BookOpen size={18} color={IOS_COLORS.orange} />
          <View>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{raceType.charAt(0).toUpperCase() + raceType.slice(1)}</Text>
          </View>
        </View>
      </View>

      {/* Check-in Status */}
      <Pressable
        style={[styles.checkInButton, checkedIn && styles.checkInButtonDone]}
        onPress={() => setCheckedIn(!checkedIn)}
      >
        <Check size={18} color={checkedIn ? '#FFFFFF' : IOS_COLORS.blue} />
        <Text style={[styles.checkInText, checkedIn && styles.checkInTextDone]}>
          {checkedIn ? 'Checked in with RC' : 'Tap when checked in'}
        </Text>
      </Pressable>

      {/* Pre-Start Checklist (expanded only) */}
      {isExpanded && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRE-START CHECKS</Text>
          <View style={styles.checklistContainer}>
            {preStartChecks.map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                  {item.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checklistLabel, item.done && styles.checklistLabelDone]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Rules Reference */}
      {isExpanded && (
        <View style={styles.rulesContainer}>
          <Text style={styles.sectionLabel}>QUICK RULES</Text>
          <View style={styles.rulesList}>
            <Text style={styles.ruleItem}>• Port gives way to starboard</Text>
            <Text style={styles.ruleItem}>• Windward boat keeps clear</Text>
            <Text style={styles.ruleItem}>• Boat clear astern keeps clear</Text>
            <Text style={styles.ruleItem}>• Proper course at mark (3 lengths)</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Completed Race View
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  completedValue: {
    fontSize: 32,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  completedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  completedHint: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    marginTop: 12,
  },

  // Countdown
  countdownContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  countdownUrgent: {
    backgroundColor: `${IOS_COLORS.red}15`,
  },
  countdownValue: {
    fontSize: 48,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  countdownValueUrgent: {
    color: IOS_COLORS.red,
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  countdownLabelUrgent: {
    color: IOS_COLORS.red,
  },

  // Start Timer Button
  startTimerButton: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startTimerText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Check-in Button
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: IOS_COLORS.blue,
    borderRadius: 12,
    paddingVertical: 12,
  },
  checkInButtonDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkInText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  checkInTextDone: {
    color: '#FFFFFF',
  },

  // Section
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },

  // Checklist
  checklistContainer: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  checklistLabelDone: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },

  // Rules
  rulesContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  rulesList: {
    gap: 6,
  },
  ruleItem: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
});

export default OnWaterContent;
