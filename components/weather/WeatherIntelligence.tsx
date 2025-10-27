/**
 * Weather Intelligence Component
 * Displays venue-specific weather forecasting with regional intelligence
 * Integrates with Global Venue Intelligence system
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRegionalWeather } from '@/hooks/useRegionalWeather';
import type { SailingVenue } from '@/lib/types/global-venues';
import type { WeatherForecast, WeatherAlert } from '@/services/weather/RegionalWeatherService';

interface WeatherIntelligenceProps {
  venue: SailingVenue | null;
  compact?: boolean;
  onRefresh?: () => void;
}

export const WeatherIntelligence: React.FC<WeatherIntelligenceProps> = ({
  venue,
  compact = false,
  onRefresh
}) => {
  const {
    currentWeather,
    forecast,
    activeAlerts,
    sailingRecommendation,
    weatherSummary,
    weatherTrend,
    isLoading,
    error,
    refreshWeather,
    clearError,
    lastUpdated,
    hasCriticalAlerts,
    isGoodSailing
  } = useRegionalWeather();

  const [selectedTab, setSelectedTab] = useState<'current' | 'forecast' | 'alerts'>('current');

  if (!venue) {
    return (
      <View style={styles.noVenueContainer}>
        <Text style={styles.noVenueText}>Select a sailing venue to view weather intelligence</Text>
      </View>
    );
  }

  if (isLoading && !currentWeather) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>🌤️ Loading Regional Weather Intelligence...</Text>
        <Text style={styles.loadingSubtext}>Accessing {venue.region} weather models</Text>
      </View>
    );
  }

  if (error && !currentWeather) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Weather Data Unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={clearError}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (compact && weatherSummary) {
    return (
      <CompactWeatherView
        summary={weatherSummary}
        isGoodSailing={isGoodSailing}
        hasCriticalAlerts={hasCriticalAlerts}
        onExpand={() => {}}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🌤️ Weather Intelligence</Text>
          <Text style={styles.subtitle}>Regional forecasting for {venue.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            refreshWeather();
            onRefresh?.();
          }}
          disabled={isLoading}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={isLoading ? "#999" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Updated {formatTime(lastUpdated)}
          </Text>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
          onPress={() => setSelectedTab('current')}
        >
          <Text style={[styles.tabText, selectedTab === 'current' && styles.activeTabText]}>
            Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'forecast' && styles.activeTab]}
          onPress={() => setSelectedTab('forecast')}
        >
          <Text style={[styles.tabText, selectedTab === 'forecast' && styles.activeTabText]}>
            Forecast
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'alerts' && styles.activeTab]}
          onPress={() => setSelectedTab('alerts')}
        >
          <Text style={[styles.tabText, selectedTab === 'alerts' && styles.activeTabText]}>
            Alerts {activeAlerts.length > 0 && `(${activeAlerts.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'current' && (
          <CurrentWeatherTab
            weather={currentWeather}
            recommendation={sailingRecommendation}
            trend={weatherTrend}
          />
        )}

        {selectedTab === 'forecast' && (
          <ForecastTab forecast={forecast} />
        )}

        {selectedTab === 'alerts' && (
          <AlertsTab alerts={activeAlerts} />
        )}
      </ScrollView>
    </View>
  );
};

// Compact Weather View Component
interface CompactWeatherViewProps {
  summary: any;
  isGoodSailing: boolean;
  hasCriticalAlerts: boolean;
  onExpand: () => void;
}

const CompactWeatherView: React.FC<CompactWeatherViewProps> = ({
  summary,
  isGoodSailing,
  hasCriticalAlerts,
  onExpand
}) => (
  <TouchableOpacity style={styles.compactContainer} onPress={onExpand}>
    <View style={styles.compactHeader}>
      <Text style={styles.compactCondition}>{summary.condition}</Text>
      <View style={[
        styles.sailingStatus,
        { backgroundColor: isGoodSailing ? '#4CAF50' : hasCriticalAlerts ? '#F44336' : '#FF9800' }
      ]}>
        <Text style={styles.sailingStatusText}>
          {isGoodSailing ? 'Good' : hasCriticalAlerts ? 'Alert' : 'Fair'}
        </Text>
      </View>
    </View>
    <View style={styles.compactDetails}>
      <Text style={styles.compactWind}>
        {Math.round(summary.windSpeed)} kts {getWindDirection(summary.windDirection)}
      </Text>
      <Text style={styles.compactTemp}>
        {Math.round(summary.temperature)}°C
      </Text>
    </View>
  </TouchableOpacity>
);

// Current Weather Tab Component
interface CurrentWeatherTabProps {
  weather: any;
  recommendation: any;
  trend: any;
}

const CurrentWeatherTab: React.FC<CurrentWeatherTabProps> = ({
  weather,
  recommendation,
  trend
}) => {
  if (!weather) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No current weather data available</Text>
      </View>
    );
  }

  const current = weather.forecast[0];

  return (
    <View style={styles.currentContainer}>
      {/* Current Conditions */}
      <View style={styles.currentConditionsCard}>
        <View style={styles.conditionHeader}>
          <Text style={styles.conditionTitle}>{current.weatherCondition}</Text>
          <Text style={styles.conditionTime}>
            {formatTime(current.timestamp)}
          </Text>
        </View>

        <View style={styles.conditionsGrid}>
          <WeatherMetric
            icon="chevron-up"
            label="Wind"
            value={`${Math.round(current.windSpeed)} kts`}
            subtitle={getWindDirection(current.windDirection)}
          />
          <WeatherMetric
            icon="thermometer"
            label="Temperature"
            value={`${Math.round(current.airTemperature)}°C`}
            subtitle={current.waterTemperature ? `Water: ${Math.round(current.waterTemperature)}°C` : ''}
          />
          <WeatherMetric
            icon="water"
            label="Waves"
            value={`${(current.waveHeight || 0).toFixed(1)}m`}
            subtitle={`${Math.round(current.wavePeriod || 0)}s period`}
          />
          <WeatherMetric
            icon="eye"
            label="Visibility"
            value={`${current.visibility.toFixed(1)}km`}
            subtitle={`${Math.round(current.humidity)}% humidity`}
          />
        </View>
      </View>

      {/* Sailing Recommendation */}
      {recommendation && (
        <View style={[
          styles.recommendationCard,
          { borderLeftColor: recommendation.recommended ? '#4CAF50' : '#F44336' }
        ]}>
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationTitle}>
              {recommendation.recommended ? '⛵ Good for Sailing' : '⚠️ Caution Advised'}
            </Text>
            <Text style={styles.confidenceText}>
              {Math.round(recommendation.confidence * 100)}% confidence
            </Text>
          </View>

          <View style={styles.reasonsList}>
            {recommendation.reasons.map((reason: string, index: number) => (
              <Text key={index} style={styles.reasonText}>• {reason}</Text>
            ))}
          </View>

          {recommendation.boatClasses.length > 0 && (
            <View style={styles.boatClasses}>
              <Text style={styles.boatClassesLabel}>Suitable for:</Text>
              <Text style={styles.boatClassesText}>
                {recommendation.boatClasses.join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Weather Trend */}
      {trend && (
        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>📈 9-Hour Trend</Text>
          <Text style={styles.trendSummary}>{trend.summary}</Text>
          <View style={styles.trendDetails}>
            <Text style={styles.trendItem}>Wind: {trend.wind}</Text>
            <Text style={styles.trendItem}>Temperature: {trend.temperature}</Text>
            <Text style={styles.trendItem}>Conditions: {trend.conditions}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Forecast Tab Component
interface ForecastTabProps {
  forecast: WeatherForecast[];
}

const ForecastTab: React.FC<ForecastTabProps> = ({ forecast }) => {
  if (forecast.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No forecast data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.forecastContainer}>
      {forecast.map((item, index) => (
        <ForecastItem key={index} forecast={item} isFirst={index === 0} />
      ))}
    </View>
  );
};

// Forecast Item Component
interface ForecastItemProps {
  forecast: WeatherForecast;
  isFirst: boolean;
}

const ForecastItem: React.FC<ForecastItemProps> = ({ forecast, isFirst }) => (
  <View style={[styles.forecastItem, isFirst && styles.currentForecast]}>
    <View style={styles.forecastTime}>
      <Text style={styles.forecastTimeText}>
        {isFirst ? 'Now' : formatTime(forecast.timestamp)}
      </Text>
      <Text style={styles.forecastDateText}>
        {formatDate(forecast.timestamp)}
      </Text>
    </View>

    <View style={styles.forecastCondition}>
      <Text style={styles.forecastConditionText}>
        {forecast.weatherCondition}
      </Text>
    </View>

    <View style={styles.forecastMetrics}>
      <Text style={styles.forecastWind}>
        {Math.round(forecast.windSpeed)} kts
      </Text>
      <Text style={styles.forecastTemp}>
        {Math.round(forecast.airTemperature)}°C
      </Text>
      <Text style={styles.forecastWaves}>
        {(forecast.waveHeight || 0).toFixed(1)}m
      </Text>
    </View>
  </View>
);

// Alerts Tab Component
interface AlertsTabProps {
  alerts: WeatherAlert[];
}

const AlertsTab: React.FC<AlertsTabProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <View style={styles.noAlertsContainer}>
        <Text style={styles.noAlertsIcon}>✅</Text>
        <Text style={styles.noAlertsTitle}>No Active Weather Alerts</Text>
        <Text style={styles.noAlertsText}>
          Current weather conditions are within normal parameters for sailing.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.alertsContainer}>
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </View>
  );
};

// Alert Item Component
interface AlertItemProps {
  alert: WeatherAlert;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => (
  <View style={[
    styles.alertItem,
    { borderLeftColor: getAlertColor(alert.severity) }
  ]}>
    <View style={styles.alertHeader}>
      <Text style={styles.alertTitle}>{alert.title}</Text>
      <View style={[
        styles.severityBadge,
        { backgroundColor: getAlertColor(alert.severity) }
      ]}>
        <Text style={styles.severityText}>
          {alert.severity.toUpperCase()}
        </Text>
      </View>
    </View>

    <Text style={styles.alertDescription}>{alert.description}</Text>

    <View style={styles.alertTiming}>
      <Text style={styles.alertTime}>
        {formatTime(alert.startTime)} - {formatTime(alert.endTime)}
      </Text>
      <Text style={styles.alertSource}>Source: {alert.source}</Text>
    </View>
  </View>
);

// Weather Metric Component
interface WeatherMetricProps {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
}

const WeatherMetric: React.FC<WeatherMetricProps> = ({
  icon,
  label,
  value,
  subtitle
}) => (
  <View style={styles.weatherMetric}>
    <Ionicons name={icon as any} size={20} color="#666" />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
  </View>
);

// Utility Functions
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function getAlertColor(severity: string): string {
  switch (severity) {
    case 'emergency': return '#D32F2F';
    case 'warning': return '#F57C00';
    case 'watch': return '#FBC02D';
    case 'advisory': return '#1976D2';
    default: return '#666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  noVenueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noVenueText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  lastUpdated: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  compactContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    boxShadow: '0px 2px',
    elevation: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactCondition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sailingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sailingStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  compactDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  compactWind: {
    fontSize: 14,
    color: '#666',
  },
  compactTemp: {
    fontSize: 14,
    color: '#666',
  },
  currentContainer: {
    padding: 20,
  },
  currentConditionsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px',
    elevation: 2,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  conditionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  conditionTime: {
    fontSize: 14,
    color: '#666',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weatherMetric: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 2,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
    boxShadow: '0px 2px',
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  reasonsList: {
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  boatClasses: {
    marginTop: 8,
  },
  boatClassesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  boatClassesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  trendCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px',
    elevation: 2,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  trendSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  trendDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  trendItem: {
    fontSize: 12,
    color: '#999',
  },
  forecastContainer: {
    padding: 20,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 1px',
    elevation: 1,
  },
  currentForecast: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  forecastTime: {
    flex: 1,
  },
  forecastTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  forecastDateText: {
    fontSize: 12,
    color: '#666',
  },
  forecastCondition: {
    flex: 2,
  },
  forecastConditionText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  forecastMetrics: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastWind: {
    fontSize: 13,
    color: '#666',
  },
  forecastTemp: {
    fontSize: 13,
    color: '#666',
  },
  forecastWaves: {
    fontSize: 13,
    color: '#666',
  },
  alertsContainer: {
    padding: 20,
  },
  noAlertsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noAlertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  alertItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    boxShadow: '0px 2px',
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alertTiming: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  alertSource: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default WeatherIntelligence;