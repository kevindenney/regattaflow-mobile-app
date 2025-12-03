#!/usr/bin/env node
/**
 * Test script to verify tuning guide fallback is working
 */

import { DEFAULT_GUIDES } from './data/default-tuning-guides.ts';

// Test class name normalization
function normalizeClassKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const CLASS_ALIASES = {
  dragon: 'dragon',
  internationaldragon: 'dragon',
  dragons: 'dragon',
  j70: 'j70',
  j70class: 'j70',
  etchells: 'etchells',
  etchells22: 'etchells',
  ilca: 'ilca7',
  ilca7: 'ilca7',
  laser: 'ilca7',
  laserstandard: 'ilca7',
  optimist: 'optimist',
  oppi: 'optimist',
};

function getDefaultGuidesForClass(className) {
  if (!className) {
    return [];
  }

  const normalized = normalizeClassKey(className);
  const aliasKey = CLASS_ALIASES[normalized] || normalized;

  console.log(`Input: "${className}"`);
  console.log(`Normalized: "${normalized}"`);
  console.log(`Alias key: "${aliasKey}"`);
  console.log(`Found in DEFAULT_GUIDES: ${!!DEFAULT_GUIDES[aliasKey]}`);

  return DEFAULT_GUIDES[aliasKey] || [];
}

// Test various Dragon class names
const testNames = [
  'Dragon',
  'dragon',
  'International Dragon',
  'DRAGON',
  'Dragons',
];

console.log('=== Testing Dragon Class Name Matching ===\n');

testNames.forEach((name) => {
  console.log(`\nTesting: "${name}"`);
  console.log('---');
  const guides = getDefaultGuidesForClass(name);
  console.log(`Guides found: ${guides.length}`);
  if (guides.length > 0) {
    guides.forEach((guide) => {
      console.log(`  - ${guide.title} (${guide.sections.length} sections)`);
      guide.sections.forEach((section, idx) => {
        const settingsCount = section.settings ? Object.keys(section.settings).length : 0;
        console.log(`    ${idx + 1}. ${section.title} (${settingsCount} settings)`);
      });
    });
  }
});

console.log('\n=== Dragon Guide Details ===\n');
const dragonGuides = DEFAULT_GUIDES.dragon || [];
if (dragonGuides.length > 0) {
  const guide = dragonGuides[0];
  console.log(`Title: ${guide.title}`);
  console.log(`Source: ${guide.source}`);
  console.log(`Sections: ${guide.sections.length}`);

  guide.sections.forEach((section, idx) => {
    console.log(`\nSection ${idx + 1}: ${section.title}`);
    console.log(`  Wind: ${section.conditions?.windSpeed || 'N/A'}`);
    console.log(`  Points: ${section.conditions?.points || 'N/A'}`);
    console.log(`  Settings: ${section.settings ? Object.keys(section.settings).length : 0}`);
    if (section.settings) {
      Object.keys(section.settings).slice(0, 3).forEach((key) => {
        console.log(`    - ${key}: ${section.settings[key]}`);
      });
    }
  });
}
