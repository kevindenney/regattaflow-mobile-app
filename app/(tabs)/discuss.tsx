/**
 * Legacy Discuss Tab - Redirects to Community tab
 *
 * This route has been merged into the unified Community tab.
 * Keeping this file for backwards compatibility with deep links.
 */

import { Redirect } from 'expo-router';

export default function DiscussRedirect() {
  return <Redirect href="/(tabs)/connect" />;
}
