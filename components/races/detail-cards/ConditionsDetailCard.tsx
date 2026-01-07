/**
 * Conditions Detail Card
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors from shared constants
 * - Expandable card showing wind, tide, and wave conditions
 * - Collapsed: Header + key metrics (wind, tide, temp)
 * - Expanded: Full conditions details + sail selection
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';
import { colors } from '@/constants/Colors';
import { useSailInventory } from '@/hooks/useSailInventory';
import { SailSelector } from '@/components/races/intentions';
import { TinySparkline, AnnotatedSparkline } from '@/components/shared/charts';
import type { SailSelectionIntention, SailInventoryItem } from '@/types/raceIntentions';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ConditionsDetailCardProps {
  raceId: string;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  tide?: {
    state: string;
    height?: number;
    direction?: string;
  } | null;
  waves?: {
    height: number;
    period?: number;
  } | null;
  temperature?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  // Distance race support
  isDistanceRace?: boolean;
  customTitle?: string;
  // Sail selection props
  boatId?: string;
  sailSelection?: SailSelectionIntention;
  onSailSelectionChange?: (selection: SailSelectionIntention) => void;
  // Tufte sparkline forecast data
  windForecast?: number[];
  tideForecast?: number[];
  forecastNowIndex?: number;
  // Trend annotations for expanded sparklines
  windTrend?: 'building' | 'steady' | 'easing';
  tidePeakTime?: string;
}

export function ConditionsDetailCard({
  raceId,
  wind,
  tide,
  waves,
  temperature,
  isExpanded = false,
  onToggle,
  onPress,
  isDistanceRace = false,
  customTitle,
  boatId,
  sailSelection,
  onSailSelectionChange,
  windForecast,
  tideForecast,
  forecastNowIndex = 0,
  windTrend,
  tidePeakTime,
}: ConditionsDetailCardProps) {
  const hasData = wind || tide || waves;
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Fetch sail inventory if boatId is provided
  const { sails, isLoading: sailsLoading } = useSailInventory({
    boatId: boatId || '',
    activeOnly: true,
    enabled: !!boatId,
  });

  // Handle sail selection changes
  const handleSailSelect = useCallback(
    (category: keyof SailSelectionIntention, sail: SailInventoryItem | null) => {
      if (!onSailSelectionChange) return;

      const newSelection: SailSelectionIntention = {
        ...sailSelection,
        [category]: sail?.id || undefined,
      };
      onSailSelectionChange(newSelection);
    },
    [sailSelection, onSailSelectionChange]
  );

  // Update rotation when isExpanded changes
  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  // Animated chevron rotation
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
  }));

  const handlePress = useCallback(() => {
    // Configure layout animation
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  }, [isExpanded, onToggle, onPress]);

  // Key metrics for collapsed view
  const keyMetrics = [];
  if (wind) {
    keyMetrics.push({
      icon: 'weather-windy' as const,
      value: `${wind.direction} ${wind.speedMin}-${wind.speedMax}kts`,
    });
  }
  if (tide) {
    keyMetrics.push({
      icon: 'waves' as const,
      value: tide.state.charAt(0).toUpperCase() + tide.state.slice(1),
    });
  }
  if (temperature !== undefined) {
    keyMetrics.push({
      icon: 'thermometer' as const,
      value: `${temperature}°C`,
    });
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header - Always visible */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, isDistanceRace && styles.headerIconDistance]}>
          <MaterialCommunityIcons
            name={isDistanceRace ? "weather-cloudy-clock" : "weather-partly-cloudy"}
            size={18}
            color={isDistanceRace ? IOS_COLORS.purple : IOS_COLORS.blue}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {customTitle || (isDistanceRace ? 'Weather Outlook' : 'Conditions')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isDistanceRace ? 'Multi-hour weather forecast' : 'Weather & water conditions'}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={IOS_COLORS.gray}
          />
        </Animated.View>
      </View>

      {/* Content */}
      {hasData ? (
        <>
          {/* Collapsed: Key metrics row */}
          {!isExpanded && (
            <View style={styles.collapsedContent}>
              {keyMetrics.slice(0, 3).map((metric, index) => (
                <View key={index} style={styles.collapsedMetric}>
                  <MaterialCommunityIcons name={metric.icon} size={14} color={IOS_COLORS.secondaryLabel} />
                  <Text style={styles.collapsedValue}>{metric.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Expanded: Tufte-style aligned grid with sparklines */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Wind - Tufte grid row with annotated sparkline */}
              {wind && (
                <View style={styles.tufteRow}>
                  <Text style={styles.tufteLabel}>Wind</Text>
                  <Text style={styles.tufteValue}>
                    {wind.direction} {wind.speedMin}–{wind.speedMax}kt
                  </Text>
                  {windForecast && windForecast.length >= 2 && (
                    <View style={styles.tufteExpandedSparkline}>
                      <AnnotatedSparkline
                        data={windForecast}
                        width={90}
                        height={22}
                        color={IOS_COLORS.secondaryLabel}
                        nowIndex={forecastNowIndex}
                        trendText={windTrend}
                        variant="line"
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Tide - Tufte grid row with annotated sparkline */}
              {tide && (
                <View style={styles.tufteRow}>
                  <Text style={styles.tufteLabel}>Tide</Text>
                  <Text style={styles.tufteValue}>
                    {tide.state.charAt(0).toUpperCase() + tide.state.slice(1)}
                    {tide.height !== undefined && ` ${tide.height.toFixed(1)}m`}
                  </Text>
                  {tideForecast && tideForecast.length >= 2 && (
                    <View style={styles.tufteExpandedSparkline}>
                      <AnnotatedSparkline
                        data={tideForecast}
                        width={90}
                        height={22}
                        color={IOS_COLORS.secondaryLabel}
                        nowIndex={forecastNowIndex}
                        peakTime={tidePeakTime}
                        variant="area"
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Waves - Tufte grid row */}
              {waves && (
                <View style={styles.tufteRow}>
                  <Text style={styles.tufteLabel}>Waves</Text>
                  <Text style={styles.tufteValue}>
                    {waves.height.toFixed(1)}m
                    {waves.period && ` · ${waves.period}s`}
                  </Text>
                </View>
              )}

              {/* Temperature - Tufte grid row */}
              {temperature !== undefined && (
                <View style={styles.tufteRow}>
                  <Text style={styles.tufteLabel}>Temp</Text>
                  <Text style={styles.tufteValue}>{temperature}°C</Text>
                </View>
              )}

              {/* Sail Selection Section */}
              {boatId && onSailSelectionChange && (
                <View style={styles.sailSelectionSection}>
                  <View style={styles.sailSelectionHeader}>
                    <MaterialCommunityIcons name="sail-boat" size={18} color={colors.primary.default} />
                    <Text style={styles.sailSelectionTitle}>Sail Selection</Text>
                  </View>
                  {wind && (
                    <Text style={styles.sailSelectionHint}>
                      Based on {wind.speedMin}-{wind.speedMax} kts forecast
                    </Text>
                  )}

                  <View style={styles.sailSelectors}>
                    {/* Mainsail */}
                    <SailSelector
                      label="Mainsail"
                      category="mainsail"
                      sails={sails.mainsail}
                      selectedId={sailSelection?.mainsail}
                      onSelect={(sail) => handleSailSelect('mainsail', sail)}
                      disabled={sailsLoading}
                    />

                    {/* Jib / Genoa */}
                    {(sails.jib.length > 0 || sails.genoa.length > 0) && (
                      <SailSelector
                        label="Headsail"
                        category={sails.jib.length > 0 ? 'jib' : 'genoa'}
                        sails={[...sails.jib, ...sails.genoa]}
                        selectedId={sailSelection?.jib || sailSelection?.genoa}
                        onSelect={(sail) => {
                          if (sail?.category === 'genoa') {
                            handleSailSelect('genoa', sail);
                            handleSailSelect('jib', null);
                          } else {
                            handleSailSelect('jib', sail);
                            handleSailSelect('genoa', null);
                          }
                        }}
                        disabled={sailsLoading}
                      />
                    )}

                    {/* Spinnaker */}
                    {sails.spinnaker.length > 0 && (
                      <SailSelector
                        label="Spinnaker"
                        category="spinnaker"
                        sails={sails.spinnaker}
                        selectedId={sailSelection?.spinnaker}
                        onSelect={(sail) => handleSailSelect('spinnaker', sail)}
                        disabled={sailsLoading}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        /* Empty state */
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={32} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Conditions Data</Text>
          <Text style={styles.emptySubtext}>
            Weather and tide data will appear here when available
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconDistance: {
    backgroundColor: `${IOS_COLORS.purple}15`,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },

  // Collapsed content
  collapsedContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
  },
  collapsedMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collapsedValue: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDetails: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Tufte-style grid layout (flat, no icon containers)
  tufteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tufteLabel: {
    width: 44,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  tufteSparkline: {
    marginLeft: 'auto',
  },
  tufteExpandedSparkline: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },

  // Empty state
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // Sail selection section
  sailSelectionSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  sailSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sailSelectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sailSelectionHint: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  sailSelectors: {
    gap: 12,
  },
});
