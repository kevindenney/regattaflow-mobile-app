#!/usr/bin/env node

/**
 * Direct skill upload using local SKILL.md files
 * This script reads the actual SKILL.md files and uploads them properly
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

const SKILLS_DIR = path.join(__dirname, 'skills');

const SKILLS = [
  'race-strategy-analyst',
  'tidal-opportunism-analyst',
  'slack-window-planner',
  'current-counterplay-advisor'
];

async function uploadSkill(skillName) {
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    console.log(`❌ SKILL.md not found for ${skillName}`);
    return null;
  }

  console.log(`📤 Uploading '${skillName}'...`);

  // Read the SKILL.md file
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

  try {
    // Create FormData
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('name', name);
    formData.append('description', description);

    // Add the SKILL.md file
    formData.append('files[]', fs.createReadStream(skillFile), {
      filename: 'SKILL.md',
      contentType: 'text/markdown'
    });

    // Upload to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/skills', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.log(`❌ Error:`, error.error?.message || 'Unknown error');
      return null;
    }

    const result = await response.json();
    console.log(`✅ Success! ID: ${result.id}\n`);
    return result.id;

  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Direct Skill Upload\n');

  // Install form-data if needed
  try {
    await import('form-data');
  } catch (e) {
    console.log('📦 Installing form-data package...');
    const { execSync } = await import('child_process');
    execSync('npm install form-data', { stdio: 'inherit' });
    console.log('');
  }

  for (const skillName of SKILLS) {
    await uploadSkill(skillName);
  }

  console.log('✅ Done!\n');
}

main().catch(console.error);
