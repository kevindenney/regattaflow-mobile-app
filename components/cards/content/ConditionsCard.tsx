/**
 * ConditionsCard - Position 1
 *
 * Full-card display of weather and water conditions:
 * - Wind (direction, speed range)
 * - Tide (state, height, direction)
 * - Waves (height, period)
 * - Temperature
 * - Sail selection recommendations and user selection
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors
 * - SF Pro typography
 * - Clean visual hierarchy without header icons
 */

import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import {
  Wind,
  Waves,
  Thermometer,
  Compass,
  ArrowUp,
  ArrowDown,
  Minus,
  Droplets,
  Navigation,
  Sailboat,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react-native';

import { CardContentProps } from '../types';
import { useSailInventory, formatSailDisplayName, getSailConditionColor } from '@/hooks/useSailInventory';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import type { SailInventoryItem, SailSelectionIntention } from '@/types/raceIntentions';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  cyan: '#32ADE6',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get tide state icon and color (iOS system colors)
 */
function getTideDisplay(state?: string): {
  icon: typeof ArrowUp;
  color: string;
  label: string;
  bgColor: string;
} {
  const normalizedState = state?.toLowerCase() || '';

  switch (normalizedState) {
    case 'flooding':
    case 'rising':
      return { icon: ArrowUp, color: IOS_COLORS.blue, label: 'Rising', bgColor: '#E5F1FF' };
    case 'ebbing':
    case 'falling':
      return { icon: ArrowDown, color: IOS_COLORS.red, label: 'Falling', bgColor: '#FFEBE9' };
    case 'high':
      return { icon: Minus, color: IOS_COLORS.green, label: 'High', bgColor: '#E8FAE9' };
    case 'low':
      return { icon: Minus, color: IOS_COLORS.orange, label: 'Low', bgColor: '#FFF4E5' };
    case 'slack':
      return { icon: Minus, color: IOS_COLORS.gray, label: 'Slack', bgColor: IOS_COLORS.gray6 };
    default:
      return { icon: Waves, color: IOS_COLORS.cyan, label: state || 'Unknown', bgColor: '#E5F8FF' };
  }
}

/**
 * Get wind strength description and color (iOS system colors)
 */
function getWindStrength(speedMin: number, speedMax: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  const avg = (speedMin + speedMax) / 2;
  if (avg < 5) return { label: 'Light', color: IOS_COLORS.green, bgColor: '#E8FAE9' };
  if (avg < 10) return { label: 'Light-Medium', color: IOS_COLORS.green, bgColor: '#E8FAE9' };
  if (avg < 15) return { label: 'Medium', color: IOS_COLORS.blue, bgColor: '#E5F1FF' };
  if (avg < 20) return { label: 'Medium-Heavy', color: IOS_COLORS.orange, bgColor: '#FFF4E5' };
  if (avg < 25) return { label: 'Heavy', color: IOS_COLORS.orange, bgColor: '#FFF4E5' };
  return { label: 'Very Heavy', color: IOS_COLORS.red, bgColor: '#FFEBE9' };
}

// =============================================================================
// SAIL RECOMMENDATION LOGIC
// =============================================================================

interface SailRecommendation {
  category: 'mainsail' | 'headsail' | 'spinnaker';
  recommendation: string;
  reasoning: string;
  icon: string;
}

/**
 * Generate sail recommendations based on wind conditions
 */
function getSailRecommendations(
  speedMin: number,
  speedMax: number
): SailRecommendation[] {
  const avg = (speedMin + speedMax) / 2;
  const recommendations: SailRecommendation[] = [];

  // Mainsail recommendation
  if (avg < 8) {
    recommendations.push({
      category: 'mainsail',
      recommendation: 'Full main, max draft',
      reasoning: 'Light air - maximize power',
      icon: '⛵',
    });
  } else if (avg < 15) {
    recommendations.push({
      category: 'mainsail',
      recommendation: 'Standard trim',
      reasoning: 'Medium breeze - balanced setup',
      icon: '⛵',
    });
  } else if (avg < 22) {
    recommendations.push({
      category: 'mainsail',
      recommendation: 'Depower, flat entry',
      reasoning: 'Heavy air - reduce heeling',
      icon: '⛵',
    });
  } else {
    recommendations.push({
      category: 'mainsail',
      recommendation: 'Reef 1 or flatten fully',
      reasoning: 'Very heavy - safety priority',
      icon: '⛵',
    });
  }

  // Headsail recommendation
  if (avg < 6) {
    recommendations.push({
      category: 'headsail',
      recommendation: 'Large genoa / light jib',
      reasoning: 'Max sail area for light air',
      icon: '🔺',
    });
  } else if (avg < 12) {
    recommendations.push({
      category: 'headsail',
      recommendation: 'Medium jib / #1 genoa',
      reasoning: 'Good power without excess heel',
      icon: '🔺',
    });
  } else if (avg < 18) {
    recommendations.push({
      category: 'headsail',
      recommendation: 'Working jib / #3',
      reasoning: 'Manageable sail area',
      icon: '🔺',
    });
  } else {
    recommendations.push({
      category: 'headsail',
      recommendation: 'Storm jib / small jib',
      reasoning: 'Control in heavy conditions',
      icon: '🔺',
    });
  }

  // Spinnaker recommendation
  if (avg < 5) {
    recommendations.push({
      category: 'spinnaker',
      recommendation: 'Light A-sail / Code 0',
      reasoning: 'Light air reaching/running',
      icon: '🪁',
    });
  } else if (avg < 12) {
    recommendations.push({
      category: 'spinnaker',
      recommendation: 'All-purpose spinnaker',
      reasoning: 'Good range for moderate breeze',
      icon: '🪁',
    });
  } else if (avg < 18) {
    recommendations.push({
      category: 'spinnaker',
      recommendation: 'Heavy air kite',
      reasoning: 'Flatter cut for control',
      icon: '🪁',
    });
  } else {
    recommendations.push({
      category: 'spinnaker',
      recommendation: 'Consider no kite',
      reasoning: 'May be too windy for safe flying',
      icon: '⚠️',
    });
  }

  return recommendations;
}

// =============================================================================
// SAIL SELECTOR COMPONENT
// =============================================================================

interface SailSelectorProps {
  label: string;
  sails: SailInventoryItem[];
  selectedId: string | undefined;
  onSelect: (sail: SailInventoryItem | null) => void;
  recommendation?: string;
}

function SailSelector({ label, sails, selectedId, onSelect, recommendation }: SailSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSail = sails.find((s) => s.id === selectedId);

  if (sails.length === 0) {
    return (
      <View style={styles.sailSelectorEmpty}>
        <Text style={styles.sailSelectorLabel}>{label}</Text>
        <Text style={styles.sailSelectorEmptyText}>No {label.toLowerCase()}s in inventory</Text>
      </View>
    );
  }

  return (
    <View style={styles.sailSelectorContainer}>
      <Text style={styles.sailSelectorLabel}>{label}</Text>

      <TouchableOpacity
        style={[styles.sailSelectorButton, selectedSail && styles.sailSelectorButtonSelected]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        {selectedSail ? (
          <View style={styles.sailSelectorSelected}>
            <View style={styles.sailSelectorSelectedInfo}>
              <Text style={styles.sailSelectorSelectedName}>
                {formatSailDisplayName(selectedSail)}
              </Text>
              {selectedSail.conditionRating && (
                <View
                  style={[
                    styles.conditionBadge,
                    { backgroundColor: getSailConditionColor(selectedSail.conditionRating) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.conditionBadgeText,
                      { color: getSailConditionColor(selectedSail.conditionRating) },
                    ]}
                  >
                    {selectedSail.conditionRating}%
                  </Text>
                </View>
              )}
            </View>
            <Check size={18} color={IOS_COLORS.green} />
          </View>
        ) : (
          <View style={styles.sailSelectorPlaceholder}>
            <Text style={styles.sailSelectorPlaceholderText}>Select {label.toLowerCase()}</Text>
            {recommendation && (
              <Text style={styles.sailSelectorRecommendation} numberOfLines={1}>
                Suggested: {recommendation}
              </Text>
            )}
          </View>
        )}
        {isOpen ? (
          <ChevronUp size={16} color={IOS_COLORS.gray} />
        ) : (
          <ChevronDown size={16} color={IOS_COLORS.gray} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.sailSelectorDropdown}>
          {selectedSail && (
            <TouchableOpacity
              style={styles.sailSelectorOption}
              onPress={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              <Text style={styles.sailSelectorClearText}>Clear selection</Text>
            </TouchableOpacity>
          )}
          {sails.map((sail) => (
            <TouchableOpacity
              key={sail.id}
              style={[
                styles.sailSelectorOption,
                sail.id === selectedId && styles.sailSelectorOptionSelected,
              ]}
              onPress={() => {
                onSelect(sail);
                setIsOpen(false);
              }}
            >
              <View style={styles.sailOptionInfo}>
                <Text
                  style={[
                    styles.sailOptionName,
                    sail.id === selectedId && styles.sailOptionNameSelected,
                  ]}
                >
                  {formatSailDisplayName(sail)}
                </Text>
                {sail.manufacturer && sail.model && !sail.customName && (
                  <Text style={styles.sailOptionSubtext}>
                    {sail.manufacturer} {sail.model}
                  </Text>
                )}
              </View>
              {sail.conditionRating && (
                <View
                  style={[
                    styles.conditionBadgeSmall,
                    { backgroundColor: getSailConditionColor(sail.conditionRating) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.conditionBadgeSmallText,
                      { color: getSailConditionColor(sail.conditionRating) },
                    ]}
                  >
                    {sail.conditionRating}%
                  </Text>
                </View>
              )}
              {sail.id === selectedId && <Check size={16} color={IOS_COLORS.blue} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConditionsCard({
  race,
  cardType,
  isActive,
  isExpanded,
  onToggleExpand,
  dimensions,
}: CardContentProps) {
  const { wind, tide } = race;
  const waves = (race as any).waves;
  const temperature = (race as any).temperature;

  // Get boat ID from race for sail inventory
  const boatId = (race as any).boat_id || (race as any).boatId || null;

  // Fetch sail inventory for the boat
  const { sails, hasSails, isLoading: sailsLoading } = useSailInventory({
    boatId,
    activeOnly: true,
    enabled: !!boatId && isExpanded,
  });

  // Combined headsails (jibs + genoas)
  const headsails = useMemo(() => [...sails.jibs, ...sails.genoas], [sails.jibs, sails.genoas]);

  // Combined spinnakers (spinnakers + code zeros)
  const allSpinnakers = useMemo(
    () => [...sails.spinnakers, ...sails.codeZeros],
    [sails.spinnakers, sails.codeZeros]
  );

  // Hook for race preparation data (includes sail selection persistence)
  const { intentions, updateSailSelection, isLoading: prepLoading } = useRacePreparation({
    raceEventId: race.id,
    autoSave: true,
    debounceMs: 500,
  });

  // Current sail selection from intentions
  const sailSelection = intentions.sailSelection;

  // Sail selection handlers
  const handleMainsailSelect = useCallback(
    (sail: SailInventoryItem | null) => {
      updateSailSelection({
        ...sailSelection,
        mainsail: sail?.id,
        mainsailName: sail ? formatSailDisplayName(sail) : undefined,
        windRangeContext: wind ? `${wind.speedMin}-${wind.speedMax} kts` : undefined,
      });
    },
    [sailSelection, updateSailSelection, wind]
  );

  const handleHeadsailSelect = useCallback(
    (sail: SailInventoryItem | null) => {
      updateSailSelection({
        ...sailSelection,
        jib: sail?.id,
        jibName: sail ? formatSailDisplayName(sail) : undefined,
        windRangeContext: wind ? `${wind.speedMin}-${wind.speedMax} kts` : undefined,
      });
    },
    [sailSelection, updateSailSelection, wind]
  );

  const handleSpinnakerSelect = useCallback(
    (sail: SailInventoryItem | null) => {
      updateSailSelection({
        ...sailSelection,
        spinnaker: sail?.id,
        spinnakerName: sail ? formatSailDisplayName(sail) : undefined,
        windRangeContext: wind ? `${wind.speedMin}-${wind.speedMax} kts` : undefined,
      });
    },
    [sailSelection, updateSailSelection, wind]
  );

  const hasData = wind || tide || waves || temperature !== undefined;
  const tideDisplay = tide ? getTideDisplay(tide.state) : null;
  const TideIcon = tideDisplay?.icon || Waves;
  const windStrength = wind ? getWindStrength(wind.speedMin, wind.speedMax) : null;

  // Generate sail recommendations based on wind
  const sailRecommendations = useMemo(() => {
    if (!wind) return [];
    return getSailRecommendations(wind.speedMin, wind.speedMax);
  }, [wind]);

  // Get specific recommendations by category
  const mainsailRec = sailRecommendations.find((r) => r.category === 'mainsail');
  const headsailRec = sailRecommendations.find((r) => r.category === 'headsail');
  const spinnakerRec = sailRecommendations.find((r) => r.category === 'spinnaker');

  // Check if user has made any sail selections
  const hasSailSelections = sailSelection?.mainsail || sailSelection?.jib || sailSelection?.spinnaker;

  // ==========================================================================
  // COLLAPSED VIEW (Apple HIG Design)
  // ==========================================================================
  if (!isExpanded) {
    return (
      <View style={styles.container}>
        {/* Section Label */}
        <Text style={styles.sectionLabel}>CONDITIONS</Text>

        {hasData ? (
          <View style={styles.collapsedContent}>
            {/* Primary Wind Display */}
            {wind && (
              <View style={styles.primaryMetricCard}>
                <View style={styles.primaryMetricHeader}>
                  <Wind size={18} color={IOS_COLORS.blue} />
                  <Text style={styles.primaryMetricLabel}>Wind</Text>
                  {windStrength && (
                    <View style={[styles.strengthBadge, { backgroundColor: windStrength.bgColor }]}>
                      <Text style={[styles.strengthBadgeText, { color: windStrength.color }]}>
                        {windStrength.label}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.primaryMetricValue}>
                  <Text style={styles.bigNumber}>{wind.speedMin}-{wind.speedMax}</Text>
                  <Text style={styles.bigUnit}>kts</Text>
                  <View style={styles.directionBadge}>
                    <Navigation size={14} color={IOS_COLORS.blue} />
                    <Text style={styles.directionText}>{wind.direction}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Secondary Metrics Row */}
            <View style={styles.secondaryMetricsRow}>
              {/* Tide */}
              {tide && (
                <View style={[styles.secondaryMetricCard, { backgroundColor: tideDisplay?.bgColor }]}>
                  <TideIcon size={16} color={tideDisplay?.color} />
                  <View>
                    <Text style={styles.secondaryMetricLabel}>Tide</Text>
                    <Text style={[styles.secondaryMetricValue, { color: tideDisplay?.color }]}>
                      {tideDisplay?.label}
                      {tide.height !== undefined ? ` ${tide.height.toFixed(1)}m` : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Temperature */}
              {temperature !== undefined && (
                <View style={[styles.secondaryMetricCard, { backgroundColor: '#FFEBE9' }]}>
                  <Thermometer size={16} color={IOS_COLORS.red} />
                  <View>
                    <Text style={styles.secondaryMetricLabel}>Water</Text>
                    <Text style={[styles.secondaryMetricValue, { color: IOS_COLORS.red }]}>
                      {temperature}°C
                    </Text>
                  </View>
                </View>
              )}

              {/* Waves */}
              {waves && (
                <View style={[styles.secondaryMetricCard, { backgroundColor: '#F3E8FF' }]}>
                  <Droplets size={16} color={IOS_COLORS.purple} />
                  <View>
                    <Text style={styles.secondaryMetricLabel}>Waves</Text>
                    <Text style={[styles.secondaryMetricValue, { color: IOS_COLORS.purple }]}>
                      {waves.height.toFixed(1)}m
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Sail Selection Status Badge */}
            {(hasSailSelections || (wind && boatId)) && (
              <View
                style={[
                  styles.sailStatusBadge,
                  hasSailSelections
                    ? { backgroundColor: '#E8FAE9' }
                    : { backgroundColor: IOS_COLORS.gray6 },
                ]}
              >
                <Sailboat
                  size={14}
                  color={hasSailSelections ? IOS_COLORS.green : IOS_COLORS.gray}
                />
                <Text
                  style={[
                    styles.sailStatusText,
                    { color: hasSailSelections ? IOS_COLORS.green : IOS_COLORS.gray },
                  ]}
                >
                  {hasSailSelections
                    ? `Sails selected${sailSelection?.mainsailName ? ': ' + sailSelection.mainsailName : ''}`
                    : 'Tap to select sails'}
                </Text>
                {hasSailSelections && <Check size={14} color={IOS_COLORS.green} />}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Wind size={40} color={IOS_COLORS.gray3} />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>Conditions will update closer to race time</Text>
          </View>
        )}

        {/* Swipe indicator */}
        <View style={styles.swipeHintBottom}>
          <View style={styles.swipeIndicator} />
        </View>
      </View>
    );
  }

  // ==========================================================================
  // EXPANDED VIEW (Apple HIG Design)
  // ==========================================================================
  return (
    <View style={styles.container}>
      {/* Section Label */}
      <Text style={styles.sectionLabel}>CONDITIONS</Text>

      {hasData ? (
        <ScrollView
          style={styles.expandedScrollView}
          contentContainerStyle={styles.expandedContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* Wind Section */}
          {wind && (
            <View style={styles.expandedSection}>
              <View style={styles.expandedSectionHeader}>
                <Wind size={20} color={IOS_COLORS.blue} />
                <Text style={styles.expandedSectionTitle}>Wind</Text>
                {windStrength && (
                  <View style={[styles.strengthBadge, { backgroundColor: windStrength.bgColor }]}>
                    <Text style={[styles.strengthBadgeText, { color: windStrength.color }]}>
                      {windStrength.label}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.expandedSectionContent}>
                <View style={styles.expandedMetricRow}>
                  <View style={styles.expandedPrimaryMetric}>
                    <Text style={[styles.expandedBigNumber, { color: IOS_COLORS.blue }]}>
                      {wind.speedMin}-{wind.speedMax}
                    </Text>
                    <Text style={styles.expandedBigUnit}>kts</Text>
                  </View>
                  <View style={styles.expandedDirectionBadge}>
                    <Navigation size={16} color={IOS_COLORS.blue} />
                    <Text style={styles.expandedDirectionText}>{wind.direction}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Tide Section */}
          {tide && (
            <View style={[styles.expandedSection, { backgroundColor: tideDisplay?.bgColor }]}>
              <View style={styles.expandedSectionHeader}>
                <TideIcon size={20} color={tideDisplay?.color} />
                <Text style={styles.expandedSectionTitle}>Tide</Text>
                <View style={[styles.tideBadge, { backgroundColor: `${tideDisplay?.color}20` }]}>
                  <Text style={[styles.tideBadgeText, { color: tideDisplay?.color }]}>
                    {tideDisplay?.label}
                  </Text>
                </View>
              </View>
              <View style={styles.expandedSectionContent}>
                {tide.height !== undefined && (
                  <View style={styles.expandedMetricRow}>
                    <View style={styles.expandedPrimaryMetric}>
                      <Text style={[styles.expandedBigNumber, { color: tideDisplay?.color }]}>
                        {tide.height.toFixed(1)}
                      </Text>
                      <Text style={styles.expandedBigUnit}>m</Text>
                    </View>
                    {tide.direction && (
                      <View style={styles.expandedDirectionBadge}>
                        <Compass size={16} color={tideDisplay?.color} />
                        <Text style={styles.expandedDirectionText}>{tide.direction}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Bottom Row: Waves + Temperature */}
          {(waves || temperature !== undefined) && (
            <View style={styles.bottomMetricsRow}>
              {/* Waves */}
              {waves && (
                <View style={[styles.bottomMetricCard, { backgroundColor: '#F3E8FF' }]}>
                  <View style={styles.bottomMetricHeader}>
                    <Droplets size={18} color={IOS_COLORS.purple} />
                    <Text style={styles.bottomMetricTitle}>Waves</Text>
                  </View>
                  <View style={styles.bottomMetricValue}>
                    <Text style={[styles.bottomBigNumber, { color: IOS_COLORS.purple }]}>
                      {waves.height.toFixed(1)}
                    </Text>
                    <Text style={styles.bottomUnit}>m</Text>
                  </View>
                  {waves.period && (
                    <Text style={styles.bottomSubtext}>{waves.period}s period</Text>
                  )}
                </View>
              )}

              {/* Temperature */}
              {temperature !== undefined && (
                <View style={[styles.bottomMetricCard, { backgroundColor: '#FFEBE9' }]}>
                  <View style={styles.bottomMetricHeader}>
                    <Thermometer size={18} color={IOS_COLORS.red} />
                    <Text style={styles.bottomMetricTitle}>Water</Text>
                  </View>
                  <View style={styles.bottomMetricValue}>
                    <Text style={[styles.bottomBigNumber, { color: IOS_COLORS.red }]}>
                      {temperature}
                    </Text>
                    <Text style={styles.bottomUnit}>°C</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Sail Selection Section */}
          {wind && (
            <View style={styles.sailSelectionSection}>
              {/* Section Header */}
              <View style={styles.sailSelectionHeader}>
                <View style={styles.sailSelectionHeaderLeft}>
                  <Sailboat size={20} color={IOS_COLORS.cyan} />
                  <Text style={styles.sailSelectionTitle}>Sail Selection</Text>
                </View>
                {hasSailSelections && (
                  <View style={styles.sailSetBadge}>
                    <Check size={12} color={IOS_COLORS.green} />
                    <Text style={styles.sailSetBadgeText}>Set</Text>
                  </View>
                )}
              </View>

              {/* AI Recommendations */}
              {sailRecommendations.length > 0 && (
                <View style={styles.recommendationsCard}>
                  <View style={styles.recommendationsHeader}>
                    <Sparkles size={14} color={IOS_COLORS.purple} />
                    <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
                    <Text style={styles.recommendationsContext}>
                      {wind.speedMin}-{wind.speedMax} kts
                    </Text>
                  </View>
                  <View style={styles.recommendationsList}>
                    {sailRecommendations.map((rec, idx) => (
                      <View key={idx} style={styles.recommendationItem}>
                        <Text style={styles.recommendationIcon}>{rec.icon}</Text>
                        <View style={styles.recommendationContent}>
                          <Text style={styles.recommendationText}>{rec.recommendation}</Text>
                          <Text style={styles.recommendationReasoning}>{rec.reasoning}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Sail Selectors (only if boat has sails) */}
              {boatId && (
                <View style={styles.sailSelectorsContainer}>
                  {sailsLoading ? (
                    <View style={styles.sailsLoadingContainer}>
                      <Text style={styles.sailsLoadingText}>Loading sail inventory...</Text>
                    </View>
                  ) : hasSails ? (
                    <>
                      <Text style={styles.sailSelectorsLabel}>Your Selection</Text>
                      <SailSelector
                        label="Mainsail"
                        sails={sails.mainsails}
                        selectedId={sailSelection?.mainsail}
                        onSelect={handleMainsailSelect}
                        recommendation={mainsailRec?.recommendation}
                      />
                      <SailSelector
                        label="Headsail"
                        sails={headsails}
                        selectedId={sailSelection?.jib}
                        onSelect={handleHeadsailSelect}
                        recommendation={headsailRec?.recommendation}
                      />
                      {allSpinnakers.length > 0 && (
                        <SailSelector
                          label="Spinnaker"
                          sails={allSpinnakers}
                          selectedId={sailSelection?.spinnaker}
                          onSelect={handleSpinnakerSelect}
                          recommendation={spinnakerRec?.recommendation}
                        />
                      )}
                    </>
                  ) : (
                    <View style={styles.noSailsContainer}>
                      <Text style={styles.noSailsText}>
                        No sails in your boat inventory yet.
                      </Text>
                      <Text style={styles.noSailsSubtext}>
                        Add sails to your equipment to enable selection.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Wind size={48} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Conditions Data</Text>
          <Text style={styles.emptySubtitle}>
            Weather and tide data will appear here when available
          </Text>
        </View>
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeHintBottom}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Section Label (small uppercase header)
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.8,
    marginBottom: 16,
  },

  // Collapsed Content
  collapsedContent: {
    flex: 1,
    gap: 12,
  },

  // Primary Metric Card (Wind)
  primaryMetricCard: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    padding: 16,
  },
  primaryMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryMetricLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  primaryMetricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  bigUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginRight: 12,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  directionText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Strength Badge
  strengthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  strengthBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Secondary Metrics Row
  secondaryMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryMetricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 14,
  },
  secondaryMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  secondaryMetricValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Expanded Content
  expandedScrollView: {
    flex: 1,
  },
  expandedContent: {
    gap: 12,
    paddingBottom: 60,
  },
  expandedSection: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    padding: 16,
  },
  expandedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  expandedSectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  expandedSectionContent: {
    gap: 8,
  },
  expandedMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedPrimaryMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  expandedBigNumber: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  expandedBigUnit: {
    fontSize: 20,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  expandedDirectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expandedDirectionText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },

  // Tide Badge
  tideBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tideBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Bottom Metrics Row (Waves + Temperature)
  bottomMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomMetricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
  },
  bottomMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bottomMetricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  bottomMetricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bottomBigNumber: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  bottomUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  bottomSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: IOS_COLORS.gray2,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },

  // Sail Selection Status Badge (collapsed view)
  sailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sailStatusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  // Sail Selection Section (expanded view)
  sailSelectionSection: {
    backgroundColor: '#E5F8FF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  sailSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sailSelectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sailSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  sailSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8FAE9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sailSetBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },

  // AI Recommendations Card
  recommendationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendationsTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.purple,
  },
  recommendationsContext: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  recommendationIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  recommendationReasoning: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },

  // Sail Selectors Container
  sailSelectorsContainer: {
    gap: 10,
  },
  sailSelectorsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sailsLoadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  sailsLoadingText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },
  noSailsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noSailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  noSailsSubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
    textAlign: 'center',
    marginTop: 4,
  },

  // Sail Selector Component
  sailSelectorContainer: {
    gap: 6,
  },
  sailSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  sailSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
  },
  sailSelectorButtonSelected: {
    borderColor: IOS_COLORS.green,
    backgroundColor: '#FAFFFE',
  },
  sailSelectorSelected: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sailSelectorSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sailSelectorSelectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sailSelectorPlaceholder: {
    flex: 1,
  },
  sailSelectorPlaceholderText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  sailSelectorRecommendation: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.purple,
    marginTop: 2,
  },
  sailSelectorEmpty: {
    gap: 4,
  },
  sailSelectorEmptyText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // Sail Selector Dropdown
  sailSelectorDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    marginTop: 4,
    overflow: 'hidden',
  },
  sailSelectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
    gap: 8,
  },
  sailSelectorOptionSelected: {
    backgroundColor: '#E5F1FF',
  },
  sailSelectorClearText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.red,
  },
  sailOptionInfo: {
    flex: 1,
  },
  sailOptionName: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  sailOptionNameSelected: {
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  sailOptionSubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },

  // Condition Badges
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  conditionBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Swipe indicator
  swipeHintBottom: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 36,
    height: 4,
    backgroundColor: IOS_COLORS.gray4,
    borderRadius: 2,
  },
});

export default ConditionsCard;
