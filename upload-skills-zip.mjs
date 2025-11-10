#!/usr/bin/env node

/**
 * Upload skills using ZIP archives (not tar)
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

// Removed line:

const SKILLS_DIR = path.join(__dirname, 'skills');
const TEMP_DIR = path.join(__dirname, '.skill-temp');

const SKILLS = [
  'race-strategy-analyst',
  'tidal-opportunism-analyst',
  'slack-window-planner',
  'current-counterplay-advisor',
  'starting-line-mastery',
  'upwind-strategic-positioning',
  'upwind-tactical-combat',
  'downwind-speed-and-position',
  'mark-rounding-execution',
  'finishing-line-tactics'
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

async function createZipArchive(skillName) {
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

  const zipFile = path.join(TEMP_DIR, `${skillName}.zip`);
  const tempSkillDir = path.join(TEMP_DIR, skillName);

  try {
    // Remove old zip if exists
    if (fs.existsSync(zipFile)) {
      fs.unlinkSync(zipFile);
    }

    // Prepare a clean temp directory containing the skill files
    if (fs.existsSync(tempSkillDir)) {
      fs.rmSync(tempSkillDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempSkillDir, { recursive: true });

    // Copy the entire skill directory so the zip has skillName/SKILL.md structure
    fs.cpSync(skillDir, tempSkillDir, { recursive: true });

    // Zip the directory so Anthropic sees a top-level folder
    await execAsync(`cd "${TEMP_DIR}" && zip -q -r "${zipFile}" "${skillName}"`);

    // Verify the zip
    const { stdout } = await execAsync(`unzip -l "${zipFile}"`);
    console.log(`   Zip contents:\n${stdout.split('\n').slice(0, 5).join('\n')}`);

    return zipFile;

  } catch (error) {
    console.log(`❌ Error creating zip:`, error.message);
    return null;
  }
}

async function uploadSkill(skillName) {
  console.log(`\n📤 Uploading '${skillName}'...`);

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

  console.log(`   Name: ${name}`);
  console.log(`   Description: ${description.substring(0, 60)}...`);

  // Create zip archive
  const zipFile = await createZipArchive(skillName);
  if (!zipFile) {
    return null;
  }

  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('files[]', fs.createReadStream(zipFile), {
      filename: `${skillName}.zip`,
      contentType: 'application/zip'
    });

    console.log(`   Uploading to Anthropic...`);

    const response = await axios.post('https://api.anthropic.com/v1/skills', formData, {
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log(`✅ Success! Skill ID: ${response.data.id}`);
    return response.data.id;

  } catch (error) {
    if (error.response) {
      console.log(`❌ Error:`, error.response.data?.error?.message || 'Unknown error');
    } else {
      console.log(`❌ Error:`, error.message);
    }
    return null;
  }
}

async function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
}

async function main() {
  console.log('🚀 RegattaFlow Skill Upload (ZIP)\n');
  console.log('='.repeat(60));

  await ensureDependencies();

  let successCount = 0;

  for (const skillName of SKILLS) {
    const skillId = await uploadSkill(skillName);
    if (skillId) successCount++;
  }

  await cleanup();

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Uploaded ${successCount}/${SKILLS.length} skills successfully!\n`);
}

main().catch(console.error);
