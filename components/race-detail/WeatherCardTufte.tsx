/**
 * WeatherCard (Tufte Edition)
 *
 * Redesigned following Edward Tufte's principles:
 * 1. Replace decorative compass with compact data notation
 * 2. Integrate sparklines showing 24-hour wind history
 * 3. Show forecast uncertainty and confidence intervals
 * 4. Provide comparative context (vs. historical averages)
 * 5. Maximum data density with minimal chartjunk
 * 6. Precise numerical data over approximations
 */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { DataTable } from '../viz/DataTable';
import { Sparkline } from '../viz/Sparkline';

interface WindConditions {
  speed: number; // knots
  direction: number; // 0-360 degrees
  gusts?: number; // knots
  beaufortScale?: number; // 0-12
  description?: string;
}

interface WindForecast {
  time: string;
  speed: number;
  direction: number;
  confidence: number; // 0-100%
}

interface WeatherCardTufteProps {
  windConditions: WindConditions;
  windHistory?: number[]; // Last 24 hours
  forecast?: WindForecast[];
  historicalAverage?: number; // Average wind speed for this venue/time
  showLiveIndicator?: boolean;
}

const getCardinalDirection = (deg: number): string => {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return cardinals[index];
};

export const WeatherCardTufte: React.FC<WeatherCardTufteProps> = ({
  windConditions,
  windHistory = [12, 13, 14, 15, 14, 13, 15, 16, 15, 14, 15, 14],
  forecast = [
    { time: '+1h', speed: 15.2, direction: 55, confidence: 92 },
    { time: '+2h', speed: 16.1, direction: 58, confidence: 87 },
    { time: '+3h', speed: 17.3, direction: 62, confidence: 78 },
    { time: '+4h', speed: 16.8, direction: 65, confidence: 71 },
  ],
  historicalAverage = 12.5,
  showLiveIndicator = true,
}) => {
  const windDelta = windConditions.speed - historicalAverage;
  const windDeltaPercent = ((windDelta / historicalAverage) * 100).toFixed(0);

  // Prepare forecast table data
  const forecastData = forecast.map((f) => ({
    time: f.time,
    speed: f.speed,
    direction: `${f.direction}° ${getCardinalDirection(f.direction)}`,
    confidence: `${f.confidence}%`,
  }));

  const forecastColumns = [
    { id: 'time', header: 'Time', width: 50, align: 'left' as const },
    { id: 'speed', header: 'Speed', width: 60, align: 'right' as const, precision: 1 },
    { id: 'direction', header: 'Direction', width: 80, align: 'left' as const },
    { id: 'confidence', header: 'Conf.', width: 55, align: 'right' as const },
  ];

  return (
    <View style={styles.card}>
      {/* Header: Compact, data-first */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionLabel}>WIND CONDITIONS</Text>
          {showLiveIndicator && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>
        <Text style={styles.updateTime}>Updated 2m ago</Text>
      </View>

      {/* Current Conditions - Compact notation (no decorative compass) */}
      <View style={styles.currentSection}>
        {/* Primary data: Speed + Direction + Sparkline */}
        <View style={styles.primaryRow}>
          <View style={styles.windValue}>
            <Text style={styles.speedValue}>{windConditions.speed.toFixed(1)}</Text>
            <Text style={styles.speedUnit}>kts</Text>
            <Text style={styles.direction}>{getCardinalDirection(windConditions.direction)} ({windConditions.direction}°)</Text>
          </View>

          {/* 24-hour sparkline (Tufte-style: intense, simple, word-sized) */}
          <View style={styles.sparklineContainer}>
            <Text style={styles.sparklineLabel}>24h history</Text>
            <Sparkline
              data={windHistory}
              width={100}
              height={30}
              strokeWidth={1.5}
              color="#0284C7"
              showDot={true}
              fillArea={true}
            />
          </View>
        </View>

        {/* Secondary data: Gusts + Beaufort */}
        <View style={styles.secondaryRow}>
          {windConditions.gusts && (
            <View style={styles.dataPoint}>
              <Text style={styles.dataLabel}>Gusts</Text>
              <Text style={styles.dataValue}>{windConditions.gusts.toFixed(1)} kts</Text>
            </View>
          )}
          {windConditions.beaufortScale !== undefined && (
            <View style={styles.dataPoint}>
              <Text style={styles.dataLabel}>Beaufort</Text>
              <Text style={styles.dataValue}>Force {windConditions.beaufortScale}</Text>
            </View>
          )}
          <View style={styles.dataPoint}>
            <Text style={styles.dataLabel}>Avg Wind</Text>
            <Text style={styles.dataValue}>{historicalAverage.toFixed(1)} kts</Text>
          </View>
        </View>

        {/* Comparative context - Tufte: "compared to what?" */}
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonText}>
            Current: {windDelta > 0 ? '+' : ''}{windDelta.toFixed(1)} kts (
            {windDeltaPercent > '0' ? '+' : ''}{windDeltaPercent}%) vs. historical average
          </Text>
        </View>
      </View>

      {/* Forecast table - Dense, minimal borders */}
      <View style={styles.forecastSection}>
        <Text style={styles.sectionLabel}>FORECAST</Text>
        <DataTable
          columns={forecastColumns}
          data={forecastData}
          dense={true}
          showBorders="horizontal"
        />
      </View>

      {/* Forecast uncertainty note */}
      <View style={styles.footerNote}>
        <Text style={styles.noteText}>
          Confidence intervals shown. Lower confidence indicates higher forecast uncertainty.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    // Minimal shadow
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  updateTime: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  currentSection: {
    marginBottom: 16,
  },
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  windValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  speedValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  direction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sparklineContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sparklineLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  dataPoint: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  comparisonRow: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  comparisonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 16,
  },
  forecastSection: {
    marginBottom: 12,
  },
  footerNote: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  noteText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    lineHeight: 14,
  },
});
