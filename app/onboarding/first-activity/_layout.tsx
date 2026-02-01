import { Stack } from 'expo-router';

export default function FirstActivityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="race-calendar" />
      <Stack.Screen name="add-race" />
    </Stack>
  );
}
