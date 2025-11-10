/**
 * Upload Claude Skills directly to Anthropic API
 *
 * This script uploads skills using direct HTTP calls to the Anthropic API,
 * bypassing the SDK which doesn't support the Skills beta API well.
 */

import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';

interface SkillDefinition {
  name: string;
  description: string;
  filePath: string | null;
  content?: string;
}

const SKILLS: SkillDefinition[] = [
  {
    name: 'tidal-opportunism-analyst',
    description: 'Identifies current-driven opportunities, eddies, and anchoring decisions using bathymetry and WorldTides intel',
    filePath: path.join(__dirname, '../skills/tidal-opportunism-analyst/SKILL.md'),
  },
  {
    name: 'slack-window-planner',
    description: 'Builds maneuver timelines around upcoming slack, high, and low water windows',
    filePath: path.join(__dirname, '../skills/slack-window-planner/SKILL.md'),
  },
  {
    name: 'current-counterplay-advisor',
    description: 'Advises on current-based tactics against opponents (lee bow, cover, split timing)',
    filePath: path.join(__dirname, '../skills/current-counterplay-advisor/SKILL.md'),
  },
];

async function uploadSkill(skill: SkillDefinition): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  console.log(`\n📤 Uploading: ${skill.name}`);

  // Read skill content
  let content: string;
  if (skill.content) {
    content = skill.content;
  } else if (skill.filePath && fs.existsSync(skill.filePath)) {
    content = fs.readFileSync(skill.filePath, 'utf-8');
  } else {
    throw new Error(`Skill file not found: ${skill.filePath}`);
  }

  // Create FormData with proper file metadata
  const formData = new FormData();
  formData.append('name', skill.name);
  formData.append('description', skill.description);

  // Add the file as a buffer with proper filename and path
  formData.append('files[]', Buffer.from(content, 'utf-8'), {
    filename: 'SKILL.md',
    contentType: 'text/markdown',
    // This is the key - we need to make it look like it's from a top-level directory
    filepath: 'SKILL.md',
  });

  const response = await fetch(`${ANTHROPIC_API_BASE}/skills`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'skills-2025-10-02',
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`❌ Failed to upload ${skill.name}`);
    console.error(`Status: ${response.status} ${response.statusText}`);
    console.error(`Response: ${responseText}`);
    throw new Error(`Upload failed: ${responseText}`);
  }

  const result = JSON.parse(responseText);
  console.log(`✅ Success! Skill ID: ${result.id}`);
  return result;
}

async function main() {
  console.log('🚀 Uploading Claude Skills to Anthropic\n');
  console.log('This will upload the following skills:');
  SKILLS.forEach(skill => {
    console.log(`  - ${skill.name}`);
  });
  console.log('');

  const results: Record<string, any> = {};

  for (const skill of SKILLS) {
    try {
      const result = await uploadSkill(skill);
      results[skill.name] = result;

      // Wait a bit between uploads to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`Error uploading ${skill.name}:`, error.message);
      results[skill.name] = { error: error.message };
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary');
  console.log('='.repeat(60));

  const successful = Object.values(results).filter(r => r.id).length;
  const failed = SKILLS.length - successful;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${SKILLS.length}`);

  console.log('\nResults:');
  for (const [name, result] of Object.entries(results)) {
    if (result.id) {
      console.log(`  ✅ ${name}: ${result.id}`);
    } else {
      console.log(`  ❌ ${name}: ${result.error || 'Unknown error'}`);
    }
  }

  console.log('');
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
