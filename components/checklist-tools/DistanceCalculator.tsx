/**
 * DistanceCalculator
 *
 * Displays leg distances and helps calculate laylines.
 * In a full implementation, would integrate with CoursePositionEditor data.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Ruler,
  Check,
  MapPin,
  Wind,
  Navigation,
  Info,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray2: '#636366',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

// Sample course legs (would come from positioned course data)
const SAMPLE_LEGS = [
  { id: 1, from: 'Start', to: 'Mark 1 (Windward)', distance: '0.8 nm', bearing: '45°', type: 'beat' },
  { id: 2, from: 'Mark 1', to: 'Mark 2 (Gate)', distance: '0.8 nm', bearing: '225°', type: 'run' },
  { id: 3, from: 'Mark 2', to: 'Mark 1 (Windward)', distance: '0.8 nm', bearing: '45°', type: 'beat' },
  { id: 4, from: 'Mark 1', to: 'Finish', distance: '0.5 nm', bearing: '225°', type: 'run' },
];

interface DistanceCalculatorProps extends ChecklistToolProps {
  /** Course legs from positioned course */
  coursLegs?: typeof SAMPLE_LEGS;
  /** Wind direction */
  windDirection?: number;
}

export function DistanceCalculator({
  item,
  regattaId,
  onComplete,
  onCancel,
  coursLegs = SAMPLE_LEGS,
  windDirection = 45,
}: DistanceCalculatorProps) {
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Calculate total distance
  const totalDistance = coursLegs.reduce((sum, leg) => {
    const dist = parseFloat(leg.distance);
    return sum + (isNaN(dist) ? 0 : dist);
  }, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>Distance Calculator</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Icon Header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Ruler size={32} color={IOS_COLORS.purple} />
          </View>
          <Text style={styles.title}>Course Distances</Text>
          <Text style={styles.subtitle}>
            Review leg distances and plan your approach
          </Text>
        </View>

        {/* Course Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalDistance.toFixed(1)} nm</Text>
              <Text style={styles.summaryLabel}>Total Distance</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{coursLegs.length}</Text>
              <Text style={styles.summaryLabel}>Legs</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <View style={styles.windDirection}>
                <Wind size={16} color={IOS_COLORS.blue} />
                <Text style={styles.summaryValue}>{windDirection}°</Text>
              </View>
              <Text style={styles.summaryLabel}>Wind</Text>
            </View>
          </View>
        </View>

        {/* Legs List */}
        <Text style={styles.sectionTitle}>Course Legs</Text>
        <View style={styles.legsList}>
          {coursLegs.map((leg, index) => (
            <View key={leg.id} style={styles.legCard}>
              <View style={styles.legHeader}>
                <View style={styles.legNumber}>
                  <Text style={styles.legNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.legLabel}>
                  {leg.from} → {leg.to}
                </Text>
                <View style={[styles.legTypeBadge, getLegTypeStyle(leg.type)]}>
                  <Text style={styles.legTypeText}>{leg.type}</Text>
                </View>
              </View>
              <View style={styles.legDetails}>
                <View style={styles.legDetail}>
                  <Ruler size={14} color={IOS_COLORS.secondaryLabel} />
                  <Text style={styles.legDetailText}>{leg.distance}</Text>
                </View>
                <View style={styles.legDetail}>
                  <Navigation size={14} color={IOS_COLORS.secondaryLabel} />
                  <Text style={styles.legDetailText}>{leg.bearing}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Layline Info */}
        <View style={styles.laylineCard}>
          <View style={styles.laylineHeader}>
            <Navigation size={20} color={IOS_COLORS.orange} />
            <Text style={styles.laylineTitle}>Layline Notes</Text>
          </View>
          <Text style={styles.laylineText}>
            With wind at {windDirection}° and typical 45° pointing angle:
          </Text>
          <View style={styles.laylineInfo}>
            <View style={styles.laylineItem}>
              <Text style={styles.laylineLabel}>Port Layline:</Text>
              <Text style={styles.laylineValue}>{(windDirection + 45 + 360) % 360}°</Text>
            </View>
            <View style={styles.laylineItem}>
              <Text style={styles.laylineLabel}>Starboard Layline:</Text>
              <Text style={styles.laylineValue}>{(windDirection - 45 + 360) % 360}°</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Info size={14} color={IOS_COLORS.blue} />
            <Text style={styles.infoText}>
              Current will shift these angles. Check weather routing for adjustments.
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Longer legs allow more recovery from mistakes
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Plan tactical split points for each leg
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Pre-calculate laylines for different current scenarios
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getLegTypeStyle(type: string) {
  switch (type) {
    case 'beat':
      return { backgroundColor: `${IOS_COLORS.orange}15` };
    case 'run':
      return { backgroundColor: `${IOS_COLORS.blue}15` };
    case 'reach':
      return { backgroundColor: `${IOS_COLORS.green}15` };
    default:
      return { backgroundColor: `${IOS_COLORS.gray}15` };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  summaryLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: IOS_COLORS.separator,
  },
  windDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  legsList: {
    gap: 10,
    marginBottom: 24,
  },
  legCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 14,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  legNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  legTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  legTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textTransform: 'uppercase',
  },
  legDetails: {
    flexDirection: 'row',
    gap: 20,
    marginLeft: 34,
  },
  legDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legDetailText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  laylineCard: {
    backgroundColor: `${IOS_COLORS.orange}08`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.orange}30`,
  },
  laylineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  laylineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  laylineText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  laylineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  laylineItem: {
    alignItems: 'center',
  },
  laylineLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  laylineValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  tipsCard: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DistanceCalculator;
