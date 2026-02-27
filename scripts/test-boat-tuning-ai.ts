#!/usr/bin/env npx tsx
/**
 * Test script for the Boat Tuning AI Engine
 *
 * This script tests the complete flow:
 * 1. Fetches tuning guides for a class (e.g., J/70)
 * 2. Builds candidate sections
 * 3. Calls the AI engine with Claude skills
 * 4. Displays the recommendations
 *
 * Usage:
 *   npx tsx scripts/test-boat-tuning-ai.ts [className] [windSpeed]
 *
 * Examples:
 *   npx tsx scripts/test-boat-tuning-ai.ts J/70 12
 *   npx tsx scripts/test-boat-tuning-ai.ts Dragon 15
 *   npx tsx scripts/test-boat-tuning-ai.ts ILCA7 10
 */

import { raceTuningService } from '../services/RaceTuningService';
import { raceTuningEngine } from '../services/ai/RaceTuningEngine';

const className = process.argv[2] || 'J/70';
const windSpeed = parseFloat(process.argv[3] || '12');

console.log('🔧 Boat Tuning AI Test');
console.log('='.repeat(60));
console.log(`Class: ${className}`);
console.log(`Wind Speed: ${windSpeed} kts`);
console.log('='.repeat(60));
console.log('');

async function test() {
  try {
    // Check if AI engine is available
    console.log('1️⃣ Checking AI Engine Availability...');
    const isAvailable = raceTuningEngine.isAvailable();
    console.log(`   AI Engine Available: ${isAvailable ? '✅ YES' : '❌ NO'}`);

    if (!isAvailable) {
      console.log('   ⚠️ AI engine not available. Set ANTHROPIC_API_KEY in .env');
      console.log('   Continuing with fallback mode...');
    }

    const isSkillReady = raceTuningEngine.isSkillReady();
    console.log(`   Skill Ready: ${isSkillReady ? '✅ YES' : '⏳ INITIALIZING'}`);
    console.log('');

    // Get recommendations
    console.log('2️⃣ Fetching Tuning Recommendations...');
    const startTime = Date.now();

    const recommendations = await raceTuningService.getRecommendations({
      className,
      averageWindSpeed: windSpeed,
      pointsOfSail: 'upwind',
      limit: 2
    });

    const elapsed = Date.now() - startTime;
    console.log(`   ⏱️ Request completed in ${elapsed}ms`);
    console.log('');

    if (!recommendations || recommendations.length === 0) {
      console.log('❌ No recommendations found!');
      console.log('');
      console.log('Possible reasons:');
      console.log('  • No tuning guides exist for this class');
      console.log('  • No extracted sections match the wind conditions');
      console.log('  • AI engine failed and fallback returned empty');
      return;
    }

    console.log(`✅ Found ${recommendations.length} recommendation(s)`);
    console.log('');

    // Display each recommendation
    recommendations.forEach((rec, idx) => {
      console.log(`${'='.repeat(60)}`);
      console.log(`📋 Recommendation #${idx + 1}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Guide: ${rec.guideTitle}`);
      console.log(`Source: ${rec.guideSource}`);

      if (rec.sectionTitle) {
        console.log(`Section: ${rec.sectionTitle}`);
      }

      if (rec.conditionSummary) {
        console.log(`Conditions: ${rec.conditionSummary}`);
      }

      console.log('');
      console.log('Settings:');

      if (rec.settings && rec.settings.length > 0) {
        rec.settings.forEach(setting => {
          console.log(`  • ${setting.label}: ${setting.value}`);
        });
      } else {
        console.log('  (No settings)');
      }

      if (rec.notes) {
        console.log('');
        console.log('Notes:');
        console.log(`  ${rec.notes.split('\n').join('\n  ')}`);
      }

      console.log('');
    });

    console.log('='.repeat(60));
    console.log('✅ Test Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('❌ Test Failed!');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the test
test().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
