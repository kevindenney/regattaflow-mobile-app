
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {/* Entry point - redirects based on returning user status */}
            <Stack.Screen name="index" options={{ animation: 'none' }} />

            {/* === RETURNING USER FLOW === */}
            <Stack.Screen name="welcome-back" />

            {/* === NEW STRAVA-INSPIRED FLOW === */}

            {/* Phase 1: Value Showcase (Pre-Signup) */}
            <Stack.Screen name="value" />

            {/* Phase 2: Auth */}
            <Stack.Screen name="auth-choice-new" />

            {/* Phase 3: Quick Profile */}
            <Stack.Screen name="profile" />

            {/* Phase 3b: Trial Activation (after profile, before main app) */}
            <Stack.Screen name="trial-activation" />

            {/* Phase 4: Personalization */}
            <Stack.Screen name="personalize" />

            {/* Phase 5: First Activity */}
            <Stack.Screen name="first-activity" />

        </Stack>
    );
}
