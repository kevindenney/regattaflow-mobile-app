import { Stack } from 'expo-router';

export default function OrganizationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="cohort-dashboard" />
      <Stack.Screen name="members" />
      <Stack.Screen name="access-requests" />
      <Stack.Screen name="cohorts" />
      <Stack.Screen name="competencies" />
      <Stack.Screen name="templates" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="cohort/[cohortId]" />
      <Stack.Screen name="student/[studentId]" />
    </Stack>
  );
}
