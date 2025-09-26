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

// Remove anchor setting for better web routing
// export const unstable_settings = {
//   anchor: '(tabs)',
// };

export default function RootLayout() {
  console.log('🎨 RootLayout: Starting render');
  console.log('🔍 RootLayout: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

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
    console.log('📁 RootLayout: Stack screens configured:', ['(auth)', '(tabs)', 'modal']);
    return (
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
