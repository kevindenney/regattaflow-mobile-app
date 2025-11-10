/**
 * Mock Weather Data for Development and Fallback
 * Realistic sailing conditions for popular venues
 */

export interface MockWeatherConditions {
  lat: number;
  lng: number;
  name: string;
  wind: {
    speed: number;
    direction: number;
    gust?: number;
  };
  waves: {
    height: number;
    direction: number;
    period: number;
  };
  current: {
    speed: number;
    direction: number;
  };
  waterTemperature: number;
  airTemperature: number;
  visibility?: number;
  cloudCover?: number;
}

/**
 * Mock venue data - realistic conditions for popular sailing locations
 */
export const MOCK_VENUES: Record<string, MockWeatherConditions> = {
  // Hong Kong - Victoria Harbour
  'hong_kong': {
    lat: 22.2783,
    lng: 114.1747,
    name: 'Hong Kong',
    wind: {
      speed: 12,
      direction: 120, // SE
      gust: 16,
    },
    waves: {
      height: 0.8,
      direction: 115,
      period: 4,
    },
    current: {
      speed: 0.8,
      direction: 90,
    },
    waterTemperature: 24,
    airTemperature: 26,
    visibility: 8000,
    cloudCover: 40,
  },

  // San Francisco Bay
  'san_francisco': {
    lat: 37.8199,
    lng: -122.4783,
    name: 'San Francisco Bay',
    wind: {
      speed: 18,
      direction: 270, // W
      gust: 24,
    },
    waves: {
      height: 1.2,
      direction: 280,
      period: 5,
    },
    current: {
      speed: 1.2,
      direction: 180,
    },
    waterTemperature: 14,
    airTemperature: 16,
    visibility: 10000,
    cloudCover: 20,
  },

  // Newport, RI
  'newport': {
    lat: 41.4901,
    lng: -71.3128,
    name: 'Newport',
    wind: {
      speed: 14,
      direction: 220, // SW
      gust: 18,
    },
    waves: {
      height: 1.0,
      direction: 200,
      period: 6,
    },
    current: {
      speed: 0.6,
      direction: 45,
    },
    waterTemperature: 18,
    airTemperature: 20,
    visibility: 15000,
    cloudCover: 30,
  },

  // Sydney Harbour
  'sydney': {
    lat: -33.8568,
    lng: 151.2153,
    name: 'Sydney Harbour',
    wind: {
      speed: 15,
      direction: 45, // NE
      gust: 20,
    },
    waves: {
      height: 0.6,
      direction: 60,
      period: 4,
    },
    current: {
      speed: 0.4,
      direction: 270,
    },
    waterTemperature: 21,
    airTemperature: 24,
    visibility: 12000,
    cloudCover: 25,
  },

  // Cowes, UK (Isle of Wight)
  'cowes': {
    lat: 50.7630,
    lng: -1.2976,
    name: 'Cowes',
    wind: {
      speed: 16,
      direction: 240, // WSW
      gust: 22,
    },
    waves: {
      height: 1.5,
      direction: 250,
      period: 5,
    },
    current: {
      speed: 1.5,
      direction: 90,
    },
    waterTemperature: 15,
    airTemperature: 17,
    visibility: 8000,
    cloudCover: 60,
  },

  // Auckland, NZ
  'auckland': {
    lat: -36.8406,
    lng: 174.7400,
    name: 'Auckland',
    wind: {
      speed: 13,
      direction: 180, // S
      gust: 17,
    },
    waves: {
      height: 0.9,
      direction: 190,
      period: 5,
    },
    current: {
      speed: 0.7,
      direction: 315,
    },
    waterTemperature: 19,
    airTemperature: 21,
    visibility: 10000,
    cloudCover: 35,
  },
};

/**
 * Find the closest mock venue to given coordinates
 */
export function findClosestVenue(lat: number, lng: number): MockWeatherConditions {
  let closestVenue = MOCK_VENUES.hong_kong; // default
  let minDistance = Infinity;

  for (const venue of Object.values(MOCK_VENUES)) {
    const distance = Math.sqrt(
      Math.pow(venue.lat - lat, 2) + Math.pow(venue.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestVenue = venue;
    }
  }

  return closestVenue;
}

/**
 * Generate mock hourly forecast data
 */
export function generateMockForecast(
  lat: number,
  lng: number,
  hours: number = 24
): any[] {
  const baseConditions = findClosestVenue(lat, lng);
  const forecast = [];
  const now = new Date();

  for (let i = 0; i < hours; i++) {
    const time = new Date(now.getTime() + i * 60 * 60 * 1000);

    // Add some realistic variability
    const windVariation = (Math.random() - 0.5) * 4;
    const waveVariation = (Math.random() - 0.5) * 0.3;
    const currentVariation = (Math.random() - 0.5) * 0.2;

    forecast.push({
      time: time.toISOString(),
      airTemperature: {
        noaa: baseConditions.airTemperature + (Math.random() - 0.5) * 2,
      },
      waterTemperature: {
        noaa: baseConditions.waterTemperature + (Math.random() - 0.5) * 1,
      },
      windSpeed: {
        noaa: Math.max(0, baseConditions.wind.speed + windVariation),
      },
      windDirection: {
        noaa: baseConditions.wind.direction + (Math.random() - 0.5) * 20,
      },
      gust: {
        noaa: baseConditions.wind.gust ? baseConditions.wind.gust + windVariation + 2 : undefined,
      },
      waveHeight: {
        noaa: Math.max(0, baseConditions.waves.height + waveVariation),
      },
      waveDirection: {
        noaa: baseConditions.waves.direction + (Math.random() - 0.5) * 15,
      },
      wavePeriod: {
        noaa: baseConditions.waves.period + (Math.random() - 0.5) * 1,
      },
      currentSpeed: {
        noaa: Math.max(0, baseConditions.current.speed + currentVariation),
      },
      currentDirection: {
        noaa: baseConditions.current.direction + (Math.random() - 0.5) * 30,
      },
      visibility: {
        noaa: baseConditions.visibility || 10000,
      },
      cloudCover: {
        noaa: baseConditions.cloudCover || 30,
      },
    });
  }

  return forecast;
}

/**
 * Generate mock weather at specific time
 */
export function generateMockWeatherAtTime(
  lat: number,
  lng: number,
  time: Date
): any {
  const baseConditions = findClosestVenue(lat, lng);

  // Add some variability based on time of day
  const hour = time.getHours();
  const tempModifier = Math.sin((hour - 6) * Math.PI / 12) * 3; // Warmer during day

  return {
    time: time.toISOString(),
    airTemperature: {
      noaa: baseConditions.airTemperature + tempModifier,
    },
    waterTemperature: {
      noaa: baseConditions.waterTemperature,
    },
    windSpeed: {
      noaa: baseConditions.wind.speed,
    },
    windDirection: {
      noaa: baseConditions.wind.direction,
    },
    gust: {
      noaa: baseConditions.wind.gust,
    },
    waveHeight: {
      noaa: baseConditions.waves.height,
    },
    waveDirection: {
      noaa: baseConditions.waves.direction,
    },
    wavePeriod: {
      noaa: baseConditions.waves.period,
    },
    currentSpeed: {
      noaa: baseConditions.current.speed,
    },
    currentDirection: {
      noaa: baseConditions.current.direction,
    },
    visibility: {
      noaa: baseConditions.visibility || 10000,
    },
    cloudCover: {
      noaa: baseConditions.cloudCover || 30,
    },
  };
}
