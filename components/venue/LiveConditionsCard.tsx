/**
 * LiveConditionsCard Component
 * Displays real-time sailing conditions for racing sailors
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useVenueLiveWeather, LiveWeatherData } from '@/hooks/useVenueLiveWeather';

interface LiveConditionsCardProps {
  latitude?: number;
  longitude?: number;
  venueId?: string;
  venueName?: string;
  compact?: boolean;
}

/**
 * Get wind direction as compass text
 */
function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Get color based on race readiness
 */
function getReadinessColor(readiness: LiveWeatherData['raceReadiness']): string {
  switch (readiness) {
    case 'excellent': return '#059669'; // emerald-600
    case 'good': return '#0284c7'; // sky-600
    case 'marginal': return '#d97706'; // amber-600
    case 'poor': return '#dc2626'; // red-600
    default: return '#6b7280'; // gray-500
  }
}

/**
 * Get background color based on race readiness
 */
function getReadinessBgColor(readiness: LiveWeatherData['raceReadiness']): string {
  switch (readiness) {
    case 'excellent': return '#d1fae5'; // emerald-100
    case 'good': return '#e0f2fe'; // sky-100
    case 'marginal': return '#fef3c7'; // amber-100
    case 'poor': return '#fee2e2'; // red-100
    default: return '#f3f4f6'; // gray-100
  }
}

/**
 * Get tide state icon
 */
function getTideIcon(state?: string): string {
  switch (state) {
    case 'rising': return '↗';
    case 'falling': return '↘';
    case 'high': return '⬆';
    case 'low': return '⬇';
    default: return '~';
  }
}

/**
 * Format time ago
 */
