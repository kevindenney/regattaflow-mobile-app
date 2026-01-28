/**
 * Progress Screen - Redirects to Races tab
 *
 * Progress content is now embedded as a segment within the Races tab.
 * This file is kept for Expo Router's Tabs.Screen definition.
 */

import { Redirect } from 'expo-router';

export default function ProgressRedirect() {
  return <Redirect href="/(tabs)/races" />;
}
