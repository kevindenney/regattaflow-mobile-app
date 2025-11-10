// test-skill-upload.ts
import { skillManagementService } from './services/ai/SkillManagementService';

async function testSkillUpload() {
  console.log('🚀 Testing skill upload to Anthropic...\n');

  try {
    // Upload race strategy skill
    console.log('📤 Uploading Race Strategy Analyst skill...');
    const raceStrategyId = await skillManagementService.initializeRaceStrategySkill();

    if (raceStrategyId) {
      console.log('✅ Race Strategy Analyst uploaded! ID:', raceStrategyId);
    } else {
      console.log('❌ Failed to upload Race Strategy Analyst');
    }

    // Upload tidal skill
    console.log('\n📤 Uploading Tidal Opportunism Analyst skill...');
    const tidalId = await skillManagementService.initializeTidalOpportunismSkill();

    if (tidalId) {
      console.log('✅ Tidal Opportunism Analyst uploaded! ID:', tidalId);
    } else {
      console.log('❌ Failed to upload Tidal Opportunism Analyst');
    }

    // Upload slack window skill
    console.log('\n📤 Uploading Slack Window Planner skill...');
    const slackWindowId = await skillManagementService.initializeSlackWindowSkill();

    if (slackWindowId) {
      console.log('✅ Slack Window Planner uploaded! ID:', slackWindowId);
    } else {
      console.log('❌ Failed to upload Slack Window Planner');
    }

    // Upload current counterplay skill
    console.log('\n📤 Uploading Current Counterplay Advisor skill...');
    const counterplayId = await skillManagementService.initializeCurrentCounterplaySkill();

    if (counterplayId) {
      console.log('✅ Current Counterplay Advisor uploaded! ID:', counterplayId);
    } else {
      console.log('❌ Failed to upload Current Counterplay Advisor');
    }

    // List all skills
    console.log('\n📋 Listing all skills from Anthropic...');
    const skills = await skillManagementService.listSkills();
    console.log(`\nFound ${skills.length} total skills:`);

    skills.forEach(skill => {
      console.log(`  • ${skill.name} (${skill.source})`);
      console.log(`    ID: ${skill.id}`);
      console.log(`    Description: ${skill.description.substring(0, 80)}...`);
      console.log('');
    });

    console.log('✅ All done! Skills are ready to use.\n');

  } catch (error) {
    console.error('❌ Error during skill upload:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
    }
    process.exit(1);
  }
}

testSkillUpload().catch(console.error);
