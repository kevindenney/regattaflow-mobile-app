import { Stack } from 'expo-router';

export default function ValueLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="track-races" />
      <Stack.Screen name="prepare-pro" />
      <Stack.Screen name="join-crew" />
    </Stack>
  );
}
