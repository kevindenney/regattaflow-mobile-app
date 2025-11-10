const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@gluestack-ui',
          'nativewind',
          'maplibre-gl', // Transform import.meta in maplibre-gl
        ],
      },
    },
    argv
  );

  // Customize the config before returning it
  // Increase memory limit for large builds
  config.performance = {
    ...config.performance,
    maxAssetSize: 1024 * 1024 * 5, // 5MB
    maxEntrypointSize: 1024 * 1024 * 5, // 5MB
  };

  // Add custom loader to transform import.meta in maplibre-gl
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];

  config.module.rules.push({
    test: /\.js$/,
    include: /node_modules\/maplibre-gl/,
    use: {
      loader: 'string-replace-loader',
      options: {
        search: 'import.meta.url',
        replace: '"file://placeholder"',
        flags: 'g'
      }
    }
  });

  return config;
};
