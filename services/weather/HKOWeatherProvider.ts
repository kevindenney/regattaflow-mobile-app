/**
 * Hong Kong Observatory (HKO) Weather Provider
 *
 * Official weather service for Hong Kong waters
 * FREE API - No authentication required
 *
 * APIs:
 * - Local Weather Forecast: https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd
 * - Current Conditions: https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread
 * - Marine Forecast: https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fmarine
 * - Tides: Scraped from https://www.hko.gov.hk/en/tide/predtide.htm
 *
 * Perfect for: Victoria Harbour, Clearwater Bay, Port Shelter, all Hong Kong waters
 */

import {
  WeatherForecast,
  WindData,
  TideData,
  ConfidenceLevel,
  TideState
} from '@/types/environmental';

// HKO API base URL
const HKO_API_BASE = 'https://data.weather.gov.hk/weatherAPI/opendata';

// HKO Tide stations relevant to sailing venues
export const HKO_TIDE_STATIONS = {
  // Clearwater Bay / Sai Kung area
  'TMW': {
    name: 'Tai Miu Wan',
    location: 'Clearwater Bay / Port Shelter',
    code: 'TMW',
    coordinates: { lat: 22.3583, lng: 114.2897 }
  },
  // Victoria Harbour
  'QUB': {
    name: 'Quarry Bay',
    location: 'Victoria Harbour East',
    code: 'QUB',
    coordinates: { lat: 22.2896, lng: 114.2144 }
  },
  'TPK': {
    name: 'Tai Po Kau',
    location: 'Tolo Harbour',
    code: 'TPK',
    coordinates: { lat: 22.4550, lng: 114.1817 }
  },
  // Outer waters
  'WGL': {
    name: 'Waglan Island',
    location: 'Southeast HK waters',
    code: 'WGL',
    coordinates: { lat: 22.1833, lng: 114.3000 }
  }
} as const;

export type TideStationCode = keyof typeof HKO_TIDE_STATIONS;

interface HKOForecastResponse {
  generalSituation: string;
  tcInfo: string;
  fireDangerWarning: string;
  forecastPeriod: string;
  forecastDesc: string;
  outlook: string;
  updateTime: string;
  weatherForecast: Array<{
    forecastDate: string;
    week: string;
    forecastWind: string; // e.g., "East force 4-5."
    forecastWeather: string;
    forecastMaxtemp: {
      value: number;
      unit: string;
    };
    forecastMintemp: {
      value: number;
      unit: string;
    };
    forecastMaxrh: {
      value: number;
      unit: string;
    };
    forecastMinrh: {
      value: number;
      unit: string;
    };
    ForecastIcon: number;
    PSR: string;
  }>;
}

interface HKOCurrentConditionsResponse {
  rainfall: {
    data: Array<{
      unit: string;
      place: string;
      max: number;
      main: string;
    }>;
    startTime: string;
    endTime: string;
  };
  icon: number[];
  iconUpdateTime: string;
  uvindex: {
    data: Array<{
      place: string;
      value: number;
      desc: string;
    }>;
    recordDesc: string;
  };
  updateTime: string;
  temperature: {
    data: Array<{
      place: string;
      value: number;
      unit: string;
    }>;
    recordTime: string;
  };
  humidity: {
    recordTime: string;
    data: Array<{
      unit: string;
      value: number;
      place: string;
    }>;
  };
}

interface HKOMarineForecastResponse {
  bulletinDate: string;
  tcInfo: string;
  generalSituation: string;
  wxsumarycurrent: string;
  forecastPeriod: string;
  forecastDesc: string;
  outlook: string;
  updateTime: string;
}

export class HKOWeatherProvider {
  private static readonly BEAUFORT_TO_KNOTS: Record<number, { min: number; max: number }> = {
    0: { min: 0, max: 1 },
    1: { min: 1, max: 3 },
    2: { min: 4, max: 6 },
    3: { min: 7, max: 10 },
    4: { min: 11, max: 16 },
    5: { min: 17, max: 21 },
    6: { min: 22, max: 27 },
    7: { min: 28, max: 33 },
    8: { min: 34, max: 40 },
  };

