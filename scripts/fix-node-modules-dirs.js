const fs = require('fs');
const path = require('path');

const problematicDirs = ['fs-extra', 'tmp'];

const nodeModules = path.join(__dirname, '..', 'node_modules');

problematicDirs.forEach((dir) => {
  const fullPath = path.join(nodeModules, dir);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    if (files.length === 0) {
      fs.rmdirSync(fullPath);
      console.log(`Removed empty directory ${fullPath}`);
    }
  }

  const globPattern = new RegExp(`^\\.${dir}-.+`);
  const matches = fs.readdirSync(nodeModules).filter((entry) => globPattern.test(entry));
  matches.forEach((entry) => {
    const entryPath = path.join(nodeModules, entry);
    fs.rmSync(entryPath, { recursive: true, force: true });
    console.log(`Removed leftover directory ${entryPath}`);
  });
});
