// Copy custom static assets from /public into the Expo web export (/dist)
// Ensures service workers and fonts are available in Vercel deployments.

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'public');
const targetDir = path.join(__dirname, '..', 'dist');

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
    const exists = fs.existsSync(sourceDir);
    if (!exists) {
      console.warn('[copy-static] public/ directory not found, skipping copy.');
      return;
    }

    await copyRecursive(sourceDir, targetDir);
    console.log('[copy-static] Copied public/ into dist/');
  } catch (error) {
    console.error('[copy-static] Failed to copy static assets:', error);
    process.exit(1);
  }
}

main();
