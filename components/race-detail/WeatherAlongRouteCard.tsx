/**
 * WeatherAlongRouteCard Component
 * Displays weather forecasts at key points along a distance race route
 * Shows wind, conditions at start, waypoints, and finish
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { 
  Cloud, 
  Wind, 
  Droplets, 
  Thermometer,
  Navigation,
  Flag,
  Anchor,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react-native';
import { RaceWeatherService } from '@/services/RaceWeatherService';

export interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
}

export interface WeatherAtPoint {
  location: string;
  locationType: 'start' | 'waypoint' | 'finish';
  coordinates: { lat: number; lng: number };
  estimatedTime?: string;  // When boat expected to reach this point
  wind?: {
    direction: string;
    speed: number;
    gusts?: number;
  };
  conditions?: string;  // "Clear", "Partly Cloudy", "Rain", etc.
  temperature?: number;
  waveHeight?: number;
  currentDirection?: string;
  currentSpeed?: number;
  alerts?: string[];
}

interface WeatherAlongRouteCardProps {
  waypoints: RouteWaypoint[];
  raceDate: string;
  startTime: string;
  // If weather data is pre-fetched, pass it here
  weatherData?: WeatherAtPoint[];
  // Otherwise, we'll show a loading state
  loading?: boolean;
  onRefresh?: () => void;
}

export function WeatherAlongRouteCard({
  waypoints,
  raceDate,
  startTime,
  weatherData: externalWeatherData,
  loading: externalLoading = false,
  onRefresh,
}: WeatherAlongRouteCardProps) {
  const [fetchedWeather, setFetchedWeather] = useState<WeatherAtPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Get key points for weather (start, 1-2 mid-points, finish)
  const keyPoints = useMemo(() => {
    if (waypoints.length === 0) return [];
    
    const points: RouteWaypoint[] = [];
    
    // Always include start
    const startWaypoint = waypoints.find(w => w.type === 'start');
    if (startWaypoint) points.push(startWaypoint);
    
    // Include 1-2 waypoints in the middle
    const middleWaypoints = waypoints.filter(
      w => w.type === 'waypoint' || w.type === 'gate'
    );
    if (middleWaypoints.length > 0) {
      // Take up to 2 evenly distributed middle points
      if (middleWaypoints.length <= 2) {
        points.push(...middleWaypoints);
      } else {
        const midIndex = Math.floor(middleWaypoints.length / 2);
        points.push(middleWaypoints[0]);
        points.push(middleWaypoints[midIndex]);
      }
    }
    
    // Always include finish
    const finishWaypoint = waypoints.find(w => w.type === 'finish');
    if (finishWaypoint && finishWaypoint !== startWaypoint) {
      points.push(finishWaypoint);
    }
    
    return points;
  }, [waypoints]);

  // Fetch real weather data for each key point
  const fetchWeatherForWaypoints = useCallback(async () => {
    if (keyPoints.length === 0) return;
    
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const weatherPromises = keyPoints.map(async (point, index) => {
        try {
          // Fetch weather for this waypoint's coordinates
          const weather = await RaceWeatherService.fetchWeatherByCoordinates(
            point.latitude,
            point.longitude,
            raceDate,
            point.name || `Waypoint ${index + 1}`
          );
          
          return {
            location: point.name || `Waypoint ${index + 1}`,
            locationType: point.type === 'finish' ? 'finish' as const : 
                          point.type === 'start' ? 'start' as const : 'waypoint' as const,
            coordinates: { lat: point.latitude, lng: point.longitude },
            estimatedTime: index === 0 ? startTime : undefined,
            wind: weather ? {
              direction: weather.wind?.direction || 'Variable',
              speed: weather.wind ? (weather.wind.speedMin + weather.wind.speedMax) / 2 : 0,
              gusts: weather.wind?.speedMax,
            } : undefined,
            conditions: weather?.raw?.forecast?.[0]?.condition || 'Unknown',
            temperature: weather?.raw?.forecast?.[0]?.temperature,
          } as WeatherAtPoint;
        } catch (err) {
          console.warn(`[WeatherAlongRoute] Failed to fetch weather for ${point.name}:`, err);
          // Return partial data on error
          return {
            location: point.name || `Waypoint ${index + 1}`,
            locationType: point.type === 'finish' ? 'finish' as const : 
                          point.type === 'start' ? 'start' as const : 'waypoint' as const,
            coordinates: { lat: point.latitude, lng: point.longitude },
            estimatedTime: index === 0 ? startTime : undefined,
          } as WeatherAtPoint;
        }
      });
      
      const results = await Promise.all(weatherPromises);
      setFetchedWeather(results);
    } catch (error) {
      console.error('[WeatherAlongRoute] Error fetching weather:', error);
      setFetchError('Unable to load weather data');
    } finally {
      setIsLoading(false);
    }
  }, [keyPoints, raceDate, startTime]);

  // Auto-fetch weather when key points change
  useEffect(() => {
    if (keyPoints.length > 0 && !externalWeatherData) {
      fetchWeatherForWaypoints();
    }
  }, [keyPoints, externalWeatherData, fetchWeatherForWaypoints]);

  // Determine which weather data to display
  const displayWeather = useMemo<WeatherAtPoint[]>(() => {
    // Prefer external data if provided
    if (externalWeatherData && externalWeatherData.length > 0) {
      return externalWeatherData;
    }
    // Use fetched data
    if (fetchedWeather.length > 0) {
      return fetchedWeather;
    }
    // Loading placeholder - show location names only
    return keyPoints.map((point, index) => ({
      location: point.name || `Waypoint ${index + 1}`,
      locationType: point.type === 'finish' ? 'finish' as const : 
                    point.type === 'start' ? 'start' as const : 'waypoint' as const,
      coordinates: { lat: point.latitude, lng: point.longitude },
      estimatedTime: index === 0 ? startTime : undefined,
    }));
  }, [externalWeatherData, fetchedWeather, keyPoints, startTime]);

  const loading = externalLoading || isLoading;
  
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchWeatherForWaypoints();
    }
  }, [onRefresh, fetchWeatherForWaypoints]);

  // Get icon for location type
  const getLocationIcon = (type: WeatherAtPoint['locationType']) => {
    switch (type) {
      case 'start':
        return <Flag size={16} color="#10B981" />;
      case 'finish':
        return <Anchor size={16} color="#EF4444" />;
      default:
        return <Navigation size={16} color="#7C3AED" />;
    }
  };

  // Get wind direction arrow rotation
  const getWindRotation = (direction: string): number => {
    const directions: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
    };
    return directions[direction] || 0;
  };

  if (waypoints.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Cloud size={20} color="#0284C7" />
          <Text style={styles.title}>Weather Along Route</Text>
        </View>
        <View style={styles.emptyState}>
          <Cloud size={32} color="#CBD5E1" />
          <Text style={styles.emptyText}>No route defined</Text>
          <Text style={styles.emptySubtext}>
            Add waypoints to see weather forecasts along the route
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Cloud size={20} color="#0284C7" />
          <Text style={styles.title}>Weather Along Route</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} disabled={loading}>
          <RefreshCw 
            size={18} 
            color={loading ? "#94A3B8" : "#64748B"} 
            style={loading ? styles.refreshSpinning : undefined}
          />
        </TouchableOpacity>
      </View>

      {/* Race date/time context */}
      <View style={styles.contextRow}>
        <Clock size={14} color="#64748B" />
        <Text style={styles.contextText}>
          Forecast for {new Date(raceDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })} at {startTime}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.weatherScroll}
          contentContainerStyle={styles.weatherScrollContent}
        >
          {displayWeather.map((weather, index) => (
            <View 
              key={`${weather.location}-${index}`}
              style={[
                styles.weatherPoint,
                index === displayWeather.length - 1 && styles.weatherPointLast,
              ]}
            >
              {/* Connector line */}
              {index < displayWeather.length - 1 && (
                <View style={styles.connectorArrow}>
                  <View style={styles.connectorLine} />
                  <Navigation 
                    size={12} 
                    color="#CBD5E1" 
                    style={{ transform: [{ rotate: '90deg' }] }}
                  />
                </View>
              )}

              {/* Location header */}
              <View style={styles.pointHeader}>
                {getLocationIcon(weather.locationType)}
                <Text style={styles.pointName} numberOfLines={1}>
                  {weather.location}
                </Text>
              </View>

              {/* Estimated time */}
              {weather.estimatedTime && (
                <Text style={styles.etaText}>ETA: {weather.estimatedTime}</Text>
              )}

              {/* Wind */}
              {weather.wind && (
                <View style={styles.windSection}>
                  <View style={styles.windRow}>
                    <Wind 
                      size={18} 
                      color="#0284C7"
                      style={{ 
                        transform: [{ rotate: `${getWindRotation(weather.wind.direction)}deg` }] 
                      }}
                    />
                    <View>
                      <Text style={styles.windSpeed}>
                        {Math.round(weather.wind.speed)} kts
                      </Text>
                      <Text style={styles.windDirection}>
                        {weather.wind.direction}
                      </Text>
                    </View>
                  </View>
                  {weather.wind.gusts && (
                    <Text style={styles.gustsText}>
                      Gusts: {Math.round(weather.wind.gusts)} kts
                    </Text>
                  )}
                </View>
              )}

              {/* Conditions */}
              {weather.conditions && (
                <View style={styles.conditionsRow}>
                  <Cloud size={14} color="#64748B" />
                  <Text style={styles.conditionsText}>{weather.conditions}</Text>
                </View>
              )}

              {/* Temperature */}
              {weather.temperature && (
                <View style={styles.tempRow}>
                  <Thermometer size={14} color="#64748B" />
                  <Text style={styles.tempText}>
                    {Math.round(weather.temperature)}°C
                  </Text>
                </View>
              )}

              {/* Alerts */}
              {weather.alerts && weather.alerts.length > 0 && (
                <View style={styles.alertsSection}>
                  {weather.alerts.map((alert, alertIndex) => (
                    <View key={alertIndex} style={styles.alertRow}>
                      <AlertTriangle size={12} color="#F59E0B" />
                      <Text style={styles.alertText}>{alert}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Error message */}
      {fetchError && (
        <View style={styles.errorRow}>
          <AlertTriangle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      {/* Weather summary/notes */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Route Weather Summary</Text>
        <Text style={styles.summaryText}>
          {loading
            ? 'Fetching weather data...'
            : displayWeather.length > 0 && displayWeather.some(w => w.wind)
            ? (() => {
                const windSpeeds = displayWeather
                  .filter(w => w.wind?.speed)
                  .map(w => w.wind!.speed);
                const minWind = Math.round(Math.min(...windSpeeds));
                const maxWind = Math.round(Math.max(...windSpeeds));
                const directions = displayWeather
                  .filter(w => w.wind?.direction)
                  .map(w => w.wind!.direction);
                const primaryDirection = directions[0] || 'Variable';
                return minWind === maxWind
                  ? `Wind ${primaryDirection} ${minWind} kts along route`
                  : `Wind ${primaryDirection} ${minWind}-${maxWind} kts along route`;
              })()
            : 'No weather data available'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  refreshSpinning: {
    opacity: 0.5,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contextText: {
    fontSize: 12,
    color: '#64748B',
  },
  weatherScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  weatherScrollContent: {
    paddingRight: 32,
  },
  weatherPoint: {
    width: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    position: 'relative',
  },
  weatherPointLast: {
    marginRight: 0,
  },
  connectorArrow: {
    position: 'absolute',
    right: -18,
    top: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  connectorLine: {
    width: 12,
    height: 2,
    backgroundColor: '#E2E8F0',
  },
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pointName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  etaText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  windSection: {
    marginBottom: 8,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  windSpeed: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284C7',
  },
  windDirection: {
    fontSize: 11,
    color: '#64748B',
  },
  gustsText: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
  },
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  conditionsText: {
    fontSize: 11,
    color: '#64748B',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tempText: {
    fontSize: 11,
    color: '#64748B',
  },
  alertsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertText: {
    fontSize: 10,
    color: '#F59E0B',
    flex: 1,
  },
  summarySection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#1E293B',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
});

export default WeatherAlongRouteCard;

