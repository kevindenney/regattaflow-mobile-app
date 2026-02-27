/**
 * WarmupModule
 *
 * Displays warmup and cooldown routines with checkbox toggles and timer buttons.
 * - Prep: shows warmup items with timers
 * - Train: minimal warmup-complete reminder
 * - Review: shows cooldown items
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CheckCircle2,
  Circle,
  Timer,
  RotateCcw,
  Wind,
  Activity,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface WarmupModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface RoutineItem {
  id: string;
  name: string;
  duration: string;
  isTimed: boolean;
  timerSeconds?: number;
  icon: 'roll' | 'rotate' | 'band' | 'squat' | 'stretch' | 'breathe';
}

const WARMUP_ITEMS: RoutineItem[] = [
  { id: 'w1', name: 'Foam Rolling', duration: '5 min', isTimed: true, timerSeconds: 300, icon: 'roll' },
  { id: 'w2', name: 'Hip Circles', duration: '2x10 each', isTimed: false, icon: 'rotate' },
  { id: 'w3', name: 'Band Pull-Aparts', duration: '2x15', isTimed: false, icon: 'band' },
  { id: 'w4', name: 'Goblet Squats', duration: '1x10', isTimed: false, icon: 'squat' },
];

const COOLDOWN_ITEMS: RoutineItem[] = [
  { id: 'c1', name: 'Static Stretches', duration: '5 min', isTimed: true, timerSeconds: 300, icon: 'stretch' },
  { id: 'c2', name: 'Foam Rolling', duration: '3 min', isTimed: true, timerSeconds: 180, icon: 'roll' },
  { id: 'c3', name: 'Deep Breathing', duration: '2 min', isTimed: true, timerSeconds: 120, icon: 'breathe' },
];

const ACCENT = '#2E7D32';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

function getIconForType(type: RoutineItem['icon'], color: string) {
  switch (type) {
    case 'roll':
      return <RotateCcw size={16} color={color} />;
    case 'rotate':
      return <Activity size={16} color={color} />;
    case 'band':
      return <Activity size={16} color={color} />;
    case 'squat':
      return <Activity size={16} color={color} />;
    case 'stretch':
      return <Wind size={16} color={color} />;
    case 'breathe':
      return <Wind size={16} color={color} />;
    default:
      return <Activity size={16} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function WarmupModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: WarmupModuleProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (isCollapsed) return null;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- TRAIN phase: minimal reminder ----
  if (phase === 'on_water') {
    const warmupDone = WARMUP_ITEMS.every((item) => checked.has(item.id));
    return (
      <View style={styles.container}>
        <View style={styles.reminderRow}>
          {warmupDone ? (
            <CheckCircle2 size={18} color={ACCENT} />
          ) : (
            <Timer size={18} color={IOS_COLORS.orange} />
          )}
          <Text style={[styles.reminderText, warmupDone && { color: ACCENT }]}>
            {warmupDone ? 'Warmup complete' : 'Complete your warmup before starting'}
          </Text>
        </View>
      </View>
    );
  }

  // ---- REVIEW phase: cooldown items ----
  if (phase === 'after_race') {
    const cooldownDone = COOLDOWN_ITEMS.filter((i) => checked.has(i.id)).length;
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>COOLDOWN</Text>
          <Text style={styles.progressSmall}>
            {cooldownDone}/{COOLDOWN_ITEMS.length}
          </Text>
        </View>
        {COOLDOWN_ITEMS.map((item) => {
          const done = checked.has(item.id);
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.7 }]}
              onPress={() => toggle(item.id)}
            >
              {done ? (
                <CheckCircle2 size={18} color={ACCENT} />
              ) : (
                <Circle size={18} color={IOS_COLORS.gray3} />
              )}
              <View style={styles.itemIcon}>
                {getIconForType(item.icon, done ? ACCENT : TEXT_SECONDARY)}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, done && styles.itemNameDone]}>{item.name}</Text>
                <Text style={styles.itemDuration}>{item.duration}</Text>
              </View>
              {item.isTimed && !done && (
                <Pressable style={styles.timerButton}>
                  <Timer size={13} color={ACCENT} />
                  <Text style={styles.timerButtonText}>
                    Start {Math.floor(item.timerSeconds! / 60)}:{String(item.timerSeconds! % 60).padStart(2, '0')}
                  </Text>
                </Pressable>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  }

  // ---- PREP phase (default): warmup items ----
  const warmupDone = WARMUP_ITEMS.filter((i) => checked.has(i.id)).length;
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>WARMUP</Text>
        <Text style={styles.progressSmall}>
          {warmupDone}/{WARMUP_ITEMS.length}
        </Text>
      </View>
      {WARMUP_ITEMS.map((item) => {
        const done = checked.has(item.id);
        return (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.7 }]}
            onPress={() => toggle(item.id)}
          >
            {done ? (
              <CheckCircle2 size={18} color={ACCENT} />
            ) : (
              <Circle size={18} color={IOS_COLORS.gray3} />
            )}
            <View style={styles.itemIcon}>
              {getIconForType(item.icon, done ? ACCENT : TEXT_SECONDARY)}
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, done && styles.itemNameDone]}>{item.name}</Text>
              <Text style={styles.itemDuration}>{item.duration}</Text>
            </View>
            {item.isTimed && !done && (
              <Pressable style={styles.timerButton}>
                <Timer size={13} color={ACCENT} />
                <Text style={styles.timerButtonText}>
                  Start {Math.floor(item.timerSeconds! / 60)}:{String(item.timerSeconds! % 60).padStart(2, '0')}
                </Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    letterSpacing: 0.6,
  },
  progressSmall: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  itemIcon: {
    width: 24,
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_PRIMARY,
  },
  itemNameDone: {
    color: TEXT_MUTED,
    textDecorationLine: 'line-through',
  },
  itemDuration: {
    fontSize: 11,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2E7D3210',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: ACCENT,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  reminderText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.orange,
  },
});

export default WarmupModule;
