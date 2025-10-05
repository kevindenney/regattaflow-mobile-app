const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Handle import.meta syntax for web
config.transformer.unstable_allowRequireContext = true;

// Configure resolver for handling ES modules
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Ensure platform extensions are prioritized for web builds
if (config.resolver.sourceExts) {
  const platformExts = ['web.tsx', 'web.ts', 'web.jsx', 'web.js'];
  config.resolver.sourceExts = [
    ...platformExts,
    ...config.resolver.sourceExts.filter(ext => !platformExts.includes(ext))
  ];
}

// Block native-only modules from web builds
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // For web platform, redirect Stripe React Native to web mock
  if (platform === 'web' && moduleName === '@stripe/stripe-react-native') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/mocks/stripe-react-native.web.ts'),
    };
  }

  // Use default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

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

// Wrap with NativeWind for Tailwind CSS support
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });