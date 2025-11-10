/**
 * Upload the existing race-strategy-analyst skill from skills/ directory
 *
 * This uses the comprehensive RegattaFlow Playbook + RegattaFlow Coach skill file
 * that already exists in: skills/race-strategy-analyst/SKILL.md
 *
 * Run with: npx tsx scripts/upload-skill-from-file.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function uploadExistingSkill() {
  console.log('🏁 Uploading race-strategy-analyst Claude Skill from existing file\n');

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ No API key found in .env file');
    console.error('   Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('✅ API key found');

  // Path to existing skill file
  const skillFilePath = path.join(__dirname, '..', 'skills', 'race-strategy-analyst', 'SKILL.md');

  if (!fs.existsSync(skillFilePath)) {
    console.error(`❌ Skill file not found: ${skillFilePath}`);
    process.exit(1);
  }

  console.log(`✅ Found skill file: ${skillFilePath}`);

  const anthropic = new Anthropic({
    apiKey: apiKey
  });

  try {
    // Check if skill already exists
    console.log('\n📋 Checking for existing skills...');
    const listResponse = await anthropic.beta.skills.list({
      betas: ['skills-2025-10-02']
    } as any);

    const skills = (listResponse as any).data || [];
    const existingSkill = skills.find((s: any) => s.name === 'race-strategy-analyst');

    if (existingSkill) {
      console.log(`\n✅ Skill 'race-strategy-analyst' already exists!`);
      console.log(`   Skill ID: ${existingSkill.id}\n`);

      console.log('📝 To use this skill in your app:');
      console.log('   1. The app should already be trying to find this skill');
      console.log('   2. Check your console logs for "Found existing skill" message');
      console.log('   3. If not found, there may be an API permissions issue\n');

      return;
    }

    console.log('⚠️ Skill not found, attempting to upload...\n');

    // The Anthropic SDK doesn't properly support file uploads for Skills API
    // We need to use direct HTTP with proper FormData
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('name', 'race-strategy-analyst');
    formData.append('description', 'Expert sailing race strategy analyst combining RegattaFlow Playbook\'s RegattaFlow Playbook Performance Racing Tactics with RegattaFlow Coach\'s championship execution techniques');

    // Append the file - this should work with the proper relative path
    formData.append('files[]', fs.createReadStream(skillFilePath), {
      filename: 'SKILL.md',
      contentType: 'text/markdown'
    });

    console.log('📤 Uploading skill to Anthropic via API...');
    console.log('   (This may fail due to file path restrictions)\n');

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
      console.error('\n⚠️ The Skills API requires specific file structure that may not be achievable via script.');
      console.error('\n📋 Manual upload options:');
      console.error('   1. Use Anthropic Console: https://console.anthropic.com');
      console.error('   2. Copy content from: skills/race-strategy-analyst/SKILL.md');
      console.error('   3. Create new skill named: race-strategy-analyst');
      console.error('   4. Paste the content and save\n');
      process.exit(1);
    }

    const skillId = (result as any).id;
    console.log(`\n✅ Skill uploaded successfully!`);
    console.log(`   Skill ID: ${skillId}\n`);

    console.log('📝 The app should now automatically detect and use this skill!');
    console.log('   Look for: "✅ Race strategy skill ready" in your console\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);

    console.error('\n📋 Manual upload instructions:');
    console.error('   1. Go to: https://console.anthropic.com');
    console.error('   2. Navigate to Skills section');
    console.error('   3. Create new skill:');
    console.error('      - Name: race-strategy-analyst');
    console.error('      - Description: Expert sailing race strategy analyst combining RegattaFlow Playbook\'s RegattaFlow Playbook Performance Racing Tactics with RegattaFlow Coach\'s championship execution techniques');
    console.error('   4. Copy content from: skills/race-strategy-analyst/SKILL.md');
    console.error('   5. Paste and save\n');

    console.error('   After manual upload, the app will automatically find it!\n');

    process.exit(1);
  }
}

// Run the upload
uploadExistingSkill();
