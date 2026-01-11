/**
 * SailAlertBanner
 *
 * Warning banner shown on race cards when sails need attention.
 * Compact, tappable banner that links to sail inspection.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AlertTriangle, Sailboat, ChevronRight } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';

// =============================================================================
// Types
// =============================================================================

export interface SailAlert {
  equipmentId: string;
  sailName: string;
  reason: 'needs_inspection' | 'low_condition' | 'high_usage';
  severity: 'warning' | 'critical';
  conditionScore?: number;
  daysSinceInspection?: number;
  usageHours?: number;
}

interface SailAlertBannerProps {
  alerts: SailAlert[];
  onPress?: () => void;
  compact?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function SailAlertBanner({ alerts, onPress, compact = false }: SailAlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const hasAnyCritical = criticalCount > 0;

  // Get primary message
  const getMessage = () => {
    if (alerts.length === 1) {
      const alert = alerts[0];
      switch (alert.reason) {
        case 'needs_inspection':
          return `${alert.sailName} needs inspection`;
        case 'low_condition':
          return `${alert.sailName} condition is low (${alert.conditionScore}%)`;
        case 'high_usage':
          return `${alert.sailName} has high usage (${alert.usageHours}h)`;
        default:
          return `${alert.sailName} needs attention`;
      }
    }
    return `${alerts.length} sails need attention`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        hasAnyCritical ? styles.containerCritical : styles.containerWarning,
        compact && styles.containerCompact,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        {hasAnyCritical ? (
          <AlertTriangle size={compact ? 14 : 16} color={IOS_COLORS.red} />
        ) : (
          <Sailboat size={compact ? 14 : 16} color={IOS_COLORS.orange} />
        )}
      </View>

      <Text
        style={[
          styles.message,
          hasAnyCritical ? styles.messageCritical : styles.messageWarning,
          compact && styles.messageCompact,
        ]}
        numberOfLines={1}
      >
        {getMessage()}
      </Text>

      {onPress && (
        <ChevronRight
          size={compact ? 14 : 16}
          color={hasAnyCritical ? IOS_COLORS.red : IOS_COLORS.orange}
        />
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  containerWarning: {
    backgroundColor: `${IOS_COLORS.orange}15`,
  },
  containerCritical: {
    backgroundColor: `${IOS_COLORS.red}15`,
  },
  containerCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  messageWarning: {
    color: IOS_COLORS.orange,
  },
  messageCritical: {
    color: IOS_COLORS.red,
  },
  messageCompact: {
    fontSize: 12,
  },
});

export default SailAlertBanner;
