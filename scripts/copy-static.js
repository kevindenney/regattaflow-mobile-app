// Copy custom static assets from /public into the Expo web export (/dist)
// Ensures service workers and fonts are available in Vercel deployments.

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

async function copyRecursive(src, dest) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  await fs.promises.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    // Copy public/ assets to dist/
    if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
      await copyRecursive(publicDir, distDir);
      console.log('[copy-static] Copied public/ into dist/');
    } else if (!fs.existsSync(publicDir)) {
      console.warn('[copy-static] public/ directory not found, skipping copy.');
    } else {
      console.warn('[copy-static] dist/ directory not found, skipping copy.');
    }
  } catch (error) {
    console.error('[copy-static] Failed to process static assets:', error);
    process.exit(1);
  }
}

main();
