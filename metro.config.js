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
const originalGetTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (...args) => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  return originalGetTransformOptions(...args);
};

module.exports = config;