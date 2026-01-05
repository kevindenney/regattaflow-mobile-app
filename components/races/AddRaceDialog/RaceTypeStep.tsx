/**
 * RaceTypeStep Component
 *
 * Step 1 of AddRaceDialog: Choose race type
 * Displays a 2x2 grid of race type cards with themed colors
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Flag, Navigation, Target, Users, LucideIcon } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius, colors, Shadows } from '@/constants/designSystem';
import { RaceType, RACE_TYPE_COLORS } from '../RaceTypeSelector';

interface RaceTypeStepProps {
  selectedType: RaceType | null;
  onSelect: (type: RaceType) => void;
  onNext: () => void;
}

interface RaceTypeCardConfig {
  type: RaceType;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const RACE_TYPE_CARDS: RaceTypeCardConfig[] = [
  {
    type: 'fleet',
    icon: Flag,
    title: 'Fleet Racing',
    subtitle: 'Buoy courses, club racing',
  },
  {
    type: 'distance',
    icon: Navigation,
    title: 'Distance Racing',
    subtitle: 'Offshore, passage races',
  },
  {
    type: 'match',
    icon: Target,
    title: 'Match Racing',
    subtitle: '1v1 competition',
  },
  {
    type: 'team',
    icon: Users,
    title: 'Team Racing',
    subtitle: 'Multi-boat team races',
  },
];

export function RaceTypeStep({ selectedType, onSelect, onNext }: RaceTypeStepProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>What type of race?</Text>
      </View>

      {/* Grid of race type cards */}
      <View style={styles.grid}>
        {RACE_TYPE_CARDS.map((card) => {
          const isSelected = selectedType === card.type;
          const typeColors = RACE_TYPE_COLORS[card.type];
          const IconComponent = card.icon;

          return (
            <Pressable
              key={card.type}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                isSelected && { borderColor: typeColors.primary },
                pressed && styles.cardPressed,
              ]}
              onPress={() => onSelect(card.type)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isSelected ? typeColors.primary : typeColors.badge },
                ]}
              >
                <IconComponent
                  size={28}
                  color={isSelected ? '#FFFFFF' : typeColors.primary}
                />
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  isSelected && { color: typeColors.primary },
                ]}
              >
                {card.title}
              </Text>

              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>

              {/* Selection indicator */}
              {isSelected && (
                <View style={[styles.selectedIndicator, { backgroundColor: typeColors.primary }]}>
                  <View style={styles.selectedDot} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Next button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            !selectedType && styles.nextButtonDisabled,
            selectedType && { backgroundColor: RACE_TYPE_COLORS[selectedType].primary },
            pressed && selectedType && styles.nextButtonPressed,
          ]}
          onPress={onNext}
          disabled={!selectedType}
        >
          <Text style={[styles.nextButtonText, !selectedType && styles.nextButtonTextDisabled]}>
            Next
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  card: {
    width: '47%',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.large,
    borderWidth: 2,
    borderColor: colors.border.light,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
    position: 'relative',
  },
  cardSelected: {
    borderWidth: 2,
    ...Shadows.medium,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.bodyBold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: Spacing.xl,
  },
  nextButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  nextButtonPressed: {
    opacity: 0.9,
  },
  nextButtonText: {
    ...Typography.bodyBold,
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});

export default RaceTypeStep;
