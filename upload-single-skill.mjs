#!/usr/bin/env node

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

async function createZipArchive(skillName) {
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    console.log(`❌ SKILL.md not found for ${skillName}`);
    return null;
  }

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const zipFile = path.join(TEMP_DIR, `${skillName}.zip`);
  const tempSkillDir = path.join(TEMP_DIR, skillName);

  try {
    if (fs.existsSync(zipFile)) {
      fs.unlinkSync(zipFile);
    }

    if (fs.existsSync(tempSkillDir)) {
      fs.rmSync(tempSkillDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempSkillDir, { recursive: true });

    fs.cpSync(skillDir, tempSkillDir, { recursive: true });

    await execAsync(`cd "${TEMP_DIR}" && zip -q -r "${zipFile}" "${skillName}"`);

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
      console.log(`   Full error:`, JSON.stringify(error.response.data, null, 2));
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
  const skillName = process.argv[2] || 'finishing-line-tactics';
  
  console.log('🚀 RegattaFlow Single Skill Upload\n');
  console.log('='.repeat(60));

  const skillId = await uploadSkill(skillName);
  
  await cleanup();

  console.log('\n' + '='.repeat(60));
  if (skillId) {
    console.log(`\n✅ Successfully uploaded '${skillName}'!\n`);
  } else {
    console.log(`\n❌ Failed to upload '${skillName}'\n`);
  }
}

main().catch(console.error);
