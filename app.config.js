/**
 * Expo App Configuration
 * Environment variables are loaded automatically by Expo from .env files
 * and available via process.env.EXPO_PUBLIC_*
 */

module.exports = {
  expo: {
    name: 'RegattaFlow',
    slug: 'regattaflow-app',
    owner: 'denneyke',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'regattaflow',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    deep: {
      scheme: 'regattaflow',
      hosts: ['auth', 'regattaflow.io'],
    },
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.regattaflow.app',
      buildNumber: '2',
      usesAppleSignIn: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'RegattaFlow needs your location to track race performance and provide accurate wind and current data.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'RegattaFlow needs your location to track race performance and provide accurate wind and current data.',
        NSCameraUsageDescription:
          'RegattaFlow needs camera access to capture race moments and scan course marks.',
        NSMicrophoneUsageDescription:
          'RegattaFlow needs microphone access for voice notes and coaching feedback.',
        NSPhotoLibraryUsageDescription:
          'RegattaFlow needs photo library access to save and share race media.',
        NSSpeechRecognitionUsageDescription:
          'RegattaFlow uses speech recognition for voice commands and hands-free operation while sailing.',
      },
    },
    android: {
      package: 'com.regattaflow.app',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_ANDROID_API_KEY',
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
      name: 'RegattaFlow - Sailing Race Strategy & Performance',
      shortName: 'RegattaFlow',
      description:
        'AI-powered sailing race strategy, performance tracking, and venue intelligence for competitive sailors worldwide',
      lang: 'en',
      scope: '/',
      themeColor: '#0066CC',
      backgroundColor: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
    },
    plugins: [
      'expo-router',
      './plugins/withAndroidDependencyFix',
      './plugins/withGoogleMaps',
      'expo-apple-authentication',
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: 'com.googleusercontent.apps.176626806015-s39mdhh67n9u2vpmo62jacrcif0g4g0d',
        },
      ],
    ],
    updates: {
      enabled: false,
    },
    experiments: {
      typedRoutes: true,
    },
    // Expose environment variables via Constants.expoConfig.extra
    extra: {
      eas: {
        projectId: 'bab702c1-4ae8-42aa-ae6a-7982de755dd7',
      },
      stormglassApiKey: process.env.EXPO_PUBLIC_STORMGLASS_API_KEY,
      openWeatherMapApiKey: process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      anthropicApiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    },
  },
};
