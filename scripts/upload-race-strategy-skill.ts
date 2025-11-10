/**
 * CLI tool to upload the race-strategy-analyst Claude Skill
 *
 * This script creates the proper folder structure required by Anthropic Skills API
 * and uploads the skill to your Anthropic account.
 *
 * Run with: npx tsx scripts/upload-race-strategy-skill.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SKILL_CONTENT = `# Race Strategy Analyst

Expert sailing race strategist with championship tactics expertise.

## Core Knowledge
- Shift mathematics & wind strategy (oscillating shifts, lift/header response)
- Starting techniques (line bias, time-distance-speed, acceleration zones)
- Upwind tactics (layline discipline, current integration, fleet positioning)
- Mark rounding excellence (wide entry/tight exit, traffic management)
- Downwind strategy (VMG optimization, shift detection, wave riding)
- Covering & split distance (loose cover, RegattaFlow Playbook's 1/3 rule)
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

Expert frameworks from RegattaFlow Playbook, RegattaFlow Coach, Hans Fogh, Kevin Cox.`;

async function uploadRaceStrategySkill() {
  console.log('🏁 Uploading race-strategy-analyst Claude Skill\n');

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ No API key found in .env file');
    console.error('   Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('✅ API key found');

  const anthropic = new Anthropic({
    apiKey: apiKey
  });

  // Create temporary directory structure
  const tempDir = path.join(__dirname, '..', 'temp-skill-upload');
  const skillFilePath = path.join(tempDir, 'SKILL.md');

  try {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write skill content to SKILL.md
    fs.writeFileSync(skillFilePath, SKILL_CONTENT, 'utf-8');
    console.log(`✅ Created skill file: ${skillFilePath}\n`);

    // Check if skill already exists
    console.log('📋 Checking for existing skills...');
    const listResponse = await anthropic.beta.skills.list({
      betas: ['skills-2025-10-02']
    } as any);

    const skills = (listResponse as any).data || [];
    const existingSkill = skills.find((s: any) => s.name === 'race-strategy-analyst');

    if (existingSkill) {
      console.log(`⚠️ Skill 'race-strategy-analyst' already exists with ID: ${existingSkill.id}`);
      console.log('   To update, you would need to delete and re-upload (manual process)\n');

      // Display the skill ID for the app to use
      console.log('✅ Use this skill ID in your app:');
      console.log(`   Skill ID: ${existingSkill.id}\n`);

      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
      return;
    }

    // Create FormData with the file
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('name', 'race-strategy-analyst');
    formData.append('description', 'Expert sailing race strategist combining RegattaFlow Playbook and RegattaFlow Coach frameworks with championship execution techniques');

    // IMPORTANT: API expects 'files[]' (array notation)
    // The filename must be exactly "SKILL.md" and appear to be in top-level folder
    formData.append('files[]', fs.createReadStream(skillFilePath), {
      filename: 'SKILL.md'
      // Don't set filepath - let it default
    });

    console.log('📤 Uploading skill to Anthropic...');

    // Direct HTTP POST since the SDK doesn't support proper file uploads
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.anthropic.com/v1/skills', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        ...formData.getHeaders()
      },
      body: formData as any
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to upload skill:');
      console.error(JSON.stringify(result, null, 2));
      throw new Error(`API returned ${response.status}`);
    }

    const skillId = (result as any).id;
    console.log(`\n✅ Skill uploaded successfully!`);
    console.log(`   Skill ID: ${skillId}\n`);

    console.log('📝 Next steps:');
    console.log('   1. Copy the Skill ID above');
    console.log('   2. Update your app configuration with this skill ID');
    console.log('   3. The RaceStrategyEngine will now use this skill for enhanced strategies\n');

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✅ Cleanup complete');

  } catch (error: any) {
    console.error('\n❌ Error uploading skill:', error);

    if (error.response) {
      console.error('Response:', await error.response.text());
    }

    // Clean up even on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    process.exit(1);
  }
}

// Run the upload
uploadRaceStrategySkill();
