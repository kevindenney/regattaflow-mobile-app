/**
 * DecisionPointsStep
 *
 * Shows key decision points and sail change plan.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  AlertTriangle,
  Wind,
  Navigation,
  Anchor,
  Flag,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowRight,
  Target,
} from 'lucide-react-native';
import type {
  DecisionPoint,
  SailChangePlan,
  RoutingRecommendation,
  DecisionPriority,
} from '@/types/weatherRouting';

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  teal: '#5AC8FA',
  purple: '#AF52DE',
  gray: '#8E8E93',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface DecisionPointsStepProps {
  decisionPoints: DecisionPoint[];
  sailPlan: SailChangePlan[];
  recommendations: RoutingRecommendation[];
}

export function DecisionPointsStep({
  decisionPoints,
  sailPlan,
  recommendations,
}: DecisionPointsStepProps) {
  const getPriorityColor = (priority: DecisionPriority) => {
    switch (priority) {
      case 'critical':
        return IOS_COLORS.red;
      case 'important':
        return IOS_COLORS.orange;
      case 'consider':
      default:
        return IOS_COLORS.blue;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sail_change':
        return <RefreshCw size={20} color={IOS_COLORS.orange} />;
      case 'wind_shift':
        return <Wind size={20} color={IOS_COLORS.teal} />;
      case 'route_decision':
        return <Navigation size={20} color={IOS_COLORS.blue} />;
      case 'weather_window':
        return <Clock size={20} color={IOS_COLORS.purple} />;
      case 'current_change':
        return <Anchor size={20} color={IOS_COLORS.green} />;
      case 'tack_point':
      case 'gybe_point':
        return <Target size={20} color={IOS_COLORS.orange} />;
      default:
        return <AlertTriangle size={20} color={IOS_COLORS.orange} />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
    });
  };

  // Sort decision points by time
  const sortedDecisionPoints = [...decisionPoints].sort(
    (a, b) => a.estimatedTime.getTime() - b.estimatedTime.getTime()
  );

  // Get critical recommendations
  const criticalRecs = recommendations.filter((r) => r.priority === 'critical');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Critical Recommendations */}
      {criticalRecs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Critical Actions</Text>
          {criticalRecs.map((rec, index) => (
            <View key={index} style={styles.criticalCard}>
              <View style={styles.criticalIcon}>
                <AlertTriangle size={24} color={IOS_COLORS.red} />
              </View>
              <View style={styles.criticalContent}>
                <Text style={styles.criticalTitle}>{rec.title}</Text>
                <Text style={styles.criticalDesc}>{rec.description}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Decision Points Timeline */}
      {sortedDecisionPoints.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Decision Points</Text>
          <View style={styles.timelineContainer}>
            {sortedDecisionPoints.map((dp, index) => (
              <View key={dp.id} style={styles.timelineItem}>
                {/* Timeline connector */}
                {index > 0 && <View style={styles.timelineConnector} />}

                {/* Time */}
                <View style={styles.timelineTime}>
                  <Text style={styles.timeDay}>{formatDay(dp.estimatedTime)}</Text>
                  <Text style={styles.timeHour}>{formatTime(dp.estimatedTime)}</Text>
                </View>

                {/* Content */}
                <View
                  style={[
                    styles.timelineContent,
                    { borderLeftColor: getPriorityColor(dp.priority) },
                  ]}
                >
                  <View style={styles.dpHeader}>
                    {getTypeIcon(dp.type)}
                    <Text
                      style={[
                        styles.dpType,
                        { color: getPriorityColor(dp.priority) },
                      ]}
                    >
                      {dp.type.replace(/_/g, ' ')}
                    </Text>
                    {dp.legIndex !== undefined && (
                      <Text style={styles.dpLeg}>Leg {dp.legIndex + 1}</Text>
                    )}
                  </View>

                  <Text style={styles.dpDescription}>{dp.description}</Text>

                  {/* Conditions at this point */}
                  <View style={styles.dpConditions}>
                    <Text style={styles.conditionText}>
                      Wind: {dp.conditions.wind.speedAvg.toFixed(0)} kts
                    </Text>
                  </View>

                  <Text style={styles.dpRecommendation}>{dp.recommendation}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Sail Change Plan */}
      {sailPlan.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Sail Change Plan</Text>
          <View style={styles.sailPlanCard}>
            {sailPlan.map((change, index) => (
              <View
                key={index}
                style={[
                  styles.sailChangeItem,
                  index < sailPlan.length - 1 && styles.sailChangeItemBorder,
                ]}
              >
                <View style={styles.sailChangeHeader}>
                  <View style={styles.sailLegBadge}>
                    <Text style={styles.sailLegText}>Leg {change.legIndex + 1}</Text>
                  </View>
                  <Text style={styles.sailChangeTime}>
                    {formatTime(change.atTime)}
                  </Text>
                </View>

                <View style={styles.sailChangeDetails}>
                  <Text style={styles.sailFrom}>{change.fromSail}</Text>
                  <ArrowRight size={16} color={IOS_COLORS.orange} />
                  <Text style={styles.sailTo}>{change.toSail}</Text>
                </View>

                <Text style={styles.sailReason}>{change.reason}</Text>

                <View style={styles.sailConditions}>
                  <Wind size={14} color={IOS_COLORS.teal} />
                  <Text style={styles.sailConditionText}>
                    {change.windConditions.speed.toFixed(0)} kts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* No Decision Points */}
      {sortedDecisionPoints.length === 0 && sailPlan.length === 0 && (
        <View style={styles.emptyCard}>
          <CheckCircle2 size={48} color={IOS_COLORS.green} />
          <Text style={styles.emptyTitle}>Straightforward Route</Text>
          <Text style={styles.emptyText}>
            No major decision points identified. Conditions appear relatively
            consistent along the route.
          </Text>
        </View>
      )}

      {/* Other Recommendations */}
      {recommendations.filter((r) => r.priority !== 'critical').length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {recommendations
            .filter((r) => r.priority !== 'critical')
            .map((rec, index) => (
              <View key={index} style={styles.recCard}>
                <View style={styles.recHeader}>
                  <View
                    style={[
                      styles.recPriorityDot,
                      { backgroundColor: getPriorityColor(rec.priority) },
                    ]}
                  />
                  <Text style={styles.recCategory}>{rec.category}</Text>
                </View>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDesc}>{rec.description}</Text>
              </View>
            ))}
        </>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
    marginTop: 8,
  },
  criticalCard: {
    flexDirection: 'row',
    backgroundColor: `${IOS_COLORS.red}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  criticalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${IOS_COLORS.red}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  criticalContent: {
    flex: 1,
  },
  criticalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.red,
    marginBottom: 4,
  },
  criticalDesc: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 34,
    top: -16,
    width: 2,
    height: 16,
    backgroundColor: IOS_COLORS.separator,
  },
  timelineTime: {
    width: 50,
    marginRight: 16,
    alignItems: 'flex-end',
  },
  timeDay: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  timeHour: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
  },
  dpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dpType: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dpLeg: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    marginLeft: 'auto',
  },
  dpDescription: {
    fontSize: 14,
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  dpConditions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  dpRecommendation: {
    fontSize: 13,
    color: IOS_COLORS.blue,
    fontStyle: 'italic',
  },
  sailPlanCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sailChangeItem: {
    paddingVertical: 12,
  },
  sailChangeItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  sailChangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sailLegBadge: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sailLegText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  sailChangeTime: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  sailChangeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sailFrom: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  sailTo: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  sailReason: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  sailConditions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sailConditionText: {
    fontSize: 12,
    color: IOS_COLORS.teal,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  recCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
});
