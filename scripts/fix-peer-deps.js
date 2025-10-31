/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

/**
 * Adjust peer dependency ranges that lag behind React 19 so npm install
 * doesn't flood the console with warnings.
 */
function patchReactAriaCheckbox() {
  const packagePath = path.resolve(
    __dirname,
    '..',
    'node_modules',
    '@react-aria',
    'checkbox',
    'package.json'
  );

  if (!fs.existsSync(packagePath)) {
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentRange = packageJson.peerDependencies?.react;
    const desiredRange = '^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || >=19.0.0';

    if (currentRange !== desiredRange) {
      packageJson.peerDependencies = {
        ...packageJson.peerDependencies,
        react: desiredRange,
      };
      fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
      console.log('Updated @react-aria/checkbox peer dependency range for React.');
    }
  } catch (error) {
    console.warn('Unable to patch @react-aria/checkbox peer dependencies:', error);
  }
}

patchReactAriaCheckbox();
