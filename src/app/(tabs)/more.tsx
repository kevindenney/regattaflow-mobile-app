import { useEffect } from 'react';
import { router } from 'expo-router';

export default function MorePlaceholder() {
  useEffect(() => {
    // The hamburger menu intercepts navigation, but if this screen is reached
    // directly we bounce the user back to the dashboard.
    router.replace('/(tabs)/dashboard');
  }, []);

  return null;
}
