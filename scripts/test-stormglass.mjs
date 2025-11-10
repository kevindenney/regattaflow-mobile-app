#!/usr/bin/env node

/**
 * Storm Glass API Test Script
 * Tests connectivity and data fetching from Storm Glass API
 */

import axios from 'axios';
import 'dotenv/config';

const API_KEY = process.env.EXPO_PUBLIC_STORMGLASS_API_KEY;
const BASE_URL = 'https://api.stormglass.io/v2';

// Test locations
const TEST_LOCATIONS = {
  'San Francisco Bay': { lat: 37.8199, lng: -122.4783 },
  'Newport, RI': { lat: 41.4901, lng: -71.3128 },
  'Hong Kong': { lat: 22.2793, lng: 114.1628 },
  'Sydney Harbour': { lat: -33.8568, lng: 151.2153 },
};

console.log('🌊 Storm Glass API Test\n');
console.log('='.repeat(60));

// Check API key
if (!API_KEY) {
  console.error('❌ EXPO_PUBLIC_STORMGLASS_API_KEY not found in .env');
  console.log('\nPlease add your Storm Glass API key to .env:');
  console.log('EXPO_PUBLIC_STORMGLASS_API_KEY=your_api_key_here');
  process.exit(1);
}

console.log(`✅ API Key found: ${API_KEY.substring(0, 20)}...${API_KEY.substring(API_KEY.length - 10)}\n`);

/**
 * Test weather endpoint
 */
