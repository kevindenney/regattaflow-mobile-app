/**
 * RestrictedAreasMap
 *
 * Displays restricted areas and obstructions from the SI.
 * In a full implementation, would show these on the course map.
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
  AlertTriangle,
  Check,
  MapPin,
  Ship,
  Waves,
  Anchor,
  Info,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
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

// Types of restrictions
type RestrictionType = 'shipping' | 'shallow' | 'protected' | 'obstruction' | 'other';

interface RestrictedArea {
  id: string;
  name: string;
  type: RestrictionType;
  description: string;
  consequence?: string;
}

// Sample restricted areas (would come from SI extraction)
const SAMPLE_AREAS: RestrictedArea[] = [
  {
    id: '1',
    name: 'Main Shipping Channel',
    type: 'shipping',
    description: 'Ferry route - keep clear at all times',
    consequence: 'DSQ if obstructing commercial traffic',
  },
  {
    id: '2',
    name: 'Reef Area (East)',
    type: 'shallow',
    description: 'Depth less than 1m at low tide',
    consequence: 'Risk of grounding',
  },
  {
    id: '3',
    name: 'Swimming Area',
    type: 'protected',
    description: 'Designated swim zone near club',
    consequence: 'Keep outside yellow buoys',
  },
  {
    id: '4',
    name: 'Cardinal Mark (North)',
    type: 'obstruction',
    description: 'Fixed navigation mark',
    consequence: 'Give adequate clearance',
  },
];

interface RestrictedAreasMapProps extends ChecklistToolProps {
  /** Restricted areas from SI extraction */
  restrictedAreas?: RestrictedArea[];
}

export function RestrictedAreasMap({
  item,
  regattaId,
  onComplete,
  onCancel,
  restrictedAreas = SAMPLE_AREAS,
}: RestrictedAreasMapProps) {
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const getTypeIcon = (type: RestrictionType) => {
    switch (type) {
      case 'shipping':
        return <Ship size={20} color={IOS_COLORS.red} />;
      case 'shallow':
        return <Waves size={20} color={IOS_COLORS.orange} />;
      case 'protected':
        return <AlertTriangle size={20} color={IOS_COLORS.purple} />;
      case 'obstruction':
        return <Anchor size={20} color={IOS_COLORS.gray} />;
      default:
        return <MapPin size={20} color={IOS_COLORS.blue} />;
    }
  };

  const getTypeColor = (type: RestrictionType) => {
    switch (type) {
      case 'shipping':
        return IOS_COLORS.red;
      case 'shallow':
        return IOS_COLORS.orange;
      case 'protected':
        return IOS_COLORS.purple;
      case 'obstruction':
        return IOS_COLORS.gray;
      default:
        return IOS_COLORS.blue;
    }
  };

  const getTypeLabel = (type: RestrictionType) => {
    switch (type) {
      case 'shipping':
        return 'Shipping Lane';
      case 'shallow':
        return 'Shallow Water';
      case 'protected':
        return 'Protected Zone';
      case 'obstruction':
        return 'Obstruction';
      default:
        return 'Restriction';
    }
  };

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
        <Text style={styles.headerTitle}>Restricted Areas</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Icon Header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <AlertTriangle size={32} color={IOS_COLORS.red} />
          </View>
          <Text style={styles.title}>Course Restrictions</Text>
          <Text style={styles.subtitle}>
            Areas to avoid or navigate carefully
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryHighlight}>{restrictedAreas.length}</Text> restricted areas identified in the Sailing Instructions
          </Text>
        </View>

        {/* Areas List */}
        <Text style={styles.sectionTitle}>Restricted Areas</Text>
        <View style={styles.areasList}>
          {restrictedAreas.length > 0 ? (
            restrictedAreas.map((area) => (
              <View
                key={area.id}
                style={[
                  styles.areaCard,
                  { borderLeftColor: getTypeColor(area.type) },
                ]}
              >
                <View style={styles.areaHeader}>
                  {getTypeIcon(area.type)}
                  <View style={styles.areaHeaderContent}>
                    <Text style={styles.areaName}>{area.name}</Text>
                    <Text style={[styles.areaType, { color: getTypeColor(area.type) }]}>
                      {getTypeLabel(area.type)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.areaDescription}>{area.description}</Text>
                {area.consequence && (
                  <View style={styles.consequenceRow}>
                    <AlertTriangle size={14} color={IOS_COLORS.orange} />
                    <Text style={styles.consequenceText}>{area.consequence}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noAreasCard}>
              <Check size={24} color={IOS_COLORS.green} />
              <Text style={styles.noAreasTitle}>No Restrictions Found</Text>
              <Text style={styles.noAreasText}>
                No specific restricted areas noted in the SI. Always maintain proper lookout.
              </Text>
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <Ship size={16} color={IOS_COLORS.red} />
              <Text style={styles.legendText}>Shipping Lane</Text>
            </View>
            <View style={styles.legendItem}>
              <Waves size={16} color={IOS_COLORS.orange} />
              <Text style={styles.legendText}>Shallow Water</Text>
            </View>
            <View style={styles.legendItem}>
              <AlertTriangle size={16} color={IOS_COLORS.purple} />
              <Text style={styles.legendText}>Protected Zone</Text>
            </View>
            <View style={styles.legendItem}>
              <Anchor size={16} color={IOS_COLORS.gray} />
              <Text style={styles.legendText}>Obstruction</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Mark restricted areas on your course chart before racing
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Racing rules modify right-of-way near obstructions but don't eliminate seamanship requirements
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Give extra clearance to fixed obstructions when tactical pressure is high
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
    backgroundColor: `${IOS_COLORS.red}15`,
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
    backgroundColor: `${IOS_COLORS.orange}08`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.orange}30`,
  },
  summaryText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  summaryHighlight: {
    fontWeight: '700',
    color: IOS_COLORS.orange,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  areasList: {
    gap: 10,
    marginBottom: 24,
  },
  areaCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  areaHeaderContent: {
    flex: 1,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  areaType: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  areaDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginBottom: 8,
    marginLeft: 32,
  },
  consequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 32,
    padding: 8,
    backgroundColor: `${IOS_COLORS.orange}08`,
    borderRadius: 8,
  },
  consequenceText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.orange,
    fontWeight: '500',
  },
  noAreasCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: `${IOS_COLORS.green}08`,
    borderRadius: 12,
  },
  noAreasTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.green,
    marginTop: 12,
    marginBottom: 6,
  },
  noAreasText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  legendCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '45%',
  },
  legendText: {
    fontSize: 13,
    color: IOS_COLORS.label,
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

export default RestrictedAreasMap;
