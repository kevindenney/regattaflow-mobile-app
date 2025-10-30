// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize Metro bundler performance and memory usage
config.transformer = {
  ...config.transformer,
  // Reduce memory usage by limiting worker pool
  maxWorkers: 4,
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
