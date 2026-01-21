#!/usr/bin/env node
/**
 * Generate RegattaFlow app icons from SVG
 *
 * Usage: node scripts/generate-icon.mjs
 *
 * Generates:
 * - icon.png (1024x1024) - Main app icon
 * - android-icon-foreground.png (1024x1024) - Adaptive icon foreground
 * - android-icon-background.png (1024x1024) - Adaptive icon background
 * - android-icon-monochrome.png (1024x1024) - Monochrome for themed icons
 * - splash-icon.png (1024x1024) - Splash screen icon
 * - favicon.png (48x48) - Web favicon
 * - logo-full.png (1024x1024) - Full logo with wordmark
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputDir = join(__dirname, '..', 'assets', 'images');

// Brand colors
const NAVY = '#0a1832';
const WHITE = '#FFFFFF';

// Main icon SVG - full design with navy background
const mainIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${NAVY}"/>
  <g transform="translate(512,512)">
    <circle cx="0" cy="0" r="360" stroke="${WHITE}" stroke-width="16" fill="none"/>
    <text x="0" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="300" font-weight="700" fill="${WHITE}">R</text>
    <path d="M-192 168 Q-115 125 -38 168 Q38 211 115 168 Q173 134 230 168" stroke="${WHITE}" stroke-width="16" fill="none" stroke-linecap="round"/>
  </g>
</svg>
`;

// Foreground SVG - R mark on transparent background (for adaptive icon)
// Centered in safe zone (inner 66% of the icon)
const foregroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512,512)">
    <circle cx="0" cy="0" r="280" stroke="${WHITE}" stroke-width="12" fill="none"/>
    <text x="0" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="230" font-weight="700" fill="${WHITE}">R</text>
    <path d="M-150 130 Q-90 97 -30 130 Q30 163 90 130 Q135 104 180 130" stroke="${WHITE}" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>
</svg>
`;

// Monochrome SVG - white mark for themed app icons (Android 13+)
const monochromeSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512,512)">
    <circle cx="0" cy="0" r="280" stroke="${WHITE}" stroke-width="12" fill="none"/>
    <text x="0" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="230" font-weight="700" fill="${WHITE}">R</text>
    <path d="M-150 130 Q-90 97 -30 130 Q30 163 90 130 Q135 104 180 130" stroke="${WHITE}" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>
</svg>
`;

// Background SVG - solid navy
const backgroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${NAVY}"/>
</svg>
`;

// Full logo SVG - R mark with "RegattaFlow" wordmark (transparent background)
const fullLogoSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Circled R mark - centered in upper portion -->
  <g transform="translate(512, 380)">
    <circle cx="0" cy="0" r="280" stroke="${NAVY}" stroke-width="12" fill="none"/>
    <text x="0" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="230" font-weight="700" fill="${NAVY}">R</text>
    <path d="M-150 130 Q-90 97 -30 130 Q30 163 90 130 Q135 104 180 130" stroke="${NAVY}" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>
  <!-- Wordmark below -->
  <text x="512" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="100" font-weight="600" fill="${NAVY}">RegattaFlow</text>
</svg>
`;

async function generateIcons() {
  console.log('Generating RegattaFlow app icons...\n');

  try {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Generate main icon (1024x1024)
    console.log('Creating icon.png (1024x1024)...');
    await sharp(Buffer.from(mainIconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(outputDir, 'icon.png'));
    console.log('  ✓ icon.png');

    // Generate splash icon (1024x1024)
    console.log('Creating splash-icon.png (1024x1024)...');
    await sharp(Buffer.from(mainIconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(outputDir, 'splash-icon.png'));
    console.log('  ✓ splash-icon.png');

    // Generate favicon (48x48)
    console.log('Creating favicon.png (48x48)...');
    await sharp(Buffer.from(mainIconSvg))
      .resize(48, 48)
      .png()
      .toFile(join(outputDir, 'favicon.png'));
    console.log('  ✓ favicon.png');

    // Generate Android adaptive icon foreground (1024x1024)
    console.log('Creating android-icon-foreground.png (1024x1024)...');
    await sharp(Buffer.from(foregroundSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(outputDir, 'android-icon-foreground.png'));
    console.log('  ✓ android-icon-foreground.png');

    // Generate Android adaptive icon background (1024x1024)
    console.log('Creating android-icon-background.png (1024x1024)...');
    await sharp(Buffer.from(backgroundSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(outputDir, 'android-icon-background.png'));
    console.log('  ✓ android-icon-background.png');

    // Generate Android monochrome icon (1024x1024)
    console.log('Creating android-icon-monochrome.png (1024x1024)...');
    await sharp(Buffer.from(monochromeSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(outputDir, 'android-icon-monochrome.png'));
    console.log('  ✓ android-icon-monochrome.png');

    // Generate full logo with wordmark (1024x1024, transparent)
    console.log('Creating logo-full.png (1024x1024)...');
    await sharp(Buffer.from(fullLogoSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(outputDir, 'logo-full.png'));
    console.log('  ✓ logo-full.png');

    console.log('\n✅ All icons generated successfully!');
    console.log(`Output directory: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
