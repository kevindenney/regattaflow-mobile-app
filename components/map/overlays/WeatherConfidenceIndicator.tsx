/**
 * WeatherConfidenceIndicator Component
 *
 * Displays confidence levels from Storm Glass's multi-source weather aggregation
 * Shows data source quality, agreement, and reliability metrics
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

interface DataSource {
  name: string;
  priority: number; // 1 = highest
  available: boolean;
  lastUpdate?: Date;
}

interface ConfidenceMetrics {
  overall: number; // 0-1
  sources: DataSource[];
  agreement: number; // 0-1 (how well sources agree)
  recency: number; // 0-1 (how recent the data is)
  coverage: number; // 0-1 (spatial coverage quality)
  forecast: {
    confidence: number;
    source: string;
    model: string;
    modelRun: Date;
    validTime: Date;
    lastUpdated: Date;
  };
}

interface WeatherConfidenceIndicatorProps {
  metrics: ConfidenceMetrics;
  mode?: 'compact' | 'detailed';
  showSources?: boolean;
}

/**
 * Get confidence level description
 */
function getConfidenceLevel(confidence: number): {
  level: 'very-high' | 'high' | 'moderate' | 'low' | 'very-low';
  label: string;
  color: string;
} {
  if (confidence >= 0.9) {
    return {
      level: 'very-high',
      label: 'Very High',
      color: '#00FF00',
    };
  } else if (confidence >= 0.75) {
    return {
      level: 'high',
      label: 'High',
      color: '#90EE90',
    };
  } else if (confidence >= 0.6) {
    return {
      level: 'moderate',
      label: 'Moderate',
      color: '#FFFF00',
    };
  } else if (confidence >= 0.4) {
    return {
      level: 'low',
      label: 'Low',
      color: '#FFA500',
    };
  } else {
    return {
      level: 'very-low',
      label: 'Very Low',
      color: '#FF0000',
    };
  }
}

/**
 * Confidence Gauge Component
 */
const ConfidenceGauge: React.FC<{
  confidence: number;
  size?: number;
}> = ({ confidence, size = 80 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const strokeWidth = size * 0.12;

  const confidenceLevel = getConfidenceLevel(confidence);

  // Calculate gauge arc
  const startAngle = -135; // degrees
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;
  const progressAngle = startAngle + totalAngle * confidence;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  // Background arc path
  const backgroundPath = describeArc(
    centerX,
    centerY,
    radius,
    startAngle,
    endAngle
  );

  // Progress arc path
  const progressPath = describeArc(
    centerX,
    centerY,
    radius,
    startAngle,
    progressAngle
  );

  return (
    <Svg width={size} height={size}>
      {/* Background arc */}
      <Path
        d={backgroundPath}
        fill="none"
        stroke="#333333"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Progress arc */}
      <Path
        d={progressPath}
        fill="none"
        stroke={confidenceLevel.color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Center text - confidence percentage */}
      <SvgText
        x={centerX}
        y={centerY - 5}
        fontSize={size * 0.25}
        fontWeight="bold"
        fill={confidenceLevel.color}
        textAnchor="middle"
      >
        {Math.round(confidence * 100)}%
      </SvgText>

      {/* Confidence level label */}
      <SvgText
        x={centerX}
        y={centerY + size * 0.15}
        fontSize={size * 0.12}
        fill="#FFFFFF"
        textAnchor="middle"
      >
        {confidenceLevel.label}
      </SvgText>
    </Svg>
  );
};

/**
 * Helper function to describe SVG arc
 */
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Source Status Indicator
 */
