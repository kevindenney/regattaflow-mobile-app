#!/usr/bin/env node

/**
 * This script is kept for backwards compatibility and now delegates to the
 * Storm Glass test harness. WeatherAPI.com has been fully retired.
 */

console.warn('⚠️  WeatherAPI.com has been deprecated. Running Storm Glass smoke test instead...');

await import('./scripts/test-stormglass.mjs');
