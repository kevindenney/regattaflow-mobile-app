#!/usr/bin/env node
/**
 * Debug why North Sails guide isn't being used
 */

import { DEFAULT_GUIDES, getDefaultGuidesForClass } from './data/default-tuning-guides.ts';

// Simulate the exact flow
const className = 'Dragon';
const averageWindSpeed = 9;
const pointsOfSail = 'upwind';

console.log('🔍 Debug: Tuning Guide Lookup\n');
console.log('Input Parameters:');
console.log(`  className: "${className}"`);
console.log(`  averageWindSpeed: ${averageWindSpeed} knots`);
console.log(`  pointsOfSail: "${pointsOfSail}"\n`);

// Step 1: Get fallback guides
const guides = getDefaultGuidesForClass(className);
console.log(`Step 1: getDefaultGuidesForClass("${className}")`);
console.log(`  Result: ${guides.length} guide(s) found`);
if (guides.length > 0) {
  guides.forEach((guide, idx) => {
    console.log(`  Guide ${idx + 1}: ${guide.title}`);
    console.log(`    Sections: ${guide.sections.length}`);
  });
}
console.log();

if (guides.length === 0) {
  console.log('❌ PROBLEM: No guides found for Dragon class!');
  process.exit(1);
}

// Step 2: Collect candidate sections
const guide = guides[0];
console.log(`Step 2: Collect candidate sections from "${guide.title}"`);

const candidateSections = [];
guide.sections.forEach((section, idx) => {
  const hasSettings = section.settings && Object.keys(section.settings).length > 0;

  console.log(`\n  Section ${idx + 1}: ${section.title}`);
  console.log(`    Wind: ${section.conditions?.windSpeed}`);
  console.log(`    Points: ${section.conditions?.points}`);
  console.log(`    Settings: ${hasSettings ? Object.keys(section.settings).length : 0}`);

  if (!hasSettings) {
    console.log(`    ⚠️  Skipped: No settings`);
    return;
  }

  // Calculate score (matching RaceTuningService.scoreSection logic)
  let score = 0;

  // Point of sail scoring
  if (section.conditions?.points) {
    if (pointsOfSail && pointsOfSail !== 'all') {
      const normalizedPoints = section.conditions.points.toLowerCase();
      if (normalizedPoints.includes(pointsOfSail)) {
        score += 15;
        console.log(`    +15 points (point of sail match)`);
      } else {
        score -= 5;
        console.log(`    -5 points (point of sail mismatch: "${normalizedPoints}" vs "${pointsOfSail}")`);
      }
    } else {
      score += 5;
      console.log(`    +5 points (has point of sail)`);
    }
  }

  // Wind speed scoring
  if (averageWindSpeed && section.conditions?.windSpeed) {
    const windText = section.conditions.windSpeed.toLowerCase().replace(/knots?|kts?/g, '').trim();
    const numbers = windText.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];

    let range = null;
    if (numbers.length >= 2) {
      range = { min: Math.min(numbers[0], numbers[1]), max: Math.max(numbers[0], numbers[1]) };
    } else if (numbers.length === 1) {
      range = { min: numbers[0] - 2, max: numbers[0] + 2 };
    }

    if (range) {
      console.log(`    Wind range: ${range.min}-${range.max} kts`);
      if (averageWindSpeed >= range.min && averageWindSpeed <= range.max) {
        score += 25;
        console.log(`    +25 points (wind speed match: ${averageWindSpeed} in ${range.min}-${range.max})`);
      } else {
        const distance = averageWindSpeed < range.min ? range.min - averageWindSpeed : averageWindSpeed - range.max;
        const points = Math.max(10 - distance, 0);
        score += points;
        console.log(`    +${points} points (wind speed close: distance ${distance})`);
      }
    }
  }

  // Settings count scoring
  const settingsCount = Object.keys(section.settings).length;
  const settingsPoints = Math.min(settingsCount * 2, 10);
  score += settingsPoints;
  console.log(`    +${settingsPoints} points (${settingsCount} settings)`);

  console.log(`    TOTAL SCORE: ${score}`);

  candidateSections.push({ section, score });
});

console.log(`\n\nStep 3: Candidate sections summary`);
console.log(`  Total candidates: ${candidateSections.length}`);

if (candidateSections.length === 0) {
  console.log('\n❌ PROBLEM: No candidate sections with settings!');
  console.log('   This would trigger AI-only generation.\n');
  process.exit(1);
}

candidateSections.sort((a, b) => b.score - a.score);
console.log(`\n  Top candidate: ${candidateSections[0].section.title}`);
console.log(`  Score: ${candidateSections[0].score}`);
console.log(`  Settings count: ${Object.keys(candidateSections[0].section.settings).length}`);
console.log(`\n✅ This section SHOULD be used for tuning recommendations!`);

console.log('\n🎯 Expected output:');
console.log(`  Guide Source: ${guide.source}`);
console.log(`  Section Title: ${candidateSections[0].section.title}`);
console.log(`  Sample settings:`);
const topSettings = Object.entries(candidateSections[0].section.settings).slice(0, 3);
topSettings.forEach(([key, value]) => {
  console.log(`    - ${key}: ${value}`);
});
