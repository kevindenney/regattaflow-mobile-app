/**
 * Coach Layout
 *
 * Wraps all coach-related screens with the CoachWorkspaceProvider
 * to ensure consistent data access and caching across the coach experience.
 */

import { Stack } from 'expo-router';
import { CoachWorkspaceProvider } from '@/providers/CoachWorkspaceProvider';

export default function CoachLayout() {
  return (
    <CoachWorkspaceProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="[id]"
          options={{
            title: 'Coach Profile',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="discover"
          options={{
            title: 'Find a Coach',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="discover-enhanced"
          options={{
            title: 'Coach Marketplace',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="book"
          options={{
            title: 'Book a Session',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="my-bookings"
          options={{
            title: 'My Sessions',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="confirmation"
          options={{
            title: 'Session Confirmed',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="pricing"
          options={{
            title: 'Manage Pricing',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="availability"
          options={{
            title: 'Manage Availability',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="complete-session"
          options={{
            title: 'Complete Session',
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="cancel-session"
          options={{
            title: 'Cancel Session',
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="profile-edit"
          options={{
            title: 'Edit Profile',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="messages"
          options={{
            title: 'Messages',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="conversation"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </CoachWorkspaceProvider>
  );
}
