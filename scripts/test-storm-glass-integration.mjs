#!/usr/bin/env node

/**
 * Storm Glass API Integration Test
 * Tests the Storm Glass service with real API calls
 */

import 'dotenv/config';

// Test configuration
const TEST_LOCATIONS = [
  { name: 'San Francisco Bay', lat: 37.8199, lng: -122.4783 },
  { name: 'Newport, RI', lat: 41.4901, lng: -71.3128 },
  { name: 'Sydney Harbor', lat: -33.8568, lng: 151.2153 }
];

const STORM_GLASS_API_KEY = process.env.EXPO_PUBLIC_STORMGLASS_API_KEY || process.env.STORM_GLASS_API_KEY;
const BASE_URL = 'https://api.stormglass.io/v2';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function testWeatherPoint(location) {
  log(`Testing weather data for ${location.name}...`, 'cyan');

  const params = new URLSearchParams({
    lat: location.lat,
    lng: location.lng,
    params: 'windSpeed,windDirection,gust,waveHeight,wavePeriod,waveDirection,airTemperature,waterTemperature,currentSpeed,currentDirection'
  });

  try {
    const response = await fetch(`${BASE_URL}/weather/point?${params}`, {
      headers: { 'Authorization': STORM_GLASS_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const firstHour = data.hours?.[0];

    if (!firstHour) {
      throw new Error('No weather data returned');
    }

    log('✓ Weather data retrieved successfully', 'green');
    console.log('  Sample data (first hour):');
    console.log(`    Time: ${firstHour.time}`);
    console.log(`    Wind: ${firstHour.windSpeed?.noaa?.toFixed(1) || 'N/A'} m/s @ ${firstHour.windDirection?.noaa?.toFixed(0) || 'N/A'}°`);
    console.log(`    Gusts: ${firstHour.gust?.noaa?.toFixed(1) || 'N/A'} m/s`);
    console.log(`    Waves: ${firstHour.waveHeight?.noaa?.toFixed(1) || 'N/A'} m`);
    console.log(`    Current: ${firstHour.currentSpeed?.noaa?.toFixed(2) || 'N/A'} m/s`);
    console.log(`    Air Temp: ${firstHour.airTemperature?.noaa?.toFixed(1) || 'N/A'}°C`);
    console.log(`    Water Temp: ${firstHour.waterTemperature?.noaa?.toFixed(1) || 'N/A'}°C`);

    return { success: true, dataPoints: data.hours.length };
  } catch (error) {
    log(`✗ Weather test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testTides(location) {
  log(`Testing tide data for ${location.name}...`, 'cyan');

  const params = new URLSearchParams({
    lat: location.lat,
    lng: location.lng
  });

  try {
    const response = await fetch(`${BASE_URL}/tide/extremes/point?${params}`, {
      headers: { 'Authorization': STORM_GLASS_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('No tide data returned');
    }

    log('✓ Tide data retrieved successfully', 'green');
    console.log(`  Found ${data.data.length} tide events`);

    // Show next 3 tide events
    const nextEvents = data.data.slice(0, 3);
    nextEvents.forEach((event, i) => {
      const time = new Date(event.time).toLocaleString();
      console.log(`    ${i + 1}. ${event.type.toUpperCase()} at ${time} (${event.height.toFixed(2)}m)`);
    });

    return { success: true, events: data.data.length };
  } catch (error) {
    log(`✗ Tide test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testAstronomyData(location) {
  log(`Testing astronomy data for ${location.name}...`, 'cyan');

  const params = new URLSearchParams({
    lat: location.lat,
    lng: location.lng
  });

  try {
    const response = await fetch(`${BASE_URL}/astronomy/point?${params}`, {
      headers: { 'Authorization': STORM_GLASS_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const today = data.data?.[0];

    if (!today) {
      throw new Error('No astronomy data returned');
    }

    log('✓ Astronomy data retrieved successfully', 'green');
    console.log('  Today\'s data:');
    console.log(`    Sunrise: ${new Date(today.sunrise).toLocaleTimeString()}`);
    console.log(`    Sunset: ${new Date(today.sunset).toLocaleTimeString()}`);
    console.log(`    Moon Phase: ${(today.moonPhase?.current * 100).toFixed(0)}%`);

    return { success: true };
  } catch (error) {
    log(`✗ Astronomy test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function checkAPICredits() {
  log('Checking API usage and limits...', 'cyan');

  try {
    // Make a minimal request to check credits via response headers
    const response = await fetch(`${BASE_URL}/weather/point?lat=37.8&lng=-122.4&params=windSpeed`, {
      headers: { 'Authorization': STORM_GLASS_API_KEY }
    });

    const remaining = response.headers.get('x-rate-limit-remaining');
    const limit = response.headers.get('x-rate-limit-limit');

    if (remaining && limit) {
      log('✓ API credits retrieved', 'green');
      console.log(`  Requests remaining: ${remaining}/${limit}`);

      const percentUsed = ((limit - remaining) / limit * 100).toFixed(1);
      if (percentUsed > 80) {
        log(`  Warning: ${percentUsed}% of daily quota used`, 'yellow');
      }
    } else {
      log('✓ API key valid (no rate limit headers)', 'green');
    }

    return { success: true };
  } catch (error) {
    log(`✗ Credit check failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  logSection('Storm Glass API Integration Test');

  // Check for API key
  if (!STORM_GLASS_API_KEY) {
    log('✗ EXPO_PUBLIC_STORMGLASS_API_KEY not found in environment', 'red');
    log('  Add it to your .env file:', 'yellow');
    log('  EXPO_PUBLIC_STORMGLASS_API_KEY=your-api-key-here', 'yellow');
    process.exit(1);
  }

  log(`Using API key: ${STORM_GLASS_API_KEY.substring(0, 20)}...`, 'blue');

  // Check API credits first
  logSection('API Usage Check');
  await checkAPICredits();

  // Test each location
  const results = {
    weather: [],
    tides: [],
    astronomy: []
  };

  for (const location of TEST_LOCATIONS) {
    logSection(`Testing: ${location.name}`);

    results.weather.push(await testWeatherPoint(location));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting

    results.tides.push(await testTides(location));
    await new Promise(resolve => setTimeout(resolve, 1000));

    results.astronomy.push(await testAstronomyData(location));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  logSection('Test Summary');

  const weatherSuccess = results.weather.filter(r => r.success).length;
  const tidesSuccess = results.tides.filter(r => r.success).length;
  const astronomySuccess = results.astronomy.filter(r => r.success).length;

  const totalTests = TEST_LOCATIONS.length * 3;
  const totalSuccess = weatherSuccess + tidesSuccess + astronomySuccess;

  log(`Weather Tests: ${weatherSuccess}/${TEST_LOCATIONS.length} passed`, weatherSuccess === TEST_LOCATIONS.length ? 'green' : 'red');
  log(`Tide Tests: ${tidesSuccess}/${TEST_LOCATIONS.length} passed`, tidesSuccess === TEST_LOCATIONS.length ? 'green' : 'red');
  log(`Astronomy Tests: ${astronomySuccess}/${TEST_LOCATIONS.length} passed`, astronomySuccess === TEST_LOCATIONS.length ? 'green' : 'red');

  console.log('\n' + '='.repeat(60));
  log(`Overall: ${totalSuccess}/${totalTests} tests passed`, totalSuccess === totalTests ? 'green' : 'yellow');
  console.log('='.repeat(60) + '\n');

  if (totalSuccess === totalTests) {
    log('🎉 All tests passed! Storm Glass integration is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }

  process.exit(totalSuccess === totalTests ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
