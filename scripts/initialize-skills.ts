/**
 * Initialize Claude Skills
 *
 * This script uploads all built-in skill definitions to Anthropic via the Edge Function proxy.
 * Run this script when:
 * - Setting up the app for the first time
 * - After updating skill definitions
 * - After clearing the skills cache
 *
 * Usage:
 *   npx ts-node scripts/initialize-skills.ts
 */

import { SkillManagementService } from '../services/ai/SkillManagementService';

async function initializeAllSkills() {
  console.log('🏁 Starting skill initialization...\n');

  const service = new SkillManagementService();
  const results: Record<string, string | null> = {};

  // Initialize all built-in skills
  const skills = [
    {
      key: 'race-strategy-analyst',
      method: () => service.initializeRaceStrategySkill()
    },
    {
      key: 'boat-tuning-analyst',
      method: () => service.initializeBoatTuningSkill()
    },
    {
      key: 'tidal-opportunism-analyst',
      method: () => service.initializeTidalOpportunismSkill()
    },
    {
      key: 'slack-window-planner',
      method: () => service.initializeSlackWindowSkill()
    },
    {
      key: 'current-counterplay-advisor',
      method: () => service.initializeCurrentCounterplaySkill()
    }
  ];

  // Upload each skill
  for (const skill of skills) {
    console.log(`\n📤 Initializing skill: ${skill.key}`);
    try {
      const skillId = await skill.method();
      results[skill.key] = skillId;

      if (skillId) {
        console.log(`✅ ${skill.key}: ${skillId}`);
      } else {
        console.warn(`⚠️ ${skill.key}: Failed to initialize (returned null)`);
      }
    } catch (error) {
      console.error(`❌ ${skill.key}: Error -`, error);
      results[skill.key] = null;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Skill Initialization Summary');
  console.log('='.repeat(60));

  const successful = Object.values(results).filter(id => id !== null).length;
  const failed = Object.values(results).filter(id => id === null).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${skills.length}`);

  console.log('\nSkill IDs:');
  for (const [key, id] of Object.entries(results)) {
    console.log(`  ${key}: ${id || 'FAILED'}`);
  }

  // List all skills to verify
  console.log('\n' + '='.repeat(60));
  console.log('📋 Verifying registered skills...');
  console.log('='.repeat(60));

  try {
    const allSkills = await service.listSkills();
    console.log(`\nFound ${allSkills.length} registered skills:`);
    allSkills.forEach(skill => {
      console.log(`  - ${skill.name} (${skill.id})`);
      console.log(`    ${skill.description}`);
    });
  } catch (error) {
    console.error('❌ Failed to list skills:', error);
  }

  console.log('\n✨ Skill initialization complete!\n');

  // Return success if at least one skill was uploaded
  process.exit(successful > 0 ? 0 : 1);
}

// Run the initialization
initializeAllSkills().catch((error) => {
  console.error('❌ Fatal error during skill initialization:', error);
  process.exit(1);
});
