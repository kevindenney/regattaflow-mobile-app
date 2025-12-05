import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const videoPath = '/Users/kdenney/Developer/betterat-sail-racing/public/video/buoy-rounding-with-annotations.mp4';
const bucketName = 'learning-assets';
const fileName = 'videos/buoy-rounding-with-annotations.mp4';

async function uploadVideo() {
  console.log('Reading video file...');
  const fileBuffer = fs.readFileSync(videoPath);
  
  console.log(`Uploading to ${bucketName}/${fileName}...`);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }

  console.log('Upload successful!');
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  console.log('Public URL:', urlData.publicUrl);
  return urlData.publicUrl;
}

uploadVideo().catch(console.error);