const SourceStatusIndicator: React.FC<{
  source: DataSource;
}> = ({ source }) => {
  const statusColor = source.available ? '#00FF00' : '#666666';
  const priorityLabel = ['Primary', 'Secondary', 'Tertiary', 'Backup'][
    Math.min(source.priority - 1, 3)
  ];

  const timeSinceUpdate = source.lastUpdate
    ? Math.floor((Date.now() - source.lastUpdate.getTime()) / 60000)
    : null;

  return (
    <View style={styles.sourceItem}>
      <View style={styles.sourceHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <ThemedText style={styles.sourceName}>{source.name}</ThemedText>
        <ThemedText style={styles.sourcePriority}>{priorityLabel}</ThemedText>
      </View>
      {timeSinceUpdate !== null && source.available && (
        <ThemedText style={styles.sourceUpdate}>
          Updated {timeSinceUpdate}m ago
        </ThemedText>
      )}
    </View>
  );
};

/**
 * Detailed Metrics Display
 */
const DetailedMetrics: React.FC<{
  metrics: ConfidenceMetrics;
}> = ({ metrics }) => {
  const agreementLevel = getConfidenceLevel(metrics.agreement);
  const recencyLevel = getConfidenceLevel(metrics.recency);
  const coverageLevel = getConfidenceLevel(metrics.coverage);

  return (
    <View style={styles.metricsGrid}>
      <View style={styles.metricItem}>
        <ThemedText style={styles.metricLabel}>Agreement</ThemedText>
        <View style={styles.metricBar}>
          <View
            style={[
              styles.metricBarFill,
              {
                width: `${metrics.agreement * 100}%`,
                backgroundColor: agreementLevel.color,
              },
            ]}
          />
        </View>
        <ThemedText style={styles.metricValue}>
          {Math.round(metrics.agreement * 100)}%
        </ThemedText>
      </View>

      <View style={styles.metricItem}>
        <ThemedText style={styles.metricLabel}>Recency</ThemedText>
        <View style={styles.metricBar}>
          <View
            style={[
              styles.metricBarFill,
              {
                width: `${metrics.recency * 100}%`,
                backgroundColor: recencyLevel.color,
              },
            ]}
          />
        </View>
        <ThemedText style={styles.metricValue}>
          {Math.round(metrics.recency * 100)}%
        </ThemedText>
      </View>

      <View style={styles.metricItem}>
        <ThemedText style={styles.metricLabel}>Coverage</ThemedText>
        <View style={styles.metricBar}>
          <View
            style={[
              styles.metricBarFill,
              {
                width: `${metrics.coverage * 100}%`,
                backgroundColor: coverageLevel.color,
              },
            ]}
          />
        </View>
        <ThemedText style={styles.metricValue}>
          {Math.round(metrics.coverage * 100)}%
        </ThemedText>
      </View>
    </View>
  );
};

export const WeatherConfidenceIndicator: React.FC<WeatherConfidenceIndicatorProps> = ({
  metrics,
  mode = 'compact',
  showSources = false,
}) => {
  const confidenceLevel = getConfidenceLevel(metrics.overall);

  if (mode === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactGauge}>
          <ConfidenceGauge confidence={metrics.overall} size={60} />
        </View>
        <View style={styles.compactInfo}>
          <ThemedText style={styles.compactTitle}>Data Confidence</ThemedText>
          <ThemedText style={[styles.compactLevel, { color: confidenceLevel.color }]}>
            {confidenceLevel.label}
          </ThemedText>
          <ThemedText style={styles.compactSources}>
            {metrics.sources.filter(s => s.available).length} / {metrics.sources.length} sources
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Weather Confidence</ThemedText>
        <ThemedText style={styles.subtitle}>Multi-Source Aggregation</ThemedText>
      </View>

      {/* Main Gauge */}
      <View style={styles.gaugeContainer}>
        <ConfidenceGauge confidence={metrics.overall} size={120} />
      </View>

      {/* Detailed Metrics */}
      <DetailedMetrics metrics={metrics} />

      {/* Forecast Info */}
      <View style={styles.forecastInfo}>
        <ThemedText style={styles.forecastLabel}>Primary Source:</ThemedText>
        <ThemedText style={styles.forecastValue}>{metrics.forecast.source}</ThemedText>

        <ThemedText style={styles.forecastLabel}>Model:</ThemedText>
        <ThemedText style={styles.forecastValue}>{metrics.forecast.model}</ThemedText>

        <ThemedText style={styles.forecastLabel}>Last Updated:</ThemedText>
        <ThemedText style={styles.forecastValue}>
          {Math.floor(
            (Date.now() - metrics.forecast.lastUpdated.getTime()) / 60000
          )}m ago
        </ThemedText>
      </View>

      {/* Data Sources */}
      {showSources && (
        <View style={styles.sourcesContainer}>
          <ThemedText style={styles.sourcesTitle}>Data Sources</ThemedText>
          {metrics.sources.map((source, index) => (
            <SourceStatusIndicator key={index} source={source} />
          ))}
        </View>
      )}

      {/* Confidence Advisory */}
      {metrics.overall < 0.6 && (
        <View style={styles.advisory}>
          <ThemedText style={styles.advisoryText}>
            ⚠️ Lower confidence - verify conditions before racing
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
  },
  compactGauge: {
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  compactLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  compactSources: {
    fontSize: 10,
    color: '#AAA',
    marginTop: 2,
  },
  detailedContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  metricsGrid: {
    marginBottom: 16,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 11,
    color: '#AAA',
    marginBottom: 4,
  },
  metricBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
  },
  forecastInfo: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  forecastLabel: {
    fontSize: 10,
    color: '#AAA',
    marginTop: 4,
  },
  forecastValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  sourcesContainer: {
    marginTop: 8,
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sourceItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sourceName: {
    flex: 1,
    fontSize: 11,
    color: '#FFFFFF',
  },
  sourcePriority: {
    fontSize: 9,
    color: '#AAA',
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceUpdate: {
    fontSize: 9,
    color: '#AAA',
    marginLeft: 16,
    marginTop: 2,
  },
  advisory: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  advisoryText: {
    fontSize: 11,
    color: '#FFA500',
    textAlign: 'center',
  },
});

/**
 * Generate confidence metrics from Storm Glass data
 */
export function generateConfidenceMetrics(
  stormGlassResponse: any,
  availableSources: string[] = []
): ConfidenceMetrics {
  // Storm Glass typically includes sources like:
  // NOAA, Météo-France, UK Met Office, DWD, FCOO, FMI, YR, SMHI

  const allSources: DataSource[] = [
    { name: 'NOAA', priority: 1, available: availableSources.includes('noaa') },
    { name: 'Météo-France', priority: 1, available: availableSources.includes('meteo') },
    { name: 'UK Met Office', priority: 1, available: availableSources.includes('ukmo') },
    { name: 'DWD', priority: 2, available: availableSources.includes('dwd') },
    { name: 'FCOO', priority: 2, available: availableSources.includes('fcoo') },
    { name: 'FMI', priority: 3, available: availableSources.includes('fmi') },
    { name: 'YR', priority: 3, available: availableSources.includes('yr') },
    { name: 'SMHI', priority: 3, available: availableSources.includes('smhi') },
  ];

  const availableCount = allSources.filter(s => s.available).length;
  const totalCount = allSources.length;

  // Calculate metrics
  const coverage = availableCount / totalCount;
  const agreement = Math.min(1, availableCount / 5); // 5+ sources = high agreement
  const recency = 0.95; // Assume recent (Storm Glass handles this)

  // Overall confidence is weighted average
  const overall = coverage * 0.4 + agreement * 0.4 + recency * 0.2;

  return {
    overall,
    sources: allSources,
    agreement,
    recency,
    coverage,
    forecast: {
      confidence: overall,
      source: 'Storm Glass',
      model: 'Multi-Source Aggregation',
      modelRun: new Date(),
      validTime: new Date(),
      lastUpdated: new Date(),
    },
  };
}
