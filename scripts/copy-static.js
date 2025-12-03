// Copy custom static assets from /public into the Expo web export (/dist)
// and reorganize build output for /regattaflow base path
// Ensures service workers and fonts are available in Vercel deployments.

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');
const regattaflowDir = path.join(distDir, 'regattaflow');
const tempDir = path.join(__dirname, '..', 'dist-temp');

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

async function moveToBasePath() {
  // Move all dist contents to dist/regattaflow for base path support
  console.log('[copy-static] Reorganizing build output for /regattaflow base path...');
  
  // Step 1: Move dist to temp
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.renameSync(distDir, tempDir);
  
  // Step 2: Create new dist with regattaflow subdirectory
  fs.mkdirSync(distDir, { recursive: true });
  fs.renameSync(tempDir, regattaflowDir);
  
  console.log('[copy-static] Moved build output to dist/regattaflow/');
}

async function main() {
  try {
    // First, reorganize dist/ into dist/regattaflow/
    if (fs.existsSync(distDir)) {
      await moveToBasePath();
    }

    // Copy public/ assets to dist/regattaflow/
    if (fs.existsSync(publicDir)) {
      await copyRecursive(publicDir, regattaflowDir);
      console.log('[copy-static] Copied public/ into dist/regattaflow/');
    } else {
      console.warn('[copy-static] public/ directory not found, skipping copy.');
    }
  } catch (error) {
    console.error('[copy-static] Failed to process static assets:', error);
    process.exit(1);
  }
}

main();