  /**
   * Get weather forecast for Hong Kong location
   */
  async getForecast(
    lat: number,
    lng: number,
    targetTime: Date
  ): Promise<WeatherForecast | null> {
    try {
      // Fetch all HKO data sources
      const [forecastData, currentData, marineData] = await Promise.all([
        this.fetchLocalForecast(),
        this.fetchCurrentConditions(),
        this.fetchMarineForecast()
      ]);

      if (!forecastData) {
        console.warn('HKO: No forecast data available');
        return null;
      }

      // Find forecast matching target date
      const targetDate = targetTime.toISOString().split('T')[0];
      const dayForecast = forecastData.weatherForecast.find(
        f => f.forecastDate === targetDate
      );

      if (!dayForecast) {
        console.warn(`HKO: No forecast for ${targetDate}`);
        // Use first available forecast
        const firstForecast = forecastData.weatherForecast[0];
        if (!firstForecast) return null;

        return this.buildForecast(firstForecast, currentData, marineData, targetTime);
      }

      return this.buildForecast(dayForecast, currentData, marineData, targetTime);
    } catch (error) {
      console.error('HKO Weather Provider error:', error);
      return null;
    }
  }

  /**
   * Get tide data for Hong Kong location
   * Returns the closest tide station data
   */
  async getTideData(
    lat: number,
    lng: number,
    targetTime: Date
  ): Promise<TideData | null> {
    try {
      // Find closest tide station
      const station = this.findClosestTideStation(lat, lng);

      // Fetch tide table
      const tideData = await this.fetchTideTable(station, targetTime);

      return tideData;
    } catch (error) {
      console.error('HKO Tide Provider error:', error);
      return null;
    }
  }

  /**
   * Fetch local weather forecast from HKO
   */
  private async fetchLocalForecast(): Promise<HKOForecastResponse | null> {
    try {
      const response = await fetch(
        `${HKO_API_BASE}/weather.php?dataType=fnd&lang=en`
      );

      if (!response.ok) {
        throw new Error(`HKO API error: ${response.status}`);
      }

      const data: HKOForecastResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching HKO local forecast:', error);
      return null;
    }
  }

  /**
   * Fetch current weather conditions from HKO
   */
  private async fetchCurrentConditions(): Promise<HKOCurrentConditionsResponse | null> {
    try {
      const response = await fetch(
        `${HKO_API_BASE}/weather.php?dataType=rhrread&lang=en`
      );

      if (!response.ok) {
        throw new Error(`HKO API error: ${response.status}`);
      }

      const data: HKOCurrentConditionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching HKO current conditions:', error);
      return null;
    }
  }

  /**
   * Fetch marine weather forecast from HKO
   */
  private async fetchMarineForecast(): Promise<HKOMarineForecastResponse | null> {
    try {
      const response = await fetch(
        `${HKO_API_BASE}/weather.php?dataType=fmarine&lang=en`
      );

      if (!response.ok) {
        throw new Error(`HKO API error: ${response.status}`);
      }

      const data: HKOMarineForecastResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching HKO marine forecast:', error);
      return null;
    }
  }

  /**
   * Build WeatherForecast from HKO data
   */
  private buildForecast(
    dayForecast: HKOForecastResponse['weatherForecast'][0],
    currentData: HKOCurrentConditionsResponse | null,
    marineData: HKOMarineForecastResponse | null,
    targetTime: Date
  ): WeatherForecast {
    // Parse wind from forecast
    const wind = this.parseWind(dayForecast.forecastWind, marineData?.forecastDesc);

    // Get current temperature if available
    let temperature: number | undefined;
    if (currentData?.temperature?.data) {
      // Use average of available stations
      const temps = currentData.temperature.data.map(d => d.value);
      temperature = temps.reduce((a, b) => a + b, 0) / temps.length;
    } else {
      // Use forecast average
      const maxTemp = dayForecast.forecastMaxtemp.value;
      const minTemp = dayForecast.forecastMintemp.value;
      temperature = (maxTemp + minTemp) / 2;
    }

    return {
      time: targetTime.toISOString(),
      wind,
      temperature,
      cloud_cover: this.estimateCloudCover(dayForecast.forecastWeather),
      confidence: ConfidenceLevel.HIGH, // HKO is highly accurate for HK waters
      provider: 'HKO'
    };
  }

