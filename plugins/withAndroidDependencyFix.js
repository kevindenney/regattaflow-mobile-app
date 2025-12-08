/**
 * Expo Config Plugin to fix Android dependency conflicts
 * Resolves AndroidX vs Android Support library conflicts
 * and ensures proper AndroidX Activity/Core versions for Stripe
 */

const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

const withAndroidDependencyFix = (config) => {
  // First, modify project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const resolutionStrategy = `
    configurations.all {
        resolutionStrategy {
            // Force AndroidX versions to resolve conflicts
            force 'androidx.activity:activity:1.9.0'
            force 'androidx.activity:activity-ktx:1.9.0'
            force 'androidx.core:core:1.13.1'
            force 'androidx.core:core-ktx:1.13.1'
            force 'androidx.versionedparcelable:versionedparcelable:1.2.0'
            force 'androidx.collection:collection:1.4.0'
            force 'androidx.fragment:fragment:1.7.1'
            force 'androidx.fragment:fragment-ktx:1.7.1'
            force 'androidx.localbroadcastmanager:localbroadcastmanager:1.1.0'
        }
        
        // Exclude old Android Support libraries that conflict with AndroidX
        exclude group: 'com.android.support', module: 'support-v4'
        exclude group: 'com.android.support', module: 'support-compat'
        exclude group: 'com.android.support', module: 'versionedparcelable'
    }
`;
      
      if (config.modResults.contents.includes('allprojects {')) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects\s*\{/,
          `allprojects {\n${resolutionStrategy}`
        );
      }
    }
    return config;
  });

  // Second, modify app-level build.gradle to add packaging options
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Add packaging options to handle duplicate META-INF files
      const packagingOptions = `
    packaging {
        resources {
            excludes += ['META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version']
            excludes += ['META-INF/DEPENDENCIES']
            excludes += ['META-INF/LICENSE']
            excludes += ['META-INF/LICENSE.txt']
            excludes += ['META-INF/license.txt']
            excludes += ['META-INF/NOTICE']
            excludes += ['META-INF/NOTICE.txt']
            excludes += ['META-INF/notice.txt']
            excludes += ['META-INF/ASL2.0']
            excludes += ['META-INF/*.kotlin_module']
            pickFirsts += ['META-INF/*']
        }
    }
`;
      
      // Find the android { block and add packaging options after it
      if (config.modResults.contents.includes('android {') && !config.modResults.contents.includes('packaging {')) {
        config.modResults.contents = config.modResults.contents.replace(
          /android\s*\{/,
          `android {\n${packagingOptions}`
        );
      }
    }
    return config;
  });

  return config;
};

module.exports = withAndroidDependencyFix;
