/**
 * RaceCardActionBar Component
 *
 * Bottom action bar for the full-screen race card.
 * Provides:
 * - "View Full Journey" - Navigate to detailed journey screen
 * - "Use Template" - Copy sailor's setup to own race
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Eye, Copy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface RaceCardActionBarProps {
  onViewJourney: () => void;
  onUseTemplate: () => void;
  hasTemplateContent?: boolean;
}

export function RaceCardActionBar({
  onViewJourney,
  onUseTemplate,
  hasTemplateContent = true,
}: RaceCardActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      {/* View Journey Button - Primary */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onViewJourney}
        activeOpacity={0.7}
      >
        <Eye size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>View Full Journey</Text>
      </TouchableOpacity>

      {/* Use Template Button - Secondary */}
      {hasTemplateContent && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onUseTemplate}
          activeOpacity={0.7}
        >
          <Copy size={18} color={IOS_COLORS.systemBlue} />
          <Text style={styles.secondaryButtonText}>Use Template</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
      } as any,
    }),
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});

export default RaceCardActionBar;
