#!/usr/bin/env node

import fs from 'fs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

async function uploadSkill() {
  console.log('🚀 Uploading race-learning-analyst skill...\n');

  const zipPath = '/tmp/race-learning-analyst-final.zip';
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

    console.log('Uploading to Anthropic Skills API...');

    const response = await axios.post('https://api.anthropic.com/v1/skills', formData, {
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY,
        ...formData.getHeaders()
      }
    });

    console.log('\n✅ SUCCESS! Skill uploaded!');
    console.log('Skill ID:', response.data.id);
    console.log('\nFull response:', JSON.stringify(response.data, null, 2));
    return response.data.id;

  } catch (error) {
    if (error.response) {
      console.log('\n❌ UPLOAD FAILED');
      console.log('Error:', error.response.data?.error?.message || 'Unknown error');
      console.log('Status:', error.response.status);
      console.log('Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('\n❌ ERROR:', error.message);
    }
    process.exit(1);
  }
}

uploadSkill();
