import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Client Details',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Add Client',
        }}
      />
    </Stack>
  );
}
