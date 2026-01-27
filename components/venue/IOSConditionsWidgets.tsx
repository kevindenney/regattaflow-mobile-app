/**
 * IOSConditionsWidgets - iOS Widget-Style Cards
 *
 * 2x2 grid of iOS Widget-style condition cards:
 * - Wind widget with direction indicator
 * - Tide widget with state arrow
 * - Temperature widget with water/air
 * - Waves/Current widget
 *
 * Each widget: icon, value, label, mini visualization
 * Consistent 16px radius, subtle shadow, system colors
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface ConditionsData {
  windSpeed?: number;
  windGusts?: number;
  windDirection?: number;
  tidalHeight?: number;
  tidalState?: 'rising' | 'falling' | 'high' | 'low' | 'slack';
  airTemperature?: number;
  waterTemperature?: number;
  waveHeight?: number;
  wavePeriod?: number;
  currentSpeed?: number;
  currentDirection?: number;
  visibility?: number;
}

interface IOSConditionsWidgetsProps {
  conditions?: ConditionsData;
  isLoading?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  onWidgetPress?: (type: 'wind' | 'tide' | 'temp' | 'waves') => void;
}

// Helper functions
function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function getTideArrow(state?: string): string {
  switch (state) {
    case 'rising': return '↑';
    case 'falling': return '↓';
    case 'high': return '●';
    case 'low': return '○';
    case 'slack': return '~';
    default: return '~';
  }
}

function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// Individual Widget Component
interface WidgetCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
  subvalue?: string;
  indicator?: React.ReactNode;
  onPress?: () => void;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function WidgetCard({
  icon,
  iconColor,
  label,
  value,
  subvalue,
  indicator,
  onPress,
  isLoading = false,
}: WidgetCardProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.widget, animatedStyle]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.97, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      {/* Header: Icon + Label */}
      <View style={styles.widgetHeader}>
        <Ionicons name={icon} size={16} color={iconColor} />
        <Text style={styles.widgetLabel}>{label}</Text>
      </View>

      {/* Value */}
      {isLoading ? (
        <View style={styles.widgetLoading}>
          <ActivityIndicator size="small" color={IOS_COLORS.systemGray3} />
        </View>
      ) : (
        <>
          <Text style={styles.widgetValue} numberOfLines={1}>
            {value}
          </Text>
          {subvalue && (
            <Text style={styles.widgetSubvalue} numberOfLines={1}>
              {subvalue}
            </Text>
          )}
        </>
      )}

      {/* Optional Indicator */}
      {indicator && !isLoading && (
        <View style={styles.widgetIndicator}>
          {indicator}
        </View>
      )}
    </AnimatedPressable>
  );
}

// Wind Direction Indicator
interface WindIndicatorProps {
  direction: number;
}

function WindDirectionIndicator({ direction }: WindIndicatorProps) {
  return (
    <View style={styles.windIndicator}>
      <View
        style={[
          styles.windArrow,
          { transform: [{ rotate: `${direction}deg` }] },
        ]}
      >
        <Ionicons name="arrow-up" size={14} color={IOS_COLORS.systemBlue} />
      </View>
    </View>
  );
}

// Tide State Indicator
interface TideIndicatorProps {
  state: string;
}

function TideStateIndicator({ state }: TideIndicatorProps) {
  const colors: Record<string, string> = {
    rising: IOS_COLORS.systemGreen,
    falling: IOS_COLORS.systemOrange,
    high: IOS_COLORS.systemBlue,
    low: IOS_COLORS.systemGray,
    slack: IOS_COLORS.systemGray3,
  };

  return (
    <View style={[styles.tideIndicator, { backgroundColor: `${colors[state] || IOS_COLORS.systemGray}20` }]}>
      <Text style={[styles.tideArrow, { color: colors[state] || IOS_COLORS.systemGray }]}>
        {getTideArrow(state)}
      </Text>
    </View>
  );
}