async function testWeatherEndpoint(location, locationName) {
  console.log(`\n📍 Testing weather for ${locationName}...`);
  console.log(`   Coordinates: ${location.lat}, ${location.lng}`);

  try {
    const params = [
      'windSpeed',
      'windDirection',
      'gust',
      'waveHeight',
      'wavePeriod',
      'waveDirection',
      'swellHeight',
      'swellPeriod',
      'swellDirection',
      'airTemperature',
      'waterTemperature',
      'pressure',
      'cloudCover',
      'humidity',
      'precipitation',
      'visibility',
      'currentSpeed',
      'currentDirection',
    ].join(',');

    const response = await axios.get(`${BASE_URL}/weather/point`, {
      params: {
        lat: location.lat,
        lng: location.lng,
        params,
      },
      headers: {
        'Authorization': API_KEY,
      },
      timeout: 10000,
    });

    const data = response.data;

    console.log('   ✅ Weather data received');
    console.log(`   📊 Forecast hours: ${data.hours.length}`);
    console.log(`   💰 API Cost: ${data.meta.cost}`);
    console.log(`   📈 Daily Quota: ${data.meta.requestCount}/${data.meta.dailyQuota}`);

    if (data.hours.length > 0) {
      const firstHour = data.hours[0];
      console.log(`\n   Current Conditions (${new Date(firstHour.time).toLocaleString()}):`);

      if (firstHour.windSpeed?.[0]) {
        const windSpeedMs = firstHour.windSpeed[0].value;
        const windSpeedKnots = (windSpeedMs * 1.943844).toFixed(1);
        const windDir = firstHour.windDirection?.[0]?.value?.toFixed(0) || 'N/A';
        console.log(`   🌬️  Wind: ${windSpeedKnots} knots from ${windDir}°`);
      }

      if (firstHour.waveHeight?.[0]) {
        const waveHeight = firstHour.waveHeight[0].value.toFixed(1);
        console.log(`   🌊 Wave Height: ${waveHeight}m`);
      }

      if (firstHour.waterTemperature?.[0]) {
        const waterTemp = firstHour.waterTemperature[0].value.toFixed(1);
        console.log(`   🌡️  Water Temp: ${waterTemp}°C`);
      }

      if (firstHour.airTemperature?.[0]) {
        const airTemp = firstHour.airTemperature[0].value.toFixed(1);
        console.log(`   🌡️  Air Temp: ${airTemp}°C`);
      }

      if (firstHour.currentSpeed?.[0]) {
        const currentSpeed = (firstHour.currentSpeed[0].value * 1.943844).toFixed(1);
        console.log(`   🌊 Current: ${currentSpeed} knots`);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('   ❌ Weather test failed:', error.response?.data || error.message);
    return { success: false, error };
  }
}

/**
 * Test tide extremes endpoint
 */
async function testTideEndpoint(location, locationName) {
  console.log(`\n🌊 Testing tide extremes for ${locationName}...`);

  try {
    const start = Math.floor(Date.now() / 1000);
    const end = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000); // 7 days

    const response = await axios.get(`${BASE_URL}/tide/extremes/point`, {
      params: {
        lat: location.lat,
        lng: location.lng,
        start,
        end,
      },
      headers: {
        'Authorization': API_KEY,
      },
      timeout: 10000,
    });

    const data = response.data;

    console.log('   ✅ Tide data received');
    console.log(`   📊 Extremes: ${data.data.length}`);
    console.log(`   💰 API Cost: ${data.meta.cost}`);
    console.log(`   📍 Station: ${data.meta.station.name} (${data.meta.station.distance.toFixed(1)}km away)`);

    if (data.data.length > 0) {
      console.log('\n   Next 3 tide extremes:');
      for (let i = 0; i < Math.min(3, data.data.length); i++) {
        const extreme = data.data[i];
        const time = new Date(extreme.time).toLocaleString();
        const icon = extreme.type === 'high' ? '⬆️' : '⬇️';
        console.log(`   ${icon} ${extreme.type.toUpperCase()}: ${extreme.height.toFixed(2)}m at ${time}`);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('   ❌ Tide test failed:', error.response?.data || error.message);
    return { success: false, error };
  }
}

/**
 * Test current endpoint
 */
async function testCurrentEndpoint(location, locationName) {
  console.log(`\n🌀 Testing ocean currents for ${locationName}...`);

  try {
    const end = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000); // 24 hours

    const response = await axios.get(`${BASE_URL}/current/point`, {
      params: {
        lat: location.lat,
        lng: location.lng,
        params: 'currentSpeed,currentDirection',
        end,
      },
      headers: {
        'Authorization': API_KEY,
      },
      timeout: 10000,
    });

    const data = response.data;

    console.log('   ✅ Current data received');
    console.log(`   📊 Hours: ${data.hours.length}`);
    console.log(`   💰 API Cost: ${data.meta.cost}`);

    if (data.hours.length > 0) {
      const firstHour = data.hours[0];
      if (firstHour.currentSpeed?.[0] && firstHour.currentDirection?.[0]) {
        const speedKnots = (firstHour.currentSpeed[0].value * 1.943844).toFixed(2);
        const direction = firstHour.currentDirection[0].value.toFixed(0);
        console.log(`   🌊 Current: ${speedKnots} knots towards ${direction}°`);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('   ❌ Current test failed:', error.response?.data || error.message);
    return { success: false, error };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = {
    weather: 0,
    tide: 0,
    current: 0,
    total: 0,
  };

  // Test one location thoroughly
  const testLocation = TEST_LOCATIONS['San Francisco Bay'];
  const locationName = 'San Francisco Bay';

  console.log(`\n🧪 Running comprehensive tests on ${locationName}\n`);

  // Test weather
  const weatherResult = await testWeatherEndpoint(testLocation, locationName);
  if (weatherResult.success) results.weather++;
  results.total++;

  // Test tide
  const tideResult = await testTideEndpoint(testLocation, locationName);
  if (tideResult.success) results.tide++;
  results.total++;

  // Test current
  const currentResult = await testCurrentEndpoint(testLocation, locationName);
  if (currentResult.success) results.current++;
  results.total++;

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  console.log(`   Weather API: ${results.weather > 0 ? '✅' : '❌'} ${results.weather}/1 passed`);
  console.log(`   Tide API:    ${results.tide > 0 ? '✅' : '❌'} ${results.tide}/1 passed`);
  console.log(`   Current API: ${results.current > 0 ? '✅' : '❌'} ${results.current}/1 passed`);
  console.log(`\n   Overall: ${results.weather + results.tide + results.current}/${results.total} tests passed`);

  if (weatherResult.success) {
    const quota = weatherResult.data.meta;
    console.log(`\n   📈 API Usage: ${quota.requestCount}/${quota.dailyQuota} requests today`);
    console.log(`   💰 Remaining: ${quota.dailyQuota - quota.requestCount} requests`);
  }

  console.log('\n' + '='.repeat(60));

  if (results.weather + results.tide + results.current === results.total) {
    console.log('\n✅ All tests passed! Storm Glass integration is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test script failed:', error);
  process.exit(1);
});
