/**
 * LegByLegConditions Step
 *
 * Shows detailed weather conditions for each leg of the route.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import {
  Navigation,
  Wind,
  Waves,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Anchor,
} from 'lucide-react-native';
import type { LegWeatherAnalysis, RiskLevel } from '@/types/weatherRouting';

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

interface LegByLegConditionsProps {
  legs: LegWeatherAnalysis[];
  avgBoatSpeed: number;
  onBoatSpeedChange: (speed: number) => void;
}

export function LegByLegConditions({
  legs,
  avgBoatSpeed,
  onBoatSpeedChange,
}: LegByLegConditionsProps) {
  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'extreme':
        return IOS_COLORS.red;
      case 'high':
        return IOS_COLORS.orange;
      case 'medium':
        return IOS_COLORS.yellow;
      case 'low':
      default:
        return IOS_COLORS.green;
    }
  };

  const getRiskIcon = (risk: RiskLevel) => {
    if (risk === 'low') {
      return <CheckCircle2 size={16} color={IOS_COLORS.green} />;
    }
    return <AlertTriangle size={16} color={getRiskColor(risk)} />;
  };

  const formatETA = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  const getWindDirectionLabel = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Boat Speed Setting */}
      <View style={styles.speedCard}>
        <Text style={styles.speedLabel}>Assumed Boat Speed</Text>
        <View style={styles.speedInput}>
          <TextInput
            style={styles.speedValue}
            value={avgBoatSpeed.toString()}
            onChangeText={(text) => {
              const num = parseFloat(text);
              if (!isNaN(num) && num > 0) {
                onBoatSpeedChange(num);
              }
            }}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <Text style={styles.speedUnit}>kts</Text>
        </View>
        <Text style={styles.speedHint}>
          Adjust to recalculate ETAs and leg durations
        </Text>
      </View>

      {/* Leg Cards */}
      {legs.map((leg, index) => (
        <View
          key={leg.legIndex}
          style={[styles.legCard, { borderLeftColor: getRiskColor(leg.riskLevel) }]}
        >
          {/* Leg Header */}
          <View style={styles.legHeader}>
            <View style={styles.legNumber}>
              <Text style={styles.legNumberText}>{leg.legIndex + 1}</Text>
            </View>
            <View style={styles.legRoute}>
              <Text style={styles.legFrom}>{leg.fromWaypoint.name}</Text>
              <ArrowRight size={14} color={IOS_COLORS.gray} />
              <Text style={styles.legTo}>{leg.toWaypoint.name}</Text>
            </View>
            {getRiskIcon(leg.riskLevel)}
          </View>

          {/* Leg Stats */}
          <View style={styles.legStats}>
            <View style={styles.legStat}>
              <Navigation size={14} color={IOS_COLORS.teal} />
              <Text style={styles.legStatValue}>{leg.distanceNm.toFixed(1)} nm</Text>
            </View>
            <View style={styles.legStat}>
              <Clock size={14} color={IOS_COLORS.orange} />
              <Text style={styles.legStatValue}>{formatDuration(leg.estimatedDurationHours)}</Text>
            </View>
            <View style={styles.legStat}>
              <Anchor size={14} color={IOS_COLORS.blue} />
              <Text style={styles.legStatValue}>ETA {formatETA(leg.eta)}</Text>
            </View>
          </View>

          {/* Weather Conditions */}
          <View style={styles.weatherSection}>
            <View style={styles.weatherRow}>
              <Wind size={16} color={IOS_COLORS.teal} />
              <Text style={styles.weatherLabel}>Wind</Text>
              <Text style={styles.weatherValue}>
                {leg.weather.wind.speedMin.toFixed(0)}-{leg.weather.wind.speedMax.toFixed(0)} kts
                {' '}
                ({getWindDirectionLabel(leg.weather.wind.directionStart)})
              </Text>
            </View>

            {leg.weather.wind.shift !== 0 && (
              <View style={styles.shiftBadge}>
                <Text style={styles.shiftText}>
                  {leg.weather.wind.shift > 0 ? 'Veering' : 'Backing'}{' '}
                  {Math.abs(leg.weather.wind.shift).toFixed(0)}°
                </Text>
              </View>
            )}

            {leg.weather.waves && leg.weather.waves.heightMax > 0 && (
              <View style={styles.weatherRow}>
                <Waves size={16} color={IOS_COLORS.blue} />
                <Text style={styles.weatherLabel}>Waves</Text>
                <Text style={styles.weatherValue}>
                  {leg.weather.waves.heightMax.toFixed(1)}m
                </Text>
              </View>
            )}
          </View>

          {/* Sail Recommendation */}
          {leg.sailRecommendation && (
            <View style={styles.sailSection}>
              <Text style={styles.sailLabel}>Recommended</Text>
              <Text style={styles.sailValue}>{leg.sailRecommendation}</Text>
            </View>
          )}

          {/* Tactical Advice */}
          {leg.tacticalAdvice && (
            <View style={styles.adviceSection}>
              <Text style={styles.adviceText}>{leg.tacticalAdvice}</Text>
            </View>
          )}
        </View>
      ))}

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
  speedCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  speedLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  speedInput: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  speedValue: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    minWidth: 60,
  },
  speedUnit: {
    fontSize: 17,
    color: IOS_COLORS.secondaryLabel,
  },
  speedHint: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
  },
  legCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  legNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.secondaryBackground,
  },
  legRoute: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legFrom: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  legTo: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  legStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  legStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legStatValue: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  weatherSection: {
    gap: 8,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    width: 50,
  },
  weatherValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  shiftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${IOS_COLORS.orange}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 24,
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.orange,
  },
  sailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 8,
  },
  sailLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  sailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  adviceSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 8,
  },
  adviceText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});
