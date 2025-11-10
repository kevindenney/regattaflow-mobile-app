#!/usr/bin/env node

import fs from 'fs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ||
  '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';

async function uploadSkill() {
  console.log('🚀 Uploading race-learning-analyst skill...\n');

  const zipPath = '/tmp/race-learning-analyst-proper.zip';
  const name = 'race-learning-analyst';
  const description = 'Learns recurring post-race patterns and delivers personalized "keep doing / focus next" coaching summaries for each sailor';

  console.log(`Name: ${name}`);
  console.log(`Description: ${description}\n`);

  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('files[]', fs.createReadStream(zipPath));

    console.log('Uploading...');

    const response = await axios.post('https://api.anthropic.com/v1/skills', formData, {
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Success! Skill ID:', response.data.id);
    console.log('\nResponse:', JSON.stringify(response.data, null, 2));
    return response.data.id;

  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.data?.error?.message || 'Unknown error');
      console.log('Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

uploadSkill();
