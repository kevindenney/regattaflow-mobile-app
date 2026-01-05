/**
 * RaceTypeSelector Component
 * Toggle selector for choosing between different racing formats
 * Used in Add Race flow and potentially for filtering
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Sailboat, Navigation, Target, Users } from 'lucide-react-native';

export type RaceType = 'fleet' | 'distance' | 'match' | 'team';

// Race type theme colors
export const RACE_TYPE_COLORS = {
  fleet: {
    primary: '#0369A1',
    badge: '#E0F2FE',
  },
  distance: {
    primary: '#7C3AED',
    badge: '#EDE9FE',
  },
  match: {
    primary: '#EA580C',
    badge: '#FFF7ED',
  },
  team: {
    primary: '#0D9488',
    badge: '#F0FDFA',
  },
} as const;

interface RaceTypeSelectorProps {
  value: RaceType;
  onChange: (type: RaceType) => void;
  disabled?: boolean;
  size?: 'normal' | 'compact';
}

export function RaceTypeSelector({ 
  value, 
  onChange, 
  disabled = false,
  size = 'normal' 
}: RaceTypeSelectorProps) {
  const isCompact = size === 'compact';
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, isCompact && styles.labelCompact]}>Race Type</Text>
      <View style={[styles.toggleContainer, isCompact && styles.toggleContainerCompact]}>
        {/* Fleet Racing Option */}
        <Pressable
          style={[
            styles.option,
            isCompact && styles.optionCompact,
            value === 'fleet' && styles.optionSelected,
            disabled && styles.optionDisabled,
          ]}
          onPress={() => !disabled && onChange('fleet')}
          disabled={disabled}
        >
          <View style={styles.optionContent}>
            <Sailboat 
              size={isCompact ? 18 : 24} 
              color={value === 'fleet' ? '#FFFFFF' : '#64748B'} 
            />
            <Text style={[
              styles.optionText,
              isCompact && styles.optionTextCompact,
              value === 'fleet' && styles.optionTextSelected,
            ]}>
              Fleet Racing
            </Text>
            {!isCompact && (
              <Text style={[
                styles.optionSubtext,
                value === 'fleet' && styles.optionSubtextSelected,
              ]}>
                Buoy courses
              </Text>
            )}
          </View>
        </Pressable>

        {/* Distance Racing Option */}
        <Pressable
          style={[
            styles.option,
            isCompact && styles.optionCompact,
            value === 'distance' && styles.optionSelected,
            disabled && styles.optionDisabled,
          ]}
          onPress={() => !disabled && onChange('distance')}
          disabled={disabled}
        >
          <View style={styles.optionContent}>
            <Navigation 
              size={isCompact ? 18 : 24} 
              color={value === 'distance' ? '#FFFFFF' : '#64748B'} 
            />
            <Text style={[
              styles.optionText,
              isCompact && styles.optionTextCompact,
              value === 'distance' && styles.optionTextSelected,
            ]}>
              Distance Racing
            </Text>
            {!isCompact && (
              <Text style={[
                styles.optionSubtext,
                value === 'distance' && styles.optionSubtextSelected,
              ]}>
                Offshore / passage
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Inline badge version for displaying race type on cards
 */
interface RaceTypeBadgeProps {
  type: RaceType;
  size?: 'small' | 'normal';
}

const RACE_TYPE_CONFIG = {
  fleet: {
    icon: Sailboat,
    label: 'Fleet',
  },
  distance: {
    icon: Navigation,
    label: 'Distance',
  },
  match: {
    icon: Target,
    label: 'Match',
  },
  team: {
    icon: Users,
    label: 'Team',
  },
} as const;

export function RaceTypeBadge({ type, size = 'normal' }: RaceTypeBadgeProps) {
  const isSmall = size === 'small';
  const config = RACE_TYPE_CONFIG[type];
  const colors = RACE_TYPE_COLORS[type];
  const IconComponent = config.icon;

  return (
    <View style={[
      styles.badge,
      isSmall && styles.badgeSmall,
      { backgroundColor: colors.badge },
    ]}>
      <IconComponent size={isSmall ? 10 : 12} color={colors.primary} />
      <Text style={[
        styles.badgeText,
        isSmall && styles.badgeTextSmall,
        { color: colors.primary },
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelCompact: {
    fontSize: 12,
    marginBottom: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleContainerCompact: {
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  optionCompact: {
    padding: 10,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionContent: {
    alignItems: 'center',
    gap: 6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  optionTextCompact: {
    fontSize: 12,
    marginTop: 2,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  optionSubtextSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextSmall: {
    fontSize: 10,
  },
});

export default RaceTypeSelector;

