/**
 * Race Mode Selector Component
 * Tab navigation between Prep, Race, and Review modes
 * Follows Apple HIG Segmented Control patterns
 */

import {
  IOS_COLORS,
  IOS_SHADOWS,
  IOS_SPACING
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { RacePhase } from '@/services/ai/SkillManagementService';
import { BarChart2, Calendar, CheckCircle, Flag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  description: string;
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'plan',
    label: 'Prep',
    icon: CheckCircle,
    description: 'Shore preparation & strategy',
  },
  {
    id: 'race',
    label: 'Race',
    icon: Flag,
    description: 'On-water execution',
  },
  {
    id: 'debrief',
    label: 'Review',
    icon: BarChart2,
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

  console.log('[RaceModeSelector] Render. Current Mode:', currentMode);

  // Animation for the sliding indicator
  // Note: In a full implementation we would measure layout, but for 3 fixed tabs
  // we can use percentages or flex basis.
  // Using simple conditional styling for reliability first, animation next.

  const handleModeChange = (mode: RaceMode) => {
    console.log('[RaceModeSelector] Mode change requested:', mode);
    if (disabled || mode === currentMode) return;
    triggerHaptic('selection');
    onModeChange(mode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {/* Active Indicator Background - Absolute positioned for animation effect
            For simpler implementation without complex layout measurement, 
            we color the active tab background directly. 
        */}

        {MODE_CONFIGS.map((mode, index) => {
          const isActive = currentMode === mode.id;
          const IconComponent = mode.icon;
          const isRaceMode = mode.id === 'race';

          return (
            <Pressable
              key={mode.id}
              onPress={() => handleModeChange(mode.id)}
              disabled={disabled}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                disabled && styles.tabDisabled,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive, disabled }}
              accessibilityLabel={`${mode.label} mode`}
            >
              <View style={styles.tabContent}>
                <IconComponent
                  size={16}
                  color={isActive ? IOS_COLORS.label : IOS_COLORS.secondaryLabel}
                  style={styles.icon}
                  strokeWidth={2.5}
                />

                <Text
                  style={[
                    styles.label,
                    isActive ? styles.labelActive : styles.labelInactive,
                  ]}
                >
                  {mode.label}
                </Text>

                {/* Phase Badge (Compact) */}
                {isRaceMode && phaseIndicator && (
                  <View style={styles.phaseBadge}>
                    <Text style={styles.phaseBadgeText}>{phaseIndicator}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: 'transparent',
    width: '100%',
    alignSelf: 'stretch',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.tertiarySystemFill, // Apple standard gray background
    borderRadius: 8.91,
    padding: 2,
    height: 32,
    width: '100%',
    justifyContent: 'space-between', // Distribute tabs
    alignItems: 'center',
  },
  tab: {
    width: '33.33%', // Force equal width
    height: '100%', // Ensure it fills height
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6.93,
    marginHorizontal: 0,
  },
  tabActive: {
    backgroundColor: IOS_COLORS.systemBackground,
    ...IOS_SHADOWS.sm,
    shadowOpacity: 0.12,
    shadowRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  icon: {
    // Icon styles if needed
  },
  label: {
    fontSize: 13,
    letterSpacing: -0.08,
  },
  labelActive: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  labelInactive: {
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  phaseBadge: {
    marginLeft: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  phaseBadgeText: {
    fontSize: 10,
  },
});
