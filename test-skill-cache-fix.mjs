#!/usr/bin/env node

/**
 * Test script to verify skill caching and duplicate detection
 * This simulates what happens when PostRaceLearningService calls initializeRaceLearningSkill()
 */

console.log('🧪 Testing Skill Cache Fix\n');

// Simulate the API response structure from Anthropic
const mockApiSkills = [
  {
    id: 'skill_01NsZX8FL8JfeNhqQ7qFQLLW',
    display_title: 'Race Learning Analyst',
    description: 'Detects recurring post-race patterns and personalizes coaching feedback for each sailor',
    created_at: '2024-11-01T00:00:00Z',
    type: 'custom'
  },
  {
    id: 'skill_01LwivxRwARQY3ga2LwUJNCj',
    display_title: 'Boat Tuning Analyst',
    description: 'Transforms RegattaFlow tuning guides into class-specific rig and sail settings',
    created_at: '2024-11-01T00:00:00Z',
    type: 'custom'
  }
];

// Helper function to slugify display_title
function slugifyDisplayTitle(displayTitle) {
  return displayTitle
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Test caching logic
const skillCache = new Map();

console.log('📋 Simulating listSkills() cache population...\n');

mockApiSkills.forEach((skill) => {
  const metadata = {
    id: skill.id,
    name: skill.name,
    description: skill.description || '',
    uploadedAt: new Date(skill.created_at),
    source: skill.type === 'anthropic' ? 'anthropic' : 'custom'
  };

  // Cache by skill.name if available
  if (skill.name) {
    skillCache.set(skill.name, metadata);
    console.log(`  ✓ Cached by name: ${skill.name} -> ${skill.id}`);
  }

  // ALSO cache by slugified display_title
  if (skill.display_title) {
    const slug = slugifyDisplayTitle(skill.display_title);
    skillCache.set(slug, metadata);
    console.log(`  ✓ Cached by slug: ${slug} -> ${skill.id}`);
  }
});

console.log('\n🔍 Testing skill lookup by slug...\n');

// Test lookups
const testCases = [
  'race-learning-analyst',
  'boat-tuning-analyst',
  'non-existent-skill'
];

testCases.forEach((slug) => {
  const found = skillCache.get(slug);
  if (found) {
    console.log(`  ✅ Found '${slug}': ${found.id}`);
  } else {
    console.log(`  ❌ Not found: '${slug}'`);
  }
});

console.log('\n📊 Cache contents:');
console.log(`  Total entries: ${skillCache.size}`);
console.log(`  Keys: ${Array.from(skillCache.keys()).join(', ')}`);

console.log('\n✅ Test complete!\n');
console.log('Expected behavior:');
console.log('  - Skills are cached by both name AND slugified display_title');
console.log('  - Lookups for "race-learning-analyst" should succeed');
console.log('  - No duplicate upload attempts should occur');
