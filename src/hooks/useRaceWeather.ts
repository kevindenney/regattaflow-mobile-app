/**
 * Hook to fetch real-time weather and tide data for races
 * Integrates with RegionalWeatherService for venue-specific forecasts
 */

import { useState, useEffect } from 'react';
import { regionalWeatherService } from '@/src/services/weather/RegionalWeatherService';
import type { WeatherData } from '@/src/services/weather/RegionalWeatherService';
import type { SailingVenue } from '@/src/lib/types/global-venues';

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

      // Find forecast closest to race time
      const raceForecast = weatherData.forecast.reduce((closest: typeof weatherData.forecast[0], forecast) => {
        const forecastDiff = Math.abs(forecast.timestamp.getTime() - raceDateObj.getTime());
        const closestDiff = Math.abs(closest.timestamp.getTime() - raceDateObj.getTime());
        return forecastDiff < closestDiff ? forecast : closest;
      });

      // Convert wind direction from degrees to cardinal
      const windDirection = degreesToCardinal(raceForecast.windDirection);

      // Extract tide state from marine conditions
      const tideState = weatherData.marineConditions.tidalState || 'slack';
      const tideHeight = weatherData.marineConditions.tidalHeight || 1.0;

      // Determine tide direction from current if available
      const tideDirection = weatherData.marineConditions.surfaceCurrents?.[0]
        ? degreesToCardinal(weatherData.marineConditions.surfaceCurrents[0].direction)
        : undefined;

      setWeather({
        wind: {
          direction: windDirection,
          speedMin: Math.round(raceForecast.windSpeed * 0.9), // Estimate range
          speedMax: Math.round(raceForecast.windGusts || raceForecast.windSpeed * 1.2),
        },
        tide: {
          state: tideState as 'flooding' | 'ebbing' | 'slack' | 'high' | 'low',
          height: Math.round(tideHeight * 10) / 10, // Round to 1 decimal
          direction: tideDirection,
        },
        raw: weatherData,
      });

      console.log(`✅ Weather data loaded for ${venue.name} on ${raceDate}`);
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

    // Don't fetch weather for past races
    if (raceDateObj < now) {
      console.log('[useRaceWeather] Race date is in the past, skipping weather fetch');
      setWeather(null);
      return;
    }

    fetchWeather();
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
