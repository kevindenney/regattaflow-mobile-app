/**
 * RouteWeatherOverview Step
 *
 * Displays route summary with overall weather conditions.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  Navigation,
  Wind,
  Waves,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Route,
  Anchor,
} from 'lucide-react-native';
import type { WeatherRoutingAnalysis } from '@/types/weatherRouting';
import type { SailingVenue } from '@/lib/types/global-venues';

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  teal: '#5AC8FA',
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

interface RouteWeatherOverviewProps {
  analysis: WeatherRoutingAnalysis;
  legSummary: LegSummaryData | null;
  riskColor: string;
  venue?: SailingVenue | null;
}

export function RouteWeatherOverview({
  analysis,
  legSummary,
  riskColor,
  venue,
}: RouteWeatherOverviewProps) {
  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  const getRiskLabel = (risk: string | null) => {
    switch (risk) {
      case 'extreme':
        return 'Extreme Risk';
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Moderate';
      case 'low':
      default:
        return 'Low Risk';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Route Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <Route size={24} color={IOS_COLORS.blue} />
          <Text style={styles.cardTitle}>Route Summary</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Navigation size={20} color={IOS_COLORS.teal} />
            <Text style={styles.statValue}>{analysis.totalDistanceNm.toFixed(1)} nm</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>

          <View style={styles.statItem}>
            <Clock size={20} color={IOS_COLORS.orange} />
            <Text style={styles.statValue}>{formatDuration(analysis.estimatedDurationHours)}</Text>
            <Text style={styles.statLabel}>Est. Duration</Text>
          </View>

          <View style={styles.statItem}>
            <Anchor size={20} color={IOS_COLORS.blue} />
            <Text style={styles.statValue}>{analysis.legs.length}</Text>
            <Text style={styles.statLabel}>Legs</Text>
          </View>
        </View>
      </View>

      {/* Weather Overview Card */}
      <View style={styles.weatherCard}>
        <View style={styles.cardHeader}>
          <Wind size={24} color={IOS_COLORS.teal} />
          <Text style={styles.cardTitle}>Weather Conditions</Text>
        </View>

        {legSummary && (
          <>
            <View style={styles.weatherRow}>
              <Text style={styles.weatherLabel}>Wind Range</Text>
              <Text style={styles.weatherValue}>
                {legSummary.windRange.min}-{legSummary.windRange.max} kts
              </Text>
            </View>

            <View style={styles.weatherRow}>
              <Text style={styles.weatherLabel}>Average Wind</Text>
              <Text style={styles.weatherValue}>{legSummary.avgWind} kts</Text>
            </View>

            {parseFloat(legSummary.maxWave) > 0 && (
              <View style={styles.weatherRow}>
                <Text style={styles.weatherLabel}>Max Wave Height</Text>
                <Text style={styles.weatherValue}>{legSummary.maxWave}m</Text>
              </View>
            )}
          </>
        )}

        {/* Sail Plan Preview */}
        {analysis.sailPlan.length > 0 && (
          <View style={styles.sailPreview}>
            <Text style={styles.sailPreviewLabel}>Sail Changes Expected</Text>
            <Text style={styles.sailPreviewValue}>{analysis.sailPlan.length}</Text>
          </View>
        )}
      </View>

      {/* Risk Assessment Card */}
      <View style={[styles.riskCard, { borderLeftColor: riskColor }]}>
        <View style={styles.riskHeader}>
          {analysis.overallRisk === 'low' ? (
            <CheckCircle2 size={24} color={riskColor} />
          ) : (
            <AlertTriangle size={24} color={riskColor} />
          )}
          <Text style={[styles.riskTitle, { color: riskColor }]}>
            {getRiskLabel(analysis.overallRisk)}
          </Text>
        </View>

        {legSummary?.hasHighRisk && (
          <Text style={styles.riskDescription}>
            {legSummary.highRiskLegs} of {legSummary.totalLegs} legs have challenging conditions.
            Review the leg-by-leg breakdown for details.
          </Text>
        )}

        {!legSummary?.hasHighRisk && (
          <Text style={styles.riskDescription}>
            Conditions appear manageable throughout the route. Stay alert for changes.
          </Text>
        )}
      </View>

      {/* Decision Points Preview */}
      {analysis.decisionPoints.length > 0 && (
        <View style={styles.decisionsCard}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={24} color={IOS_COLORS.orange} />
            <Text style={styles.cardTitle}>Key Decision Points</Text>
          </View>

          <Text style={styles.decisionsCount}>
            {analysis.decisionPoints.length} decision point
            {analysis.decisionPoints.length !== 1 ? 's' : ''} identified
          </Text>

          {analysis.decisionPoints.slice(0, 2).map((dp, index) => (
            <View key={dp.id} style={styles.decisionPreview}>
              <Text style={styles.decisionType}>{dp.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.decisionDesc} numberOfLines={1}>
                {dp.description}
              </Text>
            </View>
          ))}

          {analysis.decisionPoints.length > 2 && (
            <Text style={styles.moreDecisions}>
              +{analysis.decisionPoints.length - 2} more
            </Text>
          )}
        </View>
      )}

      {/* Model Status */}
      <View style={styles.modelCard}>
        <View style={styles.cardHeader}>
          <Waves size={24} color={IOS_COLORS.blue} />
          <Text style={styles.cardTitle}>Weather Models</Text>
        </View>

        <Text style={styles.modelCount}>
          {analysis.models.length} model{analysis.models.length !== 1 ? 's' : ''} compared
        </Text>

        <View style={styles.modelList}>
          {analysis.models.map((model, index) => (
            <View key={index} style={styles.modelTag}>
              <Text style={styles.modelName}>{model.modelDisplayName}</Text>
            </View>
          ))}
        </View>

        {analysis.modelAgreement && (
          <Text style={styles.agreementText}>
            Model Agreement: {analysis.modelAgreement.overallAgreement}
            {analysis.modelAgreement.agreementScore && ` (${analysis.modelAgreement.agreementScore}%)`}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  weatherCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  weatherLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  weatherValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sailPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  sailPreviewLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  sailPreviewValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  riskCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  riskTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  riskDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  decisionsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  decisionsCount: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  decisionPreview: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  decisionType: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  decisionDesc: {
    fontSize: 14,
    color: IOS_COLORS.label,
  },
  moreDecisions: {
    fontSize: 13,
    color: IOS_COLORS.blue,
    marginTop: 8,
  },
  modelCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  modelCount: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
  modelList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  agreementText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
});
