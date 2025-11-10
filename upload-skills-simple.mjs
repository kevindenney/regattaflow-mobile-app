#!/usr/bin/env node

/**
 * Simple skill upload - just send SKILL.md content directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Removed line:

const SKILLS_DIR = path.join(__dirname, 'skills');

const SKILLS = [
  'race-strategy-analyst',
  'tidal-opportunism-analyst',
  'slack-window-planner',
  'current-counterplay-advisor'
];

async function ensureDependencies() {
  try {
    await import('form-data');
    await import('axios');
  } catch (e) {
    console.log('📦 Installing dependencies...\n');
    const { execSync } = await import('child_process');
    execSync('npm install form-data axios', { stdio: 'inherit' });
    console.log('');
  }
}

async function uploadSkill(skillName) {
  console.log(`\n📤 Uploading '${skillName}'...`);

  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    console.log(`❌ SKILL.md not found`);
    return null;
  }

  const skillContent = fs.readFileSync(skillFile, 'utf-8');

  // Extract metadata from YAML frontmatter
  const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
  let name = skillName;
  let description = '';

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    const descMatch = frontmatter.match(/description:\s*(.+)/);

    if (nameMatch) name = nameMatch[1].trim();
    if (descMatch) description = descMatch[1].trim();
  }

  console.log(`   Name: ${name}`);
  console.log(`   Description: ${description.substring(0, 60)}...`);

  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();

    // Add metadata
    formData.append('name', name);
    formData.append('description', description);

    // Add SKILL.md as a Buffer (not a file stream)
    formData.append('files[]', Buffer.from(skillContent), {
      filename: 'SKILL.md',
      contentType: 'text/markdown'
    });

    console.log(`   Uploading to Anthropic...`);

    const response = await axios.post('https://api.anthropic.com/v1/skills', formData, {
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY,
        ...formData.getHeaders()
      }
    });

    console.log(`✅ Success! Skill ID: ${response.data.id}`);
    return response.data.id;

  } catch (error) {
    if (error.response) {
      console.log(`❌ Error:`, error.response.data?.error?.message || 'Unknown error');
      if (error.response.data) {
        console.log('   Details:', JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.log(`❌ Error:`, error.message);
    }
    return null;
  }
}

async function main() {
  console.log('🚀 RegattaFlow Skill Upload (Simple)\n');
  console.log('='.repeat(60));

  await ensureDependencies();

  let successCount = 0;

  for (const skillName of SKILLS) {
    const skillId = await uploadSkill(skillName);
    if (skillId) successCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Uploaded ${successCount}/${SKILLS.length} skills successfully!\n`);
}

main().catch(console.error);
