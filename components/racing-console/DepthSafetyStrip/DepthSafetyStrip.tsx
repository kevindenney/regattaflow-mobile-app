/**
 * Depth Safety Strip
 *
 * Persistent footer showing critical depth/clearance information
 * Alerts for grounding risk with visual, haptic, and audio feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useRaceConditions,
  selectDepth,
  selectDraft,
  selectClearance
} from '@/stores/raceConditionsStore';
import {
  Colors,
  Typography,
  Spacing,
  ZIndex,
  getClearanceStatus,
  Components
} from '@/constants/RacingDesignSystem';

interface DepthSafetyStripProps {
  onExpand?: () => void;
}

export function DepthSafetyStrip({ onExpand }: DepthSafetyStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Get state from store
  const depth = useRaceConditions(selectDepth);
  const draft = useRaceConditions(selectDraft);
  const clearance = useRaceConditions(selectClearance);

  // Calculate status
  const status = depth ? getClearanceStatus(clearance, draft) : null;

  // Pulse animation for danger
  useEffect(() => {
    if (status?.status === 'danger') {
      // Start pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      );
      pulse.start();

      // Haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]); // Pattern: wait, vibrate, wait, vibrate
      }

      return () => {
        pulse.stop();
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [status?.status, pulseAnim]);

  // Format depth for display
  const formatDepth = (value: number) => {
    return value.toFixed(1);
  };

  // Format trend
  const formatTrend = (trend: number) => {
    const abs = Math.abs(trend);
    const sign = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
    return `${sign} ${abs.toFixed(1)}m/min`;
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!status) return 'help-circle';
    switch (status.status) {
      case 'safe':
        return 'check-circle';
      case 'caution':
        return 'alert';
      case 'danger':
        return 'alert-circle';
    }
  };

  // Handle tap to expand
  const handlePress = () => {
    if (onExpand) {
      onExpand();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  if (!depth) {
    return (
      <View style={styles.container}>
        <View style={styles.compactContent}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={20}
            color={Colors.text.tertiary}
          />
          <Text style={styles.noDataText}>No depth data</Text>
        </View>
      </View>
    );
  }

  const containerStyle = [
    styles.container,
    {
      backgroundColor:
        status?.status === 'danger'
          ? Colors.status.danger
          : status?.status === 'caution'
            ? Colors.status.caution
            : Colors.ui.background,
      borderTopColor:
        status?.status === 'danger'
          ? Colors.status.danger
          : status?.status === 'caution'
            ? Colors.status.caution
            : Colors.ui.border
    }
  ];

  const textColor =
    status?.status === 'danger' || status?.status === 'caution'
      ? Colors.text.inverse
      : Colors.text.primary;

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          transform: [{ scale: status?.status === 'danger' ? pulseAnim : 1 }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.compactContent}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Status Icon */}
        <MaterialCommunityIcons
          name={getStatusIcon()}
          size={24}
          color={textColor}
        />

        {/* Current Depth */}
        <View style={styles.depthSection}>
          <Text style={[styles.depthValue, { color: textColor }]}>
            {formatDepth(depth.current)}m
          </Text>
          <Text style={[styles.depthLabel, { color: textColor }]}>Depth</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: textColor + '40' }]} />

        {/* Clearance */}
        <View style={styles.clearanceSection}>
          <MaterialCommunityIcons
            name={status?.status === 'safe' ? 'check' : 'alert'}
            size={16}
            color={textColor}
          />
          <Text style={[styles.clearanceValue, { color: textColor }]}>
            {formatDepth(clearance)}m
          </Text>
          <Text style={[styles.clearanceLabel, { color: textColor }]}>
            Clearance
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: textColor + '40' }]} />

        {/* Trend */}
        <View style={styles.trendSection}>
          <Text style={[styles.trendValue, { color: textColor }]}>
            {formatTrend(depth.trend)}
          </Text>
          <Text style={[styles.trendLabel, { color: textColor }]}>Trend</Text>
        </View>

        {/* Next Hazard */}
        {depth.minimum < depth.current && (
          <>
            <View style={[styles.divider, { backgroundColor: textColor + '40' }]} />
            <View style={styles.hazardSection}>
              <MaterialCommunityIcons name="alert-outline" size={16} color={textColor} />
              <Text style={[styles.hazardValue, { color: textColor }]}>
                {formatDepth(depth.minimum)}m
              </Text>
              <Text style={[styles.hazardLabel, { color: textColor }]}>Min Ahead</Text>
            </View>
          </>
        )}

        {/* Expand Indicator */}
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={textColor}
          style={styles.expandIcon}
        />
      </TouchableOpacity>

      {/* Expanded Detail */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedGrid}>
            <View style={styles.expandedItem}>
              <Text style={styles.expandedLabel}>Current Depth</Text>
              <Text style={styles.expandedValue}>{formatDepth(depth.current)}m</Text>
            </View>

            <View style={styles.expandedItem}>
              <Text style={styles.expandedLabel}>Keel Draft</Text>
              <Text style={styles.expandedValue}>{formatDepth(draft)}m</Text>
            </View>

            <View style={styles.expandedItem}>
              <Text style={styles.expandedLabel}>Clearance</Text>
              <Text
                style={[
                  styles.expandedValue,
                  { color: status?.color }
                ]}
              >
                {status?.status.toUpperCase()}
              </Text>
              <Text style={styles.expandedSubvalue}>
                {formatDepth(clearance)}m margin
              </Text>
            </View>

            <View style={styles.expandedItem}>
              <Text style={styles.expandedLabel}>Trend</Text>
              <Text style={styles.expandedValue}>{formatTrend(depth.trend)}</Text>
              <Text style={styles.expandedSubvalue}>
                {depth.trend > 0 ? 'Deepening' : depth.trend < 0 ? 'Shoaling' : 'Stable'}
              </Text>
            </View>
          </View>

          {/* Forecast */}
          {depth.forecast && depth.forecast.length > 0 && (
            <View style={styles.forecastSection}>
              <Text style={styles.forecastTitle}>Next 10 Minutes</Text>
              {depth.forecast.slice(0, 3).map((forecast, index) => {
                const forecastClearance = forecast.depth - draft;
                const forecastStatus = getClearanceStatus(forecastClearance, draft);
                return (
                  <View key={index} style={styles.forecastItem}>
                    <Text style={styles.forecastTime}>
                      +{index * 5}min
                    </Text>
                    <Text style={styles.forecastDepth}>
                      {formatDepth(forecast.depth)}m
                    </Text>
                    <MaterialCommunityIcons
                      name={
                        forecastStatus.status === 'safe'
                          ? 'check-circle'
                          : forecastStatus.status === 'caution'
                            ? 'alert'
                            : 'alert-circle'
                      }
                      size={16}
                      color={forecastStatus.color}
                    />
                    <Text style={[styles.forecastStatus, { color: forecastStatus.color }]}>
                      {forecastStatus.status.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Warnings */}
          {status?.status === 'danger' && (
            <View style={styles.warningBox}>
              <MaterialCommunityIcons
                name="alert-octagon"
                size={24}
                color={Colors.status.danger}
              />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>GROUNDING RISK</Text>
                <Text style={styles.warningText}>
                  Clearance only {formatDepth(clearance)}m. Reduce speed and monitor depth
                  continuously.
                </Text>
              </View>
            </View>
          )}

          {status?.status === 'caution' && (
            <View style={styles.cautionBox}>
              <MaterialCommunityIcons
                name="alert"
                size={20}
                color={Colors.status.caution}
              />
              <View style={styles.cautionContent}>
                <Text style={styles.cautionTitle}>LOW CLEARANCE</Text>
                <Text style={styles.cautionText}>
                  Clearance {formatDepth(clearance)}m. Stay alert to depth changes.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8
      },
      android: {
        elevation: 8
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0,0,0,0.15)'
      }
    }),
    zIndex: ZIndex.safetyStrip
  },

  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: Components.safetyStrip.height,
    gap: Spacing.sm
  },

  depthSection: {
    alignItems: 'center'
  },

  depthValue: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.mono
  },

  depthLabel: {
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase'
  },

  divider: {
    width: 1,
    height: 28,
    opacity: 0.3
  },

  clearanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },

  clearanceValue: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.mono
  },

  clearanceLabel: {
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.medium
  },

  trendSection: {
    alignItems: 'center'
  },

  trendValue: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semiBold
  },

  trendLabel: {
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.medium
  },

  hazardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },

  hazardValue: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold
  },

  hazardLabel: {
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.medium
  },

  expandIcon: {
    marginLeft: 'auto'
  },

  noDataText: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm
  },

  expandedContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.ui.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border
  },

  expandedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md
  },

  expandedItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.ui.background,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ui.border
  },

  expandedLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.semiBold,
    textTransform: 'uppercase'
  },

  expandedValue: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  expandedSubvalue: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs
  },

  forecastSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.ui.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ui.border
  },

  forecastTitle: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm
  },

  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm
  },

  forecastTime: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    width: 50
  },

  forecastDepth: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono,
    width: 60
  },

  forecastStatus: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.danger + '20',
    borderWidth: 2,
    borderColor: Colors.status.danger,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.md
  },

  warningContent: {
    flex: 1
  },

  warningTitle: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.danger,
    marginBottom: Spacing.xs
  },

  warningText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.bodySmall
  },

  cautionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.caution + '20',
    borderWidth: 1,
    borderColor: Colors.status.caution,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.md
  },

  cautionContent: {
    flex: 1
  },

  cautionTitle: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.caution,
    marginBottom: Spacing.xs
  },

  cautionText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.bodySmall
  }
});
