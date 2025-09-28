const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Handle import.meta syntax for web
config.transformer.unstable_allowRequireContext = true;

// Configure resolver for handling ES modules
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Add path alias support for @ -> project root
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
};

// Add support for import.meta in web platform
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;