import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../../components/themed-text';
import { Button } from '../ui/button';
import { RaceCourse, WeatherData } from './RaceBuilder';

export interface WeatherIntegrationProps {
  course: RaceCourse | null;
  onWeatherUpdate: (weather: WeatherData) => void;
}

export function WeatherIntegration({ course, onWeatherUpdate }: WeatherIntegrationProps) {
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock weather data for demonstration
  const mockWeatherData: WeatherData = {
    windDirection: 240, // SW wind
    windSpeed: 12, // 12 knots
    current: {
      direction: 180, // Southerly current
      speed: 0.8 // 0.8 knots
    },
    forecast: {
      hourly: [
        { time: '09:00', windDir: 235, windSpeed: 10, pressure: 1015 },
        { time: '10:00', windDir: 240, windSpeed: 12, pressure: 1014 },
        { time: '11:00', windDir: 245, windSpeed: 14, pressure: 1013 },
        { time: '12:00', windDir: 250, windSpeed: 16, pressure: 1012 },
        { time: '13:00', windDir: 255, windSpeed: 18, pressure: 1011 },
        { time: '14:00', windDir: 250, windSpeed: 15, pressure: 1012 },
        { time: '15:00', windDir: 245, windSpeed: 13, pressure: 1013 },
      ]
    }
  };

  const fetchWeatherData = async () => {
    if (!course) return;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call a weather API
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add some randomness to the mock data
      const randomizedWeather = {
        ...mockWeatherData,
        windDirection: mockWeatherData.windDirection + (Math.random() - 0.5) * 40,
        windSpeed: Math.max(5, mockWeatherData.windSpeed + (Math.random() - 0.5) * 8),
        current: {
          ...mockWeatherData.current!,
          direction: mockWeatherData.current!.direction + (Math.random() - 0.5) * 60,
          speed: Math.max(0, mockWeatherData.current!.speed + (Math.random() - 0.5) * 0.5)
        }
      };

      setWeather(randomizedWeather);
      onWeatherUpdate(randomizedWeather);
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (course && course.marks.length > 0) {
      fetchWeatherData();
    }
  }, [course?.marks.length]);

  const getWindDirectionText = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getWindSpeedCategory = (speed: number) => {
    if (speed < 6) return { category: 'Light', color: '#22C55E', icon: '🍃' };
    if (speed < 12) return { category: 'Moderate', color: '#F59E0B', icon: '💨' };
    if (speed < 20) return { category: 'Fresh', color: '#EF4444', icon: '🌊' };
    return { category: 'Strong', color: '#7C2D12', icon: '⚡' };
  };

  const optimizeCourseForWeather = () => {
    if (!course || !weather) return;

    // This is a simplified course optimization based on wind direction
    const windDir = weather.windDirection;
    const optimizedMarks = course.marks.map(mark => {
      if (mark.type === 'windward') {
        // Position windward mark upwind
        const windwardAngle = (windDir + 180) % 360; // Opposite to wind
        const radians = (windwardAngle * Math.PI) / 180;

        // Adjust position slightly upwind (this is simplified)
        return {
          ...mark,
          coordinates: [
            mark.coordinates[0] + Math.sin(radians) * 0.002,
            mark.coordinates[1] + Math.cos(radians) * 0.002
          ] as [number, number]
        };
      }
      return mark;
    });

    const optimizedCourse = {
      ...course,
      marks: optimizedMarks,
      weather
    };

    onWeatherUpdate(weather);
  };

  if (!course) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <ThemedText type="title" style={styles.messageTitle}>🌊 Weather Integration</ThemedText>
          <ThemedText style={styles.messageSubtitle}>
            Create a course first to load weather conditions
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">🌊 Weather Integration</ThemedText>
        <ThemedText type="subtitle">Real-time conditions for course optimization</ThemedText>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <ThemedText style={styles.loadingText}>Fetching weather data...</ThemedText>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>❌ {error}</ThemedText>
          <Button onPress={fetchWeatherData} style={styles.retryButton}>
            <ThemedText style={{ color: '#fff' }}>Retry</ThemedText>
          </Button>
        </View>
      )}

      {/* Weather Data */}
      {weather && !loading && (
        <View style={styles.weatherContainer}>
          {/* Current Conditions */}
          <View style={styles.currentConditions}>
            <ThemedText style={styles.sectionTitle}>⚡ Current Conditions</ThemedText>

            <View style={styles.conditionRow}>
              <View style={styles.windInfo}>
                <View style={styles.windSpeed}>
                  {getWindSpeedCategory(weather.windSpeed).icon && (
                    <ThemedText style={styles.windIcon}>
                      {getWindSpeedCategory(weather.windSpeed).icon}
                    </ThemedText>
                  )}
                  <ThemedText style={styles.windSpeedValue}>
                    {Math.round(weather.windSpeed)} kts
                  </ThemedText>
                </View>
                <ThemedText style={styles.windDirection}>
                  {getWindDirectionText(weather.windDirection)} ({Math.round(weather.windDirection)}°)
                </ThemedText>
                <View style={[
                  styles.windCategory,
                  { backgroundColor: getWindSpeedCategory(weather.windSpeed).color }
                ]}>
                  <ThemedText style={styles.windCategoryText}>
                    {getWindSpeedCategory(weather.windSpeed).category}
                  </ThemedText>
                </View>
              </View>
            </View>

            {weather.current && (
              <View style={styles.conditionRow}>
                <ThemedText style={styles.conditionLabel}>🌊 Current:</ThemedText>
                <ThemedText style={styles.conditionValue}>
                  {Math.round(weather.current.speed * 10) / 10} kts {getWindDirectionText(weather.current.direction)}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Forecast */}
          {weather.forecast && (
            <View style={styles.forecastContainer}>
              <ThemedText style={styles.sectionTitle}>📊 Hourly Forecast</ThemedText>
              <View style={styles.forecastRow}>
                {weather.forecast.hourly.slice(0, 5).map((hour: any, index: number) => (
                  <View key={index} style={styles.forecastItem}>
                    <ThemedText style={styles.forecastTime}>{hour.time}</ThemedText>
                    <ThemedText style={styles.forecastWind}>
                      {hour.windSpeed}kt
                    </ThemedText>
                    <ThemedText style={styles.forecastDir}>
                      {getWindDirectionText(hour.windDir)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Course Optimization */}
          <View style={styles.optimizationContainer}>
            <ThemedText style={styles.sectionTitle}>🎯 Course Optimization</ThemedText>
            <ThemedText style={styles.optimizationDescription}>
              Optimize course layout based on current wind and weather conditions
            </ThemedText>

            <View style={styles.optimizationButtons}>
              <Button
                variant="outline"
                onPress={fetchWeatherData}
                style={styles.refreshButton}
              >
                <ThemedText style={{ color: '#0066CC' }}>🔄 Refresh Weather</ThemedText>
              </Button>

              <Button
                onPress={optimizeCourseForWeather}
                style={styles.optimizeButton}
              >
                <ThemedText style={{ color: '#fff' }}>⚡ Optimize Course</ThemedText>
              </Button>
            </View>
          </View>

          {/* Weather Alerts */}
          <View style={styles.alertsContainer}>
            <ThemedText style={styles.sectionTitle}>⚠️ Weather Alerts</ThemedText>

            {weather.windSpeed > 20 && (
              <View style={[styles.alert, styles.alertWarning]}>
                <ThemedText style={styles.alertText}>
                  Strong wind conditions ({weather.windSpeed} kts). Consider shorter course or postponement.
                </ThemedText>
              </View>
            )}

            {weather.windSpeed < 6 && (
              <View style={[styles.alert, styles.alertInfo]}>
                <ThemedText style={styles.alertText}>
                  Light wind conditions ({weather.windSpeed} kts). Consider inner course or different start time.
                </ThemedText>
              </View>
            )}

            {!weather.windSpeed || (weather.windSpeed >= 6 && weather.windSpeed <= 20) && (
              <View style={[styles.alert, styles.alertSuccess]}>
                <ThemedText style={styles.alertText}>
                  ✅ Ideal sailing conditions ({weather.windSpeed} kts {getWindDirectionText(weather.windDirection)})
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  messageTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  messageSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
  },
  weatherContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  currentConditions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  conditionRow: {
    marginBottom: 8,
  },
  windInfo: {
    alignItems: 'center',
    gap: 8,
  },
  windSpeed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  windIcon: {
    fontSize: 24,
  },
  windSpeedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  windDirection: {
    fontSize: 16,
    color: '#6B7280',
  },
  windCategory: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  windCategoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  conditionValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  forecastContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  forecastTime: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  forecastWind: {
    fontSize: 12,
    color: '#0066CC',
  },
  forecastDir: {
    fontSize: 10,
    color: '#6B7280',
  },
  optimizationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  optimizationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  optimizationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    flex: 1,
  },
  optimizeButton: {
    flex: 1,
    backgroundColor: '#0066CC',
  },
  alertsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  alert: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  alertSuccess: {
    backgroundColor: '#ECFDF5',
    borderLeftColor: '#22C55E',
  },
  alertWarning: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: '#F59E0B',
  },
  alertInfo: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
  },
  alertText: {
    fontSize: 14,
    color: '#374151',
  },
});