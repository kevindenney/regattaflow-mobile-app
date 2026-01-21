#!/usr/bin/env node
/**
 * Generate RegattaFlow splash screen
 *
 * Creates a splash screen with the R mark logo centered on a white background.
 * Uses the main icon.png as the source.
 *
 * Usage: node scripts/generate-splash.mjs
 */

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Configuration
const OUTPUT_SIZE = 1024; // Output image size (square)
const LOGO_SIZE = 400;    // Logo size on splash screen
const BG_COLOR = '#ffffff';

async function generateSplash() {
  console.log('Generating splash screen...');

  // Load the existing logo
  const logoPath = join(rootDir, 'assets/images/icon.png');
  const logo = await sharp(logoPath)
    .resize(LOGO_SIZE, LOGO_SIZE)
    .toBuffer();

  // Create base white canvas
  const base = await sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 4,
      background: BG_COLOR
    }
  }).png().toBuffer();

  // Calculate logo position (centered)
  const logoX = Math.floor((OUTPUT_SIZE - LOGO_SIZE) / 2);
  const logoY = Math.floor((OUTPUT_SIZE - LOGO_SIZE) / 2);

  // Composite: base -> logo
  await sharp(base)
    .composite([
      { input: logo, top: logoY, left: logoX }
    ])
    .png()
    .toFile(join(rootDir, 'assets/images/splash-icon.png'));

  console.log('✅ Splash screen generated: assets/images/splash-icon.png');
  console.log(`   Size: ${OUTPUT_SIZE}x${OUTPUT_SIZE}`);
  console.log(`   Logo: ${LOGO_SIZE}x${LOGO_SIZE} centered at (${logoX}, ${logoY})`);
}

generateSplash().catch(console.error);
