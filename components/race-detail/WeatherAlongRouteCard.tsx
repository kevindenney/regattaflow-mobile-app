/**
 * WeatherAlongRouteCard Component
 * Displays weather forecasts at ALL waypoints along a distance race route
 * Shows wind, conditions, temperature, waves, and current at each point
 * Generates strategic and tactical advice for each waypoint using Claude AI
 */

import { RaceWeatherService } from '@/services/RaceWeatherService';
import { RouteWaypointAdviceService, type WaypointAdvice } from '@/services/RouteWaypointAdviceService';
import {
    AlertTriangle,
    Anchor,
    Clock,
    Cloud,
    Flag,
    Lightbulb,
    Navigation,
    RefreshCw,
    Target,
    Thermometer,
    TrendingUp,
    Wind
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  advice?: WaypointAdvice;  // Strategic and tactical advice
}

// Shared weather from useRaceWeather hook (consistent with RaceConditionsCard)
interface SharedWeatherData {
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack' | 'high' | 'low';
    height?: number;
  };
  raw?: {
    forecast?: Array<{
      condition?: string;
      temperature?: number;
    }>;
    marineConditions?: {
      waveHeight?: number;
      swellHeight?: number;
    };
  };
}

interface WeatherAlongRouteCardProps {
  waypoints: RouteWaypoint[];
  raceDate: string;
  startTime: string;
  // Shared weather data from useRaceWeather (preferred - avoids duplicate API calls)
  sharedWeather?: SharedWeatherData | null;
  // If weather data is pre-fetched as WeatherAtPoint[], pass it here
  weatherData?: WeatherAtPoint[];
  // Otherwise, we'll show a loading state
  loading?: boolean;
  onRefresh?: () => void;
}

