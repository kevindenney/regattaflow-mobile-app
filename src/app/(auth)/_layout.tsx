import { Stack } from 'expo-router';
import { View } from 'react-native';
import { NavigationHeader } from '@/src/components/navigation/NavigationHeader';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1 }}>
      <NavigationHeader backgroundColor="#F8FAFC" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />
      </Stack>
    </View>
  );
}