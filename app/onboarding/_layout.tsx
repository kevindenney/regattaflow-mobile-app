
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {/* Initial flow */}
            <Stack.Screen name="welcome" />
            <Stack.Screen name="features" />
            <Stack.Screen name="auth-choice" />
            <Stack.Screen name="register" />
            <Stack.Screen name="profile-setup" />

            {/* Setup path selection */}
            <Stack.Screen name="setup-choice" />

            {/* Full setup path */}
            <Stack.Screen name="experience" />
            <Stack.Screen name="boat-class" />
            <Stack.Screen name="home-club" />
            <Stack.Screen name="primary-fleet" />
            <Stack.Screen name="find-races" />

            {/* Completion */}
            <Stack.Screen name="complete" />
        </Stack>
    );
}
