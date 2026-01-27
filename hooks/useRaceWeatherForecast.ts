/**
 * Hook to fetch hourly weather forecast data for race card sparklines
 *
 * Returns arrays of wind speed and tide height values suitable for
 * TinySparkline visualization, along with the "now" index position.
 */

import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';
import type { WeatherData, WeatherForecast } from '@/services/weather/RegionalWeatherService';
import { regionalWeatherService } from '@/services/weather/RegionalWeatherService';
import { useEffect, useState } from 'react';

const logger = createLogger('useRaceWeatherForecast');

/** Default number of hourly data points for sparklines */
const FORECAST_HOURS = 8;
/** Default race duration in minutes */
const DEFAULT_RACE_DURATION_MINUTES = 90;

/**
 * Convert wind direction in degrees to cardinal direction
 */
function degreesToCardinal(degrees: number | undefined): string {
  if (degrees === undefined) return '';

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

/**
 * Format timestamp to HH:MM string (using UTC to match how race times are stored)
 */
function formatTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
}

/** Hourly data point for HourlyForecastTable */
export interface HourlyDataPoint {
  time: string;        // "09:00" format
  timestamp: string;   // Full ISO timestamp for multi-day races
  value: number;
  direction?: string;  // "E", "NE", etc. for wind
}

/** Tide time with height */
export interface TideTimeData {
  time: string;     // "14:32" format
  height: number;   // meters
}

/** Race-window specific forecast values */
export interface RaceWindowData {
  /** Wind speed at race start (knots) */
  windAtStart: number;
  /** Wind speed at race end (knots) */
  windAtEnd: number;
  /** Wind direction at race start */
  windDirectionAtStart: string;
  /** Wind direction at race start in degrees (0-360) */
  windDirectionDegreesAtStart?: number;
  /** Tide height at race start (meters) */
  tideAtStart: number;
  /** Tide height at race end (meters) */
  tideAtEnd: number;
  /** Peak tide during race window */
  tidePeakDuringRace?: TideTimeData;
  /** Slack water turn time if within race window */
  turnTimeDuringRace?: string;
  /** Is the turn time during the race window? */
  hasTurnDuringRace: boolean;
  /** Current/tide flow direction at race start in degrees (0-360) */
  currentDirectionAtStart?: number;
  /** Current/tide flow speed at race start (knots) */
  currentSpeedAtStart?: number;
  /** Start time for race window display */
  raceStartTime: string;
  /** End time for race window display */
  raceEndTime: string;
  /** Beaufort scale at start */
  beaufortAtStart: number;
  /** Beaufort scale at end */
  beaufortAtEnd: number;
  /** Wave height at race start (meters) */
  waveHeightAtStart?: number;
  /** Wave height at race end (meters) */
  waveHeightAtEnd?: number;
  /** Wave period at race start (seconds) */
  wavePeriodAtStart?: number;
  /** Wave direction at race start (cardinal) */
  waveDirectionAtStart?: string;
  /** Air temperature at race start (celsius) */
  airTemperature?: number;
  /** Water temperature at race start (celsius) */
  waterTemperature?: number;
}

/** Data source metadata for attribution */
export interface DataSourceMeta {
  /** Provider name (e.g., "Storm Glass", "Mock Data") */
  provider: string;
  /** Whether this is mock/simulated data */
  isMock: boolean;
  /** When the data was fetched */
  fetchedAt: Date;
  /** Reliability score 0-1 */
  reliability?: number;
}

export interface RaceWeatherForecastData {
  /** Hourly wind speed values (knots) for sparkline */
  windForecast: number[];
  /** Hourly tide/current speed values for sparkline */
  tideForecast: number[];
  /** Index in the array representing "now" */
  forecastNowIndex: number;
  /** Index in the array representing race start */
  raceStartIndex: number;
  /** Index in the array representing race end */
  raceEndIndex: number;
  /** Time of tide peak (HH:MM format) if available */
  tidePeakTime?: string;
  /** Wind trend description */
  windTrend?: 'building' | 'steady' | 'easing';
  /** Raw forecast data for expanded view */
  rawForecasts?: WeatherForecast[];
  /** Data source metadata for UI attribution */
  dataSource?: DataSourceMeta;

  // === Detailed time-series data ===

