#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ||
  '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';

async function uploadSkill() {
  console.log('🚀 Uploading race-learning-analyst skill...\n');

  const skillFile = path.join(__dirname, 'skills/race-learning-analyst/SKILL.md');
  const skillContent = fs.readFileSync(skillFile, 'utf-8');

  // Extract metadata
  const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
  let name = 'race-learning-analyst';
  let description = '';

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    const descMatch = frontmatter.match(/description:\s*(.+)/);
    if (nameMatch) name = nameMatch[1].trim();
    if (descMatch) description = descMatch[1].trim();
  }

  console.log(`Name: ${name}`);
  console.log(`Description: ${description}\n`);

  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('files[]', Buffer.from(skillContent), {
      filename: 'SKILL.md',
      contentType: 'text/markdown'
    });

    const response = await axios.post('https://api.anthropic.com/v1/skills', formData, {
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Success! Skill ID:', response.data.id);
    console.log('\nFull response:', JSON.stringify(response.data, null, 2));
    return response.data.id;

  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.data?.error?.message || 'Unknown error');
      console.log('Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Error:', error.message);
    }
    throw error;
  }
}

uploadSkill().catch(console.error);
