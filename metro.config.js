// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { resolve } = require('metro-resolver');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .mjs files (needed for three.js)
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'mjs'],
  assetExts: config.resolver?.assetExts?.filter(ext => ext !== 'mjs') || []
};

const defaultResolveRequest = config.resolver.resolveRequest;
const nullLoaderShimPath = path.resolve(__dirname, 'metro.loaders-null-loader.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === './null-loader.js' &&
    context.originModulePath?.includes('@loaders.gl/core/dist/index')
  ) {
    return {
      type: 'sourceFile',
      filePath: nullLoaderShimPath
    };
  }

  if (typeof defaultResolveRequest === 'function') {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return resolve(context, moduleName, platform);
};

// Optimize Metro bundler performance and memory usage
config.transformer = {
  ...config.transformer,
  // Reduce memory usage by limiting worker pool (2 workers for large projects)
  maxWorkers: 2,
  // Enable lazy bundling for better memory management
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true, // Lazy load imports to reduce initial bundle size
    },
  }),
};

// Strip console.log statements in production builds
if (process.env.NODE_ENV === 'production') {
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      ...config.transformer?.minifierConfig,
      compress: {
        ...config.transformer?.minifierConfig?.compress,
        // Remove console.log, console.debug, but keep console.warn and console.error
        drop_console: false,
        pure_funcs: [
          'console.log',
          'console.debug',
          'console.info',
        ],
      },
    },
  };
}

module.exports = config;