// Main Component
export function IOSConditionsWidgets({
  conditions,
  isLoading = false,
  lastUpdated,
  onRefresh,
  onWidgetPress,
}: IOSConditionsWidgetsProps) {
  const hasConditions = conditions && (
    conditions.windSpeed !== undefined ||
    conditions.tidalHeight !== undefined ||
    conditions.airTemperature !== undefined ||
    conditions.waveHeight !== undefined
  );

  // Format values
  const windValue = conditions?.windSpeed !== undefined
    ? `${Math.round(conditions.windSpeed)} kt`
    : '--';
  const windSubvalue = conditions?.windDirection !== undefined
    ? `${getWindDirectionText(conditions.windDirection)}${conditions.windGusts && conditions.windGusts > (conditions.windSpeed || 0) + 2 ? ` G${Math.round(conditions.windGusts)}` : ''}`
    : undefined;

  const tideValue = conditions?.tidalHeight !== undefined
    ? `${conditions.tidalHeight >= 0 ? '+' : ''}${conditions.tidalHeight.toFixed(1)}m`
    : '--';
  const tideSubvalue = conditions?.tidalState
    ? conditions.tidalState.charAt(0).toUpperCase() + conditions.tidalState.slice(1)
    : undefined;

  const tempValue = conditions?.airTemperature !== undefined
    ? `${Math.round(conditions.airTemperature)}°`
    : '--';
  const tempSubvalue = conditions?.waterTemperature !== undefined
    ? `Water ${Math.round(conditions.waterTemperature)}°`
    : undefined;

  const wavesValue = conditions?.waveHeight !== undefined
    ? `${conditions.waveHeight.toFixed(1)}m`
    : conditions?.currentSpeed !== undefined
      ? `${conditions.currentSpeed.toFixed(1)} kt`
      : '--';
  const wavesSubvalue = conditions?.wavePeriod !== undefined
    ? `${conditions.wavePeriod}s period`
    : conditions?.currentDirection !== undefined
      ? `${Math.round(conditions.currentDirection)}°`
      : undefined;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>CONDITIONS</Text>
        {onRefresh && (
          <Pressable onPress={onRefresh} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
            ) : (
              <Text style={styles.refreshText}>
                {lastUpdated ? formatTimeAgo(lastUpdated) : 'Refresh'}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Widget Grid */}
      <View style={styles.grid}>
        {/* Row 1 */}
        <View style={styles.row}>
          {/* Wind Widget */}
          <WidgetCard
            icon="leaf"
            iconColor={IOS_COLORS.systemBlue}
            label="WIND"
            value={windValue}
            subvalue={windSubvalue}
            indicator={
              conditions?.windDirection !== undefined ? (
                <WindDirectionIndicator direction={conditions.windDirection} />
              ) : undefined
            }
            onPress={() => onWidgetPress?.('wind')}
            isLoading={isLoading && !hasConditions}
          />

          {/* Tide Widget */}
          <WidgetCard
            icon="water"
            iconColor={IOS_COLORS.systemTeal}
            label="TIDE"
            value={tideValue}
            subvalue={tideSubvalue}
            indicator={
              conditions?.tidalState ? (
                <TideStateIndicator state={conditions.tidalState} />
              ) : undefined
            }
            onPress={() => onWidgetPress?.('tide')}
            isLoading={isLoading && !hasConditions}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {/* Temperature Widget */}
          <WidgetCard
            icon="thermometer"
            iconColor={IOS_COLORS.systemOrange}
            label="TEMP"
            value={tempValue}
            subvalue={tempSubvalue}
            onPress={() => onWidgetPress?.('temp')}
            isLoading={isLoading && !hasConditions}
          />

          {/* Waves/Current Widget */}
          <WidgetCard
            icon={conditions?.waveHeight !== undefined ? 'pulse' : 'git-merge-outline'}
            iconColor={IOS_COLORS.systemPurple}
            label={conditions?.waveHeight !== undefined ? 'WAVES' : 'CURRENT'}
            value={wavesValue}
            subvalue={wavesSubvalue}
            onPress={() => onWidgetPress?.('waves')}
            isLoading={isLoading && !hasConditions}
          />
        </View>
      </View>

      {/* Source Attribution */}
      {conditions && (
        <Text style={styles.sourceText}>
          Data from Open-Meteo Marine
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.xs,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: IOS_COLORS.secondaryLabel,
  },
  refreshText: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  grid: {
    gap: IOS_SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: IOS_SPACING.md,
  },
  widget: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    minHeight: 90,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: IOS_SPACING.sm,
  },
  widgetLabel: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: IOS_COLORS.secondaryLabel,
  },
  widgetLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetValue: {
    fontSize: 28,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 34,
  },
  widgetSubvalue: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  widgetIndicator: {
    position: 'absolute',
    top: IOS_SPACING.md,
    right: IOS_SPACING.md,
  },
  windIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  windArrow: {
    // Transform applied inline
  },
  tideIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tideArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  sourceText: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
});

export default IOSConditionsWidgets;
