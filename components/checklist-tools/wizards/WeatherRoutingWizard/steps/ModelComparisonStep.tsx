/**
 * ModelComparisonStep
 *
 * Compares weather forecasts from multiple models.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Wind,
} from 'lucide-react-native';
import { TinySparkline } from '@/components/shared/charts/TinySparkline';
import type {
  ModelForecast,
  ModelAgreementSummary,
  AgreementLevel,
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

const MODEL_COLORS: Record<string, string> = {
  GFS: '#4A90D9',
  ECMWF: '#7B68EE',
  NAM: '#20B2AA',
  ICON: '#FF6B6B',
  OPENMETEO: '#34C759',
  STORMGLASS: '#FF9500',
};

interface ModelComparisonStepProps {
  modelForecasts: ModelForecast[];
  modelAgreement: ModelAgreementSummary | null;
  agreementColor: string;
}

export function ModelComparisonStep({
  modelForecasts,
  modelAgreement,
  agreementColor,
}: ModelComparisonStepProps) {
  const getAgreementIcon = (level: AgreementLevel) => {
    switch (level) {
      case 'high':
        return <CheckCircle2 size={24} color={IOS_COLORS.green} />;
      case 'moderate':
        return <AlertTriangle size={24} color={IOS_COLORS.orange} />;
      case 'low':
        return <XCircle size={24} color={IOS_COLORS.red} />;
      default:
        return <AlertTriangle size={24} color={IOS_COLORS.gray} />;
    }
  };

  const getAgreementDescription = (level: AgreementLevel) => {
    switch (level) {
      case 'high':
        return 'Models are in good agreement. High confidence in forecast.';
      case 'moderate':
        return 'Some disagreement between models. Monitor updates closely.';
      case 'low':
        return 'Significant disagreement. Plan for multiple scenarios.';
      default:
        return 'Agreement not calculated.';
    }
  };

  const getModelColor = (modelName: string) => {
    return MODEL_COLORS[modelName] || IOS_COLORS.blue;
  };

  // Extract wind speed time series from each model
  const getWindSparklineData = (model: ModelForecast) => {
    return model.hourlyData.slice(0, 24).map((h) => h.windSpeed);
  };

  // Calculate stats for a model
  const getModelStats = (model: ModelForecast) => {
    const winds = model.hourlyData.map((h) => h.windSpeed);
    return {
      min: Math.round(Math.min(...winds)),
      max: Math.round(Math.max(...winds)),
      avg: Math.round(winds.reduce((a, b) => a + b, 0) / winds.length),
    };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Agreement Summary Card */}
      {modelAgreement && (
        <View style={[styles.agreementCard, { borderLeftColor: agreementColor }]}>
          <View style={styles.agreementHeader}>
            {getAgreementIcon(modelAgreement.overallAgreement)}
            <View style={styles.agreementContent}>
              <Text style={styles.agreementTitle}>
                Model Agreement:{' '}
                <Text style={{ color: agreementColor, textTransform: 'capitalize' }}>
                  {modelAgreement.overallAgreement}
                </Text>
              </Text>
              <Text style={styles.agreementScore}>
                Confidence Score: {modelAgreement.agreementScore}%
              </Text>
            </View>
          </View>
          <Text style={styles.agreementDescription}>
            {getAgreementDescription(modelAgreement.overallAgreement)}
          </Text>

          {/* Consensus Values */}
          <View style={styles.consensusSection}>
            <Text style={styles.consensusLabel}>Consensus Wind Range</Text>
            <Text style={styles.consensusValue}>
              {Math.round(modelAgreement.consensusWindSpeed.min)}-
              {Math.round(modelAgreement.consensusWindSpeed.max)} kts
              {' '}(avg {Math.round(modelAgreement.consensusWindSpeed.avg)} kts)
            </Text>
          </View>
        </View>
      )}

      {/* Individual Model Cards */}
      <Text style={styles.sectionTitle}>Model Forecasts</Text>

      {modelForecasts.map((model, index) => {
        const stats = getModelStats(model);
        const color = getModelColor(model.modelName);
        const sparklineData = getWindSparklineData(model);

        return (
          <View key={index} style={styles.modelCard}>
            <View style={styles.modelHeader}>
              <View style={[styles.modelDot, { backgroundColor: color }]} />
              <Text style={styles.modelName}>{model.modelDisplayName}</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{model.confidence}%</Text>
              </View>
            </View>

            {/* Wind Stats */}
            <View style={styles.modelStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Min</Text>
                <Text style={styles.statValue}>{stats.min} kts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg</Text>
                <Text style={styles.statValue}>{stats.avg} kts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max</Text>
                <Text style={styles.statValue}>{stats.max} kts</Text>
              </View>
            </View>

            {/* Sparkline */}
            {sparklineData.length > 0 && (
              <View style={styles.sparklineContainer}>
                <TinySparkline
                  data={sparklineData}
                  width={280}
                  height={40}
                  color={color}
                  variant="line"
                />
                <Text style={styles.sparklineLabel}>Wind speed (next 24 hrs)</Text>
              </View>
            )}

            {/* Model Run Time */}
            <View style={styles.modelMeta}>
              <Clock size={12} color={IOS_COLORS.gray} />
              <Text style={styles.modelMetaText}>
                Model run: {model.modelRunTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Disagreement Periods */}
      {modelAgreement && modelAgreement.disagreementPeriods.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Disagreement Periods</Text>
          <View style={styles.disagreementCard}>
            <AlertTriangle size={20} color={IOS_COLORS.orange} />
            <Text style={styles.disagreementIntro}>
              {modelAgreement.disagreementPeriods.length} period
              {modelAgreement.disagreementPeriods.length !== 1 ? 's' : ''} of significant
              model disagreement
            </Text>
          </View>

          {modelAgreement.disagreementPeriods.map((period, index) => (
            <View key={index} style={styles.periodCard}>
              <View style={styles.periodHeader}>
                <Text style={styles.periodTime}>
                  {period.startTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' - '}
                  {period.endTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {period.legIndex !== undefined && (
                  <Text style={styles.periodLeg}>Leg {period.legIndex + 1}</Text>
                )}
              </View>
              <Text style={styles.periodConcern}>{period.concern}</Text>
              <Text style={styles.periodRec}>{period.recommendation}</Text>
            </View>
          ))}
        </>
      )}

      {/* No Models Warning */}
      {modelForecasts.length === 0 && (
        <View style={styles.noDataCard}>
          <AlertTriangle size={32} color={IOS_COLORS.gray} />
          <Text style={styles.noDataTitle}>No Model Data</Text>
          <Text style={styles.noDataText}>
            Unable to fetch weather model data. Check your connection and try again.
          </Text>
        </View>
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
  agreementCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  agreementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  agreementContent: {
    flex: 1,
  },
  agreementTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  agreementScore: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  agreementDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginTop: 8,
  },
  consensusSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  consensusLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  consensusValue: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
    marginTop: 8,
  },
  modelCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modelName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  confidenceBadge: {
    backgroundColor: `${IOS_COLORS.green}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  modelStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sparklineContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  sparklineLabel: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
  },
  modelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  modelMetaText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  disagreementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${IOS_COLORS.orange}15`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  disagreementIntro: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.orange,
    fontWeight: '500',
  },
  periodCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodTime: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  periodLeg: {
    fontSize: 12,
    color: IOS_COLORS.blue,
    fontWeight: '500',
  },
  periodConcern: {
    fontSize: 14,
    color: IOS_COLORS.orange,
    marginBottom: 4,
  },
  periodRec: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
  noDataCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
  },
  noDataTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 12,
  },
  noDataText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
