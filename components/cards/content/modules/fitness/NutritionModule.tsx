/**
 * NutritionModule
 *
 * Displays pre- and post-workout nutrition, hydration status, and macros.
 * - Prep: pre-workout nutrition + hydration
 * - Train: hydration reminder
 * - Review: post-workout nutrition log with macros summary
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Coffee,
  Droplets,
  Apple,
  Flame,
  Beef,
  Wheat,
  Egg,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface NutritionModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Constants & mock data
// ---------------------------------------------------------------------------

const ACCENT = '#2E7D32';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const PRE_WORKOUT = {
  meal: 'Oatmeal + banana + coffee',
  timeBefore: '45 min before',
  hydration: '750 ml water',
};

const POST_WORKOUT = {
  recommendedMeal: 'Grilled chicken + rice + veggies',
  proteinTarget: '30g within 30 min',
  hydrationGoal: '500 ml water + electrolytes',
};

const MACROS = {
  calories: { value: 2450, label: 'Cal' },
  protein: { value: 165, label: 'Protein', unit: 'g' },
  carbs: { value: 285, label: 'Carbs', unit: 'g' },
  fat: { value: 72, label: 'Fat', unit: 'g' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function NutritionModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: NutritionModuleProps) {
  if (isCollapsed) return null;

  // ---- TRAIN phase: hydration reminder ----
  if (phase === 'on_water') {
    return (
      <View style={styles.container}>
        <View style={styles.hydrationReminder}>
          <Droplets size={20} color={IOS_COLORS.blue} />
          <View style={styles.hydrationInfo}>
            <Text style={styles.hydrationTitle}>Stay Hydrated</Text>
            <Text style={styles.hydrationSubtitle}>
              Sip 200 ml every 15-20 minutes during training
            </Text>
          </View>
        </View>
        <View style={styles.hydrationProgressBar}>
          <View style={[styles.hydrationProgressFill, { width: '45%' }]} />
        </View>
        <Text style={styles.hydrationProgressLabel}>~750 ml of 1,500 ml goal</Text>
      </View>
    );
  }

  // ---- REVIEW phase: post-workout nutrition log ----
  if (phase === 'after_race') {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>POST-WORKOUT NUTRITION</Text>

        <View style={styles.mealRow}>
          <Apple size={16} color={ACCENT} />
          <View style={styles.mealInfo}>
            <Text style={styles.mealLabel}>Recovery Meal</Text>
            <Text style={styles.mealValue}>{POST_WORKOUT.recommendedMeal}</Text>
          </View>
        </View>

        <View style={styles.mealRow}>
          <Beef size={16} color={IOS_COLORS.red} />
          <View style={styles.mealInfo}>
            <Text style={styles.mealLabel}>Protein Target</Text>
            <Text style={styles.mealValue}>{POST_WORKOUT.proteinTarget}</Text>
          </View>
        </View>

        <View style={styles.mealRow}>
          <Droplets size={16} color={IOS_COLORS.blue} />
          <View style={styles.mealInfo}>
            <Text style={styles.mealLabel}>Hydration Goal</Text>
            <Text style={styles.mealValue}>{POST_WORKOUT.hydrationGoal}</Text>
          </View>
        </View>

        <View style={styles.macrosRow}>
          <MacroCard label={MACROS.calories.label} value={String(MACROS.calories.value)} color={IOS_COLORS.orange} icon={<Flame size={14} color={IOS_COLORS.orange} />} />
          <MacroCard label={MACROS.protein.label} value={`${MACROS.protein.value}${MACROS.protein.unit}`} color={IOS_COLORS.red} icon={<Beef size={14} color={IOS_COLORS.red} />} />
          <MacroCard label={MACROS.carbs.label} value={`${MACROS.carbs.value}${MACROS.carbs.unit}`} color={IOS_COLORS.orange} icon={<Wheat size={14} color={IOS_COLORS.orange} />} />
          <MacroCard label={MACROS.fat.label} value={`${MACROS.fat.value}${MACROS.fat.unit}`} color={IOS_COLORS.yellow} icon={<Egg size={14} color={IOS_COLORS.yellow} />} />
        </View>
      </View>
    );
  }

  // ---- PREP phase (default): pre-workout nutrition + hydration ----
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PRE-WORKOUT NUTRITION</Text>

      <View style={styles.mealRow}>
        <Coffee size={16} color={TEXT_SECONDARY} />
        <View style={styles.mealInfo}>
          <Text style={styles.mealLabel}>Pre-Workout Meal</Text>
          <Text style={styles.mealValue}>{PRE_WORKOUT.meal}</Text>
        </View>
      </View>

      <View style={styles.mealRow}>
        <Flame size={16} color={IOS_COLORS.orange} />
        <View style={styles.mealInfo}>
          <Text style={styles.mealLabel}>Timing</Text>
          <Text style={styles.mealValue}>{PRE_WORKOUT.timeBefore}</Text>
        </View>
      </View>

      <View style={styles.mealRow}>
        <Droplets size={16} color={IOS_COLORS.blue} />
        <View style={styles.mealInfo}>
          <Text style={styles.mealLabel}>Hydration</Text>
          <Text style={styles.mealValue}>{PRE_WORKOUT.hydration}</Text>
        </View>
      </View>

      <View style={styles.macrosRow}>
        <MacroCard label={MACROS.calories.label} value={String(MACROS.calories.value)} color={IOS_COLORS.orange} icon={<Flame size={14} color={IOS_COLORS.orange} />} />
        <MacroCard label={MACROS.protein.label} value={`${MACROS.protein.value}${MACROS.protein.unit}`} color={IOS_COLORS.red} icon={<Beef size={14} color={IOS_COLORS.red} />} />
        <MacroCard label={MACROS.carbs.label} value={`${MACROS.carbs.value}${MACROS.carbs.unit}`} color={IOS_COLORS.orange} icon={<Wheat size={14} color={IOS_COLORS.orange} />} />
        <MacroCard label={MACROS.fat.label} value={`${MACROS.fat.value}${MACROS.fat.unit}`} color={IOS_COLORS.yellow} icon={<Egg size={14} color={IOS_COLORS.yellow} />} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MacroCard sub-component
// ---------------------------------------------------------------------------

function MacroCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={[styles.macroCard, { borderColor: color + '30' }]}>
      {icon}
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
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
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  // -- Meal rows --
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  mealInfo: {
    flex: 1,
    gap: 1,
  },
  mealLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mealValue: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_PRIMARY,
  },

  // -- Macros row --
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // -- Hydration reminder (Train) --
  hydrationReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hydrationInfo: {
    flex: 1,
    gap: 2,
  },
  hydrationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  hydrationSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  hydrationProgressBar: {
    height: 6,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  hydrationProgressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 3,
  },
  hydrationProgressLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: TEXT_MUTED,
    textAlign: 'right',
  },
});

export default NutritionModule;
