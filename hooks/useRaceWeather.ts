/**
 * Hook to fetch real-time weather and tide data for races
 * Integrates with RegionalWeatherService for venue-specific forecasts
 */

import { useState, useEffect } from 'react';
import { regionalWeatherService } from '@/services/weather/RegionalWeatherService';
import type { WeatherData } from '@/services/weather/RegionalWeatherService';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

interface RaceWeatherData {
  wind: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide: {
    state: 'flooding' | 'ebbing' | 'slack' | 'high' | 'low';
    height: number;
    direction?: string;
  };
  raw?: WeatherData;
}

interface UseRaceWeatherResult {
  weather: RaceWeatherData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch real-time weather and tide data for a race
 *
 * @param venue - Sailing venue object with coordinates
 * @param raceDate - ISO date string of the race
 * @returns Weather data, loading state, and refetch function
 */

const logger = createLogger('useRaceWeather');
export function useRaceWeather(
  venue: SailingVenue | null | undefined,
  raceDate: string | null | undefined
): UseRaceWeatherResult {
  const [weather, setWeather] = useState<RaceWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWeather = async () => {
    if (!venue || !raceDate) {
      setWeather(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate hours until race
      const raceDateObj = new Date(raceDate);
      const now = new Date();
      const hoursUntil = Math.max(0, (raceDateObj.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Fetch weather data for race time (up to 240 hours ahead)
      const weatherData = await regionalWeatherService.getVenueWeather(
        venue,
        Math.min(240, Math.ceil(hoursUntil))
      );

      if (!weatherData) {
        throw new Error('Unable to fetch weather data');
      }

      // Calculate race window (typical fleet race: 90 minutes)
      const RACE_DURATION_MS = 90 * 60 * 1000; // 90 minutes
      const raceStartMs = raceDateObj.getTime();
      const raceEndMs = raceStartMs + RACE_DURATION_MS;
      
      // Find forecasts that fall within the race window (or closest if none within)
      const forecastsInRaceWindow = weatherData.forecast.filter(forecast => {
        const forecastMs = forecast.timestamp.getTime();
        // Include forecasts within 1 hour before start and up to end time
        return forecastMs >= (raceStartMs - 60 * 60 * 1000) && forecastMs <= raceEndMs;
      });
      
      // If no forecasts in window, find closest ones
      let relevantForecasts = forecastsInRaceWindow.length > 0 
        ? forecastsInRaceWindow 
        : weatherData.forecast.slice(0, 3); // Fallback to first 3 forecasts
      
      // If still none, use the single closest forecast
      if (relevantForecasts.length === 0) {
        const closestForecast = weatherData.forecast.reduce((closest, forecast) => {
          const forecastDiff = Math.abs(forecast.timestamp.getTime() - raceDateObj.getTime());
          const closestDiff = Math.abs(closest.timestamp.getTime() - raceDateObj.getTime());
          return forecastDiff < closestDiff ? forecast : closest;
        });
        relevantForecasts = [closestForecast];
      }
      
      // Calculate averages across the race window
      const minWindSpeed = Math.min(...relevantForecasts.map(f => f.windSpeed));
      const maxWindSpeed = Math.max(...relevantForecasts.map(f => f.windGusts || f.windSpeed * 1.2));
      
      // Calculate average wind direction (using circular mean)
      const sinSum = relevantForecasts.reduce((sum, f) => sum + Math.sin(f.windDirection * Math.PI / 180), 0);
      const cosSum = relevantForecasts.reduce((sum, f) => sum + Math.cos(f.windDirection * Math.PI / 180), 0);
      const avgWindDirection = (Math.atan2(sinSum, cosSum) * 180 / Math.PI + 360) % 360;
      
      // Convert wind direction from degrees to cardinal
      const windDirection = degreesToCardinal(avgWindDirection);

      // Calculate average current speed/direction from forecasts if available
      const forecastsWithCurrent = relevantForecasts.filter(f => f.currentSpeed !== undefined && f.currentSpeed > 0);
      let avgCurrentSpeed = 0;
      let avgCurrentDirection = 0;
      
      if (forecastsWithCurrent.length > 0) {
        avgCurrentSpeed = forecastsWithCurrent.reduce((sum, f) => sum + (f.currentSpeed || 0), 0) / forecastsWithCurrent.length;
        // Calculate average current direction (circular mean)
        const currentSinSum = forecastsWithCurrent.reduce((sum, f) => sum + Math.sin((f.currentDirection || 0) * Math.PI / 180), 0);
        const currentCosSum = forecastsWithCurrent.reduce((sum, f) => sum + Math.cos((f.currentDirection || 0) * Math.PI / 180), 0);
        avgCurrentDirection = (Math.atan2(currentSinSum, currentCosSum) * 180 / Math.PI + 360) % 360;
      }

      // Extract tide state from marine conditions, but use forecast data for better accuracy
      let tideState = weatherData.marineConditions.tidalState || 'slack';
      const tideHeight = weatherData.marineConditions.tidalHeight || 1.0;

      // If we have current data, try to determine tide state from current speed
      if (avgCurrentSpeed > 0.5) {
        // Current is moving - determine if flood or ebb based on typical patterns
        const isFloodLike = avgCurrentDirection >= 0 && avgCurrentDirection <= 135;
        tideState = isFloodLike ? 'flooding' : 'ebbing';
      } else if (avgCurrentSpeed > 0 && avgCurrentSpeed <= 0.3) {
        tideState = 'slack';
      }

      // Determine tide direction from average current direction
      const tideDirection = avgCurrentSpeed > 0 
        ? degreesToCardinal(avgCurrentDirection)
        : (weatherData.marineConditions.surfaceCurrents?.[0]
          ? degreesToCardinal(weatherData.marineConditions.surfaceCurrents[0].direction)
          : undefined);

      logger.debug(`[useRaceWeather] Calculated averages from ${relevantForecasts.length} forecasts:`, {
        windRange: `${Math.round(minWindSpeed)}-${Math.round(maxWindSpeed)}`,
        avgDirection: windDirection,
        avgCurrentSpeed: Math.round(avgCurrentSpeed * 10) / 10,
        tideState,
      });

      setWeather({
        wind: {
          direction: windDirection,
          speedMin: Math.round(minWindSpeed),
          speedMax: Math.round(maxWindSpeed),
        },
        tide: {
          state: tideState as 'flooding' | 'ebbing' | 'slack' | 'high' | 'low',
          height: Math.round(tideHeight * 10) / 10, // Round to 1 decimal
          direction: tideDirection,
        },
        raw: weatherData,
      });

    } catch (err: any) {
      console.error('Error fetching race weather:', err);
      setError(err);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have both venue and a future race date
    if (!venue?.id || !raceDate) {
      setWeather(null);
      return;
    }

    const raceDateObj = new Date(raceDate);
    const now = new Date();
    const hoursUntil = (raceDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Don't fetch weather for past races
    if (raceDateObj < now) {
      setWeather(null);
      return;
    }

    // Don't fetch weather for races more than 10 days (240 hours) away
    // This matches the limit in RaceWeatherService and useEnrichedRaces
    if (hoursUntil > 240) {
      logger.debug(`[useRaceWeather] Race is too far in future (${Math.round(hoursUntil / 24)} days away) - skipping fetch`);
      setWeather(null);
      return;
    }

    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue?.id, raceDate]);

  return {
    weather,
    loading,
    error,
    refetch: fetchWeather,
  };
}

/**
 * Convert degrees to cardinal direction
 */
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
