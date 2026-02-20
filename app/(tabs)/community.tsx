/**
 * Legacy Community/Discuss Tab — Redirects to Connect tab
 *
 * This route has been merged into the unified Connect tab.
 * Keeping this file for backwards compatibility with deep links.
 */

import { Redirect } from 'expo-router';

export default function CommunityRedirect() {
  return <Redirect href="/(tabs)/connect" />;
}
