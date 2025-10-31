// @ts-nocheck

/**
 * Regional Weather Hook
 * React hook for venue-aware weather intelligence
 * Integrates with Global Venue Intelligence for location-aware forecasting
 */

import { useState, useEffect, useCallback } from 'react';
import { regionalWeatherService, WeatherData, WeatherAlert, WeatherForecast } from '@/services/weather/RegionalWeatherService';
import type { SailingVenue } from '@/lib/types/global-venues';

export interface RegionalWeatherState {
  // Current weather data
  currentWeather: WeatherData | null;
  currentVenue: SailingVenue | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;

  // Weather analysis
  sailingRecommendation: {
    recommended: boolean;
    confidence: number;
    reasons: string[];
    boatClasses: string[];
  } | null;

  // Alerts and conditions
  activeAlerts: WeatherAlert[];
  criticalAlerts: WeatherAlert[];

  // Forecast data
  forecast: WeatherForecast[];
  extendedForecast: WeatherForecast[];

  // Comparative data
  nearbyWeather: Map<string, WeatherData | null>;

  // Error handling
  error: string | null;
  isOffline: boolean;
}

export interface WeatherComparisonData {
  venue: SailingVenue;
  weather: WeatherData | null;
  distance?: number;
  travelTime?: string;
}

export function useRegionalWeather() {
  const [state, setState] = useState<RegionalWeatherState>({
    currentWeather: null,
    currentVenue: null,
    isLoading: false,
    isRefreshing: false,
    lastUpdated: null,
    sailingRecommendation: null,
    activeAlerts: [],
    criticalAlerts: [],
    forecast: [],
    extendedForecast: [],
    nearbyWeather: new Map(),
    error: null,
    isOffline: false
  });

  /**
   * Load weather data for a specific venue
   */
  const loadVenueWeather = useCallback(async (
    venue: SailingVenue,
    hoursAhead: number = 72,
    force: boolean = false
  ) => {

    if (!force && state.isLoading) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      isRefreshing: force,
      error: null
    }));

    try {
      // Get weather data from regional service
      const weatherData = await regionalWeatherService.getVenueWeather(venue, hoursAhead);

      if (!weatherData) {
        throw new Error(`Unable to load weather data for ${venue.name}`);
      }

      // Get sailing recommendation
      const recommendation = regionalWeatherService.getSailingRecommendation(weatherData);

      // Separate alerts by severity
      const activeAlerts = weatherData.alerts;
      const criticalAlerts = weatherData.alerts.filter(
        alert => alert.severity === 'warning' || alert.severity === 'emergency'
      );

      // Split forecast into current and extended
      const currentForecast = weatherData.forecast.slice(0, 8); // Next 24 hours (3-hour intervals)
      const extendedForecast = weatherData.forecast.slice(8); // Beyond 24 hours

      setState(prev => ({
        ...prev,
        currentWeather: weatherData,
        currentVenue: venue,
        isLoading: false,
        isRefreshing: false,
        lastUpdated: weatherData.lastUpdated,
        sailingRecommendation: recommendation,
        activeAlerts,
        criticalAlerts,
        forecast: currentForecast,
        extendedForecast,
        error: null,
        isOffline: false
      }));


    } catch (error: any) {

      setState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: error.message,
        isOffline: error.message.includes('network') || error.message.includes('offline')
      }));
    }
  }, [state.isLoading]);

  /**
   * Load weather comparison for multiple venues
   */
  const loadNearbyWeather = useCallback(async (venues: SailingVenue[]) => {

    try {
      setState(prev => ({ ...prev, error: null }));

      const weatherMap = await regionalWeatherService.compareVenueWeather(venues);

      setState(prev => ({
        ...prev,
        nearbyWeather: weatherMap,
        lastUpdated: new Date()
      }));


    } catch (error: any) {

      setState(prev => ({ ...prev, error: error.message }));
    }
  }, []);

  /**
   * Refresh current weather data
   */
  const refreshWeather = useCallback(async () => {
    if (state.currentVenue) {
      await loadVenueWeather(state.currentVenue, 72, true);
    }
  }, [state.currentVenue, loadVenueWeather]);

  /**
   * Get weather summary for quick display
   */
  const getWeatherSummary = useCallback(() => {
    if (!state.currentWeather) return null;

    const current = state.currentWeather.forecast[0];
    const alerts = state.criticalAlerts;

    return {
      condition: current.weatherCondition,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      temperature: current.airTemperature,
      hasAlerts: alerts.length > 0,
      alertCount: alerts.length,
      recommendation: state.sailingRecommendation?.recommended || false,
      confidence: state.sailingRecommendation?.confidence || 0,
      lastUpdated: state.lastUpdated
    };
  }, [state.currentWeather, state.criticalAlerts, state.sailingRecommendation, state.lastUpdated]);

  /**
   * Get weather trend analysis
   */
  const getWeatherTrend = useCallback(() => {
    if (state.forecast.length < 4) return null;

    const current = state.forecast[0];
    const future = state.forecast[3]; // 9 hours ahead

    const windTrend = future.windSpeed > current.windSpeed + 3 ? 'increasing' :
                     future.windSpeed < current.windSpeed - 3 ? 'decreasing' : 'stable';

    const tempTrend = future.airTemperature > current.airTemperature + 2 ? 'warming' :
                     future.airTemperature < current.airTemperature - 2 ? 'cooling' : 'stable';

    const conditionTrend = this.getConditionTrend(current, future);

    return {
      wind: windTrend,
      temperature: tempTrend,
      conditions: conditionTrend,
      improving: windTrend !== 'increasing' && conditionTrend !== 'deteriorating',
      summary: this.generateTrendSummary(windTrend, tempTrend, conditionTrend)
    };
  }, [state.forecast]);

  /**
   * Get condition trend between two forecasts
   */
  const getConditionTrend = (current: WeatherForecast, future: WeatherForecast): string => {
    const currentScore = this.getConditionScore(current);
    const futureScore = this.getConditionScore(future);

    if (futureScore > currentScore + 1) return 'improving';
    if (futureScore < currentScore - 1) return 'deteriorating';
    return 'stable';
  };

  /**
   * Get numeric score for weather conditions (higher = better)
   */
  const getConditionScore = (forecast: WeatherForecast): number => {
    let score = 5; // Base score

    // Wind scoring
    if (forecast.windSpeed < 3) score -= 3; // Too light
    else if (forecast.windSpeed > 25) score -= 4; // Too strong
    else if (forecast.windSpeed > 15) score -= 1; // Strong but manageable
    else score += 1; // Good wind

    // Visibility scoring
    if (forecast.visibility < 2) score -= 3;
    else if (forecast.visibility < 5) score -= 1;

    // Precipitation scoring
    if ((forecast.precipitation || 0) > 1) score -= 2;

    return Math.max(0, score);
  };

  /**
   * Generate trend summary text
   */
  const generateTrendSummary = (wind: string, temp: string, conditions: string): string => {
    if (conditions === 'improving') {
      return 'Conditions improving over the next 9 hours';
    } else if (conditions === 'deteriorating') {
      return 'Conditions may worsen - plan accordingly';
    } else if (wind === 'increasing') {
      return 'Wind picking up - good for experienced sailors';
    } else if (wind === 'decreasing') {
      return 'Wind dropping - lighter conditions ahead';
    } else {
      return 'Stable conditions expected';
    }
  };

  /**
   * Get formatted weather comparison data
   */
  const getWeatherComparison = useCallback((): WeatherComparisonData[] => {
    const comparison: WeatherComparisonData[] = [];

    for (const [venueId, weather] of state.nearbyWeather) {
      if (weather) {
        comparison.push({
          venue: weather.venue,
          weather,
          // Distance and travel time would be calculated from venue coordinates
        });
      }
    }

    // Sort by sailing recommendation confidence
    return comparison.sort((a, b) => {
      const aRec = a.weather ? regionalWeatherService.getSailingRecommendation(a.weather) : null;
      const bRec = b.weather ? regionalWeatherService.getSailingRecommendation(b.weather) : null;

      return (bRec?.confidence || 0) - (aRec?.confidence || 0);
    });
  }, [state.nearbyWeather]);

  /**
   * Check if weather data is stale
   */
  const isWeatherStale = useCallback((): boolean => {
    if (!state.lastUpdated) return true;
    const ageMinutes = (Date.now() - state.lastUpdated.getTime()) / (1000 * 60);
    return ageMinutes > 30; // Consider stale after 30 minutes
  }, [state.lastUpdated]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Clear weather cache
   */
  const clearCache = useCallback(() => {
    regionalWeatherService.clearCache();
    setState(prev => ({
      ...prev,
      currentWeather: null,
      nearbyWeather: new Map(),
      lastUpdated: null
    }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    loadVenueWeather,
    loadNearbyWeather,
    refreshWeather,
    clearError,
    clearCache,

    // Computed data
    weatherSummary: getWeatherSummary(),
    weatherTrend: getWeatherTrend(),
    weatherComparison: getWeatherComparison(),
    isStale: isWeatherStale(),

    // Utilities
    hasWeatherData: !!state.currentWeather,
    hasCriticalAlerts: state.criticalAlerts.length > 0,
    isGoodSailing: state.sailingRecommendation?.recommended &&
                   state.sailingRecommendation.confidence > 0.7
  };
}

export default useRegionalWeather;
