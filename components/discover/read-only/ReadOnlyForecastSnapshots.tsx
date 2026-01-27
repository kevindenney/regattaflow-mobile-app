/**
 * ReadOnlyForecastSnapshots Component
 *
 * Displays sailor's saved weather forecast snapshots in read-only mode.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cloud, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { ForecastIntention, ForecastSnapshot, ForecastAnalysis } from '@/types/raceIntentions';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface ReadOnlyForecastSnapshotsProps {
  forecastCheck?: ForecastIntention;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Wind trend icon component
 */
function WindTrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case 'building':
      return <TrendingUp size={14} color={IOS_COLORS.systemOrange} />;
    case 'easing':
      return <TrendingDown size={14} color={IOS_COLORS.systemGreen} />;
    default:
      return <Minus size={14} color={IOS_COLORS.systemGray} />;
  }
}

/**
 * Alert level badge component
 */
function AlertBadge({ level }: { level: string }) {
  const config = {
    stable: { color: IOS_COLORS.systemGreen, icon: CheckCircle, label: 'Stable' },
    minor_change: { color: IOS_COLORS.systemYellow, icon: AlertTriangle, label: 'Minor Change' },
    significant_change: { color: IOS_COLORS.systemOrange, icon: AlertTriangle, label: 'Significant Change' },
  }[level] || { color: IOS_COLORS.systemGray, icon: Minus, label: level };

  const Icon = config.icon;

  return (
    <View style={[styles.alertBadge, { backgroundColor: `${config.color}20` }]}>
      <Icon size={12} color={config.color} />
      <Text style={[styles.alertText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

/**
 * Snapshot card component
 */
function SnapshotCard({ snapshot, index }: { snapshot: ForecastSnapshot; index: number }) {
  const windAvg = snapshot.raceWindow?.avgWindSpeed;
  const windDir = snapshot.raceWindow?.avgWindDirection;
  const tideState = snapshot.highTide || snapshot.lowTide;

  return (
    <View style={styles.snapshotCard}>
      <View style={styles.snapshotHeader}>
        <Text style={styles.snapshotNumber}>Snapshot {index + 1}</Text>
        <Text style={styles.snapshotTime}>{formatTimestamp(snapshot.capturedAt)}</Text>
      </View>

      <View style={styles.snapshotContent}>
        {/* Wind Info */}
        <View style={styles.snapshotRow}>
          <Text style={styles.snapshotLabel}>Wind</Text>
          <View style={styles.snapshotValueRow}>
            <Text style={styles.snapshotValue}>
              {windAvg ? `${Math.round(windAvg)} kts` : 'N/A'}
              {windDir ? ` @ ${Math.round(windDir)}°` : ''}
            </Text>
            <WindTrendIcon trend={snapshot.windTrend} />
          </View>
        </View>

        {/* Tide Info */}
        {tideState && (
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Tide</Text>
            <Text style={styles.snapshotValue}>
              {snapshot.highTide
                ? `High at ${snapshot.highTide.time}`
                : snapshot.lowTide
                ? `Low at ${snapshot.lowTide.time}`
                : 'N/A'}
            </Text>
          </View>
        )}

        {/* Source */}
        {snapshot.source && (
          <Text style={styles.sourceText}>Source: {snapshot.source}</Text>
        )}
      </View>
    </View>
  );
}

/**
 * Analysis section component
 */
function AnalysisSection({ analysis }: { analysis: ForecastAnalysis }) {
  return (
    <View style={styles.analysisSection}>
      <View style={styles.analysisHeader}>
        <Text style={styles.analysisTitle}>Forecast Change Analysis</Text>
        <AlertBadge level={analysis.alertLevel} />
      </View>

      <Text style={styles.analysisSummary}>{analysis.summary}</Text>

      {analysis.implications.length > 0 && (
        <View style={styles.implications}>
          <Text style={styles.implicationsTitle}>Tactical Implications</Text>
          {analysis.implications.map((imp, i) => (
            <View key={i} style={styles.implicationRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.implicationText}>{imp}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ReadOnlyForecastSnapshots({
  forecastCheck,
}: ReadOnlyForecastSnapshotsProps) {
  if (!forecastCheck || !forecastCheck.snapshots || forecastCheck.snapshots.length === 0) {
    return (
      <Text style={styles.emptyText}>No forecast snapshots saved</Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Latest Analysis */}
      {forecastCheck.latestAnalysis && (
        <AnalysisSection analysis={forecastCheck.latestAnalysis} />
      )}

      {/* Snapshot Cards */}
      <View style={styles.snapshotsContainer}>
        {forecastCheck.snapshots.map((snapshot, index) => (
          <SnapshotCard
            key={snapshot.id}
            snapshot={snapshot}
            index={index}
          />
        ))}
      </View>

      {/* Last Checked */}
      {forecastCheck.lastCheckedAt && (
        <Text style={styles.lastChecked}>
          Last checked: {formatTimestamp(forecastCheck.lastCheckedAt)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  snapshotsContainer: {
    gap: 10,
  },
  snapshotCard: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  snapshotNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  snapshotTime: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  snapshotContent: {
    padding: 12,
    gap: 8,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  snapshotValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snapshotValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  sourceText: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
  },
  analysisSection: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.systemIndigo,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  analysisTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '600',
  },
  analysisSummary: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
    marginBottom: 10,
  },
  implications: {
    gap: 6,
  },
  implicationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  implicationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: IOS_COLORS.systemIndigo,
  },
  implicationText: {
    fontSize: 13,
    color: IOS_COLORS.label,
    lineHeight: 18,
    flex: 1,
  },
  lastChecked: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
});

export default ReadOnlyForecastSnapshots;
