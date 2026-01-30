const { withDangerousMod, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom plugin to properly configure Google Maps for react-native-maps
 * This replaces Expo's built-in Maps plugin which uses an outdated podspec name
 */
const withGoogleMaps = (config) => {
  // Add Google Maps API key to Info.plist
  config = withInfoPlist(config, (config) => {
    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      // This is the key that react-native-maps looks for
      config.modResults.GMSApiKey = apiKey;
    }
    return config;
  });

  // Modify Podfile to use correct react-native-maps setup
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');

        // Remove the auto-generated react-native-maps block that uses wrong podspec name
        // This block is added by Expo autolinking but references non-existent 'react-native-google-maps'
        podfileContent = podfileContent.replace(
          /# @generated begin react-native-maps[\s\S]*?# @generated end react-native-maps\n?/g,
          ''
        );

        // Also remove any standalone react-native-google-maps pod lines
        podfileContent = podfileContent.replace(
          /^\s*pod\s+['"]react-native-google-maps['"].*\n?/gm,
          ''
        );

        // Check if we already have react-native-maps with Google subspec
        const hasGoogleSubspec = podfileContent.includes("subspecs: ['Google']") ||
                                  podfileContent.includes('subspecs: ["Google"]');

        // If we don't have the Google subspec setup, add it
        if (!hasGoogleSubspec && !podfileContent.includes('# @generated begin react-native-maps')) {
          // Add the correct Google Maps pod setup before use_native_modules!
          const googleMapsPods = `
# Google Maps for react-native-maps (added by withGoogleMaps plugin)
rn_maps_path = File.dirname(\`node --print "require.resolve('react-native-maps/package.json')"\`)
pod 'react-native-maps', path: rn_maps_path, subspecs: ['Google']
pod 'GoogleMaps', '~> 9.0'
pod 'Google-Maps-iOS-Utils', '~> 6.0'

`;
          // Insert before use_native_modules! or use_expo_modules!
          if (podfileContent.includes('use_native_modules!')) {
            podfileContent = podfileContent.replace(
              /(\s*)(config\s*=\s*)?use_native_modules!/,
              `${googleMapsPods}$1$2use_native_modules!`
            );
          } else if (podfileContent.includes('use_expo_modules!')) {
            podfileContent = podfileContent.replace(
              /use_expo_modules!/,
              `use_expo_modules!\n${googleMapsPods}`
            );
          }
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withGoogleMaps;
