/**
 * Test script for Claude Skills API
 * Run with: npx tsx test-skills-api.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testSkillsAPI() {
  console.log('🧪 Testing Claude Skills API...\n');

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ No API key found in .env file');
    return;
  }

  console.log('✅ API key found:', apiKey.substring(0, 20) + '...');

  const anthropic = new Anthropic({
    apiKey: apiKey
  });

  try {
    // Test 1: List existing skills
    console.log('\n📋 Test 1: Listing existing skills...');
    const response = await anthropic.beta.skills.list({
      betas: ['skills-2025-10-02']
    } as any);

    const skills = (response as any).data || [];
    console.log(`✅ Found ${skills.length} skills`);

    if (skills.length > 0) {
      skills.forEach((skill: any) => {
        console.log(`  - ${skill.name} (ID: ${skill.id})`);
      });
    }

    // Test 2: Create a simple test skill
    console.log('\n📤 Test 2: Creating a test skill...');

    const skillContent = `# Test Skill
This is a test skill for RegattaFlow.
It should be deleted after testing.`;

    const blob = new Blob([skillContent], { type: 'text/markdown' });
    const file = new File([blob], 'SKILL.md', { type: 'text/markdown' });

    Object.defineProperty(file, 'webkitRelativePath', {
      writable: true,
      value: 'SKILL.md'
    });

    try {
      const createResponse = await anthropic.beta.skills.create({
        name: 'regattaflow-test-skill',
        description: 'Test skill for debugging',
        files: [file],
        betas: ['skills-2025-10-02']
      } as any);

      const skillId = (createResponse as any).id;
      console.log(`✅ Test skill created with ID: ${skillId}`);

      // Clean up: Delete the test skill
      console.log('\n🗑️ Cleaning up test skill...');
      // Note: There's no delete endpoint in the current beta API
      console.log('ℹ️ Manual cleanup may be required via Anthropic Console');

    } catch (createError: any) {
      if (createError.message?.includes('already exists')) {
        console.log('⚠️ Test skill already exists (this is OK)');
      } else {
        console.error('❌ Failed to create test skill:', createError.message);
        throw createError;
      }
    }

    // Test 3: Try to upload race-strategy-analyst skill
    console.log('\n📤 Test 3: Creating race-strategy-analyst skill...');

    const raceStrategyContent = `# Race Strategy Analyst

Expert sailing race strategist with championship tactics expertise.

## Core Knowledge
- Shift mathematics & wind strategy (oscillating shifts, lift/header response)
- Starting techniques (line bias, time-distance-speed, acceleration zones)
- Upwind tactics (layline discipline, current integration, fleet positioning)
- Mark rounding excellence (wide entry/tight exit, traffic management)
- Downwind strategy (VMG optimization, shift detection, wave riding)
- Covering & split distance (loose cover, Gladstone's 1/3 rule)
- Current & tidal strategy (timing legs, lee-bow technique)
- Championship execution (risk management, consistency, psychology)

## Output Requirements
Always provide: THEORY (quantified framework), EXECUTION (step-by-step how), CONFIDENCE (0-100%), CHAMPION STORY (when relevant)

## Key Principles
1. Speed First - never sacrifice boat speed unless covering
2. Clear Air - worth 5-10 boat lengths advantage
3. Tack on Headers - immediate response to >5° headers
4. Minimize Tacks - each costs 2-3 boat lengths
5. Laylines are Defensive - approach late with options
6. Current > Wind - in tidal areas, current outweighs shifts
7. Conservative = Consistent - series racing rewards top-third finishes

Expert frameworks from Kevin Gladstone, Kevin Colgate, Hans Fogh, Kevin Cox.`;

    const raceStrategyBlob = new Blob([raceStrategyContent], { type: 'text/markdown' });
    const raceStrategyFile = new File([raceStrategyBlob], 'SKILL.md', { type: 'text/markdown' });

    Object.defineProperty(raceStrategyFile, 'webkitRelativePath', {
      writable: true,
      value: 'SKILL.md'
    });

    try {
      const raceStrategyResponse = await anthropic.beta.skills.create({
        name: 'race-strategy-analyst',
        description: 'Expert sailing race strategist combining Kevin Gladstone and Kevin Colgate frameworks with championship execution techniques',
        files: [raceStrategyFile],
        betas: ['skills-2025-10-02']
      } as any);

      const raceSkillId = (raceStrategyResponse as any).id;
      console.log(`✅ Race strategy skill created with ID: ${raceSkillId}`);

    } catch (raceError: any) {
      if (raceError.message?.includes('already exists')) {
        console.log('✅ Race strategy skill already exists');

        // Try to get the existing skill ID
        const existingSkills = await anthropic.beta.skills.list({
          betas: ['skills-2025-10-02']
        } as any);

        const raceSkill = ((existingSkills as any).data || []).find(
          (s: any) => s.name === 'race-strategy-analyst'
        );

        if (raceSkill) {
          console.log(`   ID: ${raceSkill.id}`);
        }
      } else {
        console.error('❌ Failed to create race strategy skill:', raceError.message);
        throw raceError;
      }
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error);
    if (error.status) {
      console.error('   Status:', error.status);
    }
    if (error.message) {
      console.error('   Message:', error.message);
    }
    if (error.error) {
      console.error('   Error details:', JSON.stringify(error.error, null, 2));
    }
  }
}

// Run the test
testSkillsAPI();
