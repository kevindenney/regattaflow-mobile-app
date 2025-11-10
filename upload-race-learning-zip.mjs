#!/usr/bin/env node

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

async function uploadSkill() {
  console.log('🚀 Uploading race-learning-analyst skill from zip...\n');

  const zipPath = '/tmp/race-learning-analyst.zip';
  
  if (!fs.existsSync(zipPath)) {
    console.log('❌ Zip file not found at:', zipPath);
    return;
  }

  const name = 'race-learning-analyst';
  const description = 'Learns recurring post-race patterns and delivers personalized "keep doing / focus next" coaching summaries for each sailor';

  console.log(`Name: ${name}`);
  console.log(`Description: ${description}`);
  console.log(`Zip file: ${zipPath}\n`);

  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    // Upload the zip file
    formData.append('files[]', fs.createReadStream(zipPath), {
      filename: 'race-learning-analyst.zip',
      contentType: 'application/zip'
    });

    console.log('Uploading to Anthropic API...');

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
