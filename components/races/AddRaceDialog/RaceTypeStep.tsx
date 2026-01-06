/**
 * RaceTypeStep Component
 *
 * Step 1 of AddRaceDialog: Choose race type
 * Apple-style vertical selection list with fixed footer
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Flag, Navigation, Target, Users, Check, LucideIcon } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IOS_COLORS } from '@/components/cards/constants';
import { RaceType, RACE_TYPE_COLORS } from '../RaceTypeSelector';

interface RaceTypeStepProps {
  selectedType: RaceType | null;
  onSelect: (type: RaceType) => void;
  onNext: () => void;
}

interface RaceTypeOption {
  type: RaceType;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const RACE_TYPE_OPTIONS: RaceTypeOption[] = [
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
  const handleSelect = useCallback(
    (type: RaceType) => {
      // Haptic feedback on selection
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSelect(type);
    },
    [onSelect]
  );

  const handleContinue = useCallback(() => {
    if (selectedType) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onNext();
    }
  }, [selectedType, onNext]);

  return (
    <View style={styles.container}>
      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>What type of race?</Text>

        {/* Selection list card */}
        <View style={styles.listCard}>
          {RACE_TYPE_OPTIONS.map((option, index) => {
            const isSelected = selectedType === option.type;
            const isLast = index === RACE_TYPE_OPTIONS.length - 1;
            const typeColors = RACE_TYPE_COLORS[option.type];
            const IconComponent = option.icon;

            return (
              <Pressable
                key={option.type}
                style={({ pressed }) => [
                  styles.rowContainer,
                  !isLast && styles.rowWithSeparator,
                  pressed && styles.rowPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleSelect(option.type);
                }}
              >
                <View style={styles.rowInner}>
                  {/* Icon */}
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: typeColors.badge },
                    ]}
                  >
                    <IconComponent size={22} color={typeColors.primary} />
                  </View>

                  {/* Text content */}
                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle}>{option.title}</Text>
                    <Text style={styles.rowSubtitle}>{option.subtitle}</Text>
                  </View>

                  {/* Checkmark */}
                  <View style={styles.checkmarkContainer}>
                    {isSelected && (
                      <Animated.View
                        entering={FadeIn.duration(150)}
                        exiting={FadeOut.duration(100)}
                      >
                        <Check size={22} color={IOS_COLORS.blue} strokeWidth={3} />
                      </Animated.View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleContinue}
          disabled={!selectedType}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.continueButtonBase,
                {
                  backgroundColor: selectedType ? IOS_COLORS.blue : IOS_COLORS.gray5,
                  opacity: pressed && selectedType ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.continueButtonTextBase,
                  { color: selectedType ? IOS_COLORS.systemBackground : IOS_COLORS.gray },
                ]}
              >
                Continue
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  listCard: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: IOS_COLORS.label,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  rowContainer: {
    backgroundColor: IOS_COLORS.systemBackground,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 72,
  },
  rowWithSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  rowPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  continueButtonBase: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonTextBase: {
    fontSize: 17,
    fontWeight: '600',
  },
});

export default RaceTypeStep;
