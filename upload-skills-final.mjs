#!/usr/bin/env node

/**
 * Upload skills using axios for proper multipart handling
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

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ||
  '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';

const SKILLS_DIR = path.join(__dirname, 'skills');
const TEMP_DIR = path.join(__dirname, '.skill-temp');

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

    console.log(`   Created tar archive: ${path.basename(tarFile)}`);
    return tarFile;

  } catch (error) {
    console.log(`❌ Error creating tar:`, error.message);
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

  // Create tar archive
  const tarFile = await createTarArchive(skillName);
  if (!tarFile) {
    return null;
  }

  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('files[]', fs.createReadStream(tarFile), {
      filename: `${skillName}.tar`,
      contentType: 'application/x-tar'
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
      if (error.response.data) {
        console.log('   Details:', JSON.stringify(error.response.data, null, 2));
      }
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

async function listSkills() {
  console.log('\n📋 Listing all skills...\n');

  try {
    const axios = (await import('axios')).default;

    const response = await axios.get('https://api.anthropic.com/v1/skills', {
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY
      }
    });

    const skills = response.data.data || [];
    console.log(`Found ${skills.length} skills:\n`);

    skills.forEach(skill => {
      console.log(`  • ${skill.name || skill.id}`);
      console.log(`    ID: ${skill.id}`);
      if (skill.description) {
        console.log(`    Description: ${skill.description.substring(0, 60)}...`);
      }
      console.log('');
    });

    return skills;
  } catch (error) {
    console.log('❌ Error listing skills:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 RegattaFlow Skill Upload\n');
  console.log('=' .repeat(60));

  await ensureDependencies();

  let successCount = 0;

  for (const skillName of SKILLS) {
    const skillId = await uploadSkill(skillName);
    if (skillId) successCount++;
  }

  await cleanup();

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Uploaded ${successCount}/${SKILLS.length} skills successfully!\n`);

  if (successCount > 0) {
    await listSkills();
  }
}

main().catch(console.error);
