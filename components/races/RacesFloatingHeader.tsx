/**
 * Races Floating Header
 *
 * Top header bar for the races screen with loading indicator,
 * add race button, and user avatar.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { floatingHeaderStyles } from '@/components/races/styles';

export interface RacesFloatingHeaderProps {
  /** Top inset for safe area */
  topInset: number;
  /** Whether insights are loading */
  loadingInsights?: boolean;
  /** Whether weather is loading */
  weatherLoading?: boolean;
  /** Whether device is online */
  isOnline: boolean;
  /** Callback when add race is pressed */
  onAddRace: () => void;
  /** Callback when settings/profile is pressed */
  onOpenSettings: () => void;
  /** User initial for avatar display */
  userInitial: string;
}

/**
 * Floating Header Component
 */
export function RacesFloatingHeader({
  topInset,
  loadingInsights = false,
  weatherLoading = false,
  isOnline,
  onAddRace,
  onOpenSettings,
  userInitial,
}: RacesFloatingHeaderProps) {
  return (
    <View style={[floatingHeaderStyles.container, { paddingTop: topInset + 8 }]}>
      <View style={floatingHeaderStyles.left}>
        {(loadingInsights || weatherLoading) && (
          <ActivityIndicator size="small" color="#9CA3AF" />
        )}
      </View>
      <View style={floatingHeaderStyles.right}>
        {!isOnline && <OfflineIndicator />}
        {/* Add race button */}
        <TouchableOpacity
          style={floatingHeaderStyles.iconButton}
          onPress={onAddRace}
          accessibilityLabel="Add race"
          accessibilityRole="button"
        >
          <Text style={floatingHeaderStyles.addText}>+</Text>
        </TouchableOpacity>
        {/* User avatar */}
        <TouchableOpacity
          style={floatingHeaderStyles.iconButton}
          onPress={onOpenSettings}
          accessibilityLabel="Open profile"
          accessibilityRole="button"
        >
          <View style={floatingHeaderStyles.avatar}>
            <Text style={floatingHeaderStyles.avatarText}>{userInitial}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default RacesFloatingHeader;
