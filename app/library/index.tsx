/**
 * Library → Playbook redirect
 *
 * The Library tab has been replaced by the Playbook. This route exists solely
 * so that existing deep links (`/library`, `/library?...`) continue to resolve.
 */

import React from 'react';
import { Redirect } from 'expo-router';

export default function LibraryRedirect() {
  return <Redirect href="/playbook/resources" />;
}
