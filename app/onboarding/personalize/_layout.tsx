import { Stack } from 'expo-router';

export default function PersonalizeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="boat-picker" />
      <Stack.Screen name="location-permission" />
      <Stack.Screen name="club-nearby" />
      <Stack.Screen name="find-sailors" />
    </Stack>
  );
}
