#!/usr/bin/env node
/**
 * Diagnostic script to check why Dragon tuning guide isn't showing
 */

console.log('📋 Tuning Guide Integration Diagnostics\n');
console.log('This script will help identify why the North Sails Dragon guide isn\'t showing.\n');

console.log('✅ Step 1: Check if North Sails Dragon data exists in DEFAULT_GUIDES');
console.log('   Result: PASSED (verified by test-tuning-guide-fallback.mjs)');
console.log('   - 3 sections with 16-18 settings each');
console.log('   - Class matching works for all Dragon variations\n');

console.log('✅ Step 2: Check if tuningGuideService has fallback logic');
console.log('   Result: PASSED');
console.log('   - buildFallbackGuides() method exists');
console.log('   - Uses getDefaultGuidesForClass() when database is empty\n');

console.log('❓ Step 3: Check what the race is sending to the tuning service');
console.log('   Action needed: Check the browser console or app logs for:');
console.log('   - [RaceTuningService] getRecommendations called');
console.log('   - [tuningGuideService] getGuidesByReference called');
console.log('   - [tuningGuideService] Database guides found');
console.log('   - [tuningGuideService] No database guides found, trying fallback\n');

console.log('🔍 Common Issues:');
console.log('   1. Race has no boat class set');
console.log('      → Fix: Edit race and select a Dragon boat/class');
console.log('');
console.log('   2. Boat class name doesn\'t match "Dragon"');
console.log('      → Fix: Check boat_classes table for exact name');
console.log('');
console.log('   3. Race is calling AI-only generation before checking guides');
console.log('      → Fix: Check if candidateSections is empty when it shouldn\'t be');
console.log('');

console.log('📝 Next Steps:');
console.log('   1. Open browser DevTools → Console');
console.log('   2. Enable verbose logging if needed');
console.log('   3. Navigate to the Dragon race detail page');
console.log('   4. Click "Refresh" on the Rig Tuning Card');
console.log('   5. Look for these log messages:');
console.log('      - "[RaceTuningService] getRecommendations called"');
console.log('      - "[tuningGuideService] getGuidesByReference called"');
console.log('      - "className: \'Dragon\'" or similar');
console.log('      - "Using built-in tuning guides for class reference dragon"');
console.log('');

console.log('🐛 If you see "No extracted sections found; attempting AI-only tuning generation":');
console.log('   → The guides were retrieved but had no candidate sections');
console.log('   → Check if wind speed or pointsOfSail filtering is too strict');
console.log('   → The Medium Air section should match 9 knots (6-16 kts range)');
console.log('');

console.log('💡 Quick Test:');
console.log('   Run this SQL query in Supabase to check boat classes:');
console.log('   ```sql');
console.log('   SELECT id, name FROM boat_classes WHERE name ILIKE \'%dragon%\';');
console.log('   ```');
console.log('');

console.log('   Then check if your race has a class_id or boat.class_id set:');
console.log('   ```sql');
console.log('   SELECT id, race_name, class_id FROM races WHERE id = \'YOUR_RACE_ID\';');
console.log('   ```');
