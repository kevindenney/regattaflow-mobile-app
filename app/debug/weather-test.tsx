/**
 * Weather API Debug Screen
 * Test real weather data integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { regionalWeatherService } from '@/services/weather/RegionalWeatherService';
import type { Coordinates, SailingVenue } from '@/lib/types/global-venues';

export default function WeatherTestScreen() {
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Test venue: Hong Kong
  const testCoordinates: Coordinates = [114.1628, 22.2793];
  const testVenue = {
    id: 'test-hk',
    name: 'Hong Kong Test Venue',
    coordinates: testCoordinates,
    country: 'Hong Kong',
    region: 'asia-pacific',
    venueType: 'premier',
    timeZone: 'Asia/Hong_Kong',
  } as SailingVenue;
  const [longitude, latitude] = testCoordinates;

  const testWeatherAPI = async () => {
    setLoading(true);
    setError(null);
    setWeatherData(null);

    try {
      console.log('[WeatherTest] Fetching weather for:', testVenue.name);

      const weather = await regionalWeatherService.getVenueWeather(testVenue, 24);

      console.log('[WeatherTest] Weather data received:', weather);

      if (weather) {
        setWeatherData(weather);
      } else {
        setError('No weather data returned');
      }
    } catch (err: any) {
      console.error('[WeatherTest] Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weather API Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Test Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Test Configuration</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Venue:</Text>
            <Text style={styles.infoValue}>{testVenue.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coordinates:</Text>
            <Text style={styles.infoValue}>
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Region:</Text>
            <Text style={styles.infoValue}>{testVenue.region}</Text>
          </View>
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={[styles.testButton, loading && styles.testButtonDisabled]}
          onPress={testWeatherAPI}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="cloud-refresh" size={20} color="#fff" />
              <Text style={styles.testButtonText}>Fetch Weather Data</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure EXPO_PUBLIC_STORMGLASS_API_KEY is set in your .env file
            </Text>
          </View>
        )}

        {/* Weather Data Display */}
        {weatherData && (
          <View style={styles.resultsCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
              <Text style={styles.resultTitle}>Weather Data Received</Text>
            </View>

            {/* Data Source */}
            <View style={styles.dataSection}>
              <Text style={styles.sectionTitle}>DATA SOURCE</Text>
              <View style={styles.sourceInfo}>
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Primary:</Text>
                  <Text style={styles.sourceValue}>{weatherData.sources?.primary || 'Unknown'}</Text>
                </View>
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Reliability:</Text>
                  <Text style={[styles.sourceValue, styles.reliabilityValue]}>
                    {((weatherData.sources?.reliability || 0) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Updated:</Text>
                  <Text style={styles.sourceValue}>
                    {weatherData.lastUpdated
                      ? new Date(weatherData.lastUpdated).toLocaleTimeString()
                      : 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Current Conditions */}
            {weatherData.forecast && weatherData.forecast[0] && (
              <View style={styles.dataSection}>
                <Text style={styles.sectionTitle}>CURRENT CONDITIONS</Text>
                <View style={styles.conditionsGrid}>
                  <View style={styles.conditionCard}>
                    <MaterialCommunityIcons name="weather-windy" size={24} color="#3B82F6" />
                    <Text style={styles.conditionLabel}>Wind Speed</Text>
                    <Text style={styles.conditionValue}>
                      {weatherData.forecast[0].windSpeed} kts
                    </Text>
                  </View>
                  <View style={styles.conditionCard}>
                    <MaterialCommunityIcons name="compass" size={24} color="#8B5CF6" />
                    <Text style={styles.conditionLabel}>Direction</Text>
                    <Text style={styles.conditionValue}>
                      {weatherData.forecast[0].windDirection}°
                    </Text>
                  </View>
                  <View style={styles.conditionCard}>
                    <MaterialCommunityIcons name="arrow-up-bold" size={24} color="#EF4444" />
                    <Text style={styles.conditionLabel}>Gusts</Text>
                    <Text style={styles.conditionValue}>
                      {weatherData.forecast[0].windGusts} kts
                    </Text>
                  </View>
                  <View style={styles.conditionCard}>
                    <MaterialCommunityIcons name="waves" size={24} color="#06B6D4" />
                    <Text style={styles.conditionLabel}>Wave Height</Text>
                    <Text style={styles.conditionValue}>
                      {weatherData.forecast[0].waveHeight?.toFixed(1)}m
                    </Text>
                  </View>
                  <View style={styles.conditionCard}>
                    <MaterialCommunityIcons name="thermometer" size={24} color="#F59E0B" />
                    <Text style={styles.conditionLabel}>Temperature</Text>
                    <Text style={styles.conditionValue}>
                      {weatherData.forecast[0].airTemperature?.toFixed(0)}°C
                    </Text>
                  </View>
                  <View style={styles.conditionCard}>
                    <MaterialCommunityIcons name="gauge" size={24} color="#64748B" />
                    <Text style={styles.conditionLabel}>Pressure</Text>
                    <Text style={styles.conditionValue}>
                      {weatherData.forecast[0].barometricPressure?.toFixed(0)} hPa
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Raw JSON */}
            <View style={styles.dataSection}>
              <Text style={styles.sectionTitle}>RAW DATA (First Forecast Point)</Text>
              <View style={styles.jsonContainer}>
                <Text style={styles.jsonText}>
                  {JSON.stringify(weatherData.forecast?.[0], null, 2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Test</Text>
          <Text style={styles.instructionsText}>
            1. Get an API key from stormglass.io{'\n'}
            2. Add to .env file: EXPO_PUBLIC_STORMGLASS_API_KEY=your_key_here{'\n'}
            3. Restart your app{'\n'}
            4. Tap "Fetch Weather Data"{'\n'}
            5. Check if wave height has realistic precision (e.g., "0.8m" not "0.9809509007496541m")
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  testButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  testButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 8,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  dataSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sourceInfo: {
    gap: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sourceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  sourceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  reliabilityValue: {
    color: '#10B981',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  conditionLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  jsonContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  jsonText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#E2E8F0',
  },
  instructionsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 20,
  },
});
