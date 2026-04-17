import { Stack } from 'expo-router';

export default function CreatorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="subscriber/[subscriberId]" />
      <Stack.Screen name="subscriber-step/[stepId]" />
    </Stack>
  );
}
