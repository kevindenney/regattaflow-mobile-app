/**
 * Test script for mock weather data
 * Run with: npx tsx test-mock-weather.ts
 */

import { generateMockForecast, generateMockWeatherAtTime, findClosestVenue } from './services/weather/mockWeatherData';

console.log('🧪 Testing Mock Weather Data\n');

// Test 1: Find closest venue
console.log('Test 1: Find Closest Venue');
console.log('─────────────────────────────');
const hongKongLat = 22.28;
const hongKongLng = 114.17;
const closestVenue = findClosestVenue(hongKongLat, hongKongLng);
console.log(`Location: ${hongKongLat}, ${hongKongLng}`);
console.log(`Closest venue: ${closestVenue.name}`);
console.log(`Wind: ${closestVenue.wind.speed} kts @ ${closestVenue.wind.direction}°`);
console.log(`Waves: ${closestVenue.waves.height}m`);
console.log(`Current: ${closestVenue.current.speed} kts @ ${closestVenue.current.direction}°\n`);

// Test 2: Generate 24-hour forecast
console.log('Test 2: Generate 24-Hour Forecast');
console.log('─────────────────────────────');
const forecast = generateMockForecast(hongKongLat, hongKongLng, 24);
console.log(`Generated ${forecast.length} hours of forecast data`);
console.log(`First hour:`);
console.log(`  Time: ${forecast[0].time}`);
console.log(`  Wind Speed: ${forecast[0].windSpeed?.noaa?.toFixed(1)} kts`);
console.log(`  Wind Direction: ${forecast[0].windDirection?.noaa?.toFixed(0)}°`);
console.log(`  Wave Height: ${forecast[0].waveHeight?.noaa?.toFixed(2)}m`);
console.log(`  Air Temp: ${forecast[0].airTemperature?.noaa?.toFixed(1)}°C`);
console.log(`  Water Temp: ${forecast[0].waterTemperature?.noaa?.toFixed(1)}°C\n`);

// Test 3: Generate weather at specific time
console.log('Test 3: Weather at Specific Time');
console.log('─────────────────────────────');
const targetTime = new Date('2025-11-05T14:00:00Z');
const weatherAtTime = generateMockWeatherAtTime(hongKongLat, hongKongLng, targetTime);
console.log(`Target time: ${targetTime.toISOString()}`);
console.log(`Wind Speed: ${weatherAtTime.windSpeed?.noaa?.toFixed(1)} kts`);
console.log(`Wind Direction: ${weatherAtTime.windDirection?.noaa?.toFixed(0)}°`);
console.log(`Gust: ${weatherAtTime.gust?.noaa?.toFixed(1)} kts`);
console.log(`Wave Height: ${weatherAtTime.waveHeight?.noaa?.toFixed(2)}m`);
console.log(`Current Speed: ${weatherAtTime.currentSpeed?.noaa?.toFixed(2)} kts\n`);

// Test 4: Test all venues
console.log('Test 4: All Available Venues');
console.log('─────────────────────────────');
const testLocations = [
  { name: 'Hong Kong', lat: 22.28, lng: 114.17 },
  { name: 'San Francisco', lat: 37.82, lng: -122.48 },
  { name: 'Newport', lat: 41.49, lng: -71.31 },
  { name: 'Sydney', lat: -33.86, lng: 151.22 },
  { name: 'Cowes', lat: 50.76, lng: -1.30 },
  { name: 'Auckland', lat: -36.84, lng: 174.74 },
];

for (const loc of testLocations) {
  const venue = findClosestVenue(loc.lat, loc.lng);
  console.log(`${loc.name}: ${venue.wind.speed} kts wind, ${venue.waves.height}m waves, ${venue.current.speed} kts current`);
}

console.log('\n✅ All tests completed successfully!');
