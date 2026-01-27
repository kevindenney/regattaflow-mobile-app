/**
 * ConfirmationStep
 *
 * Summary of weather routing analysis with save option.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Wind,
  Clock,
  BookOpen,
  ChevronRight,
  Share2,
  Download,
} from 'lucide-react-native';
import type { WeatherRoutingAnalysis, RiskLevel } from '@/types/weatherRouting';

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

interface LegSummaryData {
  totalLegs: number;
  highRiskLegs: number;
  avgWind: number;
  windRange: { min: number; max: number };
  maxWave: string;
  hasHighRisk: boolean;
}

interface ConfirmationStepProps {
  analysis: WeatherRoutingAnalysis;
  legSummary: LegSummaryData | null;
  overallRisk: RiskLevel | null;
  riskColor: string;
  onLearnMore: () => void;
}

export function ConfirmationStep({
  analysis,
  legSummary,
  overallRisk,
  riskColor,
  onLearnMore,
}: ConfirmationStepProps) {
  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  const getRiskLabel = (risk: RiskLevel | null) => {
    switch (risk) {
      case 'extreme':
        return 'Extreme Risk';
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Moderate Risk';
      case 'low':
      default:
        return 'Low Risk';
    }
  };

  const getAgreementLabel = (agreement: string) => {
    switch (agreement) {
      case 'high':
        return 'Good';
      case 'moderate':
        return 'Moderate';
      case 'low':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        {overallRisk === 'low' ? (
          <CheckCircle2 size={48} color={IOS_COLORS.green} />
        ) : (
          <AlertTriangle size={48} color={riskColor} />
        )}
        <Text style={[styles.riskTitle, { color: riskColor }]}>
          {getRiskLabel(overallRisk)}
        </Text>
        <Text style={styles.analysisTime}>
          Analysis completed {new Date(analysis.analyzedAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Navigation size={20} color={IOS_COLORS.teal} />
            <Text style={styles.statValue}>{analysis.totalDistanceNm.toFixed(1)} nm</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Clock size={20} color={IOS_COLORS.orange} />
            <Text style={styles.statValue}>
              {formatDuration(analysis.estimatedDurationHours)}
            </Text>
            <Text style={styles.statLabel}>Est. Time</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Wind size={20} color={IOS_COLORS.teal} />
            <Text style={styles.statValue}>
              {legSummary?.windRange.min}-{legSummary?.windRange.max}
            </Text>
            <Text style={styles.statLabel}>Wind (kts)</Text>
          </View>
        </View>
      </View>

      {/* Key Findings */}
      <Text style={styles.sectionTitle}>Key Findings</Text>

      <View style={styles.findingsCard}>
        {/* Model Agreement */}
        <View style={styles.findingRow}>
          <Text style={styles.findingLabel}>Model Agreement</Text>
          <Text
            style={[
              styles.findingValue,
              {
                color:
                  analysis.modelAgreement.overallAgreement === 'high'
                    ? IOS_COLORS.green
                    : analysis.modelAgreement.overallAgreement === 'low'
                    ? IOS_COLORS.orange
                    : IOS_COLORS.label,
              },
            ]}
          >
            {getAgreementLabel(analysis.modelAgreement.overallAgreement)}
            {analysis.modelAgreement.agreementScore && ` (${analysis.modelAgreement.agreementScore}%)`}
          </Text>
        </View>

        {/* Legs at Risk */}
        {legSummary && (
          <View style={styles.findingRow}>
            <Text style={styles.findingLabel}>Challenging Legs</Text>
            <Text
              style={[
                styles.findingValue,
                { color: legSummary.hasHighRisk ? IOS_COLORS.orange : IOS_COLORS.green },
              ]}
            >
              {legSummary.highRiskLegs} of {legSummary.totalLegs}
            </Text>
          </View>
        )}

        {/* Decision Points */}
        <View style={styles.findingRow}>
          <Text style={styles.findingLabel}>Decision Points</Text>
          <Text style={styles.findingValue}>{analysis.decisionPoints.length}</Text>
        </View>

        {/* Sail Changes */}
        <View style={styles.findingRow}>
          <Text style={styles.findingLabel}>Sail Changes</Text>
          <Text style={styles.findingValue}>{analysis.sailPlan.length}</Text>
        </View>

        {/* Critical Recommendations */}
        {analysis.recommendations.filter((r) => r.priority === 'critical').length > 0 && (
          <View style={styles.findingRow}>
            <Text style={styles.findingLabel}>Critical Actions</Text>
            <Text style={[styles.findingValue, { color: IOS_COLORS.red }]}>
              {analysis.recommendations.filter((r) => r.priority === 'critical').length}
            </Text>
          </View>
        )}
      </View>

      {/* Top Recommendations */}
      {analysis.recommendations.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Recommendations</Text>
          <View style={styles.recsCard}>
            {analysis.recommendations.slice(0, 3).map((rec, index) => (
              <View
                key={index}
                style={[
                  styles.recItem,
                  index < Math.min(2, analysis.recommendations.length - 1) &&
                    styles.recItemBorder,
                ]}
              >
                <View
                  style={[
                    styles.recBullet,
                    {
                      backgroundColor:
                        rec.priority === 'critical'
                          ? IOS_COLORS.red
                          : rec.priority === 'important'
                          ? IOS_COLORS.orange
                          : IOS_COLORS.blue,
                    },
                  ]}
                />
                <View style={styles.recContent}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDesc} numberOfLines={2}>
                    {rec.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Weather Models Used */}
      <View style={styles.modelsCard}>
        <Text style={styles.modelsTitle}>Data Sources</Text>
        <View style={styles.modelsList}>
          {analysis.models.map((model, index) => (
            <View key={index} style={styles.modelTag}>
              <Text style={styles.modelName}>{model.modelDisplayName}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Learn More */}
      <Pressable style={styles.learnMoreButton} onPress={onLearnMore}>
        <BookOpen size={20} color={IOS_COLORS.blue} />
        <Text style={styles.learnMoreText}>Learn more about weather routing</Text>
        <ChevronRight size={20} color={IOS_COLORS.blue} />
      </Pressable>

      {/* Bottom Note */}
      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          This analysis is based on current forecasts. Weather can change
          rapidly - continue to monitor conditions and update your plan as
          needed.
        </Text>
      </View>

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
  summaryHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  riskTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  analysisTime: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: IOS_COLORS.separator,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
    marginTop: 8,
  },
  findingsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  findingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  findingLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  findingValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  recsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
  },
  recItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  recBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  recDesc: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  modelsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modelsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  modelsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modelTag: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modelName: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  learnMoreText: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.blue,
    marginLeft: 12,
  },
  noteCard: {
    backgroundColor: `${IOS_COLORS.gray}15`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
    textAlign: 'center',
  },
});
