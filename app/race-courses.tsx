/**
 * Race Courses - Standalone stack route
 * Pushes onto the navigation stack with back navigation support.
 * Used when navigating from race card ellipsis menu.
 */

import { Stack } from 'expo-router';
import CoursesScreen from './(tabs)/courses';

export default function RaceCoursesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Race Courses', headerShown: true }} />
      <CoursesScreen />
    </>
  );
}