  /** Formatted hourly wind data for HourlyForecastTable */
  hourlyWind?: HourlyDataPoint[];
  /** Formatted hourly tide/wave data for HourlyForecastTable */
  hourlyTide?: HourlyDataPoint[];
  /** High water time and height */
  highTide?: TideTimeData;
  /** Low water time and height */
  lowTide?: TideTimeData;
  /** Tidal range in meters */
  tideRange?: number;
  /** Estimated tide turn time (slack water) */
  turnTime?: string;

  // === Race-window specific data (Tufte redesign) ===

  /** Race-window specific values: start, end, peak, turn */
  raceWindow?: RaceWindowData;

  // === Wave data ===

  /** Formatted hourly wave data for HourlyForecastTable */
  hourlyWaves?: HourlyDataPoint[];
  /** Average wave height during race window (meters) */
  waveHeight?: number;
  /** Average wave period during race window (seconds) */
  wavePeriod?: number;
  /** Wave/swell direction (cardinal) */
  swellDirection?: string;
}

export interface UseRaceWeatherForecastResult {
  data: RaceWeatherForecastData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Convert wind speed in knots to Beaufort scale
 */
function knotsToBeaufort(knots: number): number {
  if (knots < 1) return 0;
  if (knots < 4) return 1;
  if (knots < 7) return 2;
  if (knots < 11) return 3;
  if (knots < 17) return 4;
  if (knots < 22) return 5;
  if (knots < 28) return 6;
  if (knots < 34) return 7;
  if (knots < 41) return 8;
  return 9;
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
  return `${peakDate.getUTCHours().toString().padStart(2, '0')}:${peakDate.getUTCMinutes().toString().padStart(2, '0')}`;
}

/**
 * Extract high and low tide times from forecast data
 */
function extractTideTimes(
  forecasts: WeatherForecast[],
  tideValues: number[]
): { highTide?: TideTimeData; lowTide?: TideTimeData; tideRange?: number; turnTime?: string } {
  if (forecasts.length < 3 || tideValues.length < 3) {
    return {};
  }

  const maxValue = Math.max(...tideValues);
  const minValue = Math.min(...tideValues);
  const maxIndex = tideValues.indexOf(maxValue);
  const minIndex = tideValues.indexOf(minValue);

  const highTide: TideTimeData | undefined = forecasts[maxIndex] ? {
    time: formatTime(forecasts[maxIndex].timestamp),
    height: maxValue,
  } : undefined;

  const lowTide: TideTimeData | undefined = forecasts[minIndex] ? {
    time: formatTime(forecasts[minIndex].timestamp),
    height: minValue,
  } : undefined;

  const tideRange = maxValue - minValue;

  // Estimate turn time (slack water) - midpoint between HW and LW
  let turnTime: string | undefined;
  if (highTide && lowTide) {
    const hwDate = new Date(forecasts[maxIndex].timestamp);
    const lwDate = new Date(forecasts[minIndex].timestamp);
    const midMs = (hwDate.getTime() + lwDate.getTime()) / 2;
    const midDate = new Date(midMs);
    turnTime = `${midDate.getUTCHours().toString().padStart(2, '0')}:${midDate.getUTCMinutes().toString().padStart(2, '0')}`;
  }

  return { highTide, lowTide, tideRange, turnTime };
}

/**
 * Extract race-window specific data for Tufte display
 */
function extractRaceWindowData(
  forecasts: WeatherForecast[],
  tideValues: number[],
  raceStartMs: number,
  raceDurationMinutes: number,
  turnTime?: string,
  highTide?: TideTimeData
): RaceWindowData | undefined {
  if (forecasts.length < 2) return undefined;

  const raceEndMs = raceStartMs + raceDurationMinutes * 60 * 1000;

  // Find forecasts closest to race start and end
  let startIdx = 0;
  let endIdx = forecasts.length - 1;
  let minStartDiff = Infinity;
  let minEndDiff = Infinity;

  forecasts.forEach((f, i) => {
    const ts = new Date(f.timestamp).getTime();
    const startDiff = Math.abs(ts - raceStartMs);
    const endDiff = Math.abs(ts - raceEndMs);

    if (startDiff < minStartDiff) {
      minStartDiff = startDiff;
      startIdx = i;
    }
    if (endDiff < minEndDiff) {
      minEndDiff = endDiff;
      endIdx = i;
    }
  });

  const startForecast = forecasts[startIdx];
  const endForecast = forecasts[endIdx];

  if (!startForecast || !endForecast) return undefined;

  const windAtStart = Math.round(startForecast.windSpeed);
  const windAtEnd = Math.round(endForecast.windSpeed);

  // Find tide peak during race window
  let tidePeakDuringRace: TideTimeData | undefined;
  let maxTideInWindow = -Infinity;
  let maxTideIdx = -1;

  for (let i = startIdx; i <= endIdx && i < tideValues.length; i++) {
    if (tideValues[i] > maxTideInWindow) {
      maxTideInWindow = tideValues[i];
      maxTideIdx = i;
    }
  }

  if (maxTideIdx >= 0 && forecasts[maxTideIdx]) {
    tidePeakDuringRace = {
      time: formatTime(forecasts[maxTideIdx].timestamp),
      height: maxTideInWindow,
    };
  }

  // Check if turn time (slack water) is within race window
  let hasTurnDuringRace = false;
  let turnTimeDuringRace: string | undefined;

  if (turnTime) {
    // Parse turn time (HH:MM) into today's date
    const [hours, mins] = turnTime.split(':').map(Number);
    const raceDate = new Date(raceStartMs);
    const turnDate = new Date(raceDate);
    turnDate.setHours(hours, mins, 0, 0);
    const turnMs = turnDate.getTime();

    hasTurnDuringRace = turnMs >= raceStartMs && turnMs <= raceEndMs;
    if (hasTurnDuringRace) {
      turnTimeDuringRace = turnTime;
    }
  }

  // Extract wave data
  const waveHeightAtStart = startForecast.waveHeight !== undefined
    ? Math.round(startForecast.waveHeight * 10) / 10
    : undefined;
  const waveHeightAtEnd = endForecast.waveHeight !== undefined
    ? Math.round(endForecast.waveHeight * 10) / 10
    : undefined;
  const wavePeriodAtStart = startForecast.wavePeriod !== undefined
    ? Math.round(startForecast.wavePeriod)
    : undefined;
  const waveDirectionAtStart = startForecast.waveDirection !== undefined
    ? degreesToCardinal(startForecast.waveDirection)
    : undefined;

  // Extract temperature data
  const airTemperature = startForecast.airTemperature !== undefined
    ? Math.round(startForecast.airTemperature)
    : undefined;
  const waterTemperature = startForecast.waterTemperature !== undefined
    ? Math.round(startForecast.waterTemperature)
    : undefined;

  return {
    windAtStart,
    windAtEnd,
    windDirectionAtStart: degreesToCardinal(startForecast.windDirection),
    windDirectionDegreesAtStart: startForecast.windDirection,
    tideAtStart: tideValues[startIdx] ?? 0,
    tideAtEnd: tideValues[endIdx] ?? 0,
    tidePeakDuringRace,
    turnTimeDuringRace,
    hasTurnDuringRace,
    currentDirectionAtStart: startForecast.currentDirection,
    currentSpeedAtStart: startForecast.currentSpeed,
    raceStartTime: formatTime(startForecast.timestamp),
    raceEndTime: formatTime(endForecast.timestamp),
    beaufortAtStart: knotsToBeaufort(windAtStart),
    beaufortAtEnd: knotsToBeaufort(windAtEnd),
    waveHeightAtStart,
    waveHeightAtEnd,
    wavePeriodAtStart,
    waveDirectionAtStart,
    airTemperature,
    waterTemperature,
  };
}

/**
 * Extract hourly wind data with directions
 */
function extractHourlyWind(forecasts: WeatherForecast[]): HourlyDataPoint[] {
  return forecasts.map(f => ({
    time: formatTime(f.timestamp),
    timestamp: typeof f.timestamp === 'string' ? f.timestamp : f.timestamp.toISOString(),
    value: Math.round(f.windSpeed),
    direction: degreesToCardinal(f.windDirection),
  }));
}

/**
 * Extract hourly tide/wave data
 */
function extractHourlyTide(forecasts: WeatherForecast[], tideValues: number[]): HourlyDataPoint[] {
  return forecasts.map((f, i) => ({
    time: formatTime(f.timestamp),
    timestamp: typeof f.timestamp === 'string' ? f.timestamp : f.timestamp.toISOString(),
    value: tideValues[i] ?? 0,
  }));
}

/**
 * Extract hourly wave data with direction
 */
function extractHourlyWaves(forecasts: WeatherForecast[]): HourlyDataPoint[] {
  return forecasts.map(f => ({
    time: formatTime(f.timestamp),
    timestamp: typeof f.timestamp === 'string' ? f.timestamp : f.timestamp.toISOString(),
    value: Math.round((f.waveHeight ?? 0) * 10) / 10,
    direction: f.waveDirection !== undefined ? degreesToCardinal(f.waveDirection) : undefined,
  }));
}

/**
 * Fetch hourly weather forecast for race sparklines
 *
 * @param venue - Sailing venue with coordinates
 * @param raceDate - ISO date string of the race
 * @param enabled - Whether to enable fetching (default: true)
 * @param expectedDurationMinutes - Expected race duration (default: 90 minutes)
 */
export function useRaceWeatherForecast(
  venue: SailingVenue | null | undefined,
  raceDate: string | null | undefined,
  enabled: boolean = true,
  expectedDurationMinutes: number = DEFAULT_RACE_DURATION_MINUTES
): UseRaceWeatherForecastResult {
  const [data, setData] = useState<RaceWeatherForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchForecast = async () => {
    // Debug logging
    logger.debug('🔍 [useRaceWeatherForecast] fetchForecast called:', {
      hasVenue: !!venue,
      venueId: venue?.id,
      venueName: venue?.name,
      venueCoords: venue?.coordinates,
      raceDate,
      enabled,
    });

    if (!venue || !raceDate || !enabled) {
      logger.debug('🔴 [useRaceWeatherForecast] Early return - missing data:', {
        hasVenue: !!venue,
        hasRaceDate: !!raceDate,
        enabled,
      });
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

      // Calculate dynamic forecast hours based on race duration
      // For short races (<3hr), use default 8 hours
      // For long races, use race duration + 4 hour buffer
      const raceDurationHours = Math.ceil(expectedDurationMinutes / 60);
      const dynamicForecastHours = raceDurationHours >= 3
        ? Math.max(FORECAST_HOURS, raceDurationHours + 4)
        : FORECAST_HOURS;

      // Debug: Log date parsing
      // IMPORTANT: If raceDate is just "YYYY-MM-DD" without time, it parses as midnight.
      // For today's races, this means raceDateObj < now is TRUE even though the race hasn't started!
      const isDateOnly = !raceDate.includes('T') && !raceDate.includes(' ');
      logger.debug('📅 [useRaceWeatherForecast] Date check:', {
        raceDate,
        isDateOnly,
        raceDateParsed: raceDateObj.toISOString(),
        now: now.toISOString(),
        hoursUntil,
        isPast: raceDateObj < now,
        isTooFar: hoursUntil > 240,
        ISSUE: isDateOnly && raceDateObj < now ? '⚠️ DATE-ONLY STRING CAUSES FALSE PAST CHECK!' : 'OK',
      });

      // Relaxed check: Allow races that started within the last 24 hours
      // This ensures "Start Strategy" works even if the race strictly "started" 5 minutes ago.
      const msSinceRace = now.getTime() - raceDateObj.getTime();
      const isPastRace = msSinceRace > 24 * 60 * 60 * 1000; // Only skip if > 24 hours ago

      if (isPastRace || hoursUntil > 240) {
        logger.debug('🔴 [useRaceWeatherForecast] Skipping - race date out of range', {
          isPastRace,
          hoursUntil,
          msSinceRace,
        });
        setData(null);
        return;
      }

      // Fetch weather data - request enough hours to cover race window + buffer
      const hoursToFetch = Math.min(240, Math.ceil(hoursUntil) + dynamicForecastHours);
      logger.debug('[useRaceWeatherForecast] Fetching weather:', {
        venueId: venue.id,
        venueName: venue.name,
        coordinates: venue.coordinates,
        hoursToFetch,
      });
      const weatherData = await regionalWeatherService.getVenueWeather(venue, hoursToFetch);

      logger.debug('[useRaceWeatherForecast] Weather result:', {
        hasData: !!weatherData,
        forecastLength: weatherData?.forecast?.length,
      });

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

      // Extract dynamicForecastHours of data starting from startIndex
      const relevantForecasts = weatherData.forecast.slice(startIndex, startIndex + dynamicForecastHours);

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

      // Calculate race start and end indices
      let raceStartIndex = 0;
      let raceEndIndex = relevantForecasts.length - 1;
      let minStartDiff = Infinity;
      let minEndDiff = Infinity;
      const raceEndMs = raceStartMs + expectedDurationMinutes * 60 * 1000;

      relevantForecasts.forEach((f, i) => {
        const ts = new Date(f.timestamp).getTime();
        const startDiff = Math.abs(ts - raceStartMs);
        const endDiff = Math.abs(ts - raceEndMs);

        if (startDiff < minStartDiff) {
          minStartDiff = startDiff;
          raceStartIndex = i;
        }
        if (endDiff < minEndDiff) {
          minEndDiff = endDiff;
          raceEndIndex = i;
        }
      });

      // Ensure indices are within bounds
      raceStartIndex = Math.max(0, Math.min(raceStartIndex, relevantForecasts.length - 1));
      raceEndIndex = Math.max(0, Math.min(raceEndIndex, relevantForecasts.length - 1));

      // Calculate trends and peak times
      const windTrend = calculateWindTrend(windForecast);
      const tidePeakTime = findTidePeakTime(relevantForecasts, tideForecast);

      // Extract detailed time-series data
      const hourlyWind = extractHourlyWind(relevantForecasts);
      const hourlyTide = extractHourlyTide(relevantForecasts, tideForecast);
      const hourlyWaves = extractHourlyWaves(relevantForecasts);
      const { highTide, lowTide, tideRange, turnTime } = extractTideTimes(relevantForecasts, tideForecast);

      // Extract race-window specific data for Tufte display
      const raceWindow = extractRaceWindowData(
        relevantForecasts,
        tideForecast,
        raceStartMs,
        expectedDurationMinutes,
        turnTime,
        highTide
      );

      // Calculate average wave data for race window
      const raceWindowForecasts = relevantForecasts.slice(raceStartIndex, raceEndIndex + 1);
      const waveHeights = raceWindowForecasts
        .map(f => f.waveHeight)
        .filter((h): h is number => h !== undefined);
      const wavePeriods = raceWindowForecasts
        .map(f => f.wavePeriod)
        .filter((p): p is number => p !== undefined);

      const avgWaveHeight = waveHeights.length > 0
        ? Math.round((waveHeights.reduce((a, b) => a + b, 0) / waveHeights.length) * 10) / 10
        : undefined;
      const avgWavePeriod = wavePeriods.length > 0
        ? Math.round(wavePeriods.reduce((a, b) => a + b, 0) / wavePeriods.length)
        : undefined;

      // Get predominant swell direction from race start
      const startWaveDirection = relevantForecasts[raceStartIndex]?.waveDirection;
      const swellDirection = startWaveDirection !== undefined
        ? degreesToCardinal(startWaveDirection)
        : undefined;

      logger.debug('[useRaceWeatherForecast] Extracted forecast data:', {
        hours: relevantForecasts.length,
        windRange: `${Math.min(...windForecast)}-${Math.max(...windForecast)}`,
        nowIndex,
        raceStartIndex,
        raceEndIndex,
        windTrend,
        highTide: highTide?.time,
        lowTide: lowTide?.time,
        raceWindow: raceWindow ? `${raceWindow.windAtStart}→${raceWindow.windAtEnd}kt` : 'N/A',
        waveHeight: avgWaveHeight,
        swellDirection,
      });

      // Extract data source metadata for UI attribution
      const isMockData = weatherData.sources.primary.toLowerCase().includes('mock') ||
        weatherData.sources.primary.toLowerCase().includes('simulated') ||
        weatherData.sources.primary.toLowerCase().includes('fallback');
      const dataSource: DataSourceMeta = {
        provider: weatherData.sources.primary,
        isMock: isMockData,
        fetchedAt: weatherData.lastUpdated,
        reliability: weatherData.sources.reliability,
      };

      setData({
        windForecast,
        tideForecast,
        forecastNowIndex: nowIndex,
        raceStartIndex,
        raceEndIndex,
        tidePeakTime,
        windTrend,
        rawForecasts: relevantForecasts,
        // Data source metadata
        dataSource,
        // Detailed time-series data
        hourlyWind,
        hourlyTide,
        highTide,
        lowTide,
        tideRange,
        turnTime,
        // Race-window specific data
        raceWindow,
        // Wave data
        hourlyWaves,
        waveHeight: avgWaveHeight,
        wavePeriod: avgWavePeriod,
        swellDirection,
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
  }, [venue?.id, raceDate, enabled, expectedDurationMinutes]);

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
  hours: number = FORECAST_HOURS,
  expectedDurationMinutes: number = DEFAULT_RACE_DURATION_MINUTES
): RaceWeatherForecastData | null {
  if (!weatherData || !raceDate || !weatherData.forecast || weatherData.forecast.length === 0) {
    return null;
  }

  const now = new Date();
  const raceDateObj = new Date(raceDate);
  const raceStartMs = raceDateObj.getTime();
  const nowMs = now.getTime();
  const raceEndMs = raceStartMs + expectedDurationMinutes * 60 * 1000;

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

  // Calculate race start and end indices
  let raceStartIndex = 0;
  let raceEndIndex = relevantForecasts.length - 1;
  let minStartDiff = Infinity;
  let minEndDiff = Infinity;

  relevantForecasts.forEach((f, i) => {
    const ts = new Date(f.timestamp).getTime();
    const startDiff = Math.abs(ts - raceStartMs);
    const endDiff = Math.abs(ts - raceEndMs);

    if (startDiff < minStartDiff) {
      minStartDiff = startDiff;
      raceStartIndex = i;
    }
    if (endDiff < minEndDiff) {
      minEndDiff = endDiff;
      raceEndIndex = i;
    }
  });

  raceStartIndex = Math.max(0, Math.min(raceStartIndex, relevantForecasts.length - 1));
  raceEndIndex = Math.max(0, Math.min(raceEndIndex, relevantForecasts.length - 1));

  // Extract detailed time-series data
  const hourlyWind = extractHourlyWind(relevantForecasts);
  const hourlyTide = extractHourlyTide(relevantForecasts, tideForecast);
  const hourlyWaves = extractHourlyWaves(relevantForecasts);
  const { highTide, lowTide, tideRange, turnTime } = extractTideTimes(relevantForecasts, tideForecast);

  // Extract race-window specific data
  const raceWindow = extractRaceWindowData(
    relevantForecasts,
    tideForecast,
    raceStartMs,
    expectedDurationMinutes,
    turnTime,
    highTide
  );

  // Calculate average wave data for race window
  const raceWindowForecasts = relevantForecasts.slice(raceStartIndex, raceEndIndex + 1);
  const waveHeights = raceWindowForecasts
    .map(f => f.waveHeight)
    .filter((h): h is number => h !== undefined);
  const wavePeriods = raceWindowForecasts
    .map(f => f.wavePeriod)
    .filter((p): p is number => p !== undefined);

  const avgWaveHeight = waveHeights.length > 0
    ? Math.round((waveHeights.reduce((a, b) => a + b, 0) / waveHeights.length) * 10) / 10
    : undefined;
  const avgWavePeriod = wavePeriods.length > 0
    ? Math.round(wavePeriods.reduce((a, b) => a + b, 0) / wavePeriods.length)
    : undefined;

  // Get predominant swell direction from race start
  const startWaveDirection = relevantForecasts[raceStartIndex]?.waveDirection;
  const swellDirection = startWaveDirection !== undefined
    ? degreesToCardinal(startWaveDirection)
    : undefined;

  return {
    windForecast,
    tideForecast,
    forecastNowIndex: nowIndex,
    raceStartIndex,
    raceEndIndex,
    windTrend: calculateWindTrend(windForecast),
    tidePeakTime: findTidePeakTime(relevantForecasts, tideForecast),
    rawForecasts: relevantForecasts,
    // Detailed time-series data
    hourlyWind,
    hourlyTide,
    highTide,
    lowTide,
    tideRange,
    turnTime,
    // Race-window specific data
    raceWindow,
    // Wave data
    hourlyWaves,
    waveHeight: avgWaveHeight,
    wavePeriod: avgWavePeriod,
    swellDirection,
  };
}
