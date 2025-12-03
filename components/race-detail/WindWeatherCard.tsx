/**
 * Wind & Weather Card - Real-Time and Forecast Weather Data
 * Shows current conditions and race-time forecast
 */

import { useRaceWeather } from '@/hooks/useRaceWeather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StrategyCard } from './StrategyCard';

interface WeatherData {
  current: {
    windSpeed: number; // knots
    windDirection: number; // degrees
    gusts?: number; // knots
    temperature: number; // celsius
    pressure: number; // mb
  };
  forecast: {
    time: string;
    windSpeed: number;
    windDirection: number;
    gusts?: number;
  }[];
  raceTimeConditions?: {
    windSpeed: number;
    windDirection: number;
    gusts?: number;
    shifts: string[];
  };
  lastUpdated: Date;
}

interface InitialWeather {
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack' | 'high' | 'low';
    height: number;
    direction?: string;
  };
  fetchedAt?: string;
  provider?: string;
}

interface WindTimelinePoint {
  time: Date;
  label: string;
  windSpeed: number;
  windDirection: number;
  gusts?: number;
  isRaceEvent?: boolean;
  eventType?: 'warning' | 'start' | 'finish';
}

interface WaveTimelinePoint {
  time: Date;
  label: string;
  waveHeight: number;
  wavePeriod?: number;
  waveDirection?: number;
  seaState: string;
  isRaceEvent?: boolean;
  eventType?: 'warning' | 'start' | 'finish';
}

interface WindWeatherCardProps {
  raceId: string;
  raceTime?: string;
  venueCoordinates?: {
    lat: number;
    lng: number;
  };
  venue?: {
    id: string;
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    region: string;
    country: string;
  };
  initialWeather?: InitialWeather;
  /** Warning signal time (e.g., "10:00:00") */
  warningSignalTime?: string;
  /** Expected race duration in minutes */
  expectedDurationMinutes?: number;
}

