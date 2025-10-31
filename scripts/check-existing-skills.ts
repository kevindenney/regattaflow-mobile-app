/**
 * Check what skills are already uploaded to your Anthropic account
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkSkills() {
  console.log('🔍 Checking your Anthropic Skills...\n');

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ No API key found');
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.beta.skills.list({
      betas: ['skills-2025-10-02']
    } as any);

    const skills = (response as any).data || [];

    console.log(`Found ${skills.length} skills:\n`);

    if (skills.length === 0) {
      console.log('❌ No skills uploaded yet\n');
      console.log('📋 Next steps:');
      console.log('   1. Go to: https://console.anthropic.com');
      console.log('   2. Navigate to Skills section (if available)');
      console.log('   3. Create skill named: race-strategy-analyst');
      console.log('   4. Copy content from: skills/race-strategy-analyst/SKILL.md\n');
      return;
    }

    skills.forEach((skill: any, index: number) => {
      console.log(`${index + 1}. ${skill.name || skill.id}`);
      console.log(`   ID: ${skill.id}`);
      console.log(`   Type: ${skill.type || 'custom'}`);
      if (skill.description) {
        console.log(`   Description: ${skill.description}`);
      }
      console.log('');
    });

    // Check for race-strategy-analyst specifically
    const raceSkill = skills.find((s: any) =>
      s.name?.includes('race-strategy') ||
      s.name?.includes('sailing') ||
      s.name?.includes('regatta')
    );

    if (raceSkill) {
      console.log('✅ Found racing-related skill!');
      console.log(`   Use this ID in your app: ${raceSkill.id}\n`);
    } else {
      console.log('⚠️ No racing-related skill found');
      console.log('   You may need to upload the race-strategy-analyst skill manually\n');
    }

  } catch (error: any) {
    console.error('❌ Error listing skills:', error.message);
    if (error.status === 403 || error.status === 401) {
      console.error('\n⚠️ API key may not have access to Skills API (beta feature)');
    }
  }
}

checkSkills();
