/**
 * Expo App Configuration
 * Loads environment variables from .env and exposes them via Constants.expoConfig.extra
 */

// Load environment variables
require('dotenv').config();

module.exports = {
  expo: {
    name: 'regattaflow-app',
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
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_IOS_API_KEY',
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
