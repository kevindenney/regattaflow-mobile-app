/**
 * Hook to fetch hourly weather forecast data for race card sparklines
 *
 * Returns arrays of wind speed and tide height values suitable for
 * TinySparkline visualization, along with the "now" index position.
 */

import { useState, useEffect, useMemo } from 'react';
import { regionalWeatherService } from '@/services/weather/RegionalWeatherService';
import type { WeatherData, WeatherForecast } from '@/services/weather/RegionalWeatherService';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceWeatherForecast');

/** Number of hourly data points for sparklines */
const FORECAST_HOURS = 8;

export interface RaceWeatherForecastData {
  /** Hourly wind speed values (knots) for sparkline */
  windForecast: number[];
  /** Hourly tide/current speed values for sparkline */
  tideForecast: number[];
  /** Index in the array representing "now" */
  forecastNowIndex: number;
  /** Time of tide peak (HH:MM format) if available */
  tidePeakTime?: string;
  /** Wind trend description */
  windTrend?: 'building' | 'steady' | 'easing';
  /** Raw forecast data for expanded view */
  rawForecasts?: WeatherForecast[];
}

export interface UseRaceWeatherForecastResult {
  data: RaceWeatherForecastData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Calculate wind trend from forecast array
 */
function calculateWindTrend(speeds: number[]): 'building' | 'steady' | 'easing' {
  if (speeds.length < 3) return 'steady';

  const firstHalf = speeds.slice(0, Math.floor(speeds.length / 2));
  const secondHalf = speeds.slice(Math.floor(speeds.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  const threshold = avgFirst * 0.15; // 15% change threshold

  if (diff > threshold) return 'building';
  if (diff < -threshold) return 'easing';
  return 'steady';
}

/**
 * Find peak time from tide data
 */
function findTidePeakTime(forecasts: WeatherForecast[], tideValues: number[]): string | undefined {
  if (tideValues.length < 3) return undefined;

  // Find the index of maximum value
  const maxIndex = tideValues.indexOf(Math.max(...tideValues));

  // Get corresponding timestamp
  const peakForecast = forecasts[maxIndex];
  if (!peakForecast) return undefined;

  const peakDate = new Date(peakForecast.timestamp);
  return `${peakDate.getHours().toString().padStart(2, '0')}:${peakDate.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Fetch hourly weather forecast for race sparklines
 *
 * @param venue - Sailing venue with coordinates
 * @param raceDate - ISO date string of the race
 * @param enabled - Whether to enable fetching (default: true)
 */
export function useRaceWeatherForecast(
  venue: SailingVenue | null | undefined,
  raceDate: string | null | undefined,
  enabled: boolean = true
): UseRaceWeatherForecastResult {
  const [data, setData] = useState<RaceWeatherForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchForecast = async () => {
    if (!venue || !raceDate || !enabled) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate hours until race
      const raceDateObj = new Date(raceDate);
      const now = new Date();
      const hoursUntil = Math.max(0, (raceDateObj.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Don't fetch for past races or races too far in future
      if (raceDateObj < now || hoursUntil > 240) {
        setData(null);
        return;
      }

      // Fetch weather data - request enough hours to cover race window + buffer
      const hoursToFetch = Math.min(240, Math.ceil(hoursUntil) + FORECAST_HOURS);
      const weatherData = await regionalWeatherService.getVenueWeather(venue, hoursToFetch);

      if (!weatherData || !weatherData.forecast || weatherData.forecast.length === 0) {
        throw new Error('Unable to fetch forecast data');
      }

      // Find the forecast index closest to "now" and race start
      const nowMs = now.getTime();
      const raceStartMs = raceDateObj.getTime();

      // Find starting point: 2 hours before race or now, whichever is later
      const windowStartMs = Math.max(nowMs, raceStartMs - 2 * 60 * 60 * 1000);

      // Find the forecast entry closest to window start
      let startIndex = 0;
      let minDiff = Infinity;

      weatherData.forecast.forEach((f, i) => {
        const diff = Math.abs(new Date(f.timestamp).getTime() - windowStartMs);
        if (diff < minDiff) {
          minDiff = diff;
          startIndex = i;
        }
      });

      // Extract FORECAST_HOURS of data starting from startIndex
      const relevantForecasts = weatherData.forecast.slice(startIndex, startIndex + FORECAST_HOURS);

      if (relevantForecasts.length < 2) {
        // Not enough data points for a meaningful sparkline
        setData(null);
        return;
      }

      // Extract wind speeds
      const windForecast = relevantForecasts.map(f => Math.round(f.windSpeed));

      // Extract tide/current data (use current speed as proxy for tide movement)
      // If no current data, use wave height as visual indicator
      const tideForecast = relevantForecasts.map(f => {
        if (f.currentSpeed !== undefined && f.currentSpeed > 0) {
          // Scale current speed to make visible (typically 0-2 knots)
          return Math.round(f.currentSpeed * 10) / 10;
        }
        // Fallback to wave height if available
        if (f.waveHeight !== undefined) {
          return Math.round(f.waveHeight * 10) / 10;
        }
        // Default to tide height from marine conditions
        return weatherData.marineConditions.tidalHeight || 1.0;
      });

      // Calculate "now" index within the extracted window
      let nowIndex = 0;
      minDiff = Infinity;

      relevantForecasts.forEach((f, i) => {
        const diff = Math.abs(new Date(f.timestamp).getTime() - nowMs);
        if (diff < minDiff) {
          minDiff = diff;
          nowIndex = i;
        }
      });

      // Ensure nowIndex is within bounds
      nowIndex = Math.max(0, Math.min(nowIndex, relevantForecasts.length - 1));

      // Calculate trends and peak times
      const windTrend = calculateWindTrend(windForecast);
      const tidePeakTime = findTidePeakTime(relevantForecasts, tideForecast);

      logger.debug('[useRaceWeatherForecast] Extracted forecast data:', {
        hours: relevantForecasts.length,
        windRange: `${Math.min(...windForecast)}-${Math.max(...windForecast)}`,
        nowIndex,
        windTrend,
      });

      setData({
        windForecast,
        tideForecast,
        forecastNowIndex: nowIndex,
        tidePeakTime,
        windTrend,
        rawForecasts: relevantForecasts,
      });

    } catch (err: any) {
      logger.error('[useRaceWeatherForecast] Error:', err);
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setData(null);
      return;
    }

    fetchForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue?.id, raceDate, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchForecast,
  };
}

/**
 * Simplified version that just returns forecast arrays without the hook overhead
 * Useful for components that already have weather data
 */
export function extractForecastForSparklines(
  weatherData: WeatherData | null | undefined,
  raceDate: string | null | undefined,
  hours: number = FORECAST_HOURS
): RaceWeatherForecastData | null {
  if (!weatherData || !raceDate || !weatherData.forecast || weatherData.forecast.length === 0) {
    return null;
  }

  const now = new Date();
  const raceDateObj = new Date(raceDate);
  const raceStartMs = raceDateObj.getTime();
  const nowMs = now.getTime();

  // Find starting point
  const windowStartMs = Math.max(nowMs, raceStartMs - 2 * 60 * 60 * 1000);

  let startIndex = 0;
  let minDiff = Infinity;

  weatherData.forecast.forEach((f, i) => {
    const diff = Math.abs(new Date(f.timestamp).getTime() - windowStartMs);
    if (diff < minDiff) {
      minDiff = diff;
      startIndex = i;
    }
  });

  const relevantForecasts = weatherData.forecast.slice(startIndex, startIndex + hours);

  if (relevantForecasts.length < 2) return null;

  const windForecast = relevantForecasts.map(f => Math.round(f.windSpeed));
  const tideForecast = relevantForecasts.map(f => {
    if (f.currentSpeed !== undefined && f.currentSpeed > 0) {
      return Math.round(f.currentSpeed * 10) / 10;
    }
    if (f.waveHeight !== undefined) {
      return Math.round(f.waveHeight * 10) / 10;
    }
    return weatherData.marineConditions.tidalHeight || 1.0;
  });

  let nowIndex = 0;
  minDiff = Infinity;

  relevantForecasts.forEach((f, i) => {
    const diff = Math.abs(new Date(f.timestamp).getTime() - nowMs);
    if (diff < minDiff) {
      minDiff = diff;
      nowIndex = i;
    }
  });

  nowIndex = Math.max(0, Math.min(nowIndex, relevantForecasts.length - 1));

  return {
    windForecast,
    tideForecast,
    forecastNowIndex: nowIndex,
    windTrend: calculateWindTrend(windForecast),
    tidePeakTime: findTidePeakTime(relevantForecasts, tideForecast),
    rawForecasts: relevantForecasts,
  };
}
