/**
 * ConditionsCard - Position 1
 *
 * Full-card display of weather and water conditions:
 * - Wind (direction, speed range)
 * - Tide (state, height, direction)
 * - Waves (height, period)
 * - Temperature
 *
 * This card provides detailed conditions for race planning.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Wind,
  Waves,
  Thermometer,
  Compass,
  ArrowUp,
  ArrowDown,
  Minus,
  Droplets,
} from 'lucide-react-native';

import { CardContentProps } from '../types';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get tide state icon and color
 */
function getTideDisplay(state?: string): {
  icon: typeof ArrowUp;
  color: string;
  label: string;
} {
  const normalizedState = state?.toLowerCase() || '';

  switch (normalizedState) {
    case 'flooding':
    case 'rising':
      return { icon: ArrowUp, color: '#3B82F6', label: 'Rising' };
    case 'ebbing':
    case 'falling':
      return { icon: ArrowDown, color: '#EF4444', label: 'Falling' };
    case 'high':
      return { icon: Minus, color: '#22C55E', label: 'High' };
    case 'low':
      return { icon: Minus, color: '#F59E0B', label: 'Low' };
    case 'slack':
      return { icon: Minus, color: '#6B7280', label: 'Slack' };
    default:
      return { icon: Waves, color: '#6B7280', label: state || 'Unknown' };
  }
}

/**
 * Get wind strength description
 */
function getWindStrength(speedMin: number, speedMax: number): string {
  const avg = (speedMin + speedMax) / 2;
  if (avg < 5) return 'Light';
  if (avg < 10) return 'Light-Medium';
  if (avg < 15) return 'Medium';
  if (avg < 20) return 'Medium-Heavy';
  if (avg < 25) return 'Heavy';
  return 'Very Heavy';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConditionsCard({
  race,
  cardType,
  isActive,
  dimensions,
}: CardContentProps) {
  const { wind, tide } = race;
  const waves = (race as any).waves;
  const temperature = (race as any).temperature;

  const hasData = wind || tide || waves || temperature !== undefined;
  const tideDisplay = tide ? getTideDisplay(tide.state) : null;
  const TideIcon = tideDisplay?.icon || Waves;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Wind size={24} color="#3B82F6" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Conditions</Text>
          <Text style={styles.subtitle}>Weather & water conditions</Text>
        </View>
      </View>

      {hasData ? (
        <View style={styles.content}>
          {/* Wind Section */}
          {wind && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Wind size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Wind</Text>
                <View style={styles.strengthBadge}>
                  <Text style={styles.strengthText}>
                    {getWindStrength(wind.speedMin, wind.speedMax)}
                  </Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.primaryMetric}>
                  <Text style={styles.primaryValue}>
                    {wind.speedMin}-{wind.speedMax}
                  </Text>
                  <Text style={styles.primaryUnit}>kts</Text>
                </View>
                <View style={styles.directionRow}>
                  <Compass size={16} color="#6B7280" />
                  <Text style={styles.directionText}>{wind.direction}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Tide Section */}
          {tide && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Waves size={20} color="#06B6D4" />
                <Text style={styles.sectionTitle}>Tide</Text>
                <View style={[styles.tideBadge, { backgroundColor: `${tideDisplay?.color}20` }]}>
                  <TideIcon size={14} color={tideDisplay?.color} />
                  <Text style={[styles.tideText, { color: tideDisplay?.color }]}>
                    {tideDisplay?.label}
                  </Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                {tide.height !== undefined && (
                  <View style={styles.primaryMetric}>
                    <Text style={styles.primaryValue}>{tide.height.toFixed(1)}</Text>
                    <Text style={styles.primaryUnit}>m</Text>
                  </View>
                )}
                {tide.direction && (
                  <View style={styles.directionRow}>
                    <Compass size={16} color="#6B7280" />
                    <Text style={styles.directionText}>{tide.direction}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Waves Section */}
          {waves && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Droplets size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Waves</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.primaryMetric}>
                  <Text style={styles.primaryValue}>{waves.height.toFixed(1)}</Text>
                  <Text style={styles.primaryUnit}>m</Text>
                </View>
                {waves.period && (
                  <View style={styles.secondaryMetric}>
                    <Text style={styles.secondaryLabel}>Period</Text>
                    <Text style={styles.secondaryValue}>{waves.period}s</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Temperature Section */}
          {temperature !== undefined && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Thermometer size={20} color="#EF4444" />
                <Text style={styles.sectionTitle}>Water Temp</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.primaryMetric}>
                  <Text style={styles.primaryValue}>{temperature}</Text>
                  <Text style={styles.primaryUnit}>°C</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Wind size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Conditions Data</Text>
          <Text style={styles.emptyText}>
            Weather and tide data will appear here when available
          </Text>
        </View>
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
    gap: 16,
  },

  // Sections
  section: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  // Badges
  strengthBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  tideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tideText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Metrics
  primaryMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  primaryValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  primaryUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  directionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  secondaryMetric: {
    alignItems: 'flex-end',
  },
  secondaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  secondaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
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
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
});

export default ConditionsCard;