function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function LiveConditionsCard({
  latitude,
  longitude,
  venueId,
  venueName,
  compact = false,
}: LiveConditionsCardProps) {
  const { weather, isLoading, error, refresh, lastUpdated } = useVenueLiveWeather(
    latitude,
    longitude,
    venueId,
    venueName
  );

  if (!latitude || !longitude) {
    return null;
  }

  if (isLoading && !weather) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0284c7" />
          <ThemedText style={styles.loadingText}>Loading conditions...</ThemedText>
        </View>
      </View>
    );
  }

  if (error && !weather) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={24} color="#9ca3af" />
          <ThemedText style={styles.errorText}>Weather unavailable</ThemedText>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!weather) return null;

  const windDirection = getWindDirectionText(weather.windDirection);
  const readinessColor = getReadinessColor(weather.raceReadiness);
  const readinessBg = getReadinessBgColor(weather.raceReadiness);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <Ionicons name="flag" size={16} color="#0284c7" />
          <ThemedText style={styles.compactText}>
            {weather.windSpeed}kt {windDirection}
          </ThemedText>
          {weather.windGusts && weather.windGusts > weather.windSpeed + 3 && (
            <ThemedText style={styles.compactGusts}>G{weather.windGusts}</ThemedText>
          )}
          <View style={[styles.compactBadge, { backgroundColor: readinessBg }]}>
            <ThemedText style={[styles.compactBadgeText, { color: readinessColor }]}>
              {weather.raceReadiness.toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Race Readiness */}
      <View style={[styles.readinessBanner, { backgroundColor: readinessBg }]}>
        <View style={styles.readinessContent}>
          <View style={[styles.readinessDot, { backgroundColor: readinessColor }]} />
          <ThemedText style={[styles.readinessLabel, { color: readinessColor }]}>
            {weather.raceReadiness === 'excellent' ? 'RACE READY' : 
             weather.raceReadiness === 'good' ? 'GOOD CONDITIONS' :
             weather.raceReadiness === 'marginal' ? 'MARGINAL' : 'NOT RECOMMENDED'}
          </ThemedText>
        </View>
        <ThemedText style={styles.readinessReason}>{weather.raceReadinessReason}</ThemedText>
      </View>

      {/* Main Conditions Grid */}
      <View style={styles.conditionsGrid}>
        {/* Wind */}
        <View style={styles.conditionPrimary}>
          <View style={styles.conditionHeader}>
            <Ionicons name="flag" size={18} color="#0284c7" />
            <ThemedText style={styles.conditionLabel}>Wind</ThemedText>
          </View>
          <View style={styles.windRow}>
            <ThemedText style={styles.windSpeed}>{weather.windSpeed}</ThemedText>
            <View style={styles.windMeta}>
              <ThemedText style={styles.windUnit}>kt</ThemedText>
              <View style={styles.windDirectionContainer}>
                <Ionicons 
                  name="arrow-up" 
                  size={14} 
                  color="#374151"
                  style={{ transform: [{ rotate: `${weather.windDirection}deg` }] }}
                />
                <ThemedText style={styles.windDirectionText}>{windDirection}</ThemedText>
              </View>
            </View>
            {weather.windGusts && weather.windGusts > weather.windSpeed && (
              <View style={styles.gustBadge}>
                <ThemedText style={styles.gustText}>G{weather.windGusts}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Secondary Conditions */}
        <View style={styles.conditionsSecondary}>
          {/* Waves */}
          {weather.waveHeight !== undefined && (
            <View style={styles.conditionItem}>
              <Ionicons name="water" size={16} color="#6b7280" />
              <ThemedText style={styles.conditionValue}>
                {weather.waveHeight.toFixed(1)}m
              </ThemedText>
              <ThemedText style={styles.conditionSubLabel}>waves</ThemedText>
            </View>
          )}

          {/* Temperature */}
          <View style={styles.conditionItem}>
            <Ionicons name="thermometer-outline" size={16} color="#6b7280" />
            <ThemedText style={styles.conditionValue}>
              {Math.round(weather.airTemperature)}°
            </ThemedText>
            <ThemedText style={styles.conditionSubLabel}>air</ThemedText>
          </View>

          {/* Water Temp */}
          {weather.waterTemperature !== undefined && (
            <View style={styles.conditionItem}>
              <Ionicons name="water-outline" size={16} color="#6b7280" />
              <ThemedText style={styles.conditionValue}>
                {Math.round(weather.waterTemperature)}°
              </ThemedText>
              <ThemedText style={styles.conditionSubLabel}>water</ThemedText>
            </View>
          )}

          {/* Visibility */}
          <View style={styles.conditionItem}>
            <Ionicons name="eye-outline" size={16} color="#6b7280" />
            <ThemedText style={styles.conditionValue}>
              {weather.visibility.toFixed(0)}km
            </ThemedText>
            <ThemedText style={styles.conditionSubLabel}>vis</ThemedText>
          </View>
        </View>
      </View>

      {/* Current & Tide Row */}
      {(weather.currentSpeed || weather.tidalState) && (
        <View style={styles.marineRow}>
          {weather.currentSpeed !== undefined && weather.currentSpeed > 0 && (
            <View style={styles.marineItem}>
              <Ionicons name="git-merge-outline" size={14} color="#0891b2" />
              <ThemedText style={styles.marineValue}>
                {weather.currentSpeed.toFixed(1)}kt current
              </ThemedText>
            </View>
          )}
          {weather.tidalState && (
            <View style={styles.marineItem}>
              <ThemedText style={styles.tideIcon}>{getTideIcon(weather.tidalState)}</ThemedText>
              <ThemedText style={styles.marineValue}>
                Tide {weather.tidalState}
                {weather.tidalHeight && ` (${weather.tidalHeight.toFixed(1)}m)`}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.sourceInfo}>
          <ThemedText style={styles.sourceText}>
            {weather.source} • {lastUpdated ? formatTimeAgo(lastUpdated) : 'Updated'}
          </ThemedText>
          <View style={styles.confidenceBadge}>
            <ThemedText style={styles.confidenceText}>
              {Math.round(weather.confidence * 100)}% conf
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="refresh" size={18} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  
  // Loading & Error states
  loadingContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  retryText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  
  // Readiness Banner
  readinessBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  readinessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  readinessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readinessLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  readinessReason: {
    fontSize: 13,
    color: '#4b5563',
    marginLeft: 14,
  },
  
  // Conditions Grid
  conditionsGrid: {
    padding: 14,
    gap: 12,
  },
  conditionPrimary: {
    gap: 4,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  windSpeed: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 46,
  },
  windMeta: {
    marginLeft: 4,
  },
  windUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  windDirectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  windDirectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  gustBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  gustText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d97706',
  },
  
  // Secondary Conditions
  conditionsSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  conditionItem: {
    alignItems: 'center',
    gap: 2,
    minWidth: 50,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  conditionSubLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  
  // Marine Row
  marineRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  marineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  marineValue: {
    fontSize: 12,
    color: '#0891b2',
    fontWeight: '500',
  },
  tideIcon: {
    fontSize: 14,
    color: '#0891b2',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  confidenceBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 6,
  },
  
  // Compact variant
  compactContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  compactGusts: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
  },
  compactBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LiveConditionsCard;

