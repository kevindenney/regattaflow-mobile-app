/**
 * Weather Intelligence Component
 * Displays wind, wave, and tide forecasts for race day
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

interface WeatherData {
  wind_speed: number;
  wind_direction: number;
  wind_gusts?: number;
  wave_height?: number;
  wave_period?: number;
  tide_height?: number;
  tide_time?: string;
  tide_type?: 'high' | 'low';
  temperature?: number;
  conditions?: string;
}

interface WeatherIntelligenceProps {
  venueId?: string;
  raceDate?: string;
}

export function WeatherIntelligence({ venueId, raceDate }: WeatherIntelligenceProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWeatherForecast = async () => {
    // TODO: Integrate with actual weather API
    // For now, return mock data
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setWeather({
        wind_speed: 15,
        wind_direction: 225, // SW
        wind_gusts: 18,
        wave_height: 0.5,
        wave_period: 4,
        tide_height: 1.2,
        tide_time: '14:30',
        tide_type: 'high',
        temperature: 22,
        conditions: 'Partly Cloudy',
      });
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (venueId) {
      loadWeatherForecast();
    }
  }, [venueId, raceDate]);

  const getWindDirectionText = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getWindStrength = (speed: number): string => {
    if (speed < 5) return 'Light';
    if (speed < 12) return 'Moderate';
    if (speed < 20) return 'Fresh';
    if (speed < 28) return 'Strong';
    return 'Gale';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0077be" />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Weather data unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Wind Display */}
      <View style={styles.mainSection}>
        <View style={styles.windDisplay}>
          <Text style={styles.windSpeed}>{weather.wind_speed}</Text>
          <Text style={styles.windUnit}>kts</Text>
        </View>
        <View style={styles.windDetails}>
          <Text style={styles.windDirection}>
            {getWindDirectionText(weather.wind_direction)} ({weather.wind_direction}°)
          </Text>
          <Text style={styles.windStrength}>
            {getWindStrength(weather.wind_speed)}
          </Text>
          {weather.wind_gusts && (
            <Text style={styles.gusts}>Gusts: {weather.wind_gusts} kts</Text>
          )}
        </View>
      </View>

      {/* Conditions Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.grid}>
        {/* Waves */}
        {weather.wave_height !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.gridIcon}>🌊</Text>
            <Text style={styles.gridLabel}>Waves</Text>
            <Text style={styles.gridValue}>{weather.wave_height}m</Text>
            {weather.wave_period && (
              <Text style={styles.gridSubtext}>{weather.wave_period}s period</Text>
            )}
          </View>
        )}

        {/* Tide */}
        {weather.tide_height !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.gridIcon}>
              {weather.tide_type === 'high' ? '⬆️' : '⬇️'}
            </Text>
            <Text style={styles.gridLabel}>Tide</Text>
            <Text style={styles.gridValue}>{weather.tide_height}m</Text>
            {weather.tide_time && (
              <Text style={styles.gridSubtext}>
                {weather.tide_type} @ {weather.tide_time}
              </Text>
            )}
          </View>
        )}

        {/* Temperature */}
        {weather.temperature !== undefined && (
          <View style={styles.gridItem}>
            <Text style={styles.gridIcon}>🌡️</Text>
            <Text style={styles.gridLabel}>Temp</Text>
            <Text style={styles.gridValue}>{weather.temperature}°C</Text>
          </View>
        )}

        {/* Conditions */}
        {weather.conditions && (
          <View style={styles.gridItem}>
            <Text style={styles.gridIcon}>☁️</Text>
            <Text style={styles.gridLabel}>Sky</Text>
            <Text style={styles.gridValue}>{weather.conditions}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sailing Conditions Assessment */}
      <View style={styles.assessment}>
        <Text style={styles.assessmentTitle}>Sailing Conditions</Text>
        <Text style={styles.assessmentText}>
          {getWindStrength(weather.wind_speed)} {getWindDirectionText(weather.wind_direction)} wind at {weather.wind_speed} kts
          {weather.wind_gusts && ` with gusts to ${weather.wind_gusts} kts`}.
          {weather.wave_height && ` Moderate sea state with ${weather.wave_height}m waves.`}
          {' '}Good conditions for racing.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  windDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 20,
  },
  windSpeed: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0077be',
  },
  windUnit: {
    fontSize: 20,
    color: '#666',
    marginLeft: 4,
  },
  windDetails: {
    flex: 1,
  },
  windDirection: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  windStrength: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  gusts: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
  },
  grid: {
    marginBottom: 16,
  },
  gridItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gridSubtext: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  assessment: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 12,
  },
  assessmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077be',
    marginBottom: 8,
  },
  assessmentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
