// src/app/(tabs)/courses/_layout.tsx
import { Stack } from 'expo-router';

export default function CoursesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main courses list */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Courses',
        }}
      />

      {/* Individual course detail */}
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Course Details',
          presentation: 'card',
        }}
      />

      {/* New course wizard (nested stack) */}
      <Stack.Screen
        name="new"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
