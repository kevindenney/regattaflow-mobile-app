/**
 * Account Tab Redirect
 *
 * Redirects to the root-level /account modal route.
 * The account screen is now presented as a modal via app/account.tsx.
 */

import { Redirect } from 'expo-router';

export default function AccountRedirect() {
  return <Redirect href="/account" />;
}
