/**
 * Connect Tab — Redirects to Discover tab (People segment)
 *
 * Kept for backwards compatibility with deep links.
 * The Connect tab has been replaced by the unified Discover tab.
 */

import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ConnectRedirect() {
  const params = useLocalSearchParams<{ segment?: string }>();

  // Map old connect segments to discover segments
  const segment = params.segment === 'discuss' ? 'forums' : 'people';

  return <Redirect href={`/(tabs)/discover?segment=${segment}`} />;
}
