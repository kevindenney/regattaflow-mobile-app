import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated'; // TODO: Re-enable when animations are needed

import { useColorScheme } from '@/hooks/use-color-scheme';

// Add debugging console logs
console.log('🚀 RootLayout: Starting to load');

let AuthProvider: any;
try {
  const authModule = require('@/src/lib/contexts/AuthContext');
  AuthProvider = authModule.AuthProvider;
  console.log('✅ RootLayout: AuthProvider loaded successfully', !!AuthProvider);
} catch (error) {
  console.error('❌ RootLayout: Failed to load AuthProvider', error);
  // Create a fallback provider
  AuthProvider = ({ children }: { children: React.ReactNode }) => {
    console.log('🔄 Using fallback AuthProvider');
    return children;
  };
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  console.log('🎨 RootLayout: Starting render');

  let colorScheme;
  try {
    colorScheme = useColorScheme();
    console.log('✅ RootLayout: useColorScheme loaded', colorScheme);
  } catch (error) {
    console.error('❌ RootLayout: useColorScheme failed', error);
    colorScheme = 'light';
  }

  try {
    console.log('🔄 RootLayout: About to return JSX');
    return (
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="results" />
            <Stack.Screen name="documents" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('❌ RootLayout: Render failed', error);
    return null;
  }
}
