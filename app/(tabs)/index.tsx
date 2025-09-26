import { Redirect } from 'expo-router';

export default function TabsIndex() {
  console.log('🔄 TabsIndex: Redirecting to documents');
  console.log('🔍 TabsIndex: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

  // Redirect to documents as the default tab
  return <Redirect href="/(tabs)/documents" />;
}