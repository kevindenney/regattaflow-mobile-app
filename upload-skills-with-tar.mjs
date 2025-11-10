#!/usr/bin/env node

/**
 * Upload skills using proper tar archives
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

const SKILLS_DIR = path.join(__dirname, 'skills');
const TEMP_DIR = path.join(__dirname, '.skill-temp');

const SKILLS = [
  'race-strategy-analyst',
  'tidal-opportunism-analyst',
  'slack-window-planner',
  'current-counterplay-advisor'
];

async function createTarArchive(skillName) {
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    console.log(`❌ SKILL.md not found for ${skillName}`);
    return null;
  }

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const tempSkillDir = path.join(TEMP_DIR, skillName);
  const tarFile = path.join(TEMP_DIR, `${skillName}.tar`);

  try {
    // Create temp directory for this skill
    if (fs.existsSync(tempSkillDir)) {
      fs.rmSync(tempSkillDir, { recursive: true });
    }
    fs.mkdirSync(tempSkillDir, { recursive: true });

    // Copy SKILL.md to temp directory
    fs.copyFileSync(skillFile, path.join(tempSkillDir, 'SKILL.md'));

    // Create tar archive with SKILL.md at root
    await execAsync(`tar -cf "${tarFile}" -C "${tempSkillDir}" SKILL.md`);

    return tarFile;

  } catch (error) {
    console.log(`❌ Error creating tar:`, error.message);
    return null;
  }
}

async function uploadSkill(skillName) {
  console.log(`📤 Uploading '${skillName}'...`);

  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');
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

  // Create tar archive
  const tarFile = await createTarArchive(skillName);
  if (!tarFile) {
    return null;
  }

  try {
    // Create FormData
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('name', name);
    formData.append('description', description);

    // Add the tar file
    formData.append('files[]', fs.createReadStream(tarFile), {
      filename: `${skillName}.tar`,
      contentType: 'application/x-tar'
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
      console.log('   Full error:', JSON.stringify(error, null, 2));
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

async function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
}

async function main() {
  console.log('🚀 Skill Upload with Tar Archives\n');

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

  await cleanup();
  console.log('✅ Done!\n');
}

main().catch(console.error);