export function WeatherAlongRouteCard({
  waypoints,
  raceDate,
  startTime,
  sharedWeather,
  weatherData: externalWeatherData,
  loading: externalLoading = false,
  onRefresh,
}: WeatherAlongRouteCardProps) {
  const [fetchedWeather, setFetchedWeather] = useState<WeatherAtPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<Set<string>>(new Set());
  const [adviceMap, setAdviceMap] = useState<Map<string, WaypointAdvice>>(new Map());

  // Get ALL waypoints for weather (not just key points)
  const allPoints = useMemo(() => {
    if (waypoints.length === 0) return [];
    // Return all waypoints in order
    return [...waypoints];
  }, [waypoints]);

  // Calculate distance between two points (nautical miles)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3440; // Earth radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Fetch real weather data for ALL waypoints
  const fetchWeatherForWaypoints = useCallback(async () => {
    if (allPoints.length === 0) return;
    
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const weatherPromises = allPoints.map(async (point, index) => {
        try {
          // Fetch weather for this waypoint's coordinates
          const weather = await RaceWeatherService.fetchWeatherByCoordinates(
            point.latitude,
            point.longitude,
            raceDate,
            point.name || `Waypoint ${index + 1}`
          );
          
          // Calculate distances to previous and next waypoints
          const previousWaypoint = index > 0 ? allPoints[index - 1] : undefined;
          const nextWaypoint = index < allPoints.length - 1 ? allPoints[index + 1] : undefined;
          
          const previousDistance = previousWaypoint 
            ? calculateDistance(
                previousWaypoint.latitude, 
                previousWaypoint.longitude,
                point.latitude,
                point.longitude
              )
            : undefined;
          
          const nextDistance = nextWaypoint
            ? calculateDistance(
                point.latitude,
                point.longitude,
                nextWaypoint.latitude,
                nextWaypoint.longitude
              )
            : undefined;

          // Calculate total distance remaining
          let totalDistanceRemaining = 0;
          for (let i = index + 1; i < allPoints.length; i++) {
            if (i > 0) {
              totalDistanceRemaining += calculateDistance(
                allPoints[i - 1].latitude,
                allPoints[i - 1].longitude,
                allPoints[i].latitude,
                allPoints[i].longitude
              );
            }
          }

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
            waveHeight: weather?.waveHeight,
            currentDirection: weather?.current?.direction,
            currentSpeed: weather?.current?.speed,
            // Store context for advice generation (will be removed before display)
            _adviceContext: {
              name: point.name || `Waypoint ${index + 1}`,
              type: point.type,
              position: { lat: point.latitude, lng: point.longitude },
              index,
              totalWaypoints: allPoints.length,
              previousWaypoint: previousWaypoint ? {
                name: previousWaypoint.name || `Waypoint ${index}`,
                distance: previousDistance || 0,
              } : undefined,
              nextWaypoint: nextWaypoint ? {
                name: nextWaypoint.name || `Waypoint ${index + 2}`,
                distance: nextDistance || 0,
              } : undefined,
              totalDistanceRemaining,
            },
          } as any; // Temporary type to include advice context
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
      
      // Generate advice for all waypoints
      await generateAdviceForWaypoints(results);
    } catch (error) {
      console.error('[WeatherAlongRoute] Error fetching weather:', error);
      setFetchError('Unable to load weather data');
    } finally {
      setIsLoading(false);
    }
  }, [allPoints, raceDate, startTime, calculateDistance]);

  // Generate strategic/tactical advice for waypoints
  const generateAdviceForWaypoints = useCallback(async (weatherData: any[]) => {
    const waypointsWithContext = weatherData.filter((w: any) => w._adviceContext);
    if (waypointsWithContext.length === 0) return;

    setLoadingAdvice(new Set(waypointsWithContext.map((w: any) => w.location)));

    try {
      const adviceContexts = waypointsWithContext.map((w: any) => ({
        ...w._adviceContext,
        weather: {
          wind: w.wind,
          conditions: w.conditions,
          temperature: w.temperature,
          waveHeight: w.waveHeight,
          currentDirection: w.currentDirection,
          currentSpeed: w.currentSpeed,
        },
        raceDate,
        startTime,
        estimatedArrivalTime: w.estimatedTime,
      }));

      const adviceResults = await RouteWaypointAdviceService.generateAdviceForAllWaypoints(adviceContexts);
      
      setAdviceMap(adviceResults);
    } catch (error) {
      console.error('[WeatherAlongRoute] Error generating advice:', error);
    } finally {
      setLoadingAdvice(new Set());
    }
  }, [raceDate, startTime]);

  // Calculate total route distance
  const totalRouteDistance = useMemo(() => {
    let total = 0;
    for (let i = 0; i < allPoints.length - 1; i++) {
      total += calculateDistance(
        allPoints[i].latitude, allPoints[i].longitude,
        allPoints[i + 1].latitude, allPoints[i + 1].longitude
      );
    }
    return total;
  }, [allPoints, calculateDistance]);

  // Generate weather data from shared weather with TIME-BASED wind variation
  // This matches RaceConditionsCard's timeline which uses a sine wave pattern
  const weatherFromShared = useMemo<WeatherAtPoint[]>(() => {
    if (!sharedWeather?.wind || allPoints.length === 0) {
      return [];
    }
    
    // Check if wind has the expected shape (speedMin/speedMax or just speed)
    const wind = sharedWeather.wind as any;
    const speedMin = wind.speedMin ?? wind.speed ?? 0;
    const speedMax = wind.speedMax ?? wind.speed ?? 0;
    const direction = wind.direction ?? 'Variable';
    const hasWindRange = speedMax - speedMin >= 3;

    const condition = sharedWeather.raw?.forecast?.[0]?.condition || 'Unknown';
    const temperature = sharedWeather.raw?.forecast?.[0]?.temperature;
    const waveHeight = sharedWeather.raw?.marineConditions?.waveHeight || 
                       sharedWeather.raw?.marineConditions?.swellHeight;

    // Calculate cumulative distance to each waypoint for timeline positioning
    const cumulativeDistances: number[] = [0];
    for (let i = 1; i < allPoints.length; i++) {
      const prev = allPoints[i - 1];
      const curr = allPoints[i];
      const legDistance = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      cumulativeDistances.push(cumulativeDistances[i - 1] + legDistance);
    }

    // Average boat speed assumption (knots) - used for time estimation
    const avgBoatSpeed = Math.max(4, Math.min(8, (speedMin + speedMax) / 4)); // Scale with wind

    return allPoints.map((point, index) => {
      // Calculate distance from previous waypoint
      let distanceFromPrev = 0;
      let totalDistanceRemaining = 0;
      
      if (index > 0) {
        const prev = allPoints[index - 1];
        distanceFromPrev = calculateDistance(prev.latitude, prev.longitude, point.latitude, point.longitude);
      }
      
      // Calculate remaining distance
      for (let i = index; i < allPoints.length - 1; i++) {
        totalDistanceRemaining += calculateDistance(
          allPoints[i].latitude, allPoints[i].longitude,
          allPoints[i + 1].latitude, allPoints[i + 1].longitude
        );
      }

      // Calculate estimated arrival time at this waypoint
      const distanceToHere = cumulativeDistances[index];
      const hoursToReach = distanceToHere / avgBoatSpeed;
      
      // Parse start time and calculate estimated arrival time at this waypoint
      let estimatedTimeStr: string | undefined;
      let arrivalTotalMinutes = 0;
      
      if (startTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        if (!isNaN(startHours) && !isNaN(startMinutes)) {
          arrivalTotalMinutes = startHours * 60 + startMinutes + Math.round(hoursToReach * 60);
          const estHours = Math.floor(arrivalTotalMinutes / 60) % 24;
          const estMinutes = arrivalTotalMinutes % 60;
          estimatedTimeStr = `${estHours.toString().padStart(2, '0')}:${estMinutes.toString().padStart(2, '0')}`;
        }
      }

      // Calculate wind speed using TIME-BASED position to match RaceConditionsCard
      // RaceConditionsCard's timeline goes from -30min before start to expected finish
      // We need to map our estimated arrival time to that same timeline
      let windSpeedAtPoint: number;
      let timelinePosition: number = index / Math.max(1, allPoints.length - 1); // Default based on waypoint index
      
      if (hasWindRange && startTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        
        if (!isNaN(startHours) && !isNaN(startMinutes)) {
          // Calculate race duration based on total route distance and boat speed
          const estimatedRaceDurationHours = totalRouteDistance / avgBoatSpeed;
          const estimatedRaceDurationMinutes = estimatedRaceDurationHours * 60;
          
          // Timeline in RaceConditionsCard: starts 30min before warning, ends at finish
          // Warning is typically 5 min before start, so timeline starts ~35 min before start
          const timelineStartMinutes = -35; // 35 minutes before actual race start
          const timelineEndMinutes = estimatedRaceDurationMinutes; // At finish
          const timelineSpanMinutes = timelineEndMinutes - timelineStartMinutes;
          
          // Calculate how many minutes into the race we expect to be at this waypoint
          const minutesIntoRace = hoursToReach * 60;
          
          // Map to timeline position (0 to 1)
          timelinePosition = timelineSpanMinutes > 0 
            ? (minutesIntoRace - timelineStartMinutes) / timelineSpanMinutes
            : 0;
          
          // Clamp to valid range
          const clampedPosition = Math.max(0, Math.min(1, timelinePosition));
          
          // Sine wave: starts at min, peaks at mid-timeline, returns to min
          // This exactly matches RaceConditionsCard's estimateWindAtTime() logic
          const waveValue = Math.sin(clampedPosition * Math.PI);
          windSpeedAtPoint = Math.round(speedMin + (speedMax - speedMin) * waveValue);
        } else {
          // Fallback to average if time parsing fails
          windSpeedAtPoint = Math.round((speedMin + speedMax) / 2);
        }
      } else if (hasWindRange) {
        // Distance-based fallback when no start time
        timelinePosition = totalRouteDistance > 0 
          ? cumulativeDistances[index] / totalRouteDistance 
          : index / Math.max(1, allPoints.length - 1);
        const waveValue = Math.sin(timelinePosition * Math.PI);
        windSpeedAtPoint = Math.round(speedMin + (speedMax - speedMin) * waveValue);
      } else {
        // No range, use average
        windSpeedAtPoint = Math.round((speedMin + speedMax) / 2);
      }

      // Gusts are higher than base wind (only show if meaningful)
      const gustsAtPoint = windSpeedAtPoint < speedMax 
        ? Math.round(windSpeedAtPoint * 1.15) 
        : undefined;

      const locationType = point.type === 'start' ? 'start' 
        : point.type === 'finish' ? 'finish' 
        : 'waypoint';

      return {
        location: point.name,
        locationType,
        coordinates: { lat: point.latitude, lng: point.longitude },
        estimatedTime: estimatedTimeStr,
        wind: {
          direction: direction,
          speed: windSpeedAtPoint,
          gusts: gustsAtPoint,
        },
        conditions: condition,
        temperature,
        waveHeight,
        // Store context for advice generation
        _adviceContext: {
          name: point.name,
          type: locationType,
          position: { lat: point.latitude, lng: point.longitude },
          index,
          totalWaypoints: allPoints.length,
          previousWaypoint: index > 0 ? {
            name: allPoints[index - 1].name,
            distance: distanceFromPrev,
          } : undefined,
          nextWaypoint: index < allPoints.length - 1 ? {
            name: allPoints[index + 1].name,
            distance: calculateDistance(
              point.latitude, point.longitude,
              allPoints[index + 1].latitude, allPoints[index + 1].longitude
            ),
          } : undefined,
          totalDistanceRemaining,
          timelinePosition,
          estimatedArrivalTime: estimatedTimeStr,
        },
      } as WeatherAtPoint & { _adviceContext: any };
    });
  }, [sharedWeather, allPoints, calculateDistance, totalRouteDistance, startTime]);

  // Track if we've already fetched to prevent infinite loops
  const hasFetchedRef = useRef(false);
  const lastWaypointsKeyRef = useRef<string>('');

  // Clear fetched weather when shared weather becomes available (to use shared instead)
  useEffect(() => {
    if (sharedWeather?.wind && fetchedWeather.length > 0) {
      setFetchedWeather([]);
      hasFetchedRef.current = false; // Reset fetch flag when shared weather arrives
    }
  }, [sharedWeather, fetchedWeather.length]);

  // Auto-fetch weather when waypoints change (only if no shared weather with wind data)
  useEffect(() => {
    // Create a stable key for waypoints to detect actual changes
    const waypointsKey = allPoints.map(p => `${p.latitude},${p.longitude}`).join('|');
    
    // Only fetch individually if:
    // 1. We have waypoints
    // 2. No external data provided
    // 3. No shared weather with wind data (the key field we need)
    // 4. Waypoints actually changed (not just a re-render)
    // 5. We haven't already fetched for these waypoints
    const hasSharedWind = sharedWeather?.wind && (
      (sharedWeather.wind as any).speedMin !== undefined || 
      (sharedWeather.wind as any).speed !== undefined
    );
    
    const waypointsChanged = waypointsKey !== lastWaypointsKeyRef.current;
    const shouldFetch = allPoints.length > 0 && 
                       !externalWeatherData && 
                       !hasSharedWind && 
                       waypointsChanged && 
                       !hasFetchedRef.current;
    
    if (shouldFetch) {
      lastWaypointsKeyRef.current = waypointsKey;
      hasFetchedRef.current = true;
      fetchWeatherForWaypoints();
    }
  }, [allPoints.length, externalWeatherData, sharedWeather?.wind, fetchWeatherForWaypoints]);

  // Generate advice when we have weather from shared data (only once)
  const hasGeneratedAdviceRef = useRef(false);
  useEffect(() => {
    if (weatherFromShared.length > 0 && adviceMap.size === 0 && !hasGeneratedAdviceRef.current) {
      hasGeneratedAdviceRef.current = true;
      generateAdviceForWaypoints(weatherFromShared);
    }
  }, [weatherFromShared.length, adviceMap.size, generateAdviceForWaypoints]);

  // Determine which weather data to display
  const displayWeather = useMemo<WeatherAtPoint[]>(() => {
    // Priority 1: External WeatherAtPoint[] data
    if (externalWeatherData && externalWeatherData.length > 0) {
      return externalWeatherData.map(w => ({
        ...w,
        advice: adviceMap.get(w.location),
      }));
    }
    
    // Priority 2: Shared weather from useRaceWeather (consistent with RaceConditionsCard)
    if (weatherFromShared.length > 0) {
      return weatherFromShared.map((w: any) => {
        const { _adviceContext, ...weatherData } = w;
        return {
          ...weatherData,
          advice: adviceMap.get(w.location),
        };
      });
    }
    
    // Priority 3: Individually fetched weather (fallback)
    if (fetchedWeather.length > 0) {
      return fetchedWeather.map((w: any) => {
        const { _adviceContext, ...weatherData } = w;
        return {
          ...weatherData,
          advice: adviceMap.get(w.location),
        };
      }).filter((w: any) => w.location); // Remove any undefined entries
    }
    // Loading placeholder - show location names only
    return allPoints.map((point, index) => ({
      location: point.name || `Waypoint ${index + 1}`,
      locationType: point.type === 'finish' ? 'finish' as const : 
                    point.type === 'start' ? 'start' as const : 'waypoint' as const,
      coordinates: { lat: point.latitude, lng: point.longitude },
      estimatedTime: index === 0 ? startTime : undefined,
      advice: adviceMap.get(point.name || `Waypoint ${index + 1}`),
    }));
  }, [externalWeatherData, fetchedWeather, allPoints, startTime, adviceMap]);

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

              {/* Strategic and Tactical Advice */}
              {weather.advice && (
                <View style={styles.adviceSection}>
                  <View style={styles.adviceHeader}>
                    <Lightbulb size={14} color="#7C3AED" />
                    <Text style={styles.adviceTitle}>Strategy & Tactics</Text>
                  </View>
                  
                  {/* Strategic Advice */}
                  <View style={styles.adviceBlock}>
                    <View style={styles.adviceBlockHeader}>
                      <Target size={12} color="#0284C7" />
                      <Text style={styles.adviceBlockTitle}>Strategic</Text>
                    </View>
                    <Text style={styles.adviceText} numberOfLines={3}>
                      {weather.advice.strategic}
                    </Text>
                  </View>

                  {/* Tactical Advice */}
                  <View style={styles.adviceBlock}>
                    <View style={styles.adviceBlockHeader}>
                      <TrendingUp size={12} color="#10B981" />
                      <Text style={styles.adviceBlockTitle}>Tactical</Text>
                    </View>
                    <Text style={styles.adviceText} numberOfLines={3}>
                      {weather.advice.tactical}
                    </Text>
                  </View>

                  {/* Key Considerations */}
                  {weather.advice.keyConsiderations && weather.advice.keyConsiderations.length > 0 && (
                    <View style={styles.considerationsList}>
                      {weather.advice.keyConsiderations.slice(0, 2).map((consideration, idx) => (
                        <View key={idx} style={styles.considerationItem}>
                          <View style={styles.considerationDot} />
                          <Text style={styles.considerationText} numberOfLines={1}>
                            {consideration}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Priority Badge */}
                  <View style={[
                    styles.priorityBadge,
                    weather.advice.priority === 'critical' && styles.priorityCritical,
                    weather.advice.priority === 'important' && styles.priorityImportant,
                  ]}>
                    <Text style={styles.priorityText}>
                      {weather.advice.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Loading advice indicator */}
              {loadingAdvice.has(weather.location) && !weather.advice && (
                <View style={styles.adviceLoading}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <Text style={styles.adviceLoadingText}>Generating advice...</Text>
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
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
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
    width: 200,
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
  adviceSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  adviceBlock: {
    marginBottom: 8,
  },
  adviceBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  adviceBlockTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  adviceText: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 14,
  },
  considerationsList: {
    marginTop: 6,
    gap: 4,
  },
  considerationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  considerationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },
  considerationText: {
    fontSize: 9,
    color: '#64748B',
    flex: 1,
  },
  priorityBadge: {
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityCritical: {
    backgroundColor: '#FEF2F2',
  },
  priorityImportant: {
    backgroundColor: '#FEF3C7',
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#92400E',
  },
  adviceLoading: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceLoadingText: {
    fontSize: 10,
    color: '#64748B',
  },
});

export default WeatherAlongRouteCard;

