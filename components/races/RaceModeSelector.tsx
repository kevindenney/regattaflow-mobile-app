/**
 * Race Mode Selector Component
 * Tab navigation between Plan, Race, and Debrief modes
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Calendar, Navigation, TrendingUp } from 'lucide-react-native';
import type { RacePhase } from '@/services/ai/SkillManagementService';

export type RaceMode = 'plan' | 'race' | 'debrief';

interface RaceModeSelectorProps {
  currentMode: RaceMode;
  onModeChange: (mode: RaceMode) => void;
  racePhase?: RacePhase;
  disabled?: boolean;
}

interface ModeConfig {
  id: RaceMode;
  label: string;
  icon: typeof Calendar;
  color: string;
  description: string;
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'plan',
    label: 'Plan',
    icon: Calendar,
    color: '#3b82f6', // blue-500
    description: 'Shore preparation & strategy',
  },
  {
    id: 'race',
    label: 'Race',
    icon: Navigation,
    color: '#10b981', // green-500
    description: 'On-water execution',
  },
  {
    id: 'debrief',
    label: 'Debrief',
    icon: TrendingUp,
    color: '#8b5cf6', // purple-500
    description: 'Post-race analysis',
  },
];

/**
 * Get phase indicator badge for current race phase
 */
function getPhaseIndicator(phase?: RacePhase): string | null {
  if (!phase) return null;

  const phaseMap: Record<RacePhase, string> = {
    'pre-race': '📋',
    'start-sequence': '🏁',
    'first-beat': '⛵',
    'weather-mark': '🎯',
    'reaching': '🌊',
    'running': '🌊',
    'leeward-mark': '🎯',
    'final-beat': '⛵',
    'finish': '🏆',
  };

  return phaseMap[phase] || null;
}

export function RaceModeSelector({
  currentMode,
  onModeChange,
  racePhase,
  disabled = false,
}: RaceModeSelectorProps) {
  const phaseIndicator = getPhaseIndicator(racePhase);

  return (
    <View style={styles.container}>
      {/* Mode Tabs */}
      <View style={styles.tabContainer}>
        {MODE_CONFIGS.map((mode) => {
          const isActive = currentMode === mode.id;
          const IconComponent = mode.icon;

          return (
            <Pressable
              key={mode.id}
              onPress={() => !disabled && onModeChange(mode.id)}
              disabled={disabled}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                disabled && styles.tabDisabled,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive, disabled }}
              accessibilityLabel={`${mode.label} mode: ${mode.description}`}
            >
              {/* Icon */}
              <IconComponent
                size={20}
                color={isActive ? mode.color : '#9ca3af'}
                style={styles.icon}
              />

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  { color: isActive ? mode.color : '#6b7280' },
                ]}
              >
                {mode.label}
              </Text>

              {/* Phase Badge (for RACE mode only) */}
              {mode.id === 'race' && phaseIndicator && isActive && (
                <View style={styles.phaseBadge}>
                  <Text style={styles.phaseBadgeText}>{phaseIndicator}</Text>
                </View>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <View
                  style={[styles.activeBar, { backgroundColor: mode.color }]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Mode Description (Optional - for larger screens) */}
      {/* <Text style={styles.description}>
        {MODE_CONFIGS.find((m) => m.id === currentMode)?.description}
      </Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabActive: {
    // Active state styling handled by text color and bar
  },
  tabDisabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  labelActive: {
    fontWeight: '700',
  },
  phaseBadge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  phaseBadgeText: {
    fontSize: 12,
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
