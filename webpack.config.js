const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@gluestack-ui', 'nativewind'],
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

  return config;
};