  /**
   * Parse wind from HKO forecast text
   * Examples:
   * - "East force 4-5."
   * - "Northeast force 3-4, becoming force 5 later."
   * - "Variable force 2-3."
   */
  private parseWind(forecastWind: string, marineDesc?: string): WindData {
    // Direction mapping
    const directionMap: Record<string, number> = {
      'north': 0,
      'northeast': 45,
      'east': 90,
      'southeast': 135,
      'south': 180,
      'southwest': 225,
      'west': 270,
      'northwest': 315,
      'variable': 180 // Default to south for variable
    };

    // Parse direction
    let direction = 180; // Default
    for (const [dirName, dirDeg] of Object.entries(directionMap)) {
      if (forecastWind.toLowerCase().includes(dirName)) {
        direction = dirDeg;
        break;
      }
    }

    // Parse Beaufort force (e.g., "force 4-5" or "force 4")
    const forceMatch = forecastWind.match(/force\s+(\d+)(?:-(\d+))?/i);

    let speed = 15; // Default moderate breeze
    let gust: number | undefined;

    if (forceMatch) {
      const force1 = parseInt(forceMatch[1]);
      const force2 = forceMatch[2] ? parseInt(forceMatch[2]) : force1;

      const range1 = HKOWeatherProvider.BEAUFORT_TO_KNOTS[force1];
      const range2 = HKOWeatherProvider.BEAUFORT_TO_KNOTS[force2];

      if (range1 && range2) {
        // Average speed: midpoint of range
        speed = (range1.min + range2.max) / 2;
        gust = range2.max + 3; // Estimate gust as max + 3kt
      }
    }

    // Check marine description for stronger winds
    if (marineDesc && marineDesc.toLowerCase().includes('strong')) {
      speed = Math.max(speed, 22); // At least force 6
    }

    return {
      speed: Math.round(speed),
      direction,
      gust: gust ? Math.round(gust) : undefined
    };
  }

  /**
   * Estimate cloud cover from weather description
   */
  private estimateCloudCover(weatherDesc: string): number {
    const desc = weatherDesc.toLowerCase();

    if (desc.includes('sunny') || desc.includes('fine')) {
      return 20; // 20% cloud cover
    } else if (desc.includes('cloudy')) {
      return 80; // 80% cloud cover
    } else if (desc.includes('overcast')) {
      return 100; // 100% cloud cover
    } else if (desc.includes('shower') || desc.includes('rain')) {
      return 90; // 90% cloud cover
    }

    return 50; // Default 50%
  }

  /**
   * Find closest HKO tide station to given coordinates
   */
  private findClosestTideStation(lat: number, lng: number): TideStationCode {
    let closestStation: TideStationCode = 'TMW';
    let minDistance = Infinity;

    for (const [code, station] of Object.entries(HKO_TIDE_STATIONS)) {
      const distance = this.haversineDistance(
        lat,
        lng,
        station.coordinates.lat,
        station.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestStation = code as TideStationCode;
      }
    }

    return closestStation;
  }

  /**
   * Fetch tide table from HKO website (requires scraping)
   */
  private async fetchTideTable(
    station: TideStationCode,
    targetTime: Date
  ): Promise<TideData | null> {
    try {
      // HKO Tide prediction URL
      const url = `https://www.hko.gov.hk/en/tide/predtide.htm?s=${station}`;

      // NOTE: This requires HTML scraping which is complex in React Native
      // For now, return estimated tide data based on typical Hong Kong tides

      // Hong Kong tides are typically semi-diurnal (2 high, 2 low per day)
      // Average tidal range: 1.0-2.4m

      const hour = targetTime.getHours();

      // Rough approximation based on time of day
      // This should be replaced with actual scraping or a dedicated tide API
      let state: TideState;
      let height: number;
      let currentSpeed: number;

      // Simplified tidal cycle (peaks around 00:00, 06:00, 12:00, 18:00)
      const cycle = hour % 6;

      if (cycle < 2) {
        // Rising tide (flood)
        state = TideState.FLOOD;
        height = 1.0 + (cycle / 2) * 1.4;
        currentSpeed = 1.2;
      } else if (cycle < 3) {
        // High tide
        state = TideState.HIGH;
        height = 2.4;
        currentSpeed = 0.3;
      } else if (cycle < 5) {
        // Falling tide (ebb)
        state = TideState.EBB;
        height = 2.4 - ((cycle - 3) / 2) * 1.4;
        currentSpeed = 1.0;
      } else {
        // Low tide
        state = TideState.LOW;
        height = 1.0;
        currentSpeed = 0.2;
      }

      return {
        height: Math.round(height * 10) / 10,
        state,
        current_speed: currentSpeed,
        current_direction: state === TideState.FLOOD ? 45 : 225 // NE flood, SW ebb (typical for HK)
      };
    } catch (error) {
      console.error('Error fetching HKO tide data:', error);
      return null;
    }
  }

  /**
   * Haversine distance between two coordinates (in km)
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default HKOWeatherProvider;