export function WindWeatherCard({
  raceId,
  raceTime,
  venueCoordinates,
  venue,
  initialWeather,
  warningSignalTime,
  expectedDurationMinutes = 90,
}: WindWeatherCardProps) {
  const [useMockData, setUseMockData] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const [showLiveConditions, setShowLiveConditions] = useState(false);

  // Try to fetch REAL weather data first
  const { weather: realWeather, loading, error: weatherError, refetch: loadWeather } = useRaceWeather(
    venue || (venueCoordinates ? {
      id: `venue-${venueCoordinates.lat}-${venueCoordinates.lng}`,
      name: 'Race Venue',
      coordinates: {
        latitude: venueCoordinates.lat,
        longitude: venueCoordinates.lng
      },
      region: 'unknown',
      country: 'unknown'
    } as any : null),
    raceTime
  );

  // Fallback to mock data if real data fails
  const [mockWeather, setMockWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metadataWeather = useMemo<WeatherData | null>(() => {
    if (!initialWeather?.wind) {
      return null;
    }

    const averageWind = Math.round(
      (initialWeather.wind.speedMin + initialWeather.wind.speedMax) / 2
    );

    const directionDegrees = cardinalToDegrees(initialWeather.wind.direction);

    return {
      current: {
        windSpeed: averageWind,
        windDirection: directionDegrees,
        gusts: initialWeather.wind.speedMax,
        temperature: 24,
        pressure: 1013,
      },
      forecast: [],
      raceTimeConditions: {
        windSpeed: averageWind,
        windDirection: directionDegrees,
        gusts: initialWeather.wind.speedMax,
        shifts: [],
      },
      lastUpdated: initialWeather.fetchedAt
        ? new Date(initialWeather.fetchedAt)
        : new Date(),
    };
  }, [
    initialWeather?.wind?.direction,
    initialWeather?.wind?.speedMin,
    initialWeather?.wind?.speedMax,
    initialWeather?.fetchedAt,
  ]);

  const loadMockWeather = useCallback(() => {
    setUseMockData(true);
    const placeholderWeather: WeatherData = {
      current: {
        windSpeed: 12,
        windDirection: 225,
        gusts: 16,
        temperature: 24,
        pressure: 1013,
      },
      forecast: [
        { time: '09:00', windSpeed: 10, windDirection: 220, gusts: 14 },
        { time: '10:00', windSpeed: 12, windDirection: 225, gusts: 16 },
        { time: '11:00', windSpeed: 14, windDirection: 230, gusts: 18 },
        { time: '12:00', windSpeed: 15, windDirection: 235, gusts: 20 },
        { time: '13:00', windSpeed: 16, windDirection: 240, gusts: 22 },
      ],
      raceTimeConditions: {
        windSpeed: 14,
        windDirection: 230,
        gusts: 18,
        shifts: ['Right shift expected mid-race', 'Gusts increasing after 11:00'],
      },
      lastUpdated: new Date(),
    };
    setMockWeather(placeholderWeather);
    setHasAutoLoaded(true);
  }, []);

  const hasValidCoordinates =
    (venueCoordinates && (venueCoordinates.lat !== 0 || venueCoordinates.lng !== 0)) ||
    (venue?.coordinates &&
      (venue.coordinates.latitude !== 0 || venue.coordinates.longitude !== 0));

  const handleRefresh = useCallback(() => {
    setHasAutoLoaded(false);
    setUseMockData(false);
    setMockWeather(null);
    setError(null);
    loadWeather();
  }, [loadWeather]);

  const handleShowLiveConditions = useCallback(() => {
    setShowLiveConditions(true);
    handleRefresh();
  }, [handleRefresh]);

  const handleShowRecordedSnapshot = useCallback(() => {
    setShowLiveConditions(false);
    setUseMockData(false);
    setMockWeather(null);
    setError(null);
  }, []);

  useEffect(() => {
    setHasAutoLoaded(false);
    setUseMockData(false);
    setMockWeather(null);
    setError(null);
  }, [raceId, raceTime, venue?.id, venueCoordinates?.lat, venueCoordinates?.lng]);

  const isPastRace = useMemo(() => {
    if (!raceTime) return false;
    return new Date(raceTime).getTime() < Date.now();
  }, [raceTime]);

  useEffect(() => {
    setShowLiveConditions(false);
  }, [raceId, raceTime]);

  useEffect(() => {
    if (realWeather) {
      setUseMockData(false);
      setHasAutoLoaded(true);
      setError(null);
    }
  }, [realWeather]);

  useEffect(() => {
    if (metadataWeather) {
      setUseMockData(false);
      setHasAutoLoaded(true);
      setError(null);
    }
  }, [metadataWeather]);

  useEffect(() => {
    if (hasAutoLoaded || useMockData || metadataWeather) return;

    if (weatherError) {
      setError(weatherError.message || 'Unable to fetch live weather');
      loadMockWeather();
      return;
    }

    if (!loading && !realWeather) {
      const timeout = setTimeout(() => {
        if (!hasAutoLoaded && !realWeather && !useMockData) {
          if (!hasValidCoordinates) {
            setError(null);
          }
          loadMockWeather();
        }
      }, hasValidCoordinates ? 800 : 120);

      return () => clearTimeout(timeout);
    }
  }, [
    loading,
    realWeather,
    weatherError,
    hasAutoLoaded,
    useMockData,
    loadMockWeather,
    hasValidCoordinates,
    venueCoordinates?.lat,
    venueCoordinates?.lng,
    venue?.coordinates?.latitude,
    venue?.coordinates?.longitude,
    metadataWeather
  ]);

  const liveWeather: WeatherData | null = useMockData
    ? mockWeather
    : realWeather
      ? {
        current: {
          windSpeed: Math.round((realWeather.wind.speedMin + realWeather.wind.speedMax) / 2),
          windDirection: cardinalToDegrees(realWeather.wind.direction),
          gusts: realWeather.wind.speedMax,
          temperature: 24, // Not available from API yet
          pressure: 1013, // Not available from API yet
        },
        forecast: [],
        raceTimeConditions: {
          windSpeed: Math.round((realWeather.wind.speedMin + realWeather.wind.speedMax) / 2),
          windDirection: cardinalToDegrees(realWeather.wind.direction),
          gusts: realWeather.wind.speedMax,
          shifts: [],
        },
        lastUpdated: new Date(),
      }
      : null;

  const recordedWeather = metadataWeather;

  const showingRecordedSnapshot = isPastRace && !showLiveConditions && !!recordedWeather;

  const weather: WeatherData | null =
    showingRecordedSnapshot ? recordedWeather ?? liveWeather : liveWeather ?? recordedWeather;

  // Calculate Wind Timeline for race duration
  const windTimeline = useMemo((): WindTimelinePoint[] => {
    if (!raceTime || !weather) return [];
    
    const raceDate = new Date(raceTime);
    if (Number.isNaN(raceDate.getTime())) return [];
    
    // Parse warning signal time if provided
    let warningTime: Date;
    if (warningSignalTime) {
      const [hours, minutes] = warningSignalTime.split(':').map(Number);
      warningTime = new Date(raceDate);
      warningTime.setHours(hours, minutes, 0, 0);
    } else {
      warningTime = raceDate;
    }
    
    const startTime = new Date(warningTime.getTime() + 5 * 60 * 1000);
    const finishTime = new Date(startTime.getTime() + expectedDurationMinutes * 60 * 1000);
    const timelineStart = new Date(warningTime.getTime() - 30 * 60 * 1000);
    
    const points: WindTimelinePoint[] = [];
    const baseWind = weather.current.windSpeed;
    const baseDirection = weather.current.windDirection;
    const baseGusts = weather.current.gusts;
    
    // Get forecast data if available for interpolation
    const forecasts = realWeather?.raw?.forecast || weather.forecast || [];
    
    // Helper to estimate wind at a specific time
    const estimateWindAtTime = (time: Date): { speed: number; direction: number; gusts?: number } => {
      // Find closest forecast points
      if (forecasts.length > 0) {
        const timeMs = time.getTime();
        let before = forecasts[0];
        let after = forecasts[forecasts.length - 1];
        
        for (let i = 0; i < forecasts.length - 1; i++) {
          const forecastTime = forecasts[i].timestamp || new Date(forecasts[i].time);
          const nextTime = forecasts[i + 1].timestamp || new Date(forecasts[i + 1].time);
          if (forecastTime.getTime() <= timeMs && nextTime.getTime() >= timeMs) {
            before = forecasts[i];
            after = forecasts[i + 1];
            break;
          }
        }
        
        // Interpolate between forecast points
        const beforeTime = (before.timestamp || new Date(before.time)).getTime();
        const afterTime = (after.timestamp || new Date(after.time)).getTime();
        const progress = afterTime !== beforeTime 
          ? (timeMs - beforeTime) / (afterTime - beforeTime)
          : 0;
        
        return {
          speed: Math.round(before.windSpeed + (after.windSpeed - before.windSpeed) * progress),
          direction: Math.round(before.windDirection + (after.windDirection - before.windDirection) * progress),
          gusts: before.gusts || after.gusts 
            ? Math.round((before.gusts || before.windSpeed * 1.2) + 
                ((after.gusts || after.windSpeed * 1.2) - (before.gusts || before.windSpeed * 1.2)) * progress)
            : undefined
        };
      }
      
      // Fallback: add some natural variation
      const hourOfDay = time.getHours();
      const thermalFactor = hourOfDay >= 10 && hourOfDay <= 16 ? 1.15 : 1.0; // Thermal boost midday
      const variation = (Math.sin(time.getTime() / (30 * 60 * 1000)) * 0.1); // Small oscillation
      
      return {
        speed: Math.round(baseWind * thermalFactor * (1 + variation)),
        direction: Math.round(baseDirection + (variation * 15)), // Small direction shifts
        gusts: baseGusts ? Math.round(baseGusts * thermalFactor * (1 + variation * 0.5)) : undefined
      };
    };
    
    // Add timeline points
    const addPoint = (time: Date, label: string, isRaceEvent?: boolean, eventType?: 'warning' | 'start' | 'finish') => {
      const wind = estimateWindAtTime(time);
      points.push({
        time,
        label,
        windSpeed: wind.speed,
        windDirection: wind.direction,
        gusts: wind.gusts,
        isRaceEvent,
        eventType
      });
    };
    
    addPoint(timelineStart, '30 min before');
    addPoint(warningTime, 'Warning Signal', true, 'warning');
    addPoint(startTime, 'Race Start', true, 'start');
    addPoint(new Date(startTime.getTime() + (expectedDurationMinutes / 2) * 60 * 1000), 'Mid-race');
    addPoint(finishTime, 'Expected Finish', true, 'finish');
    
    return points;
  }, [raceTime, warningSignalTime, expectedDurationMinutes, weather, realWeather]);

  // Calculate Wave Timeline for race duration
  const waveTimeline = useMemo((): WaveTimelinePoint[] => {
    if (!raceTime) return [];
    
    const raceDate = new Date(raceTime);
    if (Number.isNaN(raceDate.getTime())) return [];
    
    // Parse warning signal time if provided
    let warningTime: Date;
    if (warningSignalTime) {
      const [hours, minutes] = warningSignalTime.split(':').map(Number);
      warningTime = new Date(raceDate);
      warningTime.setHours(hours, minutes, 0, 0);
    } else {
      warningTime = raceDate;
    }
    
    const startTime = new Date(warningTime.getTime() + 5 * 60 * 1000);
    const finishTime = new Date(startTime.getTime() + expectedDurationMinutes * 60 * 1000);
    const timelineStart = new Date(warningTime.getTime() - 30 * 60 * 1000);
    
    const points: WaveTimelinePoint[] = [];
    
    // Get wave data from raw weather if available
    const forecasts = realWeather?.raw?.forecast || [];
    const marineConditions = realWeather?.raw?.marineConditions;
    
    // Helper to get sea state description
    const getSeaStateDescription = (height: number): string => {
      if (height < 0.1) return 'Glassy';
      if (height < 0.3) return 'Calm';
      if (height < 0.5) return 'Smooth';
      if (height < 1.0) return 'Slight';
      if (height < 2.0) return 'Moderate';
      if (height < 3.0) return 'Rough';
      if (height < 4.0) return 'Very Rough';
      return 'High';
    };
    
    // Helper to estimate waves at a specific time
    const estimateWavesAtTime = (time: Date): { height: number; period?: number; direction?: number } => {
      // Find closest forecast points with wave data
      if (forecasts.length > 0) {
        const timeMs = time.getTime();
        let before = forecasts[0];
        let after = forecasts[forecasts.length - 1];
        
        for (let i = 0; i < forecasts.length - 1; i++) {
          const forecastTime = forecasts[i].timestamp || new Date(forecasts[i].time);
          const nextTime = forecasts[i + 1].timestamp || new Date(forecasts[i + 1].time);
          if (forecastTime.getTime() <= timeMs && nextTime.getTime() >= timeMs) {
            before = forecasts[i];
            after = forecasts[i + 1];
            break;
          }
        }
        
        const beforeTime = (before.timestamp || new Date(before.time)).getTime();
        const afterTime = (after.timestamp || new Date(after.time)).getTime();
        const progress = afterTime !== beforeTime 
          ? (timeMs - beforeTime) / (afterTime - beforeTime)
          : 0;
        
        const beforeHeight = before.waveHeight ?? 0.5;
        const afterHeight = after.waveHeight ?? 0.5;
        
        return {
          height: Math.round((beforeHeight + (afterHeight - beforeHeight) * progress) * 10) / 10,
          period: before.wavePeriod || after.wavePeriod,
          direction: before.waveDirection || after.waveDirection
        };
      }
      
      // Fallback: estimate from marine conditions or wind
      const baseHeight = marineConditions?.swellHeight ?? 0.5;
      const windSpeed = weather?.current?.windSpeed ?? 10;
      const windWaveHeight = windSpeed / 20; // Rough estimate: 1m waves per 20kts wind
      
      return {
        height: Math.round((baseHeight + windWaveHeight * 0.3) * 10) / 10,
        period: marineConditions?.swellPeriod ?? 5,
        direction: marineConditions?.swellDirection
      };
    };
    
    // Add timeline points
    const addPoint = (time: Date, label: string, isRaceEvent?: boolean, eventType?: 'warning' | 'start' | 'finish') => {
      const waves = estimateWavesAtTime(time);
      points.push({
        time,
        label,
        waveHeight: waves.height,
        wavePeriod: waves.period,
        waveDirection: waves.direction,
        seaState: getSeaStateDescription(waves.height),
        isRaceEvent,
        eventType
      });
    };
    
    addPoint(timelineStart, '30 min before');
    addPoint(warningTime, 'Warning Signal', true, 'warning');
    addPoint(startTime, 'Race Start', true, 'start');
    addPoint(new Date(startTime.getTime() + (expectedDurationMinutes / 2) * 60 * 1000), 'Mid-race');
    addPoint(finishTime, 'Expected Finish', true, 'finish');
    
    return points;
  }, [raceTime, warningSignalTime, expectedDurationMinutes, weather, realWeather]);

  const shouldShowLiveLoading = !isPastRace || showLiveConditions || !recordedWeather;

  const getCardStatus = () => {
    if (shouldShowLiveLoading && loading) return 'generating';
    if (shouldShowLiveLoading && error) return 'error';
    if (!weather) return 'not_set';
    return 'ready';
  };

  const getStatusMessage = () => {
    if (shouldShowLiveLoading && loading) return 'Loading forecast...';
    if (shouldShowLiveLoading && error) return error;
    if (!weather) return isPastRace ? 'No recorded weather saved' : 'Tap to load';
    if (showingRecordedSnapshot && recordedWeather) {
      return `Recorded ${formatRecordedTimestamp(recordedWeather.lastUpdated, raceTime)}`;
    }
    return `Updated ${getTimeAgo(weather.lastUpdated)}`;
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getWindDirectionLabel = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getBeaufortScale = (knots: number) => {
    if (knots < 1) return { force: 0, description: 'Calm' };
    if (knots < 4) return { force: 1, description: 'Light air' };
    if (knots < 7) return { force: 2, description: 'Light breeze' };
    if (knots < 11) return { force: 3, description: 'Gentle breeze' };
    if (knots < 16) return { force: 4, description: 'Moderate breeze' };
    if (knots < 22) return { force: 5, description: 'Fresh breeze' };
    if (knots < 28) return { force: 6, description: 'Strong breeze' };
    return { force: 7, description: 'Near gale' };
  };

  const renderWeatherContent = () => {
    if (!weather) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="weather-windy" size={48} color="#E2E8F0" />
          <Text style={styles.emptyText}>
            View current and forecasted wind conditions for race time.
          </Text>
          <TouchableOpacity
            style={styles.loadButton}
            onPress={loadMockWeather}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-download" size={20} color="#fff" />
                <Text style={styles.loadButtonText}>Load Weather</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    const beaufort = getBeaufortScale(weather.current.windSpeed);
    const recordedTimestampLabel = formatRecordedTimestamp(recordedWeather?.lastUpdated, raceTime);
    const dataSourceMode = showingRecordedSnapshot
      ? 'recorded'
      : useMockData
        ? 'mock'
        : realWeather
          ? 'live'
          : 'saved';

    const badgeIcon =
      dataSourceMode === 'recorded'
        ? 'flag-checkered'
        : dataSourceMode === 'mock'
          ? 'flask-outline'
          : dataSourceMode === 'live'
            ? 'wifi'
            : 'content-save';

    const badgeLabel =
      dataSourceMode === 'recorded'
        ? 'RECORDED SNAPSHOT'
        : dataSourceMode === 'mock'
          ? 'MOCK DATA'
          : dataSourceMode === 'live'
            ? 'LIVE DATA'
            : 'SAVED FORECAST';

    return (
      <View style={styles.weatherContent}>
        {/* Data Source Indicator Badge */}
        <View style={[
          styles.dataSourceBadge,
          dataSourceMode === 'recorded'
            ? styles.dataSourceBadgeRecorded
            : dataSourceMode === 'mock'
              ? styles.dataSourceBadgeMock
              : dataSourceMode === 'live'
                ? styles.dataSourceBadgeLive
                : styles.dataSourceBadgeSaved
        ]}>
          <MaterialCommunityIcons
            name={badgeIcon}
            size={14}
            color={
              dataSourceMode === 'recorded'
                ? '#0F172A'
                : dataSourceMode === 'mock'
                  ? '#D97706'
                  : dataSourceMode === 'live'
                    ? '#10B981'
                    : '#6366F1'
            }
          />
          <Text style={[
            styles.dataSourceText,
            dataSourceMode === 'recorded'
              ? styles.dataSourceTextRecorded
              : dataSourceMode === 'mock'
                ? styles.dataSourceTextMock
                : dataSourceMode === 'live'
                  ? styles.dataSourceTextLive
                  : styles.dataSourceTextSaved
          ]}>
            {badgeLabel}
          </Text>
        </View>
        {useMockData && !showingRecordedSnapshot && (
          <Text style={styles.mockDataNotice}>
            Using mock data — add venue coordinates to fetch live conditions.
          </Text>
        )}
        {showingRecordedSnapshot && (
          <View style={styles.recordedBanner}>
            <View style={styles.recordedBannerIcon}>
              <MaterialCommunityIcons name="history" size={18} color="#0F172A" />
            </View>
            <View style={styles.recordedBannerCopy}>
              <Text style={styles.recordedBannerTitle}>Race completed</Text>
              <Text style={styles.recordedBannerText}>
                Showing weather captured {recordedTimestampLabel}.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.recordedBannerAction}
              onPress={handleShowLiveConditions}
            >
              <Text style={styles.recordedBannerActionText}>View live</Text>
            </TouchableOpacity>
          </View>
        )}
        {isPastRace && showLiveConditions && recordedWeather && (
          <View style={styles.recordedBanner}>
            <View style={styles.recordedBannerIcon}>
              <MaterialCommunityIcons name="radar" size={18} color="#0F172A" />
            </View>
            <View style={styles.recordedBannerCopy}>
              <Text style={styles.recordedBannerTitle}>Live preview</Text>
              <Text style={styles.recordedBannerText}>
                Comparing against snapshot from {recordedTimestampLabel}.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.recordedBannerAction}
              onPress={handleShowRecordedSnapshot}
            >
              <Text style={styles.recordedBannerActionText}>View snapshot</Text>
            </TouchableOpacity>
          </View>
        )}
        {dataSourceMode === 'recorded' && initialWeather?.provider && (
          <Text style={styles.recordedDataNotice}>
            Snapshot from {initialWeather.provider}{initialWeather.fetchedAt ? ` • Captured ${recordedTimestampLabel}` : ''}.
          </Text>
        )}
        {dataSourceMode === 'saved' && initialWeather?.provider && !showingRecordedSnapshot && (
          <Text style={styles.savedDataNotice}>
            Latest forecast from {initialWeather.provider}{initialWeather.fetchedAt ? ` • Fetched ${getTimeAgo(new Date(initialWeather.fetchedAt))}` : ''}.
          </Text>
        )}
        {/* Current Conditions */}
        <View style={styles.currentSection}>
          <View style={styles.currentHeader}>
            <Text style={styles.sectionTitle}>
              {showingRecordedSnapshot ? 'Recorded at Start' : 'Current Conditions'}
            </Text>
            {!showingRecordedSnapshot && (
              <TouchableOpacity onPress={handleRefresh} disabled={loading}>
                <MaterialCommunityIcons name="refresh" size={20} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.currentDisplay}>
            {/* Wind Speed */}
            <View style={styles.windSpeedContainer}>
              <Text style={styles.windSpeedValue}>{weather.current.windSpeed}</Text>
              <Text style={styles.windSpeedUnit}>kts</Text>
              <MaterialCommunityIcons
                name="weather-windy"
                size={32}
                color="#3B82F6"
                style={styles.windIcon}
              />
            </View>

            {/* Wind Direction */}
            <View style={styles.windDirectionContainer}>
              <View style={styles.compass}>
                <MaterialCommunityIcons
                  name="navigation"
                  size={24}
                  color="#3B82F6"
                  style={{
                    transform: [{ rotate: `${weather.current.windDirection}deg` }]
                  }}
                />
              </View>
              <Text style={styles.windDirectionText}>
                {getWindDirectionLabel(weather.current.windDirection)} ({weather.current.windDirection}°)
              </Text>
            </View>

            {/* Gusts */}
            {weather.current.gusts && (
              <View style={styles.gustsContainer}>
                <MaterialCommunityIcons name="weather-windy-variant" size={20} color="#F59E0B" />
                <Text style={styles.gustsText}>Gusts to {weather.current.gusts} kts</Text>
              </View>
            )}
          </View>

          {/* Beaufort Scale */}
          <View style={styles.beaufortBadge}>
            <Text style={styles.beaufortText}>
              Force {beaufort.force} - {beaufort.description}
            </Text>
          </View>
        </View>

        {/* Race Time Forecast */}
        {weather.raceTimeConditions && raceTime && (
          <View style={styles.raceTimeSection}>
            <Text style={styles.sectionTitle}>
              {showingRecordedSnapshot ? 'Race-Time Snapshot' : 'Race Time Forecast'}
            </Text>
            <View style={styles.raceTimeForecast}>
              <View style={styles.forecastRow}>
                <MaterialCommunityIcons name="weather-windy" size={20} color="#10B981" />
                <Text style={styles.forecastValue}>
                  {weather.raceTimeConditions.windSpeed} kts
                </Text>
                <Text style={styles.forecastLabel}>
                  from {getWindDirectionLabel(weather.raceTimeConditions.windDirection)}
                </Text>
              </View>

              {weather.raceTimeConditions.gusts && (
                <View style={styles.forecastRow}>
                  <MaterialCommunityIcons name="weather-windy-variant" size={20} color="#F59E0B" />
                  <Text style={styles.forecastValue}>
                    {weather.raceTimeConditions.gusts} kts
                  </Text>
                  <Text style={styles.forecastLabel}>gusts</Text>
                </View>
              )}
            </View>

            {/* Shift Predictions */}
            {weather.raceTimeConditions.shifts.length > 0 && (
              <View style={styles.shiftsContainer}>
                <Text style={styles.shiftsTitle}>Expected Shifts</Text>
                {weather.raceTimeConditions.shifts.map((shift, index) => (
                  <View key={index} style={styles.shiftItem}>
                    <MaterialCommunityIcons name="arrow-decision" size={16} color="#64748B" />
                    <Text style={styles.shiftText}>{shift}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Wind Timeline - Wind changes throughout the race */}
        {windTimeline.length > 0 && (
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <MaterialCommunityIcons name="weather-windy" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Wind Timeline</Text>
            </View>
            <Text style={styles.timelineSubtitle}>
              Wind speed & direction from pre-race to finish
            </Text>
            
            <View style={styles.timelineContainer}>
              {windTimeline.map((point, index) => {
                const isFirst = index === 0;
                const isLast = index === windTimeline.length - 1;
                const eventColor = point.eventType === 'start' ? '#10B981' 
                  : point.eventType === 'warning' ? '#F59E0B' 
                  : point.eventType === 'finish' ? '#EF4444' 
                  : '#3B82F6';
                
                // Determine wind strength color
                const windColor = point.windSpeed < 8 ? '#10B981' // Light - green
                  : point.windSpeed < 15 ? '#3B82F6' // Moderate - blue
                  : point.windSpeed < 22 ? '#F59E0B' // Fresh - amber
                  : '#EF4444'; // Strong - red
                
                return (
                  <View key={index} style={styles.timelineRow}>
                    {/* Timeline connector */}
                    <View style={styles.timelineConnector}>
                      {!isFirst && <View style={[styles.timelineLine, { backgroundColor: '#3B82F6' }]} />}
                      <View style={[
                        styles.timelineDot,
                        point.isRaceEvent && styles.timelineDotEvent,
                        { backgroundColor: eventColor, borderColor: eventColor }
                      ]}>
                        {point.isRaceEvent && (
                          <MaterialCommunityIcons 
                            name={point.eventType === 'start' ? 'flag' : point.eventType === 'warning' ? 'alert' : 'flag-checkered'} 
                            size={10} 
                            color="#fff" 
                          />
                        )}
                      </View>
                      {!isLast && <View style={[styles.timelineLine, { backgroundColor: '#3B82F6' }]} />}
                    </View>
                    
                    {/* Time */}
                    <View style={styles.timelineTime}>
                      <Text style={[styles.timelineTimeText, point.isRaceEvent && styles.timelineTimeTextBold]}>
                        {point.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    
                    {/* Content */}
                    <View style={[
                      styles.timelineContent,
                      point.isRaceEvent && styles.timelineContentEvent,
                      { borderLeftColor: eventColor }
                    ]}>
                      <Text style={[styles.timelineLabel, point.isRaceEvent && styles.timelineLabelEvent]}>
                        {point.label}
                      </Text>
                      <View style={styles.timelineDetails}>
                        {/* Wind Speed */}
                        <View style={[styles.timelineMetric, { backgroundColor: windColor + '20' }]}>
                          <MaterialCommunityIcons name="weather-windy" size={12} color={windColor} />
                          <Text style={[styles.timelineMetricText, { color: windColor }]}>
                            {point.windSpeed} kts
                          </Text>
                        </View>
                        {/* Wind Direction */}
                        <View style={styles.timelineMetric}>
                          <MaterialCommunityIcons 
                            name="navigation" 
                            size={12} 
                            color="#64748B"
                            style={{ transform: [{ rotate: `${point.windDirection}deg` }] }}
                          />
                          <Text style={styles.timelineMetricText}>
                            {getWindDirectionLabel(point.windDirection)}
                          </Text>
                        </View>
                        {/* Gusts */}
                        {point.gusts && point.gusts > point.windSpeed && (
                          <View style={[styles.timelineMetric, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="weather-windy-variant" size={12} color="#F59E0B" />
                            <Text style={[styles.timelineMetricText, { color: '#D97706' }]}>
                              G{point.gusts}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Wave Timeline - Sea state throughout the race */}
        {waveTimeline.length > 0 && (
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <MaterialCommunityIcons name="waves" size={20} color="#0EA5E9" />
              <Text style={styles.sectionTitle}>Wave Timeline</Text>
            </View>
            <Text style={styles.timelineSubtitle}>
              Sea state & wave height from pre-race to finish
            </Text>
            
            <View style={styles.timelineContainer}>
              {waveTimeline.map((point, index) => {
                const isFirst = index === 0;
                const isLast = index === waveTimeline.length - 1;
                const eventColor = point.eventType === 'start' ? '#10B981' 
                  : point.eventType === 'warning' ? '#F59E0B' 
                  : point.eventType === 'finish' ? '#EF4444' 
                  : '#0EA5E9';
                
                // Determine sea state color
                const waveColor = point.waveHeight < 0.3 ? '#10B981' // Calm - green
                  : point.waveHeight < 1.0 ? '#0EA5E9' // Slight - cyan
                  : point.waveHeight < 2.0 ? '#F59E0B' // Moderate - amber
                  : '#EF4444'; // Rough - red
                
                return (
                  <View key={index} style={styles.timelineRow}>
                    {/* Timeline connector */}
                    <View style={styles.timelineConnector}>
                      {!isFirst && <View style={[styles.timelineLine, { backgroundColor: '#0EA5E9' }]} />}
                      <View style={[
                        styles.timelineDot,
                        point.isRaceEvent && styles.timelineDotEvent,
                        { backgroundColor: eventColor, borderColor: eventColor }
                      ]}>
                        {point.isRaceEvent && (
                          <MaterialCommunityIcons 
                            name={point.eventType === 'start' ? 'flag' : point.eventType === 'warning' ? 'alert' : 'flag-checkered'} 
                            size={10} 
                            color="#fff" 
                          />
                        )}
                      </View>
                      {!isLast && <View style={[styles.timelineLine, { backgroundColor: '#0EA5E9' }]} />}
                    </View>
                    
                    {/* Time */}
                    <View style={styles.timelineTime}>
                      <Text style={[styles.timelineTimeText, point.isRaceEvent && styles.timelineTimeTextBold]}>
                        {point.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    
                    {/* Content */}
                    <View style={[
                      styles.timelineContent,
                      point.isRaceEvent && styles.timelineContentEvent,
                      { borderLeftColor: eventColor }
                    ]}>
                      <Text style={[styles.timelineLabel, point.isRaceEvent && styles.timelineLabelEvent]}>
                        {point.label}
                      </Text>
                      <View style={styles.timelineDetails}>
                        {/* Sea State */}
                        <View style={[styles.timelineMetric, { backgroundColor: waveColor + '20' }]}>
                          <MaterialCommunityIcons name="waves" size={12} color={waveColor} />
                          <Text style={[styles.timelineMetricText, { color: waveColor }]}>
                            {point.seaState}
                          </Text>
                        </View>
                        {/* Wave Height */}
                        <View style={styles.timelineMetric}>
                          <MaterialCommunityIcons name="arrow-expand-vertical" size={12} color="#64748B" />
                          <Text style={styles.timelineMetricText}>
                            {point.waveHeight}m
                          </Text>
                        </View>
                        {/* Wave Period */}
                        {point.wavePeriod && (
                          <View style={styles.timelineMetric}>
                            <MaterialCommunityIcons name="timer-outline" size={12} color="#64748B" />
                            <Text style={styles.timelineMetricText}>
                              {Math.round(point.wavePeriod)}s
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Hourly Forecast */}
        {weather.forecast.length > 0 && !showingRecordedSnapshot && (
          <View style={styles.forecastSection}>
            <Text style={styles.sectionTitle}>Hourly Forecast</Text>
            <View style={styles.forecastGrid}>
              {weather.forecast.map((hour, index) => (
                <View key={index} style={styles.forecastItem}>
                  <Text style={styles.forecastTime}>{hour.time}</Text>
                  <MaterialCommunityIcons
                    name="navigation"
                    size={16}
                    color="#64748B"
                    style={{
                      transform: [{ rotate: `${hour.windDirection}deg` }]
                    }}
                  />
                  <Text style={styles.forecastWind}>{hour.windSpeed} kts</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <StrategyCard
      icon="weather-windy"
      title="Wind & Weather"
      status={getCardStatus()}
      statusMessage={getStatusMessage()}
      expandable={false}
    >
      {renderWeatherContent()}
    </StrategyCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  weatherContent: {
    gap: 20,
  },
  currentSection: {
    gap: 12,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  currentDisplay: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  windSpeedContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  windSpeedValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0F172A',
  },
  windSpeedUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
  },
  windIcon: {
    marginLeft: 'auto',
  },
  windDirectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  windDirectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  gustsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gustsText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  beaufortBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  beaufortText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  raceTimeSection: {
    gap: 12,
  },
  raceTimeForecast: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forecastValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  forecastLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  shiftsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  shiftsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftText: {
    fontSize: 13,
    color: '#92400E',
  },
  forecastSection: {
    gap: 12,
  },
  forecastGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  forecastItem: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
  },
  forecastTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  forecastWind: {
    fontSize: 13,
    color: '#64748B',
  },
  dataSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dataSourceBadgeLive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  dataSourceBadgeSaved: {
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  dataSourceBadgeMock: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  dataSourceBadgeRecorded: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5F5',
  },
  dataSourceText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dataSourceTextLive: {
    color: '#059669',
  },
  dataSourceTextSaved: {
    color: '#4F46E5',
  },
  dataSourceTextMock: {
    color: '#D97706',
  },
  dataSourceTextRecorded: {
    color: '#0F172A',
  },
  mockDataNotice: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 16,
  },
  savedDataNotice: {
    fontSize: 12,
    color: '#4338CA',
    marginBottom: 16,
  },
  recordedDataNotice: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 16,
  },
  recordedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  recordedBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordedBannerCopy: {
    flex: 1,
    gap: 2,
  },
  recordedBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordedBannerText: {
    fontSize: 12,
    color: '#1E293B',
  },
  recordedBannerAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1D4ED8',
  },
  recordedBannerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Timeline styles
  timelineSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  timelineContainer: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 56,
  },
  timelineConnector: {
    width: 24,
    alignItems: 'center',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#CBD5E1',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  timelineDotEvent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTime: {
    width: 52,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  timelineTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  timelineTimeTextBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
    gap: 4,
  },
  timelineContentEvent: {
    backgroundColor: '#F0FDF4',
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  timelineLabelEvent: {
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timelineMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineMetricText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
});

function cardinalToDegrees(cardinal: string): number {
  const directions: Record<string, number> = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 157.5,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5,
  };
  const key = cardinal?.toUpperCase() || '';
  return directions[key] ?? 0;
}

function formatRecordedTimestamp(recordedDate?: Date, raceTime?: string): string {
  const snapshot = recordedDate ?? (raceTime ? new Date(raceTime) : null);
  if (!snapshot || Number.isNaN(snapshot.getTime())) {
    return 'at race start';
  }

  return snapshot.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
